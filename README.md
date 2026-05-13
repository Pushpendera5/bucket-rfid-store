# Bucket RFID Store — Retail Inventory Management System

A full-stack retail ERP system that uses **RFID technology** for real-time inventory tracking, point-of-sale billing, purchase management, and sales analytics.

---

## What This System Does

This system is built for a **retail store** that tags every physical product with an RFID tag. When a customer brings an item to the counter, the RFID reader automatically detects it and adds it to the bill — no manual barcode scanning needed. The system manages everything from receiving new stock to processing customer returns, all tracked in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Redux Toolkit, Recharts |
| **Backend** | ASP.NET Core (.NET 10), Entity Framework Core, JWT Auth |
| **Database** | Microsoft SQL Server |
| **RFID Protocol** | LLRP (Low Level Reader Protocol) — Zebra FX9600 reader |
| **API Docs** | Swagger / OpenAPI |

---

## Project Structure

```
bucket_rfid_1/
├── backend/                        # ASP.NET Core Web API
│   ├── Controllers/                # API route handlers
│   │   ├── AuthController.cs       # Login, JWT token issue
│   │   ├── DashboardController.cs  # Live KPIs and chart data
│   │   ├── InventoryController.cs  # Products CRUD + bulk Excel upload
│   │   ├── SalesCheckoutController.cs  # POS billing endpoint
│   │   ├── SalesOrdersController.cs    # Order history and management
│   │   ├── SalesReturnController.cs    # Customer return processing
│   │   ├── GoodsReceiptsController.cs  # GRN — incoming stock verification
│   │   ├── PurchaseOrdersController.cs # Supplier purchase orders
│   │   ├── RfidTagsController.cs   # RFID tag assignment to products
│   │   ├── RfidReaderController.cs # Live LLRP reader control (start/stop)
│   │   ├── ReportsController.cs    # Sales, inventory, brand reports
│   │   ├── UsersController.cs      # Staff user management
│   │   ├── RolesController.cs      # Role-based access control
│   │   ├── SuppliersController.cs  # Vendor/supplier master
│   │   ├── CustomersController.cs  # Customer master
│   │   ├── ProductsController.cs   # Product catalog
│   │   ├── InventoryTransactionsController.cs
│   │   └── AuditLogsController.cs  # Activity audit trail
│   ├── Domain/
│   │   ├── Entities/               # Database models (Product, Order, RfidTag, etc.)
│   │   └── Enums/                  # Status enums (OrderStatus, TransactionType, etc.)
│   ├── DTOs/                       # Request/Response data transfer objects
│   ├── Data/
│   │   ├── StoreDbContext.cs       # EF Core database context
│   │   └── StoreSeedData.cs        # Default seed data (admin user, categories)
│   ├── Services/
│   │   ├── LlrpReaderService.cs    # Background RFID reader service
│   │   ├── JwtTokenService.cs      # JWT generation and validation
│   │   └── PasswordHashHelper.cs   # BCrypt password hashing
│   ├── Llrp/                       # LLRP protocol implementation
│   │   ├── LlrpClient.cs           # TCP connection to RFID reader hardware
│   │   ├── LlrpMessageBuilder.cs   # Build LLRP command messages
│   │   ├── LlrpMessageParser.cs    # Parse RFID reader responses
│   │   └── LlrpConstants.cs        # Protocol constants
│   ├── appsettings.json            # Config (DB, JWT, RFID — not in repo)
│   └── Program.cs                  # App startup, DI, middleware
│
├── frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Authentication screen
│   │   │   ├── Dashboard.jsx       # Live KPIs, charts, RFID feed, returns widget
│   │   │   ├── POS.jsx             # Point-of-sale billing terminal
│   │   │   ├── Inventory.jsx       # Product catalog + RFID tag management
│   │   │   ├── GRN.jsx             # Goods Receipt Note — verify incoming stock
│   │   │   ├── PurchaseOrder.jsx   # Raise and track purchase requests
│   │   │   ├── Reports.jsx         # Sales, inventory, brand, gender analytics
│   │   │   ├── Users.jsx           # Staff account management
│   │   │   ├── Roles.jsx           # Permission roles configuration
│   │   │   └── Vendor.jsx          # Supplier/vendor directory
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Navigation sidebar (collapsible)
│   │   │   └── Topbar.jsx          # Top header with user info
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # Shared layout wrapper for all pages
│   │   ├── redux/
│   │   │   ├── store.js            # Redux store
│   │   │   └── slices/             # Auth, UI state slices
│   │   └── services/
│   │       └── api.js              # Axios API client (all endpoint calls)
│   ├── tailwind.config.js          # Teal brand color system
│   └── vite.config.js
│
├── restart_servers.bat             # One-click start: backend + frontend together
└── .gitignore
```

---

## Key Features

### Point of Sale (POS)
- RFID auto-detect adds items to cart instantly
- Cash tendered / change calculation
- Hold bill & recall for multiple customers
- Print invoice with RFID tag info
- Session stats (items sold, revenue, orders)

### Inventory Management
- Full product catalog with categories, brand, size, gender
- Bulk product upload via Excel file
- RFID tag assignment per product (per-piece tracking)
- Restock / manual quantity adjustment
- Low stock alerts

### Goods Receipt Note (GRN)
- Scan incoming shipment against a purchase order
- RFID scan verification
- Auto-update stock on confirmation

### Purchase Orders
- Raise purchase requests to suppliers
- Track status: Pending → Approved → Received

### Sales Returns
- Look up original order by order number
- Select items and quantity to return
- Stock automatically restored, audit trail created

### Reports & Analytics
- Sales trend (daily, weekly)
- Revenue by brand, category, gender
- Inventory value breakdown
- Excel export for all report types

### Dashboard
- Live KPI cards: Today's Sales, Total Orders, Stock Items, Low Stock
- Real-time RFID feed panel
- Recent Returns widget
- Auto-refresh every 15 seconds

### User & Role Management
- JWT-based authentication
- Role-based access control (Admin, Manager, Cashier, etc.)
- Audit log for all critical actions

---

## How to Run Locally

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- SQL Server (local or Express edition)

### 1. Configure Backend

Create `backend/appsettings.json` (excluded from repo):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=KDPOStoreDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Issuer": "KDPOStoreApi",
    "Audience": "KDPOStoreFrontend",
    "Key": "YOUR_SECRET_KEY_MIN_32_CHARS"
  },
  "RfidReader": {
    "Fx9600": {
      "Host": "192.168.x.x",
      "Port": "5085",
      "ReaderName": "FX9600"
    }
  }
}
```

### 2. Run Database Migrations

```bash
cd backend
dotnet ef database update
```

### 3. Start Both Servers

**Option A — One command (Windows):**
```bash
.\restart_servers.bat
```

**Option B — Manual:**
```bash
# Terminal 1 — Backend
cd backend
dotnet run

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### 4. Open in Browser

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger Docs | http://localhost:5000/swagger |

**Default login:** `admin` / `admin123` (seeded automatically)

---

## RFID Hardware

This system communicates with **Zebra FX9600** (or any LLRP-compatible reader) over TCP using the [LLRP protocol](https://www.gs1.org/sites/default/files/docs/epc/llrp_1_0_1-standard-20070813.pdf).

- Reader IP and port are configured in `appsettings.json`
- The backend connects on startup and streams tag reads
- Tag reads are matched against the product catalog in real time

If no RFID hardware is connected, all other features (manual POS, inventory, reports) continue to work normally.

---

## API Overview

All endpoints are under `http://localhost:5000/api/`

| Route | Description |
|---|---|
| `POST /api/auth/login` | Login and get JWT |
| `GET /api/dashboard/overview` | All dashboard data |
| `GET/POST /api/products` | Product catalog |
| `POST /api/inventory/bulk` | Excel bulk upload |
| `POST /api/sales-checkout` | Process a sale |
| `GET /api/sales-orders` | Order history |
| `POST /api/sales-returns/process` | Process return |
| `GET/POST /api/purchase-orders` | Purchase orders |
| `POST /api/goods-receipts` | Confirm GRN |
| `GET /api/reports/sales` | Sales report |
| `GET /api/rfid-tags` | RFID tag list |
| `GET /api/rfid-reader/status` | Live reader status |

Full interactive docs available at `/swagger` when the backend is running.

---

## License

Private project — all rights reserved.
