namespace backend.DTOs.Orders;

public class CreatePurchaseOrderDto
{
    public int SupplierId { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public string? Remarks { get; set; }
    public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
}

public class CreatePurchaseOrderItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

public class CreateGoodsReceiptDto
{
    public int PurchaseOrderId { get; set; }
    public string? Notes { get; set; }
    public List<CreateGoodsReceiptItemDto> Items { get; set; } = new();
}

public class CreateGoodsReceiptItemDto
{
    public int ProductId { get; set; }
    public int QuantityReceived { get; set; }
}
