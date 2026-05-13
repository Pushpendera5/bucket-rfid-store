namespace backend.Domain.Enums;

public enum OrderStatus
{
    Draft = 0,
    Pending = 1,
    Confirmed = 2,
    Received = 3,
    Cancelled = 4,
    Returned = 5
}