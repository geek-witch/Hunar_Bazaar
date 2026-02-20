const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

// Create a new session
router.post('/', authenticate, sessionController.createSession);

// Get sessions for current user
router.get('/', authenticate, sessionController.getSessions);

// Cancel a session
router.patch('/:sessionId/cancel', authenticate, sessionController.cancelSession);

// Complete a session
router.patch('/:sessionId/complete', authenticate, sessionController.completeSession);

// Join a session (placeholder)
router.post('/:sessionId/join', authenticate, sessionController.joinSession);

// Get meeting room details for a session
router.get('/:sessionId/meeting', authenticate, sessionController.getMeetingDetails);

// Delete a session (only for past sessions)
router.delete('/:sessionId', authenticate, sessionController.deleteSession);

module.exports = router;
