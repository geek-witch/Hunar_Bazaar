const SupportIssue = require('../models/SupportIssue');
const UserReport = require('../models/UserReport');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { sendSupportReplyEmail } = require('../utils/emailService');
const Notification = require('../models/Notification');

exports.submitIssue = async (req, res) => {
  try {
    const { category, description, attachment } = req.body;
    const userId = req.user?._id?.toString() || req.user?.id || null;

    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category and description are required'
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters'
      });
    }

    const validCategories = ['General Inquiry', 'Technical Issue', 'Payment Problem', 'Session Issue', 'Account Problem', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    if (attachment) {
      if (!attachment.startsWith('data:image/')) {
        console.error('Invalid attachment format received:', attachment.substring(0, 50) + '...');
        return res.status(400).json({
          success: false,
          message: 'Invalid attachment format. Please upload a valid image.'
        });
      }

      const validImageTypes = ['data:image/png', 'data:image/jpeg', 'data:image/jpg', 'data:image/gif', 'data:image/webp'];
      const isValidImageType = validImageTypes.some(type => attachment.toLowerCase().startsWith(type));
      if (!isValidImageType) {
        console.error('Invalid image type in attachment');
        return res.status(400).json({
          success: false,
          message: 'Invalid image type. Please upload PNG, JPG, GIF, or WEBP only.'
        });
      }
    }

    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const duplicateCheck = await SupportIssue.findOne({
      userId: userId || null,
      description: description.trim(),
      createdAt: { $gte: sixtySecondsAgo }
    });

    if (duplicateCheck) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate submission detected. Please wait a moment before submitting again.'
      });
    }

    const issue = new SupportIssue({
      userId,
      category,
      description: description.trim(),
      attachment: attachment || null,
      status: 'pending'
    });

    await issue.save();

    // Notify admins about new support issue
    const adminIds = req.app.locals.adminIds || [];
    let submitterName = 'Anonymous';
    if (userId) {
      const submitter = await User.findById(userId).select('name').lean();
      if (submitter) submitterName = submitter.name;
    }

    for (const adminId of adminIds) {
      try {
        await Notification.create({
          userId: adminId,
          type: 'support_issue_new',
          entityId: issue._id,
          message: `New support issue (${category}) submitted by ${submitterName}: ${issue.description.substring(0, 50)}...`,
        });
      } catch (notifError) {
        console.error(`Failed to create notification for admin ${adminId}:`, notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Your issue has been submitted successfully!',
      data: {
        id: issue._id,
        category: issue.category,
        status: issue.status
      }
    });
  } catch (error) {
    console.error('Error submitting support issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit issue. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    const { status, category, search } = req.query;

    const filter = {};
    if (status && (status === 'pending' || status === 'resolved')) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }

    let issues = await SupportIssue.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();


    const userIds = issues.filter(issue => issue.userId).map(issue => issue.userId._id || issue.userId);
    const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId profilePic').lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p.profilePic]));

    issues.forEach(issue => {
      if (issue.userId && issue.userId._id) {
        const profilePic = profileMap.get(issue.userId._id.toString());
        if (profilePic) {
          issue.userId.profilePic = profilePic;
        }
      }
    });

    if (search) {
      const searchLower = search.toLowerCase();
      issues = issues.filter(issue => {
        const description = (issue.description || '').toLowerCase();
        const userName = (issue.userId?.name || 'Anonymous').toLowerCase();
        const category = (issue.category || '').toLowerCase();
        return description.includes(searchLower) ||
          userName.includes(searchLower) ||
          category.includes(searchLower);
      });
    }

    const formattedIssues = issues.map(issue => {
      const userName = issue.userId?.name || 'Anonymous';
      const userInitial = userName.charAt(0).toUpperCase();
      const createdAt = new Date(issue.createdAt);

      let type = 'query';
      if (issue.category === 'Payment Problem' || issue.category === 'Session Issue') {
        type = 'dispute';
      } else if (issue.category === 'Account Problem') {
        type = 'complaint';
      }

      return {
        id: issue._id.toString(),
        type,
        category: issue.category,
        title: `${issue.category}: ${issue.description.substring(0, 50)}${issue.description.length > 50 ? '...' : ''}`,
        description: issue.description,
        attachment: issue.attachment || null,
        userName,
        userInitial,
        userImage: issue.userId?.profilePic || issue.userId?.profile?.profilePic || undefined,
        status: issue.status,
        date: createdAt.toISOString().split('T')[0],
        time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        priority: issue.priority,
        userId: issue.userId?._id?.toString() || null,
        email: issue.userId?.email || null
      };
    });

    res.status(200).json({
      success: true,
      data: formattedIssues
    });
  } catch (error) {
    console.error('Error fetching support issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getIssueComments = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await SupportIssue.findById(id)
      .populate('userId', 'name email')
      .lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const comments = [];

    if (issue.adminComments && issue.adminComments.length > 0) {
      issue.adminComments.forEach((comment, index) => {
        let adminName = 'Support Team';
        if (typeof comment.adminId === 'string') {
          adminName = comment.adminId === 'admin' ? 'Support Team' : comment.adminId;
        } else if (comment.adminId && typeof comment.adminId === 'object') {
          adminName = comment.adminId.name || 'Support Team';
        }

        const adminInitial = adminName.substring(0, 2).toUpperCase();
        const commentDate = new Date(comment.createdAt);

        comments.push({
          id: `admin-${index}`,
          author: adminName,
          role: 'admin',
          message: comment.message,
          date: commentDate.toISOString().split('T')[0],
          time: commentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          avatar: adminInitial,
          image: undefined
        });
      });
    }

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching issue comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.addAdminComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user?._id?.toString() || req.user?.id || 'admin';

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const issue = await SupportIssue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    issue.adminComments.push({
      adminId,
      message: message.trim()
    });

    await issue.save();

    // Notify the user about a new admin comment on their issue
    if (issue.userId) {
      await Notification.create({
        userId: issue.userId,
        type: 'admin_comment',
        entityId: issue._id,
        message: `An administrator has commented on your support issue "${issue.category}: ${issue.description.substring(0, 30)}...".`,
      });
    }

    try {
      if (issue.userId) {
        const user = await User.findById(issue.userId).select('email name').lean();
        if (user && user.email) {
          const userName = user.name || 'User';
          try {
            await sendSupportReplyEmail(
              user.email,
              userName,
              issue.category,
              issue.description,
              message.trim()
            );
          } catch (emailSendError) {
            console.error('✗ Failed to send support reply email:', emailSendError);

            if (emailSendError.response) {
              console.error('Email service response:', emailSendError.response);
            }
          }
        } else {
          console.log(`⚠ User ${issue.userId} does not have an email address. Email not sent.`);
        }
      } else {
        console.log('⚠ Issue submitted anonymously (no userId). Email not sent.');
      }
    } catch (emailError) {
      console.error('✗ Error in email sending process:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding admin comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'pending' && status !== 'resolved')) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (pending or resolved) is required'
      });
    }

    const issue = await SupportIssue.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Notify user if their support issue was resolved
    if (status === 'resolved' && issue.userId) {
      await Notification.create({
        userId: issue.userId,
        type: 'support_issue_resolved',
        entityId: issue._id,
        message: `Your support issue "${issue.category}: ${issue.description.substring(0, 30)}..." has been resolved.`,
      });
    }

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Notify user if their support issue was resolved
    if (status === 'resolved' && issue.userId) {
      await Notification.create({
        userId: issue.userId,
        type: 'support_issue_resolved',
        entityId: issue._id,
        message: `Your support issue "${issue.category}: ${issue.description.substring(0, 30)}..." has been resolved.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Issue status updated successfully',
      data: {
        id: issue._id,
        status: issue.status
      }
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all user reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {
      reportedUserId: { $exists: true, $ne: null }
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'reporterData.name': { $regex: search, $options: 'i' } },
        { 'reportedUserData.name': { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await SupportIssue.find(filter)
      .populate('userId', 'name email profilePic')
      .populate('reportedUserId', 'name email profilePic')
      .sort({ createdAt: -1 })
      .lean();

    const formattedReports = reports.map((report) => ({
      id: report._id.toString(),
      reportedUserId: report.reportedUserId?._id?.toString(),
      reportedUserName: report.reportedUserId?.name || 'Unknown User',
      reportedUserEmail: report.reportedUserId?.email || '',
      reportedUserAvatar: report.reportedUserId?.profilePic || undefined,
      reporterId: report.userId?._id?.toString(),
      reporterName: report.userId?.name || 'Anonymous',
      reporterEmail: report.userId?.email || '',
      reporterAvatar: report.userId?.profilePic || undefined,
      reason: report.description,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt || undefined,
      adminNotes: report.adminNotes || undefined
    }));

    res.status(200).json({
      success: true,
      data: formattedReports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resolve a user report (admin only)
exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      });
    }

    const report = await SupportIssue.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!report.reportedUserId) {
      return res.status(400).json({
        success: false,
        message: 'This is not a user report'
      });
    }

    report.status = 'resolved';
    report.resolvedAt = new Date();
    if (adminNotes) {
      report.adminNotes = adminNotes.trim();
    }

    await report.save();

    // Notify the reporter that their report has been resolved
    if (report.reporterId) {
      await Notification.create({
        userId: report.reporterId,
        type: 'user_report_resolved',
        entityId: report._id,
        message: `Your report against user ${report.reportedUserId} has been resolved.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      data: {
        id: report._id.toString(),
        status: report.status,
        resolvedAt: report.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Report a user from within chat: stored as a SupportIssue (category: Account Problem)
exports.reportUser = async (req, res) => {
  try {
    const reportedUserId = req.params.userId;
    const reporterId = req.user?._id?.toString() || req.user?.id || null;
    const { reason } = req.body;

    if (!reporterId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!reportedUserId) {
      return res.status(400).json({ success: false, message: 'Reported user id is required' });
    }

    if (reportedUserId.toString() === reporterId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Reason must be at least 10 characters' });
    }

    // Check for existing report within 1 week (7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existingReport = await UserReport.findOne({
      reporterId,
      reportedUserId,
      createdAt: { $gte: oneWeekAgo }
    });

    if (existingReport) {
      // Calculate time remaining until next report is allowed
      const reportTime = existingReport.createdAt.getTime();
      const nextAllowedTime = reportTime + (7 * 24 * 60 * 60 * 1000);
      const now = Date.now();
      const msRemaining = nextAllowedTime - now;
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

      return res.status(400).json({
        success: false,
        message: `You have already reported this user. Please wait ${daysRemaining} days before filing another report.`,
        reportedAt: existingReport.createdAt,
        daysRemaining
      });
    }

    // Ensure both users exist (avoid orphaned refs)
    const [reporter, reported] = await Promise.all([
      User.findById(reporterId).select('_id name').lean(),
      User.findById(reportedUserId).select('_id name').lean()
    ]);
    if (!reporter || !reported) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const report = new UserReport({
      reporterId,
      reportedUserId,
      reason: reason.trim(),
      description: reason.trim(),
      status: 'pending'
    });

    await report.save();

    // Notify admins about new user report
    const adminIds = req.app.locals.adminIds;
    for (const adminId of adminIds) {
      await Notification.create({
        userId: adminId,
        type: 'user_report_new',
        entityId: report._id,
        message: `New user report against ${reported?.name || reportedUserId} by ${reporter?.name || reporterId}: ${reason.substring(0, 50)}...`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: { id: report._id.toString() }
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Check if user has already reported another user and get cooldown info
exports.checkUserReport = async (req, res) => {
  try {
    const reportedUserId = req.params.userId;
    const reporterId = req.user?._id?.toString() || req.user?.id || null;

    if (!reporterId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!reportedUserId) {
      return res.status(400).json({ success: false, message: 'Reported user id is required' });
    }

    // Check for existing report within 1 week (7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existingReport = await UserReport.findOne({
      reporterId,
      reportedUserId,
      createdAt: { $gte: oneWeekAgo }
    });

    if (existingReport) {
      // Calculate time remaining until next report is allowed
      const reportTime = existingReport.createdAt.getTime();
      const nextAllowedTime = reportTime + (7 * 24 * 60 * 60 * 1000);
      const now = Date.now();
      const msRemaining = Math.max(0, nextAllowedTime - now);
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));

      return res.status(200).json({
        success: true,
        data: {
          hasReported: true,
          reportedAt: existingReport.createdAt,
          daysRemaining,
          hoursRemaining,
          canReportAgain: msRemaining <= 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasReported: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        canReportAgain: true
      }
    });
  } catch (error) {
    console.error('Error checking user report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check report status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};