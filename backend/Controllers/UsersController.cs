using backend.Data;
using backend.Domain.Entities;
using backend.Services;
using backend.DTOs.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[Authorize(Roles = "Administrator")]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly StoreDbContext _db;
    public UsersController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var users = await _db.Users.Include(x => x.Role)
            .OrderByDescending(x => x.Id)
            .Select(x => new 
            { 
                x.Id, 
                x.Username, 
                x.FullName, 
                x.Email, 
                x.IsActive, 
                RoleId = x.RoleId,
                RoleName = x.Role!.Name, 
                x.CreatedAt, 
                x.LastLoginAt 
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(int id)
    {
        var user = await _db.Users.Include(x => x.Role)
            .Select(x => new 
            { 
                x.Id, 
                x.Username, 
                x.FullName, 
                x.Email, 
                x.IsActive, 
                RoleId = x.RoleId,
                RoleName = x.Role!.Name, 
                x.CreatedAt, 
                x.LastLoginAt 
            })
            .FirstOrDefaultAsync(x => x.Id == id);
            
        if (user == null) return NotFound("User not found");
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create(UserUpsertRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return BadRequest("Username already exists");

        if (string.IsNullOrEmpty(request.Password))
            return BadRequest("Password is required for new users");

        var user = new User
        {
            Username = request.Username,
            FullName = request.FullName,
            Email = request.Email,
            RoleId = request.RoleId,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            PasswordHash = PasswordHashHelper.Hash(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UserUpsertRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (await _db.Users.AnyAsync(u => u.Username == request.Username && u.Id != id))
            return BadRequest("Username already exists");

        user.Username = request.Username;
        user.FullName = request.FullName;
        user.Email = request.Email;
        user.RoleId = request.RoleId;
        user.IsActive = request.IsActive;

        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = PasswordHashHelper.Hash(request.Password);
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { isActive = user.IsActive });
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.PasswordHash = PasswordHashHelper.Hash(request.NewPassword);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Password updated successfully" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Check if user has related audit logs or other data
        // For safety, we could just deactivate, but user asked for delete
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}