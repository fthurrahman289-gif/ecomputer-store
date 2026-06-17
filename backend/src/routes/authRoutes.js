const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, requestPasswordReset, verifyOTPAndResetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route mapping
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password-otp', verifyOTPAndResetPassword);

module.exports = router;
