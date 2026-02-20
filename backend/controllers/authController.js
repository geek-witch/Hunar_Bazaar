const User = require('../models/User');
const Profile = require('../models/Profile');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


exports.completeProfile = async (req, res) => {
  try {
    const { userId, firstName, lastName, dob, bio, teachSkills, learnSkills, availability, socialLinks, profilePic } = req.body;

    if (!userId || !firstName || !lastName || !dob || !bio || !teachSkills || !learnSkills || !availability) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (bio.trim().length < 20 || bio.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be between 20 and 500 characters'
      });
    }

    if (teachSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill to teach is required'
      });
    }

    if (learnSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill to learn is required'
      });
    }

    // Validate availability format
    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one availability slot is required'
      });
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const slot of availability) {
      if (!slot.startTime || !slot.endTime || !slot.days || !Array.isArray(slot.days)) {
        return res.status(400).json({
          success: false,
          message: 'Each availability slot must have startTime, endTime, and days array'
        });
      }

      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Time must be in HH:MM format (24-hour)'
        });
      }

      if (slot.days.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Each availability slot must have at least one day'
        });
      }

      if (!slot.days.every(day => validDays.includes(day))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day name. Valid days are: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
        });
      }

      // Validate that start time is before end time
      const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;

      if (startTotal >= endTotal) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time for each availability slot'
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
    }

    const profile = await Profile.create({
      userId,
      firstName,
      lastName,
      dob,
      bio,
      teachSkills,
      learnSkills,
      availability,
      socialLinks: socialLinks || [],
      profilePic: profilePic || null,
      roadmap: null,
      suggestions: [],
      premiumStatus: false,
      creditNumber: 0
    });

    const otpCode = generateOTP();
    await OTP.create({
      email: user.email.toLowerCase(),
      code: otpCode,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      await sendOTPEmail(user.email, otpCode);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Profile created successfully but failed to send OTP email. Please use resend OTP.',
        data: profile
      });
    }

    await logger.record(logger.INFO, `New profile created for user: ${firstName} ${lastName}`, `${firstName} ${lastName}`, userId, 'PROFILE_CREATE');

    res.status(201).json({
      success: true,
      message: 'Profile created successfully. OTP sent to email.',
      data: profile
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: error.message
    });
  }
};

exports.sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const otpCode = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      await sendOTPEmail(email, otpCode);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, code, signupData } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required'
      });
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      code,
      type: 'verification'
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (signupData) {
      const { firstName, lastName, dob, password, bio, teachSkills, learnSkills, availability, socialLinks, profilePic } = signupData;

      if (!firstName || !lastName || !dob || !password || !bio || !teachSkills || !learnSkills || !availability) {
        return res.status(400).json({
          success: false,
          message: 'All required signup fields must be provided'
        });
      }

      // Validate password
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must include uppercase, lowercase, and a number'
        });
      }

      // Validate age
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 10) {
        return res.status(400).json({
          success: false,
          message: 'You must be at least 10 years old to sign up'
        });
      }

      // Validate bio
      if (bio.trim().length < 20 || bio.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Bio must be between 20 and 500 characters'
        });
      }

      // Validate skills
      if (teachSkills.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one skill to teach is required'
        });
      }

      if (learnSkills.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one skill to learn is required'
        });
      }

      // Validate availability format
      if (!Array.isArray(availability) || availability.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one availability slot is required'
        });
      }

      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      for (const slot of availability) {
        if (!slot.startTime || !slot.endTime || !slot.days || !Array.isArray(slot.days)) {
          return res.status(400).json({
            success: false,
            message: 'Each availability slot must have startTime, endTime, and days array'
          });
        }

        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: 'Time must be in HH:MM format (24-hour)'
          });
        }

        if (slot.days.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Each availability slot must have at least one day'
          });
        }

        if (!slot.days.every(day => validDays.includes(day))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid day name. Valid days are: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
          });
        }

        const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
        const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;

        if (startTotal >= endTotal) {
          return res.status(400).json({
            success: false,
            message: 'Start time must be before end time for each availability slot'
          });
        }
      }

      // Check if user already exists (double check)
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create User
      let createdUser;
      try {
        createdUser = await User.create({
          name: `${firstName} ${lastName}`,
          email: email.toLowerCase(),
          password,
          isVerified: true // Mark as verified since OTP is correct
        });
      } catch (userError) {
        console.error('Error creating user:', userError);
        throw new Error('Failed to create user account');
      }

      // Create Profile
      let createdProfile;
      try {
        createdProfile = await Profile.create({
          userId: createdUser._id,
          firstName,
          lastName,
          dob,
          bio,
          teachSkills,
          learnSkills,
          availability,
          socialLinks: socialLinks || [],
          profilePic: profilePic || null,
          roadmap: null,
          suggestions: [],
          premiumStatus: false,
          creditNumber: 0
        });
      } catch (profileError) {
        console.error('Error creating profile, deleting user:', profileError);
        try {
          await User.findByIdAndDelete(createdUser._id);
        } catch (deleteError) {
          console.error('Error deleting user after profile creation failure:', deleteError);
        }
        throw new Error('Failed to create profile');
      }

      // Delete OTP record
      await OTP.deleteOne({ _id: otpRecord._id });

      const token = generateToken(createdUser._id);

      res.status(200).json({
        success: true,
        message: 'Account created and verified successfully',
        data: {
          token,
          user: {
            id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            isVerified: createdUser.isVerified
          }
        }
      });
    } else {
      // Existing user verification flow
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { isVerified: true },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await OTP.deleteOne({ _id: otpRecord._id });

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified
          }
        }
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists (for existing users) or if it's a new signup
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Existing user - check if profile exists
      const profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your profile first before requesting OTP'
        });
      }
    } else {
      // New signup - user doesn't exist yet, this is fine for resend during signup
    }

    const otpCode = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      await sendOTPEmail(email, otpCode);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status === 'Deleted') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deleted. Please contact support.'
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended due to community guideline violations.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    const token = generateToken(user._id);

    await logger.record(logger.INFO, `User logged in: ${user.name} (ID: ${user._id})`, user.name, user._id, 'LOGIN');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }

    const resetToken = PasswordReset.generateToken();

    await PasswordReset.create({
      userId: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must include uppercase, lowercase, and a number'
      });
    }

    const resetRecord = await PasswordReset.findOne({ token });
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (resetRecord.expiresAt < new Date()) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// Admin Login - Hardcoded credentials for development
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Hardcoded admin credentials for development
    const ADMIN_EMAIL = 'admin@hunarbazaar.com';
    const ADMIN_PASSWORD = 'Admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate a valid JWT token for admin
      const adminToken = jwt.sign(
        {
          userId: '65a88c304523a63321946890', // Fixed admin ID from backend/src/server.js
          isAdmin: true,
          email: email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token: adminToken,
        email: email
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
