const Session = require('../models/Session');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// Create a new session (teacher creates session for student(s))
exports.createSession = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { learner_id, learner_ids, skill_id, date, time, level, topic } = req.body;

    // Validate required fields
    if (!skill_id || !date || !time || !level || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: skill_id, date, time, level, topic'
      });
    }

    const validLevels = ['Introductory', 'Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session level'
      });
    }

    // Handle both single learner (backward compatibility) and multiple learners
    let participantIds = [];
    if (learner_ids && Array.isArray(learner_ids) && learner_ids.length > 0) {
      participantIds = learner_ids;
    } else if (learner_id) {
      participantIds = [learner_id];
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one student must be selected (learner_id or learner_ids)'
      });
    }

    // Remove duplicates and validate participant IDs
    participantIds = [...new Set(participantIds.map(id => id.toString()))];

    if (participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid student must be selected'
      });
    }

    // Verify all participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more students not found'
      });
    }

    // Verify teacher and all participants are friends
    const teacher = await User.findById(teacherId);
    const teacherFriendIds = teacher.friends ? teacher.friends.map(id => id.toString()) : [];

    const nonFriends = participantIds.filter(id => !teacherFriendIds.includes(id.toString()));
    if (nonFriends.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only schedule sessions with your friends'
      });
    }

    // Verify skill is in teacher's teachSkills
    const teacherProfile = await Profile.findOne({ userId: teacherId });
    if (!teacherProfile || !teacherProfile.teachSkills.includes(skill_id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only schedule sessions for skills you can teach'
      });
    }

    // Check for existing reports between teacher and any participant
    const UserReport = require('../models/UserReport');
    const existingReport = await UserReport.findOne({
      $or: [
        { reporterId: teacherId, reportedUserId: { $in: participantIds } },
        { reporterId: { $in: participantIds }, reportedUserId: teacherId }
      ]
    });

    if (existingReport) {
      return res.status(403).json({
        success: false,
        message: 'Cannot schedule session: One or more participants have an active report conflict with you.'
      });
    }

    // Fairness check: prevent teacher from scheduling two consecutive teaching sessions
    // with the same participant(s) for the same skill.
    const fairnessResults = await Promise.all(participantIds.map(async (participantId) => {
      const lastSession = await Session.findOne({
        status: 'completed',
        $or: [
          {
            teacher_id: teacherId,
            $or: [{ learner_id: participantId }, { participants: participantId }]
          },
          {
            teacher_id: participantId,
            $or: [{ learner_id: teacherId }, { participants: teacherId }]
          }
        ]
      })
        .sort({ date: -1, time: -1 })
        .limit(1);

      if (lastSession && lastSession.teacher_id.toString() === teacherId.toString() &&
        lastSession.skill_id && skill_id && lastSession.skill_id.toString() === skill_id.toString()) {
        const participant = participants.find(p => p._id.toString() === participantId.toString());
        return participant ? participant.name : 'this user';
      }
      return null;
    }));

    const problematicParticipant = fairnessResults.find(name => name !== null);
    if (problematicParticipant) {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule two consecutive teaching sessions of the same skill with ${problematicParticipant}. Try a different skill or wait until another session occurs.`
      });
    }

    // Validate date is in the future
    const dateTimeStr = `${date}T${time}`;
    const sessionDateTime = new Date(dateTimeStr);
    const now = new Date();
    if (sessionDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Session date and time must be in the future'
      });
    }

    const sessionDate = new Date(date);

    // Determine end time: prefer explicit end_time, otherwise use duration (hours), otherwise default 1 hour
    let endDateTime = null;
    if (req.body.end_time) {
      endDateTime = new Date(req.body.end_time);
    } else if (req.body.duration) {
      const dur = Number(req.body.duration);
      if (!isNaN(dur) && dur > 0) {
        endDateTime = new Date(sessionDateTime.getTime() + dur * 60 * 60 * 1000);
      }
    }
    if (!endDateTime) {
      // default to 1 hour sessions
      endDateTime = new Date(sessionDateTime.getTime() + 60 * 60 * 1000);
    }

    // Create session with multiple participants
    const roomName = `session_${teacherId}_${Date.now()}`;

    const session = new Session({
      learner_id: participantIds[0], // For backward compatibility
      teacher_id: teacherId,
      participants: participantIds,
      skill_id,
      session_type: 'teaching',
      session_level: level,
      session_topic: topic,
      status: 'upcoming',
      date: sessionDate,
      time,
      start_time: sessionDateTime,
      end_time: endDateTime,
      meeting_room: roomName,
      feedback: null
    });

    await session.save();

    // Send notifications and logging in background tasks
    (async () => {
      try {
        // Teacher notification
        const notifications = [
          {
            userId: teacherId,
            type: 'session_request_new',
            entityId: session._id,
            message: `You have successfully scheduled a session for ${session.skill_id} on ${session.date.toLocaleDateString()} at ${session.time}.`
          }
        ];

        // Participant notifications
        participantIds.forEach(participantId => {
          notifications.push({
            userId: participantId,
            type: 'session_request_new',
            entityId: session._id,
            message: `${teacher.name} has scheduled a session with you for ${session.skill_id} on ${session.date.toLocaleDateString()} at ${session.time}.`
          });
        });

        await Notification.insertMany(notifications);

        // Emails (Run in parallel, don't block response)
        const emailService = require('../utils/emailService');
        const participantEmails = participants.map(p => ({ email: p.email, name: p.name }));
        Promise.all(participantEmails.map(participant =>
          emailService.sendSessionNotification(
            participant.email,
            participant.name,
            teacher.name,
            skill_id,
            sessionDate.toLocaleDateString(),
            time,
            'scheduled'
          ).catch(e => console.error('Email error:', e))
        ));

        // Skill-based notifications (Broad broadcast)
        const Profile = require('../models/Profile');
        const learningProfiles = await Profile.find({
          learnSkills: skill_id,
          userId: { $nin: [teacherId, ...participantIds] }
        }).select('userId').lean();

        if (learningProfiles.length > 0) {
          const streamNotifications = learningProfiles.map(profile => ({
            userId: profile.userId,
            type: 'skill_based_session_available',
            entityId: session._id,
            relatedUserId: teacherId,
            message: `${teacher.name} has scheduled a session for ${skill_id} on ${session.date.toLocaleDateString()} at ${session.time}. Click to view and request to join.`
          }));
          await Notification.insertMany(streamNotifications);
        }

        await logger.record(logger.INFO, `New session created for ${session.skill_id} by ${teacher.name}`, teacher.name, teacherId, 'SESSION_CREATE');
      } catch (err) {
        console.error('Error in session creation background tasks:', err);
      }
    })();

    res.status(201).json({
      success: true,
      message: `Session created successfully with ${participantIds.length} participant(s)`,
      data: {
        ...session.toObject(),
        participantCount: participantIds.length
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating session',
      error: error.message
    });
  }
};

// Get sessions for current user (both as teacher and learner)
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { filter, search, limit } = req.query;

    // Build query
    // Build query using $and to correctly combine role checks and status filters
    const andConditions = [];

    // 1. Role Check: User must be involved in the session
    const roleCondition = {};
    if (filter === 'teaching') {
      roleCondition.teacher_id = userId;
    } else if (filter === 'learning') {
      roleCondition.$or = [
        { learner_id: userId },
        { participants: userId },
        { cancelled_participants: userId }
      ];
    } else {
      // All
      roleCondition.$or = [
        { teacher_id: userId },
        { learner_id: userId },
        { participants: userId },
        { cancelled_participants: userId }
      ];
    }
    andConditions.push(roleCondition);

    // 2. Hidden Check: Exclude sessions hidden by the user
    andConditions.push({ hidden_for_users: { $ne: userId } });

    // 3. Status Filter
    const statusFilter = req.query.status;
    if (statusFilter) {
      if (statusFilter === 'past') {
        andConditions.push({
          $or: [
            { status: { $in: ['completed', 'cancelled', 'expired', 'cancelled_by_teacher'] } },
            { cancelled_participants: userId }, // If I cancelled, it's "past" for me even if status is upcoming
            { completed_participants: userId } // If I marked learned individually, treat as past for me
          ]
        });
      } else if (statusFilter === 'upcoming') {
        andConditions.push({
          status: 'upcoming',
          cancelled_participants: { $ne: userId }, // If I cancelled, it's NOT upcoming for me
          completed_participants: { $ne: userId } // If I already marked learned, it's NOT upcoming for me
        });
      } else if (statusFilter === 'completed') {
        andConditions.push({ status: 'completed' });
      } else if (statusFilter === 'cancelled_expired') {
        andConditions.push({
          $or: [
            { status: { $in: ['cancelled', 'expired', 'cancelled_by_teacher'] } },
            { cancelled_participants: userId } // Show here if I cancelled individually
          ]
        });
      }
    }

    const query = { $and: andConditions };

    // Check for expired sessions and update them
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Check for expired sessions and update them in background
    Session.updateMany(
      {
        status: 'upcoming',
        $or: [
          { start_time: { $lt: thirtyMinsAgo } },
          { start_time: null, date: { $lt: new Date(new Date().setHours(0, 0, 0, 0)) } }
        ]
      },
      { $set: { status: 'expired' } }
    ).catch(e => console.error('Expired session update error:', e));

    let sessions = await Session.find(query)
      .populate('learner_id', 'name email')
      .populate('teacher_id', 'name email')
      .populate('participants', 'name email')
      .sort({ date: -1, time: -1 })
      .lean();

    // Get profile pictures for all users (teacher, learner, and participants)
    const Profile = require('../models/Profile');
    const userIds = new Set();
    sessions.forEach(s => {
      if (s.learner_id) userIds.add(s.learner_id._id.toString());
      userIds.add(s.teacher_id._id.toString());
      if (s.participants && s.participants.length > 0) {
        s.participants.forEach(p => userIds.add(p._id.toString()));
      }
    });

    const profiles = await Profile.find({ userId: { $in: Array.from(userIds) } })
      .select('userId profilePic')
      .lean();

    const picMap = {};
    profiles.forEach(p => {
      picMap[p.userId.toString()] = p.profilePic || null;
    });

    // Fetch requesting user's profile to get skillEndedBy (per-skill end-learning tracker)
    const requesterProfile = await Profile.findOne({ userId }).select('skillEndedBy').lean();
    const endedSkillIds = new Set(
      (requesterProfile?.skillEndedBy || []).map(entry => entry.skillId)
    );

    // Add profile pics and determine type
    sessions = sessions.map(session => {
      const isTeacher = session.teacher_id._id.toString() === userId.toString();

      // Determine per-user display status: cancelled overrides individual, then per-user completed, else global status
      let displayStatus = session.status;
      if (session.cancelled_participants &&
        session.cancelled_participants.some(id => id.toString() === userId.toString())) {
        displayStatus = 'cancelled';
      } else if (session.completed_participants && session.completed_participants.some(id => id.toString() === userId.toString())) {
        displayStatus = 'completed';
      } else if (session.status === 'completed') {
        displayStatus = 'completed';
      }

      // Determine participant info for display
      let participantInfo = '';
      let participantAvatar = '/asset/p4.jpg';

      if (isTeacher) {
        // Teacher view - show participants
        if (session.participants && session.participants.length > 0) {
          if (session.participants.length === 1) {
            participantInfo = session.participants[0].name;
            participantAvatar = picMap[session.participants[0]._id.toString()] || '/asset/p4.jpg';
          } else {
            participantInfo = `${session.participants.length} students`;
            // Use first participant's avatar or default
            participantAvatar = picMap[session.participants[0]._id.toString()] || '/asset/p4.jpg';
          }
        } else if (session.learner_id) {
          // Backward compatibility
          participantInfo = session.learner_id.name;
          participantAvatar = picMap[session.learner_id._id.toString()] || '/asset/p4.jpg';
        }
      } else {
        // Student view - show teacher
        participantInfo = session.teacher_id.name;
        participantAvatar = picMap[session.teacher_id._id.toString()] || '/asset/p4.jpg';
      }

      // Format duration (optional field - for backward compatibility with old records)
      let durationStr = undefined;
      if (session.duration !== undefined && session.duration !== null) {
        if (session.duration === 0.5) {
          durationStr = '30 minutes';
        } else if (session.duration === 1) {
          durationStr = '1 hour';
        } else if (session.duration === 1.5) {
          durationStr = '1.5 hours';
        } else {
          durationStr = `${session.duration} hours`;
        }
      }

      // Check if THIS user has given feedback (for learners)
      const userHasGivenFeedback = !isTeacher && session.feedbackGivenBy
        ? session.feedbackGivenBy.some(id => id.toString() === userId.toString())
        : session.feedbackGiven || false;

      // Check if THIS user has claimed skill (for learners)
      const userHasClaimedSkill = !isTeacher && session.skillClaimedBy
        ? session.skillClaimedBy.some(id => id.toString() === userId.toString())
        : session.skillClaimed || false;

      const userHasCompleted = session.completed_participants && session.completed_participants.some(id => id.toString() === userId.toString());

      return {
        ...session,
        status: displayStatus,
        tutorName: participantInfo,
        tutorAvatar: participantAvatar,
        skill: session.skill_id,
        topic: session.session_topic,
        type: isTeacher ? 'teaching' : 'learning',
        date: session.date.toISOString().split('T')[0],
        duration: durationStr,
        id: session._id.toString(),
        participantCount: session.participants ? session.participants.length : 1,
        participantNames: session.participants ? session.participants.map(p => p.name) : (session.learner_id ? [session.learner_id.name] : []),
        feedbackGiven: userHasGivenFeedback,
        skillClaimed: userHasClaimedSkill,
        skillEnded: !isTeacher && endedSkillIds.has(session.skill_id),
        level: session.session_level
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      sessions = sessions.filter(s =>
        s.skill.toLowerCase().includes(searchLower) ||
        s.tutorName.toLowerCase().includes(searchLower) ||
        (s.participantNames && s.participantNames.some(name => name.toLowerCase().includes(searchLower)))
      );
    }

    // Limit past sessions if not searching
    if (!search && statusFilter === 'past') {
      const limitNum = parseInt(limit) || 5;
      sessions = sessions.slice(0, limitNum);
    }

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message
    });
  }
};

// Cancel a session
exports.cancelSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId)
      .populate('teacher_id', 'name email')
      .populate('learner_id', 'name email')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user is either teacher, learner, or participant
    const isTeacher = session.teacher_id._id.toString() === userId.toString();
    const isLearner = session.learner_id && session.learner_id._id.toString() === userId.toString();
    const isParticipant = session.participants && session.participants.some(p => p._id.toString() === userId.toString());

    if (!isTeacher && !isLearner && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own sessions'
      });
    }

    // Only allow cancelling upcoming sessions
    if (session.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Only upcoming sessions can be cancelled'
      });
    }

    const emailService = require('../utils/emailService');

    // CASE 1: Teacher Cancels (Global Cancellation)
    if (isTeacher) {
      session.status = 'cancelled_by_teacher';
      await session.save();

      // Notify all participants
      try {
        const participantsToNotify = [];
        if (session.participants && session.participants.length > 0) {
          participantsToNotify.push(...session.participants);
        } else if (session.learner_id) {
          participantsToNotify.push(session.learner_id);
        }

        for (const participant of participantsToNotify) {
          await emailService.sendSessionNotification(
            participant.email,
            participant.name,
            session.teacher_id.name,
            session.skill_id,
            session.date.toLocaleDateString(),
            session.time,
            'cancelled' // You might want to update email template to handle 'cancelled_by_teacher' specific text if needed, but 'cancelled' generic is fine
          );
          await Notification.create({
            userId: participant._id,
            type: 'session_cancelled',
            entityId: session._id,
            message: `Your session for ${session.skill_id} on ${session.date.toLocaleDateString()} at ${session.time} with ${session.teacher_id.name} has been cancelled by the teacher.`
          });
        }
      } catch (emailError) {
        console.error('Error sending cancellation notifications:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'Session cancelled for all students.',
        data: session
      });
    }

    // CASE 2: Student Cancels (Individual Cancellation)
    if (isLearner || isParticipant) {
      // Add to cancelled_participants if not already there
      if (!session.cancelled_participants.includes(userId)) {
        session.cancelled_participants.push(userId);
      }

      // Remove from participants
      session.participants = session.participants.filter(p => p._id.toString() !== userId.toString());

      // If it was the legacy learner_id, we might want to clear it or handle it, 
      // but for now relying on participants array being the source of truth for "active" students.
      // If the session has NO active participants left, we treat it as fully cancelled.

      const activeParticipantsCount = session.participants.length;

      let message = 'You have cancelled your participation.';

      if (activeParticipantsCount === 0) {
        session.status = 'cancelled';
        message = 'You have cancelled your participation. Session is now fully cancelled as no students remain.';

        // Notify Teacher that the LAST student cancelled
        try {
          await emailService.sendSessionNotification(
            session.teacher_id.email,
            session.teacher_id.name,
            'All Students', // or specific student name
            session.skill_id,
            session.date.toLocaleDateString(),
            session.time,
            'cancelled'
          );
          await Notification.create({
            userId: session.teacher_id._id,
            type: 'session_cancelled',
            entityId: session._id,
            message: `Your session for ${session.skill_id} on ${session.date.toLocaleDateString()} at ${session.time} has been cancelled by all participants.`
          });
        } catch (e) { console.error(e); }

      } else {
        // Notify Teacher that ONE student cancelled, but session continues
        // (Optional: Implement a specific "student_dropped" email type if desired, otherwise silent or generic update)
        try {
          const cancelledParticipant = session.participants.find(p => p._id.toString() === userId.toString());
          if (cancelledParticipant) {
            await Notification.create({
              userId: session.teacher_id._id,
              type: 'session_request_declined',
              entityId: session._id,
              message: `${cancelledParticipant.name} has cancelled their participation in your session for ${session.skill_id} on ${session.date.toLocaleDateString()} at ${session.time}.`
            });
          }
        } catch (e) { console.error(e); }
      }

      await session.save();

      return res.status(200).json({
        success: true,
        message: message,
        data: session
      });
    }

  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling session',
      error: error.message
    });
  }
};

// Join session (updated implementation)
exports.joinSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId)
      .populate('learner_id', 'name email')
      .populate('teacher_id', 'name email')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user is either teacher, learner, or participant
    const isTeacher = session.teacher_id._id.toString() === userId.toString();
    const isLearner = session.learner_id && session.learner_id._id.toString() === userId.toString();
    const isParticipant = session.participants && session.participants.some(p => p._id.toString() === userId.toString());

    if (!isTeacher && !isLearner && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only join sessions you are invited to'
      });
    }

    // Check if session is upcoming
    if (session.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'This session is not available for joining'
      });
    }

    // Check if session time has arrived
    const sessionDateTime = new Date(`${session.date.toISOString().split('T')[0]}T${session.time}`);
    const now = new Date();

    // Expire link 30 minutes after session start (fallback to start_time if present)
    const startTime = session.start_time ? new Date(session.start_time) : sessionDateTime;
    if (session.meeting_link_expired || now.getTime() > (startTime.getTime() + 30 * 60 * 1000)) {
      session.meeting_link_expired = true;
      try { await session.save(); } catch (e) { /* ignore save errors */ }
      return res.status(400).json({
        success: false,
        message: 'Meeting link has expired and is no longer available.'
      });
    }

    if (now < sessionDateTime) {
      const timeString = session.time;
      const sessionDate = session.date.toLocaleDateString();
      return res.status(400).json({
        success: false,
        message: `Session starts at ${timeString} on ${sessionDate} — link will be active then.`,
        sessionTime: sessionDateTime.toISOString()
      });
    }

    // Determine user role and participant info
    let userRole = 'participant';
    let participantNames = [];

    if (isTeacher) {
      userRole = 'teacher';
    } else if (isLearner) {
      userRole = 'learner';
    }

    // Get all participant names for display
    if (session.participants && session.participants.length > 0) {
      participantNames = session.participants.map(p => p.name);
    } else if (session.learner_id) {
      participantNames = [session.learner_id.name];
    }

    // Mark the meeting link as activated (user has joined)
    if (!session.meeting_link_activated) {
      session.meeting_link_activated = true;
      await session.save();
    }

    // Return meeting room details for joining
    res.status(200).json({
      success: true,
      message: 'Session is ready to join',
      data: {
        meeting_room: session.meeting_room,
        session_id: session._id,
        teacher_name: session.teacher_id.name,
        participant_names: participantNames,
        skill: session.skill_id,
        user_role: userRole,
        participant_count: session.participants ? session.participants.length : 1
      }
    });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining session',
      error: error.message
    });
  }
};

// Get meeting room details for a session
exports.getMeetingDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId)
      .populate('learner_id', 'name email')
      .populate('teacher_id', 'name email')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user is either teacher, learner, or participant
    const isTeacher = session.teacher_id._id.toString() === userId.toString();
    const isLearner = session.learner_id && session.learner_id._id.toString() === userId.toString();
    const isParticipant = session.participants && session.participants.some(p => p._id.toString() === userId.toString());

    if (!isTeacher && !isLearner && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only access sessions you are invited to'
      });
    }

    // Determine user role and participant info
    let userRole = 'participant';
    let participantNames = [];

    if (isTeacher) {
      userRole = 'teacher';
    } else if (isLearner) {
      userRole = 'learner';
    }

    // Get all participant names
    if (session.participants && session.participants.length > 0) {
      participantNames = session.participants.map(p => p.name);
    } else if (session.learner_id) {
      participantNames = [session.learner_id.name];
    }

    // Return meeting details
    // Check expiration before returning details - expire 30 minutes after start
    const sessionDateTime = new Date(`${session.date.toISOString().split('T')[0]}T${session.time}`);
    const now = new Date();
    const startTime = session.start_time ? new Date(session.start_time) : sessionDateTime;
    if (session.meeting_link_expired || now.getTime() > (startTime.getTime() + 30 * 60 * 1000)) {
      session.meeting_link_expired = true;
      try { await session.save(); } catch (e) { /* ignore save errors */ }
      return res.status(400).json({
        success: false,
        message: 'Meeting link has expired and is no longer available.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        meeting_room: session.meeting_room,
        session_id: session._id,
        teacher_name: session.teacher_id.name,
        participant_names: participantNames,
        skill: session.skill_id,
        date: session.date,
        time: session.time,
        status: session.status,
        user_role: userRole,
        participant_count: session.participants ? session.participants.length : 1,
        meeting_link_expired: session.meeting_link_expired
      }
    });
  } catch (error) {
    console.error('Get meeting details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting details',
      error: error.message
    });
  }
};

// Delete a session (only for past sessions - completed or cancelled)
exports.deleteSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user is either teacher, learner, or participant (active OR cancelled)
    const isTeacher = session.teacher_id.toString() === userId.toString();
    const isLearner = session.learner_id && session.learner_id.toString() === userId.toString();
    const isParticipant = session.participants && session.participants.some(p => p.toString() === userId.toString());
    const isCancelledParticipant = session.cancelled_participants && session.cancelled_participants.includes(userId);

    if (!isTeacher && !isLearner && !isParticipant && !isCancelledParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete sessions you participated in'
      });
    }

    // Soft delete: Add user to hidden_for_users
    if (!session.hidden_for_users.includes(userId)) {
      session.hidden_for_users.push(userId);
      await session.save();
    }

    // If completely orphaned (hidden for teacher AND all participants), we COULD hard delete,
    // but sticking to soft delete is safer for now.

    res.status(200).json({
      success: true,
      message: 'Session removed from your history'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting session',
      error: error.message
    });
  }
};

// Complete a session
exports.completeSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId).populate('teacher_id', 'name email');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user is either teacher, learner, or participant
    const isTeacher = (session.teacher_id._id || session.teacher_id).toString() === userId.toString();
    const isLearner = session.learner_id && session.learner_id.toString() === userId.toString();
    const isParticipant = session.participants && session.participants.some(p => p.toString() === userId.toString());

    if (!isTeacher && !isLearner && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete sessions you participated in'
      });
    }

    // Only allow completing upcoming sessions
    if (session.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Only upcoming sessions can be marked as completed'
      });
    }

    // Ensure the meeting link has been activated (user joined the session)
    if (!session.meeting_link_activated) {
      return res.status(400).json({
        success: false,
        message: 'You must join the session before marking it as completed'
      });
    }

    // Initialize completed_participants if missing
    if (!session.completed_participants) session.completed_participants = [];

    // If teacher marks completed -> global completion for everyone
    if (isTeacher) {
      session.status = 'completed';

      // Ensure all active participants are marked completed (for per-user views)
      const activeParticipantIds = (session.participants && session.participants.length > 0)
        ? session.participants.map(p => p.toString())
        : (session.learner_id ? [session.learner_id.toString()] : []);

      // Add all active participants to completed_participants
      activeParticipantIds.forEach(pid => {
        if (!session.completed_participants.map(id => id.toString()).includes(pid)) {
          session.completed_participants.push(pid);
        }
      });

      // Optionally mark teacher as completed too (useful for feedback flows)
      if (!session.completed_participants.map(id => id.toString()).includes(userId.toString())) {
        session.completed_participants.push(userId);
      }

      await session.save();

      // Send feedback_pending notifications to participants who haven't given feedback
      try {
        const participantsToNotify = (session.participants || [])
          .filter(pId => pId.toString() !== userId.toString()) // Exclude the teacher if also a participant
          .filter(pId => !(session.feedbackGivenBy || []).map(id => id.toString()).includes(pId.toString()));

        for (const participantId of participantsToNotify) {
          await Notification.create({
            userId: participantId,
            type: 'feedback_pending',
            entityId: session._id,
            message: `You have a pending feedback request for your session on ${session.date.toLocaleDateString()} with ${session.teacher_id.name}.`
          });
        }
      } catch (notificationError) {
        console.error('Error sending feedback_pending notifications:', notificationError);
      }

      return res.status(200).json({
        success: true,
        message: 'Session marked completed for all participants',
        data: session
      });
    }

    // If participant/learner marks completed
    // For one-to-one sessions, treat as global completion
    const activeParticipantIds = (session.participants && session.participants.length > 0)
      ? session.participants.map(p => p.toString())
      : (session.learner_id ? [session.learner_id.toString()] : []);

    const isOneToOne = activeParticipantIds.length === 1;

    if (isOneToOne) {
      // Mark global completed for one-to-one sessions
      session.status = 'completed';

      // Ensure both users are in completed_participants
      if (!session.completed_participants.map(id => id.toString()).includes(userId.toString())) {
        session.completed_participants.push(userId);
      }
      const otherId = activeParticipantIds[0];
      if (!session.completed_participants.map(id => id.toString()).includes(otherId)) {
        session.completed_participants.push(otherId);
      }

      await session.save();

      // Send feedback_pending notification to the other user if they haven't given feedback
      try {
        if (!session.feedbackGivenBy.map(id => id.toString()).includes(otherId.toString())) {
          const otherUser = await User.findById(otherId);
          if (otherUser) {
            await Notification.create({
              userId: otherId,
              type: 'feedback_pending',
              entityId: session._id,
              message: `You have a pending feedback request for your session on ${session.date.toLocaleDateString()} with ${session.teacher_id.name}.`
            });
          }
        }
      } catch (notificationError) {
        console.error('Error sending feedback_pending notification to other user:', notificationError);
      }

      return res.status(200).json({
        success: true,
        message: 'Session marked completed',
        data: session
      });
    }

    // For group sessions, add this user to completed_participants only
    const already = session.completed_participants.map(id => id.toString()).includes(userId.toString());
    if (!already) {
      session.completed_participants.push(userId);
    }

    // If ALL active participants have marked completed, set global status to completed
    const completedIds = session.completed_participants.map(id => id.toString());
    const allCompleted = activeParticipantIds.every(pid => completedIds.includes(pid));
    if (allCompleted) {
      session.status = 'completed';
      // include teacher too
      if (!completedIds.includes((session.teacher_id._id || session.teacher_id).toString())) {
        session.completed_participants.push(session.teacher_id._id || session.teacher_id);
      }
    }

    await session.save();

    // If I (current user) am a participant and not the teacher, and I completed my part of a group session,
    // and I haven't given feedback yet, send myself a notification
    try {
      const isCurrentTeacher = (session.teacher_id._id || session.teacher_id).toString() === userId.toString();
      const hasGivenFeedback = (session.feedbackGivenBy || []).map(id => id.toString()).includes(userId.toString());

      if (!isCurrentTeacher && !hasGivenFeedback) {
        const currentUser = await User.findById(userId);
        if (currentUser) {
          await Notification.create({
            userId: userId,
            type: 'feedback_pending',
            entityId: session._id,
            message: `You have a pending feedback request for your session on ${session.date.toLocaleDateString()} with ${session.teacher_id.name}.`
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending feedback_pending notification to current user:', notificationError);
    }

    return res.status(200).json({
      success: true,
      message: 'Your completion has been recorded',
      data: session
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing session',
      error: error.message
    });
  }
};
// Request to join a session (skill-based session join request)
exports.requestSessionJoin = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const session = await Session.findById(sessionId)
      .populate('teacher_id', 'name email')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // User cannot request to join their own session
    if (session.teacher_id._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request to join your own session'
      });
    }

    // User cannot request if already a participant
    const isAlreadyParticipant = session.participants.some(p => p._id.toString() === userId.toString());
    if (isAlreadyParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this session'
      });
    }

    // Check if request already exists
    const SessionJoinRequest = require('../models/SessionJoinRequest');
    const existingRequest = await SessionJoinRequest.findOne({
      userId,
      sessionId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join this session'
      });
    }

    // Create join request
    const joinRequest = new SessionJoinRequest({
      userId,
      sessionId,
      teacherId: session.teacher_id._id
    });

    await joinRequest.save();
    await joinRequest.populate('userId', 'name email');

    // Notify teacher about the join request
    try {
      const user = await User.findById(userId);
      await Notification.create({
        userId: session.teacher_id._id,
        type: 'session_join_request_new',
        entityId: joinRequest._id,
        message: `${user.name} has requested to join your session for ${session.skill_id} on ${session.date.toLocaleDateString()} at ${session.time}.`
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Request to join session sent',
      data: joinRequest
    });
  } catch (error) {
    console.error('Request session join error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting to join session',
      error: error.message
    });
  }
};

// Get pending session join requests for the teacher
exports.getSessionJoinRequests = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const SessionJoinRequest = require('../models/SessionJoinRequest');

    const requests = await SessionJoinRequest.find({
      teacherId,
      status: 'pending'
    })
      .populate('userId', 'name email')
      .populate('sessionId', 'skill_id date time')
      .sort({ createdAt: -1 });

    // Add profile pictures
    const Profile = require('../models/Profile');
    const userIds = requests.map(r => r.userId._id.toString());
    const profiles = await Profile.find({ userId: { $in: userIds } })
      .select('userId profilePic')
      .lean();

    const picMap = {};
    profiles.forEach(p => {
      picMap[p.userId.toString()] = p.profilePic || null;
    });

    const formattedRequests = requests.map(r => ({
      id: r._id.toString(),
      userId: r.userId._id.toString(),
      userName: r.userId.name,
      userEmail: r.userId.email,
      profilePic: picMap[r.userId._id.toString()] || null,
      sessionId: r.sessionId._id.toString(),
      skill: r.sessionId.skill_id,
      date: r.sessionId.date.toISOString().split('T')[0],
      time: r.sessionId.time,
      requestedAt: r.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Get session join requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session join requests',
      error: error.message
    });
  }
};

// Respond to session join request (accept or reject)
exports.respondSessionJoinRequest = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const requestId = req.params.requestId;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be accept or reject.'
      });
    }

    const SessionJoinRequest = require('../models/SessionJoinRequest');
    const joinRequest = await SessionJoinRequest.findById(requestId)
      .populate('userId', 'name email')
      .populate('sessionId');

    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (joinRequest.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only respond to your own session join requests'
      });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to'
      });
    }

    const session = await Session.findById(joinRequest.sessionId._id);

    if (action === 'accept') {
      // Add user to session participants
      if (!session.participants.includes(joinRequest.userId._id)) {
        session.participants.push(joinRequest.userId._id);
      }
      await session.save();

      // Add user to teacher's friends list if not already
      const teacher = await User.findById(teacherId);
      if (!teacher.friends.map(f => f.toString()).includes(joinRequest.userId._id.toString())) {
        teacher.friends.push(joinRequest.userId._id);
        await teacher.save();

        // Also add teacher to user's friends list
        const user = await User.findById(joinRequest.userId._id);
        if (!user.friends.map(f => f.toString()).includes(teacherId.toString())) {
          user.friends.push(teacherId);
          await user.save();
        }
      }

      // Update join request status
      joinRequest.status = 'accepted';
      joinRequest.respondedAt = new Date();
      await joinRequest.save();

      // Notify user that their request was accepted
      try {
        await Notification.create({
          userId: joinRequest.userId._id,
          type: 'session_join_request_accepted',
          entityId: joinRequest._id,
          relatedUserId: teacherId,
          message: `Your request to join the session for ${session.skill_id} on ${session.date.toLocaleDateString()} has been accepted.`
        });
      } catch (notificationError) {
        console.error('Error creating acceptance notification:', notificationError);
      }

      // ADDED: Apply Credits & Badge update when Teacher Accepts Session Join Request
      // AWARD 10 credits to the teacher (mirror Peer Session behavior)
      const Profile = require('../models/Profile');
      const teacherProfile = await Profile.findOne({ userId: teacherId });
      if (teacherProfile) {
        teacherProfile.creditNumber += 10;

        // Check for Badges (same logic as feedbackController)
        const sessionsDone = await Session.countDocuments({
          teacher_id: teacherId,
          status: 'completed'
        });

        const badgeCriteria = [
          { level: 1, name: "Beginner", sessions: 10, credits: 100 },
          { level: 2, name: "Quick Learner", sessions: 50, credits: 500 },
          { level: 3, name: "Rising Star", sessions: 100, credits: 1000 },
          { level: 4, name: "Skill Seeker", sessions: 200, credits: 2000 },
          { level: 5, name: "Skillful", sessions: 350, credits: 3500 },
          { level: 6, name: "Knowledge Explorer", sessions: 500, credits: 5000 },
          { level: 7, name: "Pro", sessions: 700, credits: 7000 },
          { level: 8, name: "Bright Mind", sessions: 900, credits: 9000 },
          { level: 9, name: "Expert", sessions: 1200, credits: 12000 },
          { level: 10, name: "Champion", sessions: 1500, credits: 15000 }
        ];

        badgeCriteria.forEach(badge => {
          if (sessionsDone >= badge.sessions && teacherProfile.creditNumber >= badge.credits) {
            if (!teacherProfile.badges.includes(badge.name)) {
              teacherProfile.badges.push(badge.name);
            }
          }
        });

        await teacherProfile.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Request accepted',
        data: joinRequest
      });
    } else if (action === 'reject') {
      joinRequest.status = 'rejected';
      joinRequest.respondedAt = new Date();
      await joinRequest.save();

      // Notify user that their request was rejected
      try {
        await Notification.create({
          userId: joinRequest.userId._id,
          type: 'session_join_request_rejected',
          entityId: joinRequest._id,
          relatedUserId: teacherId,
          message: `Your request to join the session for ${session.skill_id} on ${session.date.toLocaleDateString()} has been declined.`
        });
      } catch (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      }

      return res.status(200).json({
        success: true,
        message: 'Request rejected',
        data: joinRequest
      });
    }
  } catch (error) {
    console.error('Respond session join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to session join request',
      error: error.message
    });
  }
};

// Get scheduled sessions for a teacher (for profile view)
exports.getTeacherScheduledSessions = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    // Get upcoming and recently-started sessions for this teacher
    // Include expired sessions within 1-hour grace window (may still be in progress)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sessions = await Session.find({
      teacher_id: teacherId,
      $or: [
        { status: 'upcoming' },
        { status: 'expired', start_time: { $gte: oneHourAgo } }
      ]
    })
      .select('skill_id date time session_topic session_level participants start_time end_time')
      .sort({ date: 1, time: 1 })
      .lean();

    const SessionJoinRequest = require('../models/SessionJoinRequest');
    const userJoinRequests = req.user ? await SessionJoinRequest.find({
      userId: req.user._id,
      sessionId: { $in: sessions.map(s => s._id) }
    }).lean() : [];

    const formattedSessions = sessions.map(s => {
      // Calculate duration from start_time and end_time
      let duration = '1 hour'; // default
      if (s.start_time && s.end_time) {
        const startTime = new Date(s.start_time);
        const endTime = new Date(s.end_time);
        const durationMs = endTime - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours === 0.5) {
          duration = '30 minutes';
        } else if (durationHours === 1) {
          duration = '1 hour';
        } else if (durationHours === 1.5) {
          duration = '1.5 hours';
        } else {
          duration = `${durationHours} hours`;
        }
      }

      const joinRequest = userJoinRequests.find(r => r.sessionId.toString() === s._id.toString());

      return {
        id: s._id.toString(),
        skill: s.skill_id,
        date: s.date.toISOString().split('T')[0],
        time: s.time,
        topic: s.session_topic,
        level: s.session_level,
        participantCount: s.participants.length,
        duration: duration,
        isJoined: req.user ? s.participants.map(p => p.toString()).includes(req.user._id.toString()) : false,
        requestStatus: joinRequest ? joinRequest.status : null
      };
    });

    res.status(200).json({
      success: true,
      data: formattedSessions
    });
  } catch (error) {
    console.error('Get teacher scheduled sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scheduled sessions',
      error: error.message
    });
  }
};