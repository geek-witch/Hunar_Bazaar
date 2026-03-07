const Log = require('../models/Log');

/**
 * Record a system log entry
 * @param {string} level - INFO, WARNING, ERROR
 * @param {string} message - Description of the event
 * @param {string} user - User name or 'System'
 * @param {string} userId - User ObjectId (optional)
 * @param {string} action - Action type (optional)
 */
const record = async (level, message, user = 'System', userId = null, action = null) => {
    try {
        const logEntry = new Log({
            level,
            message,
            user,
            userId,
            action
        });
        await logEntry.save();
    } catch (error) {
        console.error('Failed to record system log:', error);
    }
};

module.exports = {
    record,
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
};
