const UserReport = require('../models/UserReport');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { sendWarningEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

// Create a new user report
exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    const reporterId = req.user._id;

    // Validation
    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Reported user ID and reason are required'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters'
      });
    }

    // Check if users exist
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    // Check if reporter is trying to report themselves
    if (reporterId.toString() === reportedUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    // Check for duplicate reports from same user within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReport = await UserReport.findOne({
      reporterId,
      reportedUserId,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this user. Please wait before filing another report.'
      });
    }

    // Create report
    const report = new UserReport({
      reporterId,
      reportedUserId,
      reason: reason.trim(),
      description: description ? description.trim() : ''
    });

    await report.save();

    // Log the report action
    await logger.record(
      logger.INFO,
      `User ${req.user.name} (ID: ${reporterId}) reported User ${reportedUser.name} (ID: ${reportedUserId}) for: ${reason}`,
      req.user.name,
      reporterId,
      'USER_REPORT'
    );

    // Auto-block the reported user when report is submitted
    const User = require('../models/User');
    await User.findByIdAndUpdate(
      reporterId,
      { $addToSet: { blocked: reportedUserId } },
      { new: true }
    );

    await report.populate(['reporterId', 'reportedUserId']);

    // Notify admins about new user report
    const adminIds = req.app.locals.adminIds || [];
    for (const adminId of adminIds) {
      try {
        await Notification.create({
          userId: adminId,
          type: 'user_report_new',
          entityId: report._id,
          message: `New user report against ${reportedUser.name} by ${req.user.name || 'a user'}: ${reason.substring(0, 50)}...`,
        });
      } catch (notifError) {
        console.error(`Failed to create notification for admin ${adminId}:`, notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        id: report._id,
        status: report.status
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all user reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const { status, search, sortBy } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    let reports = await UserReport.find(filter)
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Get profile pictures
    const userIds = new Set();
    reports.forEach(report => {
      if (report.reporterId?._id) userIds.add(report.reporterId._id);
      if (report.reportedUserId?._id) userIds.add(report.reportedUserId._id);
    });

    const profiles = await Profile.find({ userId: { $in: Array.from(userIds) } })
      .select('userId profilePic')
      .lean();

    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p.profilePic]));

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      reports = reports.filter(report => {
        const reportedName = (report.reportedUserId?.name || '').toLowerCase();
        const reportedEmail = (report.reportedUserId?.email || '').toLowerCase();
        const reporterName = (report.reporterId?.name || '').toLowerCase();
        const reason = (report.reason || '').toLowerCase();

        return (
          reportedName.includes(searchLower) ||
          reportedEmail.includes(searchLower) ||
          reporterName.includes(searchLower) ||
          reason.includes(searchLower)
        );
      });
    }

    const formattedReports = reports.map(report => ({
      id: report._id.toString(),
      reportedUserId: report.reportedUserId?._id?.toString(),
      reportedUserName: report.reportedUserId?.name || 'Unknown User',
      reportedUserEmail: report.reportedUserId?.email || '',
      reportedUserAvatar: profileMap.get(report.reportedUserId?._id?.toString()),
      reporterId: report.reporterId?._id?.toString(),
      reporterName: report.reporterId?.name || 'Unknown User',
      reporterEmail: report.reporterId?.email || '',
      reporterAvatar: profileMap.get(report.reporterId?._id?.toString()),
      reason: report.reason,
      description: report.description,
      status: report.status,
      adminAction: report.adminAction,
      adminNotes: report.adminNotes,
      warningsSent: report.warningsSent,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      resolvedBy: report.resolvedBy?.name
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

// Get report count by reported user
exports.getReportCount = async (userId) => {
  try {
    const count = await UserReport.countDocuments({
      reportedUserId: userId,
      status: { $in: ['pending', 'reviewed'] }
    });
    return count;
  } catch (error) {
    console.error('Error getting report count:', error);
    return 0;
  }
};

// Warn a user for reported behavior
exports.warnUser = async (req, res) => {
  try {
    const { reportId, warningMessage } = req.body;

    if (!reportId || !warningMessage) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and warning message are required'
      });
    }

    const report = await UserReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report
    report.status = 'actioned';
    report.adminAction = 'warning';
    report.warningsSent = (report.warningsSent || 0) + 1;
    report.adminNotes = warningMessage;
    report.resolvedBy = 'admin';
    report.resolvedAt = new Date();

    await report.save();

    // Get reported user details
    const reportedUser = await User.findById(report.reportedUserId);
    if (reportedUser) {
      // Send warning email
      try {
        await sendWarningEmail(reportedUser.email, reportedUser.name, warningMessage);
      } catch (emailError) {
        console.error('Error sending warning email:', emailError);
      }
    }

    // Notify reporter
    try {
      await Notification.create({
        userId: report.reporterId,
        type: 'user_report_resolved',
        entityId: report._id,
        message: `Your report has been reviewed and action has been taken: A warning was sent to the user.`,
      });
    } catch (notifError) {
      console.error('Failed to notify reporter:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'User warned successfully',
      data: {
        id: report._id,
        status: report.status,
        adminAction: report.adminAction,
        warningsSent: report.warningsSent
      }
    });
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warn user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a reported user account
exports.deleteReportedUser = async (req, res) => {
  try {
    const { reportId, reason } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      });
    }

    const report = await UserReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const reportedUserId = report.reportedUserId;

    // Check if user has multiple unresolved reports
    const reportCount = await UserReport.countDocuments({
      reportedUserId,
      status: { $in: ['pending', 'reviewed'] }
    });

    if (reportCount < 3) {
      return res.status(400).json({
        success: false,
        message: `User needs at least 3 unresolved reports to be deleted. Currently has ${reportCount}.`
      });
    }

    // Soft delete user account instead of findByIdAndDelete
    await User.findByIdAndUpdate(reportedUserId, { status: 'Deleted' });

    // Update all related reports
    await UserReport.updateMany(
      { reportedUserId },
      {
        status: 'actioned',
        adminAction: 'deletion',
        adminNotes: reason || 'Account deleted due to multiple reports',
        resolvedBy: 'admin',
        resolvedAt: new Date()
      }
    );

    // Notify all reporters in these reports
    const relatedReports = await UserReport.find({ reportedUserId });
    for (const r of relatedReports) {
      try {
        await Notification.create({
          userId: r.reporterId,
          type: 'user_report_resolved',
          entityId: r._id,
          message: `Your report has been reviewed and action has been taken: The reported user's account has been deleted.`,
        });
      } catch (notifError) {
        console.error('Failed to notify reporter:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
      data: {
        deletedUserId: reportedUserId
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Dismiss a report
exports.dismissReport = async (req, res) => {
  try {
    const { reportId, dismissReason } = req.body;

    if (!reportId || !dismissReason) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and dismiss reason are required'
      });
    }

    const report = await UserReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = 'dismissed';
    report.adminNotes = dismissReason;
    report.resolvedBy = 'admin';
    report.resolvedAt = new Date();

    await report.save();

    // Notify reporter
    try {
      await Notification.create({
        userId: report.reporterId,
        type: 'user_report_resolved',
        entityId: report._id,
        message: `Your report has been reviewed: The report was dismissed as it did not violate our guidelines.`,
      });
    } catch (notifError) {
      console.error('Failed to notify reporter:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Report dismissed successfully',
      data: {
        id: report._id,
        status: report.status
      }
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resolve a report
exports.resolveReport = async (req, res) => {
  try {
    const { reportId, action, notes } = req.body;
    const adminId = req.user._id;

    if (!reportId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and action are required'
      });
    }

    const validActions = ['warning', 'suspension', 'deletion', 'dismiss'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Valid actions are: warning, suspension, deletion, dismiss'
      });
    }

    const report = await UserReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Handle different actions
    if (action === 'warning') {
      report.adminAction = 'warning';
      report.warningsSent = (report.warningsSent || 0) + 1;
    } else if (action === 'deletion') {
      report.adminAction = 'deletion';
      // Note: actual deletion is handled separately
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
    } else {
      report.adminAction = action;
    }

    report.status = 'actioned';
    report.adminNotes = notes || '';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();

    await report.save();

    // Notify reporter
    try {
      let actionMsg = '';
      if (action === 'warning') actionMsg = 'A warning was sent to the user.';
      else if (action === 'deletion') actionMsg = 'The reported user\'s account has been deleted.';
      else if (action === 'dismiss') actionMsg = 'The report was dismissed.';
      else actionMsg = `Action taken: ${action}.`;

      await Notification.create({
        userId: report.reporterId,
        type: 'user_report_resolved',
        entityId: report._id,
        message: `Your report has been reviewed and action has been taken: ${actionMsg}`,
      });
    } catch (notifError) {
      console.error('Failed to notify reporter:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      data: {
        id: report._id,
        status: report.status,
        adminAction: report.adminAction
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
