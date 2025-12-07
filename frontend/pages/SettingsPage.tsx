"use client"

import type React from "react"
import { useState } from "react"
import type { Navigation } from "../App"
import { authApi } from "../utils/api"

interface Settings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  sessionReminders: boolean
  privateProfile: boolean
  allowMessages: boolean
  theme: "light" | "dark"
  language: string
}

interface Subscription {
  planName: string
  pricePerMonth: number
  renewalDate?: string
  autoRenew: boolean
  status: "active" | "canceled" | "past_due"
}

const SettingsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    sessionReminders: true,
    privateProfile: false,
    allowMessages: true,
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

  // Delete Account Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const [billingEmail, setBillingEmail] = useState("")

  const handleToggle = (key: keyof Settings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }))
      setSavedMessage("Settings updated")
      setTimeout(() => setSavedMessage(""), 3000)
    }
  }

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

  // Delete Account Logic
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

  const handleSelectChange = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSavedMessage("Settings updated")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  const SettingToggle: React.FC<{ label: string; description: string; settingKey: keyof Settings }> = ({
    label,
    description,
    settingKey,
  }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={settings[settingKey] as boolean}
          onChange={() => handleToggle(settingKey)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-teal/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal" />
      </label>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Save Message */}
      {savedMessage && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg border border-green-200">✓ {savedMessage}</div>
      )}

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Preferences</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleSelectChange("theme", e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscription */}
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

          {/* Auto Renew */}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={subscription.autoRenew} onChange={handleToggleAutoRenew} />
            <span className="text-sm text-gray-600">Auto renew</span>
          </label>

          {/* Billing + Manage + Cancel (Side by Side) */}
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

            {/* SIDE BY SIDE BUTTONS */}
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

            {/* Reason Dropdown */}
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

            {/* Custom Reason */}
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

            {/* Password */}
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
