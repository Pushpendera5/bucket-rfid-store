namespace backend.DTOs.RfidTags;

public sealed class BulkRfidTagUpdateRequest
{
    public List<BulkRfidTagUpdateItemRequest> Items { get; set; } = new();
}

public sealed class BulkRfidTagUpdateItemRequest
{
    public string? TagCode { get; set; }
    public bool IsAssigned { get; set; } = true;
    public string? Remarks { get; set; }
}

public sealed class RfidTagListItemDto
{
    public int Id { get; set; }
    public string TagCode { get; set; } = string.Empty;
    public bool IsAssigned { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public string? Remarks { get; set; }
}