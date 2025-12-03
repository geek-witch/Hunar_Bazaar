const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  bio: {
    type: String,
    required: true,
    minlength: [20, 'Bio must be at least 20 characters'],
    maxlength: [500, 'Bio must not exceed 500 characters']
  },
  profilePic: {
    type: String, 
    default: null
  },
  teachSkills: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one skill to teach is required'
    }
  },
  learnSkills: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one skill to learn is required'
    }
  },
  availability: {
    type: String,
    required: true,
    trim: true
  },
  socialLinks: {
    type: [String],
    default: []
  },
  roadmap: {
    type: mongoose.Schema.Types.Mixed, 
    default: null
  },
  suggestions: {
    type: [String],
    default: []
  },
  premiumStatus: {
    type: Boolean,
    default: false
  },
  creditNumber: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);

