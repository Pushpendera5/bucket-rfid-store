namespace backend.Domain.Entities;

public class RfidTag
{
    public int Id { get; set; }
    public required string TagCode { get; set; }
    public int? ProductId { get; set; }
    public Product? Product { get; set; }
    public bool IsAssigned { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public string? Remarks { get; set; }
}