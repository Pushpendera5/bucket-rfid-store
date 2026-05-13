namespace backend.DTOs.Inventory;

public class InventoryUpsertRequest
{
    public int? Id { get; set; }
    public required string Name { get; set; }
    public string Category { get; set; } = null!;
    public int Stock { get; set; }
    public decimal Price { get; set; }
    public string? Brand { get; set; }
    public string? Size { get; set; }
    public string? TargetGender { get; set; }
    public string? Rfid { get; set; }
}
