using System.Buffers.Binary;

namespace RfidTracker.Infrastructure.Llrp;

/// <summary>
/// Parses incoming LLRP binary messages from the FX9600 reader.
/// Extracts tag EPC, antenna ID, RSSI, and timestamp from RO_ACCESS_REPORT messages.
/// </summary>
public static class LlrpMessageParser
{
    /// <summary>
    /// Parsed LLRP message header.
    /// </summary>
    public record LlrpHeader(ushort MessageType, uint MessageLength, uint MessageId);

    /// <summary>
    /// Parsed tag report data from an RO_ACCESS_REPORT message.
    /// </summary>
    public record TagReport(
        string Epc,
        int AntennaId,
        double? PeakRssi,
        DateTime? FirstSeenUtc,
        DateTime? LastSeenUtc,
        int TagSeenCount
    );

    /// <summary>
    /// Parses the 10-byte LLRP message header.
    /// </summary>
    public static LlrpHeader ParseHeader(ReadOnlySpan<byte> data)
    {
        if (data.Length < 10)
            throw new ArgumentException("LLRP header requires at least 10 bytes");

        ushort word0 = BinaryPrimitives.ReadUInt16BigEndian(data);
        ushort messageType = (ushort)(word0 & 0x03FF);
        uint messageLength = BinaryPrimitives.ReadUInt32BigEndian(data.Slice(2));
        uint messageId = BinaryPrimitives.ReadUInt32BigEndian(data.Slice(6));

        return new LlrpHeader(messageType, messageLength, messageId);
    }

    /// <summary>
    /// Parses an RO_ACCESS_REPORT message body and extracts tag reports.
    /// </summary>
    public static List<TagReport> ParseROAccessReport(ReadOnlySpan<byte> messageBody)
    {
        var reports = new List<TagReport>();
        int offset = 0;

        while (offset < messageBody.Length - 4)
        {
            // Read TLV parameter header
            ushort paramType = BinaryPrimitives.ReadUInt16BigEndian(messageBody.Slice(offset));
            ushort paramLength = BinaryPrimitives.ReadUInt16BigEndian(messageBody.Slice(offset + 2));

            if (paramLength < 4 || offset + paramLength > messageBody.Length)
                break;

            if (paramType == LlrpParamType.TagReportData)
            {
                var tagData = messageBody.Slice(offset + 4, paramLength - 4);
                var report = ParseTagReportData(tagData);
                if (report != null)
                    reports.Add(report);
            }

            offset += paramLength;
        }

        return reports;
    }

    /// <summary>
    /// Parses a single TagReportData parameter to extract EPC, antenna, RSSI, etc.
    /// </summary>
    private static TagReport? ParseTagReportData(ReadOnlySpan<byte> data)
    {
        string epc = string.Empty;
        int antennaId = 0;
        double? peakRssi = null;
        DateTime? firstSeenUtc = null;
        DateTime? lastSeenUtc = null;
        int tagSeenCount = 1;

        int offset = 0;

        while (offset < data.Length)
        {
            // Check if this is a TV parameter (bit 7 of first byte is 1)
            // or TLV parameter (bit 7 is 0)
            if (offset >= data.Length)
                break;

            byte firstByte = data[offset];
            bool isTvParam = (firstByte & 0x80) != 0;

            if (isTvParam)
            {
                // TV parameter: [1-bit(1) | Type(7-bit)] + fixed-length value
                byte tvType = (byte)(firstByte & 0x7F);

                switch (tvType)
                {
                    case LlrpParamType.AntennaID_TV: // AntennaID — 2 bytes value
                        if (offset + 3 <= data.Length)
                            antennaId = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset + 1));
                        offset += 3; // 1 type + 2 value
                        break;

                    case LlrpParamType.PeakRSSI_TV: // PeakRSSI — 1 byte value (signed)
                        if (offset + 2 <= data.Length)
                            peakRssi = (sbyte)data[offset + 1];
                        offset += 2; // 1 type + 1 value
                        break;

                    case LlrpParamType.FirstSeenTimestampUTC_TV: // FirstSeenTimestampUTC — 8 bytes
                        if (offset + 9 <= data.Length)
                        {
                            ulong microseconds = BinaryPrimitives.ReadUInt64BigEndian(data.Slice(offset + 1));
                            if (microseconds > 0)
                                firstSeenUtc = DateTimeOffset.FromUnixTimeMilliseconds((long)(microseconds / 1000)).UtcDateTime;
                        }
                        offset += 9; // 1 type + 8 value
                        break;

                    case LlrpParamType.LastSeenTimestampUTC_TV: // LastSeenTimestampUTC — 8 bytes
                        if (offset + 9 <= data.Length)
                        {
                            ulong microseconds = BinaryPrimitives.ReadUInt64BigEndian(data.Slice(offset + 1));
                            if (microseconds > 0)
                                lastSeenUtc = DateTimeOffset.FromUnixTimeMilliseconds((long)(microseconds / 1000)).UtcDateTime;
                        }
                        offset += 9; // 1 type + 8 value
                        break;

                    case LlrpParamType.TagSeenCount_TV: // TagSeenCount — 2 bytes
                        if (offset + 3 <= data.Length)
                            tagSeenCount = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset + 1));
                        offset += 3; // 1 type + 2 value
                        break;

                    case LlrpParamType.EPC_96: // EPC-96 — 12 bytes EPC data
                        if (offset + 1 + 12 <= data.Length)
                        {
                            var epcBytes = data.Slice(offset + 1, 12);
                            epc = Convert.ToHexString(epcBytes.ToArray());
                        }
                        offset += 13; // 1 type + 12 epc
                        break;

                    default:
                        // Unknown TV param, try to skip safely
                        offset += 1;
                        break;
                }
            }
            else
            {
                // TLV parameter: [Type(16-bit) | Length(16-bit) | Value]
                if (offset + 4 > data.Length)
                    break;

                ushort tlvType = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset));
                ushort tlvLength = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset + 2));

                if (tlvLength < 4 || offset + tlvLength > data.Length)
                    break;

                // EPCData TLV parameter (type 241)
                if (tlvType == 241 && tlvLength > 6)
                {
                    // EPCData: 2 bytes EPC length in bits + EPC bytes
                    ushort epcLenBits = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset + 4));
                    int epcLenBytes = (epcLenBits + 7) / 8;
                    if (offset + 6 + epcLenBytes <= data.Length)
                    {
                        var epcBytes = data.Slice(offset + 6, epcLenBytes);
                        epc = Convert.ToHexString(epcBytes.ToArray());
                    }
                }

                offset += tlvLength;
            }
        }

        if (string.IsNullOrEmpty(epc))
            return null;

        return new TagReport(epc, antennaId, peakRssi, firstSeenUtc, lastSeenUtc, tagSeenCount);
    }

    /// <summary>
    /// Extracts the LLRPStatus code from a response message body.
    /// Returns the status code, or null if not found.
    /// </summary>
    public static ushort? ExtractStatusCode(ReadOnlySpan<byte> messageBody)
    {
        int offset = 0;
        while (offset + 4 <= messageBody.Length)
        {
            ushort paramType = BinaryPrimitives.ReadUInt16BigEndian(messageBody.Slice(offset));
            ushort paramLength = BinaryPrimitives.ReadUInt16BigEndian(messageBody.Slice(offset + 2));

            if (paramLength < 4)
                break;

            if (paramType == LlrpParamType.LLRPStatus && paramLength >= 8)
            {
                // LLRPStatus: StatusCode (2 bytes) + ErrorDescription (TLV string)
                ushort statusCode = BinaryPrimitives.ReadUInt16BigEndian(messageBody.Slice(offset + 4));
                return statusCode;
            }

            offset += paramLength;
        }

        return null;
    }
}
