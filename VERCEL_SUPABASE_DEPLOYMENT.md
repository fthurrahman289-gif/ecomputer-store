# 🚀 PANDUAN DEPLOY KE VERCEL + SUPABASE (STEP-BY-STEP)

**Status**: Ready for Production Deployment  
**Database**: PostgreSQL via Supabase  
**Platform**: Vercel (Frontend + Backend)  
**Last Updated**: 2024

---

## ✅ CHECKLIST SEBELUM MULAI

- [ ] Sudah punya akun GitHub (link ke repository)
- [ ] Sudah punya akun Vercel (login via GitHub recommended)
- [ ] Sudah punya akun Supabase
- [ ] Sudah punya Gmail untuk Email OTP (optional)
- [ ] Git sudah installed & configured

---

## 📦 STEP 1: Setup Supabase Database (10 menit)

### 1.1 Buat Project Baru di Supabase

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klik **"New Project"**
3. Isi form:
   - **Name**: `ecomputer` (atau nama project Anda)
   - **Password**: JANGAN LUPA! Simpan dengan aman
   - **Region**: `Singapore` (terdekat ke Indonesia)
4. Tunggu 2-3 menit sampai project selesai di-setup

### 1.2 Import Database Schema

1. Di dashboard Supabase, klik tab **SQL Editor** (sidebar kiri)
2. Klik **"New Query"**
3. Di [database/schema.postgres.sql](./database/schema.postgres.sql):
   - Copy SELURUH isi file
4. Paste ke SQL Editor Supabase
5. Klik tombol **"Run"** (atau Ctrl+Enter)
6. ✅ Tunggu sampai success - Anda akan melihat tabel-tabel terbuat

**Verifikasi**: Di tab "Tables" (sidebar), pastikan sudah ada:
- `users`
- `products`
- `orders`
- `order_items`
- `wishlist`
- `vouchers`
- dll

### 1.3 Get Connection String (PENTING!)

⚠️ **HARUS GUNAKAN CONNECTION POOLING** (PgBouncer), bukan direct connection!

**Langkah:**
1. Di Supabase, klik **Settings** (sidebar bawah)
2. Pilih **Database** (di sebelah kiri)
3. Scroll ke bagian **"Connection pooling"**
4. Pastikan mode: **"Transaction"** (default)
5. **COPY** connection string yang ditampilkan:
   ```
   postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooling.supabase.com:6543/postgres
   ```

**PENTING**: 
- Port harus **6543** (bukan 5432)
- Simpan string ini di tempat aman - kita butuh di Vercel!

### 1.4 Test Connection Lokal (Optional)

Ingin test database lokal dulu?

```bash
# Install PostgreSQL client (Windows)
# Download dari: https://www.postgresql.org/download/windows/
# Jalankan psql:

psql -h aws-0-xxx.pooling.supabase.com -U postgres -d postgres -p 6543
# Masukkan password Supabase Anda
# Jika berhasil, ketik: \dt (lihat semua tabel)
# Keluar: \q
```

---

## 🌐 STEP 2: Setup Frontend di Vercel (5 menit)

### 2.1 Deploy Frontend Project

1. Buka [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klik **"Add New..."** → **"Project"**
3. Import GitHub repository Anda:
   - Pilih repo `penjualan komputer`
   - Klik **"Import"**

### 2.2 Konfigurasi Frontend

Di form Vercel:

**Framework Preset**: Vite (atau Biarkan Auto-detect)

**Build Settings**:
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `./frontend` ← PENTING!

**Environment Variables** - Add yang ini:
| Name | Value | Deskripsi |
|------|-------|-----------|
| `VITE_API_URL` | `https://your-backend-vercel-url.vercel.app` | Akan diisi setelah backend selesai deploy |

⚠️ **BELUM ADA URL BACKEND?** 
- Untuk sekarang, biarkan kosong atau isi dengan `/api`
- Nanti kita update setelah backend di-deploy

### 2.3 Klik Deploy

Tunggu hingga status menjadi ✅ **Ready** (hijau). Ini butuh 3-5 menit.

**Setelah selesai**, Anda akan dapat:
- ✅ Frontend URL (contoh: `https://ecomputer-frontend.vercel.app`)
- ✅ QR code untuk preview

---

## ⚙️ STEP 3: Setup Backend di Vercel (10 menit)

### 3.1 Deploy Backend Project

1. Di Vercel dashboard, klik **"Add New..."** → **"Project"**
2. Import repository GitHub yang sama
3. Klik **"Import"**

### 3.2 Konfigurasi Backend

Di form Vercel:

**Framework Preset**: Other (Node.js)

**Build Settings**:
- **Build Command**: `npm install`
- **Output Directory**: `.` (biarkan kosong/default)
- **Root Directory**: `./backend` ← PENTING!

### 3.3 Add Environment Variables di Backend

Klik **"Add Environment Variable"** dan tambahkan:

#### CRITICAL - Database Connection

| Name | Value | Catatan |
|------|-------|---------|
| `DATABASE_URL` | `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooling.supabase.com:6543/postgres` | COPY dari Supabase Step 1.3 |
| `NODE_ENV` | `production` | Mode production |

#### Authentication

| Name | Value | Catatan |
|------|-------|---------|
| `JWT_SECRET` | `your-secret-key-min-32-chars-$up3r$3cur3` | Buat random string panjang! |

#### Email OTP (Optional)

Jika mau fitur kirim OTP via email:

| Name | Value | Catatan |
|------|-------|---------|
| `EMAIL_USER` | `your-gmail@gmail.com` | Gmail Anda |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | App Password (bukan password akun!) |

**Cara dapat App Password Gmail:**
1. Buka [myaccount.google.com/security](https://myaccount.google.com/security)
2. Pastikan **2-Factor Authentication** sudah enabled
3. Scroll ke **"App passwords"**
4. Select: **Mail** | **Windows Computer**
5. Klik **Generate**
6. Copy password 16 karakter yang muncul

### 3.4 Verifikasi Konfigurasi vercel.json

Backend sudah punya file [backend/vercel.json](./backend/vercel.json) yang benar:

```json
{
  "version": 2,
  "buildCommand": "npm install",
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node",
      "config": {
        "nodeVersion": "18.x"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.js"
    }
  ]
}
```

✅ Sudah benar, tidak perlu diubah.

### 3.5 Deploy Backend

Klik **"Deploy"** dan tunggu hingga ✅ **Ready**.

Setelah selesai, Anda akan dapat **Backend URL** (contoh: `https://ecomputer-backend.vercel.app`)

---

## 🔗 STEP 4: Connect Frontend ↔ Backend (5 menit)

Sekarang kita perlu memberitahu Frontend di mana Backend-nya.

### 4.1 Update Frontend Environment Variable

1. Buka Vercel Dashboard → Klik project **Frontend**
2. Buka tab **Settings** → **Environment Variables**
3. Cari variable `VITE_API_URL`
4. **Edit** dan ubah value menjadi:
   ```
   https://your-backend-vercel-url.vercel.app
   ```
   
   Contoh lengkap:
   ```
   https://ecomputer-backend.vercel.app
   ```

5. Klik **Save**

### 4.2 Redeploy Frontend

1. Kembali ke halaman project Frontend
2. Klik **"Deployments"** tab
3. Di deployment terbaru, klik **"Redeploy"**
4. Klik **"Redeploy"** lagi untuk confirm
5. Tunggu hingga ✅ selesai (2-3 menit)

---

## 🧪 STEP 5: Testing (5 menit)

### 5.1 Test Health Check Backend

Buka di browser:
```
https://your-backend-vercel-url.vercel.app/health
```

Contoh:
```
https://ecomputer-backend.vercel.app/health
```

✅ **Jika berhasil**, Anda akan lihat:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

❌ **Jika error**, debug di Vercel → **Logs** tab.

### 5.2 Test Frontend

1. Buka Frontend URL: `https://your-frontend-vercel-url.vercel.app`
2. Coba klik navigasi, buka product, login
3. Check browser console (F12) untuk API errors

### 5.3 Test Login API

Coba login dengan test account:
```
Email: admin@example.com
Password: admin123
```

Jika berhasil login:
✅ Database terhubung  
✅ API berfungsi  
✅ Frontend-Backend komunikasi lancar  

---

## 🐛 TROUBLESHOOTING

### ❌ Error: "Cannot connect to database"

**Solusi:**
1. Verifikasi `DATABASE_URL` di Vercel Environment Variables
2. Pastikan port **6543** (bukan 5432)
3. Check Supabase dashboard - project masih aktif?
4. Lihat Vercel Logs: **Settings** → **Logs** → cari error message

```bash
# Untuk debug lokal:
cd backend
echo DATABASE_URL=your-connection-string > .env
npm run dev
# Cek apakah error muncul lokal juga
```

### ❌ Error: "CORS error" di Frontend

**Solusi:**
1. Backend sudah include CORS? Check [backend/src/index.js](./backend/src/index.js):
   ```javascript
   app.use(cors());
   ```
   Sudah ada ✅

2. Cek `VITE_API_URL` di Frontend environment variables
3. Browser console (F12) → lihat exact error message

### ❌ Error: "JWT_SECRET not found"

**Solusi:**
1. Add `JWT_SECRET` di Vercel backend environment variables
2. Buat random string minimal 32 karakter
3. Redeploy backend

### ❌ Deployment hang atau timeout

**Solusi:**
1. Check backend `package.json` - apakah ada scripts yang error?
2. Lihat Vercel build logs untuk melihat di mana stuck
3. Coba re-deploy dari GitHub push:
   ```bash
   cd backend
   git add .
   git commit -m "Fix: Deployment configuration"
   git push
   # Vercel akan auto-deploy
   ```

---

## 📊 NEXT STEPS (Production Checklist)

Setelah live di Vercel:

- [ ] Test semua endpoint API dari frontend
- [ ] Test login/register dengan akun baru
- [ ] Test pembayaran (jika ada integrasi payment)
- [ ] Monitor Vercel logs untuk errors
- [ ] Setup analytics/monitoring (optional)
- [ ] Setup custom domain (optional)
- [ ] Enable auto-backups di Supabase

---

## 🔐 Security Notes

⚠️ **JANGAN PERNAH:**
- [ ] Commit `.env` files ke GitHub
- [ ] Share `DATABASE_URL` atau `JWT_SECRET` public
- [ ] Gunakan weak passwords

✅ **LAKUKAN:**
- [ ] Gunakan Environment Variables di Vercel
- [ ] Rotate secrets secara berkala
- [ ] Monitor logs untuk suspicious activity
- [ ] Keep dependencies updated: `npm update`

---

## 📞 Support Links

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Express.js**: https://expressjs.com
- **React + Vite**: https://vitejs.dev

---

**Siap deploy? Mari kita lakukan ini step-by-step! 🎉**
