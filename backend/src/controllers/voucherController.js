const { poolPromise, sql } = require('../config/db');

// Get all vouchers (customers see active ones, admin sees all)
const getVouchers = async (req, res) => {
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM dbo.vouchers ORDER BY id DESC';

    // If request has no user or user is customer, return only active and valid vouchers
    if (!req.user || req.user.role !== 'admin') {
      query = `
        SELECT * FROM dbo.vouchers 
        WHERE is_active = 1 
          AND GETDATE() BETWEEN start_date AND end_date
        ORDER BY code
      `;
    }

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil voucher', error: error.message });
  }
};

// Validate code voucher for user checkout
const validateVoucher = async (req, res) => {
  const { code, purchaseAmount } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Kode voucher wajib diisi' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('code', sql.VarChar, code)
      .query(`
        SELECT * FROM dbo.vouchers 
        WHERE code = @code 
          AND is_active = 1 
          AND GETDATE() BETWEEN start_date AND end_date
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Voucher tidak valid atau sudah kedaluwarsa' });
    }

    const voucher = result.recordset[0];

    // Check min purchase
    if (purchaseAmount && parseFloat(purchaseAmount) < parseFloat(voucher.min_purchase)) {
      return res.status(400).json({
        message: `Minimal belanja untuk menggunakan voucher ini adalah Rp ${parseFloat(voucher.min_purchase).toLocaleString('id-ID')}`
      });
    }

    res.json({
      message: 'Voucher berhasil digunakan',
      voucher: {
        code: voucher.code,
        discount_amount: voucher.discount_amount,
        discount_percent: voucher.discount_percent,
        min_purchase: voucher.min_purchase
      }
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memvalidasi voucher', error: error.message });
  }
};

// Admin: Add voucher
const createVoucher = async (req, res) => {
  const { code, discount_amount, discount_percent, min_purchase, start_date, end_date, is_active } = req.body;

  if (!code || !start_date || !end_date) {
    return res.status(400).json({ message: 'Kode, Tanggal Mulai, dan Tanggal Selesai wajib diisi' });
  }

  try {
    const pool = await poolPromise;

    // Check duplicate code
    const checkCode = await pool.request()
      .input('code', sql.VarChar, code)
      .query('SELECT id FROM dbo.vouchers WHERE code = @code');

    if (checkCode.recordset.length > 0) {
      return res.status(400).json({ message: 'Kode voucher sudah digunakan' });
    }

    await pool.request()
      .input('code', sql.VarChar, code)
      .input('discount_amount', sql.Decimal, parseFloat(discount_amount) || 0)
      .input('discount_percent', sql.Int, parseInt(discount_percent) || 0)
      .input('min_purchase', sql.Decimal, parseFloat(min_purchase) || 0)
      .input('start_date', sql.DateTime, new Date(start_date))
      .input('end_date', sql.DateTime, new Date(end_date))
      .input('is_active', sql.Bit, is_active ? 1 : 0)
      .query(`
        INSERT INTO dbo.vouchers (code, discount_amount, discount_percent, min_purchase, start_date, end_date, is_active)
        VALUES (@code, @discount_amount, @discount_percent, @min_purchase, @start_date, @end_date, @is_active)
      `);

    res.status(201).json({ message: 'Voucher berhasil dibuat' });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat membuat voucher', error: error.message });
  }
};

// Admin: Update voucher
const updateVoucher = async (req, res) => {
  const { id } = req.params;
  const { code, discount_amount, discount_percent, min_purchase, start_date, end_date, is_active } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('code', sql.VarChar, code)
      .input('discount_amount', sql.Decimal, parseFloat(discount_amount) || 0)
      .input('discount_percent', sql.Int, parseInt(discount_percent) || 0)
      .input('min_purchase', sql.Decimal, parseFloat(min_purchase) || 0)
      .input('start_date', sql.DateTime, new Date(start_date))
      .input('end_date', sql.DateTime, new Date(end_date))
      .input('is_active', sql.Bit, is_active ? 1 : 0)
      .query(`
        UPDATE dbo.vouchers
        SET code = @code,
            discount_amount = @discount_amount,
            discount_percent = @discount_percent,
            min_purchase = @min_purchase,
            start_date = @start_date,
            end_date = @end_date,
            is_active = @is_active
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Voucher tidak ditemukan' });
    }

    res.json({ message: 'Voucher berhasil diperbarui' });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memperbarui voucher', error: error.message });
  }
};

// Admin: Delete voucher
const deleteVoucher = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.vouchers WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Voucher tidak ditemukan' });
    }

    res.json({ message: 'Voucher berhasil dihapus' });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus voucher', error: error.message });
  }
};

module.exports = {
  getVouchers,
  validateVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher
};
