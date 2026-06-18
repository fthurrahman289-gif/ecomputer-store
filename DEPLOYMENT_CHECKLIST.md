# ✅ DEPLOYMENT CHECKLIST - E-Computer Vercel + Supabase

**Target**: Deploy aplikasi ke Vercel dengan database Supabase  
**Estimated Time**: 30-45 menit  
**Status**: Ready to deploy

---

## 🔐 STEP 1: Supabase Setup [10 MENIT]

- [ ] **1.1** Login ke https://supabase.com/dashboard
- [ ] **1.2** Buat project baru:
  - [ ] Name: `ecomputer`
  - [ ] Region: `Singapore`
  - [ ] Password: **SIMPAN DI TEMPAT AMAN**
  - [ ] Tunggu 2-3 menit setup selesai
  
- [ ] **1.3** Import database schema:
  - [ ] Buka **SQL Editor** di Supabase
  - [ ] Buat **New Query**
  - [ ] Copy-paste isi file: [database/schema.postgres.sql](./database/schema.postgres.sql)
  - [ ] Klik **Run**
  - [ ] Tunggu selesai ✅
  
- [ ] **1.4** Get Connection Pooling String:
  - [ ] Buka **Settings** → **Database**
  - [ ] Scroll ke **Connection pooling**
  - [ ] Copy string (gunakan mode "Transaction")
  - [ ] Verifikasi ada port **6543**
  - [ ] **SIMPAN SEMUA DI NOTEPAD** - format:
    ```
    postgresql://postgres.xxxxx:PASSWORD@aws-0-xxx.pooling.supabase.com:6543/postgres
    ```

### ✅ Checkpoint 1: Verifikasi Supabase
```bash
# Optional: Test connection lokal
psql -h aws-0-xxx.pooling.supabase.com -p 6543 -U postgres -d postgres
# (masukkan password, ketik: \dt untuk lihat tabel)
# Keluar: \q
```

---

## 🚀 STEP 2: Frontend Deploy [8 MENIT]

- [ ] **2.1** Buka https://vercel.com/dashboard
- [ ] **2.2** Klik **"Add New..." → "Project"**
- [ ] **2.3** Select GitHub repository: `penjualan komputer`
- [ ] **2.4** Konfigurasi:
  - [ ] **Root Directory**: `./frontend`
  - [ ] **Framework**: `Vite` (atau auto-detect)
  - [ ] **Build Command**: `npm install && npm run build`
  - [ ] **Output Directory**: `dist`

- [ ] **2.5** Add Environment Variables:
  - [ ] Name: `VITE_API_URL`
  - [ ] Value: (LEAVE EMPTY FOR NOW - will update after backend deploy)
  - [ ] Environment: Production + Preview

- [ ] **2.6** Klik **"Deploy"**
- [ ] **2.7** Tunggu hingga **✅ Ready** (3-5 menit)
- [ ] **2.8** Catat Frontend URL:
  ```
  https://your-frontend-name.vercel.app
  ```

### ✅ Checkpoint 2: Frontend Deployed
- Akses Frontend URL di browser
- Lihat homepage loading (walaupun backend belum ada)

---

## ⚙️ STEP 3: Backend Deploy + Environment Setup [15 MENIT]

### 3.1 Deploy Backend Project
- [ ] **3.1.1** Di Vercel dashboard, klik **"Add New..." → "Project"**
- [ ] **3.1.2** Select repository: `penjualan komputer`
- [ ] **3.1.3** Konfigurasi:
  - [ ] **Root Directory**: `./backend`
  - [ ] **Framework**: `Other (Node.js)`
  - [ ] **Build Command**: `npm install`
  - [ ] **Output Directory**: (kosongkan/default)

### 3.2 Add Environment Variables (CRITICAL!)

- [ ] **3.2.1** DATABASE CONNECTION:
  - [ ] Variable Name: `DATABASE_URL`
  - [ ] Value: **PASTE dari Supabase** (Step 1.4)
  - [ ] Environment: Production + Preview
  - [ ] Klik Save

- [ ] **3.2.2** JWT SECRET:
  - [ ] Variable Name: `JWT_SECRET`
  - [ ] Value: Generate random string (recommend: `openssl rand -base64 32`)
  - [ ] Atau copy: `your-super-secret-key-min-32-chars-$up3r$3cur3k3y123`
  - [ ] Environment: Production + Preview

- [ ] **3.2.3** NODE ENVIRONMENT:
  - [ ] Variable Name: `NODE_ENV`
  - [ ] Value: `production`
  - [ ] Environment: Production + Preview

- [ ] **3.2.4** EMAIL OTP (Optional):
  - [ ] Variable Name: `EMAIL_USER`
  - [ ] Value: Your Gmail (example: `myname@gmail.com`)
  - [ ] Environment: Production + Preview
  
  - [ ] Variable Name: `EMAIL_PASSWORD`
  - [ ] Value: App Password dari Gmail (16 chars, dari: https://myaccount.google.com/security → App passwords)
  - [ ] Environment: Production + Preview

- [ ] **3.2.5** Klik **"Deploy"**
- [ ] **3.2.6** Tunggu hingga **✅ Ready** (5-10 menit)
- [ ] **3.2.7** Catat Backend URL:
  ```
  https://your-backend-name.vercel.app
  ```

### ✅ Checkpoint 3: Backend Deployed
- [ ] Buka di browser: `https://your-backend-name.vercel.app/health`
- [ ] Harus melihat:
  ```json
  {"status":"ok","database":"connected","timestamp":"..."}
  ```

---

## 🔗 STEP 4: Connect Frontend ↔ Backend [5 MENIT]

- [ ] **4.1** Kembali ke **Frontend project** di Vercel
- [ ] **4.2** Buka **Settings → Environment Variables**
- [ ] **4.3** Edit variable `VITE_API_URL`:
  - [ ] Value: `https://your-backend-name.vercel.app`
  - [ ] Klik Save
  
- [ ] **4.4** Buka tab **"Deployments"**
- [ ] **4.5** Di deployment terbaru, klik **"..."** → **"Redeploy"**
- [ ] **4.6** Confirm klik **"Redeploy"**
- [ ] **4.7** Tunggu ✅ Ready (2-3 menit)

### ✅ Checkpoint 4: Frontend & Backend Connected
- [ ] Buka Frontend URL
- [ ] Buka Browser DevTools (F12)
- [ ] Lihat Network tab - API calls harus ke backend URL

---

## 🧪 STEP 5: Testing & Verification [5 MENIT]

### Test 5.1: Health Check
- [ ] **5.1.1** Buka: `https://your-backend-vercel-url.vercel.app/health`
- [ ] **5.1.2** Harus return status "ok"

### Test 5.2: Frontend Load
- [ ] **5.2.1** Buka Frontend URL
- [ ] **5.2.2** Halaman harus load tanpa error
- [ ] **5.2.3** Buka DevTools (F12) → Console
- [ ] **5.2.4** Tidak boleh ada error merah

### Test 5.3: API Call
- [ ] **5.3.1** Coba login dengan test account:
  ```
  Email: admin@example.com
  Password: admin123
  ```
- [ ] **5.3.2** Jika berhasil login:
  - ✅ Database connected
  - ✅ API working
  - ✅ Frontend-Backend communication OK

### Test 5.4: Check Logs
- [ ] **5.4.1** Backend: Vercel → Project → Deployments → Latest → Logs
- [ ] **5.4.2** Cari error atau warning messages
- [ ] **5.4.3** Harus ada: `✅ Connected to PostgreSQL Database`

---

## ❌ TROUBLESHOOTING

### Problem: Health check returns error

**Debug:**
```bash
# Check environment variables
# 1. Vercel backend → Settings → Environment Variables
# 2. Verify DATABASE_URL format has port 6543
# 3. Test connection lokal dengan psql command

# Check logs
# Vercel → Deployments → Latest → Logs
# Cari "DATABASE_URL" atau error messages
```

**Fix:**
- [ ] Verifikasi `DATABASE_URL` exact format
- [ ] Pastikan port **6543** (pooling port)
- [ ] Redeploy backend setelah update env var

### Problem: Frontend shows "Cannot connect to API"

**Debug:**
- [ ] Check `VITE_API_URL` di Frontend env vars
- [ ] Browser console (F12) → lihat exact error
- [ ] Check backend health endpoint works

**Fix:**
- [ ] Update `VITE_API_URL` ke backend URL
- [ ] Redeploy frontend
- [ ] Clear browser cache (Ctrl+Shift+Delete)

### Problem: Login returns 500 error

**Debug:**
- [ ] Check backend logs: Vercel Deployments → Logs
- [ ] Cari error message database atau JWT
- [ ] Verify environment variables set

**Fix:**
- [ ] Ensure all env vars added (DATABASE_URL, JWT_SECRET)
- [ ] Redeploy backend
- [ ] Test health check again

---

## 📋 PRODUCTION CHECKLIST

**After deployment is live:**

- [ ] Test all pages load correctly
- [ ] Test login/register functionality
- [ ] Test product catalog & search
- [ ] Test add to cart & checkout
- [ ] Monitor Vercel logs for errors (first 24 hours)
- [ ] Setup Supabase backups (recommended)
- [ ] Add custom domain (optional)

---

## 🔐 SECURITY REMINDERS

- [ ] ✅ **DATABASE_URL** aman di Vercel (tidak di GitHub)
- [ ] ✅ **JWT_SECRET** minimal 32 karakter & random
- [ ] ✅ **EMAIL_PASSWORD** menggunakan App Password, bukan real password
- [ ] ✅ Tidak commit `.env` ke GitHub
- [ ] ✅ Regularly check logs untuk suspicious activity

---

## 📞 QUICK LINKS

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub: https://github.com/your-username/penjualan-komputer
- Frontend URL: `https://your-frontend-vercel-url.vercel.app`
- Backend URL: `https://your-backend-vercel-url.vercel.app`
- Health Check: `https://your-backend-vercel-url.vercel.app/health`

---

## 🎯 SUMMARY

**What we're doing:**
1. Create Supabase PostgreSQL database ✅
2. Deploy Frontend to Vercel ✅
3. Deploy Backend to Vercel ✅
4. Connect Frontend to Backend ✅
5. Test everything works ✅

**Time**: 30-45 minutes total  
**Result**: Live production e-commerce platform!

---

**Ready? Let's go! Follow each step carefully.** 🚀
