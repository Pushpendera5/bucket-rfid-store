namespace RfidTracker.Infrastructure.Llrp;

/// <summary>
/// LLRP (Low Level Reader Protocol) message type identifiers.
/// Per EPCglobal LLRP v1.0.1 specification.
/// </summary>
public static class LlrpMessageType
{
    // ─── Reader-to-Client ─────────────────────────────────────────────
    public const ushort READER_EVENT_NOTIFICATION = 63;
    public const ushort RO_ACCESS_REPORT = 61;
    public const ushort KEEPALIVE = 62;
    public const ushort ERROR_MESSAGE = 100;

    // ─── Client-to-Reader ─────────────────────────────────────────────
    public const ushort SET_READER_CONFIG = 2;
    public const ushort SET_READER_CONFIG_RESPONSE = 12;
    public const ushort GET_READER_CONFIG = 1;
    public const ushort GET_READER_CONFIG_RESPONSE = 11;

    public const ushort ADD_ROSPEC = 20;
    public const ushort ADD_ROSPEC_RESPONSE = 30;
    public const ushort DELETE_ROSPEC = 21;
    public const ushort DELETE_ROSPEC_RESPONSE = 31;
    public const ushort START_ROSPEC = 22;
    public const ushort START_ROSPEC_RESPONSE = 32;
    public const ushort STOP_ROSPEC = 23;
    public const ushort STOP_ROSPEC_RESPONSE = 33;
    public const ushort ENABLE_ROSPEC = 24;
    public const ushort ENABLE_ROSPEC_RESPONSE = 34;
    public const ushort DISABLE_ROSPEC = 25;
    public const ushort DISABLE_ROSPEC_RESPONSE = 35;

    public const ushort CLOSE_CONNECTION = 14;
    public const ushort CLOSE_CONNECTION_RESPONSE = 4;

    public const ushort KEEPALIVE_ACK = 72;

    public const ushort DELETE_ACCESSSPEC = 41;
    public const ushort DELETE_ACCESSSPEC_RESPONSE = 51;
}

/// <summary>
/// LLRP TLV parameter type identifiers.
/// </summary>
public static class LlrpParamType
{
    // TLV parameters (Type >= 128)
    public const ushort ROSpec = 177;
    public const ushort ROBoundarySpec = 178;
    public const ushort ROSpecStartTrigger = 179;
    public const ushort ROSpecStopTrigger = 182;
    public const ushort AISpec = 183;
    public const ushort AISpecStopTrigger = 184;
    public const ushort InventoryParameterSpec = 186;
    public const ushort ROReportSpec = 237;
    public const ushort TagReportContentSelector = 238;
    public const ushort AntennaConfiguration = 222;
    public const ushort RFTransmitter = 224;
    public const ushort ReaderEventNotificationSpec = 244;
    public const ushort EventNotificationState = 245;
    public const ushort KeepaliveSpec = 220;
    public const ushort LLRPStatus = 287;
    public const ushort TagReportData = 240;

    // TV parameters (Type < 128) — encoded differently
    public const byte EPC_96 = 13;
    public const byte EPCData = 241; // TLV
    public const byte AntennaID_TV = 1;
    public const byte PeakRSSI_TV = 6;
    public const byte FirstSeenTimestampUTC_TV = 2;
    public const byte LastSeenTimestampUTC_TV = 3;
    public const byte TagSeenCount_TV = 4;
}

/// <summary>
/// LLRP status codes.
/// </summary>
public static class LlrpStatusCode
{
    public const ushort M_Success = 0;
    public const ushort M_ParameterError = 100;
    public const ushort M_FieldError = 101;
    public const ushort M_DeviceError = 401;
}

/// <summary>
/// ROSpec states.
/// </summary>
public static class ROSpecState
{
    public const byte Disabled = 0;
    public const byte Inactive = 1;
    public const byte Active = 2;
}
