# 🚀 VERCEL DEPLOYMENT - STEP BY STEP

## ✅ Progress
- [x] Code pushed to GitHub
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Connected frontend to backend
- [ ] Testing

---

## 🔧 STEP 2: DEPLOY BACKEND KE VERCEL

### 2.1 Buka Vercel Dashboard
1. Pergi ke: **https://vercel.com/dashboard**
2. Login dengan GitHub account Anda

### 2.2 Tambah Project Backend
1. Klik **"Add New"** (tombol besar)
2. Pilih **"Project"**
3. Di dropdown **"Import Git Repository"**, cari repo Anda:
   - Cari: `ecomputer-store` atau nama repo Anda
   - Klik repo untuk select
   - Klik **"Import"**

### 2.3 Konfigurasi Backend

**Di halaman konfigurasi, isi:**

**Framework Preset**: 
- Cari dan select: **"Node.js"** atau **"Other"**

**Build Settings**:
- **Root Directory**: `./backend` ← PENTING!
- **Build Command**: `  `
- **Output Directory**: (kosongkan - biarkan default)
- **Install Command**: `npm install`

**Environment Variables** - ADD SEMUA INI:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.kfgitidlswfjmpltjmdm:Komputerisasi12%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | `your-secret-key-gausah-gampang` |
| `NODE_ENV` | `production` |
| `EMAIL_USER` | `benogntng5@gmail.com` |
| `EMAIL_PASSWORD` | `xithmfuuukgarsve` |

⚠️ **PENTING**: Pastikan semua env var sudah di-add sebelum klik Deploy!

### 2.4 Deploy Backend
1. Klik tombol **"Deploy"** (besar di bawah)
2. **Tunggu 5-10 menit** sampai status berubah jadi ✅ **Ready** (hijau)
3. Setelah selesai, catat **Backend URL** yang muncul:
   ```
   https://ecomputer-store-backend.vercel.app
   ```

✅ **Checkpoint**: Buka URL + `/health` di browser:
```
https://ecomputer-store-backend.vercel.app/health
```
Harus muncul JSON: `{"status":"ok","database":"connected"}`

---

## 🎨 STEP 3: DEPLOY FRONTEND KE VERCEL

### 3.1 Tambah Project Frontend
1. Di Vercel Dashboard, klik **"Add New"** lagi
2. Pilih **"Project"**
3. Select repo yang sama
4. Klik **"Import"**

### 3.2 Konfigurasi Frontend

**Framework Preset**:
- Select: **"Vite"** (atau auto-detect)

**Build Settings**:
- **Root Directory**: `./frontend` ← PENTING!
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables** - ADD INI:

| Name | Value | Note |
|------|-------|------|
| `VITE_API_URL` | `https://ecomputer-store-backend.vercel.app` | Ganti dengan Backend URL Anda dari Step 2.4 |

### 3.3 Deploy Frontend
1. Klik **"Deploy"**
2. **Tunggu 3-5 menit** sampai ✅ **Ready**
3. Catat **Frontend URL**:
   ```
   https://ecomputer-store-frontend.vercel.app
   ```

✅ **Checkpoint**: Buka Frontend URL di browser
- Halaman harus load
- Tidak boleh ada error di console (F12)

---

## 🔗 STEP 4: UPDATE FRONTEND API URL

Kita perlu update Frontend env var dengan Backend URL yang sudah di-deploy.

### 4.1 Update Frontend Environment Variable
1. Di Vercel Dashboard, buka **Frontend project**
2. Klik tab **"Settings"**
3. Di sidebar kiri, klik **"Environment Variables"**
4. Cari variable `VITE_API_URL`
5. Edit valuenya:
   - **Old**: (whatever you had)
   - **New**: `https://ecomputer-store-backend.vercel.app` (from Step 2.4)
6. Klik **"Save"**

### 4.2 Redeploy Frontend
1. Kembali ke halaman project Frontend
2. Klik tab **"Deployments"** (atau "Builds")
3. Di deployment teratas, klik **"..."** (tiga titik)
4. Pilih **"Redeploy"**
5. Klik **"Redeploy"** lagi di popup confirm
6. **Tunggu 3-5 menit** sampai ✅ **Ready**

---

## 🧪 STEP 5: TESTING PRODUCTION

### 5.1 Test Backend Health
```
https://ecomputer-store-backend.vercel.app/health
```
✅ Harus return:
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

### 5.2 Test Frontend Load
1. Buka Frontend URL
2. Halaman harus load dengan baik
3. Buka DevTools (F12)
4. Tab **Console** - tidak boleh ada error merah

### 5.3 Test API Call
1. Di Frontend, coba **Login**:
   - Email: `admin@example.com`
   - Password: `admin123`
2. Jika login berhasil:
   - ✅ Database connected
   - ✅ API working
   - ✅ Frontend-Backend komunikasi OK
3. Cek DevTools Network tab:
   - Request harus ke Backend URL
   - Status 200 OK (hijau)

### 5.4 Test Other Features
- [ ] Buka halaman Produk
- [ ] Search produk
- [ ] Lihat detail produk
- [ ] Tambah ke cart
- [ ] Lihat wishlist
- [ ] Lihat profile admin

---

## ✅ DEPLOYMENT COMPLETE!

**Jika semua test passed:**

✅ Backend deployed dan connected ke Supabase  
✅ Frontend deployed dan connected ke Backend  
✅ API working  
✅ Database working  

**Aplikasi Anda sekarang LIVE di Vercel!** 🎉

---

## 🆘 JIKA ADA ERROR

**Backend health check error?**
- Check Vercel logs: Project → Deployments → Latest → Logs
- Verify DATABASE_URL format
- Ensure port 6543 (pooling port)

**Frontend blank atau error?**
- Clear browser cache (Ctrl+Shift+Delete)
- Check VITE_API_URL di env vars
- Redeploy frontend

**Login error?**
- Check backend logs
- Verify JWT_SECRET set
- Test lokal dulu

---

## 📋 URLS TO BOOKMARK

**Backend**: `https://ecomputer-store-backend.vercel.app`  
**Frontend**: `https://ecomputer-store-frontend.vercel.app`  
**Health Check**: `https://ecomputer-store-backend.vercel.app/health`  
**Vercel Dashboard**: https://vercel.com/dashboard  
**Supabase Dashboard**: https://supabase.com/dashboard  
**GitHub**: https://github.com/fthurrahman289-gif/ecomputer-store  

---

**Siap mulai? Ikuti step di atas! ☝️**
