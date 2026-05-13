using backend.Data;
using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.DTOs.SalesOrders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/sales-orders")]
public class SalesCheckoutController : ControllerBase
{
    private readonly StoreDbContext _db;

    public SalesCheckoutController(StoreDbContext db) => _db = db;

    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutSaleResponseDto>> Checkout([FromBody] CheckoutSaleRequestDto request)
    {
        // Log the raw request
        var requestJson = System.Text.Json.JsonSerializer.Serialize(request, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        Console.WriteLine($"DEBUG: Full Request JSON:\n{requestJson}");
        
        Console.WriteLine($"DEBUG: Checkout request received with {request.Items?.Count ?? 0} items");
        foreach (var item in request.Items ?? new List<CheckoutSaleItemDto>())
        {
            Console.WriteLine($"DEBUG: Item - ProductId={item.ProductId} (type: {item.ProductId.GetType().Name}), Quantity={item.Quantity}");
        }
        
        if (request.Items is null || request.Items.Count == 0)
        {
            return BadRequest("Cart is empty.");
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var customer = await ResolveCustomerAsync(request.CustomerName, request.CustomerMobile);
        var productIds = request.Items.Select(x => x.ProductId).Distinct().ToList();

        var products = await _db.Products
            .Include(x => x.Category)
            .Where(x => productIds.Contains(x.Id))
            .ToListAsync();

        if (products.Count != productIds.Count)
        {
            return BadRequest("One or more products were not found.");
        }

        foreach (var item in request.Items)
        {
            var product = products.First(x => x.Id == item.ProductId);
            if (item.Quantity <= 0)
            {
                return BadRequest("Quantity must be greater than zero.");
            }

            if (product.StockQty < item.Quantity)
            {
                return BadRequest($"Insufficient stock for {product.Name}. Available: {product.StockQty}");
            }
        }

        var subtotal = request.Items.Sum(item =>
        {
            var product = products.First(x => x.Id == item.ProductId);
            return product.Price * item.Quantity;
        });

        var bulkDiscount = request.Items.Count >= 3 ? subtotal * 0.05m : 0m;
        var addlDiscAmt = (request.AdditionalDiscountType?.ToLowerInvariant() == "percent")
            ? (subtotal - bulkDiscount) * (Math.Clamp(request.AdditionalDiscount, 0m, 100m) / 100m)
            : Math.Max(0m, request.AdditionalDiscount);
        var discount = bulkDiscount + addlDiscAmt;
        var taxableAmount = Math.Max(0m, subtotal - discount);
        var taxAmount = taxableAmount * 0.05m;
        var totalAmount = taxableAmount + taxAmount;

        var order = new SalesOrder
        {
            OrderNumber = $"SO-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            CustomerId = customer.Id,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Confirmed,
            Subtotal = subtotal,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            PaymentMethod = request.PaymentMethod,
            Notes = !string.IsNullOrWhiteSpace(request.Notes)
                ? request.Notes
                : $"POS Checkout | Payment: {request.PaymentMethod} | BulkDisc: {bulkDiscount:F2} | AddlDisc({request.AdditionalDiscountType}): {addlDiscAmt:F2}",
        };

        _db.SalesOrders.Add(order);
        await _db.SaveChangesAsync();

        var lineResponses = new List<CheckoutSaleLineDto>();

        foreach (var item in request.Items)
        {
            var product = products.First(x => x.Id == item.ProductId);
            product.StockQty -= item.Quantity;

            var lineTotal = product.Price * item.Quantity;

            _db.SalesOrderItems.Add(new SalesOrderItem
            {
                SalesOrderId = order.Id,
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                LineTotal = lineTotal,
                RfidTagCode = item.RfidTagCode,
            });

            _db.InventoryTransactions.Add(new InventoryTransaction
            {
                TransactionNumber = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{product.Id}",
                ProductId = product.Id,
                TransactionType = InventoryTransactionType.Sale,
                ReferenceType = "SalesOrder",
                ReferenceId = order.OrderNumber,
                Quantity = item.Quantity,
                BalanceAfter = product.StockQty,
                Remarks = $"Sale checkout for {order.OrderNumber}",
                TransactionDate = DateTime.UtcNow,
            });

            lineResponses.Add(new CheckoutSaleLineDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                LineTotal = lineTotal,
                RemainingStock = product.StockQty,
            });
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        var response = new CheckoutSaleResponseDto
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            Customer = customer.Name,
            OrderDate = order.OrderDate,
            Status = order.Status.ToString(),
            Subtotal = subtotal,
            DiscountAmount = discount,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            PaymentMethod = order.PaymentMethod,
            Items = lineResponses,
        };

        return Ok(response);
    }

    private async Task<Customer> ResolveCustomerAsync(string? name, string? mobile)
    {
        var normalizedName = string.IsNullOrWhiteSpace(name) ? "Walk-in Retail" : name.Trim();
        var normalizedMobile = string.IsNullOrWhiteSpace(mobile) ? null : mobile.Trim();

        var existing = await _db.Customers.FirstOrDefaultAsync(x =>
            x.Name == normalizedName ||
            (!string.IsNullOrWhiteSpace(normalizedMobile) && x.Phone == normalizedMobile));

        if (existing is not null)
        {
            if (!string.IsNullOrWhiteSpace(normalizedMobile) && string.IsNullOrWhiteSpace(existing.Phone))
            {
                existing.Phone = normalizedMobile;
                await _db.SaveChangesAsync();
            }

            return existing;
        }

        var code = $"CUST-{DateTime.UtcNow:yyyyMMddHHmmssfff}";

        var customer = new Customer
        {
            Code = code,
            Name = normalizedName,
            Phone = normalizedMobile,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return customer;
    }
}