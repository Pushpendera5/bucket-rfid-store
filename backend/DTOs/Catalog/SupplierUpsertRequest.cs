namespace backend.DTOs.Catalog;

public class SupplierUpsertRequest
{
    public int? Id { get; set; }
    public required string Name { get; set; }
    public required string Contact { get; set; }
}
