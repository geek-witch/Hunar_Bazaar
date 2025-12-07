const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.post('/submit', optionalAuthenticate, supportController.submitIssue);
router.get('/issues', optionalAuthenticate, supportController.getAllIssues);
router.get('/issues/:id/comments', optionalAuthenticate, supportController.getIssueComments);
router.post('/issues/:id/comments', optionalAuthenticate, supportController.addAdminComment);
router.patch('/issues/:id/status', optionalAuthenticate, supportController.updateIssueStatus);

module.exports = router;

