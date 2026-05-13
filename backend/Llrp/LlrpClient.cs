using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace RfidTracker.Infrastructure.Llrp;

/// <summary>
/// Low-level LLRP TCP client for communicating with a Zebra FX9600 RFID reader.
/// Handles TCP connection, message framing, and async read/write.
/// </summary>
public class LlrpClient : IDisposable
{
    private readonly ILogger _logger;
    private TcpClient? _tcpClient;
    private NetworkStream? _stream;
    private readonly SemaphoreSlim _writeLock = new(1, 1);
    private bool _disposed;

    public bool IsConnected => _tcpClient?.Connected ?? false;

    /// <summary>
    /// Event raised when a complete LLRP message is received from the reader.
    /// </summary>
    public event Action<ushort, byte[]>? MessageReceived;

    public LlrpClient(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Connects to the RFID reader via TCP.
    /// </summary>
    public async Task ConnectAsync(string host, int port, CancellationToken ct = default)
    {
        _tcpClient = new TcpClient();
        _tcpClient.ReceiveTimeout = 30000;
        _tcpClient.SendTimeout = 10000;
        _tcpClient.NoDelay = true;

        _logger.LogInformation("Connecting to LLRP reader at {Host}:{Port}...", host, port);
        await _tcpClient.ConnectAsync(host, port, ct);
        _stream = _tcpClient.GetStream();
        _logger.LogInformation("TCP connection established to {Host}:{Port}", host, port);
    }

    /// <summary>
    /// Sends a raw LLRP message to the reader.
    /// </summary>
    public async Task SendAsync(byte[] message, CancellationToken ct = default)
    {
        if (_stream == null)
            throw new InvalidOperationException("Not connected to reader");

        await _writeLock.WaitAsync(ct);
        try
        {
            await _stream.WriteAsync(message, ct);
            await _stream.FlushAsync(ct);
        }
        finally
        {
            _writeLock.Release();
        }
    }

    /// <summary>
    /// Sends a message and waits for a response with the expected message type.
    /// Returns the response body (without header).
    /// </summary>
    public async Task<(ushort messageType, byte[] body)> SendAndReceiveAsync(
        byte[] message, ushort expectedResponseType, CancellationToken ct = default, int timeoutMs = 5000)
    {
        await SendAsync(message, ct);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(timeoutMs);

        // Read responses until we get the expected type
        while (!cts.Token.IsCancellationRequested)
        {
            var (msgType, body) = await ReadMessageAsync(cts.Token);

            if (msgType == expectedResponseType)
                return (msgType, body);

            // Handle keepalives and other messages that may arrive
            HandleIntermediateMessage(msgType, body);
        }

        throw new TimeoutException($"Timeout waiting for LLRP response type {expectedResponseType}");
    }

    /// <summary>
    /// Continuously reads messages from the reader and raises events.
    /// This should be called in a background loop.
    /// </summary>
    public async Task ReadLoopAsync(CancellationToken ct)
    {
        _logger.LogInformation("Starting LLRP message read loop");

        while (!ct.IsCancellationRequested && IsConnected)
        {
            try
            {
                var (msgType, body) = await ReadMessageAsync(ct);
                MessageReceived?.Invoke(msgType, body);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                _logger.LogInformation("Read loop cancelled");
                break;
            }
            catch (IOException ex)
            {
                _logger.LogError(ex, "IO error reading from LLRP reader — connection may be lost");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in LLRP read loop");
                await Task.Delay(100, ct); // Brief pause before retry
            }
        }

        _logger.LogInformation("LLRP read loop ended");
    }

    /// <summary>
    /// Reads a single complete LLRP message (header + body) from the stream.
    /// </summary>
    private async Task<(ushort messageType, byte[] body)> ReadMessageAsync(CancellationToken ct)
    {
        if (_stream == null)
            throw new InvalidOperationException("Not connected to reader");

        // Read 10-byte header
        var headerBuf = new byte[10];
        await ReadExactAsync(headerBuf, ct);

        var header = LlrpMessageParser.ParseHeader(headerBuf);

        // Read body
        int bodyLength = (int)header.MessageLength - 10;
        byte[] body;

        if (bodyLength > 0)
        {
            body = new byte[bodyLength];
            await ReadExactAsync(body, ct);
        }
        else
        {
            body = Array.Empty<byte>();
        }

        _logger.LogDebug("Received LLRP message: Type={Type}, Length={Length}, ID={Id}",
            header.MessageType, header.MessageLength, header.MessageId);

        return (header.MessageType, body);
    }

    /// <summary>
    /// Reads exactly N bytes from the stream.
    /// </summary>
    private async Task ReadExactAsync(byte[] buffer, CancellationToken ct)
    {
        int totalRead = 0;
        while (totalRead < buffer.Length)
        {
            int bytesRead = await _stream!.ReadAsync(
                buffer.AsMemory(totalRead, buffer.Length - totalRead), ct);

            if (bytesRead == 0)
                throw new IOException("Connection closed by remote host");

            totalRead += bytesRead;
        }
    }

    /// <summary>
    /// Handles intermediate messages (keepalives, notifications) that arrive
    /// while waiting for a specific response.
    /// </summary>
    private void HandleIntermediateMessage(ushort msgType, byte[] body)
    {
        switch (msgType)
        {
            case LlrpMessageType.KEEPALIVE:
                // Send keepalive ACK asynchronously
                _ = Task.Run(async () =>
                {
                    try { await SendAsync(LlrpMessageBuilder.BuildKeepaliveAck()); }
                    catch { /* swallow */ }
                });
                break;

            case LlrpMessageType.READER_EVENT_NOTIFICATION:
                _logger.LogDebug("Received reader event notification during handshake");
                break;

            case LlrpMessageType.RO_ACCESS_REPORT:
                _logger.LogDebug("Received tag report during handshake — forwarding to event handler");
                MessageReceived?.Invoke(msgType, body);
                break;

            default:
                _logger.LogDebug("Received unexpected message type {Type} during handshake", msgType);
                break;
        }
    }

    /// <summary>
    /// Gracefully disconnects from the reader.
    /// </summary>
    public async Task DisconnectAsync()
    {
        if (_stream != null && IsConnected)
        {
            try
            {
                await SendAsync(LlrpMessageBuilder.BuildCloseConnection());
                await Task.Delay(500); // Give reader time to respond
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error sending close connection");
            }
        }

        Dispose();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _stream?.Dispose();
        _tcpClient?.Dispose();
        _writeLock.Dispose();

        _logger.LogInformation("LLRP client disposed");
    }
}
