const User = require('../models/User');
const Profile = require('../models/Profile');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const SupportIssue = require('../models/SupportIssue');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');


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

    const user = await User.findById(userId).select('name email friends rejectedRequestsCount');

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
        premiumStatus: profile.premiumStatus,
        friendCount: (user.friends || []).length,
        rejectedRequestsCount: user.rejectedRequestsCount || 0,
        skillsMastered: profile.skillsMastered || 0,
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

exports.masterSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.body; // Expect sessionId

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Verify user participated in this session
    const isLearner = session.learner_id && session.learner_id.toString() === userId.toString();
    const isParticipant = session.participants && session.participants.some(p => p.toString() === userId.toString());

    if (!isLearner && !isParticipant) {
      return res.status(403).json({ success: false, message: 'You did not participate in this session' });
    }

    // Verify session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Session must be completed to claim skill' });
    }

    // Check if feedback has been given for this session by THIS learner
    const hasFeedback = session.feedbackGivenBy && session.feedbackGivenBy.some(id => id.toString() === userId.toString());
    if (!hasFeedback && !session.feedbackGiven) {
      return res.status(400).json({
        success: false,
        message: 'Please provide feedback for your teacher from the Activity page before marking this skill as mastered'
      });
    }

    // Check if THIS learner has already claimed the skill
    const hasClaimedSkill = session.skillClaimedBy && session.skillClaimedBy.some(id => id.toString() === userId.toString());
    if (hasClaimedSkill) {
      return res.status(400).json({ success: false, message: 'You have already claimed skill mastery for this session' });
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Add this learner to skillClaimedBy array
    if (!session.skillClaimedBy) {
      session.skillClaimedBy = [];
    }
    session.skillClaimedBy.push(userId);

    // Update legacy field if all participants have claimed
    const allParticipants = session.participants && session.participants.length > 0
      ? session.participants
      : [session.learner_id];
    if (allParticipants.every(p => session.skillClaimedBy.some(sc => sc.toString() === p.toString()))) {
      session.skillClaimed = true;
    }
    await session.save();

    profile.skillsMastered = (profile.skillsMastered || 0) + 1;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Skill marked as mastered',
      skillsMastered: profile.skillsMastered
    });
  } catch (error) {
    console.error('Master skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error mastering skill',
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

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const fieldErrors = {};
      Object.keys(error.errors).forEach(key => {
        fieldErrors[key] = error.errors[key].message;
      });

      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed',
        errors: fieldErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized request'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
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

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: 'Profile id is required'
      });
    }

    const profile = await Profile.findById(profileId)
      .populate('userId', 'name email isVerified blockedUsers')
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Mutual visibility rules:
    // - If the profile owner has blocked the viewer, deny.
    // - If the viewer has blocked the profile owner, deny.
    if (req.user && req.user._id && profile.userId) {
      const profileUserId = profile.userId._id.toString();
      const currentUserId = req.user._id.toString();

      if (profileUserId !== currentUserId) {
        const ownerBlocked = (profile.userId.blockedUsers || []).map(id => id.toString()).includes(currentUserId);

        const viewer = await User.findById(currentUserId).select('blockedUsers').lean();
        const viewerBlocked = (viewer?.blockedUsers || []).map(id => id.toString()).includes(profileUserId);

        if (ownerBlocked || viewerBlocked) {
          return res.status(403).json({
            success: false,
            message: 'You cannot view this profile',
            blocked: true
          });
        }
      }
    }

    const fallbackName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Hunar Bazaar Member';

    // Determine relationship status with requesting user (if any)
    let status = 'none';
    let friendCount = 0;
    let rejectedRequestsCount = 0;

    if (profile.userId) {
      const profileUser = await User.findById(profile.userId._id).select('friends rejectedRequestsCount');
      friendCount = (profileUser.friends || []).length;
      rejectedRequestsCount = profileUser.rejectedRequestsCount || 0;

      if (req.user && req.user._id) {
        const currentUser = await User.findById(req.user._id).select('friends friendRequestsSent friendRequestsReceived');
        const pid = profile.userId._id.toString();
        const uid = currentUser._id.toString();

        if (pid === uid) {
          status = 'self';
        } else if ((currentUser.friends || []).map(String).includes(pid)) {
          status = 'friend';
        } else if ((currentUser.friendRequestsSent || []).map(String).includes(pid)) {
          status = 'pending-sent';
        } else if ((currentUser.friendRequestsReceived || []).map(String).includes(pid)) {
          status = 'pending-received';
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: profile.userId?._id?.toString() || profile._id.toString(),
        profileId: profile._id.toString(),
        name: profile.userId?.name || fallbackName,
        email: profile.userId?.email || '',
        bio: profile.bio || '',
        teachSkills: profile.teachSkills || [],
        learnSkills: profile.learnSkills || [],
        availability: profile.availability || [],
        profilePic: profile.profilePic || null,
        socialLinks: profile.socialLinks || [],
        isVerified: profile.userId?.isVerified || false,
        friendCount,
        rejectedRequestsCount,
        isVerified: profile.userId?.isVerified || false,
        friendCount,
        rejectedRequestsCount,
        relationshipStatus: status,
        skillsMastered: profile.skillsMastered || 0,
        credits: profile.creditNumber || 0,
        badges: profile.badges || []
      }
    });
  } catch (error) {
    console.error('Get profile by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Get profile by user id (used by frontend when we only have userId)
exports.getProfileByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'User id required' });

    const profile = await Profile.findOne({ userId }).populate('userId', 'name email isVerified blockedUsers').lean();
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Mutual visibility rules (same as getProfileById)
    if (req.user && req.user._id && profile.userId) {
      const profileUserId = profile.userId._id.toString();
      const currentUserId = req.user._id.toString();

      if (profileUserId !== currentUserId) {
        const ownerBlocked = (profile.userId.blockedUsers || []).map(id => id.toString()).includes(currentUserId);

        const viewer = await User.findById(currentUserId).select('blockedUsers').lean();
        const viewerBlocked = (viewer?.blockedUsers || []).map(id => id.toString()).includes(profileUserId);

        if (ownerBlocked || viewerBlocked) {
          return res.status(403).json({ success: false, message: 'You cannot view this profile', blocked: true });
        }
      }
    }

    const fallbackName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Hunar Bazaar Member';

    // Determine relationship status and counts similar to getProfileById
    let status = 'none';
    let friendCount = 0;
    let rejectedRequestsCount = 0;

    if (profile.userId) {
      const profileUser = await User.findById(profile.userId._id).select('friends rejectedRequestsCount');
      friendCount = (profileUser.friends || []).length;
      rejectedRequestsCount = profileUser.rejectedRequestsCount || 0;

      if (req.user && req.user._id) {
        const currentUser = await User.findById(req.user._id).select('friends friendRequestsSent friendRequestsReceived');
        const pid = profile.userId._id.toString();
        const uid = currentUser._id.toString();

        if (pid === uid) {
          status = 'self';
        } else if ((currentUser.friends || []).map(String).includes(pid)) {
          status = 'friend';
        } else if ((currentUser.friendRequestsSent || []).map(String).includes(pid)) {
          status = 'pending-sent';
        } else if ((currentUser.friendRequestsReceived || []).map(String).includes(pid)) {
          status = 'pending-received';
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: profile.userId?._id?.toString() || profile._id.toString(),
        profileId: profile._id.toString(),
        name: profile.userId?.name || fallbackName,
        email: profile.userId?.email || '',
        bio: profile.bio || '',
        teachSkills: profile.teachSkills || [],
        learnSkills: profile.learnSkills || [],
        availability: profile.availability || [],
        profilePic: profile.profilePic || null,
        socialLinks: profile.socialLinks || [],
        isVerified: profile.userId?.isVerified || false,
        friendCount,
        rejectedRequestsCount,
        relationshipStatus: status,
        skillsMastered: profile.skillsMastered || 0,
        credits: profile.creditNumber || 0,
        badges: profile.badges || []
      }
    });
  } catch (error) {
    console.error('Get profile by user id error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};

// Send a friend request from authenticated user to target user id
exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const targetUserId = req.params.userId;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user id is required' });
    }

    if (senderId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(targetUserId)
    ]);

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    if ((recipient.friends || []).map(String).includes(senderId.toString())) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    if ((recipient.friendRequestsReceived || []).map(String).includes(senderId.toString())) {
      return res.status(400).json({ success: false, message: 'Request already pending' });
    }

    // Add request
    recipient.friendRequestsReceived = Array.from(new Set([...(recipient.friendRequestsReceived || []), senderId]));
    sender.friendRequestsSent = Array.from(new Set([...(sender.friendRequestsSent || []), recipient._id]));

    await Promise.all([recipient.save(), sender.save()]);

    // Create notification for recipient
    await Notification.create({
      userId: recipient._id,
      message: `You received a friend request from ${sender.name}`,
      type: 'friend_request',
      isRead: false
    });


    res.status(200).json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: 'Error sending friend request', error: error.message });
  }
};

// Respond to a friend request: accept or reject
exports.respondFriendRequest = async (req, res) => {
  try {
    const recipientId = req.user._id; // the one responding
    const senderId = req.params.userId;
    const { action } = req.body; // 'accept' or 'reject'

    if (!senderId) return res.status(400).json({ success: false, message: 'Sender id required' });
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action' });

    const [recipient, sender] = await Promise.all([
      User.findById(recipientId),
      User.findById(senderId)
    ]);

    if (!sender || !recipient) return res.status(404).json({ success: false, message: 'User not found' });

    // ensure request exists
    if (!((recipient.friendRequestsReceived || []).map(String).includes(senderId.toString()))) {
      return res.status(400).json({ success: false, message: 'No pending request from this user' });
    }

    // remove from pending lists
    recipient.friendRequestsReceived = (recipient.friendRequestsReceived || []).filter(id => id.toString() !== senderId.toString());
    sender.friendRequestsSent = (sender.friendRequestsSent || []).filter(id => id.toString() !== recipientId.toString());

    if (action === 'accept') {
      // add to friends both ways
      recipient.friends = Array.from(new Set([...(recipient.friends || []), sender._id]));
      sender.friends = Array.from(new Set([...(sender.friends || []), recipient._id]));
    } else if (action === 'reject') {
      // increment sender's rejectedRequestsCount so they can see it's rejected
      sender.rejectedRequestsCount = (sender.rejectedRequestsCount || 0) + 1;
    }

    await Promise.all([recipient.save(), sender.save()]);

    // Mirror friendship to Firestore for security rules (only if accepted)
    if (action === 'accept') {
      try {
        const { mirrorFriendshipToFirestore } = require('../utils/firestoreFriendship');
        // mirrorFriendshipToFirestore already creates both documents in one batch
        await mirrorFriendshipToFirestore(recipient._id, sender._id, true);
        console.log(`✓ Successfully mirrored friendship to Firestore: ${recipient._id} <-> ${sender._id}`);

        // Small delay to ensure Firestore has propagated the documents
        // This helps with eventual consistency when security rules check friendships
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create notification for the sender that their request was accepted
        await Notification.create({
          userId: sender._id,
          message: `${recipient.name} accepted your friend request`,
          type: 'friend_request', // Or we could add a new type like 'friend_request_accepted' but 'friend_request' is fine if title handles it
          title: 'Request Accepted',
          isRead: false
        });

      } catch (firestoreError) {
        console.error('✗ Failed to mirror friendship to Firestore:', firestoreError);
        console.error('  This may cause permission errors when users try to chat.');
        // Continue anyway - MongoDB operation succeeded
        // But log the error so we know there's an issue
      }
    }

    res.status(200).json({ success: true, message: `Request ${action}ed` });
  } catch (error) {
    console.error('Respond friend request error:', error);
    res.status(500).json({ success: false, message: 'Error responding to friend request', error: error.message });
  }
};

// Get lists of incoming/outgoing friend requests for authenticated user
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const incomingIds = (user.friendRequestsReceived || []).map(id => id.toString());
    const outgoingIds = (user.friendRequestsSent || []).map(id => id.toString());

    const incomingUsers = await User.find({ _id: { $in: incomingIds } }).select('name email');
    const outgoingUsers = await User.find({ _id: { $in: outgoingIds } }).select('name email');

    // fetch profile pics
    const Profile = require('../models/Profile');
    const profileDocs = await Profile.find({ userId: { $in: [...incomingIds, ...outgoingIds] } }).select('userId profilePic').lean();
    const picMap = {};
    profileDocs.forEach(p => {
      picMap[p.userId.toString()] = p.profilePic || null;
    });

    res.status(200).json({
      success: true,
      data: {
        incoming: (incomingUsers || []).map(u => ({ id: u._id.toString(), name: u.name, email: u.email, profilePic: picMap[u._id.toString()] || null })),
        outgoing: (outgoingUsers || []).map(u => ({ id: u._id.toString(), name: u.name, email: u.email, profilePic: picMap[u._id.toString()] || null }))
      }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ success: false, message: 'Error fetching friend requests', error: error.message });
  }
};

// Get friends list for authenticated user (includes blocked users so they can be identified)
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const friendIds = (user.friends || []).map(id => id.toString());
    const blockedIds = (user.blockedUsers || []).map(id => id.toString());

    // Get both friends and blocked users so blocked users can be displayed with their names/avatars
    const allUserIds = [...new Set([...friendIds, ...blockedIds])];
    const users = await User.find({ _id: { $in: allUserIds } }).select('name email');

    const Profile = require('../models/Profile');
    const profileDocs = await Profile.find({ userId: { $in: allUserIds } }).select('userId profilePic').lean();
    const picMap = {};
    const profileIdMap = {};
    profileDocs.forEach(p => {
      picMap[p.userId.toString()] = p.profilePic || null;
      profileIdMap[p.userId.toString()] = p._id ? p._id.toString() : null;
    });

    // Map users with blocked status
    const result = users.map(u => {
      const uid = u._id.toString();
      return {
        id: uid,
        name: u.name,
        email: u.email,
        profilePic: picMap[uid] || null,
        profileId: profileIdMap[uid] || null,
        isBlocked: blockedIds.includes(uid)
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: 'Error fetching friends', error: error.message });
  }
};

// Block a user: add to blockedUsers list, remove any friendship and pending requests, and mirror removal in Firestore.
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.userId;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'User id required' });
    }

    if (userId.toString() === targetId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    const [user, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetId)
    ]);

    if (!user || !target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure blockedUsers exists
    user.blockedUsers = user.blockedUsers || [];

    // Add to blocked list if not already present
    if (!user.blockedUsers.map(id => id.toString()).includes(targetId.toString())) {
      user.blockedUsers.push(target._id);
    }

    // Remove from friends on both sides
    user.friends = (user.friends || []).filter(id => id.toString() !== targetId.toString());
    target.friends = (target.friends || []).filter(id => id.toString() !== userId.toString());

    // Remove any pending friend requests between the users
    user.friendRequestsReceived = (user.friendRequestsReceived || []).filter(id => id.toString() !== targetId.toString());
    user.friendRequestsSent = (user.friendRequestsSent || []).filter(id => id.toString() !== targetId.toString());
    target.friendRequestsReceived = (target.friendRequestsReceived || []).filter(id => id.toString() !== userId.toString());
    target.friendRequestsSent = (target.friendRequestsSent || []).filter(id => id.toString() !== userId.toString());

    await Promise.all([user.save(), target.save()]);

    // Log user block action
    await logger.record(
      logger.INFO,
      `User ${user.name} (ID: ${userId}) blocked User ${target.name} (ID: ${targetId})`,
      user.name,
      userId,
      'USER_BLOCK'
    );

    // Remove friendship mirror from Firestore and delete conversation
    try {
      const { mirrorFriendshipToFirestore } = require('../utils/firestoreFriendship');
      const { deleteConversationFromFirestore } = require('../utils/firestoreFriendship');
      await Promise.all([
        mirrorFriendshipToFirestore(userId, targetId, false),
        mirrorFriendshipToFirestore(targetId, userId, false),
        deleteConversationFromFirestore(userId, targetId),
      ]);
    } catch (firestoreError) {
      console.error('Failed to update Firestore when blocking user:', firestoreError);
    }

    return res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    return res.status(500).json({ success: false, message: 'Error blocking user', error: error.message });
  }
};

// Unblock a user: remove from blockedUsers list.
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.userId;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'User id required' });
    }

    if (userId.toString() === targetId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot unblock yourself' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.blockedUsers = (user.blockedUsers || []).filter(id => id.toString() !== targetId.toString());

    await user.save();

    return res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    return res.status(500).json({ success: false, message: 'Error unblocking user', error: error.message });
  }
};

// Check if a user is blocked by the current user
exports.checkBlocked = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.userId;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'User id required' });
    }

    const user = await User.findById(userId).select('blockedUsers');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isBlocked = (user.blockedUsers || []).map(id => id.toString()).includes(targetId.toString());

    return res.status(200).json({
      success: true,
      data: { isBlocked }
    });
  } catch (error) {
    console.error('Check blocked error:', error);
    return res.status(500).json({ success: false, message: 'Error checking blocked status', error: error.message });
  }
};

// Get list of users blocked by current user
exports.getBlockedByMe = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('blockedUsers').populate({
      path: 'blockedUsers',
      select: 'name profilePic'
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const blockedList = (user.blockedUsers || []).map(blockedUser => ({
      id: blockedUser._id,
      name: blockedUser.name,
      profilePic: blockedUser.profilePic
    }));

    return res.status(200).json({
      success: true,
      data: blockedList
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching blocked users', error: error.message });
  }
};

// Get user progress stats for dashboard
// Get user progress stats for dashboard
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get Profile (Credits, Badges, Total Learned Hours)
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // 2. Count Mastered Skills (Dynamic)
    // Count sessions where user was learner/participant AND skill was claimed
    const skillsMasteredCount = await Session.countDocuments({
      $or: [{ learner_id: userId }, { participants: userId }],
      status: 'completed',
      skillClaimed: true
    });

    // 3. Count Sessions Taught (Conducted)
    const sessionsTaughtCount = await Session.countDocuments({
      teacher_id: userId,
      status: 'completed'
    });

    // 4. Count Sessions Learned (Attended)
    const sessionsLearnedCount = await Session.countDocuments({
      $or: [{ learner_id: userId }, { participants: userId }],
      status: 'completed'
    });

    // 5. Calculate Active Skills
    // Find all completed sessions for this user (Learning)
    const completedSessions = await Session.find({
      $or: [{ learner_id: userId }, { participants: userId }],
      status: 'completed'
    }).select('skill_id duration skillClaimed');

    const skillMap = {};

    completedSessions.forEach(s => {
      // If skill is already mastered (claimed), allow it in map but mark as claimed
      const skill = s.skill_id;
      const hours = s.duration || 1;

      if (!skillMap[skill]) {
        skillMap[skill] = { hours: 0, sessions: 0, claimed: false };
      }
      skillMap[skill].hours += hours;
      skillMap[skill].sessions += 1;
      if (s.skillClaimed) skillMap[skill].claimed = true;
    });

    // Filter to show active skills (unclaimed) based on user feedback
    const activeSkills = Object.keys(skillMap)
      .filter(skill => !skillMap[skill].claimed)
      .map(skill => {
        const hours = skillMap[skill].hours;
        const progress = Math.min((hours / 10) * 100, 100);

        return {
          skill: skill,
          progress: Math.round(progress),
          sessionsCount: skillMap[skill].sessions,
          hoursSpent: hours
        };
      });

    res.status(200).json({
      success: true,
      data: {
        totalLearnedHours: profile.totalLearnedHours || 0,
        skillsMastered: skillsMasteredCount,
        sessionsDone: sessionsLearnedCount, // Keep "Sessions Done" as Learning for consistency with "Learned Hours"
        sessionsTaught: sessionsTaughtCount, // Send this separately
        creditsEarned: profile.creditNumber || 0,
        badges: profile.badges || [],
        activeSkills: activeSkills
      }
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ success: false, message: 'Error fetching progress', error: error.message });
  }
};

// Remove friend (unfriend) both sides
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherId = req.params.userId;

    if (!otherId) return res.status(400).json({ success: false, message: 'User id required' });
    if (userId.toString() === otherId.toString()) return res.status(400).json({ success: false, message: 'Cannot remove yourself' });

    const [user, other] = await Promise.all([
      User.findById(userId),
      User.findById(otherId)
    ]);

    if (!other || !user) return res.status(404).json({ success: false, message: 'User not found' });

    user.friends = (user.friends || []).filter(id => id.toString() !== otherId.toString());
    other.friends = (other.friends || []).filter(id => id.toString() !== userId.toString());

    await Promise.all([user.save(), other.save()]);

    // Remove friendship from Firestore mirror
    const { mirrorFriendshipToFirestore } = require('../utils/firestoreFriendship');
    await Promise.all([
      mirrorFriendshipToFirestore(userId, otherId, false),
      mirrorFriendshipToFirestore(otherId, userId, false),
    ]);

    res.status(200).json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: 'Error removing friend', error: error.message });
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

    // 🚀 Clean up Firestore friendships before deleting the user
    try {
      const { mirrorFriendshipToFirestore } = require('../utils/firestoreFriendship');
      const friends = user.friends || [];
      if (friends.length > 0) {
        console.log(`Cleaning up ${friends.length} Firestore friendships for deleting user ${userId}`);
        // We use a simple loop here. mirrorFriendshipToFirestore handles the batch inside.
        // Actually, mirrorFriendshipToFirestore(userId, friendId, false) removes it both ways.
        for (const friendId of friends) {
          await mirrorFriendshipToFirestore(userId, friendId, false).catch(err =>
            console.error(`Failed to remove Firestore friendship with ${friendId} during account deletion:`, err)
          );
        }
      }
    } catch (firestoreError) {
      console.error('Error during Firestore friendship cleanup for account deletion:', firestoreError);
    }

    // Log account deletion
    await logger.record(
      logger.INFO,
      `User ${user.name} (ID: ${userId}) deleted their account`,
      user.name,
      userId,
      'ACCOUNT_DELETE'
    );

    await Promise.all([
      Profile.deleteOne({ userId }),
      OTP.deleteMany({ email: user.email.toLowerCase() }),
      PasswordReset.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
      SupportIssue.deleteMany({ userId: userId })
    ]);

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

