const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the local uploads directory and subdirectories exist
// Di Vercel, sistem file bersifat Read-Only. Kita hanya bisa menulis ke /tmp
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
const qrisDir = path.join(uploadDir, 'qris');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(qrisDir)) {
  fs.mkdirSync(qrisDir, { recursive: true });
}

// Storage engine configuration for general uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage engine configuration for QRIS uploads
const qrisStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, qrisDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qris-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (Allow image uploads: jpg, jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (jpg, jpeg, png, webp) yang diperbolehkan!'));
  }
};

// General upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: fileFilter
});

// QRIS upload middleware
const qrisUpload = multer({
  storage: qrisStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: fileFilter
});

module.exports = upload;
module.exports.qrisUpload = qrisUpload;
