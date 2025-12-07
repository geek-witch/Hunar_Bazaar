"use client"

import React, { useState } from "react"

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
  rating: number
  comment: string
  reportedHours: number
  submittedAt: string
}

interface Complaint {
  message: string
  submittedAt: string
  attachment?: string
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  avatar?: string
  metadata?: {
    skill?: string
    teacherName?: string
    sessionHours?: number
  }
  feedback?: Feedback
  complaint?: Complaint
}

const WatchActivityPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isManualFeedback, setIsManualFeedback] = useState(false)
  const [feedbackReadOnly, setFeedbackReadOnly] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    comment: "",
    reportedHours: 0,
    teacherName: "",
    skill: "",
  })
  const [complaintText, setComplaintText] = useState("")
  const [complaintAttachment, setComplaintAttachment] = useState<string>("")
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "1",
      type: "session_completed",
      title: "Session Completed",
      description: "Completed a React Development session",
      timestamp: "2024-11-24T15:30:00",
      avatar: "/asset/p1.jfif",
      metadata: { skill: "React Development", teacherName: "Ayesha Rana", sessionHours: 2 },
    },
    {
      id: "2",
      type: "session_completed",
      title: "Session Completed",
      description: "Completed a Python session",
      timestamp: "2024-11-24T14:00:00",
      avatar: "/asset/p2.png",
      metadata: { skill: "Python", teacherName: "Ali Khan", sessionHours: 2.5 },
    },
    {
      id: "6",
      type: "session_completed",
      title: "Session Completed",
      description: "Completed a Spanish Language session",
      timestamp: "2024-11-22T16:00:00",
      avatar: "/asset/p3.jpg",
      metadata: { skill: "Spanish Language", teacherName: "Carlos Rodriguez", sessionHours: 1.5 },
      feedback: {
        rating: 5,
        comment: "Excellent teacher! Very patient and knowledgeable.",
        reportedHours: 1.5,
        submittedAt: "2024-11-22T17:00:00"
      },
       complaint: {
        message: "The reported time was incorrect by 15 minutes.",
        submittedAt: "2024-11-22T17:05:00",
        attachment: "time_discrepancy_log.png" // Mock existing attachment
        }
    },
  ])

  // Opens modal for a specific activity (to add or update feedback)
  const openFeedbackModal = (activity: Activity | null = null) => {
    if (activity) {
      // activity-specific feedback
      setSelectedActivity(activity)
      // If activity already has feedback, open in read-only (view) mode
      setFeedbackReadOnly(!!activity.feedback)
      setIsManualFeedback(false)
      setFeedbackForm({
        rating: activity.feedback?.rating || 0,
        comment: activity.feedback?.comment || "",
        reportedHours: activity.feedback?.reportedHours ?? activity.metadata?.sessionHours ?? 0,
        teacherName: activity.metadata?.teacherName || "",
        skill: activity.metadata?.skill || "",
      })
    } else {
      // manual new feedback (no activity)
      setSelectedActivity(null)
      setFeedbackReadOnly(false)
      setIsManualFeedback(true)
      setFeedbackForm({
        rating: 0,
        comment: "",
        reportedHours: 0,
        teacherName: "",
        skill: "",
      })
    }
    setShowFeedbackModal(true)
  }

  // Submit feedback: either update existing activity (set feedback) or create a new activity with feedback
  const submitFeedback = () => {
    // sanitize hours: never negative
    const safeHours = Math.max(0, Number(feedbackForm.reportedHours) || 0)

    if (isManualFeedback) {
      // create a new activity with provided metadata + feedback
      const newActivity: Activity = {
        id: String(Date.now()),
        type: "session_completed",
        title: "Session (manual feedback)",
        description: `Manual feedback for ${feedbackForm.skill || "a session"}`,
        timestamp: new Date().toISOString(),
        avatar: undefined,
        metadata: {
          skill: feedbackForm.skill || undefined,
          teacherName: feedbackForm.teacherName || undefined,
          sessionHours: safeHours,
        },
        feedback: {
          rating: feedbackForm.rating,
          comment: feedbackForm.comment,
          reportedHours: safeHours,
          submittedAt: new Date().toISOString(),
        },
      }

      setActivities((prev) => [newActivity, ...prev])
      // reset modal
      setShowFeedbackModal(false)
      setIsManualFeedback(false)
      setSelectedActivity(null)
      setFeedbackForm({ rating: 0, comment: "", reportedHours: 0, teacherName: "", skill: "" })
      return
    }

    // activity-specific: update the activity's feedback (add or overwrite)
    if (!selectedActivity) return

      // Prevent updating an existing feedback once submitted — view-only mode
      if (selectedActivity.feedback) {
        setShowFeedbackModal(false)
        setSelectedActivity(null)
        setIsManualFeedback(false)
        setFeedbackReadOnly(false)
        setFeedbackForm({ rating: 0, comment: "", reportedHours: 0, teacherName: "", skill: "" })
        return
      }

      const updatedActivities = activities.map((act) => {
      if (act.id === selectedActivity.id) {
        return {
          ...act,
          feedback: {
            rating: feedbackForm.rating,
            comment: feedbackForm.comment,
            reportedHours: safeHours,
            submittedAt: new Date().toISOString(),
          },
          // optionally update metadata.sessionHours to match reported if you want:
          metadata: {
            ...act.metadata,
            // keep teacherName/skill as-is unless user changed them in form (we keep them as-is)
            sessionHours: act.metadata?.sessionHours ?? safeHours,
          }
        }
      }
      return act
    })

    setActivities(updatedActivities)
    setShowFeedbackModal(false)
    setSelectedActivity(null)
    setFeedbackForm({ rating: 0, comment: "", reportedHours: 0, teacherName: "", skill: "" })
  }

   const openComplaintModal = (activity: Activity) => {
    setSelectedActivity(activity)
    setComplaintText(activity.complaint?.message || "")
    setComplaintAttachment(activity.complaint?.attachment || "")
    setShowComplaintModal(true)
  }

  const submitComplaint = () => {
    if (!selectedActivity) return

     if (selectedActivity.complaint) {
      setShowComplaintModal(false)
      setSelectedActivity(null)
      setComplaintText("")
      setComplaintAttachment("")
      return
    }

    const updatedActivities = activities.map(act => {
      if (act.id === selectedActivity.id) {
        return {
          ...act,
          complaint: {
            message: complaintText,
            submittedAt: new Date().toISOString(),
            attachment: complaintAttachment
          }
        }
      }
      return act
    })

    setActivities(updatedActivities)
    setShowComplaintModal(false)
    setSelectedActivity(null)
    setComplaintText("")
    setComplaintAttachment("")
  }

  const filterByTime = (activity: Activity) => {
    const activityDate = new Date(activity.timestamp)
    const now = new Date()

    if (timeFilter === "today") {
      return activityDate.toDateString() === now.toDateString()
    } else if (timeFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return activityDate >= weekAgo
    } else if (timeFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return activityDate >= monthAgo
    }
    return true
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesTime = filterByTime(activity)
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.metadata?.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.metadata?.skill?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTime && matchesSearch
  })

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityDate = new Date(timestamp)

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (activityDate.toDateString() === today.toDateString()) return "Today"
    if (activityDate.toDateString() === yesterday.toDateString()) return "Yesterday"

    return activityDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Activity Log</h1>

        {/* Global Add Feedback button (plus icon area) */}
        <div className="ml-4">
          <button
            onClick={() => openFeedbackModal(null)}
            className="flex items-center gap-2 bg-brand-teal text-white px-4 py-2 rounded-lg shadow-md"
            title="Add manual feedback"
          >
            <span className="text-lg font-bold">+</span>
            <span className="text-sm">Add Feedback</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by teacher name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 rounded-lg py-2 pl-10 pr-4 border border-gray-200"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center">
          <h3 className="text-xl font-semibold text-gray-700">No Sessions Found</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex gap-4">
                {activity.avatar && (
                  <img src={activity.avatar} className="w-12 h-12 rounded-full object-cover" />
                )}

                <div className="flex-grow">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                    <span className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>

                  {/* Teacher Reported Hours */}
                  <p className="text-xs text-gray-700 mb-3">
                    ⏱️ Teacher Reported Hours: <strong>{activity.metadata?.sessionHours}h</strong>
                  </p>

                  {/* Feedback Display */}
                  {activity.feedback && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700">Feedback:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} filled={star <= activity.feedback!.rating} className="w-4 h-4 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{activity.feedback.comment}</p>
                      <p className="text-xs text-gray-600">
                        Reported: {activity.feedback.reportedHours}h
                      </p>
                    </div>
                  )}

                   {/* Complaint Display - shows attachment link if present */}
                  {activity.complaint?.attachment && (
                    <p className="text-xs text-red-600 mt-1">
                      Attachment: **{activity.complaint.attachment}**
                    </p>
                  )}

                  {/* Feedback Button - view if already submitted */}
                  <button
                    onClick={() => openFeedbackModal(activity)}
                    className="text-sm bg-brand-teal text-white px-4 py-2 rounded-lg mr-2"
                  >
                    {activity.feedback ? "View Feedback" : "Give Feedback"}
                  </button>

                  {/* Complaint Button */}
                  <button
                    onClick={() => openComplaintModal(activity)}
                    className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    {activity.complaint ? "View Complaint" : "Report Issue"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {feedbackReadOnly
                ? "View Feedback"
                : isManualFeedback
                ? "Add Feedback "
                : selectedActivity
                ? "Add Feedback"
                : "Add Feedback"}
            </h2>

            {/* If activity-specific, show teacher name and session hours */}
            {!isManualFeedback && selectedActivity && (
              <>
                <p className="text-sm mb-1">Teacher: {selectedActivity.metadata?.teacherName || "—"}</p>
                <p className="text-sm mb-4">Teacher Reported Hours: {selectedActivity.metadata?.sessionHours ?? "—"}h</p>
              </>
            )}

            {/* If manual, allow entering teacher name & skill */}
            {isManualFeedback && (
              <>
                <label className="text-sm font-semibold">Teacher / Learner</label>
                <input
                  type="text"
                  value={feedbackForm.teacherName}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, teacherName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mb-3"
                  placeholder="e.g. Ali Khan"
                />

                <label className="text-sm font-semibold">Skill</label>
                <input
                  type="text"
                  value={feedbackForm.skill}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, skill: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mb-4"
                  placeholder="e.g. React Development"
                />
              </>
            )}

            <label className="text-sm font-semibold">Rating</label>
            <div className="flex gap-2 mt-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    if (feedbackReadOnly) return
                    setFeedbackForm({ ...feedbackForm, rating: star })
                  }}
                  type="button"
                >
                  <StarIcon filled={star <= feedbackForm.rating} className="w-8 h-8 text-yellow-500" />
                </button>
              ))}
            </div>

            <label className="text-sm font-semibold">Hours You Learned</label>
            <input
              type="number"
              min={0}
              value={feedbackForm.reportedHours}
              onChange={(e) => {
                if (feedbackReadOnly) return
                // clamp to >= 0 and handle empty input
                const v = e.target.value === "" ? 0 : Number(e.target.value)
                setFeedbackForm({ ...feedbackForm, reportedHours: Math.max(0, isNaN(v) ? 0 : v) })
              }}
              disabled={feedbackReadOnly}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="text-sm font-semibold">Comment</label>
            <textarea
              value={feedbackForm.comment}
              onChange={(e) => {
                if (feedbackReadOnly) return
                setFeedbackForm({ ...feedbackForm, comment: e.target.value })
              }}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 mb-6"
              disabled={feedbackReadOnly}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setSelectedActivity(null)
                  setIsManualFeedback(false)
                  setFeedbackReadOnly(false)
                  setFeedbackForm({ rating: 0, comment: "", reportedHours: 0, teacherName: "", skill: "" })
                }}
                className="flex-1 bg-gray-200 py-2 rounded-lg"
              >
                Close
              </button>

              {!feedbackReadOnly && (
                <button
                  onClick={submitFeedback}
                  className="flex-1 bg-brand-teal text-white py-2 rounded-lg"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal*/}
      {showComplaintModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {selectedActivity.complaint ? "View Complaint" : "Report an Issue"}
            </h2>

            <p className="text-sm mb-4 text-gray-700">
              If you believe the teacher has entered incorrect hours or there was any issue with the session, you may report it here.
            </p>

            {/* Complaint Textarea */}
            <label className="text-sm font-semibold">Complaint Details</label>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={5}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="Describe the issue..."
              disabled={!!selectedActivity.complaint} // Disable if complaint exists (view-only)
            />

            {/* Attachment Section (NEW) */}
            <div className="mb-6">
              <label className="text-sm font-semibold block mb-2">Attach Screenshot / Image (Optional)</label>

              {selectedActivity.complaint ? (
                // View mode: show existing attachment
                <p className="text-sm text-gray-600">
                  {selectedActivity.complaint.attachment ? (
                    <span>Attached File: <strong className="text-red-600">{selectedActivity.complaint.attachment}</strong></span>
                  ) : (
                    <span>No file attached.</span>
                  )}
                </p>
              ) : (
                // Edit/Add mode: show file input
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    // Mocking file path storage for demonstration
                    const file = e.target.files ? e.target.files[0] : null
                    setComplaintAttachment(file ? file.name : "")
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              )}
            </div>
            {/* End Attachment Section */}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowComplaintModal(false)
                  setSelectedActivity(null)
                  setComplaintText("")
                  setComplaintAttachment("")
                }}
                className="flex-1 bg-gray-200 py-2 rounded-lg"
              >
                Close
              </button>

              {/* Only show submit button if no complaint exists (allow submission) */}
              {!selectedActivity.complaint && (
                <button
                  onClick={submitComplaint}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg"
                  disabled={!complaintText} // Disable if message is empty
                >
                  Submit Complaint
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default WatchActivityPage