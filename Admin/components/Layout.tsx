import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, MessageCircle, AlertCircle, FileText, Menu, Bell
} from 'lucide-react';
import { AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activePage, onNavigate, onLogout, notifications, onMarkAllRead 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'support', label: 'Support & Disputes', icon: MessageCircle },
    { id: 'user-reports', label: 'User Reports', icon: AlertCircle },
    { id: 'logs', label: 'System Logs', icon: FileText },
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsSidebarOpen(false);
  };

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className="h-screen bg-[#0E4B5B] flex flex-col overflow-hidden">
      
      {/* 1. Header */}
      <header className="flex-none h-20 bg-[#E6EEF9] border-b border-blue-200 shadow-sm z-30 flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-[#0E4B5B] p-2 -ml-2 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Menu size={28} />
          </button>
          
          {/* Logo Image */}
          <img 
            src="/assets/logo.png" 
            alt="Hunar Bazaar Logo" 
            className="h-10 w-auto object-contain"
          />
          <span className="text-2xl font-bold text-[#0E4B5B]">Hunar Bazaar</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Notification Bell */}
          <button 
            onClick={() => onNavigate('notifications')}
            className="relative p-2 text-[#0E4B5B] hover:bg-blue-200 rounded-full transition-colors"
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#E6EEF9]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Sidebar Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar Drawer */}
        <aside className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#E6EEF9] text-[#0E4B5B] flex flex-col shadow-2xl 
          transition-transform duration-300 ease-in-out border-r border-blue-200
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-base font-medium rounded-xl transition-all ${
                    isActive 
                      ? 'bg-[#0E4B5B] text-white shadow-lg' 
                      : 'text-[#0E4B5B] hover:bg-blue-200'
                  }`}
                >
                  <Icon size={22} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="h-20 flex-shrink-0 flex items-center justify-center px-6 border-t border-blue-200 bg-[#E6EEF9]">
            <button
              onClick={onLogout}
              className="w-full py-3 bg-[#0E4B5B] hover:bg-[#093540] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0E4B5B] w-full relative">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto min-h-full pb-16">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Footer */}
      <footer className="flex-none h-12 bg-[#E6EEF9] border-t border-blue-200 z-30 flex items-center justify-center text-xs font-medium text-[#0E4B5B] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <p>© 2025 Hunar Bazaar. All rights reserved.</p>
      </footer>
    </div>
  );
};
