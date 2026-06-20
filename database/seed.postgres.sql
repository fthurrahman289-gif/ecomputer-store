-- =======================================================
-- POSTGRESQL SEED DATA FOR E-COMMERCE COMPUTER SALES
-- =======================================================
-- Run this AFTER schema.postgres.sql has been executed

-- Seed Users:
-- Admin password: 'adminpassword' -> bcrypt: $2a$10$JDMdee23c5wzuefgSFuI3uua9XjMU8CG.C40LiWaoWRPWOqsAZVYi
-- Customer password: 'customerpassword' -> bcrypt: $2a$10$goCs2e36KXGbIIGc7vWqpe7hxyqTUF/eZMK51S5E0l3dyG7Y4KeVu
INSERT INTO users (name, username, email, password, phone, address, role) VALUES 
('Admin E-Computer', 'admin', 'admin@ecomputer.com', '$2a$10$JDMdee23c5wzuefgSFuI3uua9XjMU8CG.C40LiWaoWRPWOqsAZVYi', '081234567890', 'Ruko Cyber Mall Lantai 2, Jakarta', 'admin'),
('Budi Setiawan', 'budi', 'budi@gmail.com', '$2a$10$goCs2e36KXGbIIGc7vWqpe7hxyqTUF/eZMK51S5E0l3dyG7Y4KeVu', '082198765432', 'Jl. Mangga Besar No. 45, Jakarta Barat', 'customer'),
('Rian Hidayat', 'rian', 'rian@gmail.com', '$2a$10$goCs2e36KXGbIIGc7vWqpe7hxyqTUF/eZMK51S5E0l3dyG7Y4KeVu', '085712345678', 'Jl. Dago No. 12, Bandung', 'customer');

-- Seed Categories:
INSERT INTO categories (name, slug, description) VALUES
('Laptop', 'laptop', 'Laptop gaming, ultrabook, office, dan creator.'),
('Komputer Desktop', 'komputer-desktop', 'PC AIO, PC Desktop Gaming, dan PC Office.'),
('Komponen', 'komponen', 'Processor, RAM, Motherboard, GPU, Storage, dll.'),
('Aksesoris', 'aksesoris', 'Keyboard, Mouse, Monitor, Headset, dll.');

-- Seed Products:
INSERT INTO products (category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent) VALUES
(1, 'ASUS ROG Zephyrus G14 OLED', 'ASUS', 28999000.00, 10, 'Laptop gaming 14 inci premium dengan layar OLED, bertenaga AMD Ryzen 9 dan NVIDIA GeForce RTX 4060.', '["https://via.placeholder.com/400?text=ASUS+ROG+1", "https://via.placeholder.com/400?text=ASUS+ROG+2"]'::jsonb, '16GB DDR5', '1TB NVMe SSD', 'AMD Ryzen 9 8945HS', 'NVIDIA RTX 4060 8GB', 1.50, true, true, 0),
(1, 'Lenovo Legion 5 Pro Intel', 'Lenovo', 24999000.00, 15, 'Laptop gaming dengan performa monster, mengusung Intel Core i7 Gen 14 dan RTX 4070.', '["https://via.placeholder.com/400?text=Lenovo+Legion+1", "https://via.placeholder.com/400?text=Lenovo+Legion+2"]'::jsonb, '32GB DDR5', '1TB NVMe SSD', 'Intel Core i7-14700HX', 'NVIDIA RTX 4070 8GB', 2.40, true, false, 5),
(1, 'MacBook Air M3 13 Inch', 'Apple', 18999000.00, 20, 'Laptop ultra-tipis super efisien dengan chip Apple M3 terbaru.', '["https://via.placeholder.com/400?text=MacBook+Air"]'::jsonb, '8GB Unified Memory', '256GB SSD', 'Apple M3 8-Core', 'Apple M3 10-Core GPU', 1.24, false, true, 0),
(2, 'PC Desktop Gaming OMEN by HP 40L', 'HP', 32500000.00, 5, 'PC desktop gaming tangguh dengan pendingin cair, Intel Core i7 Gen 14 dan RTX 4080.', '["https://via.placeholder.com/400?text=HP+OMEN"]'::jsonb, '32GB DDR5', '2TB NVMe SSD', 'Intel Core i7-14700K', 'NVIDIA RTX 4080 16GB', 12.00, true, true, 10),
(2, 'PC Desktop Office Lenovo IdeaCentre 3', 'Lenovo', 7500000.00, 12, 'PC Desktop ringkas dan hemat daya untuk operasional kantor harian.', '["https://via.placeholder.com/400?text=Lenovo+IdeaCentre"]'::jsonb, '8GB DDR4', '512GB NVMe SSD', 'Intel Core i3-13100', 'Intel UHD Graphics 730', 5.50, false, false, 0),
(3, 'NVIDIA GeForce RTX 4070 Ti Super', 'MSI', 15499000.00, 8, 'Kartu grafis desktop MSI Ventus 3X dengan memory GDDR6X 16GB.', '["https://via.placeholder.com/400?text=RTX+4070+Ti"]'::jsonb, NULL, NULL, NULL, 'NVIDIA RTX 4070 Ti Super', 1.20, false, true, 0),
(3, 'RAM Corsair Vengeance RGB DDR5 32GB', 'Corsair', 2150000.00, 25, 'RAM dual channel kit 2x16GB DDR5 6000MHz dengan pencahayaan RGB.', '["https://via.placeholder.com/400?text=Corsair+RAM"]'::jsonb, '32GB DDR5 (2x16GB)', NULL, NULL, NULL, 0.15, false, false, 8),
(4, 'Mechanical Keyboard Keychron K2 V2', 'Keychron', 1450000.00, 30, 'Keyboard mekanik wireless layout 75% dengan Gateron G Pro Switch.', '["https://via.placeholder.com/400?text=Keychron+K2"]'::jsonb, NULL, NULL, NULL, NULL, 0.79, true, false, 0),
(4, 'Mouse Gaming Logitech G502 X Plus', 'Logitech', 2199000.00, 40, 'Mouse gaming wireless legendaris dengan sensor HERO 25K dan switch hybrid optikal-mekanikal.', '["https://via.placeholder.com/400?text=Logitech+G502"]'::jsonb, NULL, NULL, NULL, NULL, 0.10, true, true, 15),
(4, 'Monitor Gaming ASUS ROG Swift PG27AQDM', 'ASUS', 16999000.00, 6, 'Monitor OLED gaming 27 inci 240Hz QHD dengan response time 0.03ms.', '["https://via.placeholder.com/400?text=ASUS+ROG+Monitor"]'::jsonb, NULL, NULL, NULL, NULL, 6.90, false, true, 0);

-- Seed Vouchers:
INSERT INTO vouchers (code, discount_amount, discount_percent, min_purchase, start_date, end_date, is_active) VALUES
('NEWUSER10', 0.00, 10, 1500000.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', true),
('GAJIANHEMAT', 150000.00, 0, 2000000.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', true),
('ROGFREESHIP', 500000.00, 0, 25000000.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', true);

-- Seed Payment Settings:
INSERT INTO payment_settings (payment_method, bank_name, account_number, account_holder_name, whatsapp_number, is_active) VALUES
('Transfer Bank', 'BCA', '1234567890', 'PT E-COMPUTER INDONESIA', '081234567890', true),
('QRIS', NULL, NULL, NULL, '081234567890', true),
('E-Wallet', NULL, NULL, NULL, '081234567890', true);

-- Seed Admin Settings:
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('cs_whatsapp', '6281234567890', 'Nomor WhatsApp Customer Service'),
('cs_email', 'cs@ecomputer.com', 'Email Customer Service'),
('store_address', 'Ruko Cyber Mall Lantai 2, Jakarta', 'Alamat Toko Fisik'),
('store_hours', 'Senin-Jumat: 10:00-18:00, Sabtu-Minggu: 11:00-17:00', 'Jam Operasional Toko');
