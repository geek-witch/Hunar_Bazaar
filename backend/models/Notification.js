const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'support_issue_new', // Admin: New support issue submitted
      'user_report_new',   // Admin: New user report submitted
      'support_issue_resolved', // User: Their support issue was resolved
      'user_report_resolved',   // User: Their user report was resolved
      'admin_comment',          // User: Admin commented on their support issue
      'feedback_received',      // Teacher: Received new feedback from a learner
      'feedback_pending',       // Learner: Reminder to give feedback for a session
      'session_request_new',    // Teacher: New session request received
      'session_request_accepted', // Learner: Their session request was accepted
      'session_request_declined', // Learner: Their session request was declined
      'session_cancelled',      // Participant: A session they were in was cancelled
      'group_invite_new',       // User: Invited to a new group
      'group_chat_new_message', // User: New message in a group chat
      'skill_added',            // User: A skill they follow was added/updated (maybe later)
      'friend_request',         // User: Received a new friend request
      'plan_updated',          // User: A subscription plan was updated
      'skill_based_session_available', // User: A session for a skill they're interested in has been scheduled
      'session_join_request_new',      // Teacher: User has requested to join one of their scheduled sessions
      'session_join_request_accepted', // User: Their session join request was accepted
      'session_join_request_rejected', // User: Their session join request was rejected
      'subscription_changed',   // User: Their own subscription/status changed
    ],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    // This will be dynamic based on `type`. Could ref 'SupportIssue', 'Feedback', 'Session', 'UserReport', 'GroupConversation'
    // We won't add a 'ref' here directly as it depends on the type.
    required: false, // Not all notifications might link to an entity
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Used for notifications that need to reference a related user (e.g., teacher in skill_based_session_available)
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
