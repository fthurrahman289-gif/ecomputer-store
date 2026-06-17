const { poolPromise, sql } = require('../config/db');

// Get all admin settings
const getAllSettings = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT setting_key, setting_value, description FROM dbo.admin_settings ORDER BY setting_key');
    
    const settings = {};
    result.recordset.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan' });
  }
};

// Get single setting
const getSetting = async (req, res) => {
  try {
    const { settingKey } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('key', sql.VarChar, settingKey)
      .query('SELECT setting_value FROM dbo.admin_settings WHERE setting_key = @key');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Pengaturan tidak ditemukan' });
    }
    
    res.json({ value: result.recordset[0].setting_value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan' });
  }
};

// Update or create setting
const updateSetting = async (req, res) => {
  try {
    const { settingKey, settingValue } = req.body;
    
    if (!settingKey || settingValue === undefined) {
      return res.status(400).json({ message: 'settingKey dan settingValue wajib diisi' });
    }
    
    const pool = await poolPromise;
    
    // Check if exists
    const checkResult = await pool.request()
      .input('key', sql.VarChar, settingKey)
      .query('SELECT id FROM dbo.admin_settings WHERE setting_key = @key');
    
    if (checkResult.recordset.length > 0) {
      // Update existing
      await pool.request()
        .input('key', sql.VarChar, settingKey)
        .input('value', sql.NVarChar, settingValue)
        .query(`
          UPDATE dbo.admin_settings 
          SET setting_value = @value, updated_at = GETDATE()
          WHERE setting_key = @key
        `);
    } else {
      // Insert new
      await pool.request()
        .input('key', sql.VarChar, settingKey)
        .input('value', sql.NVarChar, settingValue)
        .query(`
          INSERT INTO dbo.admin_settings (setting_key, setting_value)
          VALUES (@key, @value)
        `);
    }
    
    res.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
};

// Bulk update settings
const updateSettings = async (req, res) => {
  try {
    const settings = req.body; // Object: { cs_whatsapp: '081...', cs_email: '...', etc }
    
    if (!settings || Object.keys(settings).length === 0) {
      return res.status(400).json({ message: 'Pengaturan tidak boleh kosong' });
    }
    
    const pool = await poolPromise;
    
    for (const [key, value] of Object.entries(settings)) {
      const checkResult = await pool.request()
        .input('key', sql.VarChar, key)
        .query('SELECT id FROM dbo.admin_settings WHERE setting_key = @key');
      
      if (checkResult.recordset.length > 0) {
        await pool.request()
          .input('key', sql.VarChar, key)
          .input('value', sql.NVarChar, value)
          .query(`
            UPDATE dbo.admin_settings 
            SET setting_value = @value, updated_at = GETDATE()
            WHERE setting_key = @key
          `);
      } else {
        await pool.request()
          .input('key', sql.VarChar, key)
          .input('value', sql.NVarChar, value)
          .query(`
            INSERT INTO dbo.admin_settings (setting_key, setting_value)
            VALUES (@key, @value)
          `);
      }
    }
    
    res.json({ message: 'Semua pengaturan berhasil disimpan' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings
};
