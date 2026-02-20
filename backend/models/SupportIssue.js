const mongoose = require('mongoose');

const supportIssueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, 
    default: null
  },
  // When category is used to report a user, store who was reported
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['General Inquiry', 'Technical Issue', 'Payment Problem', 'Session Issue', 'Account Problem', 'Other'],
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Description must be at least 10 characters']
  },
  attachment: {
    type: String,
    default: null 
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adminComments: [{
    adminId: {
      type: mongoose.Schema.Types.Mixed, 
      ref: 'User'
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  adminNotes: {
    type: String,
    default: null,
    trim: true
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

supportIssueSchema.pre('save', function(next) {
  if (this.isNew) {
    const highPriorityCategories = ['Payment Problem', 'Session Issue', 'Account Problem'];
    if (highPriorityCategories.includes(this.category)) {
      this.priority = 'high';
    } else if (this.category === 'Technical Issue') {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  next();
});

module.exports = mongoose.model('SupportIssue', supportIssueSchema);

