# E-Computer E-Commerce Platform

Sistem e-commerce penjualan komputer, laptop, dan aksesoris modern dengan arsitektur bersih (*clean architecture*).

---

## 🛠️ Stack Teknologi

- **Frontend**: React.js (Vite) + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express.js + REST API
- **Database**: Microsoft SQL Server
- **Autentikasi**: JWT (JSON Web Token) dengan penyimpanan terenkripsi password (bcryptjs)
- **Upload File**: Multer (untuk menyimpan bukti transfer pembayaran secara lokal)

---

## 📁 Struktur Folder Project

```
penjualan komputer/
├── database/
│   └── schema.sql           # Script DDL SQL Server + Seed Data Dummy
├── backend/
│   ├── src/
│   │   ├── config/          # Pool Koneksi Database
│   │   ├── controllers/     # Logika Kontroler API
│   │   ├── middleware/      # Auth JWT & Upload Handler
│   │   ├── routes/          # Definisi Rute Express API
│   │   └── index.js         # Entrypoint utama server
│   ├── uploads/             # Bukti Transfer Pembayaran yang diunggah
│   ├── .env                 # Konfigurasi Environment Backend
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Navbar, Footer dengan Chat WA Floating
    │   ├── context/         # Auth, Cart, Wishlist, Compare Global State
    │   ├── pages/           # View: Home, Catalog, Detail, Compare, Admin, dll.
    │   ├── services/        # Wrapper Fetch API Call
    │   ├── App.jsx          # Route Mapping React Router
    │   └── main.jsx
    ├── tailwind.config.js    # Konfigurasi Token Styling
    ├── index.html
    └── package.json
```

---

## 🔑 Akun Login Pengujian (Dummy Data)

1. **Role Admin**:
   - **Email**: `admin@ecomputer.com`
   - **Password**: `adminpassword`

2. **Role Customer**:
   - **Email**: `budi@gmail.com`
   - **Password**: `customerpassword`

---

## ⚙️ Cara Menjalankan Project (Step by Step)

### Langkah 1: Setup Database (SQL Server)
1. Buka **SQL Server Management Studio (SSMS)** atau klien SQL Server pilihan Anda.
2. Buat database baru bernama `ecomputer`:
   ```sql
   CREATE DATABASE ecomputer;
   ```
3. Buka file [schema.sql](file:///c:/Users/ASUS/OneDrive/Desktop/penjualan%20komputer/database/schema.sql), salin seluruh isinya, dan jalankan di database `ecomputer` Anda. Script ini akan membuat semua tabel beserta relasi foreign key dan data dummy awal.

### Langkah 2: Konfigurasi Environment Backend
1. Masuk ke direktori `backend/`.
2. Buka file `.env`. Sesuaikan konfigurasi koneksi SQL Server Anda:
   ```env
   PORT=5000
   JWT_SECRET=supersecretkeyforecomputerapp123!
   DB_USER=sa
   DB_PASSWORD=PasswordSQLServerAnda
   DB_SERVER=localhost
   DB_DATABASE=ecomputer
   DB_PORT=1433
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true
   ```

### Langkah 3: Menjalankan Server Backend
1. Buka terminal/command prompt baru di direktori `backend/`.
2. Jalankan perintah untuk memulai server:
   ```bash
   npm run dev
   ```
   *(Server Express akan aktif di port `5000`)*

### Langkah 4: Menjalankan Server Frontend
1. Buka terminal/command prompt baru lainnya di direktori `frontend/`.
2. Jalankan perintah untuk memulai server lokal:
   ```bash
   npm run dev
   ```
   *(Aplikasi React akan berjalan di port `3000`)*
3. Buka browser Anda dan kunjungi: `http://localhost:3000`

---

## 💡 Fitur Utama yang Siap Digunakan

1. **Bandingkan Produk (Product Compare)**: Pilih hingga 3 produk di katalog dan bandingkan RAM, GPU, CPU, Storage, dan Harga secara berdampingan.
2. **Auto-Cancel Order**: Jika pesanan customer dalam status "Menunggu Pembayaran" melewati batas waktu 2 jam, sistem secara otomatis akan membatalkan order dan mengembalikan stok produk ke database.
3. **Konfirmasi Bukti Transfer**: Pembeli mengunggah bukti pembayaran di halaman transaksi, dan Admin dapat memeriksa foto bukti pembayaran serta mengonfirmasi order langsung di Admin Dashboard.
4. **Voucher Promo**: Terapkan kode kupon aktif seperti `NEWUSER10` di halaman keranjang belanja untuk mendapatkan diskon langsung.
5. **Live Chat WA**: Tombol melayang di pojok kanan bawah halaman untuk terhubung langsung ke chat WhatsApp.
