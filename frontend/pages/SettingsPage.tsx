"use client"

import React, { useState } from "react"
import type { Navigation } from "../App"
import { authApi } from "../utils/api"

interface Settings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  sessionReminders: boolean
  privateProfile: boolean
  allowMessages: "anyone" | "friends" | "none"
  theme: string
  language: string
}

interface PrivacySecurityProps {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  navigation: Navigation
}

interface Subscription {
  planName: string
  pricePerMonth: number
  renewalDate?: string
  autoRenew: boolean
  status: "active" | "canceled" | "past_due"
}

const PrivacySecurity: React.FC<PrivacySecurityProps> = ({ settings, setSettings, navigation }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Password form states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordMessage("")

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage("All fields are required.")
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New password and confirmation do not match.")
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long.")
      return
    }

    // Validate password requirements (uppercase, lowercase, number)
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      setPasswordMessage("Password must include uppercase, lowercase, and a number.")
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      })

      if (response.success) {
        setShowPasswordModal(false)
        setPasswordMessage("")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmNewPassword("")
        navigation.showNotification("Password Changed Successfully")
      } else {
        setPasswordMessage(response.message || "Failed to update password. Please try again.")
      }
    } catch (error: any) {
      setPasswordMessage(error.message || "An error occurred. Please try again.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Update message setting
  const handleSelectChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      allowMessages: value as Settings["allowMessages"],
    }))
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-brand-teal rounded-full"></span>
          Privacy & Security
        </h2>
      </div>

      <div className="p-8 space-y-8">

        {/* Change Password */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Change Password</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Update your account password regularly to keep your account secure.
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-brand-teal text-white py-3 px-6 rounded-xl text-sm font-bold hover:bg-brand-teal-dark shadow-lg shadow-teal-200/50 transition-all whitespace-nowrap"
          >
            Change Password
          </button>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* Who can message you */}
        <div>
          <label className="block text-lg font-bold text-slate-800 mb-2">
            Who can send you messages?
          </label>
          <p className="text-sm text-slate-500 mb-4 max-w-lg">
            Control who is allowed to start a private conversation with you. Restricting this can reduce spam.
          </p>

          <div className="relative max-w-sm">
            <select
              value={settings.allowMessages}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/50 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="anyone">Anyone</option>
              <option value="friends">Friends Only</option>
              <option value="none">No one</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-teal to-cyan-500"></div>

            <h2 className="text-2xl font-bold text-slate-800 mb-6">Change Password</h2>

            {passwordMessage && (
              <div
                className={`p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-3 ${passwordMessage.includes("Successfully")
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                  }`}
              >
                {passwordMessage.includes("Successfully") ? (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                {passwordMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 placeholder:font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 chars, mixed case & numbers"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 placeholder:font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                onClick={() => {
                  setShowPasswordModal(false)
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmNewPassword("")
                  setPasswordMessage("")
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className={`flex-1 bg-brand-teal text-white py-3.5 px-6 rounded-xl font-bold shadow-lg shadow-teal-200/50 transition-all ${isChangingPassword
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-brand-teal-dark hover:-translate-y-0.5"
                  }`}
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SettingsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    sessionReminders: true,
    privateProfile: false,
    allowMessages: "anyone",
    theme: "light",
    language: "en",
  })

  const [savedMessage, setSavedMessage] = useState("")

  const [subscription, setSubscription] = useState<Subscription>({
    planName: "Pro",
    pricePerMonth: 3500,
    renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: true,
    status: "active",
  })

  const [showCancelModal, setShowCancelModal] = useState(false)

  // Billing / subscription related
  const [billingEmail, setBillingEmail] = useState("")

  const handleToggleAutoRenew = () => {
    setSubscription((prev) => ({ ...prev, autoRenew: !prev.autoRenew }))
    setSavedMessage("Subscription settings updated")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  const handleCancelSubscription = () => {
    setSubscription((prev) => ({ ...prev, status: "canceled", autoRenew: false }))
    setShowCancelModal(false)
    setSavedMessage("Subscription canceled")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  // Delete account states and handlers
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const resetDeleteForm = () => {
    setDeleteReason("")
    setCustomReason("")
    setDeletePassword("")
    setDeleteError("")
  }

  const openDeleteModal = () => {
    resetDeleteForm()
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    resetDeleteForm()
  }

  const handleDeleteAccount = async () => {
    const finalReason = (deleteReason === "other" ? customReason : deleteReason)?.trim() || ""

    if (!finalReason) {
      setDeleteError("Please select or provide a reason.")
      return
    }

    if (!deletePassword) {
      setDeleteError("Please confirm your password.")
      return
    }

    setIsDeletingAccount(true)
    setDeleteError("")

    try {
      const response = await authApi.deleteAccount({
        password: deletePassword,
        reason: finalReason,
      })

      if (!response.success) {
        setDeleteError(response.message || "Failed to delete account. Please try again.")
        return
      }

      closeDeleteModal()
      navigation.showNotification("Account Deleted Successfully")
      // Small delay to show notification before navigating to landing page
      setTimeout(() => {
        navigation.logout(true) // Suppress logout notification since we already showed account deleted message
      }, 500)
    } catch (error) {
      setDeleteError("Unexpected error. Please try again.")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-cyan-50 text-base mt-1.5 font-medium">Manage your preferences, security, and billing.</p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {savedMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-emerald-200/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {savedMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Privacy & Security */}
        <PrivacySecurity settings={settings} setSettings={setSettings} navigation={navigation} />

        {/* Subscription Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
              Subscription
            </h2>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-purple-50 rounded-2xl border border-purple-100">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
                  {subscription.planName}
                  <span className="text-lg font-medium text-slate-500">— ₨{subscription.pricePerMonth}/mo</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${subscription.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  {subscription.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors w-fit">
              <div className="relative flex items-center">
                <input type="checkbox" checked={subscription.autoRenew} onChange={handleToggleAutoRenew} className="peer sr-only" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-teal/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal"></div>
              </div>
              <span className="text-sm font-bold text-slate-700">Auto-renew subscription</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 pt-6 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Billing Email</label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="billing@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Actions</label>
                <div className="flex flex-wrap gap-3">
                  <button className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    Update Payment Method
                  </button>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={subscription.status !== "active"}
                  >
                    Cancel Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-red-700 mb-1">Delete Account</h3>
            <p className="text-sm text-red-600/80 max-w-lg">
              Once you delete your account, there is no going back. All your data including certificates and history will be permanently removed.
            </p>
          </div>
          <button
            onClick={openDeleteModal}
            className="bg-white text-red-600 border border-red-200 py-3 px-6 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all font-bold shadow-sm whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative overflow-hidden">

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Delete Account</h2>
              <p className="text-slate-500 mt-2 text-sm">We're sorry to see you go. Please tell us why.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reason</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-red-200 transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                    value={deleteReason}
                    onChange={(e) => {
                      setDeleteReason(e.target.value)
                      setDeleteError("")
                    }}
                  >
                    <option value="">Select a reason</option>
                    <option value="not useful">I don't find the app useful</option>
                    <option value="privacy">I have privacy concerns</option>
                    <option value="issues">I’m facing technical issues</option>
                    <option value="duplicate">I created a duplicate account</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {deleteReason === "other" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-200 transition-all text-slate-700 placeholder:text-slate-400"
                    placeholder="Please tell us more..."
                    rows={3}
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value)
                      setDeleteError("")
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-200 transition-all font-medium text-slate-700"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    setDeleteError("")
                  }}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {deleteError}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                onClick={closeDeleteModal}
              >
                Keep Account
              </button>

              <button
                onClick={handleDeleteAccount}
                className={`flex-1 bg-red-600 text-white py-3.5 px-6 rounded-xl font-bold shadow-lg shadow-red-200/50 transition-all ${isDeletingAccount ? "opacity-70 cursor-not-allowed" : "hover:bg-red-700 hover:-translate-y-0.5"
                  }`}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
