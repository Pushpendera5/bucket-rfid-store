namespace backend.Domain.Entities;

public class GoodsReceiptItem
{
    public int Id { get; set; }
    public int GoodsReceiptId { get; set; }
    public GoodsReceipt? GoodsReceipt { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int QuantityReceived { get; set; }
    public int QuantityAccepted { get; set; }
    public int QuantityRejected { get; set; }
    public string? RfidTagCode { get; set; }
}