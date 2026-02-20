const SubscriptionPlan = require('../models/SubscriptionPlan');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all subscription plans
exports.getPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find().sort({ price: 1 });
        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription plans',
            error: error.message
        });
    }
};

// Update a subscription plan (Admin only)
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, features, description, name } = req.body;

        const plan = await SubscriptionPlan.findByIdAndUpdate(
            id,
            { price, features, description, name },
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        // Notify all users about the plan update
        const users = await User.find({ status: { $ne: 'Deleted' } });
        const notifications = users.map(user => ({
            userId: user._id,
            type: 'plan_updated',
            message: `The ${plan.name} plan has been updated. Check the subscriptions page for new details!`,
            entityId: plan._id
        }));

        // Using insertMany for efficiency
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(200).json({
            success: true,
            message: 'Subscription plan updated and users notified',
            data: plan
        });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subscription plan',
            error: error.message
        });
    }
};

// Create a plan (Helper if needed)
exports.createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
