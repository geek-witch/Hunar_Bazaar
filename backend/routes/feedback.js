const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

// Create feedback
router.post('/', authenticate, feedbackController.createFeedback);
// Update feedback
router.put('/:id', authenticate, feedbackController.updateFeedback);

// Get feedbacks (type=received|given|pending)
router.get('/', authenticate, feedbackController.getFeedbacks);

// Report feedback
router.post('/report', authenticate, feedbackController.reportFeedback);

module.exports = router;
