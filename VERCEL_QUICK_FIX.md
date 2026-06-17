# 🔧 IMMEDIATE ACTION ITEMS - Fix Login Error on Vercel

## ⚡ CRITICAL: Your deployment is failing because of DATABASE CONNECTION POOLING issues

Follow these steps **in order** to fix the 500 error on login:

---

## STEP 1: Verify Supabase Connection (5 minutes)

### 1.1 Check if you have Supabase Database
- [ ] Buka https://supabase.com/dashboard
- [ ] Login dengan akun Anda
- [ ] Pastikan ada project database (lihat di sidebar kiri)

### 1.2 Get Connection Pooling String
⚠️ **CRITICAL**: Must use pooling endpoint, NOT direct connection!

**Langkah:**
1. Di Supabase, klik project Anda
2. Sidebar kanan → **Settings**
3. Pilih **Database**
4. Scroll ke **"Connection pooling"**
5. **Copy** connection string yang ditampilkan
6. Periksa: URL harus punya port **6543**, contoh:
   ```
   postgresql://postgres.xxxxxx:[PASSWORD]@aws-0-xxx.pooling.supabase.com:6543/postgres
   ```

---

## STEP 2: Update Vercel Environment Variables (5 minutes)

### 2.1 Add DATABASE_URL
1. Buka Vercel dashboard → Project backend
2. **Settings** → **Environment Variables**
3. Klik **"Add"**
4. **Name**: `DATABASE_URL`
5. **Value**: Paste connection pooling string dari Supabase
6. **Environment**: Select production (dan preview jika mau)
7. Klik **Save**

### 2.2 Verify Other Variables
Pastikan sudah ada (jika tidak, add sekarang):
- [ ] `JWT_SECRET` → Random string minimal 32 karakter
- [ ] `EMAIL_USER` → Gmail Anda
- [ ] `EMAIL_PASSWORD` → App password dari Gmail
- [ ] `NODE_ENV` → `production`

**Jika belum ada EMAIL_USER & EMAIL_PASSWORD:**
1. Buka https://myaccount.google.com/security
2. Scroll ke "App passwords"
3. Select Mail + Windows Computer
4. **Generate** → Copy password
5. Add ke Vercel environment variables

---

## STEP 3: Update Frontend API URL (2 minutes)

**PENTING**: Frontend harus tahu URL backend baru di Vercel!

### 3.1 Update Frontend .env
```env
VITE_API_URL=https://your-backend-vercel-url.vercel.app
```

Contoh:
```env
VITE_API_URL=https://ecomputer-store-tawny.vercel.app
```

### 3.2 Atau Update api.js jika tidak ada .env
Edit [frontend/src/services/api.js](../frontend/src/services/api.js):
```javascript
const API_URL = process.env.VITE_API_URL || 'https://ecomputer-store-tawny.vercel.app';
```

---

## STEP 4: Deploy Changes (3 minutes)

### 4.1 Push Backend Changes
```bash
cd backend
git add .
git commit -m "Fix: PostgreSQL connection pooling for Vercel serverless"
git push
```

Vercel akan otomatis deploy. Tunggu status menjadi ✅ (hijau).

### 4.2 Deploy Frontend (jika sudah update URL)
```bash
cd frontend
git add .
git commit -m "Update backend API URL for Vercel deployment"
git push
```

---

## STEP 5: Test (3 minutes)

### 5.1 Test Backend Health
Buka di browser atau Postman:
```
GET https://your-backend-url.vercel.app/health
```

**Expected response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-06-17T10:00:00.000Z"
}
```

### 5.2 Test Login
**POST** to `https://your-backend-url.vercel.app/api/auth/login`

**Request:**
```json
{
  "username": "admin@ecomputer.com",
  "password": "adminpassword"
}
```

**Expected response (200 OK):**
```json
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### 5.3 Test Frontend Login
1. Buka frontend URL di browser
2. Try login dengan:
   - Username: `admin@ecomputer.com`
   - Password: `adminpassword`
3. Seharusnya berhasil! ✅

---

## 🆘 If Still Getting 500 Error

### Debug: Check Vercel Logs
1. Buka Vercel dashboard → Backend project
2. **Deployments** → Pilih latest
3. **Runtime Logs** → Lihat error message
4. Common errors:
   - `CONNECTION_REFUSED` → Database URL salah
   - `JWT_SECRET not defined` → Env variable tidak set, REDEPLOY setelah add
   - `ETIMEDOUT` → Cold start, tunggu 30 detik, retry

### Debug: Test Direct Connection (Advanced)
Buka terminal & test database connection:
```bash
# Linux/Mac
psql "postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooling.supabase.com:6543/postgres"

# Windows (download psql atau gunakan Supabase SQL Editor)
```

---

## 📞 Need Help?

Jika masih error setelah langkah di atas:

1. **Screenshot error message dari Vercel logs**
2. **Pastikan sudah follow semua step di atas**
3. **Check:** DATABASE_URL correct + JWT_SECRET set
4. **Try:** Delete & re-create environment variables
5. **If stuck:** Contact support atau regenerate deployment

---

## ✅ Checklist - Mark sebagai done setiap langkah

- [ ] Sudah verify Supabase project & schema imported
- [ ] Sudah copy pooling connection string (port 6543)
- [ ] Sudah update DATABASE_URL di Vercel
- [ ] Sudah verify JWT_SECRET, EMAIL variables
- [ ] Sudah update frontend API URL
- [ ] Sudah push changes (backend & frontend)
- [ ] Sudah test `/health` endpoint (200 OK)
- [ ] Sudah test `/api/auth/login` (200 OK)
- [ ] Sudah test frontend login (success ✅)

**Total time: ~20 minutes**

---

💡 **Pro tip**: Simpan URL backend Anda untuk reference:
```
Backend URL: https://your-backend-vercel-url.vercel.app
```

Good luck! 🚀
