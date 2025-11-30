"use client"

import type React from "react"
import { useState } from "react"
import type { Navigation } from "../App"
import { SearchIcon } from "../components/icons/MiscIcons"

interface Session {
  id: string
  tutorName: string
  tutorAvatar: string
  skill: string
  date: string
  time: string
  duration: string
  status: "upcoming" | "completed" | "cancelled"
  type: "teaching" | "learning"
}

const ScheduleSessionPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "teaching" | "learning">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      tutorName: "Jaweria Rehman",
      tutorAvatar: "/asset/p1.jfif",
      skill: "React Development",
      date: "2024-11-28",
      time: "15:00",
      duration: "1 hour",
      status: "upcoming",
      type: "learning",
    },
    {
      id: "2",
      tutorName: "Sara Ahmed",
      tutorAvatar: "/asset/p2.png",
      skill: "Python Basics",
      date: "2024-11-29",
      time: "18:00",
      duration: "1.5 hours",
      status: "upcoming",
      type: "teaching",
    },
    {
      id: "3",
      tutorName: "Emaan Fatima",
      tutorAvatar: "/asset/p3.jpg",
      skill: "UI/UX Design",
      date: "2024-11-20",
      time: "14:00",
      duration: "2 hours",
      status: "completed",
      type: "learning",
    },
    {
      id: "4",
      tutorName: "Ahmad Khan",
      tutorAvatar: "/asset/p4.jpg",
      skill: "Database Management",
      date: "2024-11-22",
      time: "10:00",
      duration: "1 hour",
      status: "cancelled",
      type: "teaching",
    },
  ])

  const [newSession, setNewSession] = useState({
    tutorName: "",
    skill: "",
    date: "",
    time: "",
    duration: "1 hour",
    type: "learning" as "teaching" | "learning",
  })

  const filteredSessions = sessions.filter((session) => {
    const matchesFilter = activeFilter === "all" || session.type === activeFilter
    const matchesSearch =
      session.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const upcomingSessions = filteredSessions.filter((s) => s.status === "upcoming")
  const pastSessions = filteredSessions.filter((s) => s.status === "completed" || s.status === "cancelled")

  const handleCreateSession = () => {
    if (newSession.tutorName && newSession.skill && newSession.date && newSession.time) {
      const session: Session = {
        id: Date.now().toString(),
        tutorName: newSession.tutorName,
        tutorAvatar: "/asset/p1.jfif",
        skill: newSession.skill,
        date: newSession.date,
        time: newSession.time,
        duration: newSession.duration,
        status: "upcoming",
        type: newSession.type,
      }
      setSessions([...sessions, session])
      setShowNewSessionModal(false)
      setNewSession({
        tutorName: "",
        skill: "",
        date: "",
        time: "",
        duration: "1 hour",
        type: "learning",
      })
    }
  }

  const handleCancelSession = (id: string) => {
    setSessions(sessions.map((s) => (s.id === id ? { ...s, status: "cancelled" as const } : s)))
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    }
    return styles[status as keyof typeof styles] || styles.upcoming
  }

  const SessionCard: React.FC<{ session: Session }> = ({ session }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={session.tutorAvatar} alt={session.tutorName} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h3 className="font-semibold text-gray-800">{session.tutorName}</h3>
            <p className="text-sm text-gray-500">{session.skill}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500 mb-1">Date</p>
          <p className="font-medium text-gray-800">{new Date(session.date).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Time</p>
          <p className="font-medium text-gray-800">{session.time}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Duration</p>
          <p className="font-medium text-gray-800">{session.duration}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Type</p>
          <p className="font-medium text-gray-800 capitalize">{session.type}</p>
        </div>
      </div>

      {session.status === "upcoming" && (
        <div className="flex gap-2">
          <button className="flex-1 bg-brand-teal text-white py-2 px-4 rounded-lg hover:bg-brand-teal-dark transition-colors text-sm font-medium">
            Join Session
          </button>
          <button
            onClick={() => handleCancelSession(session.id)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white ">Schedule Sessions</h1>
        
        </div>
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="bg-brand-teal text-white px-6 py-2 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
        >
          + New Session
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 rounded-lg py-2 pl-10 pr-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "all" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("learning")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "learning" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Learning
            </button>
            <button
              onClick={() => setActiveFilter("teaching")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === "teaching" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Teaching
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 font-bold">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>
        {upcomingSessions.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Upcoming Sessions</h3>
            <p className="text-gray-500">Schedule a new session to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Past Sessions ({pastSessions.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Schedule New Session</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                <select
                  value={newSession.type}
                  onChange={(e) => setNewSession({ ...newSession, type: e.target.value as "teaching" | "learning" })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="learning">Learning</option>
                  <option value="teaching">Teaching</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {newSession.type === "learning" ? "Tutor Name" : "Student Name"}
                </label>
                <input
                  type="text"
                  value={newSession.tutorName}
                  onChange={(e) => setNewSession({ ...newSession, tutorName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                <input
                  type="text"
                  value={newSession.skill}
                  onChange={(e) => setNewSession({ ...newSession, skill: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="e.g., React, Python, Design"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="30 minutes">30 minutes</option>
                  <option value="1 hour">1 hour</option>
                  <option value="1.5 hours">1.5 hours</option>
                  <option value="2 hours">2 hours</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                className="flex-1 bg-brand-teal text-white py-2 px-4 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleSessionPage
