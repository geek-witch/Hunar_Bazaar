
import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import SignupStep1Page from './pages/SignupStep1Page';
import SignupStep2Page from './pages/SignupStep2Page';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerificationPage from './pages/VerificationPage';
import HomePage from './pages/HomePage';
import MyAccountPage from './pages/MyAccountPage';
import Header from './components/Header';
import Footer from './components/Footer';

export enum Page {
  Landing,
  Login,
  ForgotPassword,
  Signup1,
  Signup2,
  Verify,
  Home,
  MyAccount,
}

// Helper functions to map between Page enum and URL hash
const pageToHash = (page: Page): string => {
  switch (page) {
    case Page.Login: return '#/login';
    case Page.ForgotPassword: return '#/forgot-password';
    case Page.Signup1: return '#/signup-1';
    case Page.Signup2: return '#/signup-2';
    case Page.Verify: return '#/verify';
    case Page.Home: return '#/home';
    case Page.MyAccount: return '#/account';
    case Page.Landing:
    default:
      return '#/';
  }
};

const hashToPage = (hash: string): Page => {
  switch (hash) {
    case '#/login': return Page.Login;
    case '#/forgot-password': return Page.ForgotPassword;
    case '#/signup-1': return Page.Signup1;
    case '#/signup-2': return Page.Signup2;
    case '#/verify': return Page.Verify;
    case '#/home': return Page.Home;
    case '#/account': return Page.MyAccount;
    case '#/':
    case '':
    default:
      return Page.Landing;
  }
};


export type Navigation = {
  navigateTo: (page: Page) => void;
  login: () => void;
  logout: () => void;
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => hashToPage(window.location.hash));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if token exists in localStorage
    return !!localStorage.getItem('token');
  });

  // Effect to handle browser navigation (back/forward buttons) via hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(hashToPage(window.location.hash));
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial page in case the user lands with a hash but no event fires
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((page: Page) => {
    const newHash = pageToHash(page);
    // Only push to history if the hash is different
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    } else {
      // If hash is the same, the event won't fire, so we need to scroll manually
      window.scrollTo(0, 0);
    }
  }, []);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    navigateTo(Page.Home);
  }, [navigateTo]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigateTo(Page.Landing);
  }, [navigateTo]);

  const navigation: Navigation = { navigateTo, login, logout };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Landing:
        return <LandingPage navigation={navigation} />;
      case Page.Login:
        return <LoginPage navigation={navigation} />;
      case Page.ForgotPassword:
        return <ForgotPasswordPage navigation={navigation} />;
      case Page.Signup1:
        return <SignupStep1Page navigation={navigation} />;
      case Page.Signup2:
        return <SignupStep2Page navigation={navigation} />;
      case Page.Verify:
        return <VerificationPage navigation={navigation} />;
      case Page.Home:
        return <HomePage navigation={navigation} />;
      case Page.MyAccount:
        return <MyAccountPage navigation={navigation} />;
      default:
        return <LandingPage navigation={navigation} />;
    }
  };
  
  const showHeaderFooter = currentPage !== Page.MyAccount;

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      {showHeaderFooter && <Header isAuthenticated={isAuthenticated} navigation={navigation} currentPage={currentPage} />}
      <main className="flex-grow">
        {renderPage()}
      </main>
      {showHeaderFooter && <Footer navigation={navigation} />}
    </div>
  );
};

export default App;
