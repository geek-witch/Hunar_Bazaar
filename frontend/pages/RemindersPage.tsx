"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Navigation } from "../App"
import { sessionApi } from "../utils/api"

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
  const [reminders, setReminders] = useState<Reminder[]>([])

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
    try {
      const response = await sessionApi.getSessions('all', undefined, 'upcoming');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  const syncSessionsToReminders = async () => {
    setLoadingSync(true)
    try {
      const sessions = await fetchScheduledSessions()
      const now = new Date()

      // Filter sessions that are status "upcoming" and whose time hasn't passed (more than 30 mins)
      const upcoming = sessions.filter((s) => {
        if (s.status !== "upcoming") return false
        const sessionTime = new Date(`${s.date}T${s.time}`)
        // Keep if session hasn't started yet or started recently (last 30 mins)
        return (sessionTime.getTime() + 30 * 60000) > now.getTime()
      })

      // Separate existing manual reminders from session-based ones
      const manualReminders = reminders.filter((r) => !r.id.startsWith("session-"))

      // Map current upcoming sessions to reminders
      const sessionReminders: Reminder[] = upcoming.map((s) => ({
        id: `session-${s.id}`,
        title: `${s.skill} with ${s.tutorName}`,
        description: `Upcoming session: ${s.skill}${s.duration ? ` (${s.duration})` : ""} with ${s.tutorName}`,
        scheduledFor: new Date(`${s.date}T${s.time}`).toISOString(),
        type: "session",
        isCompleted: false,
      }))

      setReminders([...manualReminders, ...sessionReminders])
    } catch (error) {
      console.error("Error syncing sessions:", error)
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
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Session Reminders</h1>
            <p className="text-cyan-50 text-base mt-1.5">Never miss a learning session or task.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => syncSessionsToReminders()}
              disabled={loadingSync}
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-xs flex items-center gap-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${loadingSync ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {loadingSync ? "Syncing..." : "Sync Sessions"}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-brand-teal px-5 py-2 rounded-full hover:bg-cyan-50 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-bold flex items-center gap-1.5 shadow-sm text-sm"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add Reminder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand-teal rounded-full"></span>
            Create New Reminder
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. React Session with Ali"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
              <textarea
                placeholder="Add any details or notes..."
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 h-20 resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={newReminder.scheduledDate}
                onChange={(e) => setNewReminder({ ...newReminder, scheduledDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-1">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="bg-brand-teal text-white px-6 py-2 rounded-lg hover:bg-brand-teal-dark shadow-lg shadow-teal-200/50 transition-all font-bold text-sm"
              >
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Reminders */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 px-2">
          <span className="w-2 h-2 bg-brand-teal rounded-full"></span>
          Upcoming Sessions ({activeReminders.length})
        </h2>
        {activeReminders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-lg border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <p className="text-slate-500 font-medium">No upcoming session reminders. You're all caught up!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-100 transition-all flex items-start gap-4 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-teal rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="pt-1">
                  <label className={`relative flex items-center ${new Date() < new Date(reminder.scheduledFor) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={reminder.isCompleted}
                      disabled={new Date() < new Date(reminder.scheduledFor)}
                      onChange={() => handleToggleReminder(reminder.id)}
                      className="peer sr-only"
                    />
                    <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${new Date() < new Date(reminder.scheduledFor) ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 'border-slate-300 peer-checked:bg-brand-teal peer-checked:border-brand-teal'}`}>
                      <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transform scale-50 peer-checked:scale-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </label>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{reminder.title}</h3>
                      <p className="text-sm font-semibold text-brand-teal mt-0.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(reminder.scheduledFor).toLocaleString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!reminder.id.startsWith("session-") && (
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                        title="Delete Reminder"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div className="pt-8 border-t border-slate-200 border-dashed">
          <h2 className="text-md font-bold text-slate-400 uppercase tracking-wide mb-4 px-2">Completed</h2>
          <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
            {completedReminders.map((reminder) => (
              <div key={reminder.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="pt-1">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminder.isCompleted}
                      onChange={() => handleToggleReminder(reminder.id)}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 border-2 border-slate-300 rounded-lg flex items-center justify-center peer-checked:bg-slate-400 peer-checked:border-slate-400 transition-all">
                      <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transform scale-50 peer-checked:scale-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </label>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-500 line-through decoration-slate-400">{reminder.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Completed on {new Date().toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RemindersPage
