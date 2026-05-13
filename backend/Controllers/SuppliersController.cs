using backend.Data;
using backend.Domain.Entities;
using backend.DTOs.Catalog;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly StoreDbContext _db;
    public SuppliersController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var suppliers = await _db.Suppliers
            .OrderByDescending(x => x.Id)
            .Select(s => new
            {
                s.Id,
                s.Code,
                s.Name,
                s.ContactName,
                s.ContactEmail,
                s.ContactPhone,
                s.Address,
                s.IsActive,
                s.CreatedAt,
                ProductCount = s.Products.Count(p => p.IsActive),
                ActivePoCount = _db.PurchaseOrders.Count(po => po.SupplierId == s.Id && (po.Status.ToString() == "Pending" || po.Status.ToString() == "Sent"))
            })
            .ToListAsync();
        
        return Ok(suppliers);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Supplier>> GetById(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        return supplier is null ? NotFound() : Ok(supplier);
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] SupplierUpsertRequest request)
    {
        var supplier = new Supplier
        {
            Code = $"SUP-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Name = request.Name,
            ContactName = request.Contact,
            ContactEmail = request.Contact.Contains('@') ? request.Contact : null,
            ContactPhone = request.Contact.Contains('@') ? null : request.Contact,
            Address = null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();
        return Ok(new { id = supplier.Id, name = supplier.Name, contact = request.Contact });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Supplier supplier)
    {
        if (id != supplier.Id) return BadRequest();
        _db.Entry(supplier).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier is null) return NotFound();
        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}