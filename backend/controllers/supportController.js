const SupportIssue = require('../models/SupportIssue');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { sendSupportReplyEmail } = require('../utils/emailService');

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
      .populate('userId', 'name email profilePic')
      .lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const comments = [];
    
    const userName = issue.userId?.name || 'Anonymous';
    const userInitial = userName.charAt(0).toUpperCase();
    const createdAt = new Date(issue.createdAt);
    
    comments.push({
      id: 'initial',
      author: userName,
      role: 'user',
      message: issue.description,
      date: createdAt.toISOString().split('T')[0],
      time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      avatar: userInitial,
      image: issue.userId?.profilePic || undefined
    });

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

