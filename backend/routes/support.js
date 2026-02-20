const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.post('/submit', optionalAuthenticate, supportController.submitIssue);
// Report user (from chat)
router.post('/report-user/:userId', authenticate, supportController.reportUser);
// Check if user has already reported another user (returns cooldown info)
router.get('/check-report/:userId', authenticate, supportController.checkUserReport);
router.get('/issues', optionalAuthenticate, supportController.getAllIssues);
router.get('/issues/:id/comments', optionalAuthenticate, supportController.getIssueComments);
router.post('/issues/:id/comments', optionalAuthenticate, supportController.addAdminComment);
router.patch('/issues/:id/status', optionalAuthenticate, supportController.updateIssueStatus);
// Get all user reports (admin)
router.get('/reports', authenticate, supportController.getAllReports);
// Resolve a user report (admin)
router.patch('/reports/:id/resolve', authenticate, supportController.resolveReport);

module.exports = router;
