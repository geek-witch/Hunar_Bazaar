"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import LandingPage from "./pages/LandingPage"
import SignupStep1Page from "./pages/SignupStep1Page"
import SignupStep2Page from "./pages/SignupStep2Page"
import LoginPage from "./pages/LoginPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import VerificationPage from "./pages/VerificationPage"
import HomePage from "./pages/HomePage"
import MyAccountPage from "./pages/MyAccountPage"
import NotificationsPage from "./pages/NotificationsPage"
import MessengerPage from "./pages/MessengerPage"
import Header from "./components/Header"
import Footer from "./components/Footer"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import AboutUsPage from "./pages/AboutUsPage"
import ContactUsPage from "./pages/ContactUsPage"
import CheckoutPage from "./pages/CheckoutPage"
import ViewProfilePage from "./pages/ViewProfilePage"
import MeetingPage from "./pages/MeetingPage"
import { ensureFirebaseSignedIn, firebaseLogout } from "./utils/firebaseAuth"
import { UnreadMessagesProvider } from "./contexts/UnreadMessagesContext"
import { NotificationProvider } from "./contexts/NotificationContext";

const Notification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4 border-l-4 border-brand-teal">
        <div className="text-center">
          <div className="mb-3">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-brand-teal/10">
              <svg className="h-5 w-5 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1.5">System Message</h3>
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-brand-teal text-white py-1.5 px-4 rounded-lg text-sm font-medium hover:bg-brand-teal-dark transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
export enum Page {
  Landing = 0,
  Login = 1,
  AboutUs = 2,
  Contact = 3,
  ForgotPassword = 4,
  ResetPassword = 5,
  Signup1 = 6,
  Signup2 = 7,
  Verify = 8,
  Home = 9,
  MyAccount = 10,
  Notifications = 11,
  Messenger = 12,
  Checkout = 13,
  ViewProfile = 14,
}

// Helper functions to map between Page enum and URL hash
const pageToHash = (page: Page): string => {
  switch (page) {
    case Page.Login:
      return "#/login"
    case Page.AboutUs:
      return "#/about"
    case Page.Contact:
      return "#/contact"
    case Page.ForgotPassword:
      return "#/forgot-password"
    case Page.ResetPassword:
      return "#/reset-password"
    case Page.Signup1:
      return "#/signup-1"
    case Page.Signup2:
      return "#/signup-2"
    case Page.Verify:
      return "#/verify"
    case Page.Home:
      return "#/home"
    case Page.MyAccount:
      return "#/account"
    case Page.Notifications:
      return "#/notifications"
    case Page.Messenger:
      return "#/messenger"
    case Page.Checkout:
      return "#/checkout"
    case Page.ViewProfile:
      return "#/view-profile"
    case Page.Landing:
    default:
      return "#/"
  }
}

const hashToPage = (hash: string): Page => {
  // Extract the path part before any query parameters
  const pathPart = hash.split("?")[0]

  switch (pathPart) {
    case "#/login":
      return Page.Login
    case "#/about":
      return Page.AboutUs
    case "#/contact":
      return Page.Contact
    case "#/forgot-password":
      return Page.ForgotPassword
    case "#/reset-password":
      return Page.ResetPassword
    case "#/signup-1":
      return Page.Signup1
    case "#/signup-2":
      return Page.Signup2
    case "#/verify":
      return Page.Verify
    case "#/home":
      return Page.Home
    case "#/account":
      return Page.MyAccount
    case "#/notifications":
      return Page.Notifications
    case "#/messenger":
      return Page.Messenger
    case "#/checkout":
      return Page.Checkout
    case "#/view-profile":
      return Page.ViewProfile
    case "#/":
    case "":
    default:
      return Page.Landing
  }
}

export type Navigation = {
  navigateTo: (page: Page) => void
  setCurrentPage: (page: string, params?: any) => void
  login: (isSignup?: boolean) => void
  logout: (suppressNotification?: boolean) => void
  showNotification: (message: string) => void
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => hashToPage(window.location.hash))
  const [customPage, setCustomPage] = useState<{ page: string; params?: any } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if token exists in localStorage
    return !!localStorage.getItem("token")
  })

  // --- NEW STATE FOR NOTIFICATION ---
  const [notification, setNotification] = useState<{ message: string } | null>(null)

  const closeNotification = useCallback(() => {
    setNotification(null)
  }, [])
  // ----------------------------------

  // Effect to handle browser navigation (back/forward buttons) via hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(hashToPage(window.location.hash))
      setCustomPage(null) // Reset custom page state so we don't get stuck
      // Keep auth state in sync with storage in case it changed (back button, other tabs)
      setIsAuthenticated(!!localStorage.getItem("token"))
      window.scrollTo(0, 0)
    }

    window.addEventListener("hashchange", handleHashChange)

    // Set initial page in case the user lands with a hash but no event fires
    handleHashChange()

    // Also listen for storage events (token changes in other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "token") {
        setIsAuthenticated(!!localStorage.getItem("token"))
      }
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const navigateTo = useCallback((page: Page, replace = false) => {
    const newHash = pageToHash(page)
    const newUrl = window.location.pathname + window.location.search + newHash
    if (replace) {
      // Replace the current history entry so back button won't return here
      history.replaceState(null, "", newUrl)
      setCurrentPage(page)
      setCustomPage(null) // Ensure manual navigation also clears it
      window.scrollTo(0, 0)
    } else {
      // Only push to history if the hash is different
      if (window.location.hash !== newHash) {
        window.location.hash = newHash
      } else {
        // If hash is the same, the event won't fire, so we need to scroll manually
        // We also need to manually clear customPage if we are just "refreshing" the current route via click
        setCustomPage(null)
        window.scrollTo(0, 0)
      }
    }
  }, [])

  // If the app detects a navigation to Home while not authenticated,
  // immediately replace the history entry to Landing. This prevents
  // rendering Home content to logged-out users when they navigate back.
  useEffect(() => {
    if (currentPage === Page.Home && !isAuthenticated) {
      navigateTo(Page.Landing, true)
    }
  }, [currentPage, isAuthenticated, navigateTo])

  // --- MODIFIED LOGIN FUNCTION ---
  const login = useCallback((isSignup = false) => {
    setIsAuthenticated(true)
    const newHash = pageToHash(Page.Home)
    const newUrl = window.location.pathname + window.location.search + newHash
    // Replace the current history entry (e.g. /login) with Home, then push
    // another Home entry. This makes the previous entry also point to Home
    // so pressing the browser Back button will stay on Home.
    history.replaceState(null, "", newUrl)
    history.pushState(null, "", newUrl)
    setCurrentPage(Page.Home)
    setCustomPage(null)
    setNotification({ message: isSignup ? 'Signup Successfully' : 'Login Successfully' })
  }, [setCurrentPage])
  // -------------------------------

  // --- MODIFIED LOGOUT FUNCTION ---
  const logout = useCallback((suppressNotification = false) => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("unreadMessageCount") // Clear stale unread count
    firebaseLogout()
    setIsAuthenticated(false)
    navigateTo(Page.Landing)
    setCustomPage(null)
    if (!suppressNotification) {
      setNotification({ message: 'Logout Successfully' })
    }
  }, [navigateTo])
  // --------------------------------

  // Keep Firebase auth in sync whenever JWT auth is present (page refresh, deep links, etc.)
  useEffect(() => {
    if (!isAuthenticated) return
      ; (async () => {
        try {
          await ensureFirebaseSignedIn()
        } catch (e) {
          console.warn('Firebase sign-in failed:', e)
        }
      })()
  }, [isAuthenticated])

  const setCurrentPageCustom = useCallback((page: string, params?: any) => {
    setCustomPage({ page, params })
  }, [])

  const showNotification = useCallback((message: string) => {
    setNotification({ message })
  }, [])

  const navigation: Navigation = { navigateTo, setCurrentPage: setCurrentPageCustom, login, logout, showNotification }

  // Redirect authenticated users away from the Landing page.
  useEffect(() => {
    if (isAuthenticated && currentPage === Page.Landing) {
      navigateTo(Page.Home, true)
    }
  }, [isAuthenticated, currentPage, navigateTo])

  const renderPage = () => {
    // Handle custom pages first
    if (customPage) {
      switch (customPage.page) {
        case 'Meeting':
          return <MeetingPage navigation={navigation} sessionId={customPage.params?.sessionId} />
        case 'MyAccount':
          return <MyAccountPage navigation={navigation} initialTab={customPage.params?.tab} />
        default:
          // Reset to default page if unknown custom page
          setCustomPage(null)
          break
      }
    }

    // If user is authenticated, never render the Landing page UI — show Home instead.
    if (isAuthenticated && currentPage === Page.Landing) {
      return <HomePage navigation={navigation} />
    }
    switch (currentPage) {
      case Page.Landing:
        return <LandingPage navigation={navigation} />
      case Page.AboutUs:
        return <AboutUsPage navigation={navigation} />
      case Page.Login:
        return <LoginPage navigation={navigation} />
      case Page.Contact:
        return <ContactUsPage navigation={navigation} />
      case Page.ForgotPassword:
        return <ForgotPasswordPage navigation={navigation} />
      case Page.ResetPassword:
        return <ResetPasswordPage navigation={navigation} />
      case Page.Signup1:
        return <SignupStep1Page navigation={navigation} />
      case Page.Signup2:
        return <SignupStep2Page navigation={navigation} />
      case Page.Verify:
        return <VerificationPage navigation={navigation} />
      case Page.Home:
        return <HomePage navigation={navigation} />
      case Page.MyAccount:
        return <MyAccountPage navigation={navigation} />
      case Page.Notifications:
        return <NotificationsPage navigation={navigation} />
      case Page.Messenger:
        return <MessengerPage navigation={navigation} />
      case Page.Checkout:
        return <CheckoutPage navigation={navigation} />
      case Page.ViewProfile:
        return <ViewProfilePage navigation={navigation} />
      default:
        return <LandingPage navigation={navigation} />
    }
  }

  const showHeaderFooter = currentPage !== Page.MyAccount && !customPage

  return (
    <NotificationProvider>
      <UnreadMessagesProvider>
        <div className="bg-white min-h-screen flex flex-col font-sans">
          {/* --- NOTIFICATION DISPLAY --- */}
          {notification && (
            <Notification
              message={notification.message}
              onClose={closeNotification}
            />
          )}
          {/* ---------------------------- */}
          {showHeaderFooter && (
            <Header isAuthenticated={isAuthenticated} navigation={navigation} currentPage={currentPage} />
          )}
          <main className="flex-grow">{renderPage()}</main>
          {showHeaderFooter && <Footer navigation={navigation} />}
        </div>
      </UnreadMessagesProvider>
    </NotificationProvider>
  )
}

export default App