import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { SubscriptionsPage } from './pages/Subscriptions';
import SupportPage from './pages/Support';
import { LogsPage } from './pages/Logs';
import { SubscriptionPlan, AppNotification } from './types';
import { Notification } from './components/Notification';

type View = 
  | 'login'
  | 'dashboard'
  | 'users'
  | 'subscriptions'
  | 'support'
  | 'logs';

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

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: 'New Dispute Raised', message: 'User Zainab Ali raised a dispute against Provider #55.', type: 'Dispute', time: '10 min ago', isRead: false },
  { id: '2', title: 'Support Query', message: 'Usman Electric requested an account restriction appeal.', type: 'Query', time: '1 hour ago', isRead: false },
  { id: '3', title: 'Subscription Update', message: 'Payment gateway maintenance scheduled for tonight.', type: 'System', time: '3 hours ago', isRead: false },
  { id: '4', title: 'Dispute Resolved', message: 'The dispute between Ali and Provider #22 has been closed.', type: 'Dispute', time: '1 day ago', isRead: true },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [notification, setNotification] = useState<{message: string} | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

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

  // Initial Load - Check URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('page') as View;
    if (view && isAuthenticated) {
      setCurrentView(view);
    }
  }, [isAuthenticated]);

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
    setIsAuthenticated(false);
    updateView('login');
    setNotification({ message: 'Logout Successfully' });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
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
      case 'support': return <SupportPage />;
      case 'logs': return <LogsPage />;
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
