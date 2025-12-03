const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['verification', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 600 
  }
}, {
  timestamps: true
});

otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);

