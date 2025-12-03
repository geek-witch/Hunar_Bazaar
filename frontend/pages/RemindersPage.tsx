"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Navigation } from "../App"

interface Reminder {
  id: string
  title: string
  description: string
  scheduledFor: string
  type: "session"
  isCompleted: boolean
}

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

const RemindersPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      title: "React Session with Ali",
      description: "Scheduled learning session for React fundamentals",
      scheduledFor: "2024-11-25T10:00:00",
      type: "session",
      isCompleted: false,
    },
    {
      id: "2",
      title: "React Session with Sara",
      description: "Scheduled learning session for React hooks",
      scheduledFor: "2024-11-26T15:00:00",
      type: "session",
      isCompleted: false,
    },
  ])

  const [showForm, setShowForm] = useState(false)
  const [newReminder, setNewReminder] = useState({ title: "", description: "", scheduledDate: "", type: "session" })
  const [loadingSync, setLoadingSync] = useState(false)

  const handleToggleReminder = (id: string) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r)))
  }

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id))
  }

  const handleAddReminder = () => {
    if (newReminder.title && newReminder.scheduledDate) {
      const reminder: Reminder = {
        id: Date.now().toString(),
        title: newReminder.title,
        description: newReminder.description,
        scheduledFor: new Date(newReminder.scheduledDate).toISOString(),
        type: "session",
        isCompleted: false,
      }
      setReminders([...reminders, reminder])
      setNewReminder({ title: "", description: "", scheduledDate: "", type: "session" })
      setShowForm(false)
    }
  }

  const fetchScheduledSessions = async (): Promise<Session[]> => {
    return [
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
    ]
  }

  const syncSessionsToReminders = async () => {
    setLoadingSync(true)
    try {
      const sessions = await fetchScheduledSessions()
      const upcoming = sessions.filter((s) => s.status === "upcoming")
      const merged = [...reminders]

      upcoming.forEach((s) => {
        const reminderId = `session-${s.id}`
        const exists = merged.some((r) => r.id === reminderId)
        if (!exists) {
          merged.push({
            id: reminderId,
            title: `${s.skill} with ${s.tutorName}`,
            description: `Upcoming session: ${s.skill} (${s.duration}) with ${s.tutorName}`,
            scheduledFor: new Date(`${s.date}T${s.time}`).toISOString(),
            type: "session",
            isCompleted: false,
          })
        }
      })

      setReminders(merged)
    } finally {
      setLoadingSync(false)
    }
  }

  useEffect(() => {
    syncSessionsToReminders()
  }, [])

  const activeReminders = reminders.filter((r) => !r.isCompleted)
  const completedReminders = reminders.filter((r) => r.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Session Reminders</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncSessionsToReminders()}
            disabled={loadingSync}
            className="bg-white text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          >
            {loadingSync ? "Syncing..." : "Sync Sessions"}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand-teal text-white px-4 py-2 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
          >
            + Add Session Reminder
          </button>
        </div>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Session Reminder</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Session title"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            />
            <textarea
              placeholder="Description (optional)"
              value={newReminder.description}
              onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 h-24"
            />
            <input
              type="datetime-local"
              value={newReminder.scheduledDate}
              onChange={(e) => setNewReminder({ ...newReminder, scheduledDate: e.target.value })}
              className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddReminder}
                className="flex-1 bg-brand-teal text-white py-2 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
              >
                Save Reminder
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Reminders */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Upcoming Sessions ({activeReminders.length})</h2>
        {activeReminders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500">
            <p>No upcoming session reminders. Add one to stay on track!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={reminder.isCompleted}
                      onChange={() => handleToggleReminder(reminder.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{reminder.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(reminder.scheduledFor).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Completed ({completedReminders.length})</h2>
          <div className="space-y-3">
            {completedReminders.map((reminder) => (
              <div key={reminder.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-75">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={reminder.isCompleted}
                      onChange={() => handleToggleReminder(reminder.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-600 line-through">{reminder.title}</h3>
                      <p className="text-xs text-gray-500 mt-2">{new Date(reminder.scheduledFor).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RemindersPage
