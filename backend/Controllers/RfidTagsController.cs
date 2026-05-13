using backend.Data;
using backend.Domain.Entities;
using backend.DTOs.RfidTags;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/rfid-tags")]
public class RfidTagsController : ControllerBase
{
    private readonly StoreDbContext _db;
    private static string NormalizeTagCode(string value)
    {
        return new string(value
            .Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant)
            .ToArray());
    }
    public RfidTagsController(StoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var list = await _db.RfidTags.Include(x => x.Product)
            .OrderByDescending(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.TagCode,
                Product = x.Product != null ? x.Product.Name : string.Empty,
                x.IsAssigned,
                x.IsActive,
                x.LastSeenAt,
                x.Remarks
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("lookup/{tagCode}")]
    public async Task<ActionResult<object>> Lookup(string tagCode)
    {
        var normalizedTagCode = NormalizeTagCode(tagCode ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalizedTagCode))
        {
            return BadRequest("Tag code is required.");
        }

        var tag = (await _db.RfidTags
            .Include(x => x.Product)
            .ThenInclude(x => x!.Category)
            .AsNoTracking()
            .ToListAsync())
            .FirstOrDefault(x => NormalizeTagCode(x.TagCode) == normalizedTagCode);

        if (tag is null)
        {
            return NotFound("RFID tag not found.");
        }

        return Ok(new
        {
            tag.Id,
            tag.TagCode,
            tag.IsAssigned,
            tag.IsActive,
            product = tag.Product is null ? null : new
            {
                id = tag.Product.Id,
                sku = tag.Product.Sku,
                name = tag.Product.Name,
                category = tag.Product.Category != null ? tag.Product.Category.Name : string.Empty,
                price = tag.Product.Price,
                stock = tag.Product.StockQty,
                rfid = tag.Product.RfidTagCode,
            }
        });
    }

    [HttpGet("product/{productId:int}")]
    public async Task<ActionResult<IEnumerable<RfidTagListItemDto>>> GetByProduct(int productId)
    {
        var list = await _db.RfidTags
            .Where(x => x.ProductId == productId)
            .OrderBy(x => x.Id)
            .Select(x => new RfidTagListItemDto
            {
                Id = x.Id,
                TagCode = x.TagCode,
                IsAssigned = x.IsAssigned,
                IsActive = x.IsActive,
                LastSeenAt = x.LastSeenAt,
                Remarks = x.Remarks,
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("product/{productId:int}/bulk")]
    public async Task<ActionResult<object>> BulkUpsert(int productId, [FromBody] BulkRfidTagUpdateRequest request)
    {
        var product = await _db.Products.FindAsync(productId);
        if (product is null)
        {
            return NotFound("Product not found.");
        }

        var incomingCodes = request.Items
            .Select((item, index) => new { item, index })
            .Select(x => new
            {
                TagCode = string.IsNullOrWhiteSpace(x.item.TagCode) ? null : x.item.TagCode.Trim(),
                x.item.IsAssigned,
                Remarks = x.item.Remarks,
                Index = x.index,
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.TagCode))
            .ToList();

        if (!incomingCodes.Any())
        {
            return BadRequest("At least one RFID tag code is required.");
        }

        var existingTags = await _db.RfidTags.Where(x => x.ProductId == productId).ToListAsync();
        var updated = 0;
        var created = 0;

        for (var i = 0; i < incomingCodes.Count; i++)
        {
            var incoming = incomingCodes[i];
            var existing = existingTags.ElementAtOrDefault(i);

            if (existing is null)
            {
                _db.RfidTags.Add(new RfidTag
                {
                    TagCode = incoming.TagCode!,
                    ProductId = productId,
                    IsAssigned = incoming.IsAssigned,
                    IsActive = true,
                    LastSeenAt = DateTime.UtcNow,
                    Remarks = incoming.Remarks,
                });
                created += 1;
                continue;
            }

            existing.TagCode = incoming.TagCode!;
            existing.IsAssigned = incoming.IsAssigned;
            existing.IsActive = true;
            existing.LastSeenAt = DateTime.UtcNow;
            existing.Remarks = incoming.Remarks;
            updated += 1;
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            productId,
            created,
            updated,
            total = incomingCodes.Count,
        });
    }

    [HttpPost]
    public async Task<ActionResult<RfidTag>> Create(RfidTag tag)
    {
        _db.RfidTags.Add(tag);
        await _db.SaveChangesAsync();
        return Ok(tag);
    }
}