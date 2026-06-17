# 🚀 Vercel Deployment Guide - Backend (PostgreSQL/Supabase)

## ⚠️ CRITICAL: Perbaikan Terbaru untuk Login Error

Anda mengalami error **500 INTERNAL_SERVER_ERROR** pada login. Ini telah diperbaiki dengan:
✅ Optimasi connection pooling untuk serverless  
✅ Better error handling untuk debugging  
✅ Health check endpoint untuk monitoring  

---

## 📋 Checklist Sebelum Deploy ke Vercel

### 1. **Setup Supabase Database (CRITICAL)**

#### A. Create Supabase Project
1. Buka [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Project name**: `ecomputer` (atau nama lain)
   - **Database password**: Simpan dengan aman!
   - **Region**: Pilih region terdekat (misal: `Singapore` untuk Indonesia)
4. Tunggu project selesai dibuat (±2 menit)

#### B. Import Database Schema
1. Di Supabase dashboard, buka **SQL Editor**
2. Click **"New Query"**
3. Copy-paste seluruh isi file `database/schema.postgres.sql`
4. Click **"Run"** untuk menjalankan script
5. Tunggu sampai semua tabel berhasil dibuat ✅

#### C. Get Connection String dengan Connection Pooling
⚠️ **PENTING**: Gunakan **Connection Pooling (PgBouncer)**, bukan direct connection!

**Langkah:**
1. Di Supabase, buka **Settings → Database → Connection pooling**
2. Pastikan mode adalah **"Transaction"** (default)
3. Copy connection string yang ditampilkan
4. Format akan terlihat seperti:
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooling.supabase.com:6543/postgres
   ```

⚠️ **Catatan**: Port adalah **6543** (bukan 5432) untuk pooling!

---

## 🔐 Environment Variables di Vercel

### 2. Setup Backend Environment Variables di Vercel

**Di Vercel Dashboard:**
1. Buka project backend Anda
2. Klik **Settings → Environment Variables**
3. Add variable dengan **klik "Add"**

**Tambahkan variabel berikut:**

| Variable | Value | Deskripsi |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres.[project-id]:[password]@aws-0-[region].pooling.supabase.com:6543/postgres` | Connection pooling dari Supabase |
| `JWT_SECRET` | `your-super-secret-key-min-32-chars-random` | Secret key untuk JWT (buat yang random dan panjang!) |
| `EMAIL_USER` | `your-gmail@gmail.com` | Email Gmail untuk kirim OTP |
| `EMAIL_PASSWORD` | `your-app-specific-password` | App password dari Gmail (bukan password akun!) |
| `NODE_ENV` | `production` | Environment mode |

### 3. Setup Gmail App Password (untuk Email OTP)

Karena fitur OTP menggunakan email, Anda perlu:

1. Buka [Google Account Security](https://myaccount.google.com/security)
2. Scroll ke **"App passwords"** (pastikan 2-Factor Authentication sudah enabled)
3. Select **App**: "Mail" dan **Device**: "Windows Computer"
4. Klik **Generate**
5. Copy password yang ditampilkan (16 karakter)
6. Paste ke `EMAIL_PASSWORD` di Vercel

---

## 🔄 Deploy Backend ke Vercel

### 4. Push Code ke Git Repository

Sebelum deploy, pastikan code sudah di push:

```bash
cd backend
git add .
git commit -m "Fix: Optimize PostgreSQL connection pooling for serverless"
git push
```

### 5. Deploy di Vercel

**Option A: Automatic Deployment**
- Jika sudah connected ke GitHub, Vercel otomatis deploy saat push
- Tunggu hingga deployment selesai (status ✅ green)

**Option B: Manual Deployment**
```bash
# Install Vercel CLI jika belum
npm install -g vercel

# Deploy
vercel --prod
```

---

## ✅ Verifikasi Deployment

### 6. Test Backend Health

Buka URL berikut di browser atau Postman:

```
GET https://your-backend-url.vercel.app/health
```

Response yang benar:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-06-17T10:00:00.000Z"
}
```

### 7. Test Login Endpoint

**POST** ke: `https://your-backend-url.vercel.app/api/auth/login`

**Body (JSON):**
```json
{
  "username": "admin@ecomputer.com",
  "password": "adminpassword"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin",
    "username": "admin@ecomputer.com",
    "email": "admin@ecomputer.com",
    "role": "admin"
  }
}
```

---

## 🐛 Troubleshooting

### Error: "FUNCTION_INVOCATION_FAILED"
**Penyebab**: Database connection error  
**Solusi**:
1. Check `DATABASE_URL` di Vercel env variables
2. Pastikan menggunakan pooling endpoint (port 6543), bukan direct (port 5432)
3. Test database connection dari Supabase dashboard → SQL Editor

### Error: "JWT_SECRET not defined"
**Penyebab**: Environment variable belum di set  
**Solusi**:
1. Di Vercel, pastikan `JWT_SECRET` sudah ditambahkan
2. Redeploy setelah menambah env variable
3. Tunggu 1-2 menit untuk propagate

### Error: "Email service failed"
**Penyebab**: Gmail credentials salah  
**Solusi**:
1. Pastikan `EMAIL_USER` dan `EMAIL_PASSWORD` benar
2. Buat Gmail App Password baru (jangan copy manual)
3. Check: "Less secure apps" DISABLED di Google Account

### Error: "Connection timeout"
**Penyebab**: Cold start atau database tidak merespon  
**Solusi**:
1. Tunggu 30 detik, coba lagi (cold start takes time)
2. Check Supabase project status di dashboard
3. Verify Supabase region accessible dari Vercel

---

## 📊 Monitoring & Logs

### Lihat Error Logs di Vercel
1. Buka project backend di Vercel
2. Klik **"Deployments"**
3. Pilih deployment terbaru
4. Klik **"Runtime Logs"** untuk melihat real-time logs
5. Klik **"Build Logs"** untuk melihat build errors

### Test dengan Curl
```bash
# Test health
curl https://your-backend-url.vercel.app/health

# Test login
curl -X POST https://your-backend-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@ecomputer.com","password":"adminpassword"}'
```

---

## 🎯 Quick Reference - Environment Variables Needed

```env
# DATABASE
DATABASE_URL=postgresql://postgres.[ID]:[PASS]@aws-0-[REGION].pooling.supabase.com:6543/postgres

# AUTH
JWT_SECRET=your-random-secret-key-at-least-32-characters-long

# EMAIL (untuk fitur OTP)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# MODE
NODE_ENV=production
```

---

## 🔗 Useful Links

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Vercel Runtime Logs](https://vercel.com/docs/deployments/development-logs)

---

## 📝 Next Steps

1. ✅ Setup Supabase project & import schema
2. ✅ Get connection pooling string
3. ✅ Add environment variables to Vercel
4. ✅ Push code & deploy
5. ✅ Test `/health` endpoint
6. ✅ Test `/api/auth/login`
7. ✅ Update frontend API URL ke backend Vercel URL

Good luck! 🚀
