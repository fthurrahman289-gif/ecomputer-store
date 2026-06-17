# 📚 PANDUAN DEPLOYMENT KE VERCEL

Project ini adalah **monorepo** dengan backend (Express.js) dan frontend (React + Vite) yang perlu di-deploy secara terpisah.

---

## 📋 Persiapan Awal

### 1. Push Project ke GitHub
Pastikan project sudah di-push ke repository GitHub:
```bash
# Inisialisasi git (jika belum)
git init

# Tambah remote
git remote add origin https://github.com/username/repository-name.git

# Commit dan push
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy Frontend ke Vercel

### Langkah 1: Hubungkan Repository ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Login/Sign Up dengan GitHub
3. Klik **"New Project"**
4. Pilih repository `penjualan-komputer`
5. **Framework Preset**: Pilih **Vite**

### Langkah 2: Konfigurasi Build Settings
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Langkah 3: Deploy
- Vercel akan otomatis build dan deploy
- Frontend akan tersedia di: `https://your-project.vercel.app`

---

## 🔧 Deploy Backend ke Vercel

### Langkah 1: Setup Backend di Vercel
1. Buat project baru di Vercel untuk backend
2. Pilih repository yang sama
3. **Root Directory**: `backend`
4. **Framework**: Node.js akan terdeteksi otomatis
5. **Build Command**: `npm install` (kosongkan jika tidak perlu)
6. **Start Command**: `node src/index.js`

### Langkah 2: Tambah Environment Variables
Di Vercel dashboard, tambahkan variables berikut di **Settings > Environment Variables**:

```
PORT=3001
JWT_SECRET=supersecretkeyforecomputerapp123!
DB_SERVER=your-sql-server-hostname
DB_DATABASE=ecomputer
DB_USER=sa (atau username SQL Server Anda)
DB_PASSWORD=your-sql-server-password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

---

## 🗄️ Setup Database untuk Vercel Deployment

### Pilihan 1: Gunakan Azure SQL Database (Recommended)
1. Buat Azure SQL Database:
   - Buka [portal.azure.com](https://portal.azure.com)
   - Create resource → SQL Database
   - Buat SQL Server baru atau gunakan yang existing
   - Konfigurasi firewall untuk allow Vercel:
     - **Firewall rules** → Add client IP: `0.0.0.0 - 255.255.255.255`

2. Jalankan `database/schema.sql` di Azure SQL Database

3. Update environment variables di Vercel:
```
DB_SERVER=your-server.database.windows.net
DB_DATABASE=ecomputer
DB_USER=sqladmin
DB_PASSWORD=your-password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

### Pilihan 2: Gunakan SQL Server Lokal (untuk Development)
Jika masih development, bisa tetap menggunakan SQL Server lokal:
- Backend Vercel akan perlu akses ke server lokal Anda
- Pastikan firewall allow koneksi ke port 1433

---

## 🔗 Update Frontend API URL

### Langkah 1: Update API Endpoint
Buka `frontend/src/services/api.js` dan update base URL:

```javascript
const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  'https://your-backend-vercel-url.vercel.app/api';

// atau gunakan environment variables di Vercel
```

### Langkah 2: Tambah Environment Variable di Frontend
Di Vercel frontend project settings, tambahkan:
```
VITE_API_URL=https://your-backend-vercel-url.vercel.app
```

### Langkah 3: Update Frontend Code
Pastikan frontend menggunakan variabel ini:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## 📝 Konfigurasi Domain Custom (Optional)

1. Di Vercel Dashboard → Settings → Domains
2. Tambahkan domain custom Anda
3. Update DNS records sesuai instruksi Vercel

---

## 🧪 Testing Deployment

### Cek Frontend
```
https://your-frontend.vercel.app
```

### Cek Backend API
```bash
curl https://your-backend.vercel.app/api/health
# atau endpoint mana saja
```

### Test Login
1. Buka frontend
2. Login dengan:
   - Email: `admin@ecomputer.com`
   - Password: `adminpassword`

---

## ⚠️ Troubleshooting

### Error: Database Connection Failed
- Pastikan SQL Server accessible dari Vercel
- Cek firewall settings
- Verifikasi credentials di environment variables

### Error: CORS Error
- Pastikan backend CORS middleware mengizinkan frontend URL:
```javascript
// backend/src/index.js
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000']
}));
```

### Error: File Upload Not Working
- File uploads tersimpan lokal di `/uploads`
- Vercel serverless tidak support persistent storage
- **Solusi**: Gunakan cloud storage (AWS S3, Cloudinary, dll)

---

## 📌 Checklist Deploy

- [ ] Project sudah di GitHub
- [ ] Frontend dan Backend sudah connected ke Vercel
- [ ] Environment variables sudah set di Vercel
- [ ] Database sudah setup (Azure SQL atau SQL Server lokal)
- [ ] Frontend API URL sudah updated
- [ ] Vercel domains sudah dikonfigurasi
- [ ] Testing frontend & backend works properly

---

## 🚀 Quick Deploy Commands (Alternative)

Jika ingin deploy dengan Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Deploy backend
cd ../backend
vercel --prod
```

---

Untuk pertanyaan atau bantuan lebih lanjut, hubungi tim development!
