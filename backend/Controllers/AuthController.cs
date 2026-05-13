using backend.Data;
using backend.DTOs.Auth;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly StoreDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(StoreDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => (x.Username == request.Username || x.Email == request.Username) && x.IsActive);

        if (user is null || !PasswordHashHelper.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = _jwt.CreateToken(user);

        return Ok(new LoginResponse
        {
            Token = token,
            User = new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Email,
                Role = user.Role?.Name,
                Permissions = user.Role?.PermissionsJson
            }
        });
    }
}