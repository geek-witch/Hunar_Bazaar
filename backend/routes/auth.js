const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const firebaseController = require('../controllers/firebaseController');
const { authenticate } = require('../middleware/auth');

router.post('/complete-profile', authController.completeProfile);
router.post('/send-signup-otp', authController.sendSignupOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.get('/firebase-token', authenticate, firebaseController.getFirebaseToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.delete('/account', authenticate, profileController.deleteAccount);

module.exports = router;

