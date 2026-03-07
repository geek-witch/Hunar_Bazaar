const mongoose = require('mongoose');

const sessionJoinRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  reason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Ensure one user can only have one pending request per session
sessionJoinRequestSchema.index({ userId: 1, sessionId: 1, status: 1 }, { unique: false });

module.exports = mongoose.model('SessionJoinRequest', sessionJoinRequestSchema);
