import React, { useState } from 'react';
import { Navigation, Page } from '../App';
import { CheckCircleIcon } from '../components/icons/MiscIcons';
import { useNotifications, AppNotification } from '../contexts/NotificationContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: string;
}

const NotificationsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const { notifications, totalUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, refreshNotifications } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Using functions from context directly

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_issue_new':
        return '⚠️';
      case 'user_report_new':
        return '🚨';
      case 'support_issue_resolved':
        return '✅';
      case 'user_report_resolved':
        return '✔️';
      case 'admin_comment':
        return '💬';
      case 'feedback_received':
        return '🌟';
      case 'feedback_pending':
        return '📝';
      case 'session_request_new':
        return '🗓️';
      case 'session_request_accepted':
        return '👍';
      case 'session_request_declined':
        return '👎';
      case 'session_cancelled':
        return '❌';
      case 'group_invite_new':
        return '👥';
      case 'group_chat_new_message':
        return '💬';
      case 'plan_updated':
        return '🚀';
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                ? 'bg-brand-teal text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                ? 'bg-brand-teal text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
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
                onClick={() => {
                  if (notif.type === 'friend_request') {
                    if (notif.title === 'Request Accepted' || notif.message.includes('accepted')) {
                      navigation.setCurrentPage('MyAccount', { tab: 'Manage Requests' });
                    } else {
                      navigation.setCurrentPage('MyAccount', { tab: 'Manage Requests' });
                    }
                  } else if (notif.type === 'group_chat_new_message') {
                    navigation.navigateTo(Page.Messenger);
                  } else if (notif.type === 'session_request_new' || notif.type === 'session_request_scheduled') {
                    navigation.setCurrentPage('MyAccount', { tab: 'Schedule Classes' });
                  } else if (notif.type === 'session_request_accepted' || notif.type === 'session_request_declined') {
                    navigation.setCurrentPage('MyAccount', { tab: 'Schedule Classes' });
                  } else if (notif.type === 'session_cancelled' || notif.type === 'feedback_pending' || notif.type === 'feedback_received') {
                    navigation.setCurrentPage('MyAccount', { tab: 'Watch Activity' });
                  } else if (notif.type === 'friend_request' || notif.type === 'friend_request_accepted') {
                    navigation.setCurrentPage('MyAccount', { tab: 'Manage Requests' });
                  } else if (notif.type.startsWith('support_') || notif.type.startsWith('user_report_') || notif.type === 'admin_comment') {
                    navigation.setCurrentPage('MyAccount', { tab: 'Help Center' });
                  } else if (notif.type === 'group_invite_new') {
                    navigation.navigateTo(Page.Messenger);
                  } else if (notif.type === 'plan_updated') {
                    sessionStorage.setItem('scrollTo', 'pricing');
                    navigation.navigateTo(Page.Home);
                  }

                  // Also mark as read
                  if (!notif.isRead) {
                    markNotificationAsRead(notif.id);
                  }
                }}
                className={`bg-white rounded-xl shadow-sm p-4 transition-all hover:shadow-md cursor-pointer ${!notif.isRead ? 'border-l-4 border-brand-teal' : ''
                  }`}
              >
                <div className="flex gap-4">
                  {/* Avatar or Icon */}
                  <div className="shrink-0">
                    {(notif as any).avatar ? (
                      <img
                        src={(notif as any).avatar}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(notif.id);
                        }}
                        className="text-brand-teal hover:text-brand-teal-dark text-xs font-medium"
                        title="Mark as read"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-xs"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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