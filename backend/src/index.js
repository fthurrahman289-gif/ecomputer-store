const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
// TODO: Convert payment/admin-settings/report routes from MSSQL to PostgreSQL
// const paymentRoutes = require('./routes/paymentRoutes');
// const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// TODO: Convert to PostgreSQL - temporarily disabled
// const paymentRoutes = require('./routes/paymentRoutes');
// const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
// const reportRoutes = require('./routes/reportRoutes');

// Database connection
const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static directory for uploaded payment receipts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint (used by Vercel)
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to E-Computer E-Commerce REST API',
    status: 'Running',
    version: '2.0.0',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
// TODO: Convert payment/admin-settings/report controllers from MSSQL to PostgreSQL
// app.use('/api/payment', paymentRoutes);
// app.use('/api/settings', adminSettingsRoutes);
// app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({
    message: 'Terjadi kesalahan internal pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running in modern mode on port ${PORT}`);
  });
}

module.exports = app;
