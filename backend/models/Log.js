const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR'],
        default: 'INFO',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    user: {
        type: String, // Storing user name or 'System'/'unknown'
        default: 'System'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    action: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', logSchema);
