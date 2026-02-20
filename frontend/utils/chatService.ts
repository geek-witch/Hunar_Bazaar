import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
  increment,
} from "firebase/firestore"

import type { Timestamp } from "firebase/firestore"
import { db } from "./firebase"

export type ConversationDoc = {
  participants: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
  lastMessageText?: string
  lastMessageAt?: Timestamp
  lastMessageSenderId?: string
  lastReadAt?: { [userId: string]: Timestamp } // Map of userId -> last read timestamp
  unreadCounts?: { [userId: string]: number } // Map of userId -> number of unread messages
}

export type MessageDoc = {
  text: string
  senderId: string
  createdAt?: Timestamp
  readBy?: string[] // Array of user IDs who have read this message
  deletedFor?: string[] // Array of user IDs who deleted this message for themselves
  deletedForEveryone?: boolean // If true, message is deleted for everyone
  isDeleted?: boolean // Deprecated: use deletedForEveryone or check deletedFor instead
}

export type TypingIndicatorDoc = {
  userId: string
  userName?: string
  startedAt?: Timestamp
}

export function conversationIdForUsers(a: string, b: string) {
  return [a, b].sort().join("_")
}

export async function ensureConversation(uid1: string, uid2: string) {
  // 1️⃣ Only search conversations that uid1 is allowed to read
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid1)
  )

  const snap = await getDocs(q)

  // Find an existing 1-to-1 conversation (not a group) containing both users
  const existing = snap.docs.find(d => {
    const data = d.data() as ConversationDoc & { isGroup?: boolean }
    const participants = (data.participants || []) as string[]
    // Only match non-group conversations and exactly 2 participants
    if (data.isGroup) return false
    if (!participants.includes(uid2)) return false
    if (participants.length !== 2) return false
    return true
  })

  // 2️⃣ If exists → return it
  if (existing) {
    return { id: existing.id, ...(existing.data() as ConversationDoc) }
  }

  const ref = await addDoc(collection(db, "conversations"), {
    participants: [uid1, uid2],
    isGroup: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastReadAt: {},
  })

  return { id: ref.id }
}

export async function createGroupConversation(creatorId: string, memberIds: string[], name?: string, image?: string) {
  const admin = undefined as any; // placeholder to satisfy types
  if (!creatorId) throw new Error('creatorId required');
  const participants = Array.from(new Set([creatorId, ...(memberIds || [])]));
  const ref = await addDoc(collection(db, 'conversations'), {
    participants,
    isGroup: true,
    group: {
      name: name || 'New Group',
      image: image || null,
      owner: creatorId,
      admins: [creatorId]
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastReadAt: {},
  } as any);

  return { id: ref.id };
}
export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Message text cannot be empty')
  }

  if (!conversationId || !senderId) {
    throw new Error('Conversation ID and sender ID are required')
  }

  try {
    const convRef = doc(db, "conversations", conversationId)
    const msgRef = collection(db, "conversations", conversationId, "messages")

    // Add message first
    await addDoc(msgRef, {
      text: trimmed,
      senderId,
      createdAt: serverTimestamp() as any,
      readBy: [senderId], // Mark as read by sender immediately
    } satisfies MessageDoc as any)

    // Update conversation metadata
    const updates: any = {
      updatedAt: serverTimestamp(),
      lastMessageText: trimmed,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: senderId,
    };

    // For group chats or 1-to-1 chats, we need to increment unread counts for all participants EXCEPT the sender
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const convData = convSnap.data() as ConversationDoc;
      const participants = convData.participants || [];

      participants.forEach(pId => {
        if (pId !== senderId) {
          updates[`unreadCounts.${pId}`] = increment(1);
        }
      });
    }

    await updateDoc(convRef, updates)
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export function listenToMessages(
  conversationId: string,
  onMessages: (msgs: Array<{ id: string } & MessageDoc>) => void
) {
  const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("createdAt", "asc"))
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as MessageDoc) }))
      onMessages(msgs)
    }
  )
}

export function listenToMyConversations(
  meId: string,
  onConversations: (convs: Array<{ id: string } & ConversationDoc>) => void
) {
  // Prefer a filtered, indexed query (efficient). If it fails (missing index or other error),
  // fall back to listening to the full collection and filter client-side so members receive
  // new group conversations in real-time even when a composite index is not present.
  // Use array-contains query without server-side ordering to avoid requiring composite indexes.
  // Sort client-side for consistent ordering and reliable real-time updates for all participants.
  try {
    const q = query(collection(db, "conversations"), where("participants", "array-contains", meId))
    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ConversationDoc) }))
      // Sort by updatedAt desc for consistent UI ordering
      convs.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() || 0
        const tb = b.updatedAt?.toMillis?.() || 0
        return tb - ta
      })
      onConversations(convs)
    })
    return unsub
  } catch (err) {
    console.warn('listenToMyConversations failed, using full-collection listener', err)
    // Fallback: listen to all conversations and filter client-side
    const unsubAll = onSnapshot(collection(db, 'conversations'), (snap) => {
      const convs = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as ConversationDoc) }))
        .filter((c) => Array.isArray(c.participants) && c.participants.includes(meId))
      // Sort by updatedAt desc for consistent UI ordering
      convs.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() || 0
        const tb = b.updatedAt?.toMillis?.() || 0
        return tb - ta
      })
      onConversations(convs)
    })
    return unsubAll
  }
}

/**
 * Mark all unread messages in a conversation as read for the current user
 * This should be called when a user opens/views a conversation
 */
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const convRef = doc(db, "conversations", conversationId)
  const messagesRef = collection(db, "conversations", conversationId, "messages")

  // Get all messages that haven't been read by this user
  const messagesSnapshot = await getDocs(query(messagesRef, orderBy("createdAt", "asc")))

  const batch = writeBatch(db)
  let hasUpdates = false

  // Update conversation's lastReadAt and unreadCount for this user
  const now = serverTimestamp()
  batch.update(convRef, {
    [`lastReadAt.${userId}`]: now,
    [`unreadCounts.${userId}`]: 0,
  })
  hasUpdates = true

  // Mark all unread messages (sent to this user) as read
  messagesSnapshot.docs.forEach((msgDoc) => {
    const msgData = msgDoc.data() as MessageDoc
    const readBy = msgData.readBy || []

    // Only mark messages sent to this user (not by this user) as read
    const mSenderId = String(msgData.senderId || '').trim();
    const currentUserId = String(userId || '').trim();

    if (mSenderId !== "" && mSenderId !== currentUserId && !readBy.includes(currentUserId)) {
      batch.update(msgDoc.ref, {
        readBy: [...readBy, currentUserId],
      })
      hasUpdates = true
    }
  })

  if (hasUpdates) {
    await batch.commit()
  }
}


/**
 * Delete message for current user only (like WhatsApp's "Delete for me")
 */
export async function deleteMessageForMe(
  conversationId: string,
  messageId: string,
  userId: string
) {
  const msgRef = doc(db, "conversations", conversationId, "messages", messageId)
  const msgSnapshot = await getDocs(query(collection(db, "conversations", conversationId, "messages")))
  const msgDoc = msgSnapshot.docs.find((d) => d.id === messageId)

  if (!msgDoc) {
    throw new Error("Message not found")
  }

  const msgData = msgDoc.data() as MessageDoc
  const deletedFor = msgData.deletedFor || []

  // Add userId to deletedFor array if not already there
  if (!deletedFor.includes(userId)) {
    deletedFor.push(userId)
  }

  await updateDoc(msgRef, {
    deletedFor,
  })
}

/**
 * Delete message for everyone (like WhatsApp's "Delete for everyone")
 * Only the sender can delete for everyone
 */
export async function deleteMessageForEveryone(
  conversationId: string,
  messageId: string,
  userId: string
) {
  const msgRef = doc(db, "conversations", conversationId, "messages", messageId)
  const msgSnapshot = await getDocs(query(collection(db, "conversations", conversationId, "messages")))
  const msgDoc = msgSnapshot.docs.find((d) => d.id === messageId)

  if (!msgDoc) {
    throw new Error("Message not found")
  }

  const msgData = msgDoc.data() as MessageDoc

  // Only the sender can delete for everyone
  if (msgData.senderId !== userId) {
    throw new Error("Only the sender can delete this message for everyone")
  }

  await updateDoc(msgRef, {
    deletedForEveryone: true,
    text: "[This message was deleted]",
  })
}

/**
 * Set typing indicator for a user in a conversation
 */
export async function setTypingIndicator(
  conversationId: string,
  userId: string,
  userName?: string
) {
  const typingRef = collection(db, "conversations", conversationId, "typing")
  const userTypingRef = doc(typingRef, userId)

  // Use setDoc with merge: true to create or update the document
  await setDoc(userTypingRef, {
    userId,
    userName: userName || "",
    startedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Remove typing indicator for a user
 */

export async function removeTypingIndicator(conversationId: string, userId: string) {
  const typingRef = doc(db, "conversations", conversationId, "typing", userId)
  try {
    await deleteDoc(typingRef)
  } catch (error) {
    // Document might not exist, ignore error
    console.warn("Could not remove typing indicator:", error)
  }
}

/**
 * Listen to typing indicators in a conversation
 */
export function listenToTypingIndicators(
  conversationId: string,
  onTyping: (typing: Array<{ id: string } & TypingIndicatorDoc>) => void
) {
  const q = query(collection(db, "conversations", conversationId, "typing"))
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const typing = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as TypingIndicatorDoc) }))
        .filter((t) => {
          // Filter out indicators older than 60 seconds to prevent stuck indicators
          if (!t.startedAt) return false;
          // If timestamp is from server, check its age
          const millis = t.startedAt.toMillis ? t.startedAt.toMillis() : 0;
          return (now - millis) < 60000;
        });
      onTyping(typing)
    }
  )
}
