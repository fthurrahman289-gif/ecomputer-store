const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new customer
const registerUser = async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
  }

  try {
    const pool = await poolPromise;

    // Check if email already exists
    const checkEmail = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id FROM dbo.users WHERE email = @email');

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('phone', sql.VarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .query('INSERT INTO dbo.users (name, email, password, phone, address, role) VALUES (@name, @email, @password, @phone, @address, \'customer\')');

    res.status(201).json({ message: 'Pendaftaran berhasil, silakan login' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mendaftar', error: error.message });
  }
};

// Login user (Customer / Admin)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  try {
    const pool = await poolPromise;

    // Find user
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM dbo.users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const user = result.recordset[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat login', error: error.message });
  }
};

// Get current user profile
const getUserProfile = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT id, name, email, role, phone, address, created_at FROM dbo.users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil profil', error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
