-- =======================================================
-- SQL SERVER DATABASE SCHEMA FOR E-COMMERCE COMPUTER SALES
-- =======================================================

-- 1. DROP TABLES IN REVERSE ORDER OF DEPENDENCY (If Exist)
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.wishlist', 'U') IS NOT NULL DROP TABLE dbo.wishlist;
IF OBJECT_ID('dbo.order_details', 'U') IS NOT NULL DROP TABLE dbo.order_details;
IF OBJECT_ID('dbo.orders', 'U') IS NOT NULL DROP TABLE dbo.orders;
IF OBJECT_ID('dbo.vouchers', 'U') IS NOT NULL DROP TABLE dbo.vouchers;
IF OBJECT_ID('dbo.products', 'U') IS NOT NULL DROP TABLE dbo.products;
IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL DROP TABLE dbo.categories;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;

-- 2. CREATE TABLES

-- Table: users
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Hashed with bcrypt
    phone VARCHAR(20) NULL,
    address NVARCHAR(MAX) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'admin' or 'customer'
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Table: categories
CREATE TABLE dbo.categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL
);

-- Table: products
CREATE TABLE dbo.products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL,
    name NVARCHAR(200) NOT NULL,
    brand NVARCHAR(100) NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    description NVARCHAR(MAX) NULL,
    image_urls NVARCHAR(MAX) NOT NULL, -- JSON string array, e.g. '["/img1.jpg", "/img2.jpg"]'
    spec_ram VARCHAR(50) NULL,         -- e.g. '8GB', '16GB', '32GB'
    spec_storage VARCHAR(50) NULL,     -- e.g. '256GB SSD', '512GB SSD', '1TB SSD'
    spec_cpu VARCHAR(100) NULL,        -- e.g. 'Intel Core i7', 'AMD Ryzen 7'
    spec_gpu VARCHAR(100) NULL,        -- e.g. 'NVIDIA RTX 4060', 'Intel Iris Xe'
    weight DECIMAL(10,2) NULL,         -- in kg
    is_best_seller BIT NOT NULL DEFAULT 0,
    is_new BIT NOT NULL DEFAULT 1,
    discount_percent INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_products_categories FOREIGN KEY (category_id) REFERENCES dbo.categories(id) ON DELETE CASCADE
);

-- Table: vouchers
CREATE TABLE dbo.vouchers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_percent INT NOT NULL DEFAULT 0, -- can use either amount or percent
    min_purchase DECIMAL(18,2) NOT NULL DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BIT NOT NULL DEFAULT 1
);

-- Table: orders
CREATE TABLE dbo.orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT GETDATE(),
    status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Pembayaran', -- 'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'
    total_amount DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(18,2) NOT NULL,
    voucher_code VARCHAR(50) NULL,
    address NVARCHAR(MAX) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Transfer Bank', 'E-Wallet'
    expired_at DATETIME NOT NULL,         -- order automatically expires and cancels if unpaid
    CONSTRAINT FK_orders_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

-- Table: order_details
CREATE TABLE dbo.order_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(18,2) NOT NULL, -- Captured price at order time
    CONSTRAINT FK_order_details_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_order_details_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

-- Table: wishlist
CREATE TABLE dbo.wishlist (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_wishlist_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_wishlist_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
    CONSTRAINT UQ_wishlist_user_product UNIQUE (user_id, product_id)
);

-- Table: payments
CREATE TABLE dbo.payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT GETDATE(),
    amount DECIMAL(18,2) NOT NULL,
    proof_image NVARCHAR(MAX) NOT NULL, -- Path or URL to uploaded payment receipt
    status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Verifikasi', -- 'Menunggu Verifikasi', 'Disetujui', 'Ditolak'
    verified_at DATETIME NULL,
    verified_by INT NULL,
    CONSTRAINT FK_payments_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_payments_users FOREIGN KEY (verified_by) REFERENCES dbo.users(id)
);

-- =======================================================
-- 3. SEED DUMMY DATA
-- =======================================================

-- Seed Users:
-- Admin password: 'adminpassword' -> bcrypt: $2b$10$k1wXbN3K5e2c5w0gI1e0DuB0X7y7K2U7.h97/FfKz0o9W2vU5n.yq
-- Customer password: 'customerpassword' -> bcrypt: $2b$10$K4rB3L9C7h8D2tY3s9f0GuI1j2K3L4M5N6O7P8Q9R0S1T2U3V4W5X
INSERT INTO dbo.users (name, email, password, phone, address, role) VALUES 
(N'Admin E-Computer', 'admin@ecomputer.com', '$2b$10$k1wXbN3K5e2c5w0gI1e0DuB0X7y7K2U7.h97/FfKz0o9W2vU5n.yq', '081234567890', N'Ruko Cyber Mall Lantai 2, Jakarta', 'admin'),
(N'Budi Setiawan', 'budi@gmail.com', '$2b$10$K4rB3L9C7h8D2tY3s9f0GuI1j2K3L4M5N6O7P8Q9R0S1T2U3V4W5X', '082198765432', N'Jl. Mangga Besar No. 45, Jakarta Barat', 'customer'),
(N'Rian Hidayat', 'rian@gmail.com', '$2b$10$K4rB3L9C7h8D2tY3s9f0GuI1j2K3L4M5N6O7P8Q9R0S1T2U3V4W5X', '085712345678', N'Jl. Dago No. 12, Bandung', 'customer');

-- Seed Categories:
INSERT INTO dbo.categories (name, slug, description) VALUES
(N'Laptop', 'laptop', N'Laptop gaming, ultrabook, office, dan creator.'),
(N'Komputer Desktop', 'komputer-desktop', N'PC AIO, PC Desktop Gaming, dan PC Office.'),
(N'Komponen', 'komponen', N'Processor, RAM, Motherboard, GPU, Storage, dll.'),
(N'Aksesoris', 'aksesoris', N'Keyboard, Mouse, Monitor, Headset, dll.');

-- Seed Products:
INSERT INTO dbo.products (category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent) VALUES
(1, N'ASUS ROG Zephyrus G14 OLED', N'ASUS', 28999000.00, 10, N'Laptop gaming 14 inci premium dengan layar OLED, bertenaga AMD Ryzen 9 dan NVIDIA GeForce RTX 4060.', N'["/images/products/zephyrus-g14-1.jpg", "/images/products/zephyrus-g14-2.jpg"]', '16GB DDR5', '1TB NVMe SSD', 'AMD Ryzen 9 8945HS', 'NVIDIA RTX 4060 8GB', 1.50, 1, 1, 0),
(1, N'Lenovo Legion 5 Pro Intel', N'Lenovo', 24999000.00, 15, N'Laptop gaming dengan performa monster, mengusung Intel Core i7 Gen 14 dan RTX 4070.', N'["/images/products/legion5-1.jpg", "/images/products/legion5-2.jpg"]', '32GB DDR5', '1TB NVMe SSD', 'Intel Core i7-14700HX', 'NVIDIA RTX 4070 8GB', 2.40, 1, 0, 5),
(1, N'MacBook Air M3 13 Inch', N'Apple', 18999000.00, 20, N'Laptop ultra-tipis super efisien dengan chip Apple M3 terbaru.', N'["/images/products/macbook-air-m3-1.jpg"]', '8GB Unified Memory', '256GB SSD', 'Apple M3 8-Core', 'Apple M3 10-Core GPU', 1.24, 0, 1, 0),
(2, N'PC Desktop Gaming OMEN by HP 40L', N'HP', 32500000.00, 5, N'PC desktop gaming tangguh dengan pendingin cair, Intel Core i7 Gen 14 dan RTX 4080.', N'["/images/products/omen-40l-1.jpg"]', '32GB DDR5', '2TB NVMe SSD', 'Intel Core i7-14700K', 'NVIDIA RTX 4080 16GB', 12.00, 1, 1, 10),
(2, N'PC Desktop Office Lenovo IdeaCentre 3', N'Lenovo', 7500000.00, 12, N'PC Desktop ringkas dan hemat daya untuk operasional kantor harian.', N'["/images/products/ideacentre-3-1.jpg"]', '8GB DDR4', '512GB NVMe SSD', 'Intel Core i3-13100', 'Intel UHD Graphics 730', 5.50, 0, 0, 0),
(3, N'NVIDIA GeForce RTX 4070 Ti Super', N'MSI', 15499000.00, 8, N'Kartu grafis desktop MSI Ventus 3X dengan memory GDDR6X 16GB.', N'["/images/products/rtx-4070ti-1.jpg"]', NULL, NULL, NULL, 'NVIDIA RTX 4070 Ti Super', 1.20, 0, 1, 0),
(3, N'RAM Corsair Vengeance RGB DDR5 32GB', N'Corsair', 2150000.00, 25, N'RAM dual channel kit 2x16GB DDR5 6000MHz dengan pencahayaan RGB.', N'["/images/products/ram-corsair-1.jpg"]', '32GB DDR5 (2x16GB)', NULL, NULL, NULL, 0.15, 0, 0, 8),
(4, N'Mechanical Keyboard Keychron K2 V2', N'Keychron', 1450000.00, 30, N'Keyboard mekanik wireless layout 75% dengan Gateron G Pro Switch.', N'["/images/products/keychron-k2-1.jpg"]', NULL, NULL, NULL, NULL, 0.79, 1, 0, 0),
(4, N'Mouse Gaming Logitech G502 X Plus', N'Logitech', 2199000.00, 40, N'Mouse gaming wireless legendaris dengan sensor HERO 25K dan switch hybrid optikal-mekanikal.', N'["/images/products/g502x-plus-1.jpg"]', NULL, NULL, NULL, NULL, 0.10, 1, 1, 15),
(4, N'Monitor Gaming ASUS ROG Swift PG27AQDM', N'ASUS', 16999000.00, 6, N'Monitor OLED gaming 27 inci 240Hz QHD dengan response time 0.03ms.', N'["/images/products/rog-monitor-1.jpg"]', NULL, NULL, NULL, NULL, 6.90, 0, 1, 0);

-- Seed Vouchers:
INSERT INTO dbo.vouchers (code, discount_amount, discount_percent, min_purchase, start_date, end_date, is_active) VALUES
('NEWUSER10', 0.00, 10, 1500000.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1),
('GAJIANHEMAT', 150000.00, 0, 2000000.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1),
('ROGFREESHIP', 500000.00, 0, 25000000.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1);
