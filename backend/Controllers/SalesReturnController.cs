using backend.Data;
using backend.Domain.Entities;
using backend.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/sales-returns")]
public class SalesReturnController : ControllerBase
{
    private readonly StoreDbContext _db;
    public SalesReturnController(StoreDbContext db) => _db = db;

    [HttpGet("lookup/{orderNumber}")]
    public async Task<ActionResult> GetByOrderNumber(string orderNumber)
    {
        var order = await _db.SalesOrders
            .Include(x => x.Customer)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.OrderNumber == orderNumber);

        if (order == null) return NotFound("Order not found.");

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.OrderDate,
            CustomerName = order.Customer?.Name,
            order.TotalAmount,
            Items = order.Items.Select(i => new
            {
                i.Id,
                i.ProductId,
                ProductName = i.Product?.Name,
                i.Quantity,
                i.UnitPrice,
                i.LineTotal,
                i.RfidTagCode
            })
        });
    }

    [HttpPost("process")]
    public async Task<ActionResult> ProcessReturn([FromBody] ReturnRequestDto request)
    {
        if (request.Items == null || !request.Items.Any()) return BadRequest("No items selected for return.");

        var order = await _db.SalesOrders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.OrderNumber == request.OrderNumber);

        if (order == null) return NotFound("Order not found.");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            foreach (var item in request.Items)
            {
                var orderItem = order.Items.FirstOrDefault(x => x.ProductId == item.ProductId);
                if (orderItem == null) continue;

                var product = await _db.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQty += item.Quantity; // Return to stock
                    
                    _db.InventoryTransactions.Add(new InventoryTransaction
                    {
                        TransactionNumber = $"RET-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{product.Id}",
                        ProductId = product.Id,
                        TransactionType = InventoryTransactionType.Return,
                        ReferenceType = "SalesReturn",
                        ReferenceId = order.OrderNumber,
                        Quantity = item.Quantity,
                        BalanceAfter = product.StockQty,
                        Remarks = $"Sale return for {order.OrderNumber}. Reason: {request.Reason}",
                        TransactionDate = DateTime.UtcNow,
                    });
                }
            }

            order.Status = OrderStatus.Returned;
            order.Notes = (order.Notes ?? "") + $"\n[Return processed on {DateTime.UtcNow}: {request.Reason}]";
            
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { Message = "Return processed successfully." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Internal error: {ex.Message}");
        }
    }
}

public class ReturnRequestDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public List<ReturnItemDto> Items { get; set; } = new();
}

public class ReturnItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
