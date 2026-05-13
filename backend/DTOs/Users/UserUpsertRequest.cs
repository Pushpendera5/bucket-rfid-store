using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Users;

public class UserUpsertRequest
{
    public int? Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }

    public string? Password { get; set; } // Only required for new users

    [Required]
    public int RoleId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ChangePasswordRequest
{
    [Required]
    public string NewPassword { get; set; } = string.Empty;
}
