"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Page, Navigation } from '../App';
import { NotificationIcon, UserIcon, MessengerIcon } from './icons/AccountIcons';
import { HamburgerIcon, CloseIcon } from './icons/MenuIcons';
import { SearchIcon } from './icons/MiscIcons';
import SearchSkillsModal from './SearchSkillsModal';

interface HeaderProps {
  isAuthenticated: boolean;
  navigation: Navigation;
  currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, navigation, currentPage }) => {
  const { navigateTo, logout } = navigation;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const headerRef = useRef<HTMLElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
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

  const isHomeActive = currentPage === Page.Landing || currentPage === Page.Home;
  const isLoginActive = currentPage === Page.Login;

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
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(isAuthenticated ? Page.Home : Page.Landing); }} className={`hover:text-white transition-colors ${isHomeActive ? 'text-white font-semibold' : 'text-gray-200'}`}>Home</a>
           
            <a onClick={() => handleNavigate(Page.AboutUs)} className="cursor-pointer text-gray-200 hover:text-white transition-colors">About Us</a>
            <a onClick={() => handleNavigate(Page.Contact)} className="cursor-pointer text-gray-200 hover:text-white transition-colors">Contact</a>

            {/* Desktop Search */}
            {currentPage === Page.Home && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={desktopSearchQuery}
                  onChange={(e) => { setDesktopSearchQuery(e.target.value); setIsSearchModalOpen(true); }}
                  onFocus={() => setIsSearchModalOpen(true)}
                  className="bg-white/20 text-white placeholder-gray-300 rounded-full py-1.5 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
                <SearchIcon className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <div className="w-px h-6 bg-white/20"></div>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button onClick={() => navigateTo(Page.Notifications)} className="text-gray-200 hover:text-white relative">
                  <NotificationIcon className="w-6 h-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-brand-teal"></span>
                </button>
                <button onClick={() => navigateTo(Page.Messenger)} className="text-gray-200 hover:text-white">
                  <MessengerIcon className="w-6 h-6" />
                </button>
                <button onClick={() => navigateTo(Page.MyAccount)} className="text-gray-200 hover:text-white">
                  <UserIcon className="w-6 h-6" />
                </button>
                <button onClick={handleLogout} className="bg-white text-brand-teal font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo(Page.Login); }} className={`font-medium transition-colors ${isLoginActive ? 'text-white font-semibold' : 'text-gray-200 hover:text-white'}`}>Login</a>
                <button onClick={() => navigateTo(Page.Signup1)} className="bg-white text-brand-teal font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Sign Up</button>
              </div>
            )}
          </div>

          {/* Mobile Nav */}
          <div className={`lg:hidden flex items-center ${isMobileSearchOpen && currentPage === Page.Home ? 'w-full' : ''}`}>
            {isMobileSearchOpen && currentPage === Page.Home ? (
              <div className="w-full flex items-center">
                <div className="relative w-full">
                  <input type="text" placeholder="Search skills..." className="w-full bg-white text-gray-800 rounded-full py-2 pl-4 pr-10" autoFocus />
                  <SearchIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <button onClick={() => setIsMobileSearchOpen(false)} className="text-white ml-2" aria-label="Close search" title="Close search">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-x-3 sm:gap-x-4">
                {currentPage === Page.Home && (
                  <button onClick={() => setIsMobileSearchOpen(true)} className="text-white" aria-label="Open search">
                    <SearchIcon className="w-6 h-6" />
                  </button>
                )}
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none" aria-label="Toggle menu">
                  {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <div className={`lg:hidden absolute top-full right-4 mt-2 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 transition-transform transform ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(isAuthenticated ? Page.Home : Page.Landing); }} className={`block px-4 py-2 text-sm hover:bg-gray-100 ${isHomeActive ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700'}`}>Home</a>
         
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.AboutUs); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">About Us</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Contact); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Contact</a>
          <div className="border-t border-gray-100 my-1"></div>
          {isAuthenticated ? (
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
          ) : (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Login); }} className={`block px-4 py-2 text-sm hover:bg-gray-100 ${isLoginActive ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700'}`}>Login</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(Page.Signup1); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Up</a>
            </>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchSkillsModal
        isOpen={isSearchModalOpen}
        onClose={() => { setIsSearchModalOpen(false); setDesktopSearchQuery(''); }}
        navigation={navigation}
      />
    </>
  );
};

export default Header;
