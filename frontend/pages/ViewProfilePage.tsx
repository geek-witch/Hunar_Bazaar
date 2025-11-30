"use client"

import type React from "react"
import { useState } from "react"
import { Page, type Navigation } from "../App"
import { CheckCircleIcon } from "../components/icons/MiscIcons"

interface UserProfile {
  id: string
  name: string
  email: string
  bio: string
  avatar: string
  rating: number
  reviews: number
  skillsTeach: string[]
  skillsLearn: string[]
  availability: { day: string; time: string }[]
  hourlyRate: number
  badges: string[]
  sessionsCompleted: number
  totalCredits: number
  languages: string[]
}

const ViewProfilePage: React.FC<{ navigation: Navigation; userId?: string }> = ({ navigation, userId }) => {
  const [requestSent, setRequestSent] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportedByMe, setReportedByMe] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)

  const [user] = useState<UserProfile>({
    id: userId || "1",
    name: "Ayesha Rana",
    email: "Ayesha.Rana@example.com",
    bio: "Passionate Full-stack developer with 5+ years of experience. Love teaching and sharing knowledge.",
    avatar: "/asset/p1.jfif",
    rating: 4.8,
    reviews: 47,
    skillsTeach: ["JavaScript", "React", "Node.js", "MongoDB", "Web Development"],
    skillsLearn: ["Python", "Machine Learning", "Data Science"],
    availability: [
      { day: "Monday", time: "3:00 PM - 8:00 PM" },
      { day: "Wednesday", time: "2:00 PM - 7:00 PM" },
      { day: "Friday", time: "4:00 PM - 9:00 PM" },
      { day: "Saturday", time: "10:00 AM - 5:00 PM" },
    ],
    hourlyRate: 25,
    badges: ["Top Rated", "Verified", "Super Tutor"],
    sessionsCompleted: 128,
    totalCredits: 560,
    languages: ["English", "Urdu", "Spanish"],
  })

  const handleReportSubmit = () => {
    console.log("Reported reason:", reportReason)
    console.log("Reported user ID:", user.id)
    // TODO: send this info to admin via API
    setReportModalOpen(false)
    setReportReason("")
    // mark as reported locally so the reporter sees the blurred/thank-you view
    setReportedByMe(true)
  }

  const handleBlockUser = () => {
    console.log("Blocked user ID:", user.id)
    // TODO: send block info to server via API
    setBlockedByMe(true)
  }

  const handleUnblock = () => {
    // TODO: call API to unblock
    setBlockedByMe(false)
    alert(`${user.name} has been unblocked`)
  }

  return (
    <div className="bg-brand-light-blue min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => navigation.navigateTo(Page.Home)}
            className="text-brand-teal hover:text-brand-teal-dark font-medium mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

          {/* Three-dot menu */}
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
          // Blocked view: show basic info, hide full profile, allow unblock
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8 p-6 text-center">
                <img
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
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
          // Normal profile rendering — may be blurred for reporter after reporting
          <div className="relative">
            <div className={`${reportedByMe ? 'filter blur-sm pointer-events-none' : ''}`}>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Sidebar Profile Card */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
                    {/* Banner */}
                    <div className="h-24 bg-gradient-to-r from-brand-teal to-brand-teal-dark"></div>

                    {/* Profile Info */}
                    <div className="px-6 pb-6">
                      <div className="flex flex-col items-center -mt-12 mb-4">
                        <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                          className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                        />
                      </div>

                      <h1 className="text-2xl font-bold text-center text-gray-800">{user.name}</h1>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {user.badges.map((badge) => (
                          <span
                            key={badge}
                            className="bg-brand-teal/10 text-brand-teal text-xs font-semibold px-3 py-1 rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 py-4 border-y">
                        <div className="text-center">
                          <p className="text-lg font-bold text-brand-teal">{user.sessionsCompleted}</p>
                          <p className="text-xs text-gray-500">Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-brand-teal">{user.totalCredits}</p>
                          <p className="text-xs text-gray-500">Credits Earned</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
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

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                  {/* About Section */}
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-brand-teal mb-4">About</h2>
                    <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                  </div>

                  {/* Skills Teaching */}
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-brand-teal mb-4">Skills I Teach</h2>
                    <div className="flex flex-wrap gap-3">
                      {user.skillsTeach.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full"
                        >
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-gray-800">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills Learning */}
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-brand-teal mb-4">Skills I Want to Learn</h2>
                    <div className="flex flex-wrap gap-3">
                      {user.skillsLearn.map((skill) => (
                        <span
                          key={skill}
                          className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-full text-gray-700 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-brand-teal mb-4">Availability</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {user.availability.map((slot) => (
                        <div
                          key={`${slot.day}-${slot.time}`}
                          className="flex items-center p-4 bg-brand-light-blue rounded-lg border border-brand-teal/10"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{slot.day}</p>
                            <p className="text-sm text-gray-600">{slot.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {reportedByMe && (
              <div className="absolute inset-0 flex items-center justify-center z-40">
                <div className="bg-white bg-opacity-95 p-8 rounded-lg shadow-lg text-center max-w-sm">
                  <h3 className="text-xl font-semibold mb-2">Thanks for reporting</h3>
                  <p className="text-sm text-gray-600">We’ve received your report and will review it shortly.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-xl font-bold mb-4">Report User</h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Why are you reporting this user?"
                className="w-full border border-gray-300 rounded-lg p-2 mb-4 resize-none h-24"
              ></textarea>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportSubmit}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewProfilePage
