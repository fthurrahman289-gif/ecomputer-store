const { query } = require('../config/db');

// Get all admin settings
const getAllSettings = async (req, res) => {
  try {
    const result = await query('SELECT setting_key, setting_value, description FROM admin_settings ORDER BY setting_key');
    
    const settings = {};
    result.rows.forEach(row => {
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
    
    const result = await query('SELECT setting_value FROM admin_settings WHERE setting_key = $1', [settingKey]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pengaturan tidak ditemukan' });
    }
    
    res.json({ value: result.rows[0].setting_value });
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
    
    // Check if exists
    const checkResult = await query('SELECT id FROM admin_settings WHERE setting_key = $1', [settingKey]);
    
    if (checkResult.rows.length > 0) {
      // Update existing
      await query(`
          UPDATE admin_settings 
          SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = $2
        `, [settingValue, settingKey]);
    } else {
      // Insert new
      await query(`
          INSERT INTO admin_settings (setting_key, setting_value)
          VALUES ($1, $2)
        `, [settingKey, settingValue]);
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
    
    for (const [key, value] of Object.entries(settings)) {
      const checkResult = await query('SELECT id FROM admin_settings WHERE setting_key = $1', [key]);
      
      if (checkResult.rows.length > 0) {
        await query(`
            UPDATE admin_settings 
            SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = $2
          `, [value, key]);
      } else {
        await query(`
            INSERT INTO admin_settings (setting_key, setting_value)
            VALUES ($1, $2)
          `, [key, value]);
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
