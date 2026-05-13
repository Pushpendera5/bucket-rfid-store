namespace backend.DTOs.RfidReader;

public sealed class Fx9600ScanIngestRequest
{
    public string? TagCode { get; set; }
    public string? ReaderName { get; set; }
    public int? AntennaPort { get; set; }
    public int? Rssi { get; set; }
    public int? SeenCount { get; set; }
    public DateTimeOffset? ScannedAt { get; set; }
}

public sealed class Fx9600ScanResolvedProductDto
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string? Rfid { get; set; }
}

public sealed class Fx9600ScanResponseDto
{
    public string TagCode { get; set; } = string.Empty;
    public string NormalizedTagCode { get; set; } = string.Empty;
    public bool Resolved { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ReaderName { get; set; }
    public int? AntennaPort { get; set; }
    public int? Rssi { get; set; }
    public int? SeenCount { get; set; }
    public DateTime ScannedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public Fx9600ScanResolvedProductDto? Product { get; set; }
}

public sealed class Fx9600RecentScanDto
{
    public string Id { get; set; } = string.Empty;
    public string TagCode { get; set; } = string.Empty;
    public string? ReaderName { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSku { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool Resolved { get; set; }
    public int? AntennaPort { get; set; }
    public int? Rssi { get; set; }
    public DateTime ScannedAt { get; set; }
}