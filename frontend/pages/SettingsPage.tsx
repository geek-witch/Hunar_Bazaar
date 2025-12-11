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
}

interface Subscription {
  planName: string
  pricePerMonth: number
  renewalDate?: string
  autoRenew: boolean
  status: "active" | "canceled" | "past_due"
}

const PrivacySecurity: React.FC<PrivacySecurityProps> = ({ settings, setSettings }) => {
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
        setPasswordMessage("Password updated successfully!")
        setTimeout(() => {
          setShowPasswordModal(false)
          setPasswordMessage("")
          setCurrentPassword("")
          setNewPassword("")
          setConfirmNewPassword("")
        }, 1200)
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Privacy & Security</h2>
      </div>

      <div className="p-6 space-y-6">

        {/* Change Password */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-1">Change Password</h3>
            <p className="text-sm text-gray-500">
              Update your account password regularly to keep your account secure.
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-brand-teal text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition-colors whitespace-nowrap"
          >
            Change Password
          </button>
        </div>

        <hr className="border-gray-200" />

        {/* Who can message you */}
        <div>
          <label className="block text-md font-semibold text-gray-800 mb-2">
            Who can send you messages?
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Control who is allowed to start a private conversation with you.
          </p>

          <select
            value={settings.allowMessages}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
          >
            <option value="anyone">Anyone</option>
            <option value="friends">Friends Only</option>
            <option value="none">No one</option>
          </select>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Change Password</h2>

            {passwordMessage && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  passwordMessage.includes("successfully")
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {passwordMessage}
              </div>
            )}

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              />

              <input
                type="password"
                placeholder="New Password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700"
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
                className={`bg-brand-teal text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isChangingPassword 
                    ? "bg-brand-teal/50 cursor-not-allowed" 
                    : "hover:bg-brand-teal/90"
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
      localStorage.removeItem("token")
      navigation.logout()
    } catch (error) {
      setDeleteError("Unexpected error. Please try again.")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      {savedMessage && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg border border-green-200">✓ {savedMessage}</div>
      )}

      {/* Privacy & Security (from provided component) */}
      <PrivacySecurity settings={settings} setSettings={setSettings} />

      {/* Subscription Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Subscription</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-semibold text-gray-800">
                {subscription.planName} — ₨{subscription.pricePerMonth}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-semibold ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {subscription.status}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={subscription.autoRenew} onChange={handleToggleAutoRenew} />
            <span className="text-sm text-gray-600">Auto renew</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3"
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Manage</p>
              <div className="flex justify-between mt-4">
                <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:shadow-sm transition-all">
                  Manage Payment Methods
                </button>

                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  disabled={subscription.status !== "active"}
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={openDeleteModal}
          className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 font-medium"
        >
          Delete Account
        </button>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Account</h2>
            <p className="text-gray-600 mb-4">Please choose a reason and confirm your password.</p>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
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
            </div>

            {deleteReason === "other" && (
              <div className="mb-3">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Write your reason..."
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value)
                    setDeleteError("")
                  }}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value)
                  setDeleteError("")
                }}
              />
            </div>

            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                className={`px-4 py-2 rounded-lg text-white ${isDeletingAccount ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
