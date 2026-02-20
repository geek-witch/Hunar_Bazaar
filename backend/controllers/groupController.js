const { getAdmin } = require('../utils/firebaseAdmin');

exports.createGroup = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, image, memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one member is required' });
    }

    // Create group conversation in Firestore
    const groupRef = await getAdmin().firestore().collection('conversations').add({
      participants: Array.from(new Set([userId.toString(), ...memberIds.map(m => m.toString())])),
      isGroup: true,
      group: {
        name: name || 'New Group',
        image: image || null,
        owner: userId.toString(),
        admins: [userId.toString()],
        createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      },
      createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      updatedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      lastMessageAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      lastReadAt: {},
    });

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { id: groupRef.id },
    });
  } catch (error) {
    console.error('Create group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message,
    });
  }
};

exports.addMember = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();
    
    // Check if user is admin or owner
    if (groupData.group.owner.toString() !== userId && !groupData.group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can add members' });
    }

    // Check if member already exists
    if (groupData.participants.map(p => p.toString()).includes(memberId.toString())) {
      return res.status(400).json({ success: false, message: 'Member already in group' });
    }

    // Add member
    await groupRef.update({
      participants: getAdmin().firestore.FieldValue.arrayUnion(memberId),
    });

    return res.status(200).json({ success: true, message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message,
    });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();
    
    // Check if user is admin or owner
    if (groupData.group.owner.toString() !== userId && !groupData.group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members' });
    }

    // Cannot remove owner
    if (groupData.group.owner.toString() === memberId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove group owner' });
    }

    // Remove member
    await groupRef.update({
      participants: getAdmin().firestore.FieldValue.arrayRemove(memberId),
    });

    return res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message,
    });
  }
};

exports.renameGroup = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;
    const { name, image } = req.body;

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();
    
    // Check if user is admin or owner
    if (groupData.group.owner.toString() !== userId && !groupData.group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can rename group' });
    }

    const updates = {};
    if (name) updates['group.name'] = name;
    if (image) updates['group.image'] = image;
    updates.updatedAt = getAdmin().firestore.FieldValue.serverTimestamp();

    await groupRef.update(updates);

    return res.status(200).json({ success: true, message: 'Group updated successfully' });
  } catch (error) {
    console.error('Rename group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message,
    });
  }
};

exports.assignAdmin = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;
    const { memberId, isAdmin } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();
    
    // Only owner can assign admins
    if (groupData.group.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only group owner can assign admins' });
    }

    if (isAdmin) {
      // Make admin
      if (!groupData.group.admins.includes(memberId.toString())) {
        await groupRef.update({
          'group.admins': getAdmin().firestore.FieldValue.arrayUnion(memberId.toString()),
        });
      }
    } else {
      // Remove admin
      await groupRef.update({
        'group.admins': getAdmin().firestore.FieldValue.arrayRemove(memberId.toString()),
      });
    }

    return res.status(200).json({ success: true, message: 'Admin status updated successfully' });
  } catch (error) {
    console.error('Assign admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating admin status',
      error: error.message,
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ success: false, message: 'Message ID is required' });
    }

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();
    
    // Check if user is admin or owner
    if (groupData.group.owner.toString() !== userId && !groupData.group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can delete messages' });
    }

    // Delete message
    await getAdmin().firestore().collection('conversations').doc(groupId).collection('messages').doc(messageId).delete();

    return res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message,
    });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();

    // Check if user is owner - cannot leave if owner
    if (groupData.group.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Group owner cannot leave. Delete the group instead.' });
    }

    // Remove user from participants
    await groupRef.update({
      participants: getAdmin().firestore.FieldValue.arrayRemove(userId),
      'group.admins': getAdmin().firestore.FieldValue.arrayRemove(userId),
    });

    return res.status(200).json({ success: true, message: 'You left the group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error leaving group',
      error: error.message,
    });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();

    // Check if user is participant
    if (!groupData.participants.map(p => p.toString()).includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Determine current user's role
    const currentUserRole = {
      isOwner: groupData.group.owner.toString() === userId,
      isAdmin: groupData.group.admins.map(a => a.toString()).includes(userId),
      isMember: true,
    };

    return res.status(200).json({
      success: true,
      data: {
        id: groupId,
        ...groupData.group,
        participants: groupData.participants,
        currentUserRole,
      },
    });
  } catch (error) {
    console.error('Get group details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching group details',
      error: error.message,
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const groupId = req.params.id;

    const groupRef = getAdmin().firestore().collection('conversations').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const groupData = groupDoc.data();

    // Only owner can delete
    if (groupData.group.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only group owner can delete the group' });
    }

    // Delete all messages first
    const messagesRef = getAdmin().firestore().collection('conversations').doc(groupId).collection('messages');
    const messagesSnap = await messagesRef.get();
    
    const batch = getAdmin().firestore().batch();
    messagesSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete group conversation
    batch.delete(groupRef);
    await batch.commit();

    return res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message,
    });
  }
};

