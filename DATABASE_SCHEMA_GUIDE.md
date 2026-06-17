# 📊 DATABASE SCHEMA DOCUMENTATION

**Database:** PostgreSQL via Supabase  
**Version:** 1.0  
**Type:** E-Commerce Computer Sales Platform

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Tables Summary](#tables-summary)
3. [Detailed Table Structure](#detailed-table-structure)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Triggers](#triggers)
7. [Key Features](#key-features)

---

## 🎯 OVERVIEW

Database ini dirancang untuk mendukung platform e-commerce penjualan komputer dengan fitur:
- ✅ User authentication dengan username + email
- ✅ Password reset via OTP
- ✅ Product catalog dengan kategori & spesifikasi
- ✅ Shopping cart & wishlist
- ✅ Order management dengan payment verification
- ✅ Voucher & discount system
- ✅ Admin settings untuk payment methods

---

## 📊 TABLES SUMMARY

| No | Tabel | Tujuan | Records |
|----|----|--------|---------|
| 1 | `users` | User accounts (customer + admin) | Customers & staff |
| 2 | `password_resets` | OTP untuk forgot password | Temporary records |
| 3 | `categories` | Kategori produk | ~10-20 items |
| 4 | `products` | Katalog produk | ~100-500 items |
| 5 | `vouchers` | Diskon codes | ~50-100 items |
| 6 | `orders` | Pesanan pelanggan | Growing list |
| 7 | `order_details` | Line items per order | Growing list |
| 8 | `wishlist` | Favorit list user | Growing list |
| 9 | `payments` | Payment records | Growing list |
| 10 | `payment_settings` | Bank/e-wallet config | 4-5 methods |
| 11 | `admin_settings` | App settings | ~5-10 items |

---

## 🔍 DETAILED TABLE STRUCTURE

### 1️⃣ USERS

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,           -- Unique user ID
    name VARCHAR(150) NOT NULL,      -- Full name
    username VARCHAR(100) UNIQUE,    -- Unique username (for login)
    email VARCHAR(150) UNIQUE,       -- Unique email
    password VARCHAR(255),           -- Hashed password (bcryptjs)
    phone VARCHAR(20),               -- Phone number
    address TEXT,                    -- Delivery address
    role VARCHAR(20) DEFAULT 'customer',  -- 'customer' or 'admin'
    created_at TIMESTAMP,            -- Account creation
    updated_at TIMESTAMP             -- Last modified
);
```

**Indexes:**
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

**Key Points:**
- ✅ Login dapat menggunakan username OR email
- ✅ Password di-hash menggunakan bcryptjs (10 salt rounds)
- ✅ Role: 'customer' (default) atau 'admin'

**Sample Data:**
```
ID | Name          | Username | Email              | Role
1  | John Doe      | johndoe  | john@example.com   | customer
2  | Admin User    | admin    | admin@ecomputer.id | admin
```

---

### 2️⃣ PASSWORD_RESETS

```sql
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),     -- User yang reset
    email VARCHAR(150) NOT NULL,          -- Email konfirmasi
    otp_code VARCHAR(6) NOT NULL,         -- 6-digit OTP
    expires_at TIMESTAMP NOT NULL,        -- Expiry time (10 menit)
    is_used BOOLEAN DEFAULT FALSE,        -- One-time use flag
    created_at TIMESTAMP                  -- Created time
);
```

**Indexes:**
```sql
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_email ON password_resets(email);
```

**Workflow:**
1. User submit email → Server generate 6-digit OTP
2. OTP simpan ke tabel dengan expiry 10 menit
3. User input OTP → Server verify & hapus record

**Sample Data:**
```
ID | User_ID | Email        | OTP_Code | Expires_At      | Is_Used
1  | 1       | john@ex.com  | 123456   | 2026-06-17 15:30| FALSE
```

---

### 3️⃣ CATEGORIES

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,          -- Kategori name
    slug VARCHAR(100) UNIQUE,            -- URL-friendly name
    description VARCHAR(500),            -- Deskripsi kategori
    created_at TIMESTAMP                 -- Created time
);
```

**Sample Data:**
```
ID | Name         | Slug            | Description
1  | Laptop       | laptop          | Laptop gaming & office
2  | Desktop PC   | desktop-pc      | PC rakitan custom
3  | GPU/VGA      | gpu-vga         | Graphic cards
4  | RAM          | ram             | Memory modules
```

---

### 4️⃣ PRODUCTS

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id),  -- Kategori
    name VARCHAR(200) NOT NULL,                 -- Nama produk
    brand VARCHAR(100) NOT NULL,                -- Brand/Merk
    price DECIMAL(18,2) NOT NULL,               -- Harga (Rp)
    stock INT DEFAULT 0,                        -- Stok tersedia
    description TEXT,                           -- Deskripsi lengkap
    image_urls JSONB DEFAULT '[]'::jsonb,       -- Array gambar
    
    -- Spesifikasi teknis
    spec_ram VARCHAR(50),                       -- RAM: "16GB DDR5"
    spec_storage VARCHAR(50),                   -- SSD: "1TB NVMe"
    spec_cpu VARCHAR(100),                      -- Processor
    spec_gpu VARCHAR(100),                      -- Graphics card
    weight DECIMAL(10,2),                       -- Berat (Kg)
    
    -- Flags untuk promosi
    is_best_seller BOOLEAN DEFAULT FALSE,       -- Best seller?
    is_new BOOLEAN DEFAULT TRUE,                -- Produk baru?
    discount_percent INT DEFAULT 0,             -- Diskon (%)
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_products_category_id ON products(category_id);
```

**Sample Data:**
```
ID | Category | Name                    | Brand  | Price    | Stock | Discount
1  | 1        | ASUS ROG Gaming Laptop   | ASUS   | 15000000 | 5     | 10%
2  | 4        | Corsair Vengeance 16GB   | Corsair| 1200000  | 20    | 0%
```

**JSONB image_urls Format:**
```json
[
  "/uploads/product-1-main.jpg",
  "/uploads/product-1-side.jpg"
]
```

---

### 5️⃣ VOUCHERS

```sql
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,           -- Voucher code
    discount_amount DECIMAL(18,2) DEFAULT 0,    -- Diskon fixed (Rp)
    discount_percent INT DEFAULT 0,             -- Diskon percent (%)
    min_purchase DECIMAL(18,2) DEFAULT 0,       -- Minimum order amount
    start_date TIMESTAMP NOT NULL,              -- Tanggal mulai
    end_date TIMESTAMP NOT NULL,                -- Tanggal berakhir
    is_active BOOLEAN DEFAULT TRUE,             -- Active flag
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Sample Data:**
```
ID | Code      | Discount | Min_Purchase | Start_Date      | End_Date        | Active
1  | SUMMER20  | 0        | 20%          | 2026-06-01      | 2026-06-30      | TRUE
2  | NEWUSER50 | 50000    | 0 (none)     | 2026-01-01      | 2026-12-31      | TRUE
```

---

### 6️⃣ ORDERS

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),           -- Customer
    order_date TIMESTAMP DEFAULT NOW(),         -- Order time
    status VARCHAR(50) DEFAULT 'Menunggu Pembayaran',  -- Order status
    
    -- Pricing
    total_amount DECIMAL(18,2) NOT NULL,        -- Harga sebelum diskon
    discount_amount DECIMAL(18,2) DEFAULT 0,    -- Total diskon (Rp)
    net_amount DECIMAL(18,2) NOT NULL,          -- Harga final (bayar)
    
    -- Details
    voucher_code VARCHAR(50),                   -- Applied voucher
    address TEXT NOT NULL,                      -- Delivery address
    phone VARCHAR(20) NOT NULL,                 -- Contact phone
    payment_method VARCHAR(50) NOT NULL,        -- "Transfer Bank", "QRIS", etc
    shipping_method VARCHAR(50) DEFAULT 'Pengiriman',  -- "Pengiriman" or "Ambil Sendiri"
    
    -- Expiry untuk unpaid orders
    expired_at TIMESTAMP NOT NULL,              -- Payment deadline
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Order Status Values:**
```
1. Menunggu Pembayaran      (Waiting for payment)
2. Menunggu Verifikasi      (Waiting for payment verification)
3. Diproses                 (Processing/packing)
4. Dikirim                  (Shipped)
5. Selesai                  (Completed)
6. Dibatalkan               (Cancelled)
```

**Indexes:**
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

**Sample Data:**
```
ID | User | Date       | Status           | Net_Amount | Payment_Method | Expires_At
1  | 1    | 2026-06-17 | Menunggu Pembayaran | 13500000   | Transfer Bank  | 2026-06-18
2  | 2    | 2026-06-16 | Selesai          | 5400000    | QRIS           | 2026-06-17
```

---

### 7️⃣ ORDER_DETAILS

```sql
CREATE TABLE order_details (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),         -- Which order
    product_id INT REFERENCES products(id),     -- Which product
    quantity INT NOT NULL,                      -- Jumlah unit
    price DECIMAL(18,2) NOT NULL,               -- Harga per unit saat order
    created_at TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_order_details_order_id ON order_details(order_id);
```

**Sample Data:**
```
ID | Order_ID | Product_ID | Quantity | Price
1  | 1        | 1          | 1        | 15000000
2  | 1        | 4          | 2        | 1200000
```

---

### 8️⃣ WISHLIST

```sql
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),           -- Customer
    product_id INT REFERENCES products(id),     -- Favorited product
    created_at TIMESTAMP,
    UNIQUE(user_id, product_id)                 -- One wishlist per product per user
);
```

**Indexes:**
```sql
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
```

**Sample Data:**
```
ID | User_ID | Product_ID | Added_At
1  | 1       | 5          | 2026-06-15
2  | 1       | 12         | 2026-06-14
```

---

### 9️⃣ PAYMENTS

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),         -- Which order
    payment_date TIMESTAMP DEFAULT NOW(),       -- Payment time
    amount DECIMAL(18,2) NOT NULL,              -- Amount paid (Rp)
    proof_image TEXT NOT NULL,                  -- Path to receipt image
    status VARCHAR(50) DEFAULT 'Menunggu Verifikasi',  -- Payment status
    
    -- Verification
    verified_at TIMESTAMP,                      -- Verification time
    verified_by INT REFERENCES users(id),       -- Admin who verified
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Payment Status Values:**
```
1. Menunggu Verifikasi  (Waiting for admin verification)
2. Disetujui            (Approved/verified)
3. Ditolak              (Rejected)
```

**Indexes:**
```sql
CREATE INDEX idx_payments_order_id ON payments(order_id);
```

**Sample Data:**
```
ID | Order_ID | Amount    | Status           | Verified_At    | Verified_By
1  | 1        | 13500000  | Disetujui        | 2026-06-17 14:30| 2
2  | 3        | 5400000   | Menunggu Verifikasi | NULL        | NULL
```

---

### 🔟 PAYMENT_SETTINGS

```sql
CREATE TABLE payment_settings (
    id SERIAL PRIMARY KEY,
    payment_method VARCHAR(50) UNIQUE,          -- "Transfer Bank", "QRIS", "OVO", "GoPay"
    
    -- Bank transfer config
    bank_name VARCHAR(100),                     -- "BCA", "Mandiri", "BRI"
    account_number VARCHAR(50),                 -- "0123456789"
    account_holder_name VARCHAR(100),           -- Account owner name
    
    -- E-wallet config
    ovo_number VARCHAR(50),                     -- OVO account number
    gopay_number VARCHAR(50),                   -- GoPay account number
    whatsapp_number VARCHAR(20),                -- WhatsApp for notifications
    
    -- QRIS config
    qris_image_path TEXT,                       -- Path to QRIS QR code image
    
    is_active BOOLEAN DEFAULT TRUE,             -- Enable/disable method
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Sample Data:**
```
ID | Method         | Bank_Name | Account_Number | Is_Active
1  | Transfer Bank  | BCA       | 0123456789     | TRUE
2  | QRIS          | NULL      | NULL           | TRUE
3  | OVO           | NULL      | 08123456789    | TRUE
4  | GoPay         | NULL      | 08987654321    | FALSE
```

---

### 1️⃣1️⃣ ADMIN_SETTINGS

```sql
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE,            -- Setting name
    setting_value TEXT NOT NULL,                -- Setting value
    description VARCHAR(500),                   -- Dokumentasi
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Sample Data:**
```
ID | Setting_Key        | Setting_Value              | Description
1  | cs_whatsapp        | +6281234567890             | Customer service WhatsApp
2  | cs_email           | cs@ecomputer.id            | Customer service email
3  | store_address      | Jl. Merdeka No. 123        | Physical store address
4  | store_hours        | Senin-Jumat 09:00-18:00   | Store operation hours
```

---

## 🔗 RELATIONSHIPS

```
users (1) ──────── (*) orders
users (1) ──────── (*) wishlist
users (1) ──────── (*) password_resets
users (1) ──────── (*) payments (verified_by)

categories (1) ──────── (*) products
products (1) ──────── (*) order_details
products (1) ──────── (*) wishlist

orders (1) ──────── (*) order_details
orders (1) ──────── (*) payments

vouchers ◄─── orders (voucher_code)
payment_settings ◄─── orders (payment_method)
```

---

## ⚡ INDEXES

**Performance optimization untuk frequent queries:**

```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Order queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_order_id ON order_details(order_id);

-- Product queries
CREATE INDEX idx_products_category_id ON products(category_id);

-- Wishlist queries
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);

-- Payment tracking
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- Password reset lookups
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_email ON password_resets(email);
```

---

## 🔄 TRIGGERS

Automatic `updated_at` timestamp update:

```sql
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_timestamp BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vouchers_timestamp BEFORE UPDATE ON vouchers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payment_settings_timestamp BEFORE UPDATE ON payment_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_settings_timestamp BEFORE UPDATE ON admin_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## ⭐ KEY FEATURES

### 1. **Dual Authentication**
- Login dengan **username** OR **email**
- Password di-hash dengan bcryptjs

### 2. **Secure Password Reset**
- 6-digit OTP (one-time password)
- 10 minute expiry
- One-time use only

### 3. **Order Management**
- Auto-expiry untuk unpaid orders
- Order status tracking (6 states)
- Payment verification workflow

### 4. **Flexible Pricing**
- Fixed + percentage discounts (vouchers)
- Minimum purchase requirements
- Per-item historical pricing (order_details)

### 5. **Payment Methods**
- Transfer Bank (BCA, Mandiri, BRI, etc)
- QRIS (Dynamic QR payment)
- E-Wallet (OVO, GoPay)
- Admin configurable

### 6. **Product Specifications**
- CPU, RAM, GPU, Storage specs stored
- Best seller & new product flags
- Dynamic discount percentages
- Multiple product images (JSON array)

### 7. **Admin Tools**
- User role management
- Payment settings configuration
- Dynamic admin settings (key-value)
- Payment verification workflow

---

## 📈 DATA GROWTH PROJECTIONS

| Table | Day 1 | Month 1 | Year 1 | Growth |
|-------|-------|---------|--------|--------|
| users | 10 | 500 | 5,000+ | Linear |
| products | 100 | 100 | 200 | Slow |
| orders | 5 | 1,000 | 50,000 | Fast |
| order_details | 7 | 2,000 | 100,000 | Fast |
| wishlist | 15 | 2,000 | 20,000 | Linear |
| payments | 4 | 800 | 40,000 | Fast |

---

## 🚀 SETUP INSTRUCTIONS

### 1. Create Supabase Project
```bash
# Go to https://supabase.com → Create project
# Wait for project to initialize (2-3 minutes)
```

### 2. Run Schema
```sql
-- Copy entire contents of database/schema.postgres.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```

### 3. Get Connection String
```
Settings → Database → Connection Pooler
Copy connection string with pooler mode
```

### 4. Configure .env
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### 5. Verify Connection
```bash
cd backend
npm install
npm run dev
# Check if database connection works
```

---

## 📝 BACKUP & MIGRATION

### Backup Database
```bash
pg_dump -h host -U username dbname > backup.sql
```

### Restore Database
```bash
psql -h host -U username dbname < backup.sql
```

### Export to CSV
```sql
COPY users TO '/tmp/users.csv' WITH CSV HEADER;
COPY products TO '/tmp/products.csv' WITH CSV HEADER;
```

---

## ✅ VALIDATION CHECKLIST

- [x] All tables created
- [x] Foreign key constraints added
- [x] Indexes created for performance
- [x] Triggers for timestamp auto-update
- [x] UNIQUE constraints on username, email, voucher code
- [x] Default values configured
- [x] Cascading deletes configured
- [x] JSONB for flexible image storage

---

## 📞 TROUBLESHOOTING

**Q: Foreign key error?**
A: Ensure tables are created in correct order (users → password_resets, products, etc.)

**Q: JSONB not working?**
A: Supabase fully supports JSONB. Use `'[]'::jsonb` syntax.

**Q: Performance issues with large tables?**
A: Check if indexes are created. Run VACUUM & ANALYZE.

**Q: Timestamp not updating?**
A: Verify triggers are created. Check `pg_triggers` in system tables.

---

**Schema Version:** 1.0  
**Created:** 2026-06-17  
**PostgreSQL Version:** 13+  
**Platform:** Supabase  
**Status:** ✅ Production Ready
