const Feedback = require('../models/Feedback');
const Session = require('../models/Session');
const UserReport = require('../models/UserReport');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create feedback for a session
exports.createFeedback = async (req, res) => {
    try {
        const learnerId = req.user._id;
        const { sessionId, rating, comment, hoursTaught } = req.body;

        // Explicit validation to provide better error messages than Mongoose defaults
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5' });
        }
        if (!comment || comment.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please provide a comment for your feedback' });
        }
        if (hoursTaught === undefined || hoursTaught === null || isNaN(hoursTaught) || hoursTaught <= 0) {
            return res.status(400).json({ success: false, message: 'Please specify the number of hours the session lasted (must be greater than 0)' });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (session.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Session must be completed to give feedback' });
        }

        // Verify user is the learner/participant
        const isLearner = session.learner_id?.toString() === learnerId.toString() ||
            (session.participants && session.participants.some(p => p.toString() === learnerId.toString()));

        if (!isLearner) {
            return res.status(403).json({ success: false, message: 'Only learners can give feedback' });
        }

        // Check if THIS learner already submitted feedback for this session
        const existingFeedback = await Feedback.findOne({ session: sessionId, learner: learnerId });
        if (existingFeedback) {
            // Self-heal: ensure session.feedbackGivenBy includes this learner
            if (!session.feedbackGivenBy) session.feedbackGivenBy = [];
            if (!session.feedbackGivenBy.some(id => id.toString() === learnerId.toString())) {
                session.feedbackGivenBy.push(learnerId);
                await session.save();
            }
            return res.status(400).json({ success: false, message: 'Feedback already submitted for this session by you' });
        }

        // Note: Do not block based on legacy `session.feedbackGiven` flag alone.
        // We rely on per-learner `Feedback` documents to prevent duplicates.

        const feedback = new Feedback({
            session: sessionId,
            learner: learnerId,
            teacher: session.teacher_id,
            rating,
            comment,
            hoursTaught
        });

        const mongoose = require('mongoose');
        try {
            await feedback.save();
        } catch (err) {
            // Handle legacy unique index on `session` that prevents multiple feedbacks per session
            if (err && err.code === 11000 && /session_1/.test(err.message)) {
                try {
                    const coll = mongoose.connection.db.collection('feedbacks');
                    const idxs = await coll.indexes();
                    const legacy = idxs.find(i => i.key && i.key.session === 1 && i.unique);
                    if (legacy && legacy.name) {
                        await coll.dropIndex(legacy.name);
                    }
                    // Ensure new compound index exists
                    await coll.createIndex({ session: 1, learner: 1 }, { unique: true });
                    // Retry save
                    await feedback.save();

                    // Notify the teacher about new feedback received
                    if (session.teacher_id) {
                        await Notification.create({
                            userId: session.teacher_id,
                            type: 'feedback_received',
                            entityId: feedback._id,
                            message: `You received new feedback from ${req.user.name || 'a learner'} for your session on ${session.skill_id}.`,
                        });
                    }

                } catch (dropErr) {
                    console.error('Error migrating feedback indexes:', dropErr);
                    throw err; // throw original error to be handled below
                }
            } else {
                throw err;
            }
        }

        // ---------------------------------------------------
        // CREDIT Calculation & Sentiment Analysis
        // ---------------------------------------------------
        const Sentiment = require('sentiment');
        const sentiment = new Sentiment();
        const sentimentResult = sentiment.analyze(comment);
        // Bucket: Good (>0) -> +2, Neutral (0) -> +1, Bad (<0) -> -2
        let sentimentScore = sentimentResult.score;
        let sentimentBonus = 0;

        if (sentimentScore > 0) {
            sentimentBonus = 2 * 3; // Good (+2) * 3 = 6
        } else if (sentimentScore === 0) {
            sentimentBonus = 1 * 3; // Neutral (+1) * 3 = 3
        } else {
            sentimentBonus = -2 * 3; // Bad (-2) * 3 = -6
        }

        // Base Credits: Hours * 2
        const baseCredits = hoursTaught * 2;

        // Participant Bonus: 1 person -> 2 credits, >1 -> 2 + (N-1)*3
        let participantCount = 1;
        if (session.participants && session.participants.length > 0) {
            participantCount = session.participants.length;
        }
        let participantBonus = 0;
        if (participantCount === 1) {
            participantBonus = 2;
        } else {
            participantBonus = 2 + (participantCount - 1) * 3;
        }

        // Rating Factor: Rating * 5 (min 0.5 if rating < 0.1)
        let effectiveRating = rating;
        if (effectiveRating < 0.1) effectiveRating = 0.1; // Floor to avoid 0 if needed, plan said min result 0.5
        let ratingFactor = effectiveRating * 5;
        if (rating < 0.1) ratingFactor = 0.5; // Explicit override from plan

        // Total Credits
        let totalCredits = baseCredits + participantBonus + ratingFactor + sentimentBonus;
        // Ensure not negative? Plan didn't specify, but safer to floor at 0
        if (totalCredits < 0) totalCredits = 0;

        // ---------------------------------------------------
        // Update Teacher Profile (Credits + Badges)
        // ---------------------------------------------------
        const Profile = require('../models/Profile');
        const teacherProfile = await Profile.findOne({ userId: session.teacher_id });

        if (teacherProfile) {
            teacherProfile.creditNumber += totalCredits;

            // Check for Badges
            // Count sessions where user was teacher and status is completed
            const sessionsDone = await Session.countDocuments({
                teacher_id: session.teacher_id,
                status: 'completed'
            });

            // Badge Criteria
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
                { level: 10, name: "Champion", sessions: 1500, credits: 15000 },
                { level: 11, name: "Wisdom Keeper", sessions: 1800, credits: 18000 },
                { level: 12, name: "Mentor Guide", sessions: 2100, credits: 21000 },
                { level: 13, name: "Insight Leader", sessions: 2400, credits: 24000 },
                { level: 14, name: "Legend", sessions: 2700, credits: 27000 },
                { level: 15, name: "Skill Champion", sessions: 3000, credits: 30000 },
                { level: 16, name: "Knowledge Sage", sessions: 3300, credits: 33000 },
                { level: 17, name: "Visionary", sessions: 3600, credits: 36000 },
                { level: 18, name: "Skill Titan", sessions: 4000, credits: 40000 },
                { level: 19, name: "Phoenix Mentor", sessions: 4500, credits: 45000 },
                { level: 20, name: "Legendary", sessions: 5000, credits: 50000 }
            ];

            // Add eligible badges
            badgeCriteria.forEach(badge => {
                if (sessionsDone >= badge.sessions && teacherProfile.creditNumber >= badge.credits) {
                    if (!teacherProfile.badges.includes(badge.name)) {
                        teacherProfile.badges.push(badge.name);
                    }
                }
            });

            await teacherProfile.save();
        }

        // ---------------------------------------------------
        // Update Student Profile (Learned Hours)
        // ---------------------------------------------------
        const studentProfile = await Profile.findOne({ userId: learnerId });
        if (studentProfile) {
            studentProfile.totalLearnedHours = (studentProfile.totalLearnedHours || 0) + hoursTaught;
            await studentProfile.save();
        }

        // Mark session as feedback given for this specific learner
        if (!session.feedbackGivenBy) {
            session.feedbackGivenBy = [];
        }
        if (!session.feedbackGivenBy.includes(learnerId)) {
            session.feedbackGivenBy.push(learnerId);
        }
        // Update legacy field if all participants have given feedback
        const allParticipants = session.participants && session.participants.length > 0
            ? session.participants
            : [session.learner_id];
        if (allParticipants.every(p => session.feedbackGivenBy.some(fb => fb.toString() === p.toString()))) {
            session.feedbackGiven = true;
        }
        await session.save();

        res.status(201).json({
            success: true,
            data: feedback,
            creditsEarned: totalCredits,
            message: `Feedback submitted! Teacher earned ${Math.round(totalCredits)} credits.`
        });
    } catch (error) {
        console.error('Create feedback error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error creating feedback', error: error.message });
    }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { rating, comment, hoursTaught } = req.body;

        const feedback = await Feedback.findById(id);

        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        // Verify the user owns this feedback (is the learner)
        if (feedback.learner.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this feedback' });
        }

        feedback.rating = rating || feedback.rating;
        feedback.comment = comment || feedback.comment;
        // hoursTaught logic might be sensitive if credits are involved, but for now we allow update
        if (hoursTaught) feedback.hoursTaught = hoursTaught;

        await feedback.save();

        res.status(200).json({ success: true, data: feedback, message: 'Feedback updated successfully' });
    } catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({ success: false, message: 'Error updating feedback', error: error.message });
    }
};

// Get feedbacks (received, given, pending)
exports.getFeedbacks = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query; // 'received', 'given', 'pending'
        const Profile = require('../models/Profile');

        let results = [];
        let userIds = new Set();

        if (type === 'received') {
            // Feedbacks given to this user (as teacher)
            const feedbacks = await Feedback.find({ teacher: userId })
                .populate({
                    path: 'session',
                    select: 'skill_id date time'
                })
                .populate('learner', 'name')
                .sort({ createdAt: -1 })
                .lean();

            feedbacks.forEach(f => {
                if (f.learner) userIds.add(f.learner._id.toString());
            });
            results = feedbacks.filter(f => f.session);

        } else if (type === 'given') {
            // Feedbacks given by this user (as learner)
            const feedbacks = await Feedback.find({ learner: userId })
                .populate({
                    path: 'session',
                    select: 'skill_id date time'
                })
                .populate('teacher', 'name')
                .sort({ createdAt: -1 })
                .lean();

            feedbacks.forEach(f => {
                if (f.teacher) userIds.add(f.teacher._id.toString());
            });
            results = feedbacks.filter(f => f.session);

        } else if (type === 'pending') {
            // Sessions completed but no feedback given yet BY THIS USER
            const sessions = await Session.find({
                $and: [
                    {
                        $or: [
                            { learner_id: userId },
                            { participants: userId }
                        ]
                    },
                    { status: 'completed' },
                    {
                        $or: [
                            { feedbackGiven: false },
                            { feedbackGivenBy: { $ne: userId } }
                        ]
                    }
                ]
            })
                .populate('teacher_id', 'name')
                .sort({ date: -1 })
                .lean();

            // Filter to only include sessions where THIS user hasn't given feedback
            const filteredSessions = sessions.filter(s => {
                if (!s.feedbackGivenBy || s.feedbackGivenBy.length === 0) {
                    return !s.feedbackGiven; // Legacy check
                }
                return !s.feedbackGivenBy.some(id => id.toString() === userId.toString());
            });

            filteredSessions.forEach(s => {
                if (s.teacher_id) userIds.add(s.teacher_id._id.toString());
            });
            results = filteredSessions;

        } else {
            return res.status(400).json({ success: false, message: 'Invalid type parameter' });
        }

        // Fetch profiles to get real avatars
        const profiles = await Profile.find({ userId: { $in: Array.from(userIds) } }).select('userId profilePic').lean();
        const picMap = {};
        profiles.forEach(p => {
            picMap[p.userId.toString()] = p.profilePic || null;
        });

        // Attach profile pics
        if (type === 'received') {
            results = results.map(f => ({
                ...f,
                learner: f.learner ? { ...f.learner, profilePic: picMap[f.learner._id.toString()] } : null
            }));
        } else if (type === 'given') {
            results = results.map(f => ({
                ...f,
                teacher: f.teacher ? { ...f.teacher, profilePic: picMap[f.teacher._id.toString()] } : null
            }));
        } else if (type === 'pending') {
            results = results.map(s => ({
                ...s,
                teacher_id: s.teacher_id ? { ...s.teacher_id, profilePic: picMap[s.teacher_id._id.toString()] } : null
            }));
        }

        return res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Get feedbacks error:', error);
        res.status(500).json({ success: false, message: 'Error fetching feedbacks', error: error.message });
    }
};

// Report an incorrect feedback
exports.reportFeedback = async (req, res) => {
    try {
        const reporterId = req.user._id;
        const { feedbackId, reason, description } = req.body;

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        // Verify reporter is the teacher who received the feedback
        if (feedback.teacher.toString() !== reporterId.toString()) {
            return res.status(403).json({ success: false, message: 'You can only report feedback given to you' });
        }

        // Create UserReport
        const report = new UserReport({
            reporterId,
            reportedUserId: feedback.learner, // Reporting the learner who gave incorrect feedback
            reason: reason || 'Incorrect Feedback Information',
            description: description + ` (Reported for Feedback ID: ${feedbackId})`,
            status: 'pending'
        });

        await report.save();

        res.status(201).json({ success: true, message: 'Report submitted successfully' });

    } catch (error) {
        console.error('Report feedback error:', error);
        res.status(500).json({ success: false, message: 'Error submitting report', error: error.message });
    }
};
