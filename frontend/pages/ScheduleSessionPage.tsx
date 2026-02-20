"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Navigation } from "../App"
import { SearchIcon } from "../components/icons/MiscIcons"
import FeedbackModal from "../components/FeedbackModal"
import { sessionApi, authApi, feedbackApi, profileApi } from "../utils/api"

interface Session {
  id: string
  tutorName: string
  tutorAvatar: string
  skill: string
  date: string
  time: string
  duration?: string
  status: "upcoming" | "completed" | "cancelled" | "expired" | "cancelled_by_teacher"
  type: "teaching" | "learning"
  meeting_room?: string
  participantCount?: number
  participantNames?: string[]
  skillClaimed?: boolean
  feedbackGiven?: boolean
}

interface Peer {
  id: string
  name: string
  email: string
  profilePic: string | null
}

const ScheduleSessionPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming")
  const [activeFilter, setActiveFilter] = useState<"all" | "teaching" | "learning">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [peers, setPeers] = useState<Peer[]>([])
  const [teachSkills, setTeachSkills] = useState<string[]>([])
  const [loadingPeers, setLoadingPeers] = useState(false)
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: '', onConfirm: () => { } })

  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null)

  const [newSession, setNewSession] = useState({
    studentIds: [] as string[],
    skill: "",
    date: "",
    time: "",
    duration: "1",
  })
  const [fieldErrors, setFieldErrors] = useState<{
    studentIds?: string
    skill?: string
    date?: string
    time?: string
  }>({})
  const [selectedStudents, setSelectedStudents] = useState<Peer[]>([])

  useEffect(() => {
    fetchSessions()
  }, [activeTab, activeFilter, searchQuery])

  useEffect(() => {
    if (showNewSessionModal) {
      fetchPeers()
      fetchTeachSkills()
    }
  }, [showNewSessionModal])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      // always send explicit filter value ('all'|'teaching'|'learning')
      const filter = activeFilter
      const search = searchQuery.trim() || undefined

      // map UI tabs to API status param explicitly so sessions are categorized correctly
      let statusParam: 'upcoming' | 'completed' | 'cancelled_expired' = 'upcoming';
      if (activeTab === 'completed') statusParam = 'completed';
      else if (activeTab === 'cancelled') statusParam = 'cancelled_expired';

      const response = await sessionApi.getSessions(filter === 'all' ? undefined : filter, search, statusParam as any)

      if (response && response.success) {
        setSessions(response.data || [])
      } else if (Array.isArray(response)) {
        setSessions(response)
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPeers = async () => {
    try {
      setLoadingPeers(true)
      const response = await authApi.getFriends()
      if (response.success && response.data) {
        setPeers(response.data)
      }
    } catch (error) {
      console.error('Error fetching peers:', error)
    } finally {
      setLoadingPeers(false)
    }
  }

  const fetchTeachSkills = async () => {
    try {
      setLoadingSkills(true)
      const response = await authApi.getProfile()
      if (response.success && response.data) {
        const profileData = response.data as any
        if (profileData.teachSkills && Array.isArray(profileData.teachSkills)) {
          setTeachSkills(profileData.teachSkills)
        }
      }
    } catch (error) {
      console.error('Error fetching teach skills:', error)
    } finally {
      setLoadingSkills(false)
    }
  }

  const displaySessions = sessions

  const validateField = (field: string, value?: string) => {
    const errors: typeof fieldErrors = {}

    if (field === 'studentIds' || field === 'all') {
      const studentIds = field === 'studentIds' ? (value ? [value] : []) : newSession.studentIds
      if (!studentIds || studentIds.length === 0) {
        errors.studentIds = 'Please select at least one student'
      }
    }

    if (field === 'skill' || field === 'all') {
      const skill = field === 'skill' ? value : newSession.skill
      if (!skill) {
        errors.skill = 'Please select a skill'
      }
    }

    if (field === 'date' || field === 'all') {
      const date = field === 'date' ? value : newSession.date
      if (!date) {
        errors.date = 'Please select a date'
      } else {
        const selectedDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) {
          errors.date = 'Date must be in the future'
        }
      }
    }

    if (field === 'time' || field === 'all') {
      const time = field === 'time' ? value : newSession.time
      const date = field === 'time' ? newSession.date : newSession.date
      if (!time) {
        errors.time = 'Please select a time'
      } else if (date) {
        const dateTimeStr = `${date}T${time}`
        const selectedDateTime = new Date(dateTimeStr)
        const now = new Date()
        if (selectedDateTime <= now) {
          errors.time = 'Date and time must be in the future'
        }
      }
    }

    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleCreateSession = async () => {
    const isValid = validateField('all', '')

    if (!isValid) {
      return
    }

    setIsCreatingSession(true)
    try {
      const response = await sessionApi.createSession({
        learner_ids: newSession.studentIds,
        skill_id: newSession.skill,
        date: newSession.date,
        time: newSession.time,
      })

      if (response.success) {
        setShowNewSessionModal(false)
        setNewSession({
          studentIds: [],
          skill: "",
          date: "",
          time: "",
          duration: "1",
        })
        setSelectedStudents([])
        setFieldErrors({})
        fetchSessions()
        const participantCount = newSession.studentIds.length
        navigation.showNotification(`Session created successfully with ${participantCount} student${participantCount > 1 ? 's' : ''}`)
      } else {
        navigation.showNotification(response.message || 'Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      navigation.showNotification('Failed to create session')
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleCancelSession = async (id: string) => {
    setConfirmDialog({
      show: true,
      message: 'Are you sure you want to cancel this session?',
      onConfirm: async () => {
        setConfirmDialog({ show: false, message: '', onConfirm: () => { } })
        try {
          const response = await sessionApi.cancelSession(id)
          if (response.success) {
            fetchSessions()
            navigation.showNotification('Session Cancelled Successfully')
          } else {
            navigation.showNotification(response.message || 'Failed to cancel session')
          }
        } catch (error) {
          console.error('Error cancelling session:', error)
          navigation.showNotification('Failed to cancel session')
        }
      }
    })
  }

  const handleJoinSession = async (session: Session) => {
    try {
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      const now = new Date();

      if (now < sessionDateTime) {
        const timeString = session.time;
        const sessionDate = new Date(session.date).toLocaleDateString();
        navigation.showNotification(`Session starts at ${timeString} on ${sessionDate} — link will be active then.`);
        return;
      }

      const response = await sessionApi.joinSession(session.id);

      if (response.success) {
        navigation.setCurrentPage('Meeting', { sessionId: session.id });
      } else {
        navigation.showNotification(response.message || 'Failed to join session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      navigation.showNotification('Failed to join session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    setConfirmDialog({
      show: true,
      message: 'Are you sure you want to delete this session from your history? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ show: false, message: '', onConfirm: () => { } })
        try {
          const response = await sessionApi.deleteSession(id)
          if (response.success) {
            fetchSessions()
            navigation.showNotification('Deleted Successfully')
          } else {
            navigation.showNotification(response.message || 'Failed to delete session')
          }
        } catch (error) {
          console.error('Error deleting session:', error)
          navigation.showNotification('Failed to delete session')
        }
      }
    })
  }

  const handleCompleteSession = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    try {
      const response = await sessionApi.completeSession(id)
      if (response.success) {
        fetchSessions()
        if (session && session.type === 'learning') {
          setFeedbackSession(session)
          setShowFeedbackModal(true)
        } else {
          navigation.showNotification('Session marked as completed')
        }
      } else {
        navigation.showNotification(response.message || 'Failed to complete session')
      }
    } catch (error) {
      console.error('Error completing session:', error)
      navigation.showNotification('Failed to complete session')
    }
  }

  const handleFeedbackSubmit = async (data: { rating: number; comment: string; reportedHours: number }) => {
    if (!feedbackSession) return

    try {
      const response = await feedbackApi.createFeedback({
        sessionId: feedbackSession.id,
        rating: data.rating,
        comment: data.comment,
        hoursTaught: data.reportedHours
      })

      if (response.success) {
        setShowFeedbackModal(false)
        setFeedbackSession(null)
        navigation.showNotification('Feedback submitted successfully!')
      } else {
        navigation.showNotification(response.message || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      navigation.showNotification('Failed to submit feedback')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      cancelled_by_teacher: "bg-red-100 text-red-700",
      expired: "bg-gray-100 text-gray-700",
    }
    return styles[status as keyof typeof styles] || styles.upcoming
  }

  const SlideAction: React.FC<{
    onAccept: () => void
    onReject: () => void
    acceptLabel?: string
    rejectLabel?: string
  }> = ({ onAccept, onReject, acceptLabel = "Join", rejectLabel = "Cancel" }) => {
    const [percent, setPercent] = useState(50)
    const trackRef = useRef<HTMLDivElement | null>(null)
    const dragging = useRef(false)

    const updateFromClientX = (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      const p = Math.round((x / rect.width) * 100)
      setPercent(p)
    }

    const handlePointerDown = (e: React.PointerEvent) => {
      dragging.current = true
        ; (e.target as Element).setPointerCapture?.(e.pointerId)
      updateFromClientX(e.clientX)
    }

    useEffect(() => {
      const onMove = (ev: PointerEvent) => {
        if (!dragging.current) return
        updateFromClientX(ev.clientX)
      }
      const onUp = () => {
        if (!dragging.current) return
        dragging.current = false
        if (percent >= 90) {
          onAccept()
        } else if (percent <= 10) {
          onReject()
        }
        setPercent(50)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      return () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }
    }, [percent, onAccept, onReject])

    const knobSize = 56

    return (
      <div className="w-full flex justify-center">
        <div ref={trackRef} className="relative w-full max-w-full" style={{ userSelect: "none" }}>
          <div className="h-10 rounded-full bg-gray-100 overflow-hidden relative">
            <div
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                right: 0,
                width: `${100 - percent}%`,
                background: "#0F4C5C",
              }}
            />
            <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
              <div className="flex-1 text-left text-white text-sm font-semibold" style={{ color: "rgba(0,0,0,0.6)" }}>
                {rejectLabel}
              </div>
              <div className="flex-1 text-right text-white text-sm font-semibold" style={{ color: "white" }}>
                {acceptLabel}
              </div>
            </div>
            <div
              onPointerDown={handlePointerDown}
              className="absolute top-1/2 -translate-y-1/2 shadow-2xl rounded-full"
              style={{
                width: knobSize,
                height: knobSize,
                left: `calc(${percent}% - ${knobSize / 2}px)`,
                transition: "left 150ms ease",
                boxShadow: "0 10px 20px rgba(2,6,23,0.15)",
                background: "#053847",
                touchAction: "none",
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const SessionCard: React.FC<{ session: Session }> = ({ session }) => (
    <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-cyan-100/50 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row border border-slate-100">

      {/* Left decorative bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${session.status === 'upcoming' ? 'bg-brand-teal' :
        session.status === 'completed' ? 'bg-emerald-500' :
          'bg-slate-300'
        }`}></div>

      <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6 relative z-10">
        {/* Top Row: User Info & Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl p-1 bg-white shadow-sm border border-slate-100 overflow-hidden">
                <img
                  src={session.tutorAvatar || "/asset/p4.jpg"}
                  alt={session.tutorName}
                  className="w-full h-full rounded-xl object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/asset/p4.jpg" }}
                />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${session.type === 'teaching' ? 'bg-brand-teal' : 'bg-purple-500'
                }`}>
                {session.type === 'teaching' ? 'T' : 'L'}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl text-slate-800 leading-tight">{session.tutorName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-sm font-medium">Session on</span>
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-lg border border-cyan-100">
                  {session.skill}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${session.status === 'upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100' :
              session.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                'bg-slate-50 text-slate-500 border-slate-100'
              }`}>
              {session.status === 'cancelled_by_teacher' ? 'Cancelled' : session.status}
            </span>

            {/* Mark Completed Checkbox */}
            {session.status === 'upcoming' && (
              <label className="flex items-center gap-2 cursor-pointer group/check opacity-60 hover:opacity-100 transition-opacity">
                <input
                  type="checkbox"
                  onChange={(e) => { if (e.target.checked) handleCompleteSession(session.id) }}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-slate-400 group-hover/check:text-brand-teal underline decoration-dashed underline-offset-2">
                  {session.type === 'teaching' ? 'Mark Taught' : 'Mark Learned'}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Middle Row: Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Date</p>
            <p className="text-sm font-bold text-slate-700">
              {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Time</p>
            <p className="text-sm font-bold text-slate-700">{session.time}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              {session.type === 'teaching' ? 'Students' : 'Participants'}
            </p>
            <p className="text-sm font-bold text-slate-700">
              {session.participantCount && session.participantCount > 1
                ? `${session.participantCount} People`
                : session.type === 'teaching' ? '1 Student' : 'Individual'}
            </p>
          </div>
          <div className="flex items-center justify-end">
            {/* Skill Completion Button Logic */}
            {session.status === 'completed' && session.type === 'learning' && (
              session.skillClaimed ? (
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Skill Mastered
                </span>
              ) : (
                <button
                  onClick={async () => {
                    // Check if feedback has been given
                    if (!session.feedbackGiven) {
                      navigation.showNotification('Please provide feedback for your teacher from the Activity page before marking this skill as mastered');
                      return;
                    }

                    try {
                      const res = await profileApi.masterSkill(session.id);
                      if (res.success) {
                        navigation.showNotification('Congratulations!!.');
                        // Refresh sessions to show updated state
                        fetchSessions();
                      } else {
                        navigation.showNotification(res.message || 'Failed to mark skill');
                      }
                    } catch (e) { console.error(e) }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all text-center"
                >
                  Mark as Mastered?
                </button>
              )
            )}
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {/* Participants list if multiple */}
          {session.type === 'teaching' && session.participantNames && session.participantNames.length > 1 ? (
            <div className="flex -space-x-2">
              {session.participantNames.slice(0, 3).map((name, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={name}>
                  {name.charAt(0)}
                </div>
              ))}
              {session.participantNames.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                  +{session.participantNames.length - 3}
                </div>
              )}
            </div>
          ) : <div></div>}

          <div className="flex gap-3">
            {session.status === "upcoming" && (
              <div className="w-48">
                <SlideAction
                  onAccept={() => handleJoinSession(session)}
                  onReject={() => handleCancelSession(session.id)}
                  acceptLabel="Join"
                  rejectLabel="Cancel"
                />
              </div>
            )}

            {(session.status === "completed" || session.status === "cancelled" || session.status === "expired" || session.status === "cancelled_by_teacher") && (
              <button
                onClick={() => handleDeleteSession(session.id)}
                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all text-xs font-bold uppercase tracking-wide flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Decorative blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-cyan-400/10 to-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Schedule Sessions</h1>
            <p className="text-cyan-50 mt-1.5 text-base">Manage your teaching and learning journey</p>
          </div>
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="bg-white text-brand-teal px-6 py-2 rounded-full hover:bg-cyan-50 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-bold flex items-center gap-2 shadow-sm text-sm"
          >
            <span>+</span> New Session
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 text-center">
          <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-slate-700 mb-1.5">Loading Sessions...</h3>
        </div>
      ) : (
        <>
          <div className="flex p-1 bg-white/20 backdrop-blur-md rounded-xl gap-1 mb-6 overflow-x-auto">
            {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs tracking-wide transition-all capitalize whitespace-nowrap ${activeTab === tab
                  ? 'bg-white text-brand-teal shadow-lg shadow-cyan-900/10'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                {tab === 'cancelled' ? 'Cancelled / Expired' : tab}
              </button>
            ))}
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-teal focus:border-brand-teal text-sm transition duration-150 ease-in-out shadow-sm"
              placeholder="Search sessions by tutor, skill, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mb-5 px-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeFilter === 'all'
                ? 'bg-brand-teal text-white border-brand-teal'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/50'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('teaching')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeFilter === 'teaching'
                ? 'bg-brand-teal text-white border-brand-teal'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/50'
                }`}
            >
              Teaching
            </button>
            <button
              onClick={() => setActiveFilter('learning')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeFilter === 'learning'
                ? 'bg-brand-teal text-white border-brand-teal'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/50'
                }`}
            >
              Learning
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <span className={`w-1.5 h-6 rounded-full ${activeTab === 'upcoming' ? 'bg-brand-teal' :
                activeTab === 'completed' ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
              {activeTab === 'cancelled' ? 'Cancelled & Expired' : activeTab} Sessions
              <span className="text-slate-400 text-base font-normal">({displaySessions.length})</span>
            </h2>

            {displaySessions.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-lg shadow-slate-200/60 border border-dashed border-slate-300 text-center">
                <div className="text-5xl mb-5 opacity-80">
                  {activeTab === 'upcoming' ? '📅' : activeTab === 'completed' ? '✅' : '🚫'}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1.5 capitalize">No {activeTab} Sessions</h3>
                {activeTab === 'upcoming' && (
                  <p className="text-slate-500 text-base">Schedule a new session to get started!</p>
                )}
                <button
                  onClick={() => setShowNewSessionModal(true)}
                  className="mt-5 text-brand-teal font-bold hover:underline text-sm"
                >
                  Schedule New Session &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displaySessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Schedule New Session</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teaching</label>
                <div className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-600">
                  You are scheduling a teaching session
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Students ({selectedStudents.length} selected)
                </label>
                {loadingPeers ? (
                  <div className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-500">
                    Loading peers...
                  </div>
                ) : peers.length === 0 ? (
                  <div className="w-full border border-red-300 rounded-lg p-2 bg-red-50 text-red-600 text-sm">
                    No peers available. Add peers to schedule sessions.
                  </div>
                ) : (
                  <>
                    {selectedStudents.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {selectedStudents.map((student) => (
                          <div
                            key={student.id}
                            className="bg-brand-teal text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            <span>{student.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSelected = selectedStudents.filter(s => s.id !== student.id)
                                setSelectedStudents(newSelected)
                                setNewSession({
                                  ...newSession,
                                  studentIds: newSelected.map(s => s.id)
                                })
                                if (newSelected.length > 0 && fieldErrors.studentIds) {
                                  setFieldErrors(prev => {
                                    const newErrors = { ...prev }
                                    delete newErrors.studentIds
                                    return newErrors
                                  })
                                }
                              }}
                              className="text-white hover:text-gray-200 text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedFriend = peers.find(f => f.id === e.target.value)
                          if (selectedFriend && !selectedStudents.find(s => s.id === selectedFriend.id)) {
                            const newSelected = [...selectedStudents, selectedFriend]
                            setSelectedStudents(newSelected)
                            setNewSession({
                              ...newSession,
                              studentIds: newSelected.map(s => s.id)
                            })
                            if (fieldErrors.studentIds) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev }
                                delete newErrors.studentIds
                                return newErrors
                              })
                            }
                          }
                        }
                      }}
                      className={`w-full border rounded-lg p-2 ${fieldErrors.studentIds ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">
                        {selectedStudents.length === 0
                          ? "Select students..."
                          : "Add more students..."
                        }
                      </option>
                      {peers
                        .filter(friend => !selectedStudents.find(s => s.id === friend.id))
                        .map((friend) => (
                          <option key={friend.id} value={friend.id}>
                            {friend.name}
                          </option>
                        ))}
                    </select>
                    {fieldErrors.studentIds && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.studentIds}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      You can select multiple students for a group session
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                {loadingSkills ? (
                  <div className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-500">
                    Loading skills...
                  </div>
                ) : teachSkills.length === 0 ? (
                  <div className="w-full border border-red-300 rounded-lg p-2 bg-red-50 text-red-600 text-sm">
                    No skills available. Add skills you can teach in your profile.
                  </div>
                ) : (
                  <>
                    <select
                      value={newSession.skill}
                      onChange={(e) => {
                        setNewSession({ ...newSession, skill: e.target.value })
                        if (e.target.value && fieldErrors.skill) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.skill
                            return newErrors
                          })
                        } else if (!e.target.value) {
                          validateField('skill', e.target.value)
                        }
                      }}
                      onBlur={() => validateField('skill', newSession.skill)}
                      className={`w-full border rounded-lg p-2 ${fieldErrors.skill ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select a skill</option>
                      {teachSkills.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.skill && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.skill}</p>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => {
                      setNewSession({ ...newSession, date: e.target.value })
                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        if (selectedDate >= today) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.date
                            return newErrors
                          })
                          if (newSession.time) {
                            const dateTimeStr = `${e.target.value}T${newSession.time}`
                            const selectedDateTime = new Date(dateTimeStr)
                            const now = new Date()
                            if (selectedDateTime > now) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev }
                                delete newErrors.time
                                return newErrors
                              })
                            } else {
                              validateField('time', newSession.time)
                            }
                          }
                        } else {
                          validateField('date', e.target.value)
                        }
                      } else {
                        validateField('date', e.target.value)
                      }
                    }}
                    onBlur={() => validateField('date', newSession.date)}
                    className={`w-full border rounded-lg p-2 ${fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {fieldErrors.date && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => {
                      setNewSession({ ...newSession, time: e.target.value })
                      if (e.target.value && newSession.date) {
                        const dateTimeStr = `${newSession.date}T${e.target.value}`
                        const selectedDateTime = new Date(dateTimeStr)
                        const now = new Date()
                        if (selectedDateTime > now) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.time
                            return newErrors
                          })
                        } else {
                          validateField('time', e.target.value)
                        }
                      } else if (e.target.value && !newSession.date) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.time
                          return newErrors
                        })
                      } else if (!e.target.value) {
                        validateField('time', e.target.value)
                      }
                    }}
                    onBlur={() => validateField('time', newSession.time)}
                    className={`w-full border rounded-lg p-2 ${fieldErrors.time ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {fieldErrors.time && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.time}</p>
                  )}
                </div>
              </div>
            </div>

            {isCreatingSession && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-green-700 text-sm font-medium">Session is scheduling please wait...</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (!isCreatingSession) {
                    setShowNewSessionModal(false)
                    setNewSession({
                      studentIds: [],
                      skill: "",
                      date: "",
                      time: "",
                      duration: "1",
                    })
                    setSelectedStudents([])
                    setFieldErrors({})
                  }
                }}
                disabled={isCreatingSession}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="flex-1 bg-brand-teal text-white py-2 px-4 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingSession ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Scheduling...</span>
                  </>
                ) : (
                  'Schedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-l-4 border-brand-teal">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-teal/10">
                  <svg className="h-6 w-6 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Action</h3>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog({ show: false, message: '', onConfirm: () => { } })}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 bg-brand-teal text-white py-2 px-4 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false)
          setFeedbackSession(null)
          navigation.showNotification('Feedback details pending. You can submit later from Activity page.')
        }}
        onSubmit={handleFeedbackSubmit}
        navigation={navigation}
        sessionDetails={feedbackSession ? {
          teacherName: feedbackSession.tutorName,
          skill: feedbackSession.skill,
          sessionHours: feedbackSession.duration ? (feedbackSession.duration.includes('hour') ? parseFloat(feedbackSession.duration) : 0.5) : undefined
        } : undefined}
      />
    </div>
  )
}

export default ScheduleSessionPage
