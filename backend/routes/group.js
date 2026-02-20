const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const groupController = require('../controllers/groupController');

// Create a new group
router.post('/', authenticate, groupController.createGroup);

// Add member to group
router.post('/:id/add', authenticate, groupController.addMember);

// Remove member
router.post('/:id/remove', authenticate, groupController.removeMember);

// Rename or change image
router.post('/:id/rename', authenticate, groupController.renameGroup);

// Assign/unassign admin
router.post('/:id/admin', authenticate, groupController.assignAdmin);

// Delete message (moderation)
router.post('/:id/delete-message', authenticate, groupController.deleteMessage);

// Leave group
router.post('/:id/leave', authenticate, groupController.leaveGroup);

// Get group details
router.get('/:id', authenticate, groupController.getGroupDetails);

// Delete group
router.delete('/:id', authenticate, groupController.deleteGroup);

module.exports = router;
