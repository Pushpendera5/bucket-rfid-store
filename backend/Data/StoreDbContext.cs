using backend.Domain.Entities;
using backend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class StoreDbContext : DbContext
{
    public StoreDbContext(DbContextOptions<StoreDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<GoodsReceipt> GoodsReceipts => Set<GoodsReceipt>();
    public DbSet<GoodsReceiptItem> GoodsReceiptItems => Set<GoodsReceiptItem>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<RfidTag> RfidTags => Set<RfidTag>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<User>().HasIndex(x => x.Username).IsUnique();
        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<ProductCategory>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(x => x.Sku).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(x => x.RfidTagCode).IsUnique(false);
        modelBuilder.Entity<Supplier>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<Customer>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<PurchaseOrder>().HasIndex(x => x.OrderNumber).IsUnique();
        modelBuilder.Entity<GoodsReceipt>().HasIndex(x => x.ReceiptNumber).IsUnique();
        modelBuilder.Entity<SalesOrder>().HasIndex(x => x.OrderNumber).IsUnique();
        modelBuilder.Entity<InventoryTransaction>().HasIndex(x => x.TransactionNumber).IsUnique();
        modelBuilder.Entity<RfidTag>().HasIndex(x => x.TagCode).IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(x => x.Role)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(x => x.Category)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(x => x.Supplier)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PurchaseOrder>()
            .HasOne(x => x.Supplier)
            .WithMany(x => x.PurchaseOrders)
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PurchaseOrderItem>()
            .HasOne(x => x.PurchaseOrder)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PurchaseOrderItem>()
            .HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GoodsReceipt>()
            .HasOne(x => x.PurchaseOrder)
            .WithMany(x => x.GoodsReceipts)
            .HasForeignKey(x => x.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GoodsReceiptItem>()
            .HasOne(x => x.GoodsReceipt)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.GoodsReceiptId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GoodsReceiptItem>()
            .HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesOrder>()
            .HasOne(x => x.Customer)
            .WithMany(x => x.SalesOrders)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesOrderItem>()
            .HasOne(x => x.SalesOrder)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SalesOrderItem>()
            .HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryTransaction>()
            .HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryTransaction>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RfidTag>()
            .HasOne(x => x.Product)
            .WithMany(x => x.RfidTags)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AuditLog>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.PerformedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PurchaseOrder>().Property(x => x.TotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<PurchaseOrderItem>().Property(x => x.UnitCost).HasPrecision(18, 2);
        modelBuilder.Entity<PurchaseOrderItem>().Property(x => x.LineTotal).HasPrecision(18, 2);
        modelBuilder.Entity<GoodsReceiptItem>().Property(x => x.QuantityAccepted).HasPrecision(18, 2);
        modelBuilder.Entity<SalesOrder>().Property(x => x.Subtotal).HasPrecision(18, 2);
        modelBuilder.Entity<SalesOrder>().Property(x => x.TaxAmount).HasPrecision(18, 2);
        modelBuilder.Entity<SalesOrder>().Property(x => x.TotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<SalesOrderItem>().Property(x => x.UnitPrice).HasPrecision(18, 2);
        modelBuilder.Entity<SalesOrderItem>().Property(x => x.LineTotal).HasPrecision(18, 2);
        modelBuilder.Entity<Product>().Property(x => x.Price).HasPrecision(18, 2);
        modelBuilder.Entity<Product>().Property(x => x.CostPrice).HasPrecision(18, 2);

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Administrator", Description = "Full access" },
            new Role { Id = 2, Name = "Cashier", Description = "POS access" },
            new Role { Id = 3, Name = "Store Manager", Description = "Operational access" }
        );

        modelBuilder.Entity<ProductCategory>().HasData(
            new ProductCategory { Id = 1, Name = "Electronics" },
            new ProductCategory { Id = 2, Name = "Clothing" },
            new ProductCategory { Id = 3, Name = "Accessories" }
        );
    }
}