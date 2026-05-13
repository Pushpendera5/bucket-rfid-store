namespace backend.Domain.Enums;

public enum InventoryTransactionType
{
    StockIn = 0,
    StockOut = 1,
    Adjustment = 2,
    Transfer = 3,
    Sale = 4,
    Return = 5
}