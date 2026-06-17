# 📝 DETAILED CHANGES LOG

Dokumen ini menjelaskan secara detail semua perubahan yang telah dilakukan pada project E-Computer.

---

## 🔄 DATABASE MIGRATION: SQL Server → PostgreSQL

### File Baru:
- **`database/schema.postgres.sql`** - Schema lengkap untuk PostgreSQL dengan fitur:
  - Username field di users table
  - Password resets table untuk OTP functionality
  - JSONB untuk image_urls (lebih efficient dari JSON string)
  - Automatic timestamp triggers
  - Proper indexes untuk performance

### Key Changes:
```sql
-- SQL Server: IDENTITY(1,1)
-- PostgreSQL: SERIAL

-- SQL Server: DATETIME
-- PostgreSQL: TIMESTAMP

-- SQL Server: BIT
-- PostgreSQL: BOOLEAN

-- SQL Server: NVARCHAR(MAX)
-- PostgreSQL: TEXT

-- SQL Server: JSON string
-- PostgreSQL: JSONB (native)
```

### Tabel Baru:
- **password_resets** - Menyimpan OTP untuk forgot password:
  ```sql
  id, user_id, email, otp_code, expires_at, is_used, created_at
  ```

---

## 🔐 AUTHENTICATION SYSTEM UPDATES

### Backend Changes:

#### 1. `backend/src/config/db.js` - Database Configuration
**Dari:**
```javascript
// SQL Server dengan mssql library
const sql = require('mssql');
const poolPromise = new sql.ConnectionPool(config).connect();
```

**Ke:**
```javascript
// PostgreSQL dengan pg library
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

#### 2. `backend/src/controllers/authController.js` - Auth Logic
**Perubahan Utama:**

a) **Register User** - Menambahkan username field:
```javascript
// OLD
registerUser(name, email, password, phone, address)

// NEW
registerUser(name, username, email, password, phone, address)
```

b) **Login User** - Support username atau email:
```javascript
// OLD
loginUser(email, password)

// NEW
loginUser(username, password)  // bisa username atau email
// Query: WHERE username = $1 OR email = $1
```

c) **Forgot Password** - OTP via Email (NEW):
```javascript
requestPasswordReset(email) {
  // Generate OTP 6 digit
  // Simpan ke password_resets table
  // Kirim OTP via email menggunakan nodemailer
}

verifyOTPAndResetPassword(email, otpCode, newPassword) {
  // Verify OTP
  // Update password
  // Mark OTP sebagai used
}
```

#### 3. `backend/src/routes/authRoutes.js` - Route Configuration
**Tambahan Routes:**
```javascript
// Existing
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile

// BARU
POST /api/auth/forgot-password       // Kirim OTP
POST /api/auth/reset-password-otp    // Verify OTP & reset
```

#### 4. `backend/package.json` - Dependencies
**Removed:**
```json
"msnodesqlv8": "^5.2.0",
"mssql": "^10.0.4"
```

**Added:**
```json
"pg": "^8.11.3",
"nodemailer": "^6.9.7"
```

### Frontend Changes:

#### 1. `frontend/src/pages/Login.jsx` - Login Page
**Changes:**
- Icon: Mail → User (untuk username)
- Label: "Alamat Email" → "Username / Email"
- Placeholder: "name@example.com" → "johndoe atau john@example.com"
- Tambah link "Lupa Kata Sandi?" ke `/forgot-password`

```jsx
// OLD: [email, password] inputs
// NEW: [username, password] inputs + forgot password link
```

#### 2. `frontend/src/pages/ForgotPassword.jsx` (NEW FILE)
**Complete 3-Step Process:**
- Step 1: Email input → Send OTP
- Step 2: OTP verification (6 digit)
- Step 3: New password input → Reset

**Features:**
- Progress indicator
- Email validation
- OTP code (numeric only)
- Password strength indicator
- Error handling
- Success message

#### 3. `frontend/src/pages/Register.jsx` - Register Page
**Changes:**
- Tambah username field (required)
- Input validations untuk username (2-20 chars)
- Updated form state:
  ```javascript
  // OLD
  {name, email, password, phone, address}
  
  // NEW
  {name, username, email, password, phone, address}
  ```

#### 4. `frontend/src/context/AppContext.jsx` - Auth Context
**Changes:**
```javascript
// OLD
const login = async (email, password) => {
  const data = await apiCall('/api/auth/login', {
    body: JSON.stringify({ email, password })
  });
}

// NEW
const login = async (username, password) => {
  const data = await apiCall('/api/auth/login', {
    body: JSON.stringify({ username, password })
  });
}

// BARU function
const register = async (name, username, email, password, phone, address) => {
  // Added username parameter
}
```

#### 5. `frontend/src/App.jsx` - Router Configuration
**Changes:**
```javascript
// Import ForgotPassword
import ForgotPassword from './pages/ForgotPassword';

// Add Route
<Route path="/forgot-password" element={<ForgotPassword />} />
```

---

## 📦 PRODUCT MANAGEMENT UPDATES

### Backend Changes:

#### `backend/src/controllers/productController.js` - Full Migration
**From SQL Server to PostgreSQL:**

**Pattern Changes:**
```javascript
// OLD (SQL Server)
const pool = await poolPromise;
const request = pool.request();
await request
  .input('search', sql.NVarChar, `%${search}%`)
  .query('SELECT * FROM dbo.products WHERE name LIKE @search');

// NEW (PostgreSQL)
const result = await query(
  'SELECT * FROM products WHERE name ILIKE $1',
  [`%${search}%`]
);
```

**Search Functionality (Sudah ada):**
- Search by: name, description, brand
- Filter by: category, price range, specs
- Filter by: is_new, is_best_seller, hasDiscount

**Database Queries Updated:**
- All `dbo.` prefix removed (PostgreSQL)
- All `@parameter` syntax → `$1, $2, ...` syntax
- All `sql.` type declarations removed
- SQL Server specific functions removed

**New Features:**
- ILIKE untuk case-insensitive search
- JSONB untuk image_urls handling
- Updated timestamps support

---

## 🗄️ REMAINING CONTROLLER UPDATES NEEDED

### Controllers yang Masih Perlu Update ke PostgreSQL:

1. **`orderController.js`**
   - Replace all SQL Server queries
   - Add search functionality (by order ID, customer name, status)

2. **`paymentController.js`**
   - Replace all SQL Server queries
   - Add search functionality (by payment ID, order ID, status)

3. **`adminController.js`**
   - Update dashboard queries
   - Replace all dbo. references

4. **`wishlistController.js`**
   - Simple migration (mostly SELECT/INSERT/DELETE)

5. **`voucherController.js`**
   - Simple migration

6. **`adminSettingsController.js`**
   - Update for unified settings page

7. **`reportController.js`**
   - Update queries
   - Fix file path issues
   - Fix permissions

---

## 📋 ENVIRONMENT VARIABLES

### Required in `.env` (Backend):

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database

# OR Individual Variables
DB_SERVER=db.supabase.co
DB_USER=postgres
DB_PASSWORD=your-password
DB_PORT=5432
DB_DATABASE=postgres
DB_SSL=true

# Email Configuration (for OTP)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# JWT Secret
JWT_SECRET=your-super-secret-key-change-this

# Server
PORT=5000
NODE_ENV=development
```

---

## 📂 NEW FILES CREATED

1. **`database/schema.postgres.sql`** - PostgreSQL database schema
2. **`frontend/src/pages/ForgotPassword.jsx`** - Forgot password page component
3. **`MIGRATION_POSTGRESQL.md`** - Detailed migration guide
4. **`PROJECT_UPDATE_SUMMARY.md`** - Project update summary
5. **`CHANGES_LOG.md`** - This file

---

## 🔄 API ENDPOINTS CHANGES

### New Endpoints:

```bash
# Forgot Password - Step 1: Request OTP
POST /api/auth/forgot-password
Request: { email: "user@example.com" }
Response: { message: "Kode OTP telah dikirim ke email Anda" }

# Forgot Password - Step 2: Verify OTP & Reset Password
POST /api/auth/reset-password-otp
Request: { email: "user@example.com", otpCode: "123456", newPassword: "..." }
Response: { message: "Password berhasil diubah..." }
```

### Modified Endpoints:

```bash
# Register - Signature changed
POST /api/auth/register
OLD: { name, email, password, phone, address }
NEW: { name, username, email, password, phone, address }

# Login - Signature changed
POST /api/auth/login
OLD: { email, password }
NEW: { username, password }  # Can be username OR email

# Get Products - Already supports search
GET /api/products?search=keyword&category=1&minPrice=5000000
```

---

## 🔑 KEY IMPROVEMENTS

1. **Username Support**
   - Users can now login dengan username (more memorable)
   - Email masih berfungsi sebagai backup login

2. **Secure Password Recovery**
   - OTP sent via email (6 digit, 10 minute expiry)
   - 3-step process prevents unauthorized access
   - Prevents brute force attacks

3. **Database Optimization**
   - PostgreSQL lebih scalable dari SQL Server lokal
   - JSONB native support lebih efficient
   - Automated timestamps dengan triggers

4. **Product Search**
   - Case-insensitive search dengan ILIKE
   - Multiple filter support
   - Performance optimized dengan indexes

---

## ✅ TESTING CHECKLIST

### Frontend
- [ ] Register dengan username baru
- [ ] Login dengan username
- [ ] Login dengan email (backward compatible)
- [ ] Forgot password flow selesai sampai reset
- [ ] OTP expiry handling
- [ ] Error messages displayed correctly

### Backend
- [ ] Database connection success
- [ ] Register creates user dengan username
- [ ] Login works dengan username
- [ ] Email OTP sending works
- [ ] OTP validation correct
- [ ] Password update successful
- [ ] Product search returns correct results

### Integration
- [ ] Frontend auth functions work with new backend
- [ ] No console errors
- [ ] Network requests successful

---

## 📚 REFERENCE LINKS

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Nodemailer Setup: https://nodemailer.com/
- PG NPM: https://www.npmjs.com/package/pg
- Supabase Docs: https://supabase.com/docs

---

**Last Updated:** 2026-06-17
**Version:** 2.0 (PostgreSQL Migration)
