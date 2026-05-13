namespace backend.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public required string Sku { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public ProductCategory? Category { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public decimal Price { get; set; }
    public decimal CostPrice { get; set; }
    public int StockQty { get; set; }
    public int ReorderLevel { get; set; }
    public string? Brand { get; set; }
    public string? Size { get; set; }
    public string? TargetGender { get; set; } // Male, Female, Kids
    public string? RfidTagCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<RfidTag> RfidTags { get; set; } = new List<RfidTag>();
}