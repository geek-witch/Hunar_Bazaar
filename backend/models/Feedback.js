const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
    },
    learner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    hoursTaught: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Allow one feedback per (session, learner) pair
feedbackSchema.index({ session: 1, learner: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
