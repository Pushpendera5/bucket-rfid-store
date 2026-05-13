using backend.Data;
using backend.Domain.Entities;
using backend.DTOs.Inventory;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly StoreDbContext _db;
    public InventoryController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var items = await _db.Products
            .Include(x => x.Category)
            .OrderByDescending(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                sku = x.Sku,
                name = x.Name,
                category = x.Category != null ? x.Category.Name : string.Empty,
                stock = x.StockQty,
                price = x.Price,
                brand = x.Brand,
                size = x.Size,
                gender = x.TargetGender,
                rfid = x.RfidTagCode,
                status = x.StockQty < x.ReorderLevel ? "Low Stock" : "Active"
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] InventoryUpsertRequest request)
    {
        var category = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Name == request.Category)
                      ?? new ProductCategory { Name = request.Category };

        if (category.Id == 0)
        {
            _db.ProductCategories.Add(category);
            await _db.SaveChangesAsync();
        }

        var product = new Product
        {
            Sku = $"ITM-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Name = request.Name,
            CategoryId = category.Id,
            StockQty = request.Stock,
            Price = request.Price,
            CostPrice = request.Price * 0.6m,
            Brand = request.Brand,
            Size = request.Size,
            TargetGender = request.TargetGender,
            RfidTagCode = request.Rfid,
            ReorderLevel = 20,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = product.Id,
            name = product.Name,
            category = request.Category,
            stock = product.StockQty,
            price = product.Price,
            brand = product.Brand,
            size = product.Size,
            gender = product.TargetGender,
            rfid = product.RfidTagCode,
            status = product.StockQty < product.ReorderLevel ? "Low Stock" : "Active"
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> Update(int id, [FromBody] InventoryUpsertRequest request)
    {
        var product = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        if (product is null) return NotFound();

        var category = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Name == request.Category)
                      ?? new ProductCategory { Name = request.Category };

        if (category.Id == 0)
        {
            _db.ProductCategories.Add(category);
            await _db.SaveChangesAsync();
        }

        product.Name = request.Name;
        product.CategoryId = category.Id;
        product.StockQty = request.Stock;
        product.Price = request.Price;
        product.Brand = request.Brand;
        product.Size = request.Size;
        product.TargetGender = request.TargetGender;
        product.RfidTagCode = request.Rfid;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = product.Id,
            name = product.Name,
            category = category.Name,
            stock = product.StockQty,
            price = product.Price,
            brand = product.Brand,
            size = product.Size,
            gender = product.TargetGender,
            rfid = product.RfidTagCode,
            status = product.StockQty < product.ReorderLevel ? "Low Stock" : "Active"
        });
    }

    [HttpPut("{id:int}/restock")]
    public async Task<ActionResult<object>> Restock(int id, [FromBody] RestockRequest request)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be greater than zero.");
        }

        var product = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
        if (product is null)
        {
            return NotFound();
        }

        product.StockQty += request.Quantity;
        product.IsActive = true;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = product.Id,
            name = product.Name,
            category = product.Category != null ? product.Category.Name : string.Empty,
            stock = product.StockQty,
            price = product.Price,
            rfid = product.RfidTagCode,
            status = product.StockQty < product.ReorderLevel ? "Low Stock" : "Active"
        });
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<BulkInventoryUploadResult>> BulkCreate([FromBody] BulkInventoryUploadRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            return BadRequest("No rows were found in the Excel file.");
        }

        var result = new BulkInventoryUploadResult();
        var categoryCache = await _db.ProductCategories.ToDictionaryAsync(x => x.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var row in request.Items)
        {
            var name = row.Name?.Trim();
            var categoryName = row.Category?.Trim();
            var rfid = string.IsNullOrWhiteSpace(row.Rfid) ? null : row.Rfid.Trim();

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(categoryName) || row.Stock is null || row.Price is null)
            {
                result.SkippedCount += 1;
                result.Errors.Add($"Row skipped: Name, Category, Stock aur Price required hain. ({name ?? "Unknown"})");
                continue;
            }

            if (!categoryCache.TryGetValue(categoryName, out var category))
            {
                category = new ProductCategory { Name = categoryName };
                _db.ProductCategories.Add(category);
                await _db.SaveChangesAsync();
                categoryCache[categoryName] = category;
            }

            var product = new Product
            {
                Sku = $"ITM-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{result.CreatedCount + 1}",
                Name = name,
                CategoryId = category.Id,
                StockQty = row.Stock.Value,
                Price = row.Price.Value,
                CostPrice = row.Price.Value * 0.6m,
                Brand = row.Brand,
                Size = row.Size,
                TargetGender = row.TargetGender,
                RfidTagCode = rfid,
                ReorderLevel = 20,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            result.CreatedCount += 1;
            result.Items.Add(new
            {
                id = product.Id,
                name = product.Name,
                category = category.Name,
                stock = product.StockQty,
                price = product.Price,
                brand = product.Brand,
                size = product.Size,
                gender = product.TargetGender,
                rfid = product.RfidTagCode,
                status = product.StockQty < product.ReorderLevel ? "Low Stock" : "Active"
            });
        }

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null) return NotFound();
        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}