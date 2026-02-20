const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

router.get('/profile/progress', authenticate, profileController.getProgress); // Specific route first
router.get('/profile', authenticate, profileController.getProfile);
router.put('/profile', authenticate, profileController.updateProfile);
router.post('/master-skill', authenticate, profileController.masterSkill);
router.post('/change-password', authenticate, profileController.changePassword);
// Friend endpoints
router.post('/friend-request/:userId', authenticate, profileController.sendFriendRequest);
router.post('/friend-respond/:userId', authenticate, profileController.respondFriendRequest);
router.get('/friend-requests', authenticate, profileController.getFriendRequests);
router.get('/friends', authenticate, profileController.getFriends);
router.get('/by-user/:userId', authenticate, profileController.getProfileByUserId);
router.delete('/friend/:userId', authenticate, profileController.removeFriend);
// Block endpoints
router.post('/block/:userId', authenticate, profileController.blockUser);
router.post('/unblock/:userId', authenticate, profileController.unblockUser);
router.get('/check-blocked/:userId', authenticate, profileController.checkBlocked);
router.get('/blocked-by-me', authenticate, profileController.getBlockedByMe);

module.exports = router;

