namespace backend.DTOs.Auth;

public class LoginResponse
{
    public required string Token { get; set; }
    public required object User { get; set; }
}