using System.Security.Cryptography;
using System.Text;

namespace backend.Services;

public static class PasswordHashHelper
{
    public static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

    public static bool Verify(string value, string hash) => Hash(value).Equals(hash, StringComparison.OrdinalIgnoreCase);
}