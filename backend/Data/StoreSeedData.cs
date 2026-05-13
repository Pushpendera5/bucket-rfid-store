using backend.Domain.Entities;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class StoreSeedData
{
    public static async Task SeedAsync(StoreDbContext db)
    {
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Role { 
                    Name = "Admin", 
                    Description = "Administrator with full access",
                    PermissionsJson = "[\"dashboard\",\"inventory\",\"suppliers\",\"pos\",\"po\",\"grn\",\"reports\",\"administration\"]"
                },
                new Role { Name = "Manager", Description = "Store manager with most privileges" },
                new Role { Name = "Staff", Description = "Regular staff member" },
                new Role { Name = "Cashier", Description = "Point of sale cashier" }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Users.AnyAsync())
        {
            var admin = new User
            {
                Username = "admin",
                FullName = "KDPO Administrator",
                Email = "admin@kdpo.local",
                PasswordHash = PasswordHashHelper.Hash("Admin@123"),
                RoleId = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            db.Users.Add(admin);
        }

        if (!await db.Suppliers.AnyAsync())
        {
            db.Suppliers.AddRange(
                new Supplier { Code = "SUP-100", Name = "Global Tech Suppliers", ContactName = "Sales Team", ContactEmail = "sales@globaltech.com", ContactPhone = "+91-9000000001", Address = "Mumbai", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Supplier { Code = "SUP-101", Name = "Fashion Wholesale Co.", ContactName = "Support Desk", ContactEmail = "contact@fashionwh.com", ContactPhone = "+91-9000000002", Address = "Delhi", IsActive = true, CreatedAt = DateTime.UtcNow }
            );

            await db.SaveChangesAsync();
        }

        if (!await db.Customers.AnyAsync())
        {
            db.Customers.Add(new Customer { Code = "CUST-100", Name = "Walk-in Retail", Email = "retail@kdpo.local", Phone = "0000000000", Address = "Store Floor", IsActive = true, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }

        if (!await db.Products.AnyAsync())
        {
            var globalTech = await db.Suppliers.FirstAsync(x => x.Code == "SUP-100");
            var fashionWholesale = await db.Suppliers.FirstAsync(x => x.Code == "SUP-101");

            db.Products.AddRange(
                new Product { Sku = "SKU-1001", Name = "Premium Shirt", Description = "Cotton shirt", CategoryId = 2, SupplierId = fashionWholesale.Id, Price = 45.00m, CostPrice = 25.00m, StockQty = 120, ReorderLevel = 20, RfidTagCode = "E280116000000001", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Product { Sku = "SKU-1002", Name = "Denim Jeans", Description = "Blue denim jeans", CategoryId = 2, SupplierId = fashionWholesale.Id, Price = 89.99m, CostPrice = 55.00m, StockQty = 80, ReorderLevel = 15, RfidTagCode = "E280116000000002", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Product { Sku = "SKU-1003", Name = "Smart Watch", Description = "Bluetooth watch", CategoryId = 1, SupplierId = globalTech.Id, Price = 299.00m, CostPrice = 210.00m, StockQty = 40, ReorderLevel = 8, RfidTagCode = "E280116000000003", IsActive = true, CreatedAt = DateTime.UtcNow }
            );

            await db.SaveChangesAsync();
        }

        if (!await db.RfidTags.AnyAsync())
        {
            db.RfidTags.AddRange(
                new RfidTag { TagCode = "E280116000000001", ProductId = (await db.Products.FirstAsync(x => x.Sku == "SKU-1001")).Id, IsAssigned = true, IsActive = true, LastSeenAt = DateTime.UtcNow, Remarks = "Seed tag" },
                new RfidTag { TagCode = "E280116000000002", ProductId = (await db.Products.FirstAsync(x => x.Sku == "SKU-1002")).Id, IsAssigned = true, IsActive = true, LastSeenAt = DateTime.UtcNow, Remarks = "Seed tag" }
            );

            await db.SaveChangesAsync();
        }
    }
}