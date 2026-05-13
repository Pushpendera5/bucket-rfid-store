using backend.Data;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/inventory-transactions")]
public class InventoryTransactionsController : ControllerBase
{
    private readonly StoreDbContext _db;
    public InventoryTransactionsController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var list = await _db.InventoryTransactions.Include(x => x.Product)
            .Include(x => x.User)
            .OrderByDescending(x => x.TransactionDate)
            .Select(x => new
            {
                x.Id,
                x.TransactionNumber,
                Product = x.Product != null ? x.Product.Name : string.Empty,
                x.TransactionType,
                x.ReferenceType,
                x.ReferenceId,
                x.Quantity,
                x.BalanceAfter,
                x.Remarks,
                x.TransactionDate,
                User = x.User != null ? x.User.FullName : string.Empty
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<InventoryTransaction>> Create(InventoryTransaction transaction)
    {
        _db.InventoryTransactions.Add(transaction);
        await _db.SaveChangesAsync();
        return Ok(transaction);
    }
}