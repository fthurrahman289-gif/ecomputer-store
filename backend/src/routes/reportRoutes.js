const express = require('express');
const router = express.Router();
const {
  getReportData,
  exportReportHTML,
  exportReportPDF
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin-only endpoints for reports
router.get('/', protect, adminOnly, getReportData);
router.get('/export/html', protect, adminOnly, exportReportHTML);
router.get('/export/pdf', protect, adminOnly, exportReportPDF);

module.exports = router;
