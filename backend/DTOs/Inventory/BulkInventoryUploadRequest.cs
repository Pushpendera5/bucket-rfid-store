namespace backend.DTOs.Inventory;

public class BulkInventoryUploadRequest
{
    public List<BulkInventoryUploadItemRequest> Items { get; set; } = new();
}

public class BulkInventoryUploadItemRequest
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public int? Stock { get; set; }
    public decimal? Price { get; set; }
    public string? Brand { get; set; }
    public string? Size { get; set; }
    public string? TargetGender { get; set; }
    public string? Rfid { get; set; }
}

public class BulkInventoryUploadResult
{
    public int CreatedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<object> Items { get; set; } = new();
}