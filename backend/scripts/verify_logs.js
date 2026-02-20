require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Log = require('../models/Log');
const logger = require('../utils/logger');
const connectDB = require('../config/db');

async function run() {
    try {
        await connectDB();
        console.log('Connected to DB');
        await logger.record(logger.INFO, 'Verification log entry', 'System', null, 'VERIFY');
        console.log('Log recorded successfully');
        const logs = await Log.find({ action: 'VERIFY' }).sort({ timestamp: -1 }).limit(1);
        console.log('Found log entry:', logs[0]);
        if (logs.length > 0) {
            console.log('VERIFICATION SUCCESSFUL');
        } else {
            console.log('VERIFICATION FAILED: Log not found');
        }
        process.exit(0);
    } catch (err) {
        console.error('Verification error:', err);
        process.exit(1);
    }
}
run();
