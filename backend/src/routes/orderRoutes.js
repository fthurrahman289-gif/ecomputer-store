const express = require('express');
const router = express.Router();
const {
  checkout,
  getMyOrders,
  getOrderById,
  uploadPaymentProof,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminVerifyPayment,
  adminCreateOrder
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Customer endpoints
router.post('/checkout', protect, checkout);
router.get('/my-orders', protect, getMyOrders);
router.post('/upload-proof', protect, upload.single('proof'), uploadPaymentProof);
router.get('/:id', protect, getOrderById);

// Admin-only endpoints
router.get('/admin/orders', protect, adminOnly, adminGetOrders);
router.put('/admin/orders/:id/status', protect, adminOnly, adminUpdateOrderStatus);
router.post('/admin/payments/:paymentId/verify', protect, adminOnly, adminVerifyPayment);
router.post('/admin/create-order', protect, adminOnly, adminCreateOrder);

module.exports = router;

