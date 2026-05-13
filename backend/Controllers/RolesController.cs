using backend.Data;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Authorize(Roles = "Administrator")]
[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly StoreDbContext _db;
    public RolesController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll() 
    {
        return Ok(await _db.Roles
            .OrderBy(x => x.Name)
            .Select(x => new 
            { 
                x.Id, 
                x.Name, 
                x.Description, 
                x.PermissionsJson,
                UserCount = x.Users.Count 
            })
            .ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<Role>> Create(Role role)
    {
        _db.Roles.Add(role);
        await _db.SaveChangesAsync();
        return Ok(role);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Role role)
    {
        if (id != role.Id) return BadRequest();
        
        var existing = await _db.Roles.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = role.Name;
        existing.Description = role.Description;
        existing.PermissionsJson = role.PermissionsJson;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var role = await _db.Roles.Include(r => r.Users).FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return NotFound();
        
        if (role.Users.Any())
            return BadRequest("Cannot delete role with assigned users");

        _db.Roles.Remove(role);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}