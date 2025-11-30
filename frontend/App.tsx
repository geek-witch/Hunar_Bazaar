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
  login: () => void
  logout: () => void
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => hashToPage(window.location.hash))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if token exists in localStorage
    return !!localStorage.getItem("token")
  })

  // Effect to handle browser navigation (back/forward buttons) via hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(hashToPage(window.location.hash))
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
      window.scrollTo(0, 0)
    } else {
      // Only push to history if the hash is different
      if (window.location.hash !== newHash) {
        window.location.hash = newHash
      } else {
        // If hash is the same, the event won't fire, so we need to scroll manually
        window.scrollTo(0, 0)
      }
    }
  }, [])

  const login = useCallback(() => {
    setIsAuthenticated(true)
    // After login, replace history entry so back doesn't go back to login
    navigateTo(Page.Home, true)
  }, [navigateTo])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    navigateTo(Page.Landing)
  }, [navigateTo])

  const navigation: Navigation = { navigateTo, login, logout }

  // Redirect authenticated users away from the Landing page.
  // This handles the case where browser back/forward navigates to `#/` while the user
  // is already logged in (token present). We replace history so landing doesn't remain.
  useEffect(() => {
    if (isAuthenticated && currentPage === Page.Landing) {
      navigateTo(Page.Home, true)
    }
  }, [isAuthenticated, currentPage, navigateTo])

  const renderPage = () => {
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

  const showHeaderFooter = currentPage !== Page.MyAccount

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      {showHeaderFooter && (
        <Header isAuthenticated={isAuthenticated} navigation={navigation} currentPage={currentPage} />
      )}
      <main className="flex-grow">{renderPage()}</main>
      {showHeaderFooter && <Footer navigation={navigation} />}
    </div>
  )
}

export default App
