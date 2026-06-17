# 📦 MIGRATION GUIDE: SQL Server → PostgreSQL (Supabase)

## 🔄 Tahapan Migrasi

Kamu telah membuat pilihan untuk deploy backend ke **Supabase (PostgreSQL)** dengan berbagai fitur improvements:
- ✅ Login berbasis **username** (bukan hanya email)
- ✅ Forgot password dengan **OTP via email**
- ✅ Search bar di kelola product, order, dan transaksi
- ✅ Unified settings page
- ✅ Fix report bugs

---

## 📋 Checklist Setup Awal

### 1. Setup Supabase Account & Database
```bash
# Buka https://supabase.com
# 1. Create new project
# 2. Klik "SQL Editor"
# 3. Copy-paste isi file database/schema.postgres.sql
# 4. Execute (jalankan SQL)
# 5. Salin connection string dari Settings > Database > URI
```

### 2. Install Dependencies
```bash
cd backend
npm install
# Ini akan install: pg, nodemailer, dan dependencies lainnya
```

### 3. Update .env File (backend)
```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Atau individual vars:
DB_SERVER=db.supabase.co
DB_USER=postgres
DB_PASSWORD=your-password
DB_PORT=5432
DB_DATABASE=postgres
DB_SSL=true

# Email untuk OTP
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
JWT_SECRET=your-super-secret-key-here

PORT=5000
NODE_ENV=development
```

**Note untuk Gmail App Password:**
1. Buka https://myaccount.google.com/apppasswords
2. Pilih Mail dan Windows (atau device kamu)
3. Copy password yang generated
4. Paste ke EMAIL_PASSWORD

---

## 🛠️ Backend Controllers yang Sudah Diupdate

### ✅ Sudah Diupdate ke PostgreSQL:
1. **authController.js** - Login with username + OTP forgot password
2. **db.js** - PostgreSQL connection pool (pg library)

### ⏳ Masih Perlu Diupdate (Priority):
Berikut adalah controllers yang perlu diupdate untuk PostgreSQL syntax:

- **productController.js** - Tambah search dengan ILIKE (PostgreSQL)
- **orderController.js** - Tambah search untuk user orders
- **paymentController.js** - Tambah search untuk transaksi
- **adminController.js** - Update dashboard queries
- **wishlistController.js** - Update queries
- **voucherController.js** - Update queries

---

## 📝 Contoh Update Pattern

### SQL Server → PostgreSQL
```javascript
// SQL SERVER (OLD)
const result = await pool.request()
  .input('search', sql.NVarChar, `%${search}%`)
  .query('SELECT * FROM dbo.users WHERE name LIKE @search');

// POSTGRESQL (NEW)
const result = await query(
  'SELECT * FROM users WHERE name ILIKE $1',
  [`%${search}%`]
);
```

---

## 🔍 Fitur-Fitur yang Sudah Ditambahkan

### 1. Username-Based Login ✅
**Route:** `POST /api/auth/login`
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

### 2. Forgot Password dengan OTP ✅
**Step 1 - Request OTP:**
```bash
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

**Step 2 - Verify OTP & Reset Password:**
```bash
POST /api/auth/reset-password-otp
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "newpassword123"
}
```

### 3. Register dengan Username ✅
**Route:** `POST /api/auth/register`
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 🔍 Search Features (Masih Perlu Update Controllers)

### Products Search
```javascript
// Frontend example
const searchProducts = async (keyword) => {
  const response = await fetch(`/api/products?search=${keyword}`);
  return response.json();
};
```

### Orders Search
```javascript
// Frontend example - cari berdasarkan order ID atau status
const searchOrders = async (keyword, userId) => {
  const response = await fetch(`/api/orders?userId=${userId}&search=${keyword}`);
  return response.json();
};
```

### Payments/Transactions Search
```javascript
// Frontend example - cari berdasarkan order ID
const searchPayments = async (keyword) => {
  const response = await fetch(`/api/payment?search=${keyword}`);
  return response.json();
};
```

---

## 🎨 Frontend Updates Needed

### 1. Update Login Form (`frontend/src/pages/Login.jsx`)
- Ubah `email` field menjadi `username`
- Tambah link "Lupa Password?" yang bawa ke forgot password page

### 2. Buat Forgot Password Page
- Input email
- Input OTP yang diterima via email
- Input password baru
- Verify & reset

### 3. Tambah Search Bars di:
- Admin Dashboard > Kelola Product (searchable product list)
- Admin Dashboard > Kelola Order (searchable order list)
- Admin Dashboard > Kelola Transaksi (searchable payment list)

### 4. Unify Settings Page
- Bunga satu page dengan tabs/sections:
  - **Tab 1: Informasi Kontak** (CS WhatsApp, CS Email, Address, Hours)
  - **Tab 2: Pengaturan Pembayaran** (Bank, QRIS, E-Wallet)
  - Tab dapat diakses dari Settings menu

---

## ⚠️ Report Bugs Fix

**Masalah:** HTML dan PDF report menampilkan "Access denied" atau "Message not found"

**Solusi:** 
1. Pastikan path untuk file uploads benar
2. Verifikasi file permissions
3. Update report routes untuk PostgreSQL queries

---

## 🚀 Next Steps

1. **Setup Supabase & Database**
   ```bash
   # Jalankan schema.postgres.sql di Supabase SQL Editor
   ```

2. **Install Dependencies Baru**
   ```bash
   cd backend
   npm install
   ```

3. **Update .env File** dengan database credentials

4. **Update Controllers** (akan dibuat script lengkapnya)
   - productController.js
   - orderController.js
   - paymentController.js
   - adminController.js
   - etc.

5. **Update Frontend** untuk username login & forgot password

6. **Test semua endpoints** sebelum deployment

---

## 📚 Helpful Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL vs SQL Server Differences](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Nodemailer Setup](https://nodemailer.com/)
- [pg npm package](https://www.npmjs.com/package/pg)

---

## 💡 Tips

- Jangan lupa add `schema.postgres.sql` ke version control
- Test semua endpoints di Postman sebelum frontend integration
- Monitor email sending di console/logs (nodemailer)
- Pastikan CORS setup untuk frontend domain

**Status:** Database + Auth system siap ✅ | Controllers masih perlu update ⏳

