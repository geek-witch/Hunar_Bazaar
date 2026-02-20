"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Page, type Navigation } from "../App"
import ErrorBoundary from "../components/ErrorBoundary"
import { CheckCircleIcon } from "../components/icons/MiscIcons"
import { authApi, supportApi } from "../utils/api"
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
  GithubIcon,
  WhatsAppIcon
} from "../components/icons/SocialIcons"
import ConfirmModal from "../components/ConfirmModal"

interface AvailabilitySlot {
  startTime: string
  endTime: string
  days: string[]
}

interface UserProfile {
  id: string
  profileId: string
  name: string
  email: string
  bio: string
  profilePic: string | null
  teachSkills: string[]
  learnSkills: string[]
  availability: AvailabilitySlot[]
  socialLinks: string[]
  credits: number
  badges: string[]
  skillsMastered: number
}

const ViewProfilePage: React.FC<{ navigation: Navigation; userId?: string }> = ({ navigation, userId }) => {
  const [requestSent, setRequestSent] = useState(false)
  const [relationshipStatus, setRelationshipStatus] = useState<'self' | 'friend' | 'pending-sent' | 'pending-received' | 'none'>('none')
  const [friendCount, setFriendCount] = useState<number>(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportedByMe, setReportedByMe] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [user, setUser] = useState<UserProfile | null>(null)
  const [reportErrorMessage, setReportErrorMessage] = useState<string>("")
  const [canReport, setCanReport] = useState(true)
  const [reportCooldownDays, setReportCooldownDays] = useState(0)
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  const badgeDetails: { [key: string]: string } = {
    "Beginner": "Completed 10+ sessions and earned 100+ credits.",
    "Quick Learner": "Completed 50+ sessions and earned 500+ credits.",
    "Rising Star": "Completed 100+ sessions and earned 1000+ credits.",
    "Skill Seeker": "Completed 200+ sessions and earned 2000+ credits.",
    "Skillful": "Completed 350+ sessions and earned 3500+ credits.",
    "Knowledge Explorer": "Completed 500+ sessions and earned 5000+ credits.",
    "Pro": "Completed 700+ sessions and earned 7000+ credits.",
    "Bright Mind": "Completed 900+ sessions and earned 9000+ credits.",
    "Expert": "Completed 1200+ sessions and earned 12000+ credits.",
    "Champion": "Completed 1500+ sessions and earned 15000+ credits.",
    "Wisdom Keeper": "Completed 1800+ sessions and earned 18000+ credits.",
    "Mentor Guide": "Completed 2100+ sessions and earned 21000+ credits.",
    "Insight Leader": "Completed 2400+ sessions and earned 24000+ credits.",
    "Legend": "Completed 2700+ sessions and earned 27000+ credits.",
    "Skill Champion": "Completed 3000+ sessions and earned 30000+ credits.",
    "Knowledge Sage": "Completed 3300+ sessions and earned 33000+ credits.",
    "Visionary": "Completed 3600+ sessions and earned 36000+ credits.",
    "Skill Titan": "Completed 4000+ sessions and earned 40000+ credits.",
    "Phoenix Mentor": "Completed 4500+ sessions and earned 45000+ credits.",
    "Legendary": "Achieved the highest tier! 5000+ sessions and 50000+ credits."
  }

  const selectedProfileId = useMemo(() => {
    const storedProfileId = sessionStorage.getItem("selectedProfileId")
    return userId || storedProfileId || ""
  }, [userId])

  const fetchProfile = async () => {
    if (!selectedProfileId) {
      setError("No profile selected. Please browse skills again.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError("")
    try {
      const response = await authApi.getPublicProfile(selectedProfileId)
      if (response.success && response.data) {
        const d = response.data as any
        setUser(d as UserProfile)
        setRelationshipStatus(d.relationshipStatus || 'none')
        setFriendCount(d.friendCount || 0)
      } else {
        // Handle blocked profile case
        if (response.blocked) {
          setError("You cannot view this profile. You may have been blocked by this user.")
        } else {
          setError(response.message || "Failed to load profile")
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    const onUpdate = () => {
      fetchProfile()
    }

    window.addEventListener('friends:changed', onUpdate)
    window.addEventListener('friendRequests:changed', onUpdate)
    return () => {
      window.removeEventListener('friends:changed', onUpdate)
      window.removeEventListener('friendRequests:changed', onUpdate)
    }
  }, [selectedProfileId])

  // Check report status when user profile is loaded
  useEffect(() => {
    if (user) {
      checkReportStatus()
    }
  }, [user?.id])

  const checkReportStatus = async () => {
    if (!user) return
    try {
      const resp = await supportApi.checkUserReport(user.id)
      if (resp.success && resp.data) {
        setCanReport(resp.data.canReportAgain)
        setReportCooldownDays(resp.data.daysRemaining)
        if (resp.data.hasReported) {
          setReportedByMe(true)
        }
      }
    } catch (err: any) {
      console.error('Error checking report status:', err)
    }
  }

  const handleReportSubmit = async () => {
    if (!user) return
    const reason = reportReason.trim()
    if (reason.length < 10) {
      navigation.showNotification('Please provide at least 10 characters for the report reason')
      return
    }
    try {
      const resp = await supportApi.reportUser(user.id, reason)
      if (resp.success) {
        navigation.showNotification('Report submitted successfully')
        setReportModalOpen(false)
        setReportReason("")
        setReportedByMe(true)
      } else {
        setReportErrorMessage(resp.message || 'Failed to submit report')
      }
    } catch (err: any) {
      console.error('Report submission error:', err)
      setReportErrorMessage('Failed to submit report. Please try again.')
    }
  }

  const closeAllReportModals = () => {
    setReportErrorMessage("")
    setReportModalOpen(false)
    setReportReason("")
  }


  const handleBlockUser = () => {
    if (!user) return
    console.log("Blocked user ID:", user.id)
    setBlockedByMe(true)
  }

  const handleUnblock = () => {
    setBlockedByMe(false)
    if (user) {
      navigation.showNotification(`${user.name} has been unblocked`)
    }
  }

  const [confirmOpen, setConfirmOpen] = useState(false)

  const openRemoveConfirm = () => setConfirmOpen(true)

  const handleConfirmRemove = async () => {
    if (!user) return
    const resp = await authApi.removeFriend(user.id)
    if (resp.success) {
      setRelationshipStatus('none')
      setFriendCount((c) => Math.max(0, c - 1))
      navigation.showNotification('Peer removed')
      window.dispatchEvent(new CustomEvent('friends:changed'))
      window.dispatchEvent(new CustomEvent('friendRequests:changed'))
    } else {
      navigation.showNotification(resp.message || 'Failed to remove Peer')
    }
    setConfirmOpen(false)
  }

  const handleCancelRemove = () => setConfirmOpen(false)

  if (isLoading) {
    return (
      <div className="bg-brand-light-blue min-h-screen flex items-center justify-center">
        <p className="text-brand-teal font-semibold">Loading profile...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="bg-brand-light-blue min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-md text-center space-y-4">
          <p className="text-red-600 font-semibold">{error || "Profile not found"}</p>
          <button
            onClick={() => navigation.navigateTo(Page.Home)}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const formatAvailability = (slot: AvailabilitySlot) => {
    const days = (slot.days || []).join(", ")
    return `${days} • ${slot.startTime} - ${slot.endTime}`
  }

  const getSocialIcon = (url: string) => {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();

    // Check for WhatsApp (wa.me, whatsapp.com, api.whatsapp.com)
    if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com')) {
      return <WhatsAppIcon className="w-6 h-6 text-green-500" />;
    }
    // Check for Facebook
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
      return <FacebookIcon className="w-6 h-6 text-blue-600" />;
    }
    // Check for Instagram
    if (lowerUrl.includes('instagram.com')) {
      return <InstagramIcon className="w-6 h-6 text-pink-500" />;
    }
    // Check for Twitter/X
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return <TwitterIcon className="w-6 h-6 text-blue-400" />;
    }
    // Check for LinkedIn
    if (lowerUrl.includes('linkedin.com')) {
      return <LinkedInIcon className="w-6 h-6 text-blue-700" />;
    }
    // Check for GitHub
    if (lowerUrl.includes('github.com')) {
      return <GithubIcon className="w-6 h-6 text-gray-800" />;
    }

    // Default icon for unknown links
    return (
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-brand-light-blue min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8 flex justify-end items-center">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ⋮
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => {
                      if (canReport) {
                        setReportModalOpen(true)
                      }
                      setMenuOpen(false)
                    }}
                    disabled={!canReport || reportedByMe}
                    title={!canReport ? `Report available in ${reportCooldownDays} day(s)` : reportedByMe ? 'You have already reported this user' : ''}
                    className={`w-full text-left px-4 py-2 ${!canReport || reportedByMe ? 'opacity-50 cursor-not-allowed hover:bg-gray-50' : 'hover:bg-gray-100'}`}
                  >
                    Report User {!canReport && reportCooldownDays > 0 && `(${reportCooldownDays}d)`}
                  </button>
                  <button
                    onClick={() => {
                      handleBlockUser()
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Block User
                  </button>
                </div>
              )}
            </div>
          </div>

          {blockedByMe ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8 p-6 text-center">
                  <img
                    src={user.profilePic || "/placeholder.svg"}
                    alt={user.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                  <p className="text-sm text-gray-500">{user.email || "Email hidden"}</p>
                  <div className="mt-6">
                    <p className="text-red-600 font-semibold">This user has been blocked.</p>
                    <button onClick={handleUnblock} className="mt-3 bg-white border border-gray-300 px-4 py-2 rounded-lg">Unblock</button>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <p className="text-gray-600">The full profile is hidden for blocked users.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className={`${reportedByMe ? "filter blur-sm pointer-events-none" : ""}`}>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
                      <div className="h-24 bg-gradient-to-r from-brand-teal to-brand-teal-dark"></div>

                      <div className="px-6 pb-6">
                        <div className="flex flex-col items-center -mt-12 mb-4">
                          <img
                            src={user.profilePic || "/placeholder.svg"}
                            alt={user.name}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                          />
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-800">{user.name}</h1>

                        {/* Credits and Badges Section */}
                        <div className="mt-4 flex flex-col items-center w-full px-6">
                          <div className="flex items-center justify-center gap-4 w-full">
                            {/* Credits (Left or Center) */}
                            <div className={`flex ${user.badges && user.badges.length > 0 ? "flex-1 justify-end" : "justify-center"}`}>
                              <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-100 shadow-sm hover:shadow-md transition-all cursor-default">
                                <span className="text-amber-600 font-black text-xl leading-none">{user.credits || 0}</span>
                                <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest mt-0.5">Credits</span>
                              </div>
                            </div>

                            {/* Badges (Right) if exist */}
                            {user.badges && user.badges.length > 0 && (
                              <div className="flex-1 flex justify-start items-center gap-2">
                                <div
                                  className="flex -space-x-2 cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => setShowBadgeModal(true)}
                                >
                                  {user.badges.slice(-3).map((badge, i) => (
                                    <div
                                      key={i}
                                      className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-white shadow-lg"
                                      title={badge}
                                    >
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </div>
                                  ))}
                                  {user.badges.length > 3 && (
                                    <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[11px] font-black text-slate-600 shadow-sm">
                                      +{user.badges.length - 3}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => setShowBadgeModal(true)}
                                  className="text-[10px] font-black text-brand-teal uppercase tracking-widest hover:underline whitespace-nowrap"
                                >
                                  Badges
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 mt-6">
                          {relationshipStatus === 'self' ? null : relationshipStatus === 'friend' ? (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  if (user?.id) sessionStorage.setItem("selectedChatUserId", user.id)
                                  navigation.navigateTo(Page.Messenger)
                                }}
                                className="w-full py-2 rounded-lg font-semibold bg-brand-teal text-white hover:bg-brand-teal-dark"
                              >
                                Send Message
                              </button>
                              <button
                                onClick={openRemoveConfirm}
                                className="w-full py-2 rounded-lg font-semibold bg-gray-100 text-gray-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : relationshipStatus === 'pending-sent' ? (
                            <button className="w-full py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 cursor-default">Pending</button>
                          ) : relationshipStatus === 'pending-received' ? (
                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  if (!user) return
                                  const resp = await authApi.respondFriendRequest(user.id, 'accept')
                                  if (resp.success) {
                                    setRelationshipStatus('friend')
                                    setFriendCount((c) => c + 1)
                                    navigation.showNotification('Peer request accepted')
                                    window.dispatchEvent(new CustomEvent('friendRequests:changed'))
                                    window.dispatchEvent(new CustomEvent('friends:changed'))
                                  } else {
                                    navigation.showNotification(resp.message || 'Failed to accept')
                                  }
                                }}
                                className="flex-1 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  if (!user) return
                                  const resp = await authApi.respondFriendRequest(user.id, 'reject')
                                  if (resp.success) {
                                    setRelationshipStatus('none')
                                    navigation.showNotification('Peer request rejected')
                                    window.dispatchEvent(new CustomEvent('friendRequests:changed'))
                                  } else {
                                    navigation.showNotification(resp.message || 'Failed to reject')
                                  }
                                }}
                                className="flex-1 py-2 rounded-lg font-semibold bg-red-100 text-red-700"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={async () => {
                                if (!user) return
                                const resp = await authApi.sendFriendRequest(user.id)
                                if (resp.success) {
                                  // optimistic update: pending state shown immediately
                                  setRelationshipStatus('pending-sent')
                                  navigation.showNotification('Peer request sent')
                                  // also dispatch so lists update elsewhere
                                  window.dispatchEvent(new CustomEvent('friendRequests:changed'))
                                } else {
                                  navigation.showNotification(resp.message || 'Failed to send request')
                                }
                              }}
                              className="w-full py-2 rounded-lg font-semibold bg-brand-teal text-white hover:bg-brand-teal-dark"
                            >
                              Send Request
                            </button>
                          )}
                          <div className="text-center text-sm text-gray-500">{friendCount} Peers</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                      <h2 className="text-2xl font-bold text-brand-teal mb-4">About</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{user.bio || "No bio provided."}</p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg">
                      <h2 className="text-2xl font-bold text-brand-teal mb-4">Skills I Teach</h2>
                      <div className="flex flex-wrap gap-3">
                        {(user.teachSkills || []).map((skill) => (
                          <div
                            key={skill}
                            className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-gray-800">{skill}</span>
                          </div>
                        ))}
                        {(!user.teachSkills || user.teachSkills.length === 0) && (
                          <p className="text-gray-600 text-sm">No teaching skills listed.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg">
                      <h2 className="text-2xl font-bold text-brand-teal mb-4">Skills I Want to Learn</h2>
                      <div className="flex flex-wrap gap-3">
                        {(user.learnSkills || []).map((skill) => (
                          <div
                            key={skill}
                            className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-800">{skill}</span>
                          </div>
                        ))}
                        {(!user.learnSkills || user.learnSkills.length === 0) && (
                          <p className="text-gray-600 text-sm">No learning goals listed.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg">
                      <h2 className="text-2xl font-bold text-brand-teal mb-4">Availability</h2>
                      <div className="space-y-3">
                        {(user.availability || []).length > 0 ? (
                          user.availability.map((slot, index) => (
                            <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <p className="font-semibold text-gray-800">{formatAvailability(slot)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">No availability provided.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg">
                      <h2 className="text-2xl font-bold text-brand-teal mb-4">Social Links</h2>
                      <div className="flex flex-wrap gap-3">
                        {(user.socialLinks || []).length > 0 ? (
                          user.socialLinks.map((link) => (
                            <a
                              key={link}
                              href={link.startsWith('http') ? link : `https://${link}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                              title={link}
                            >
                              {getSocialIcon(link)}
                              <span className="truncate max-w-[150px]">{link.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                            </a>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">No social links provided.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {reportedByMe && (
                <div className="absolute inset-0 flex items-center justify-center z-40">
                  <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md">
                    <h3 className="text-2xl font-bold text-brand-teal mb-2">Thanks for reporting</h3>
                    <p className="text-gray-600 mb-4">Our team will review this profile. In the meantime, the profile is hidden for you.</p>
                    <button
                      onClick={() => navigation.navigateTo(Page.Home)}
                      className="mt-2 bg-brand-teal text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-teal-dark"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              )}

              {reportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-l-4 border-brand-teal">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Report User</h3>
                    <p className="text-sm text-gray-600 mb-4">Tell us what happened. Our team will review it carefully.</p>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Reason (minimum 10 characters required)"
                      className="w-full min-h-[120px] bg-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 resize-none border border-gray-300"
                    />
                    <div className="text-xs text-gray-500 mt-1">{reportReason.length} characters</div>
                    <div className="flex gap-3 justify-end mt-4">
                      <button
                        onClick={() => {
                          setReportModalOpen(false)
                          setReportReason("")
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReportSubmit}
                        disabled={reportReason.trim().length < 10}
                        className="px-4 py-2 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {reportErrorMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Report</h3>
                    <p className="text-sm text-gray-600 mb-6">{reportErrorMessage}</p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={closeAllReportModals}
                        className="px-4 py-2 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-teal-dark transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmModal
                open={confirmOpen}
                title="Confirm Action"
                message={`Are you sure you want to remove ${user.name} from your friends?`}
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                onConfirm={handleConfirmRemove}
                onCancel={handleCancelRemove}
              />

              {/* Badge Details Modal */}
              {showBadgeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 transition-all animate-in fade-in duration-200">
                  <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full relative border border-slate-100 animate-in zoom-in-95 duration-300">
                    <button
                      onClick={() => setShowBadgeModal(false)}
                      className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all hover:rotate-90 duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                        <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Earned Badges</h3>
                        <p className="text-slate-500 text-sm font-medium">Achievements for teaching excellence</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                      {user.badges.map((badge, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand-teal/20 transition-all duration-300 group">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-amber-600 transition-colors">{badge}</h4>
                              <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-100">Earned</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed font-medium">{badgeDetails[badge] || "Achievement earned for participation."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ViewProfilePage

