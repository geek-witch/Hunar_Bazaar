'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, Page } from '../App';
import { SearchIcon } from '../components/icons/MiscIcons';
import { authApi, supportApi, groupApi, profileApi } from '../utils/api';
import { StarIcon, CircleIcon } from '../components/icons/MiscIcons';
import { firebaseAuth } from '../utils/firebase';
import { ensureFirebaseSignedIn } from '../utils/firebaseAuth';
import { ConversationDoc, ensureConversation, listenToMessages, listenToMyConversations, sendMessage, markMessagesAsRead, createGroupConversation, deleteMessageForMe, deleteMessageForEveryone, setTypingIndicator, removeTypingIndicator, listenToTypingIndicators } from '../utils/chatService';
import ConfirmModal from '../components/ConfirmModal';
import type { Timestamp } from 'firebase/firestore';

interface Chat {
  id: string;
  otherUserId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  time: string;
  createdAt?: Timestamp;
  readBy?: string[];
  deletedFor?: string[];
  deletedForEveryone?: boolean;
}

const MessengerPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const DEFAULT_GROUP_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="%23f3f5f6"/></svg>'
  const [friends, setFriends] = useState<Array<{ id: string; name: string; avatar: string; profileId?: string }>>([]);
  const [convDocs, setConvDocs] = useState<Array<{ id: string } & ConversationDoc>>([]);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiRecents, setEmojiRecents] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('emojiRecents') || '[]');
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Array<{ id: string; name?: string; avatar?: string }>>([]);
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [currentGroupRole, setCurrentGroupRole] = useState<{ isOwner: boolean; isAdmin: boolean; isMember: boolean } | null>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reportConfirmOpen, setReportConfirmOpen] = useState(false);
  const [blockUserName, setBlockUserName] = useState('');
  const [canReportUser, setCanReportUser] = useState(true);
  const [reportCooldownDays, setReportCooldownDays] = useState(0);
  const [myBlockedUsers, setMyBlockedUsers] = useState<string[]>([]);
  const [messageContextMenu, setMessageContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [groupDeleteConfirmOpen, setGroupDeleteConfirmOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [orphanProfiles, setOrphanProfiles] = useState<Map<string, { name: string; avatar: string }>>(new Map());

  const meId = firebaseAuth.currentUser?.uid || localStorage.getItem('userId') || '';

  const friendsById = useMemo(() => {
    const m = new Map<string, { id: string; name: string; avatar: string; profileId?: string }>();
    friends.forEach((f) => m.set(f.id, f));
    return m;
  }, [friends]);

  const convByOtherUserId = useMemo(() => {
    const m = new Map<string, { id: string } & ConversationDoc>();
    // Only map 1-to-1 (non-group) conversations to other user id
    for (const c of convDocs) {
      if (c.isGroup) continue;
      const other = (c.participants || []).find((p) => p !== meId);
      if (other) m.set(other, c);
    }
    return m;
  }, [convDocs, meId]);

  // Chat tab state: 'dm' shows direct messages, 'groups' shows group chats
  const [chatTab, setChatTab] = useState<'dm' | 'groups'>('dm');

  // Store all messages per conversation for unread calculation
  const [messagesByConversationId, setMessagesByConversationId] = useState<Map<string, Message[]>>(new Map())
  // Track typing indicators per conversation
  const [typingByConversationId, setTypingByConversationId] = useState<Map<string, Array<{ userId: string; userName?: string }>>>(new Map());

  const chats: Chat[] = useMemo(() => {
    const formatRelative = (ts?: Timestamp) => {
      if (!ts) return '';
      const d = ts.toDate();
      const diffMs = Date.now() - d.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${Math.max(1, mins)}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h`;
      const days = Math.floor(hrs / 24);
      return `${days}d`;
    };

    const groupConvs = (convDocs || []).filter((c) => c.isGroup && (c.participants || []).includes(meId));

    const groupEntries = groupConvs.map((conv) => {
      const lastMessageAtTime = conv?.lastMessageAt?.toMillis?.() || 0;

      // Check unreadCount from conversation document
      const unreadCount = conv.unreadCounts?.[meId] || 0;

      return {
        id: conv.id,
        otherUserId: `group:${conv.id}`,
        name: conv.group?.name || 'Group',
        avatar: conv.group?.image || DEFAULT_GROUP_AVATAR,
        lastMessage: conv?.lastMessageText || '',
        time: formatRelative(conv?.lastMessageAt),
        unread: unreadCount,
        online: false,
      } as Chat;
    });

    const base = friends
      .filter((f) => !myBlockedUsers.includes(f.id))  // Filter out blocked users
      .map((f) => {
        const conv = convByOtherUserId.get(f.id);
        const convId = conv?.id;

        const lastMessageAtTime = conv?.lastMessageAt?.toMillis?.() || 0;

        // Check unreadCount from conversation document
        const unreadCount = conv?.unreadCounts?.[meId] || 0;

        return {
          id: convId || `friend-${f.id}`,
          otherUserId: f.id,
          name: f.name,
          avatar: f.avatar,
          lastMessage: conv?.lastMessageText || '',
          time: formatRelative(conv?.lastMessageAt),
          unread: unreadCount,
          online: false,
        } satisfies Chat;
      });

    // 🚀 NEW: Add conversations that are NOT in the friends list (Resilient Chat List)
    const orphans = convDocs.filter(c => {
      if (c.isGroup) return false;
      const other = (c.participants || []).find(p => p !== meId);
      if (!other) return false;
      return !friendsById.has(other);
    }).map(c => {
      const otherId = (c.participants || []).find(p => p !== meId)!;
      const cached = orphanProfiles.get(otherId);
      return {
        id: c.id,
        otherUserId: otherId,
        name: cached?.name || 'User Not Found',
        avatar: cached?.avatar || '/asset/p1.jfif',
        lastMessage: c.lastMessageText || '',
        time: formatRelative(c.lastMessageAt),
        unread: c.unreadCounts?.[meId] || 0,
        online: false,
      } as Chat;
    });

    // Merge groups + friends + orphans and sort by updatedAt
    const mergedAll = [...groupEntries, ...base, ...orphans];

    const merged = chatTab === 'groups' ? groupEntries : chatTab === 'dm' ? [...base, ...orphans] : mergedAll;

    return merged.sort((a, b) => {
      const ca = convDocs.find((c) => c.id === (a.id && a.id.startsWith('friend-') ? undefined : a.id));
      const cb = convDocs.find((c) => c.id === (b.id && b.id.startsWith('friend-') ? undefined : b.id));
      const ta = ca?.updatedAt?.toMillis?.() || 0;
      const tb = cb?.updatedAt?.toMillis?.() || 0;
      if (tb !== ta) return tb - ta;
      return a.name.localeCompare(b.name);
    });
  }, [friends, convByOtherUserId, messagesByConversationId, meId, myBlockedUsers, chatTab]);


  // If the selected chat is a group that the user has left, clear selection and remove stored id
  useEffect(() => {
    if (!selectedOtherUserId || !selectedOtherUserId.startsWith('group:')) return;
    const gid = selectedOtherUserId.split(':')[1];
    const conv = convDocs.find((c) => c.id === gid);
    const stillParticipant = conv && Array.isArray(conv.participants) && conv.participants.includes(meId);
    if (!conv || !stillParticipant) {
      // Clear selection so UI doesn't show a stale/closed group chat
      setSelectedOtherUserId(null);
      sessionStorage.removeItem('selectedChatUserId');
      // If user was viewing messages, also clear message list and convo id
      setMessages([]);
      setSelectedConversationId(null);
      // Notify user quietly
      navigation.showNotification('Group created successfully.');
    }
  }, [convDocs, selectedOtherUserId, meId, navigation]);

  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Calculate total unread messages count for navbar badge
  const totalUnreadCount = useMemo(() => {
    return chats.reduce((sum, chat) => sum + chat.unread, 0);
  }, [chats]);

  // Update unread count in localStorage for Header to access
  // This runs on every totalUnreadCount change and broadcasts the update
  useEffect(() => {
    const unreadStr = totalUnreadCount.toString();
    const previousCount = localStorage.getItem('unreadMessageCount') || '0';

    // Only update if count actually changed to reduce unnecessary updates
    if (previousCount !== unreadStr) {
      localStorage.setItem('unreadMessageCount', unreadStr);
      // Dispatch event for same-tab updates
      window.dispatchEvent(new CustomEvent('unreadMessages:changed', { detail: totalUnreadCount }));
      // Broadcast to other tabs/windows via storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'unreadMessageCount',
        newValue: unreadStr,
        oldValue: previousCount,
        storageArea: localStorage,
      } as any));
    }
  }, [totalUnreadCount]);

  const selectedChatData = useMemo(() => {
    if (!selectedOtherUserId) return undefined;
    if (selectedOtherUserId.startsWith('group:')) {
      const id = selectedOtherUserId.split(':')[1];
      const conv = convDocs.find((c) => c.id === id);
      if (!conv) return undefined;
      return {
        otherUserId: `group:${id}`,
        id,
        name: conv.group?.name || 'Group',
        avatar: conv.group?.image || '/asset/p1.jfif',
      } as any;
    }

    return chats.find((c) => c.otherUserId === selectedOtherUserId);
  }, [chats, selectedOtherUserId, convDocs]);

  // Reset per-chat UI states when switching conversations and check blocked status
  useEffect(() => {
    setMenuOpen(false);
    setReportModalOpen(false);
    setReportReason('');
    setReportError('');
    setBlockedByMe(false);
    setCanReportUser(true);
    setReportCooldownDays(0);

    // Check if the selected user is blocked (skip for groups)
    if (selectedOtherUserId && meId && !selectedOtherUserId.startsWith('group:')) {
      checkIfBlocked(selectedOtherUserId);
      checkReportStatus(selectedOtherUserId);
    }
  }, [selectedOtherUserId, meId]);

  useEffect(() => {
    if (!groupSettingsOpen || !selectedOtherUserId) return;
    const gid = selectedOtherUserId.startsWith('group:') ? selectedOtherUserId.split(':')[1] : null;
    if (!gid) return;
    const conv = convDocs.find(c => c.id === gid);
    if (!conv) return;
    const members = (conv.participants || []).map((id: string) => ({ id, name: friendsById.get(id)?.name, avatar: friendsById.get(id)?.avatar }));
    setGroupMembers(members);
    setGroupName(conv.group?.name || '');

    // Fetch group details to get role information and fill missing member names
    (async () => {
      try {
        const resp = await groupApi.getGroupDetails(gid);
        if (resp.success && resp.data) {
          setCurrentGroupRole(resp.data.currentUserRole);

          // If backend returned enriched participant details, use them
          if (Array.isArray(resp.data.participants) && resp.data.participants.length > 0 && typeof resp.data.participants[0] === 'object') {
            const detailed = resp.data.participants.map((p: any) => ({ id: p.id, name: p.name || null, avatar: p.profilePic || null }));
            setGroupMembers(detailed);
            // If any participant still missing a name, fetch their profile by userId
            const missingFromDetailed = detailed.filter(d => !d.name).map(d => d.id);
            if (missingFromDetailed.length > 0) {
              try {
                const profiles = await Promise.all(missingFromDetailed.map((id) => profileApi.getProfileById(id)));
                const profileMap: Record<string, any> = {};
                profiles.forEach(p => { if (p && p.success && p.data) profileMap[p.data.id] = p.data; });
                setGroupMembers((prev) => prev.map(m => {
                  if (m.name) return m;
                  const p = profileMap[m.id];
                  if (p) return { ...m, name: p.name || ([p.firstName, p.lastName].filter(Boolean).join(' ') || 'Hunar Bazaar Member'), avatar: p.profilePic || m.avatar };
                  return m;
                }));
              } catch (err) {
                console.error('Failed to fetch missing participant profiles:', err);
              }
            }
            // continue (don't run fallback below)
            return;
          }
        }

        // Fallback: Find any participant IDs missing a name (not in friends list) and fetch profiles
        const missing = members.filter(m => !m.name).map(m => m.id);
        if (missing.length > 0) {
          try {
            const profiles = await Promise.all(missing.map(id => profileApi.getProfileById(id)));
            const profileMap: Record<string, any> = {};
            profiles.forEach(p => {
              if (p && p.success && p.data) {
                profileMap[p.data.id] = p.data;
              }
            });

            // Merge fetched names into groupMembers state
            setGroupMembers((prev) => prev.map(m => {
              if (m.name) return m;
              const p = profileMap[m.id];
              if (p) {
                return { ...m, name: p.name || ([p.firstName, p.lastName].filter(Boolean).join(' ') || 'Hunar Bazaar Member'), avatar: p.profilePic || m.avatar };
              }
              return m;
            }));
          } catch (err) {
            console.error('Failed to fetch missing member profiles:', err);
          }
        }
      } catch (err) {
        console.error('Failed to get group role:', err);
      }
    })();
  }, [groupSettingsOpen, selectedOtherUserId, convDocs, friendsById]);

  const handleDeleteMessageForMe = async (messageId: string) => {
    if (!selectedConversationId) return;
    setDeletingMessageId(messageId);
    try {
      await deleteMessageForMe(selectedConversationId, messageId, meId);
      setMessageContextMenu(null);
      navigation.showNotification('Message deleted for you');
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      navigation.showNotification('Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleDeleteMessageForEveryone = async (messageId: string) => {
    if (!selectedConversationId) return;
    setDeletingMessageId(messageId);
    try {
      await deleteMessageForEveryone(selectedConversationId, messageId, meId);
      setMessageContextMenu(null);
      navigation.showNotification('Message deleted for everyone');
    } catch (err: any) {
      console.error('Failed to delete message for everyone:', err);
      navigation.showNotification(err.message || 'Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const checkIfBlocked = async (userId: string) => {
    try {
      const resp = await authApi.checkBlocked(userId);
      if (resp.success && resp.data) {
        setBlockedByMe(resp.data.isBlocked);
      }
    } catch (err) {
      console.error('Failed to check blocked status:', err);
    }
  };

  const checkReportStatus = async (userId: string) => {
    try {
      const resp = await supportApi.checkUserReport(userId);
      if (resp.success && resp.data) {
        setCanReportUser(resp.data.canReportAgain);
        setReportCooldownDays(resp.data.daysRemaining);
      }
    } catch (err) {
      console.error('Failed to check report status:', err);
    }
  };

  // bootstrap: ensure firebase auth, load friends, subscribe to conversations
  useEffect(() => {
    let unsubConvs: null | (() => void) = null;
    let mounted = true;

    (async () => {
      try {
        await ensureFirebaseSignedIn();
      } catch (e) {
        console.warn('Firebase not ready for chat:', e);
        return;
      }

      try {
        const frs = await authApi.getFriends();
        if (!mounted) return;
        const list = (frs.success && frs.data ? (frs.data as any[]) : []).map((f: any) => ({
          id: f.id,
          name: f.name,
          avatar: f.profilePic || '/asset/p1.jfif',
          profileId: f.profileId || f.id,
        }));
        setFriends(list);
      } catch {
        // ignore
      }

      // Fetch current user's blocked users list
      try {
        const resp = await authApi.getProfile();
        if (resp.success && resp.data) {
          const userData = resp.data as any;
          if (userData.blocked) {
            setMyBlockedUsers(userData.blocked);
          }
          // Use firstName + lastName, or name, or fallback
          const firstName = userData.firstName || '';
          const lastName = userData.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          setMyName(fullName || userData.name || '');
        }
      } catch (err) {
        console.error('Failed to fetch blocked users:', err);
      }

      const uid = firebaseAuth.currentUser?.uid;
      if (!uid) {
        console.warn('No Firebase user ID, cannot listen to conversations');
        return;
      }

      console.log('Setting up conversation listener for user:', uid);

      unsubConvs = listenToMyConversations(
        uid,
        (convs) => {
          console.log('Received conversations:', convs.length);
          if (mounted) {
            setConvDocs(convs);
          }
        }
      );
    })();

    // Handle window focus event to refresh unread counts when user returns to tab
    const handleWindowFocus = () => {
      // Dispatch event to notify UI of potential unread count change
      const currentCount = localStorage.getItem('unreadMessageCount') || '0';
      window.dispatchEvent(new CustomEvent('unreadMessages:changed', { detail: parseInt(currentCount, 10) }));
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      mounted = false;
      unsubConvs?.();
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Effect to fetch profiles for orphan participants (non-friends)
  useEffect(() => {
    const orphanIds = convDocs
      .filter(c => !c.isGroup)
      .map(c => (c.participants || []).find(p => p !== meId))
      .filter((id): id is string => !!id && !friendsById.has(id) && !orphanProfiles.has(id));

    if (orphanIds.length === 0) return;

    (async () => {
      const newProfiles = new Map(orphanProfiles);
      let changed = false;

      for (const id of orphanIds) {
        try {
          const resp = await profileApi.getProfileById(id);
          if (resp.success && resp.data) {
            const p = resp.data;
            const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.name || 'User Not Found';
            newProfiles.set(id, {
              name: fullName,
              avatar: p.profilePic || '/asset/p1.jfif'
            });
            changed = true;
          } else {
            // If profile not found (404), mark as not found to avoid re-fetching
            newProfiles.set(id, { name: 'User Not Found', avatar: '/asset/p1.jfif' });
            changed = true;
          }
        } catch (err) {
          console.error(`Failed to fetch orphan profile ${id}:`, err);
          // Mark as not found on error to avoid infinite loops if the error persists
          newProfiles.set(id, { name: 'User Not Found', avatar: '/asset/p1.jfif' });
          changed = true;
        }
      }

      if (changed) {
        setOrphanProfiles(newProfiles);
      }
    })();
  }, [convDocs, friendsById, meId]);

  // when selecting a friend, ensure conversation exists + subscribe to its messages
  const unsubMsgsRef = useRef<null | (() => void)>(null);
  const unsubTypingRef = useRef<null | (() => void)>(null);
  const messageErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedMessagesRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    unsubMsgsRef.current?.();
    unsubMsgsRef.current = null;
    unsubTypingRef.current?.();
    unsubTypingRef.current = null;
    if (messageErrorTimeoutRef.current) {
      clearTimeout(messageErrorTimeoutRef.current);
      messageErrorTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    hasReceivedMessagesRef.current = false;
    setMessages([]);
    setSelectedConversationId(null);
    setTypingByConversationId((prev) => {
      const next = new Map(prev);
      next.delete(selectedOtherUserId || '');
      return next;
    });

    if (!selectedOtherUserId) return;
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    sessionStorage.setItem('selectedChatUserId', selectedOtherUserId);

    (async () => {
      try {
        // group selection convention: selectedOtherUserId starts with 'group:'
        if (selectedOtherUserId.startsWith('group:')) {
          const id = selectedOtherUserId.split(':')[1];
          setSelectedConversationId(id);

          unsubMsgsRef.current = listenToMessages(
            id,
            (msgs) => {
              hasReceivedMessagesRef.current = true;
              if (messageErrorTimeoutRef.current) {
                clearTimeout(messageErrorTimeoutRef.current);
                messageErrorTimeoutRef.current = null;
              }
              const mapped: Message[] = msgs.map((m) => ({
                id: m.id,
                text: m.text,
                senderId: m.senderId,
                time: m.createdAt ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                createdAt: m.createdAt,
                readBy: m.readBy || [],
                deletedFor: m.deletedFor || [],
                deletedForEveryone: m.deletedForEveryone || false,
              }));
              setMessages(mapped);
              setMessagesByConversationId((prev) => {
                const next = new Map(prev);
                next.set(id, mapped);
                return next;
              });

              setTimeout(() => {
                markMessagesAsRead(id, uid).catch((err) => {
                  console.error('Failed to mark messages as read:', err);
                });
              }, 500);
            },
          );

          // ✅ FIX: Subscribe to typing indicators for GROUP CHATS
          unsubTypingRef.current = listenToTypingIndicators(
            id,
            (typing) => {
              setTypingByConversationId((prev) => {
                const next = new Map(prev);
                if (typing.length > 0) {
                  next.set(id, typing.filter((t) => t.userId !== uid));
                } else {
                  next.delete(id);
                }
                return next;
              });
            }
          );

          return; // Early return for groups
        }

        // Direct message (1-to-1) flow
        console.log('Ensuring conversation exists between:', uid, 'and', selectedOtherUserId);
        const { id } = await ensureConversation(uid, selectedOtherUserId);
        console.log('Conversation ID:', id);
        setSelectedConversationId(id);

        unsubMsgsRef.current = listenToMessages(
          id,
          (msgs) => {
            hasReceivedMessagesRef.current = true;
            if (messageErrorTimeoutRef.current) {
              clearTimeout(messageErrorTimeoutRef.current);
              messageErrorTimeoutRef.current = null;
            }
            console.log('Received messages:', msgs.length);
            const mapped: Message[] = msgs.map((m) => ({
              id: m.id,
              text: m.text,
              senderId: m.senderId,
              time: m.createdAt ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              createdAt: m.createdAt,
              readBy: m.readBy || [],
              deletedFor: m.deletedFor || [],
              deletedForEveryone: m.deletedForEveryone || false,
            }));
            setMessages(mapped);
            // Store messages for unread calculation
            setMessagesByConversationId((prev) => {
              const next = new Map(prev);
              next.set(id, mapped);
              return next;
            });

            // Mark messages as read when viewing conversation (after a short delay to ensure messages are loaded)
            setTimeout(() => {
              markMessagesAsRead(id, uid).catch((err) => {
                console.error('Failed to mark messages as read:', err);
              });
            }, 500);
          }
        );

        // ✅ Subscribe to typing indicators for DIRECT MESSAGES
        unsubTypingRef.current = listenToTypingIndicators(
          id,
          (typing) => {
            setTypingByConversationId((prev) => {
              const next = new Map(prev);
              if (typing.length > 0) {
                next.set(id, typing.filter((t) => t.userId !== uid));
              } else {
                next.delete(id);
              }
              return next;
            });
          }
        );
      } catch (error: any) {
        console.error('Failed to set up conversation:', error);
        // Delay error notification for conversation setup too
        setTimeout(() => {
          navigation.showNotification('Failed to load conversation. Please try again.');
        }, 10000);
      }
    })();

    return () => {
      if (messageErrorTimeoutRef.current) {
        clearTimeout(messageErrorTimeoutRef.current);
        messageErrorTimeoutRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      unsubMsgsRef.current?.();
      unsubMsgsRef.current = null;
      unsubTypingRef.current?.();
      unsubTypingRef.current = null;
    };
  }, [selectedOtherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || !selectedOtherUserId) {
      console.warn('Cannot send: missing uid or selectedOtherUserId', { uid, selectedOtherUserId });
      navigation.showNotification('You must be logged in to send messages');
      return;
    }

    const trimmed = newMessage.trim();
    if (!trimmed) {
      console.warn('Cannot send: empty message');
      return;
    }

    try {
      let convId: string | undefined;
      if (selectedOtherUserId.startsWith('group:')) {
        convId = selectedOtherUserId.split(':')[1];
      } else {
        // Ensure conversation exists and is properly set up
        const res = await ensureConversation(uid, selectedOtherUserId);
        convId = res.id;
      }

      if (!convId) throw new Error('Failed to get conversation ID');

      const textToSend = trimmed;
      console.log('Sending message to conversation:', convId, 'text:', textToSend);

      // Send with retry logic
      let retries = 0;
      const maxRetries = 3;
      let lastError: any;

      while (retries < maxRetries) {
        try {
          await sendMessage(convId, uid, textToSend);
          setNewMessage('');
          console.log('Message sent successfully');
          return;
        } catch (error) {
          lastError = error;
          retries++;
          if (retries < maxRetries) {
            console.warn(`Message send failed, retry ${retries}/${maxRetries}:`, error);
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          }
        }
      }

      throw lastError;
    } catch (error) {
      console.error('Failed to send message:', error);
      navigation.showNotification('Failed to send message. Please check your connection and try again.');
    }
  };

  const addEmoji = (em: string) => {
    const el = inputRef.current;
    if (!el) {
      setNewMessage((prev) => prev + em);
    } else {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const v = newMessage || '';
      const next = v.slice(0, start) + em + v.slice(end);
      setNewMessage(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + em.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
      });
    }
    setEmojiRecents((prev) => {
      const next = [em, ...prev.filter((x) => x !== em)].slice(0, 20);
      try { localStorage.setItem('emojiRecents', JSON.stringify(next)); } catch { }
      return next;
    });
    setEmojiOpen(false);
    setEmojiSearch('');
  };

  const handleBlockUserClick = () => {
    const friendName = friendsById.get(selectedOtherUserId!)?.name || 'this user';
    setBlockUserName(friendName);
    setBlockConfirmOpen(true);
  };

  const handleBlockUser = async () => {
    if (!selectedOtherUserId) return;
    setBlockConfirmOpen(false);
    try {
      const resp = await authApi.blockUser(selectedOtherUserId);
      if (!resp.success) {
        navigation.showNotification(resp.message || 'Failed to block user');
        return;
      }
      // Set blocked state and show notification
      setBlockedByMe(true);
      setMenuOpen(false);
      navigation.showNotification('User blocked successfully');

      // Update blocked users list
      setMyBlockedUsers((prev) => [...prev, selectedOtherUserId]);

      // Immediately close the chat and refresh friends list
      setSelectedOtherUserId(null);
      sessionStorage.removeItem('selectedChatUserId');
      setMessages([]);
      setSelectedConversationId(null);

      // Refresh friends list UI (blocking removes friendship)
      window.dispatchEvent(new CustomEvent('friends:changed'));
    } catch (err: any) {
      console.error('Block user error:', err);
      navigation.showNotification('Failed to block user. Please try again.');
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedOtherUserId) return;
    try {
      const resp = await authApi.unblockUser(selectedOtherUserId);
      if (!resp.success) {
        navigation.showNotification(resp.message || 'Failed to unblock user');
        return;
      }

      // Update blocked users list
      setMyBlockedUsers((prev) => prev.filter((id) => id !== selectedOtherUserId));

      // Immediately close the chat
      const userId = selectedOtherUserId;
      setSelectedOtherUserId(null);
      sessionStorage.removeItem('selectedChatUserId');
      setMessages([]);
      setSelectedConversationId(null);
      setBlockedByMe(false);

      navigation.showNotification('User unblocked successfully');

      // Refresh friends list to get updated name and profile picture
      window.dispatchEvent(new CustomEvent('friends:changed'));

      // Reload friends list
      try {
        const frs = await authApi.getFriends();
        if (frs.success && frs.data) {
          const list = (frs.data as any[]).map((f: any) => ({
            id: f.id,
            name: f.name,
            avatar: f.profilePic || '/asset/p1.jfif',
            profileId: f.profileId || f.id,
          }));
          setFriends(list);
        }
      } catch (err) {
        console.error('Failed to refresh friends after unblock:', err);
      }
    } catch (err: any) {
      console.error('Unblock user error:', err);
      navigation.showNotification('Failed to unblock user. Please try again.');
    }
  };

  const handleReportUserClick = () => {
    if (!selectedOtherUserId) return;
    const reason = reportReason.trim();
    if (reason.length < 10) {
      setReportError('Please enter at least 10 characters.');
      navigation.showNotification('Please enter a valid reason (at least 10 characters).');
      return;
    }
    setReportError('');
    setReportConfirmOpen(true);
  };

  const handleReportUser = async () => {
    if (!selectedOtherUserId) return;
    setReportConfirmOpen(false);
    const reason = reportReason.trim();
    try {
      const resp = await supportApi.reportUser(selectedOtherUserId, reason);
      if (!resp.success) {
        navigation.showNotification(resp.message || 'Failed to submit report');
        return;
      }
      // Close modal and show success notification
      navigation.showNotification('Report submitted successfully');
      setReportModalOpen(false);
      setMenuOpen(false);
      setReportReason('');
    } catch (err: any) {
      console.error('Report user error:', err);
      navigation.showNotification('Failed to submit report. Please try again.');
    }
  };
  const openProfile = async (userId?: string | null) => {
    if (!userId) return;
    const friend = friendsById.get(userId);
    const profileId = friend?.profileId || userId;

    try {
      const resp = await authApi.getPublicProfile(profileId);
      if (!resp.success) {
        navigation.showNotification(resp.message || 'Failed to load profile');
        return;
      }
      sessionStorage.setItem('selectedProfileId', profileId);
      sessionStorage.setItem('selectedUserId', userId);
      navigation.navigateTo(Page.ViewProfile);
    } catch (err) {
      navigation.showNotification('Failed to load profile. Please try again.');
    }
  };

  // Always keep view pinned to the latest messages when a conversation is opened or receives new messages.
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [messages, selectedOtherUserId]);

  const handleDeleteMessage = async (forEveryone: boolean) => {
    if (!messageContextMenu || !selectedConversationId) return;
    const { messageId } = messageContextMenu;

    try {
      if (forEveryone) {
        if (window.confirm("Delete this message for everyone?")) {
          await deleteMessageForEveryone(selectedConversationId, messageId, meId);
        }
      } else {
        await deleteMessageForMe(selectedConversationId, messageId, meId);
      }
      setMessageContextMenu(null);
    } catch (error) {
      console.error("Delete message error", error);
      navigation.showNotification("Failed to delete message");
    }
  };


  return (
    <div className="bg-brand-light-blue min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-brand-teal">Messages</h1>
          <div>
            <button
              onClick={() => setCreateGroupOpen(true)}
              title="Create group"
              className="ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-teal text-white hover:bg-brand-teal-dark"
            >
              +
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">

            {/* Sidebar - Chat List */}
            <div
              className={`w-full sm:w-80 flex flex-col relative overflow-hidden h-full
      ${selectedOtherUserId && 'hidden sm:flex'}
      rounded-l-2xl shadow-2xl shadow-cyan-100/50`}
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-teal to-cyan-500" />

              {/* Sidebar content wrapper */}
              <div className="relative z-10 flex flex-col h-full">

                {/* Header / Search */}
                <div className="shrink-0 p-4 border-b border-white/20">


                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/90 backdrop-blur rounded-full py-2 pl-10 pr-4 text-sm
                         focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setChatTab('dm')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition
              ${chatTab === 'dm'
                          ? 'bg-white text-brand-teal'
                          : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      Direct
                    </button>

                    <button
                      onClick={() => setChatTab('groups')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition
              ${chatTab === 'groups'
                          ? 'bg-white text-brand-teal'
                          : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      Groups
                    </button>
                  </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
                  {filteredChats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedOtherUserId(chat.otherUserId)}
                      className={`p-3 rounded-xl cursor-pointer transition-all
                bg-white/95 backdrop-blur
                hover:shadow-lg hover:-translate-y-[1px]
                ${selectedOtherUserId === chat.otherUserId ? 'ring-2 ring-brand-teal' : ''}`}
                    >
                      <div className="flex gap-3 items-center">
                        <img
                          src={chat.avatar || "/placeholder.svg"}
                          alt={chat.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 truncate">
                              {chat.name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {chat.time}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessage}
                            </p>
                            {chat.unread > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-brand-teal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                  {chat.unread > 99 ? '99+' : chat.unread}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Main Chat Area */}
            {selectedOtherUserId ? (
              <div className={`flex-grow flex flex-col ${!selectedOtherUserId && 'hidden sm:flex'}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedOtherUserId(null)}
                      className="sm:hidden text-brand-teal font-bold text-xl"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => {
                        // Don't navigate to profile for groups
                        if (!selectedOtherUserId?.startsWith('group:')) {
                          openProfile(selectedChatData?.otherUserId);
                        }
                      }}
                      className="flex items-center gap-3 text-left"
                    >
                      <img
                        src={selectedChatData?.avatar || '/asset/p1.jfif'}
                        alt={selectedChatData?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-grow">
                        <h2 className="font-semibold text-gray-800">{selectedChatData?.name || 'Chat'}</h2>
                        {selectedOtherUserId?.startsWith('group:') && (
                          <p className="text-xs text-gray-500">Group • {(convDocs.find(c => c.id === selectedOtherUserId.split(':')[1])?.participants || []).length} members</p>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Chat options"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                        {selectedOtherUserId && selectedOtherUserId.startsWith('group:') ? (
                          <>
                            <button
                              onClick={() => { setGroupSettingsOpen(true); setMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Group Settings
                            </button>
                            {convDocs.find(c => c.id === selectedOtherUserId.split(':')[1])?.group?.owner === meId ? (
                              <button
                                onClick={() => {
                                  if (!selectedOtherUserId) return;
                                  const id = selectedOtherUserId.split(':')[1];
                                  setGroupToDeleteId(id);
                                  setGroupDeleteConfirmOpen(true);
                                  setMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                              >
                                Delete Group
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (!selectedOtherUserId) return;
                                  const id = selectedOtherUserId.split(':')[1];
                                  try {
                                    setGroupActionLoading(true);
                                    const resp = await groupApi.leaveGroup(id);
                                    if (resp && resp.success) {
                                      navigation.showNotification('You left the group');
                                      setSelectedOtherUserId(null);
                                    } else {
                                      navigation.showNotification(resp.message || 'Failed to leave group');
                                    }
                                  } catch (e) {
                                    console.error('Leave group error', e);
                                    navigation.showNotification('Failed to leave group');
                                  } finally { setGroupActionLoading(false); }
                                  setMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                              >
                                Leave Group
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (canReportUser) {
                                  setReportModalOpen(true);
                                }
                                setMenuOpen(false);
                              }}
                              disabled={!canReportUser}
                              title={!canReportUser ? `Report available in ${reportCooldownDays} day(s)` : ''}
                              className={`w-full text-left px-4 py-2 ${!canReportUser ? 'opacity-50 cursor-not-allowed hover:bg-gray-50' : 'hover:bg-gray-100'}`}
                            >
                              Report User {!canReportUser && reportCooldownDays > 0 && `(${reportCooldownDays}d)`}
                            </button>
                            <button
                              onClick={handleBlockUserClick}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                            >
                              Block User
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
                  {messages.map(message => {
                    // Skip if message is deleted for everyone
                    if (message.deletedForEveryone) return null;
                    // Skip if message is deleted for current user
                    if (message.deletedFor?.includes(meId)) return null;

                    const isGroup = selectedOtherUserId?.startsWith('group:');
                    const findFriendByIdOrProfile = (id: string) => friends.find((ff) => ff.id === id || ff.profileId === id) || undefined;
                    let senderInfo = null as (typeof friends[0]) | undefined | null;
                    if (isGroup && message.senderId !== meId) {
                      senderInfo = friendsById.get(message.senderId) || findFriendByIdOrProfile(message.senderId);
                    }
                    const senderAvatar = senderInfo?.avatar || DEFAULT_GROUP_AVATAR;
                    const senderName = senderInfo?.name || (message.senderId === meId ? 'You' : `User`);
                    const isDeleted = message.deletedForEveryone || (message.deletedFor?.includes(meId));

                    const mSenderId = String(message.senderId || '').trim();
                    const currentMeId = String(meId || '').trim();
                    const isMe = mSenderId === currentMeId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {/* avatar for incoming messages */}
                          {!isMe && (
                            <div className="flex flex-col items-center">
                              <img
                                src={isGroup ? senderAvatar : selectedChatData?.avatar}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover shadow-sm"
                              />
                            </div>
                          )}
                          <div className="flex flex-col gap-1 relative">
                            {/* Show sender name in groups for incoming messages */}
                            {isGroup && message.senderId !== meId && (
                              <span className="text-xs text-gray-600 ml-2">{senderName}</span>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl shadow-md max-w-xs lg:max-w-md break-words relative group/message ${isMe
                                ? 'bg-brand-teal text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none'
                                } ${isDeleted ? 'opacity-60' : ''}`}
                            >
                              <p className="text-sm leading-relaxed pr-6">{isDeleted ? '[Message deleted]' : message.text}</p>

                              {/* Message context menu button (visible on hover) */}
                              {!isDeleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setMessageContextMenu({
                                      messageId: message.id,
                                      x: rect.left,
                                      y: rect.bottom,
                                    });
                                  }}
                                  className={`absolute top-1 right-1 hidden group-hover/message:block p-1 rounded-full hover:bg-black/10 transition-colors ${isMe ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                  title="Message options"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}

                              <div className="flex items-center justify-end gap-2 mt-1">
                                <p className={`text-xs ${message.senderId === meId ? 'text-gray-200' : 'text-gray-500'}`}>{message.time}</p>
                                {message.senderId === meId && !isDeleted && (
                                  <span className="text-xs">
                                    {(() => {
                                      const readBy = message.readBy || [];
                                      const otherUserId = selectedOtherUserId;
                                      const isRead = otherUserId && readBy.includes(otherUserId);
                                      return isRead ? '✓✓' : '✓';
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {selectedConversationId && (
                    (() => {
                      const typingUsers = typingByConversationId.get(selectedConversationId) || [];
                      if (typingUsers.length === 0) return null;

                      const typingNames = typingUsers.map(t => t.userName || 'Someone').join(', ');
                      return (
                        <div className="flex items-end gap-2 mb-2">
                          <img
                            src={selectedChatData?.avatar || DEFAULT_GROUP_AVATAR}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover shadow-sm"
                          />
                          <div className="px-4 py-2 rounded-2xl shadow-md bg-gray-100 text-gray-700">
                            <p className="text-xs italic">{typingNames} {typingUsers.length === 1 ? 'is' : 'are'} typing...</p>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>



                {/* Message Input */}
                {blockedByMe ? (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="text-sm text-gray-600 mb-3">
                      You blocked this user. You can no longer send messages to them.
                    </div>
                    <button
                      onClick={handleUnblockUser}
                      className="px-4 py-2 bg-brand-teal text-white rounded-lg font-semibold hover:bg-brand-teal-dark transition-colors"
                    >
                      Unblock User
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3 items-center relative">
                      <div className="relative">
                        <button type="button" onClick={() => setEmojiOpen((v) => !v)} className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200">
                          😀
                        </button>
                        {emojiOpen && (
                          <div className="absolute bottom-14 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-72">
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={emojiSearch}
                                onChange={(e) => setEmojiSearch(e.target.value)}
                                placeholder="Search emojis"
                                className="w-full px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-sm focus:outline-none"
                              />
                              {emojiRecents.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Recent</div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {emojiRecents.slice(0, 12).map((em) => (
                                      <button key={em} onClick={(ev) => { ev.preventDefault(); addEmoji(em); }} className="p-1 text-lg hover:bg-gray-100 rounded">{em}</button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-auto">
                                {(
                                  [
                                    '😀', '😃', '😄', '😁', '😆', '😂', '🙂', '😉', '😊', '😇', '😍', '😘', '😗', '😙', '😚', '😋',
                                    '😜', '😝', '😛', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕',
                                    '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
                                    '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
                                    '😴', '😪', '😵', '🤐', '🤠', '🤡', '🤥', '🤝', '🙏', '👍', '👎', '👌', '✌️', '👏', '💪', '🔥'
                                  ]
                                ).filter((em) => (emojiSearch.trim() === '' ? true : em.includes(emojiSearch))).map((em) => (
                                  <button key={em} onClick={(ev) => { ev.preventDefault(); addEmoji(em); }} className="p-1 text-lg hover:bg-gray-100 rounded">{em}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          const val = e.target.value;

                          // Typing indicator logic
                          if (selectedConversationId && firebaseAuth.currentUser && val.trim().length > 0) {
                            const uid = firebaseAuth.currentUser.uid;
                            // Prefer myName from profile, then display name, then generic
                            const userName = myName || firebaseAuth.currentUser.displayName || 'User';
                            const now = Date.now();

                            // Throttle usage: update firestore every 1 second (was 2s) to keep it fresh
                            if (now - lastTypingSentRef.current > 1000) {
                              lastTypingSentRef.current = now;
                              setTypingIndicator(selectedConversationId, uid, userName).catch(err => console.error('Typing indicator error:', err));
                            }

                            // Clear timeout if exists
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                            }

                            // Set new timeout to remove indicator after 1.5s of inactivity (was 3s)
                            typingTimeoutRef.current = setTimeout(() => {
                              removeTypingIndicator(selectedConversationId, uid).catch(err => console.error('Remove typing error:', err));
                              typingTimeoutRef.current = null;
                            }, 1500);
                          }
                        }}
                        onBlur={() => {
                          if (selectedConversationId && firebaseAuth.currentUser && typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = null;
                            removeTypingIndicator(selectedConversationId, firebaseAuth.currentUser.uid).catch(console.error);
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-grow bg-gray-50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 border border-gray-100"
                      />

                      {/* attachments removed per user request */}

                      <button
                        type="submit"
                        className="bg-brand-teal text-white rounded-full px-5 py-2 font-semibold hover:bg-brand-teal-dark transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex flex-grow items-center justify-center bg-gray-50 relative overflow-hidden">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <StarIcon className="absolute top-10 left-12 w-8 h-8 text-yellow-400 opacity-50 animate-pulse" />
                  <StarIcon className="absolute top-1/3 right-16 w-6 h-6 text-sky-400 opacity-50 animate-pulse delay-300" />
                  <StarIcon className="absolute bottom-24 left-1/4 w-7 h-7 text-purple-400 opacity-50 animate-pulse delay-700" />
                  <StarIcon className="absolute bottom-10 right-1/3 w-5 h-5 text-pink-400 opacity-50 animate-pulse delay-1000" />

                  {/* Circles */}
                  <CircleIcon className="absolute top-20 right-10 w-12 h-12 text-coral-400 opacity-40 animate-pulse" />
                  <CircleIcon className="absolute bottom-16 left-10 w-10 h-10 text-emerald-400 opacity-40 animate-pulse delay-500" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Waiting for a conversation</h3>
                  <p className="text-gray-500">Select a conversation on the left or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Message Context Menu */}
      {
        messageContextMenu && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setMessageContextMenu(null)}
            />
            <div
              className="fixed bg-white shadow-lg rounded-lg border border-gray-100 z-[70] py-1 w-48"
              style={{
                top: Math.min(messageContextMenu.y, window.innerHeight - 150),
                left: Math.min(messageContextMenu.x, window.innerWidth - 200)
              }}
            >
              {(() => {
                const message = messages.find(m => m.id === messageContextMenu.messageId);
                const currentMeId = String(meId || '').trim();
                const msgSenderId = String(message?.senderId || '').trim();
                const isSentByMe = !!message && !!currentMeId && msgSenderId === currentMeId;
                const canDeleteForEveryone = isSentByMe && !message.deletedForEveryone;

                return (
                  <div className="py-2 min-w-max">
                    <button
                      onClick={() => {
                        setMessageContextMenu(null);
                        handleDeleteMessage(false);
                      }}
                      disabled={deletingMessageId === messageContextMenu.messageId}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                    >
                      Delete for me
                    </button>
                    {canDeleteForEveryone && (
                      <button
                        onClick={() => {
                          setMessageContextMenu(null);
                          handleDeleteMessage(true);
                        }}
                        disabled={deletingMessageId === messageContextMenu.messageId}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-red-600"
                      >
                        Delete for everyone
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )
      }

      {/* ... (Modals remain unchanged) ... */}


      {/* Report Modal */}
      {/* Create Group Modal */}
      {
        createGroupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="relative rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 overflow-hidden
                bg-gradient-to-br from-brand-teal to-cyan-600">

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Create Group</h3>
                <button onClick={() => setCreateGroupOpen(false)} className="text-white-500 hover:gray-100 transition">✕</button>
              </div>
              <input
                type="text"
                placeholder="Group name (optional)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-3"
              />

              <div className="max-h-56 overflow-auto border rounded p-2 mb-3 bg-white">
                {friends.length === 0 && <div className="text-sm text-gray-500">No friends available</div>}
                {friends.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 p-2 rounded
                  hover:bg-brand-teal/10 transition">
                    <input
                      type="checkbox"
                      checked={selectedGroupMemberIds.includes(f.id)}
                      onChange={(e) => {
                        setSelectedGroupMemberIds((prev) => {
                          if (e.target.checked) return [...prev, f.id];
                          return prev.filter((x) => x !== f.id);
                        });
                      }}
                    />
                    <img src={f.avatar || "/placeholder.svg"} alt={f.name} className="w-8 h-8 rounded-full" />
                    <div className="text-sm">{f.name}</div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setCreateGroupOpen(false)} className="px-4 py-2 rounded border bg-white hover:bg-gray-400 hover:shadow transition">Cancel</button>
                <button
                  onClick={async () => {
                    if (selectedGroupMemberIds.length === 0) {
                      navigation.showNotification('Select at least one friend');
                      return;
                    }
                    try {
                      setCreatingGroup(true);
                      const resp = await groupApi.createGroup({
                        name: groupName || undefined,
                        image: null,
                        memberIds: selectedGroupMemberIds
                      });
                      setCreatingGroup(false);
                      setCreateGroupOpen(false);
                      setSelectedGroupMemberIds([]);
                      setGroupName('');
                      if (resp?.success && resp?.data?.id) {
                        const gid = resp.data.id;
                        // Optimistically insert the new group into local conversations so creator sees it immediately
                        setConvDocs((prev) => {
                          // If already present, don't duplicate
                          if (prev.find((c) => c.id === gid)) return prev;
                          const now = Date.now();
                          const pseudoTs = { toMillis: () => now, toDate: () => new Date(now) } as any;
                          const conv: any = {
                            id: gid,
                            participants: [meId, ...selectedGroupMemberIds],
                            isGroup: true,
                            group: {
                              name: groupName || 'Group',
                              image: null,
                              owner: meId,
                              admins: [meId]
                            },
                            createdAt: pseudoTs,
                            updatedAt: pseudoTs,
                            lastMessageAt: pseudoTs,
                            lastReadAt: {},
                          };
                          return [conv, ...prev];
                        });
                        setSelectedOtherUserId(`group:${gid}`);
                      }
                    } catch (err) {
                      console.error('Create group failed', err);
                      navigation.showNotification('Failed to create group');
                      setCreatingGroup(false);
                    }
                  }}
                  className="px-4 py-2 rounded bg-brand-teal text-black bg-white hover:bg-gray-400 hover:shadow transition"
                  disabled={creatingGroup}
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Group Settings Modal */}
      {
        groupSettingsOpen && selectedOtherUserId && selectedOtherUserId.startsWith('group:') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 border-l-4 border-brand-teal">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Group Settings</h3>
                <button onClick={() => setGroupSettingsOpen(false)} className="text-gray-500">✕</button>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Group name</label>
                <input
                  type="text"
                  value={groupName || (convDocs.find(c => c.id === (selectedOtherUserId.split(':')[1]))?.group?.name) || ''}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>

              <div className="mb-3">
                <div className="text-sm font-semibold mb-1">Members</div>
                <div className="max-h-40 overflow-auto border rounded p-2">
                  {(groupMembers.length === 0) && <div className="text-sm text-gray-500">No members</div>}
                  {groupMembers.map(m => {
                    const conv = convDocs.find(c => c.id === (selectedOtherUserId?.split(':')[1]));
                    const isOwner = conv?.group?.owner === m.id;
                    const isAdmin = (conv?.group?.admins || []).includes(m.id);
                    const canManage = currentGroupRole?.isAdmin || currentGroupRole?.isOwner;

                    return (
                      <div key={m.id} className="flex items-center justify-between gap-2 p-2">
                        <div className="flex items-center gap-2">
                          <img src={m.avatar || '/asset/p1.jfif'} className="w-8 h-8 rounded-full object-cover" />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className="text-sm">{m.name || 'Hunar Bazaar Member'}</div>
                              {isOwner && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">👑 Owner</span>}
                              {!isOwner && isAdmin && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">⭐ Admin</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* Only show admin controls if current user is admin */}
                          {canManage && (
                            <>
                              {/* Make/Remove Admin button */}
                              {!isOwner && m.id !== meId && (
                                <button
                                  onClick={async () => {
                                    const gid = selectedOtherUserId?.split(':')[1];
                                    if (!gid) return;
                                    try {
                                      setGroupActionLoading(true);
                                      const resp = await groupApi.assignAdmin(gid, m.id, !isAdmin);
                                      if (resp && resp.success) {
                                        navigation.showNotification(isAdmin ? 'Admin removed' : 'Admin assigned');
                                        // Refresh group members
                                        setGroupSettingsOpen(false);
                                        setTimeout(() => setGroupSettingsOpen(true), 100);
                                      } else {
                                        navigation.showNotification(resp.message || 'Failed to update admin');
                                      }
                                    } catch (e) {
                                      console.error('assign admin', e);
                                      navigation.showNotification('Failed to update admin');
                                    } finally { setGroupActionLoading(false); }
                                  }}
                                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                                >
                                  {isAdmin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                              )}
                              {/* Remove button - don't show for owner */}
                              {!isOwner && m.id !== meId && (
                                <button
                                  onClick={async () => {
                                    const gid = selectedOtherUserId?.split(':')[1];
                                    if (!gid) return;
                                    try {
                                      setGroupActionLoading(true);
                                      const resp = await groupApi.removeMember(gid, m.id);
                                      if (resp && resp.success) {
                                        setGroupMembers((prev) => prev.filter(x => x.id !== m.id));
                                        navigation.showNotification('Member removed');
                                      } else {
                                        navigation.showNotification(resp.message || 'Failed to remove member');
                                      }
                                    } catch (e) {
                                      console.error('remove member', e);
                                      navigation.showNotification('Failed to remove member');
                                    } finally { setGroupActionLoading(false); }
                                  }}
                                  className="text-sm text-red-600 px-3 py-1 rounded border"
                                >Remove</button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Only show Add Member section for admins */}
              {(currentGroupRole?.isAdmin || currentGroupRole?.isOwner) && (
                <div className="mb-3">
                  <div className="text-sm font-semibold mb-1">Add member</div>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-auto">
                    {friends.filter(f => !groupMembers.some(m => m.id === f.id)).map(f => (
                      <button key={f.id} onClick={async () => {
                        const gid = selectedOtherUserId?.split(':')[1];
                        try {
                          setGroupActionLoading(true);
                          const resp = await groupApi.addMember(gid, f.id);
                          if (resp && resp.success) {
                            setGroupMembers((prev) => [...prev, { id: f.id, name: f.name, avatar: f.avatar }]);
                            navigation.showNotification('Member added');
                          } else {
                            navigation.showNotification(resp.message || 'Failed to add member');
                          }
                        } catch (e) {
                          console.error('add member', e);
                          navigation.showNotification('Failed to add member');
                        } finally { setGroupActionLoading(false); }
                      }} className="p-2 border rounded text-sm text-left">+ {f.name}</button>
                    ))}
                    {friends.filter(f => !groupMembers.some(m => m.id === f.id)).length === 0 && <div className="text-sm text-gray-500">No available friends</div>}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setGroupSettingsOpen(false)} className="px-4 py-2 rounded border">Close</button>
                <button onClick={async () => {
                  const gid = selectedOtherUserId.split(':')[1];
                  try {
                    setGroupActionLoading(true);
                    const resp = await groupApi.renameGroup(gid, { name: groupName });
                    if (resp && resp.success) {
                      navigation.showNotification('Group updated');
                      setGroupSettingsOpen(false);
                    } else {
                      navigation.showNotification(resp.message || 'Failed to update');
                    }
                  } catch (e) {
                    console.error('rename group', e);
                    navigation.showNotification('Failed to update group');
                  } finally { setGroupActionLoading(false); }
                }} className="px-4 py-2 rounded bg-brand-teal text-white">Save</button>
              </div>
            </div>
          </div>
        )
      }
      {
        reportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border-l-4 border-brand-teal">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Report user</h3>
              <p className="text-sm text-gray-600 mb-4">Tell us what happened. Our team will review it.</p>
              <textarea
                value={reportReason}
                onChange={(e) => {
                  setReportReason(e.target.value);
                  if (reportError && e.target.value.trim().length >= 10) {
                    setReportError('');
                  }
                }}
                placeholder="Reason (required)"
                className="w-full min-h-[120px] bg-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              />
              {reportError && <p className="text-sm text-red-600 mt-2">{reportError}</p>}
              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportReason('');
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportUser}
                  className="px-4 py-2 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-teal-dark"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )
      }
      <ConfirmModal
        open={blockConfirmOpen}
        title="Block User"
        message={`Are you sure you want to block ${blockUserName}? You won't be able to message or see their profile.`}
        confirmLabel="Block"
        cancelLabel="Cancel"
        onConfirm={handleBlockUser}
        onCancel={() => setBlockConfirmOpen(false)}
      />
      <ConfirmModal
        open={reportConfirmOpen}
        title="Submit Report"
        message="Are you sure you want to submit this report? Our team will review it and take appropriate action."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={handleReportUser}
        onCancel={() => setReportConfirmOpen(false)}
      />
      <ConfirmModal
        open={groupDeleteConfirmOpen}
        title="Delete Group"
        message="Are you sure you want to permanently delete this group? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!groupToDeleteId) return;
          try {
            setGroupActionLoading(true);
            const resp = await groupApi.deleteGroup(groupToDeleteId);
            if (resp && resp.success) {
              navigation.showNotification('Group deleted successfully');
              setSelectedOtherUserId(null);
            } else {
              navigation.showNotification(resp.message || 'Failed to delete group');
            }
          } catch (e) {
            console.error('Delete group error', e);
            navigation.showNotification('Failed to delete group');
          } finally {
            setGroupActionLoading(false);
            setGroupDeleteConfirmOpen(false);
            setGroupToDeleteId(null);
          }
        }}
        onCancel={() => {
          setGroupDeleteConfirmOpen(false);
          setGroupToDeleteId(null);
        }}
      />
    </div >
  );
};

export default MessengerPage;
