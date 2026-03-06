import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { SubscriptionsPage } from './pages/Subscriptions';
import SupportPage from './pages/Support';
import Reports from './pages/Reports';
import UserReports from './pages/UserReports';
import { LogsPage } from './pages/Logs';
import NotificationsPage from './pages/NotificationsPage';
import { SubscriptionPlan, AppNotification } from './types';
import { Notification } from './components/Notification';
import { adminApi } from './utils/api';

type View =
  | 'login'
  | 'dashboard'
  | 'users'
  | 'subscriptions'
  | 'support'
  | 'reports'
  | 'user-reports'
  | 'logs'
  | 'notifications';

const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    currency: 'PKR',
    features: ['Skill exchange for free', 'Access the basic features', 'Basic profile customization and management'],
    type: 'Free'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 300,
    currency: 'PKR',
    features: ['Unlimited skill exchanges', 'Advanced profile analytics', 'AI support', 'Reminders Option'],
    type: 'Premium'
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 500,
    currency: 'PKR',
    features: ['Everything in Premium', 'Access for all Employees', 'Access to exclusive workshops', 'Customized AI features'],
    type: 'Professional'
  }
];


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      // Determine initial view from URL or default to dashboard
      const params = new URLSearchParams(window.location.search);
      const view = params.get('page') as View;
      setCurrentView(view || 'dashboard');
    }
  }, []);

  // Handle Browser Navigation (Back/Forward)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('page') as View;
        if (view && isAuthenticated) {
          setCurrentView(view);
        } else if (!isAuthenticated) {
          setCurrentView('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // Fetch notifications when authenticated
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;
      try {
        const resp = await adminApi.getNotifications();
        if (resp.success) {
          setNotifications(resp.data.map((n: any) => ({
            id: n._id,
            title: n.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Basic formatting
            message: n.message,
            type: n.type, // Keep original type for backend use
            time: new Date(n.createdAt).toLocaleString(),
            isRead: n.isRead,
          })).filter((n: any) => {
            // Filter out user-specific notifications for Admin portal
            const userTypes = ['friend_request', 'group_chat_new_message', 'session_request', 'feedback'];
            const adminTypes = ['dispute', 'query', 'system', 'support', 'report', 'admin'];
            // Check if type matches any admin type substring
            const lowerType = n.type.toLowerCase();

            // Allow if explicitly an admin type or doesn't start with known user prefixes if we want to be permissive
            // But user request is "admin shouldn't get notifications for user side things"
            // Using an allowlist approach based on Admin/pages/NotificationsPage.tsx icons + common admin tasks

            return adminTypes.some(t => lowerType.includes(t));
          }));
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, [isAuthenticated]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const resp = await adminApi.getSubscriptions();
        if (resp.success) {
          // Format plans from DB to match SubscriptionPlan interface
          const formattedPlans = resp.data.map((p: any) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            features: p.features,
            type: p.type
          }));
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };
    fetchPlans();
  }, []);

  const updateView = (view: View) => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    url.searchParams.set('page', view);
    window.history.pushState({ view }, '', url);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    updateView('dashboard');
    setNotification({ message: 'Login Successfully' });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
    updateView('login');
    setNotification({ message: 'Logout Successfully' });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const markAllNotificationsRead = async () => {
    try {
      await adminApi.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setNotification({ message: 'Failed to mark all as read.' });
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await adminApi.markNotificationAsRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      setNotification({ message: 'Failed to mark notification as read.' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await adminApi.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
      setNotification({ message: 'Failed to delete notification.' });
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        {notification && (
          <Notification
            message={notification.message}
            onClose={closeNotification}
          />
        )}

        <Login onLogin={handleLogin} />
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UsersPage plans={plans} />;
      case 'subscriptions': return <SubscriptionsPage plans={plans} onUpdatePlans={setPlans} />;
      case 'support': return <SupportPage onShowNotification={setNotification} />;
      case 'reports': return <Reports onShowNotification={setNotification} />;
      case 'user-reports': return <UserReports onShowNotification={setNotification} />;
      case 'logs': return <LogsPage />;
      case 'notifications': return (
        <NotificationsPage
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsRead}
          onDeleteNotification={deleteNotification}
        />
      );
      default: return <Dashboard />;
    }
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          onClose={closeNotification}
        />
      )}
      <Layout
        activePage={currentView}
        onNavigate={(page) => updateView(page as View)}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAllRead={markAllNotificationsRead}
      >
        {renderContent()}
      </Layout>
    </>
  );
};

export default App;
