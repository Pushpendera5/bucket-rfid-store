using backend.Domain.Enums;

namespace backend.Domain.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public required string EntityName { get; set; }
    public required string EntityId { get; set; }
    public AuditActionType ActionType { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
    public int? PerformedByUserId { get; set; }
    public User? User { get; set; }
    public DateTime PerformedAt { get; set; }
    public string? IpAddress { get; set; }
}