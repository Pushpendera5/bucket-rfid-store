using backend.Data;
using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.DTOs.Orders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/purchase-orders")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly StoreDbContext _db;
    public PurchaseOrdersController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var list = await _db.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.Items)
            .OrderByDescending(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.OrderNumber,
                Supplier = x.Supplier != null ? x.Supplier.Name : string.Empty,
                x.OrderDate,
                x.ExpectedDate,
                Status = x.Status.ToString(),
                x.TotalAmount,
                ItemCount = x.Items.Count,
                x.Remarks
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var order = await _db.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order == null) return NotFound();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            Supplier = order.Supplier?.Name,
            order.OrderDate,
            order.ExpectedDate,
            Status = order.Status.ToString(),
            order.TotalAmount,
            Items = order.Items.Select(i => new
            {
                i.ProductId,
                ProductName = i.Product?.Name,
                Brand = i.Product?.Brand,
                Size = i.Product?.Size,
                Gender = i.Product?.TargetGender,
                i.Quantity,
                i.UnitCost,
                i.LineTotal
            })
        });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest("Purchase order must have at least one item.");

        var totalAmount = dto.Items.Sum(i => i.Quantity * i.UnitCost);

        var order = new PurchaseOrder
        {
            OrderNumber = $"PO-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            SupplierId = dto.SupplierId,
            OrderDate = DateTime.UtcNow,
            ExpectedDate = dto.ExpectedDate,
            Status = OrderStatus.Pending,
            TotalAmount = totalAmount,
            Remarks = dto.Remarks
        };

        _db.PurchaseOrders.Add(order);
        await _db.SaveChangesAsync();

        foreach (var item in dto.Items)
        {
            _db.PurchaseOrderItems.Add(new PurchaseOrderItem
            {
                PurchaseOrderId = order.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                LineTotal = item.Quantity * item.UnitCost
            });
        }

        await _db.SaveChangesAsync();
        return Ok(order);
    }
}