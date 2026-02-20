import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { firebaseAuth } from '../utils/firebase';
import { listenToMyConversations } from '../utils/chatService';
import type { ConversationDoc } from '../utils/chatService';
import type { Timestamp } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  time: string;
  createdAt?: Timestamp;
  readBy?: string[];
}

interface UnreadMessagesContextType {
  totalUnreadCount: number;
  setTotalUnreadCount: (count: number) => void;
  messagesByConversationId: Map<string, Message[]>;
  setMessagesByConversationId: (updater: (prev: Map<string, Message[]>) => Map<string, Message[]>) => void;
  isListenerActive: boolean;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const UnreadMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [messagesByConversationId, setMessagesByConversationId] = useState<Map<string, Message[]>>(new Map());
  const [isListenerActive, setIsListenerActive] = useState(false);
  // Store conversations to avoid stale closures
  const [conversations, setConversations] = useState<Array<{ id: string } & ConversationDoc>>([]);

  useEffect(() => {
    let unsubscribeConversations: (() => void) | null = null;

    const unsubscribeAuth = firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        setTotalUnreadCount(0);
        return;
      }

      const uid = user.uid;
      setIsListenerActive(true);

      unsubscribeConversations = listenToMyConversations(uid, (convs) => {
        let totalUnread = 0;

        convs.forEach((conv) => {
          const count = conv.unreadCounts?.[uid] || 0;
          totalUnread += count;
        });

        setTotalUnreadCount(totalUnread);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConversations?.();
      setIsListenerActive(false);
    };
  }, []);

  const updateMessagesByConversationId = useCallback(
    (updater: (prev: Map<string, Message[]>) => Map<string, Message[]>) => {
      setMessagesByConversationId((prev) => {
        const next = updater(prev);
        return next;
      });
    },
    []
  );

  const value: UnreadMessagesContextType = {
    totalUnreadCount,
    setTotalUnreadCount,
    messagesByConversationId,
    setMessagesByConversationId: updateMessagesByConversationId,
    isListenerActive,
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = (): UnreadMessagesContextType => {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};
