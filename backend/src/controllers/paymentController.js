const { query } = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

// Get all payment settings
const getPaymentSettings = async (req, res) => {
  try {
    const result = await query('SELECT * FROM payment_settings ORDER BY payment_method');
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan pembayaran' });
  }
};

// Get single payment setting
const getPaymentSetting = async (req, res) => {
  try {
    const { paymentMethod } = req.params;
    
    const result = await query('SELECT * FROM payment_settings WHERE payment_method = $1', [paymentMethod]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pengaturan pembayaran tidak ditemukan' });
    }
    
    res.json(result.rows[0]);
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
    
    // Check if setting exists
    const checkResult = await query('SELECT id FROM payment_settings WHERE payment_method = $1', [paymentMethod]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pengaturan pembayaran tidak ditemukan' });
    }
    
    // Update existing setting
    const sqlQuery = `
      UPDATE payment_settings 
      SET bank_name = $1,
          account_number = $2,
          account_holder_name = $3,
          whatsapp_number = $4,
          is_active = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE payment_method = $6
    `;
    
    await query(sqlQuery, [
      bank_name || null,
      account_number || null,
      account_holder_name || null,
      whatsapp_number || null,
      is_active ? true : false,
      paymentMethod
    ]);
    
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

    const newQrisPath = `/uploads/qris/${req.file.filename}`;

    // Get old QRIS image path to delete it
    const oldResult = await query(`SELECT qris_image_path FROM payment_settings WHERE payment_method = $1`, ['QRIS']);
    const oldQrisPath = oldResult.rows.length > 0 ? oldResult.rows[0].qris_image_path : null;

    // Update QRIS image path
    const result = await query(`
        UPDATE payment_settings 
        SET qris_image_path = $1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_method = $2
      `, [newQrisPath, 'QRIS']);

    // If no rows updated, insert new QRIS record
    if (result.rowCount === 0) {
      await query(`
          INSERT INTO payment_settings (payment_method, qris_image_path, whatsapp_number, is_active)
          VALUES ($1, $2, $3, true)
        `, ['QRIS', newQrisPath, null]);
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
    // Get current QRIS image path
    const result = await query(`SELECT qris_image_path FROM payment_settings WHERE payment_method = $1`, ['QRIS']);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'QRIS belum dikonfigurasi' });
    }
    
    const qrisPath = result.rows[0].qris_image_path;
    
    // Update database to remove image path
    await query(`
        UPDATE payment_settings 
        SET qris_image_path = NULL, 
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_method = $1
      `, ['QRIS']);
    
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
    const result = await query(`
        SELECT qris_image_path, whatsapp_number, is_active 
        FROM payment_settings 
        WHERE payment_method = $1
      `, ['QRIS']);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'QRIS belum dikonfigurasi' });
    }

    res.json(result.rows[0]);
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

    // Check if exists
    const checkResult = await query('SELECT id FROM payment_settings WHERE payment_method = $1', [paymentMethod]);

    if (checkResult.rows.length > 0) {
      // Update
      await query(`
          UPDATE payment_settings 
          SET bank_name = $1,
              account_number = $2,
              account_holder_name = $3,
              whatsapp_number = $4,
              ovo_number = $5,
              gopay_number = $6,
              is_active = $7,
              updated_at = CURRENT_TIMESTAMP
          WHERE payment_method = $8
        `, [
          bank_name || null,
          account_number || null,
          account_holder_name || null,
          whatsapp_number || null,
          ovo_number || null,
          gopay_number || null,
          is_active ? true : false,
          paymentMethod
        ]);
    } else {
      // Insert
      await query(`
          INSERT INTO payment_settings (payment_method, bank_name, account_number, account_holder_name, whatsapp_number, ovo_number, gopay_number, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          paymentMethod,
          bank_name || null,
          account_number || null,
          account_holder_name || null,
          whatsapp_number || null,
          ovo_number || null,
          gopay_number || null,
          is_active ? true : false
        ]);
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

    // Save each bank
    for (const bank of banks) {
      if (!bank.bank_name || !bank.account_number || !bank.account_holder_name) {
        return res.status(400).json({ message: \`Data bank \${bank.bank_name} belum lengkap\` });
      }

      const checkResult = await query('SELECT id FROM payment_settings WHERE payment_method = $1', [\`Transfer Bank - \${bank.bank_name}\`]);

      if (checkResult.rows.length > 0) {
        // Update
        await query(`
            UPDATE payment_settings 
            SET bank_name = $1,
                account_number = $2,
                account_holder_name = $3,
                is_active = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE payment_method = $5
          `, [
            bank.bank_name,
            bank.account_number,
            bank.account_holder_name,
            bank.is_active ? true : false,
            \`Transfer Bank - \${bank.bank_name}\`
          ]);
      } else {
        // Insert
        await query(`
            INSERT INTO payment_settings (payment_method, bank_name, account_number, account_holder_name, is_active)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            \`Transfer Bank - \${bank.bank_name}\`,
            bank.bank_name,
            bank.account_number,
            bank.account_holder_name,
            bank.is_active ? true : false
          ]);
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
