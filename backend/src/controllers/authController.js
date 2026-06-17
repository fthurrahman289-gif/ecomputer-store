const { pool, query } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP (6 digit)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register a new customer with username
const registerUser = async (req, res) => {
  const { name, username, email, password, phone, address } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: 'Nama, username, email, dan password wajib diisi' });
  }

  try {
    // Check if username already exists
    const checkUsername = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (checkUsername.rows.length > 0) {
      return res.status(400).json({ message: 'Username sudah terdaftar' });
    }

    // Check if email already exists
    const checkEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    await query(
      'INSERT INTO users (name, username, email, password, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [name, username, email, hashedPassword, phone || null, address || null, 'customer']
    );

    res.status(201).json({ message: 'Pendaftaran berhasil, silakan login' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mendaftar', error: error.message });
  }
};

// Login user with username or email
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET environment variable not set');
      return res.status(500).json({ 
        message: 'Konfigurasi server tidak lengkap. Hubungi administrator.',
        debug: 'Missing JWT_SECRET environment variable'
      });
    }

    // Find user by username or email
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('❌ Login Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        message: 'Database connection error. Coba lagi dalam beberapa saat.',
        debug: error.code
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server saat login',
      error: error.message 
    });
  }
};

// Request password reset - send OTP to email
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email wajib diisi' });
  }

  try {
    // Check if email exists
    const userResult = await query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Email tidak terdaftar' });
    }

    const user = userResult.rows[0];
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Save OTP to database
    await query(
      'INSERT INTO password_resets (user_id, email, otp_code, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, email, otpCode, expiresAt]
    );

    // Send OTP via email
    await transporter.sendMail({
      to: email,
      subject: 'Kode OTP Reset Password - E-Computer',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reset Password Anda</h2>
          <p>Halo ${user.name},</p>
          <p>Kami menerima permintaan untuk mengatur ulang kata sandi Anda.</p>
          <p>Gunakan kode OTP berikut untuk melanjutkan:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${otpCode}</h1>
          <p style="color: #666;">Kode ini berlaku selama 10 menit.</p>
          <p style="color: #999; font-size: 12px;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
        </div>
      `
    });

    res.json({ message: 'Kode OTP telah dikirim ke email Anda' });
  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengirim OTP', error: error.message });
  }
};

// Verify OTP and reset password
const verifyOTPAndResetPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;

  if (!email || !otpCode || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, dan password baru wajib diisi' });
  }

  try {
    // Check if OTP is valid and not expired
    const otpResult = await query(
      'SELECT * FROM password_resets WHERE email = $1 AND otp_code = $2 AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otpCode]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Kode OTP tidak valid atau sudah kadaluarsa' });
    }

    const passwordReset = otpResult.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, passwordReset.user_id]);

    // Mark OTP as used
    await query('UPDATE password_resets SET is_used = true WHERE id = $1', [passwordReset.id]);

    res.json({ message: 'Password berhasil diubah, silakan login dengan password baru Anda' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengubah password', error: error.message });
  }
};

// Get current user profile
const getUserProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, username, email, role, phone, address, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil profil', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyOTPAndResetPassword,
  getUserProfile
};
