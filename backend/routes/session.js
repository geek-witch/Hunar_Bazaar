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

// Session Join Request endpoints
// Request to join a specific session (skill-based)
router.post('/:sessionId/request-to-join', authenticate, sessionController.requestSessionJoin);

// Get pending session join requests for teacher
router.get('/join-requests/pending', authenticate, sessionController.getSessionJoinRequests);

// Respond to a session join request
router.post('/join-requests/:requestId/respond', authenticate, sessionController.respondSessionJoinRequest);

// Get scheduled sessions for a teacher (for profile display)
router.get('/teacher/:teacherId/scheduled', authenticate, sessionController.getTeacherScheduledSessions);

module.exports = router;
