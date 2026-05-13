namespace backend.Domain.Entities;

public class Role
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? PermissionsJson { get; set; } // Stores array of accessible module keys
    public ICollection<User> Users { get; set; } = new List<User>();
}