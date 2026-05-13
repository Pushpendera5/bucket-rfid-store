namespace backend.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}