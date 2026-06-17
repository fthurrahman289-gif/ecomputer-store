const express = require('express');
const router = express.Router();
const {
  getPaymentSettings,
  getPaymentSetting,
  updatePaymentSetting,
  uploadQrisImage,
  deleteQrisImage,
  getQrisImage,
  upsertPaymentSetting,
  saveBankSettings
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/settings', getPaymentSettings);
router.get('/settings/:paymentMethod', getPaymentSetting);
router.get('/qris', getQrisImage);

// Admin routes
router.use(protect);
router.use(adminOnly);

router.put('/settings/:paymentMethod', updatePaymentSetting);
router.post('/settings/upsert', upsertPaymentSetting);
router.post('/settings/banks', saveBankSettings);
router.post('/qris/upload', upload.qrisUpload.single('qris_image'), uploadQrisImage);
router.delete('/qris', deleteQrisImage);

module.exports = router;
