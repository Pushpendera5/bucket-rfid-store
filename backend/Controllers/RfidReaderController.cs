using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Data;
using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.DTOs.RfidReader;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/rfid-reader/fx9600")]
public class RfidReaderController : ControllerBase
{
    private readonly StoreDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILlrpReaderService _llrpReaderService;
    private static readonly Regex EpcRegex = new(@"\b[0-9A-Fa-f]{24}\b", RegexOptions.Compiled);

    public RfidReaderController(StoreDbContext db, IConfiguration configuration, ILlrpReaderService llrpReaderService)
    {
        _db = db;
        _configuration = configuration;
        _llrpReaderService = llrpReaderService;
    }

    private static string NormalizeTagCode(string value)
    {
        return new string(value
            .Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant)
            .ToArray());
    }

    [HttpPost("scans")]
    public async Task<ActionResult<Fx9600ScanResponseDto>> IngestScan([FromBody] Fx9600ScanIngestRequest request)
    {
        try
        {
            return Ok(await ProcessScanAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("read-llrp")]
    public async Task<ActionResult<object>> ReadLlrp([FromQuery] int? timeoutMs = null, [FromQuery] string? readerHost = null, [FromQuery] int? readerPortOverride = null)
    {
        var resolvedReaderHost = string.IsNullOrWhiteSpace(readerHost)
            ? (_configuration["RfidReader:Fx9600:Host"] ?? "192.168.1.100")
            : readerHost.Trim();

        var readerPortStr = readerPortOverride?.ToString() ?? _configuration["RfidReader:Fx9600:Port"] ?? "5085";

        if (!int.TryParse(readerPortStr, out var readerPort))
        {
            readerPort = 5085;
        }

        var effectiveTimeout = Math.Clamp(timeoutMs ?? 10000, 1000, 30000);

        try
        {
            var tags = await _llrpReaderService.ReadTagsAsync(resolvedReaderHost, readerPort, effectiveTimeout);

            if (tags.Count == 0)
            {
                return Ok(new { message = "No tags found during read", tags = new List<string>() });
            }

            var results = new List<Fx9600ScanResponseDto>();
            foreach (var epc in tags)
            {
                var result = await ProcessScanAsync(new Fx9600ScanIngestRequest
                {
                    TagCode = epc,
                    ReaderName = "FX9600-LLRP",
                    ScannedAt = DateTimeOffset.UtcNow,
                });
                results.Add(result);
            }

            return Ok(new { message = $"Read {tags.Count} tag(s) via LLRP", tags = tags, scans = results });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"LLRP read failed: {ex.Message}" });
        }
    }

    private async Task<Fx9600ScanResponseDto> ProcessScanAsync(Fx9600ScanIngestRequest request)
    {
        var normalizedTagCode = NormalizeTagCode(request.TagCode ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalizedTagCode))
        {
            throw new InvalidOperationException("Tag code is required.");
        }

        var scannedAt = request.ScannedAt?.UtcDateTime ?? DateTime.UtcNow;
        var readerName = string.IsNullOrWhiteSpace(request.ReaderName) ? "FX9600" : request.ReaderName.Trim();

        var tag = (await _db.RfidTags
            .Include(x => x.Product)
            .ThenInclude(x => x!.Category)
            .ToListAsync())
            .FirstOrDefault(x => NormalizeTagCode(x.TagCode) == normalizedTagCode);

        if (tag is not null)
        {
            tag.IsActive = true;
            tag.LastSeenAt = scannedAt;

            _db.AuditLogs.Add(new AuditLog
            {
                EntityName = "RfidScan",
                EntityId = tag.TagCode,
                ActionType = AuditActionType.Update,
                AfterData = JsonSerializer.Serialize(BuildAuditPayload(tag, readerName, request.AntennaPort, request.Rssi, request.SeenCount, scannedAt, true)),
                PerformedAt = scannedAt,
            });

            await _db.SaveChangesAsync();

            return new Fx9600ScanResponseDto
            {
                TagCode = tag.TagCode,
                NormalizedTagCode = normalizedTagCode,
                Resolved = true,
                Status = "Matched",
                ReaderName = readerName,
                AntennaPort = request.AntennaPort,
                Rssi = request.Rssi,
                SeenCount = request.SeenCount,
                ScannedAt = scannedAt,
                LastSeenAt = tag.LastSeenAt,
                Product = tag.Product is null ? null : new Fx9600ScanResolvedProductDto
                {
                    Id = tag.Product.Id,
                    Sku = tag.Product.Sku,
                    Name = tag.Product.Name,
                    Category = tag.Product.Category != null ? tag.Product.Category.Name : string.Empty,
                    Price = tag.Product.Price,
                    Stock = tag.Product.StockQty,
                    Rfid = tag.Product.RfidTagCode,
                }
            };
        }

        tag = new RfidTag
        {
            TagCode = request.TagCode!.Trim(),
            ProductId = null,
            IsAssigned = false,
            IsActive = true,
            LastSeenAt = scannedAt,
            Remarks = $"Auto-created from FX9600 scan ({readerName})",
        };

        _db.RfidTags.Add(tag);

        _db.AuditLogs.Add(new AuditLog
        {
            EntityName = "RfidScan",
            EntityId = tag.TagCode,
            ActionType = AuditActionType.Create,
            AfterData = JsonSerializer.Serialize(BuildAuditPayload(tag, readerName, request.AntennaPort, request.Rssi, request.SeenCount, scannedAt, false, normalizedTagCode)),
            PerformedAt = scannedAt,
        });

        await _db.SaveChangesAsync();

        return new Fx9600ScanResponseDto
        {
            TagCode = tag.TagCode,
            NormalizedTagCode = normalizedTagCode,
            Resolved = false,
            Status = "Unassigned tag registered",
            ReaderName = readerName,
            AntennaPort = request.AntennaPort,
            Rssi = request.Rssi,
            SeenCount = request.SeenCount,
            ScannedAt = scannedAt,
            LastSeenAt = tag.LastSeenAt,
        };
    }

    [HttpGet("scans/recent")]
    public async Task<ActionResult<IEnumerable<Fx9600RecentScanDto>>> GetRecentScans([FromQuery] int limit = 10)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var scans = await _db.AuditLogs
            .Where(x => x.EntityName == "RfidScan")
            .OrderByDescending(x => x.PerformedAt)
            .Take(safeLimit)
            .ToListAsync();

        var result = scans.Select(log =>
        {
            var payload = TryDeserializePayload(log.AfterData);
            return new Fx9600RecentScanDto
            {
                Id = log.Id.ToString(),
                TagCode = payload?.TagCode ?? log.EntityId,
                ReaderName = payload?.ReaderName,
                ProductName = payload?.ProductName,
                ProductSku = payload?.ProductSku,
                Status = payload?.Resolved == true ? "Matched" : (string.IsNullOrWhiteSpace(payload?.ProductName) ? "Unassigned" : "Unknown tag"),
                Resolved = payload?.Resolved == true,
                AntennaPort = payload?.AntennaPort,
                Rssi = payload?.Rssi,
                ScannedAt = log.PerformedAt,
            };
        }).ToList();

        return Ok(result);
    }

    private static Fx9600ScanAuditPayload BuildAuditPayload(
        RfidTag? tag,
        string readerName,
        int? antennaPort,
        int? rssi,
        int? seenCount,
        DateTime scannedAt,
        bool resolved,
        string? overrideTagCode = null)
    {
        return new Fx9600ScanAuditPayload
        {
            TagCode = overrideTagCode ?? tag?.TagCode ?? string.Empty,
            ReaderName = readerName,
            ProductId = tag?.ProductId,
            ProductName = tag?.Product?.Name,
            ProductSku = tag?.Product?.Sku,
            Resolved = resolved,
            AntennaPort = antennaPort,
            Rssi = rssi,
            SeenCount = seenCount,
            ScannedAt = scannedAt,
        };
    }

    private static Fx9600ScanAuditPayload? TryDeserializePayload(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<Fx9600ScanAuditPayload>(json);
        }
        catch
        {
            return null;
        }
    }

    private static string? ExtractEpc(string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return null;
        }

        var match = EpcRegex.Match(payload);
        return match.Success ? match.Value.ToUpperInvariant() : null;
    }

    private sealed class Fx9600ScanAuditPayload
    {
        public string TagCode { get; set; } = string.Empty;
        public string? ReaderName { get; set; }
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductSku { get; set; }
        public bool Resolved { get; set; }
        public int? AntennaPort { get; set; }
        public int? Rssi { get; set; }
        public int? SeenCount { get; set; }
        public DateTime ScannedAt { get; set; }
    }
}
