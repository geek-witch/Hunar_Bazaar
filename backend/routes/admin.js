const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Note: authorizeAdmin is likely the middleware that checks req.user.isAdmin
router.get('/users', authenticate, adminController.getAllUsers);
router.patch('/users/status', authenticate, adminController.updateUserStatus);
router.get('/dashboard-stats', authenticate, adminController.getDashboardStats);

module.exports = router;
