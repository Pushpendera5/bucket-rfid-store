namespace backend.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string FullName { get; set; }
    public string? Email { get; set; }
    public required string PasswordHash { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int RoleId { get; set; }
    public Role? Role { get; set; }
}