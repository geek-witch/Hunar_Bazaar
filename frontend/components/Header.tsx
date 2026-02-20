"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Page, Navigation } from '../App';
import { NotificationIcon, UserIcon, MessengerIcon } from './icons/AccountIcons';
import { authApi } from '../utils/api';
import { HamburgerIcon, CloseIcon } from './icons/MenuIcons';
import { SearchIcon } from './icons/MiscIcons';
import SearchSkillsModal from './SearchSkillsModal';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';
import { useNotifications } from '../contexts/NotificationContext';

interface HeaderProps {
  isAuthenticated: boolean;
  navigation: Navigation;
  currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, navigation, currentPage }) => {
  const { navigateTo, logout } = navigation;
  const { totalUnreadCount: totalMessengerUnreadCount } = useUnreadMessages();
  const { totalUnreadCount: totalGeneralNotificationCount } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (totalMessengerUnreadCount !== unreadCount) {
      setUnreadCount(totalMessengerUnreadCount);
    }
    if (totalMessengerUnreadCount > 0) {
      localStorage.setItem('unreadMessageCount', totalMessengerUnreadCount.toString());
    }
  }, [totalMessengerUnreadCount, totalGeneralNotificationCount]);

  // If context hasn't populated yet, check localStorage as fallback  
  // This runs once on component mount
  useEffect(() => {
    // Only load from localStorage on initial mount if context count is 0
    if (unreadCount === 0 && totalMessengerUnreadCount === 0) {
      const stored = parseInt(localStorage.getItem('unreadMessageCount') || '0', 10);
      if (stored > 0) {
        console.log('Header: Loading unread count from localStorage:', stored);
        setUnreadCount(stored);
      }
    }
  }, []);

  // Load current user's profile picture for header avatar
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isAuthenticated) return;
      try {
        const resp = await authApi.getProfile();
        if (!mounted) return;
        if (resp.success && resp.data) {
          const pic = (resp.data as any).profilePicUrl || null;
          setProfilePic(pic);
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // Listen for custom events and storage changes
  useEffect(() => {
    // Listen for custom event (same tab updates from MessengerPage)
    const handleUnreadUpdate = (event: CustomEvent) => {
      const newCount = event.detail || 0;
      setUnreadCount(newCount);
      if (newCount > 0) {
        localStorage.setItem('unreadMessageCount', newCount.toString());
      }
    };

    // Listen for storage events (other tabs/windows updates)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'unreadMessageCount' && event.newValue !== null) {
        const newCount = parseInt(event.newValue, 10);
        setUnreadCount(newCount);
      }
    };

    window.addEventListener('unreadMessages:changed', handleUnreadUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('unreadMessages:changed', handleUnreadUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile search if we navigate away from home
  useEffect(() => {
    if (currentPage !== Page.Home) setIsMobileSearchOpen(false);
  }, [currentPage]);

  const handleNavigate = (page: Page) => {
    navigateTo(page);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  // --- ACTIVE STATE LOGIC ---
  const isHomeActive = currentPage === Page.Landing || currentPage === Page.Home;
  const isAboutActive = currentPage === Page.AboutUs;
  const isContactActive = currentPage === Page.Contact;
  const isLoginActive = currentPage === Page.Login;

  // Helper function for Desktop Link Classes
  const getDesktopLinkClass = (isActive: boolean) =>
    `hover:text-white transition-colors ${isActive ? 'text-white font-bold border-b-2 border-white pb-1' : 'text-gray-200'}`;

  // Helper function for Mobile Link Classes
  const getMobileLinkClass = (isActive: boolean) =>
    `block px-4 py-2 text-sm hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-bold text-brand-teal' : 'text-gray-700'}`;

  return (
    <>
      <header ref={headerRef} className="bg-brand-teal sticky top-0 z-50 shadow-md relative">
        <nav className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div
            className={`flex items-center space-x-2 cursor-pointer ${isMobileSearchOpen && currentPage === Page.Home ? 'hidden lg:flex' : 'flex'}`}
            onClick={() => handleNavigate(isAuthenticated ? Page.Home : Page.Landing)}
          >
            <img src="/asset/logo.png" alt="Hunar Bazaar Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-white">HunarBazaar</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-6">
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(isAuthenticated ? Page.Home : Page.Landing); }}
              className={getDesktopLinkClass(isHomeActive)}>Home</a>

            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.AboutUs); }}
              className={getDesktopLinkClass(isAboutActive)}>About Us</a>

            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Contact); }}
              className={getDesktopLinkClass(isContactActive)}>Contact</a>

            {/* Desktop Search - Integrated into Navbar */}
            {currentPage === Page.Home && (
              <div className="relative group" ref={searchContainerRef}>
                <input
                  type="text"
                  placeholder="Search skills & tutors..."
                  value={desktopSearchQuery}
                  onChange={(e) => { setDesktopSearchQuery(e.target.value); setIsSearchModalOpen(true); }}
                  onClick={() => setIsSearchModalOpen(true)}
                  className="bg-white/20 text-white placeholder-gray-300 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
                <SearchIcon className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                <SearchSkillsModal
                  isOpen={isSearchModalOpen}
                  onClose={() => setIsSearchModalOpen(false)}
                  navigation={navigation}
                  query={desktopSearchQuery}
                />
              </div>
            )}

            <div className="w-px h-6 bg-white/20"></div>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => handleNavigate(Page.Notifications)} className="text-gray-200 hover:text-white relative">
                  <NotificationIcon className="w-6 h-6" />
                  {totalGeneralNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-brand-teal">
                      {totalGeneralNotificationCount > 99 ? '99+' : totalGeneralNotificationCount}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => handleNavigate(Page.Messenger)} className="text-gray-200 hover:text-white relative">
                  <MessengerIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-brand-teal">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <button type="button" onClick={() => handleNavigate(Page.MyAccount)} className="text-gray-200 hover:text-white relative">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-white" onError={(e) => { (e.target as HTMLImageElement).src = '/asset/p4.jpg'; }} />
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                </button>
                <button onClick={handleLogout} className="bg-white text-brand-teal font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo(Page.Login); }}
                  className={`font-medium transition-colors ${isLoginActive ? 'text-white font-bold' : 'text-gray-200 hover:text-white'}`}>Login</a>
                <button onClick={() => navigateTo(Page.Signup1)} className="bg-white text-brand-teal font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Nav Button Logic stays same... */}
          <div className={`lg:hidden flex items-center ${isMobileSearchOpen && currentPage === Page.Home ? 'w-full' : ''}`}>
            {/* ... (rest of mobile search icon logic) */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none" aria-label="Toggle menu">
              {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <div className={`lg:hidden absolute top-full right-4 mt-2 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 transition-transform transform ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(isAuthenticated ? Page.Home : Page.Landing); }}
            className={getMobileLinkClass(isHomeActive)}>Home</a>

          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.AboutUs); }}
            className={getMobileLinkClass(isAboutActive)}>About Us</a>

          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Contact); }}
            className={getMobileLinkClass(isContactActive)}>Contact</a>

          <div className="border-t border-gray-100 my-1"></div>
          {/* ... (rest of auth menu) */}
          {isAuthenticated ? (
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
          ) : (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Login); }} className={getMobileLinkClass(isLoginActive)}>Login</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Signup1); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Up</a>
            </>
          )}
        </div>
      </header >

    </>
  );
};

export default Header;