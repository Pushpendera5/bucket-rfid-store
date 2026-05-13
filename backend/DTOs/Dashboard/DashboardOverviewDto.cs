namespace backend.DTOs.Dashboard;

public sealed class DashboardOverviewDto
{
    public DashboardSummaryDto Summary { get; set; } = new();
    public List<DashboardMetricDto> Metrics { get; set; } = new();
    public List<DashboardTrendPointDto> Trends { get; set; } = new();
    public List<DashboardCategoryShareDto> CategoryMix { get; set; } = new();
    public List<DashboardActivityDto> RecentTransactions { get; set; } = new();
    public List<DashboardRfidFeedDto> RfidFeed { get; set; } = new();
    public List<DashboardSalesOrderDto> TodaySalesOrders { get; set; } = new();
    public List<DashboardProductListDto> ActiveProducts { get; set; } = new();
    public List<DashboardProductListDto> LowStockProducts { get; set; } = new();
    public List<DashboardSupplierListDto> ActiveSuppliers { get; set; } = new();
    public List<DashboardCustomerListDto> ActiveCustomers { get; set; } = new();
    public List<DashboardRfidTagListDto> ActiveRfidTags { get; set; } = new();
    public List<DashboardReturnItemDto> RecentReturns { get; set; } = new();
}

public sealed class DashboardReturnItemDto
{
    public string TransactionNumber { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public sealed class DashboardSummaryDto
{
    public decimal TodaySales { get; set; }
    public int TotalOrders { get; set; }
    public int StockItems { get; set; }
    public int LowStockAlerts { get; set; }
    public int ActiveProducts { get; set; }
    public int ActiveSuppliers { get; set; }
    public int ActiveCustomers { get; set; }
    public int ActiveRfids { get; set; }
}

public sealed class DashboardMetricDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public decimal Change { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}

public sealed class DashboardTrendPointDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Sales { get; set; }
    public int Orders { get; set; }
    public int Inventory { get; set; }
}

public sealed class DashboardCategoryShareDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public sealed class DashboardActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Amount { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public sealed class DashboardRfidFeedDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Qty { get; set; }
    public string Status { get; set; } = string.Empty;
}

public sealed class DashboardSalesOrderDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string TimeLabel { get; set; } = string.Empty;
    public int ItemCount { get; set; }
}

public sealed class DashboardProductListDto
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int StockQty { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
}

public sealed class DashboardSupplierListDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
}

public sealed class DashboardCustomerListDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public sealed class DashboardRfidTagListDto
{
    public int Id { get; set; }
    public string TagCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public bool IsAssigned { get; set; }
    public string Status { get; set; } = string.Empty;
}