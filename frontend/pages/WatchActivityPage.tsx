"use client"

import React, { useState, useEffect } from "react"
import { sessionApi, feedbackApi } from '../utils/api'
import FeedbackModal from "../components/FeedbackModal"

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled, className }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

interface Feedback {
  _id: string
  rating: number
  comment: string
  hoursTaught: number
  createdAt: string
  session: {
    _id: string
    skill_id: string
    date: string
    time: string
  }
  learner?: {
    name: string
    profilePic?: string
  }
  teacher?: {
    name: string
    profilePic?: string
  }
}

interface PendingSession {
  _id: string
  teacher_id: {
    name: string
    profilePic?: string
  }
  skill_id: string
  date: string
  time: string
  duration?: string
}

import type { Navigation } from "../App"

const WatchActivityPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"received" | "given" | "pending">("received")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([])

  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [pendingCount, setPendingCount] = useState(0)
  const [receivedCount, setReceivedCount] = useState(0)
  const [givenCount, setGivenCount] = useState(0)

  // Check URL hash for direct navigation
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      if (hash.includes('defaultTab=pending')) {
        setActiveTab('pending')
      }
    }
    checkHash()
  }, [])

  useEffect(() => {
    fetchData()
    // refresh counts when active tab changes
    fetchCounts()
  }, [activeTab])

  // Fetch counts for received/given/pending to show badges on tabs
  const fetchCounts = async () => {
    try {
      const pendingRes = await feedbackApi.getFeedbacks('pending')
      if (Array.isArray(pendingRes)) setPendingCount(pendingRes.length)
      else if (pendingRes && pendingRes.success && Array.isArray(pendingRes.data)) setPendingCount(pendingRes.data.length)
      else setPendingCount(0)

      const receivedRes = await feedbackApi.getFeedbacks('received')
      if (Array.isArray(receivedRes)) setReceivedCount(receivedRes.length)
      else if (receivedRes && receivedRes.success && Array.isArray(receivedRes.data)) setReceivedCount(receivedRes.data.length)
      else setReceivedCount(0)

      const givenRes = await feedbackApi.getFeedbacks('given')
      if (Array.isArray(givenRes)) setGivenCount(givenRes.length)
      else if (givenRes && givenRes.success && Array.isArray(givenRes.data)) setGivenCount(givenRes.data.length)
      else setGivenCount(0)
    } catch (error) {
      console.error('Error fetching feedback counts:', error)
    }
  }

  // Fetch pending count separately to keep it updated regardless of active tab
  useEffect(() => {
    if (activeTab === 'pending') return; // fetchData handles it
    const fetchPendingCount = async () => {
      try {
        const response = await feedbackApi.getFeedbacks('pending')
        if (Array.isArray(response)) {
          setPendingCount(response.length)
        } else if (response && response.success && Array.isArray(response.data)) {
          setPendingCount(response.data.length)
        } else {
          setPendingCount(0)
        }
      } catch (error) {
        console.error("Error fetching pending count:", error)
      }
    }
    fetchPendingCount()
  }, [activeTab]) // Re-fetch when tab changes (in case we processed items)

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pending') {
        const response = await feedbackApi.getFeedbacks('pending')
        if (Array.isArray(response)) {
          setPendingSessions(response)
          setPendingCount(response.length)
        } else if (response && response.success && Array.isArray(response.data)) {
          setPendingSessions(response.data)
          setPendingCount(response.data.length)
        } else {
          setPendingSessions([])
          setPendingCount(0)
        }
      } else {
        const response = await feedbackApi.getFeedbacks(activeTab)
        if (Array.isArray(response)) {
          setFeedbacks(response)
        } else if (response && response.success && Array.isArray(response.data)) {
          setFeedbacks(response.data)
        } else {
          setFeedbacks([])
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async (data: { rating: number; comment: string; reportedHours: number }) => {
    if (!selectedActivity) return

    try {
      let response;
      if (isEditing) {
        // Update existing feedback
        response = await feedbackApi.updateFeedback(selectedActivity._id, {
          rating: data.rating,
          comment: data.comment,
          hoursTaught: data.reportedHours
        })
      } else {
        // Create new feedback
        response = await feedbackApi.createFeedback({
          sessionId: selectedActivity._id,
          rating: data.rating,
          comment: data.comment,
          hoursTaught: data.reportedHours
        })
      }

      if (response.success) {
        setShowFeedbackModal(false)
        setSelectedActivity(null)
        setIsEditing(false)
        fetchData() // Refresh list
        // Refresh counts
        await fetchCounts()
        navigation.showNotification(isEditing ? 'Feedback updated successfully' : 'Feedback submitted successfully')
      } else {
        navigation.showNotification(response.message || 'Action failed')
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    }
  }

  const openFeedbackModal = (item: any, mode: 'give' | 'edit' | 'view') => {
    setSelectedActivity(item)
    setIsEditing(mode === 'edit')
    setShowFeedbackModal(true)
  }



  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const filteredItems = (activeTab === 'pending' ? pendingSessions : feedbacks).filter(item => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    if (activeTab === 'pending') {
      const s = item as PendingSession
      return s.skill_id.toLowerCase().includes(query) || s.teacher_id.name.toLowerCase().includes(query)
    } else {
      const f = item as Feedback
      return f.comment.toLowerCase().includes(query) ||
        f.session.skill_id.toLowerCase().includes(query) ||
        (f.teacher?.name || '').toLowerCase().includes(query) ||
        (f.learner?.name || '').toLowerCase().includes(query)
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Watch Activity</h1>
            <p className="text-cyan-50 text-base mt-1.5">Track feedback and history.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/20 backdrop-blur-md rounded-xl gap-1 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs tracking-wide transition-all ${activeTab === 'received'
            ? 'bg-white text-brand-teal shadow-lg shadow-cyan-900/10'
            : 'bg-white/50 text-slate-600 hover:bg-white'
            }`}
        >
          Received
          {receivedCount > 0 && (
            <span className="bg-slate-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-1.5">
              {receivedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs tracking-wide transition-all ${activeTab === 'given'
            ? 'bg-white text-brand-teal shadow-lg shadow-cyan-900/10'
            : 'bg-white/50 text-slate-600 hover:bg-white'
            }`}
        >
          Given
          {givenCount > 0 && (
            <span className="bg-slate-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-1.5">
              {givenCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 ${activeTab === 'pending'
            ? 'bg-white text-brand-teal shadow-lg shadow-cyan-900/10'
            : 'bg-white/50 text-slate-600 hover:bg-white'
            }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 rounded-xl py-2 pl-10 pr-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all group-hover:bg-white text-sm"
          />
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-hover:text-cyan-500" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No records found.</div>
        ) : (
          filteredItems.map((item: any) => {
            const isPending = activeTab === 'pending'
            const id = isPending ? item._id : item._id

            return (
              <div key={id} className="group bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 hover:shadow-2xl hover:shadow-cyan-100/50 transition-all duration-300 relative overflow-hidden">
                <div className="flex gap-6 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl p-1 bg-white shadow-sm border border-slate-100 overflow-hidden">
                      <img
                        src={isPending ? (item.teacher_id?.profilePic || "/asset/p4.jpg") : (activeTab === 'received' ? (item.learner?.profilePic || "/asset/p4.jpg") : (item.teacher?.profilePic || "/asset/p4.jpg"))}
                        className="w-full h-full rounded-xl object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = "/asset/p4.jpg"}
                      />
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-slate-800">
                          {isPending ? `Pending Feedback for ${item.teacher_id?.name}` :
                            activeTab === 'received' ? `Feedback from ${item.learner?.name}` :
                              `Feedback to ${item.teacher?.name}`}
                        </h4>
                        <p className="text-slate-500 text-sm font-semibold mt-1">
                          {isPending ? item.skill_id : (item.session?.skill_id || 'Unknown Skill')} • {getTimeAgo(isPending ? item.date : item.createdAt)}
                        </p>
                      </div>
                      {!isPending && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} filled={star <= item.rating} className="w-4 h-4 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    {!isPending && (
                      <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-slate-600 italic">"{item.comment}"</p>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-2">Hours Taught: {item.hoursTaught}h</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      {isPending ? (
                        <button
                          onClick={() => openFeedbackModal(item, 'give')}
                          className="bg-brand-teal text-white px-5 py-2.5 rounded-xl font-bold shadow-teal-200/50 hover:bg-brand-teal-dark transition-all"
                        >
                          Give Feedback
                        </button>
                      ) : (
                        // Report Issue Button (only for Teachers receiving feedback)
                        // Report Issue Button REMOVED
                        // Add Edit Feedback Button for Given Feedbacks
                        activeTab === 'given' && (
                          <button
                            onClick={() => openFeedbackModal(item, 'edit')}
                            className="text-brand-teal hover:bg-teal-50 px-5 py-2.5 rounded-xl font-bold border border-teal-100 transition-all flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit Feedback
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => { setShowFeedbackModal(false); setIsEditing(false); }}
        onSubmit={handleFeedbackSubmit}
        navigation={navigation}
        isReadOnly={!isEditing && activeTab !== 'pending'}
        initialData={selectedActivity ? {
          rating: selectedActivity.rating,
          comment: selectedActivity.comment,
          reportedHours: selectedActivity.hoursTaught
        } : undefined}
        sessionDetails={
          activeTab === 'pending' && selectedActivity ? {
            teacherName: selectedActivity.teacher_id?.name,
            skill: selectedActivity.skill_id,
            sessionHours: 0
          } : selectedActivity ? {
            teacherName: selectedActivity.teacher?.name || '',
            skill: selectedActivity.session?.skill_id || ''
          } : undefined
        }
      />



    </div>
  )
}

export default WatchActivityPage