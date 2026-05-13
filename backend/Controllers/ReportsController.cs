using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly StoreDbContext _db;
    public ReportsController(StoreDbContext db) => _db = db;

    [HttpGet("sales")]
    public async Task<ActionResult> GetSalesReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = _db.SalesOrders.AsQueryable();

        if (startDate.HasValue) query = query.Where(x => x.OrderDate >= startDate.Value);
        if (endDate.HasValue) query = query.Where(x => x.OrderDate <= endDate.Value);

        var stats = await query
            .GroupBy(x => x.OrderDate.Date)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(x => x.TotalAmount),
                Orders = g.Count(),
                Items = g.Sum(x => x.Items.Count)
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return Ok(stats);
    }

    [HttpGet("inventory")]
    public async Task<ActionResult> GetInventoryReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        // Category-wise sales in the given period
        var query = _db.SalesOrderItems.Include(x => x.SalesOrder).Include(x => x.Product).ThenInclude(p => p.Category).AsQueryable();

        if (startDate.HasValue) query = query.Where(x => x.SalesOrder.OrderDate >= startDate.Value);
        if (endDate.HasValue) query = query.Where(x => x.SalesOrder.OrderDate <= endDate.Value);

        var stats = await query
            .GroupBy(x => x.Product.Category != null ? x.Product.Category.Name : "Uncategorized")
            .Select(g => new
            {
                Category = g.Key,
                Count = g.Count(),
                Stock = g.Sum(x => x.Quantity),
                Value = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .ToListAsync();

        return Ok(stats);
    }

    [HttpGet("brands")]
    public async Task<ActionResult> GetBrandReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = _db.SalesOrderItems.Include(x => x.SalesOrder).Include(x => x.Product).AsQueryable();

        if (startDate.HasValue) query = query.Where(x => x.SalesOrder.OrderDate >= startDate.Value);
        if (endDate.HasValue) query = query.Where(x => x.SalesOrder.OrderDate <= endDate.Value);

        var stats = await query
            .GroupBy(x => x.Product.Brand ?? "Unknown")
            .Select(g => new
            {
                Brand = g.Key,
                Count = g.Count(),
                Stock = g.Sum(x => x.Quantity),
                Value = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .ToListAsync();
        return Ok(stats);
    }

    [HttpGet("gender")]
    public async Task<ActionResult> GetGenderReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = _db.SalesOrderItems.Include(x => x.SalesOrder).Include(x => x.Product).AsQueryable();

        if (startDate.HasValue) query = query.Where(x => x.SalesOrder.OrderDate >= startDate.Value);
        if (endDate.HasValue) query = query.Where(x => x.SalesOrder.OrderDate <= endDate.Value);

        var stats = await query
            .GroupBy(x => x.Product.TargetGender ?? "Unisex")
            .Select(g => new
            {
                Gender = g.Key,
                Count = g.Count(),
                Stock = g.Sum(x => x.Quantity),
                Value = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .ToListAsync();
        return Ok(stats);
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var salesQuery = _db.SalesOrders.AsQueryable();
        if (startDate.HasValue) salesQuery = salesQuery.Where(x => x.OrderDate >= startDate.Value);
        if (endDate.HasValue) salesQuery = salesQuery.Where(x => x.OrderDate <= endDate.Value);

        var totalSales = await salesQuery.SumAsync(x => (decimal?)x.TotalAmount) ?? 0;
        var totalOrders = await salesQuery.CountAsync();
        
        var totalProducts = await _db.Products.CountAsync();
        var totalStock = await _db.Products.SumAsync(x => x.StockQty);
        var lowStock = await _db.Products.CountAsync(x => x.StockQty < 10);

        return Ok(new
        {
            TotalSales = totalSales,
            TotalOrders = totalOrders,
            TotalProducts = totalProducts,
            TotalStock = totalStock,
            LowStockCount = lowStock
        });
    }

    [HttpGet("purchases")]
    public async Task<ActionResult> GetPurchaseReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = _db.PurchaseOrders.AsQueryable();

        if (startDate.HasValue) query = query.Where(x => x.OrderDate >= startDate.Value);
        if (endDate.HasValue) query = query.Where(x => x.OrderDate <= endDate.Value);

        var stats = await query
            .GroupBy(x => x.OrderDate.Date)
            .Select(g => new
            {
                Date = g.Key,
                Cost = g.Sum(x => x.TotalAmount),
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return Ok(stats);
    }
}
