const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// User reports
router.post('/create', authenticate, reportController.createReport);
router.get('/admin/all', authenticate, reportController.getAllReports);
router.patch('/admin/warn', authenticate, reportController.warnUser);
router.patch('/admin/delete', authenticate, reportController.deleteReportedUser);
router.patch('/admin/dismiss', authenticate, reportController.dismissReport);
router.patch('/admin/resolve', authenticate, reportController.resolveReport);

module.exports = router;
