using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class InventoryTransaction
{
    public int Id { get; set; }
    public required string TransactionNumber { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public InventoryTransactionType TransactionType { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public int Quantity { get; set; }
    public int BalanceAfter { get; set; }
    public string? Remarks { get; set; }
    public DateTime TransactionDate { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
}