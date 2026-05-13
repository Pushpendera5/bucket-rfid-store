using backend.Data;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly StoreDbContext _db;
    public AuditLogsController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLog>>> GetAll() => Ok(await _db.AuditLogs.OrderByDescending(x => x.PerformedAt).ToListAsync());
}