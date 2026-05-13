using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class GoodsReceipt
{
    public int Id { get; set; }
    public required string ReceiptNumber { get; set; }
    public int PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public DateTime ReceivedDate { get; set; }
    public ReceiptStatus Status { get; set; }
    public string? Notes { get; set; }
    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}