const express = require('express');
const router = express.Router();
const {
  getVouchers,
  validateVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher
} = require('../controllers/voucherController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public/authenticated customer routes
router.post('/validate', validateVoucher);
router.get('/', protect, getVouchers);

// Admin operations
router.post('/', protect, adminOnly, createVoucher);
router.put('/:id', protect, adminOnly, updateVoucher);
router.delete('/:id', protect, adminOnly, deleteVoucher);

module.exports = router;
