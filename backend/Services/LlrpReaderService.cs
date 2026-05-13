using RfidTracker.Infrastructure.Llrp;

namespace backend.Services;

public interface ILlrpReaderService
{
    Task<List<string>> ReadTagsAsync(string readerHost, int readerPort, int timeoutMs = 10000);
    Task<bool> TestConnectionAsync(string readerHost, int readerPort);
}

public sealed class LlrpReaderService : ILlrpReaderService
{
    private readonly ILogger<LlrpReaderService> _logger;

    public LlrpReaderService(ILogger<LlrpReaderService> logger)
    {
        _logger = logger;
    }

    public async Task<List<string>> ReadTagsAsync(string readerHost, int readerPort, int timeoutMs = 10000)
    {
        var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var effectiveTimeout = Math.Max(timeoutMs, 5000);

        using var client = new LlrpClient(_logger);
        using var cts = new CancellationTokenSource(effectiveTimeout + 2000);

        try
        {
            await client.ConnectAsync(readerHost, readerPort, cts.Token);

            client.MessageReceived += (messageType, body) =>
            {
                try
                {
                    switch (messageType)
                    {
                        case LlrpMessageType.RO_ACCESS_REPORT:
                            foreach (var report in LlrpMessageParser.ParseROAccessReport(body))
                            {
                                if (!string.IsNullOrWhiteSpace(report.Epc))
                                {
                                    tags.Add(report.Epc);
                                    _logger.LogInformation("LLRP EPC received: {Epc}", report.Epc);
                                }
                            }
                            break;

                        case LlrpMessageType.KEEPALIVE:
                            _ = client.SendAsync(LlrpMessageBuilder.BuildKeepaliveAck(), cts.Token);
                            break;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to process LLRP message type {MessageType}", messageType);
                }
            };

            await client.SendAndReceiveAsync(
                LlrpMessageBuilder.BuildDeleteROSpec(0),
                LlrpMessageType.DELETE_ROSPEC_RESPONSE,
                cts.Token,
                effectiveTimeout);

            await client.SendAndReceiveAsync(
                LlrpMessageBuilder.BuildDeleteAccessSpec(0),
                LlrpMessageType.DELETE_ACCESSSPEC_RESPONSE,
                cts.Token,
                effectiveTimeout);

            await client.SendAndReceiveAsync(
                LlrpMessageBuilder.BuildSetReaderConfig(resetToFactory: true, keepaliveIntervalMs: 10000),
                LlrpMessageType.SET_READER_CONFIG_RESPONSE,
                cts.Token,
                effectiveTimeout);

            await client.SendAndReceiveAsync(
                LlrpMessageBuilder.BuildAddROSpec(1, new List<int> { 1, 2, 3, 4 }, transmitPowerIndex: 0),
                LlrpMessageType.ADD_ROSPEC_RESPONSE,
                cts.Token,
                effectiveTimeout);

            await client.SendAndReceiveAsync(
                LlrpMessageBuilder.BuildEnableROSpec(1),
                LlrpMessageType.ENABLE_ROSPEC_RESPONSE,
                cts.Token,
                effectiveTimeout);

            await client.SendAndReceiveAsync(
                LlrpMessageBuilder.BuildStartROSpec(1),
                LlrpMessageType.START_ROSPEC_RESPONSE,
                cts.Token,
                effectiveTimeout);

            var readLoopTask = client.ReadLoopAsync(cts.Token);

            try
            {
                await Task.Delay(effectiveTimeout, cts.Token);
            }
            catch (OperationCanceledException)
            {
            }

            cts.Cancel();

            try
            {
                await readLoopTask;
            }
            catch (OperationCanceledException)
            {
            }

            return tags.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during LLRP read from {ReaderHost}:{ReaderPort}", readerHost, readerPort);
            return tags.ToList();
        }
        finally
        {
            try
            {
                await client.DisconnectAsync();
            }
            catch
            {
            }
        }
    }

    public async Task<bool> TestConnectionAsync(string readerHost, int readerPort)
    {
        try
        {
            using var client = new LlrpClient(_logger);
            using var cts = new CancellationTokenSource(5000);
            await client.ConnectAsync(readerHost, readerPort, cts.Token);
            await client.DisconnectAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LLRP connection test failed for {ReaderHost}:{ReaderPort}", readerHost, readerPort);
            return false;
        }
    }
}
