const User = require('../models/User');
const Profile = require('../models/Profile');
const UserReport = require('../models/UserReport');
const SupportIssue = require('../models/SupportIssue');
const Session = require('../models/Session');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().lean();
        const userIds = users.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } }).lean();

        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        const formattedUsers = users.map(user => {
            const profile = profileMap.get(user._id.toString());
            return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: profile?.profilePic || null,
                status: user.status || 'Active',
                joinedDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'N/A',
                subscription: profile?.premiumStatus ? 'Premium' : 'Free',
                history: [] // Historical count could be added here if needed
            };
        });

        res.status(200).json({
            success: true,
            data: formattedUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        if (!['Active', 'Restricted', 'Suspended', 'Deleted'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: `User status updated to ${status}`,
            data: { userId: user._id, status: user.status }
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, activeDisputes, successfulExchanges, premiumProfiles, freeProfiles] = await Promise.all([
            User.countDocuments({ status: { $ne: 'Deleted' } }),
            UserReport.countDocuments({ status: { $in: ['pending', 'reviewed'] } }),
            Session.countDocuments({ status: 'completed' }),
            Profile.countDocuments({ premiumStatus: true }),
            Profile.countDocuments({ premiumStatus: false })
        ]);

        // Simple revenue calculation
        const monthlyRevenueRaw = premiumProfiles * 1000;
        const monthlyRevenue = `PKR ${monthlyRevenueRaw.toLocaleString()}`;

        // Get growth data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Aggregate user growth by month
        const growthStats = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Aggregate reports by month
        const reportStats = await UserReport.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Helper to format as month names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Merge into a single array for the area chart
        const chartData = [];
        let cumulativeUsers = await User.countDocuments({ createdAt: { $lt: sixMonthsAgo }, status: { $ne: 'Deleted' } });

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const m = d.getMonth() + 1;
            const y = d.getFullYear();

            const monthGrowth = growthStats.find(s => s._id.month === m && s._id.year === y)?.count || 0;
            cumulativeUsers += monthGrowth;
            const monthReports = reportStats.find(s => s._id.month === m && s._id.year === y)?.count || 0;

            chartData.push({
                name: monthNames[m - 1],
                users: cumulativeUsers,
                complaints: monthReports
            });
        }

        // Revenue breakdown for bar chart
        const revenueBreakdown = [
            { name: 'Free', value: freeProfiles * 0 }, // Basic is zero revenue
            { name: 'Premium', value: premiumProfiles * 1000 },
            { name: 'Professional', value: 0 } // No Professional in model yet
        ];

        const stats = {
            totalUsers,
            activeDisputes,
            monthlyRevenue,
            successfulExchanges,
            chartData,
            revenueBreakdown
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
};
