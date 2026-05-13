namespace backend.DTOs.SalesOrders;

public sealed class CheckoutSaleRequestDto
{
    public string? CustomerName { get; set; }
    public string? CustomerMobile { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public decimal AdditionalDiscount { get; set; } = 0m;
    public string? AdditionalDiscountType { get; set; } = "flat"; // "flat" | "percent"
    public List<CheckoutSaleItemDto> Items { get; set; } = new();
}

public sealed class CheckoutSaleItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public string? RfidTagCode { get; set; }
}

public sealed class CheckoutSaleResponseDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public List<CheckoutSaleLineDto> Items { get; set; } = new();
}

public sealed class CheckoutSaleLineDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public int RemainingStock { get; set; }
}