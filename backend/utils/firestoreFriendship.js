const { getAdmin } = require('./firebaseAdmin');

/**
 * Mirror friendship to Firestore for security rules
 * Creates/updates friendships/{userId}/friends/{friendId} documents
 */
async function mirrorFriendshipToFirestore(userId, friendId, isFriend) {
  try {
    const admin = getAdmin();
    const db = admin.firestore();
    
    const userIdStr = userId.toString();
    const friendIdStr = friendId.toString();
    
    if (isFriend) {
      // Add friendship both ways
      const batch = db.batch();
      
      const friend1Ref = db.collection('friendships').doc(userIdStr)
        .collection('friends').doc(friendIdStr);
      batch.set(friend1Ref, {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: friendIdStr,
      }, { merge: true });
      
      const friend2Ref = db.collection('friendships').doc(friendIdStr)
        .collection('friends').doc(userIdStr);
      batch.set(friend2Ref, {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userIdStr,
      }, { merge: true });
      
      await batch.commit();
      console.log(`✓ Mirrored friendship: ${userIdStr} <-> ${friendIdStr}`);
      
      // Verify both documents were created (for debugging)
      const [doc1, doc2] = await Promise.all([
        friend1Ref.get(),
        friend2Ref.get()
      ]);
      
      if (!doc1.exists || !doc2.exists) {
        console.warn(`⚠ Friendship documents may not be fully synced: doc1=${doc1.exists}, doc2=${doc2.exists}`);
      }
    } else {
      // Remove friendship both ways
      const batch = db.batch();
      
      batch.delete(db.collection('friendships').doc(userIdStr)
        .collection('friends').doc(friendIdStr));
      batch.delete(db.collection('friendships').doc(friendIdStr)
        .collection('friends').doc(userIdStr));
      
      await batch.commit();
      console.log(`✓ Removed friendship mirror: ${userIdStr} <-> ${friendIdStr}`);
    }
  } catch (error) {
    // Log but don't fail the request if Firestore mirroring fails
    console.error('✗ Failed to mirror friendship to Firestore:', error);
    console.error('  UserId:', userId.toString(), 'FriendId:', friendId.toString());
    // Re-throw so the controller can log it too
    throw error;
  }
}

/**
 * Sync all friendships for a user to Firestore (useful for migration)
 */
async function syncAllFriendshipsToFirestore(userId, friendIds) {
  try {
    const admin = getAdmin();
    const db = admin.firestore();
    const userIdStr = userId.toString();
    const batch = db.batch();
    
    // Clear existing friendships
    const friendsRef = db.collection('friendships').doc(userIdStr).collection('friends');
    const snapshot = await friendsRef.get();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add current friendships
    for (const friendId of friendIds || []) {
      const friendIdStr = friendId.toString();
      const friendRef = friendsRef.doc(friendIdStr);
      batch.set(friendRef, {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: friendIdStr,
      });
    }
    
    await batch.commit();
    console.log(`Synced ${friendIds?.length || 0} friendships for user ${userIdStr}`);
  } catch (error) {
    console.error('Failed to sync friendships to Firestore:', error);
    // Don't throw
  }
}

/**
 * Delete a conversation between two users from Firestore
 * This removes the conversation so it no longer appears in chat lists
 */
async function deleteConversationFromFirestore(userId, targetId) {
  try {
    const admin = getAdmin();
    const db = admin.firestore();
    
    const userIdStr = userId.toString();
    const targetIdStr = targetId.toString();
    
    // Query for conversations between these two users
    const conversationsRef = db.collection('conversations');
    const q = conversationsRef.where('participants', 'array-contains', userIdStr);
    const snapshot = await q.get();
    
    if (snapshot.empty) {
      console.log(`No conversations found for user ${userIdStr}`);
      return;
    }
    
    const batch = db.batch();
    let deletedCount = 0;
    
    // Delete conversations that include both participants (not groups)
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || [];
      
      // Only delete 1-on-1 conversations (not groups)
      if (!data.isGroup && participants.includes(userIdStr) && participants.includes(targetIdStr)) {
        batch.delete(doc.ref);
        deletedCount++;
        console.log(`✓ Marked conversation ${doc.id} for deletion`);
      }
    });
    
    // Only commit if there are deletions to make
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✓ Deleted ${deletedCount} conversation(s) between ${userIdStr} and ${targetIdStr}`);
    }
  } catch (error) {
    console.error('Failed to delete conversation from Firestore:', error);
    throw error;
  }
}

module.exports = {
  mirrorFriendshipToFirestore,
  syncAllFriendshipsToFirestore,
  deleteConversationFromFirestore,
};
