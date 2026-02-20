const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  learner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      // Required only if participants array is empty (backward compatibility)
      return !this.participants || this.participants.length === 0;
    }
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  skill_id: {
    type: String,
    required: true
  },
  session_type: {
    type: String,
    required: true,
    enum: ['teaching'],
    default: 'teaching'
  },
  status: {
    type: String,
    required: true,
    enum: ['upcoming', 'completed', 'cancelled', 'expired', 'cancelled_by_teacher'],
    default: 'upcoming'
  },
  // Users who individually cancelled their participation
  cancelled_participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Users who individually marked the session as completed/learned
  completed_participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Users who "deleted" this session from their history (soft delete)
  hidden_for_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  date: {
    type: Date,
    required: true
  },
  feedback: {
    type: String,
    default: null
  },
  time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  // ISO datetimes for precise start/end time handling
  start_time: {
    type: Date,
    default: null
  },
  end_time: {
    type: Date,
    default: null
  },
  // When true, the meeting link is permanently disabled/expired
  meeting_link_expired: {
    type: Boolean,
    default: false
  },
  // When true, the meeting link has been activated at least once (user joined)
  meeting_link_activated: {
    type: Boolean,
    default: false
  },
  // Array of learner IDs who have given feedback (supports multiple learners in group sessions)
  feedbackGivenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Legacy field for backward compatibility
  feedbackGiven: {
    type: Boolean,
    default: false
  },
  // Array of learner IDs who have claimed skill mastery (supports multiple learners in group sessions)
  skillClaimedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Legacy field for backward compatibility
  skillClaimed: {
    type: Boolean,
    default: false
  },
  meeting_room: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updated_at before saving
sessionSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
