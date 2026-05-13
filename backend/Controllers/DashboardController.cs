using backend.Data;
using backend.DTOs.Dashboard;
using backend.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly StoreDbContext _db;

    public DashboardController(StoreDbContext db) => _db = db;

    [HttpGet("overview")]
    public async Task<ActionResult<DashboardOverviewDto>> GetOverview()
    {
        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var startOfWeek = now.Date.AddDays(-6);

        var productsQuery = _db.Products.Include(x => x.Category).AsNoTracking();
        var ordersQuery = _db.SalesOrders.Include(x => x.Customer).AsNoTracking();
        var purchaseQuery = _db.PurchaseOrders.Include(x => x.Supplier).AsNoTracking();
        var inventoryQuery = _db.InventoryTransactions.Include(x => x.Product).AsNoTracking();
        var rfidQuery = _db.RfidTags.Include(x => x.Product).AsNoTracking();

        var summary = new DashboardSummaryDto
        {
            TodaySales = await ordersQuery.Where(x => x.OrderDate >= startOfToday).SumAsync(x => (decimal?)x.TotalAmount) ?? 0m,
            TotalOrders = await ordersQuery.CountAsync(),
            StockItems = await productsQuery.SumAsync(x => (int?)x.StockQty) ?? 0,
            LowStockAlerts = await productsQuery.CountAsync(x => x.StockQty <= x.ReorderLevel),
            ActiveProducts = await productsQuery.CountAsync(x => x.IsActive),
            ActiveSuppliers = await _db.Suppliers.AsNoTracking().CountAsync(x => x.IsActive),
            ActiveCustomers = await _db.Customers.AsNoTracking().CountAsync(x => x.IsActive),
            ActiveRfids = await rfidQuery.CountAsync(x => x.IsActive),
        };

        var weeklySales = await ordersQuery
            .Where(x => x.OrderDate >= startOfWeek)
            .GroupBy(x => x.OrderDate.Date)
            .Select(g => new { Date = g.Key, Sales = g.Sum(x => x.TotalAmount), Orders = g.Count() })
            .ToListAsync();

        var inventoryCount = await productsQuery.SumAsync(x => (int?)x.StockQty) ?? 0;

        var trends = Enumerable.Range(0, 7)
            .Select(offset => startOfWeek.AddDays(offset))
            .Select(day =>
            {
                var match = weeklySales.FirstOrDefault(x => x.Date.Date == day.Date);
                return new DashboardTrendPointDto
                {
                    Name = day.ToString("ddd"),
                    Sales = match?.Sales ?? 0m,
                    Orders = match?.Orders ?? 0,
                    Inventory = inventoryCount
                };
            })
            .ToList();

        var categoryMix = await productsQuery
            .GroupBy(x => x.Category != null ? x.Category.Name : "Uncategorized")
            .Select(g => new DashboardCategoryShareDto
            {
                Name = g.Key,
                Value = g.Sum(x => x.StockQty)
            })
            .OrderByDescending(x => x.Value)
            .ToListAsync();

        var recentSales = await ordersQuery
            .OrderByDescending(x => x.OrderDate)
            .Take(5)
            .Select(x => new DashboardActivityDto
            {
                Id = x.OrderNumber,
                Type = "Sale",
                Amount = $"₹{x.TotalAmount:N0}",
                Status = x.Status.ToString(),
                Timestamp = x.OrderDate,
                Time = x.OrderDate >= DateTime.UtcNow.AddMinutes(-5)
                    ? "Just now"
                    : x.OrderDate >= DateTime.UtcNow.AddHours(-1)
                        ? $"{Math.Max(1, (int)(DateTime.UtcNow - x.OrderDate).TotalMinutes)} mins ago"
                        : x.OrderDate.ToLocalTime().ToString("g")
            })
            .ToListAsync();

        var recentPurchases = await purchaseQuery
            .OrderByDescending(x => x.OrderDate)
            .Take(5)
            .Select(x => new DashboardActivityDto
            {
                Id = x.OrderNumber,
                Type = "Purchase",
                Amount = $"₹{x.TotalAmount:N0}",
                Status = x.Status.ToString(),
                Timestamp = x.OrderDate,
                Time = x.OrderDate >= DateTime.UtcNow.AddMinutes(-5)
                    ? "Just now"
                    : x.OrderDate >= DateTime.UtcNow.AddHours(-1)
                        ? $"{Math.Max(1, (int)(DateTime.UtcNow - x.OrderDate).TotalMinutes)} mins ago"
                        : x.OrderDate.ToLocalTime().ToString("g")
            })
            .ToListAsync();

        var recentInventory = await inventoryQuery
            .OrderByDescending(x => x.TransactionDate)
            .Take(5)
            .Select(x => new DashboardActivityDto
            {
                Id = x.TransactionNumber,
                Type = x.TransactionType.ToString(),
                Amount = $"{x.Quantity:N0} pcs",
                Status = x.ReferenceType ?? "Inventory",
                Timestamp = x.TransactionDate,
                Time = x.TransactionDate >= DateTime.UtcNow.AddMinutes(-5)
                    ? "Just now"
                    : x.TransactionDate >= DateTime.UtcNow.AddHours(-1)
                        ? $"{Math.Max(1, (int)(DateTime.UtcNow - x.TransactionDate).TotalMinutes)} mins ago"
                        : x.TransactionDate.ToLocalTime().ToString("g")
            })
            .ToListAsync();

        var recentTransactions = recentSales
            .Concat(recentPurchases)
            .Concat(recentInventory)
            .OrderByDescending(x => x.Timestamp)
            .Take(10)
            .ToList();

        var todaySalesOrders = await ordersQuery
            .Where(x => x.OrderDate >= startOfToday)
            .OrderByDescending(x => x.OrderDate)
            .Select(x => new DashboardSalesOrderDto
            {
                OrderNumber = x.OrderNumber,
                CustomerName = x.Customer != null ? x.Customer.Name : "Walk-in Retail",
                TotalAmount = x.TotalAmount,
                Status = x.Status.ToString(),
                OrderDate = x.OrderDate,
                TimeLabel = x.OrderDate >= DateTime.UtcNow.AddMinutes(-5)
                    ? "Just now"
                    : x.OrderDate >= DateTime.UtcNow.AddHours(-1)
                        ? $"{Math.Max(1, (int)(DateTime.UtcNow - x.OrderDate).TotalMinutes)} mins ago"
                        : x.OrderDate.ToLocalTime().ToString("g"),
                ItemCount = x.Items.Count,
            })
            .ToListAsync();

        var allActiveProducts = await productsQuery
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.Id)
            .Select(x => new DashboardProductListDto
            {
                Id = x.Id,
                Sku = x.Sku,
                Name = x.Name,
                Category = x.Category != null ? x.Category.Name : string.Empty,
                StockQty = x.StockQty,
                Price = x.Price,
                Status = x.StockQty <= x.ReorderLevel ? "Low Stock" : "Active",
            })
            .ToListAsync();

        var lowStockProducts = allActiveProducts
            .Where(x => x.Status == "Low Stock")
            .ToList();

        var activeSuppliers = await _db.Suppliers
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.Id)
            .Select(x => new DashboardSupplierListDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                ContactName = x.ContactName ?? string.Empty,
                ContactPhone = x.ContactPhone ?? string.Empty,
                ContactEmail = x.ContactEmail ?? string.Empty,
            })
            .ToListAsync();

        var activeCustomers = await _db.Customers
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.Id)
            .Select(x => new DashboardCustomerListDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Phone = x.Phone ?? string.Empty,
                Email = x.Email ?? string.Empty,
            })
            .ToListAsync();

        var activeRfidTags = await rfidQuery
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.Id)
            .Select(x => new DashboardRfidTagListDto
            {
                Id = x.Id,
                TagCode = x.TagCode,
                ProductName = x.Product != null ? x.Product.Name : string.Empty,
                ProductSku = x.Product != null ? x.Product.Sku : string.Empty,
                IsAssigned = x.IsAssigned,
                Status = x.IsAssigned ? "Assigned" : "Unassigned",
            })
            .ToListAsync();

        var recentReturns = await inventoryQuery
            .Where(x => x.TransactionType == InventoryTransactionType.Return)
            .OrderByDescending(x => x.TransactionDate)
            .Take(10)
            .Select(x => new DashboardReturnItemDto
            {
                TransactionNumber = x.TransactionNumber,
                OrderNumber = x.ReferenceId ?? string.Empty,
                ProductName = x.Product != null ? x.Product.Name : "Unknown",
                ProductSku = x.Product != null ? x.Product.Sku : string.Empty,
                Quantity = x.Quantity,
                Reason = x.Remarks ?? string.Empty,
                Timestamp = x.TransactionDate,
                Time = x.TransactionDate >= DateTime.UtcNow.AddMinutes(-5)
                    ? "Just now"
                    : x.TransactionDate >= DateTime.UtcNow.AddHours(-1)
                        ? $"{Math.Max(1, (int)(DateTime.UtcNow - x.TransactionDate).TotalMinutes)} mins ago"
                        : x.TransactionDate.ToLocalTime().ToString("g")
            })
            .ToListAsync();

        var rfidFeed = await rfidQuery
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.LastSeenAt ?? DateTime.UtcNow.AddYears(-1))
            .Take(8)
            .Select(x => new DashboardRfidFeedDto
            {
                Id = x.TagCode,
                Name = x.Product != null ? x.Product.Name : x.TagCode,
                Qty = x.Product != null ? Math.Max(1, x.Product.StockQty) : 1,
                Status = x.IsAssigned ? "Scanned" : "Unassigned"
            })
            .ToListAsync();

        var overview = new DashboardOverviewDto
        {
            Summary = summary,
            Metrics = new List<DashboardMetricDto>
            {
                new() { Key = "sales", Title = "Today's Sales", Value = $"₹{summary.TodaySales:N0}", Change = summary.TodaySales > 0 ? 12 : 0, Color = "bg-brand-600", Icon = "DollarSign" },
                new() { Key = "orders", Title = "Total Orders", Value = summary.TotalOrders.ToString(), Change = summary.TotalOrders > 0 ? 8 : 0, Color = "bg-brand-600", Icon = "ShoppingCart" },
                new() { Key = "stock", Title = "Stock Items", Value = summary.StockItems.ToString("N0"), Change = summary.StockItems > 0 ? -3 : 0, Color = "bg-emerald-600", Icon = "Package" },
                new() { Key = "low-stock", Title = "Low Stock Alerts", Value = summary.LowStockAlerts.ToString(), Change = summary.LowStockAlerts > 0 ? -5 : 0, Color = "bg-orange-600", Icon = "AlertCircle" },
            },
            Trends = trends,
            CategoryMix = categoryMix,
            RecentTransactions = recentTransactions,
            RfidFeed = rfidFeed,
            TodaySalesOrders = todaySalesOrders,
            ActiveProducts = allActiveProducts,
            LowStockProducts = lowStockProducts,
            ActiveSuppliers = activeSuppliers,
            ActiveCustomers = activeCustomers,
            ActiveRfidTags = activeRfidTags,
            RecentReturns = recentReturns,
        };

        return Ok(overview);
    }
}