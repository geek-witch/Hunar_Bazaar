const mongoose = require('mongoose');
const Session = require('../models/Session');

// Migration script to add meeting_room to existing sessions
const migrateSessions = async () => {
  try {
    console.log('Starting session migration...');
    
    // Find sessions without meeting_room
    const sessionsToUpdate = await Session.find({ 
      meeting_room: { $exists: false } 
    });
    
    if (sessionsToUpdate.length === 0) {
      console.log('No sessions need migration');
      return;
    }
    
    console.log(`Found ${sessionsToUpdate.length} sessions to migrate`);
    
    for (const session of sessionsToUpdate) {
      // Generate meeting room name
      const roomName = `session_${session.teacher_id}_${session.learner_id}_${Date.now()}`;
      
      // Update session with meeting room
      await Session.findByIdAndUpdate(session._id, {
        meeting_room: roomName
      });
      
      console.log(`Updated session ${session._id} with meeting room: ${roomName}`);
    }
    
    console.log('Session migration completed successfully!');
  } catch (error) {
    console.error('Session migration failed:', error);
  }
};

module.exports = { migrateSessions };

// Run migration if this file is executed directly
if (require.main === module) {
  const dbConfig = require('../config/db');
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hunarbazaar')
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateSessions();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}