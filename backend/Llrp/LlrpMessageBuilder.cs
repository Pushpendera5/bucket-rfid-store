using System.Buffers.Binary;

namespace RfidTracker.Infrastructure.Llrp;

/// <summary>
/// Builds binary LLRP messages according to EPCglobal LLRP v1.0.1 spec.
/// 
/// LLRP message header format (10 bytes):
///   Bytes 0-1: [Rsvd(3) | Ver(3) | MessageType(10)]
///   Bytes 2-5: MessageLength (uint32, includes header)
///   Bytes 6-9: MessageID (uint32)
/// </summary>
public static class LlrpMessageBuilder
{
    private const byte LLRP_VERSION = 1; // LLRP v1.0.1
    private static uint _messageId = 0;

    /// <summary>
    /// Gets the next sequential message ID.
    /// </summary>
    private static uint NextMessageId() => Interlocked.Increment(ref _messageId);

    /// <summary>
    /// Wraps a body in an LLRP message header.
    /// </summary>
    private static byte[] BuildMessage(ushort messageType, byte[] body)
    {
        uint msgId = NextMessageId();
        uint length = (uint)(10 + body.Length); // header(10) + body

        var msg = new byte[length];

        // Bytes 0-1: [000 | VVV | TTTTTTTTTT]
        // Rsvd=000, Ver=001, Type=messageType
        ushort header = (ushort)((LLRP_VERSION << 10) | (messageType & 0x03FF));
        BinaryPrimitives.WriteUInt16BigEndian(msg.AsSpan(0), header);

        // Bytes 2-5: Length
        BinaryPrimitives.WriteUInt32BigEndian(msg.AsSpan(2), length);

        // Bytes 6-9: MessageID
        BinaryPrimitives.WriteUInt32BigEndian(msg.AsSpan(6), msgId);

        // Body
        if (body.Length > 0)
            body.CopyTo(msg, 10);

        return msg;
    }

    /// <summary>
    /// Builds a TLV parameter: [Type(2) | Length(2) | Value(N)]
    /// Length includes the 4-byte type+length header.
    /// </summary>
    private static byte[] BuildTlvParam(ushort type, byte[] value)
    {
        ushort length = (ushort)(4 + value.Length);
        var param = new byte[length];
        BinaryPrimitives.WriteUInt16BigEndian(param.AsSpan(0), type);
        BinaryPrimitives.WriteUInt16BigEndian(param.AsSpan(2), length);
        if (value.Length > 0)
            value.CopyTo(param, 4);
        return param;
    }

    /// <summary>
    /// Concatenate multiple byte arrays.
    /// </summary>
    private static byte[] Concat(params byte[][] arrays)
    {
        int totalLen = arrays.Sum(a => a.Length);
        var result = new byte[totalLen];
        int offset = 0;
        foreach (var a in arrays)
        {
            a.CopyTo(result, offset);
            offset += a.Length;
        }
        return result;
    }

    // ─── Public Message Builders ─────────────────────────────────────────

    /// <summary>
    /// DELETE_ROSPEC — deletes ROSpec with the given ID (0 = delete all).
    /// </summary>
    public static byte[] BuildDeleteROSpec(uint roSpecId = 0)
    {
        var body = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(body, roSpecId);
        return BuildMessage(LlrpMessageType.DELETE_ROSPEC, body);
    }

    /// <summary>
    /// DELETE_ACCESSSPEC — deletes all AccessSpecs (ID=0 means all).
    /// </summary>
    public static byte[] BuildDeleteAccessSpec(uint accessSpecId = 0)
    {
        var body = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(body, accessSpecId);
        return BuildMessage(LlrpMessageType.DELETE_ACCESSSPEC, body);
    }

    /// <summary>
    /// ADD_ROSPEC — adds a Reader Operation Spec for continuous inventory.
    /// Configures the reader to do inventory on the specified antennas.
    /// </summary>
    public static byte[] BuildAddROSpec(uint roSpecId, List<int> antennaIds, int transmitPowerIndex)
    {
        // ── ROSpecStartTrigger: Immediate (Type=1)
        var startTriggerBody = new byte[1] { 1 }; // TriggerType = 1 (Immediate)
        var startTrigger = BuildTlvParam(LlrpParamType.ROSpecStartTrigger, startTriggerBody);

        // ── ROSpecStopTrigger: Null (Type=0, no auto stop)
        var stopTriggerBody = new byte[5]; // TriggerType=0 + DurationTriggerValue=0
        stopTriggerBody[0] = 0; // Null trigger
        var stopTrigger = BuildTlvParam(LlrpParamType.ROSpecStopTrigger, stopTriggerBody);

        // ── ROBoundarySpec
        var roBoundarySpec = BuildTlvParam(LlrpParamType.ROBoundarySpec,
            Concat(startTrigger, stopTrigger));

        // ── AISpecStopTrigger: Null (run forever)
        var aiStopTriggerBody = new byte[5]; // Type=0 (Null), Duration=0
        var aiStopTrigger = BuildTlvParam(LlrpParamType.AISpecStopTrigger, aiStopTriggerBody);

        // ── InventoryParameterSpec
        var invParamBody = new byte[3];
        BinaryPrimitives.WriteUInt16BigEndian(invParamBody.AsSpan(0), 1); // SpecID = 1
        invParamBody[2] = 1; // ProtocolID = 1 (EPCGlobalClass1Gen2)
        var invParam = BuildTlvParam(LlrpParamType.InventoryParameterSpec, invParamBody);

        // ── AISpec — specify antennas
        // AntennaCount (2 bytes) + AntennaIDs (2 bytes each) + AISpecStopTrigger + InventoryParameterSpec
        var antennaCountBytes = new byte[2];
        BinaryPrimitives.WriteUInt16BigEndian(antennaCountBytes, (ushort)antennaIds.Count);

        var antennaIdBytes = new byte[antennaIds.Count * 2];
        for (int i = 0; i < antennaIds.Count; i++)
        {
            BinaryPrimitives.WriteUInt16BigEndian(antennaIdBytes.AsSpan(i * 2), (ushort)antennaIds[i]);
        }

        var aiSpec = BuildTlvParam(LlrpParamType.AISpec,
            Concat(antennaCountBytes, antennaIdBytes, aiStopTrigger, invParam));

        // ── ROReportSpec — report every tag, immediately
        var reportSpecBody = new byte[3];
        reportSpecBody[0] = 1; // ROReportTrigger = 1 (Upon_N_Tags_Or_End_Of_ROSpec)
        BinaryPrimitives.WriteUInt16BigEndian(reportSpecBody.AsSpan(1), 1); // N = 1 (report each tag)

        // TagReportContentSelector — select what data to include in reports
        // Bit flags: EnableROSpecID | EnableSpecIndex | EnableInventoryParamSpecID |
        //            EnableAntennaID | EnablePeakRSSI | EnableFirstSeenTimestamp |
        //            EnableLastSeenTimestamp | EnableTagSeenCount
        var contentSelectorBody = new byte[2];
        // Bits: [EnableROSpecID(1) | EnableSpecIndex(1) | EnableInvParamSpecID(1) |
        //        EnableAntennaID(1) | EnableChannelIndex(1) | EnablePeakRSSI(1) |
        //        EnableFirstSeenUTC(1) | EnableLastSeenUTC(1) |
        //        EnableTagSeenCount(1) | EnableAccessSpecID(1) | Reserved(6)]
        contentSelectorBody[0] = 0b10011110; // ROSpecID=1, AntennaID=1, PeakRSSI=1, FirstSeen=1, LastSeen=1
        contentSelectorBody[1] = 0b10000000; // TagSeenCount=1
        var contentSelector = BuildTlvParam(LlrpParamType.TagReportContentSelector, contentSelectorBody);

        var roReportSpec = BuildTlvParam(LlrpParamType.ROReportSpec,
            Concat(reportSpecBody, contentSelector));

        // ── ROSpec body
        // ROSpecID (4) + Priority (1) + CurrentState (1) + ROBoundarySpec + AISpec + ROReportSpec
        var roSpecBody = new byte[6];
        BinaryPrimitives.WriteUInt32BigEndian(roSpecBody.AsSpan(0), roSpecId);
        roSpecBody[4] = 0; // Priority = 0
        roSpecBody[5] = ROSpecState.Disabled; // CurrentState = Disabled (will enable separately)

        var roSpec = BuildTlvParam(LlrpParamType.ROSpec,
            Concat(roSpecBody, roBoundarySpec, aiSpec, roReportSpec));

        return BuildMessage(LlrpMessageType.ADD_ROSPEC, roSpec);
    }

    /// <summary>
    /// ENABLE_ROSPEC — enables a previously added ROSpec.
    /// </summary>
    public static byte[] BuildEnableROSpec(uint roSpecId)
    {
        var body = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(body, roSpecId);
        return BuildMessage(LlrpMessageType.ENABLE_ROSPEC, body);
    }

    /// <summary>
    /// STOP_ROSPEC — stops a running ROSpec.
    /// </summary>
    public static byte[] BuildStopROSpec(uint roSpecId)
    {
        var body = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(body, roSpecId);
        return BuildMessage(LlrpMessageType.STOP_ROSPEC, body);
    }

    /// <summary>
    /// DISABLE_ROSPEC — disables an inactive ROSpec.
    /// </summary>
    public static byte[] BuildDisableROSpec(uint roSpecId)
    {
        var body = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(body, roSpecId);
        return BuildMessage(LlrpMessageType.DISABLE_ROSPEC, body);
    }

    /// <summary>
    /// START_ROSPEC — starts an enabled ROSpec.
    /// </summary>
    public static byte[] BuildStartROSpec(uint roSpecId)
    {
        var body = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(body, roSpecId);
        return BuildMessage(LlrpMessageType.START_ROSPEC, body);
    }

    /// <summary>
    /// KEEPALIVE_ACK — acknowledges a keepalive from the reader.
    /// </summary>
    public static byte[] BuildKeepaliveAck()
    {
        return BuildMessage(LlrpMessageType.KEEPALIVE_ACK, Array.Empty<byte>());
    }

    /// <summary>
    /// SET_READER_CONFIG — configures keepalive interval and resets to factory defaults first.
    /// </summary>
    public static byte[] BuildSetReaderConfig(bool resetToFactory, int keepaliveIntervalMs = 10000)
    {
        var bodyParts = new List<byte[]>();

        // ResetToFactoryDefault (1 byte)
        bodyParts.Add(new byte[] { (byte)(resetToFactory ? 1 : 0) });

        // KeepaliveSpec parameter
        var keepaliveBody = new byte[5];
        keepaliveBody[0] = 1; // KeepaliveTriggerType = 1 (Periodic)
        BinaryPrimitives.WriteUInt32BigEndian(keepaliveBody.AsSpan(1), (uint)keepaliveIntervalMs);
        var keepaliveSpec = BuildTlvParam(LlrpParamType.KeepaliveSpec, keepaliveBody);
        bodyParts.Add(keepaliveSpec);

        // ReaderEventNotificationSpec — enable connection events
        var notifState1 = BuildEventNotificationState(0, true); // GPI events upon connection
        var notifState2 = BuildEventNotificationState(2, true); // ROSpec events
        var readerEventNotifSpec = BuildTlvParam(LlrpParamType.ReaderEventNotificationSpec,
            Concat(notifState1, notifState2));
        bodyParts.Add(readerEventNotifSpec);

        return BuildMessage(LlrpMessageType.SET_READER_CONFIG,
            Concat(bodyParts.ToArray()));
    }

    /// <summary>
    /// Builds an EventNotificationState TLV parameter.
    /// </summary>
    private static byte[] BuildEventNotificationState(ushort eventType, bool enabled)
    {
        var body = new byte[3];
        BinaryPrimitives.WriteUInt16BigEndian(body.AsSpan(0), eventType);
        body[2] = (byte)(enabled ? 1 : 0);
        return BuildTlvParam(LlrpParamType.EventNotificationState, body);
    }

    /// <summary>
    /// CLOSE_CONNECTION — graceful disconnect from the reader.
    /// </summary>
    public static byte[] BuildCloseConnection()
    {
        return BuildMessage(LlrpMessageType.CLOSE_CONNECTION, Array.Empty<byte>());
    }
}
