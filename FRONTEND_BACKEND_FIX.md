# 🔴 EMERGENCY FIX - Frontend + Backend Integration Error

## Status Terkini
- ❌ Backend: Deployed tapi perlu DATABASE_URL + JWT_SECRET di env variables
- ❌ Frontend: Deployed tapi tidak tahu URL backend (404 error)

---

## 🚨 ACTION NOW: Find Backend URL

### Step 1: Get Your Backend URL on Vercel

**PENTING**: Saya perlu URL ini untuk fix frontend!

1. Buka https://vercel.com/dashboard
2. Di sidebar kiri, scroll dan **pilih Backend project**
   - Jangan pilih frontend, pilih yang backend
3. Copy domain utama, contoh: `https://ecomputer-backend-xxxxx.vercel.app`

**PASTE BACKEND URL KE SINI**:
```
BACKEND_URL: https://.....................
```

---

## ✅ Complete Setup Checklist

Setelah Anda kasih backend URL, ikuti checklist ini:

### A. BACKEND - Environment Variables (Vercel Dashboard)

**1. Buka Backend Project di Vercel**
- Settings → Environment Variables
- **Pastikan ada 4 variabel ini:**

| Nama | Nilai | Status |
|------|-------|--------|
| `DATABASE_URL` | `postgresql://postgres.[ID]:[PASS]@aws-0-[REGION].pooling.supabase.com:6543/postgres` | ✅ Harus pooling (port 6543) |
| `JWT_SECRET` | Random string min 32 char | ✅ Harus panjang & unik |
| `EMAIL_USER` | your-gmail@gmail.com | ⚠️ Jika ada OTP feature |
| `EMAIL_PASSWORD` | App password dari Gmail | ⚠️ Jika ada OTP feature |

**2. Checklist Database:**
- [ ] DATABASE_URL sudah set? 
- [ ] Pakai pooling endpoint (port 6543)? 
- [ ] Bukan direct connection (port 5432)?

### B. FRONTEND - Environment Variables (Vercel Dashboard)

**1. Buka Frontend Project di Vercel**
- Settings → Environment Variables
- **Add variabel baru:**

| Nama | Nilai |
|------|-------|
| `VITE_API_URL` | `YOUR_BACKEND_URL_HERE` |

**Contoh:**
```
VITE_API_URL=https://ecomputer-backend-xxxxx.vercel.app
```

---

## 🔄 Deploy & Test

### Step 1: Push Backend Code
```bash
cd backend
git add .
git commit -m "Fix: PostgreSQL pooling for Vercel"
git push
# Tunggu deploy selesai (status hijau ✅)
```

### Step 2: Check Backend Health
Buka di browser atau Postman:
```
GET https://YOUR_BACKEND_URL/health
```

**Expected (200 OK):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Jika ERROR:**
- Check DATABASE_URL di Vercel env variables
- Pastikan pooling endpoint, tidak direct
- Verify Supabase project masih aktif

### Step 3: Deploy Frontend
```bash
cd frontend
git add .
git commit -m "Fix: Connect frontend to backend Vercel URL"
git push
# Tunggu deploy selesai
```

### Step 4: Test Frontend
1. Buka frontend URL di browser
2. Click "Katalog" atau "/catalog"
3. Seharusnya produk muncul ✅

---

## 🧪 Full Test Flow

### Test 1: Backend Health
```
GET https://YOUR_BACKEND_URL/health
Response: { "status": "ok", "database": "connected" }
```

### Test 2: Frontend Catalog
```
Browser: https://YOUR_FRONTEND_URL/catalog
Should show products from database
```

### Test 3: Login
```
POST https://YOUR_BACKEND_URL/api/auth/login
Body: {
  "username": "admin@ecomputer.com",
  "password": "adminpassword"
}
Response: { "token": "...", "user": {...} }
```

### Test 4: Frontend Login
```
1. Buka https://YOUR_FRONTEND_URL/login
2. Masukkan: admin@ecomputer.com / adminpassword
3. Should login successfully ✅
```

---

## 🆘 Debug Checklist

Jika masih error:

- [ ] DATABASE_URL di backend env adalah pooling (port 6543)?
- [ ] DATABASE_URL di backend sudah di-set DI VERCEL (bukan local)?
- [ ] VITE_API_URL di frontend env adalah exact backend URL?
- [ ] Both backend & frontend sudah di-redeploy setelah set env?
- [ ] Tunggu 1-2 menit untuk env variables propagate?
- [ ] Clear browser cache (Ctrl+Shift+Delete)?
- [ ] Check Vercel Runtime Logs untuk error detail?

---

## 📊 Vercel Dashboard Links

**Backend:**
- Dashboard: https://vercel.com/dashboard
- Logs: Project → Deployments → Latest → Runtime Logs
- Env: Project → Settings → Environment Variables

**Frontend:**
- Same process, pilih frontend project

---

## ⏱️ Expected Timeline
- Setup env variables: 2 min
- Push code: 1 min
- Deployment: 2-5 min
- Testing: 2 min
- **Total: 10 minutes MAX**

---

## 💡 Pro Debugging Tips

### Cek Log Backend
1. Vercel Dashboard → Backend → Deployments → Latest
2. Click "Runtime Logs"
3. Search untuk error message
4. Common: "DATABASE_URL", "JWT_SECRET", "CONNECTION_REFUSED"

### Cek Log Frontend
1. Vercel Dashboard → Frontend → Deployments → Latest
2. Click "Runtime Logs"  
3. Search untuk API call errors

### Cek Browser Console
1. Open frontend URL
2. F12 → Console tab
3. Look for network errors atau API call logs

---

## 📝 Your Setup Info (FILL IN)

```
Backend URL: ___________________________
Frontend URL: __________________________
Database Pooling URL: __________________
JWT_SECRET: ____________________________  
```

---

**NEXT STEP: Reply dengan BACKEND_URL Anda, saya akan handle semuanya!** 🚀
