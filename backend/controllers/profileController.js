const User = require('../models/User');
const Profile = require('../models/Profile');

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
        availability: profile.availability,
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
    if (availability !== undefined) profile.availability = availability;
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

