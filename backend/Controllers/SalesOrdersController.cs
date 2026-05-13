using backend.Data;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/sales-orders")]
public class SalesOrdersController : ControllerBase
{
    private readonly StoreDbContext _db;
    public SalesOrdersController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var list = await _db.SalesOrders.Include(x => x.Customer)
            .OrderByDescending(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.OrderNumber,
                Customer = x.Customer != null ? x.Customer.Name : string.Empty,
                x.OrderDate,
                Status = x.Status.ToString(),
                x.Subtotal,
                x.TaxAmount,
                x.TotalAmount,
                x.PaymentMethod,
                x.Notes
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<SalesOrder>> Create(SalesOrder order)
    {
        _db.SalesOrders.Add(order);
        await _db.SaveChangesAsync();
        return Ok(order);
    }
}