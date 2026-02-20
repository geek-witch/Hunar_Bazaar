const Skill = require("../models/Skill");
const Profile = require("../models/Profile");

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find({})
      .sort({ skillName: 1 })
      .lean();
    
    const skillNames = skills
      .map(skill => {
        return skill.skillName || skill.name || Object.values(skill).find(val => typeof val === 'string' && val.trim() !== '' && val !== skill._id?.toString());
      })
      .filter(skillName => skillName != null && typeof skillName === 'string' && skillName.trim() !== '');

    res.status(200).json({
      success: true,
      message: 'Skills fetched successfully',
      data: skillNames
    });
  } catch (error) {
    console.error('Get all skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills',
      error: error.message
    });
  }
};

exports.browseSkills = async (req, res) => {
  try {
    const searchTerm = (req.query.search || '').toString().trim();

    const filters = {};
    let blockedUserIds = [];
    
    if (req.user && req.user._id) {
      filters.userId = { $ne: req.user._id };
      
      // Fetch current user's blocked list
      const User = require('../models/User');
      const currentUser = await User.findById(req.user._id).select('blockedUsers').lean();
      blockedUserIds = (currentUser?.blockedUsers || []).map(id => id.toString());
    }
    
    if (searchTerm) {
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearchTerm, 'i');
      filters.$or = [
        { firstName: regex },
        { lastName: regex },
        { teachSkills: { $regex: escapedSearchTerm, $options: 'i' } },
        { learnSkills: { $regex: escapedSearchTerm, $options: 'i' } },
        { bio: regex }
      ];
    }

    // Add blocked users to filter to exclude them
    if (blockedUserIds.length > 0) {
      filters.userId = { $ne: req.user._id, $nin: blockedUserIds };
    }

    const profiles = await Profile.find(filters)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email isVerified')
      .lean();

    const results = profiles.map((profile) => {
      const fallbackName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Hunar Bazaar Member';
      return {
        id: profile.userId?._id?.toString() || profile._id.toString(),
        profileId: profile._id.toString(),
        name: profile.userId?.name || fallbackName,
        email: profile.userId?.email || '',
        teachSkills: profile.teachSkills || [],
        learnSkills: profile.learnSkills || [],
        availability: profile.availability || [],
        profilePic: profile.profilePic || null,
        isVerified: profile.userId?.isVerified || false
      };
    });

    res.status(200).json({
      success: true,
      message: 'Profiles fetched successfully',
      data: results
    });
  } catch (error) {
    console.error('Browse skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills',
      error: error.message
    });
  }
};
