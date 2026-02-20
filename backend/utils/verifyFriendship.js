/**
 * Diagnostic script to verify friendship documents exist in Firestore
 * Usage: node utils/verifyFriendship.js <userId1> <userId2>
 */

require('dotenv').config();
const { getAdmin } = require('./firebaseAdmin');

async function verifyFriendship(userId1, userId2) {
  try {
    const admin = getAdmin();
    const db = admin.firestore();
    
    const userId1Str = userId1.toString();
    const userId2Str = userId2.toString();
    
    console.log(`Checking friendship between ${userId1Str} and ${userId2Str}...\n`);
    
    const doc1Ref = db.collection('friendships').doc(userId1Str)
      .collection('friends').doc(userId2Str);
    const doc2Ref = db.collection('friendships').doc(userId2Str)
      .collection('friends').doc(userId1Str);
    
    const [doc1, doc2] = await Promise.all([
      doc1Ref.get(),
      doc2Ref.get()
    ]);
    
    console.log(`friendships/${userId1Str}/friends/${userId2Str}: ${doc1.exists ? '✓ EXISTS' : '✗ MISSING'}`);
    if (doc1.exists) {
      console.log(`  Data:`, doc1.data());
    }
    
    console.log(`friendships/${userId2Str}/friends/${userId1Str}: ${doc2.exists ? '✓ EXISTS' : '✗ MISSING'}`);
    if (doc2.exists) {
      console.log(`  Data:`, doc2.data());
    }
    
    if (doc1.exists && doc2.exists) {
      console.log('\n✓ Both friendship documents exist - chat should work!');
    } else {
      console.log('\n✗ Missing friendship documents - chat will fail with permission errors.');
      console.log('  Run: cd backend && node utils/migrateFriendships.js');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

const [,, userId1, userId2] = process.argv;

if (!userId1 || !userId2) {
  console.error('Usage: node utils/verifyFriendship.js <userId1> <userId2>');
  process.exit(1);
}

verifyFriendship(userId1, userId2).then(() => process.exit(0));
