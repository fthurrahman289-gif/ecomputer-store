const { poolPromise, sql } = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

// Get all payment settings
const getPaymentSettings = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM dbo.payment_settings ORDER BY payment_method');
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan pembayaran' });
  }
};

// Get single payment setting
const getPaymentSetting = async (req, res) => {
  try {
    const { paymentMethod } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('method', sql.VarChar, paymentMethod)
      .query('SELECT * FROM dbo.payment_settings WHERE payment_method = @method');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Pengaturan pembayaran tidak ditemukan' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching payment setting:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan pembayaran' });
  }
};

// Update payment setting
const updatePaymentSetting = async (req, res) => {
  try {
    const { paymentMethod } = req.params;
    const { bank_name, account_number, account_holder_name, whatsapp_number, is_active } = req.body;
    
    const pool = await poolPromise;
    
    // Check if setting exists
    const checkResult = await pool.request()
      .input('method', sql.VarChar, paymentMethod)
      .query('SELECT id FROM dbo.payment_settings WHERE payment_method = @method');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Pengaturan pembayaran tidak ditemukan' });
    }
    
    // Update existing setting
    const query = `
      UPDATE dbo.payment_settings 
      SET bank_name = @bankName,
          account_number = @accountNumber,
          account_holder_name = @accountHolderName,
          whatsapp_number = @whatsappNumber,
          is_active = @isActive,
          updated_at = GETDATE()
      WHERE payment_method = @method
    `;
    
    await pool.request()
      .input('method', sql.VarChar, paymentMethod)
      .input('bankName', sql.NVarChar, bank_name || null)
      .input('accountNumber', sql.VarChar, account_number || null)
      .input('accountHolderName', sql.NVarChar, account_holder_name || null)
      .input('whatsappNumber', sql.VarChar, whatsapp_number || null)
      .input('isActive', sql.Bit, is_active ? 1 : 0)
      .query(query);
    
    res.json({ message: 'Pengaturan pembayaran berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating payment setting:', error);
    res.status(500).json({ message: 'Gagal memperbarui pengaturan pembayaran' });
  }
};

// Upload QRIS image
const uploadQrisImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File QRIS tidak ditemukan' });
    }

    // Validate file is an image
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'File harus berupa gambar (JPEG, PNG, WebP)' });
    }

    const pool = await poolPromise;
    const newQrisPath = `/uploads/qris/${req.file.filename}`;

    // Get old QRIS image path to delete it
    const oldResult = await pool.request()
      .input('method', sql.VarChar, 'QRIS')
      .query(`SELECT qris_image_path FROM dbo.payment_settings WHERE payment_method = @method`);

    const oldQrisPath = oldResult.recordset.length > 0 ? oldResult.recordset[0].qris_image_path : null;

    // Update QRIS image path
    const result = await pool.request()
      .input('method', sql.VarChar, 'QRIS')
      .input('qrisPath', sql.NVarChar, newQrisPath)
      .query(`
        UPDATE dbo.payment_settings 
        SET qris_image_path = @qrisPath, 
            updated_at = GETDATE()
        WHERE payment_method = @method
      `);

    // If no rows updated, insert new QRIS record
    if (result.rowsAffected[0] === 0) {
      await pool.request()
        .input('method', sql.VarChar, 'QRIS')
        .input('qrisPath', sql.NVarChar, newQrisPath)
        .input('whatsappNumber', sql.VarChar, null)
        .query(`
          INSERT INTO dbo.payment_settings (payment_method, qris_image_path, whatsapp_number, is_active)
          VALUES (@method, @qrisPath, @whatsappNumber, 1)
        `);
    }

    // Delete old file if exists
    if (oldQrisPath) {
      const oldFilePath = path.join(__dirname, '../../', '.' + oldQrisPath);
      fs.unlink(oldFilePath).catch(err => {
        console.log('Could not delete old QRIS file:', err.message);
      });
    }

    res.json({ 
      message: 'Foto QRIS berhasil diunggah',
      qris_image_path: newQrisPath 
    });
  } catch (error) {
    console.error('Error uploading QRIS image:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ message: 'Gagal mengunggah foto QRIS' });
  }
};

// Delete QRIS image
const deleteQrisImage = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get current QRIS image path
    const result = await pool.request()
      .input('method', sql.VarChar, 'QRIS')
      .query(`SELECT qris_image_path FROM dbo.payment_settings WHERE payment_method = @method`);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'QRIS belum dikonfigurasi' });
    }
    
    const qrisPath = result.recordset[0].qris_image_path;
    
    // Update database to remove image path
    await pool.request()
      .input('method', sql.VarChar, 'QRIS')
      .query(`
        UPDATE dbo.payment_settings 
        SET qris_image_path = NULL, 
            updated_at = GETDATE()
        WHERE payment_method = @method
      `);
    
    // Delete file from server if exists
    if (qrisPath) {
      const filePath = path.join(__dirname, '../../', '.' + qrisPath);
      fs.unlink(filePath).catch(err => {
        console.log('Could not delete QRIS file:', err.message);
      });
    }
    
    res.json({ message: 'Foto QRIS berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting QRIS image:', error);
    res.status(500).json({ message: 'Gagal menghapus foto QRIS' });
  }
};

// Get QRIS image path
const getQrisImage = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('method', sql.VarChar, 'QRIS')
      .query(`
        SELECT qris_image_path, whatsapp_number, is_active 
        FROM dbo.payment_settings 
        WHERE payment_method = @method
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'QRIS belum dikonfigurasi' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching QRIS image:', error);
    res.status(500).json({ message: 'Gagal mengambil data QRIS' });
  }
};

// Upsert (insert or update) payment setting
const upsertPaymentSetting = async (req, res) => {
  try {
    const { paymentMethod, bank_name, account_number, account_holder_name, whatsapp_number, ovo_number, gopay_number, is_active } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Metode pembayaran wajib diisi' });
    }

    const pool = await poolPromise;

    // Check if exists
    const checkResult = await pool.request()
      .input('method', sql.VarChar, paymentMethod)
      .query('SELECT id FROM dbo.payment_settings WHERE payment_method = @method');

    if (checkResult.recordset.length > 0) {
      // Update
      await pool.request()
        .input('method', sql.VarChar, paymentMethod)
        .input('bankName', sql.NVarChar, bank_name || null)
        .input('accountNumber', sql.VarChar, account_number || null)
        .input('accountHolderName', sql.NVarChar, account_holder_name || null)
        .input('whatsappNumber', sql.VarChar, whatsapp_number || null)
        .input('ovoNumber', sql.VarChar, ovo_number || null)
        .input('gopayNumber', sql.VarChar, gopay_number || null)
        .input('isActive', sql.Bit, is_active ? 1 : 0)
        .query(`
          UPDATE dbo.payment_settings 
          SET bank_name = @bankName,
              account_number = @accountNumber,
              account_holder_name = @accountHolderName,
              whatsapp_number = @whatsappNumber,
              ovo_number = @ovoNumber,
              gopay_number = @gopayNumber,
              is_active = @isActive,
              updated_at = GETDATE()
          WHERE payment_method = @method
        `);
    } else {
      // Insert
      await pool.request()
        .input('method', sql.VarChar, paymentMethod)
        .input('bankName', sql.NVarChar, bank_name || null)
        .input('accountNumber', sql.VarChar, account_number || null)
        .input('accountHolderName', sql.NVarChar, account_holder_name || null)
        .input('whatsappNumber', sql.VarChar, whatsapp_number || null)
        .input('ovoNumber', sql.VarChar, ovo_number || null)
        .input('gopayNumber', sql.VarChar, gopay_number || null)
        .input('isActive', sql.Bit, is_active ? 1 : 0)
        .query(`
          INSERT INTO dbo.payment_settings (payment_method, bank_name, account_number, account_holder_name, whatsapp_number, ovo_number, gopay_number, is_active)
          VALUES (@method, @bankName, @accountNumber, @accountHolderName, @whatsappNumber, @ovoNumber, @gopayNumber, @isActive)
        `);
    }

    res.json({ message: 'Pengaturan pembayaran berhasil disimpan' });
  } catch (error) {
    console.error('Error saving payment setting:', error);
    res.status(500).json({ message: 'Gagal menyimpan pengaturan pembayaran' });
  }
};

// Save multiple banks
const saveBankSettings = async (req, res) => {
  try {
    const { banks } = req.body;

    if (!banks || !Array.isArray(banks) || banks.length === 0) {
      return res.status(400).json({ message: 'Data bank tidak valid' });
    }

    const pool = await poolPromise;

    // Save each bank
    for (const bank of banks) {
      if (!bank.bank_name || !bank.account_number || !bank.account_holder_name) {
        return res.status(400).json({ message: `Data bank ${bank.bank_name} belum lengkap` });
      }

      const checkResult = await pool.request()
        .input('method', sql.VarChar, `Transfer Bank - ${bank.bank_name}`)
        .query('SELECT id FROM dbo.payment_settings WHERE payment_method = @method');

      if (checkResult.recordset.length > 0) {
        // Update
        await pool.request()
          .input('method', sql.VarChar, `Transfer Bank - ${bank.bank_name}`)
          .input('bankName', sql.NVarChar, bank.bank_name)
          .input('accountNumber', sql.VarChar, bank.account_number)
          .input('accountHolderName', sql.NVarChar, bank.account_holder_name)
          .input('isActive', sql.Bit, bank.is_active ? 1 : 0)
          .query(`
            UPDATE dbo.payment_settings 
            SET bank_name = @bankName,
                account_number = @accountNumber,
                account_holder_name = @accountHolderName,
                is_active = @isActive,
                updated_at = GETDATE()
            WHERE payment_method = @method
          `);
      } else {
        // Insert
        await pool.request()
          .input('method', sql.VarChar, `Transfer Bank - ${bank.bank_name}`)
          .input('bankName', sql.NVarChar, bank.bank_name)
          .input('accountNumber', sql.VarChar, bank.account_number)
          .input('accountHolderName', sql.NVarChar, bank.account_holder_name)
          .input('isActive', sql.Bit, bank.is_active ? 1 : 0)
          .query(`
            INSERT INTO dbo.payment_settings (payment_method, bank_name, account_number, account_holder_name, is_active)
            VALUES (@method, @bankName, @accountNumber, @accountHolderName, @isActive)
          `);
      }
    }

    res.json({ message: 'Pengaturan bank berhasil disimpan' });
  } catch (error) {
    console.error('Error saving bank settings:', error);
    res.status(500).json({ message: 'Gagal menyimpan pengaturan bank' });
  }
};

module.exports = {
  getPaymentSettings,
  getPaymentSetting,
  updatePaymentSetting,
  uploadQrisImage,
  deleteQrisImage,
  getQrisImage,
  upsertPaymentSetting,
  saveBankSettings
};
