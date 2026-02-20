require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const connectDB = require('../config/db');

const plans = [
    {
        name: 'Basic',
        type: 'Free',
        price: 0,
        currency: 'PKR',
        features: [
            'Skill exchange for free',
            'Access the basic features',
            'Basic profile customization and management'
        ],
        description: 'For casual learners'
    },
    {
        name: 'Premium',
        type: 'Premium',
        price: 300,
        currency: 'PKR',
        features: [
            'Unlimited skill exchanges',
            'Advanced profile analytics',
            'AI support',
            'Reminders Option'
        ],
        description: 'For dedicated learners & teachers'
    },
    {
        name: 'Professional',
        type: 'Professional',
        price: 500,
        currency: 'PKR',
        features: [
            'Everything in Premium',
            'Access for all Employees',
            'Access to exclusive workshops',
            'Customized AI features'
        ],
        description: 'For power users & companies'
    }
];

const seedPlans = async () => {
    try {
        await connectDB();

        // Clear existing plans
        await SubscriptionPlan.deleteMany();

        // Insert new plans
        await SubscriptionPlan.insertMany(plans);

        console.log('Subscription plans seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding plans:', error);
        process.exit(1);
    }
};

seedPlans();
