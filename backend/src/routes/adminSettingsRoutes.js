const express = require('express');
const router = express.Router();
const {
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings
} = require('../controllers/adminSettingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin only routes - update settings (must be before get /:settingKey)
router.post('/bulk/update', protect, adminOnly, updateSettings);
router.put('/:settingKey', protect, adminOnly, updateSetting);

// Public routes - get settings
router.get('/', getAllSettings);
router.get('/:settingKey', getSetting);

module.exports = router;
