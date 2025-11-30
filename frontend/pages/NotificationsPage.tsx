import React, { useState } from 'react';
import { Navigation } from '../App';
import { CheckCircleIcon } from '../components/icons/MiscIcons';

interface Notification {
  id: string;
  type: 'message' | 'skill_request' | 'profile_view' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: string;
}

const NotificationsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      title: 'New message from Ayesha Rana',
      message: 'Hi! I would love to learn React from you.',
      time: '2 minutes ago',
      isRead: false,
      avatar: '/asset/p1.jfif'
    },
    {
      id: '2',
      type: 'skill_request',
      title: 'Skill Exchange Request',
      message: 'Ali Khan wants to exchange Python skills with you.',
      time: '1 hour ago',
      isRead: false,
      avatar: '/asset/p2.png'
    },
    {
      id: '3',
      type: 'profile_view',
      title: 'Profile View',
      message: 'Jaweria Rehman has viewed your profile.',
      time: '3 hours ago',
      isRead: true,
      avatar: '/asset/p3.jpg'
    },
    {
      id: '4',
      type: 'system',
      title: 'Welcome to HunarBazaar!',
      message: 'Complete your profile to get better matches.',
      time: '1 day ago',
      isRead: true
    },
    {
      id: '5',
      type: 'message',
      title: 'New message from Issa Khan',
      message: 'Can we schedule a session for SQL?',
      time: '2 days ago',
      isRead: true,
      avatar: '/asset/p4.jpg'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'skill_request':
        return '🤝';
      case 'profile_view':
        return '👁️';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  return (
    <div className="bg-brand-light-blue min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-teal mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your activities</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-brand-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-brand-teal hover:text-brand-teal-dark font-medium text-sm flex items-center gap-1"
            >
              
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`bg-white rounded-xl shadow-sm p-4 transition-all hover:shadow-md ${
                  !notif.isRead ? 'border-l-4 border-brand-teal' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Avatar or Icon */}
                  <div className="shrink-0">
                    {notif.avatar ? (
                      <img
                        src={notif.avatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center text-2xl">
                        {getNotificationIcon(notif.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className={`font-semibold ${!notif.isRead ? 'text-brand-teal' : 'text-gray-800'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-brand-teal rounded-full shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{notif.message}</p>
                    <p className="text-gray-400 text-xs">{notif.time}</p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-brand-teal hover:text-brand-teal-dark text-xs font-medium"
                        title="Mark as read"
                      >
                        
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                      title="Delete"
                    >
                      
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;