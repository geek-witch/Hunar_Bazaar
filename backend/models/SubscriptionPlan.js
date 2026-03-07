const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Free', 'Premium', 'Professional'],
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'PKR'
    },
    features: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        required: true
  },
  stripePriceId: {
    type: String,
    default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
