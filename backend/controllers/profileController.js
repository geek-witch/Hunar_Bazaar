const User = require('../models/User');
const Profile = require('../models/Profile');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await Profile.findOne({ userId }).populate('userId', 'name email');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const user = await User.findById(userId).select('name email');

    const dobFormatted = profile.dob instanceof Date 
      ? profile.dob.toISOString().split('T')[0]
      : new Date(profile.dob).toISOString().split('T')[0];

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        dob: dobFormatted,
        about: profile.bio,
        availability: profile.availability || [],
        teachSkills: profile.teachSkills,
        learnSkills: profile.learnSkills,
        credits: profile.creditNumber,
        badges: 0, 
        profilePicUrl: profile.profilePic || null,
        socialLinks: profile.socialLinks || [],
        premiumStatus: profile.premiumStatus
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, dob, about, availability, teachSkills, learnSkills, socialLinks, profilePic } = req.body;

    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (dob !== undefined) profile.dob = dob;
    if (about !== undefined) {
      if (about.trim().length < 20 || about.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Bio must be between 20 and 500 characters'
        });
      }
      profile.bio = about;
    }
    if (availability !== undefined) {
      // Validate availability format if provided
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

      profile.availability = availability;
    }
    if (teachSkills !== undefined) {
      if (teachSkills.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one skill to teach is required'
        });
      }
      profile.teachSkills = teachSkills;
    }
    if (learnSkills !== undefined) {
      if (learnSkills.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one skill to learn is required'
        });
      }
      profile.learnSkills = learnSkills;
    }
    if (socialLinks !== undefined) profile.socialLinks = socialLinks;
    if (profilePic !== undefined) profile.profilePic = profilePic;

    await profile.save();

    if (firstName !== undefined || lastName !== undefined) {
      const user = await User.findById(userId);
      if (user) {
        user.name = `${profile.firstName} ${profile.lastName}`;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { password, reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized request'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    await Promise.all([
      Profile.deleteOne({ userId }),
      OTP.deleteMany({ email: user.email.toLowerCase() }),
      PasswordReset.deleteMany({ userId })
    ]);

    await User.deleteOne({ _id: userId });
    await Profile.deleteOne({ userId: userId })

    console.info('Account deleted via profile controller', {
      userId: userId.toString(),
      reason: reason || 'Not provided'
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Profile delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

