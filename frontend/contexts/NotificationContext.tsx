import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { firebaseAuth } from '../utils/firebase';
import { notificationApi } from '../utils/api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string; // e.g., 'support_issue_resolved', 'feedback_received'
  time: string; // Formatted date/time string
  isRead: boolean;
  entityId?: string; // Optional: ID of the related entity (e.g., SupportIssue._id)
}

interface NotificationContextType {
  notifications: AppNotification[];
  totalUnreadCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setTotalUnreadCount(0);
      return;
    }
    try {
      const resp = await notificationApi.getNotifications();
      if (resp.success && Array.isArray(resp.data)) {
        const fetchedNotifications: AppNotification[] = resp.data.map((n: any) => ({
          id: n._id,
          title: n.title || (
            n.type === 'friend_request' ? 'Friend Request' :
              n.type === 'session_request_new' ? 'Session Request' :
                n.type === 'session_request_accepted' ? 'Session Accepted' :
                  n.type === 'group_chat_new_message' ? 'New Message' :
                    'Notification'
          ),
          message: n.message,
          type: n.type,
          time: new Date(n.createdAt).toLocaleString(),
          isRead: n.isRead,
          entityId: n.entityId,
        }));
        setNotifications(fetchedNotifications);
        setTotalUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 5 seconds
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        fetchNotifications();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, isAuthenticated]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setTotalUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setTotalUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => {
        const newNotifications = prev.filter(n => n.id !== id);
        setTotalUnreadCount(newNotifications.filter(n => !n.isRead).length);
        return newNotifications;
      });
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    totalUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
