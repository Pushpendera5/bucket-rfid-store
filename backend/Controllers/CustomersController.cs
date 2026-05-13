using backend.Data;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly StoreDbContext _db;
    public CustomersController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetAll() => Ok(await _db.Customers.OrderByDescending(x => x.Id).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<Customer>> Create(Customer customer)
    {
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return Ok(customer);
    }
}