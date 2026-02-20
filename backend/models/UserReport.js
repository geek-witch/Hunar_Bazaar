const mongoose = require('mongoose');

const userReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
      default: 'pending'
    },
    adminAction: {
      type: String,
      enum: ['none', 'warning', 'suspension', 'deletion'],
      default: 'none'
    },
    adminNotes: {
      type: String,
      trim: true
    },
    resolvedBy: {
      type: String,
      default: 'admin'
    },
    resolvedAt: {
      type: Date
    },
    warningsSent: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Index to help with queries
userReportSchema.index({ reportedUserId: 1, status: 1 });
userReportSchema.index({ createdAt: -1 });
userReportSchema.index({ reportedUserId: 1, createdAt: -1 });

module.exports = mongoose.model('UserReport', userReportSchema);
