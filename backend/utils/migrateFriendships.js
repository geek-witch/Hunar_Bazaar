/**
 * Migration script to sync existing MongoDB friendships to Firestore
 * Run this once to migrate existing friendships:
 * node utils/migrateFriendships.js
 */

// Load environment variables first
require('dotenv').config();

const User = require('../models/User');
const { syncAllFriendshipsToFirestore } = require('./firestoreFriendship');
const connectDB = require('../config/db');

async function migrateAllFriendships() {
  try {
    console.log('Starting friendship migration to Firestore...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    const users = await User.find({ friends: { $exists: true, $ne: [] } }).select('_id friends');
    
    console.log(`Found ${users.length} users with friends`);
    
    let migrated = 0;
    for (const user of users) {
      const friendIds = (user.friends || []).map(id => id.toString());
      if (friendIds.length > 0) {
        await syncAllFriendshipsToFirestore(user._id, friendIds);
        migrated++;
        console.log(`Migrated friendships for user ${user._id} (${friendIds.length} friends)`);
      }
    }
    
    console.log(`\nMigration complete! Migrated ${migrated} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Allow running directly: node utils/migrateFriendships.js
if (require.main === module) {
  migrateAllFriendships();
}

module.exports = { migrateAllFriendships };
