const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsersList, updateUserRole } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly); // Enforce that all routes require admin credentials

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsersList);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
