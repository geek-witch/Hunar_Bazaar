"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Page, type Navigation } from "../App"
import { CheckCircleIcon } from "../components/icons/MiscIcons"
import { authApi } from "../utils/api"

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
  isVerified: boolean
}

const ViewProfilePage: React.FC<{ navigation: Navigation; userId?: string }> = ({ navigation, userId }) => {
  const [requestSent, setRequestSent] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportedByMe, setReportedByMe] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [user, setUser] = useState<UserProfile | null>(null)

  const selectedProfileId = useMemo(() => {
    const storedProfileId = sessionStorage.getItem("selectedProfileId")
    return userId || storedProfileId || ""
  }, [userId])

  useEffect(() => {
    if (!selectedProfileId) {
      setError("No profile selected. Please browse skills again.")
      setIsLoading(false)
      return
    }

    const fetchProfile = async () => {
      setIsLoading(true)
      setError("")
      try {
        const response = await authApi.getPublicProfile(selectedProfileId)
        if (response.success && response.data) {
          setUser(response.data as UserProfile)
        } else {
          setError(response.message || "Failed to load profile")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [selectedProfileId])

  const handleReportSubmit = () => {
    if (!user) return
    console.log("Reported reason:", reportReason)
    console.log("Reported user ID:", user.id)
    // TODO: send this info to admin via API
    setReportModalOpen(false)
    setReportReason("")
    setReportedByMe(true)
  }

  const handleBlockUser = () => {
    if (!user) return
    console.log("Blocked user ID:", user.id)
    setBlockedByMe(true)
  }

  const handleUnblock = () => {
    setBlockedByMe(false)
    if (user) {
      alert(`${user.name} has been unblocked`)
    }
  }

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

  return (
    <div className="bg-brand-light-blue min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => navigation.navigateTo(Page.Home)}
            className="text-brand-teal hover:text-brand-teal-dark font-medium mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

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
                    setReportModalOpen(true)
                    setMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Report User
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
                      {user.isVerified && (
                        <p className="text-xs text-green-600 text-center font-semibold mt-1">Verified</p>
                      )}

                      <div className="space-y-3 mt-6">
                        <button
                          onClick={() => !requestSent && setRequestSent(true)}
                          className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                            requestSent
                              ? "bg-blue-100 text-blue-700 cursor-default"
                              : "bg-brand-teal text-white hover:bg-brand-teal-dark"
                          }`}
                        >
                          {requestSent ? "Sent" : "Send Request"}
                        </button>
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
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200"
                          >
                            {link}
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
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewProfilePage

