using backend.Data;
using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.DTOs.Orders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/goods-receipts")]
public class GoodsReceiptsController : ControllerBase
{
    private readonly StoreDbContext _db;
    public GoodsReceiptsController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var list = await _db.GoodsReceipts.Include(x => x.PurchaseOrder)
            .OrderByDescending(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.ReceiptNumber,
                PurchaseOrderNumber = x.PurchaseOrder != null ? x.PurchaseOrder.OrderNumber : string.Empty,
                x.ReceivedDate,
                Status = x.Status.ToString(),
                x.Notes
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateGoodsReceiptDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest("Receipt must have at least one item.");

        var po = await _db.PurchaseOrders.FindAsync(dto.PurchaseOrderId);
        if (po == null) return NotFound("Purchase Order not found.");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var receipt = new GoodsReceipt
            {
                ReceiptNumber = $"GRN-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                PurchaseOrderId = dto.PurchaseOrderId,
                ReceivedDate = DateTime.UtcNow,
                Status = ReceiptStatus.Closed,
                Notes = dto.Notes
            };

            _db.GoodsReceipts.Add(receipt);
            await _db.SaveChangesAsync();

            foreach (var item in dto.Items)
            {
                var product = await _db.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQty += item.QuantityReceived;

                    _db.GoodsReceiptItems.Add(new GoodsReceiptItem
                    {
                        GoodsReceiptId = receipt.Id,
                        ProductId = product.Id,
                        QuantityReceived = item.QuantityReceived
                    });

                    _db.InventoryTransactions.Add(new InventoryTransaction
                    {
                        TransactionNumber = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{product.Id}",
                        ProductId = product.Id,
                        TransactionType = InventoryTransactionType.StockIn,
                        ReferenceType = "GoodsReceipt",
                        ReferenceId = receipt.ReceiptNumber,
                        Quantity = item.QuantityReceived,
                        BalanceAfter = product.StockQty,
                        Remarks = $"Goods received for PO {po.OrderNumber}",
                        TransactionDate = DateTime.UtcNow,
                    });
                }
            }

            po.Status = OrderStatus.Received;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(receipt);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Error processing receipt: {ex.Message}");
        }
    }
}