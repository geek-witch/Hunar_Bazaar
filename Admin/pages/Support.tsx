"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MessageCircle, Search, Send, Check, ArrowLeft } from "lucide-react"

interface Ticket {
  id: string
  type: "dispute" | "query" | "complaint"
  title: string
  description: string
  attachment?: string | null
  userName: string
  userInitial: string
  userImage?: string
  status: "pending" | "resolved"
  date: string
  time: string
  priority: "high" | "medium" | "low"
}

interface Comment {
  id: string
  author: string
  role: "admin" | "user"
  message: string
  date: string
  time: string
  avatar: string
  image?: string
}


const Avatar = ({ image, initial, name }: { image?: string; initial: string; name: string }) => {
  const [imageError, setImageError] = useState(false)

  if (image && !imageError) {
    return (
      <img
        src={image || "/placeholder.svg"}
        alt={name}
        onError={() => setImageError(true)}
        className="w-full h-full rounded-full object-cover"
      />
    )
  }

  return (
    <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-gray-400 to-gray-500">
      {initial}
    </div>
  )
}

const API_ROOT_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth$/, '') || 'http://localhost:4000/api';

export default function Support() {
  const [selectedTicket, setSelectedTicket] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyMessage, setReplyMessage] = useState("")
  const [showDetail, setShowDetail] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [comments, setComments] = useState<Record<string, Comment[]>>({
    "1": [
      {
        id: "1",
        author: "Ali Khan",
        role: "user",
        message:
          "I tried to upgrade to Premium yesterday but the amount was deducted and my plan is still Basic. Please help.",
        date: "2023-10-25",
        time: "09:30 AM",
        avatar: "A",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
      },
    ],
    "2": [
      {
        id: "1",
        author: "Zainab Ali",
        role: "user",
        message:
          "I booked a plumber (ID #55) for 2 PM. He never showed up and is not picking up calls. I want a refund of my credits.",
        date: "2023-10-24",
        time: "02:15 PM",
        avatar: "Z",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zainab",
      },
    ],
    "3": [
      {
        id: "1",
        author: "Hassan Ahmed",
        role: "user",
        message: "My account was restricted. I want to appeal this decision and understand the reason.",
        date: "2023-10-20",
        time: "11:45 AM",
        avatar: "H",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan",
      },
    ],
    "4": [
      {
        id: "1",
        author: "Fatima Khan",
        role: "user",
        message: "The service was not up to the standard promised. Looking for compensation.",
        date: "2023-10-19",
        time: "03:20 PM",
        avatar: "F",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima",
      },
    ],
    "5": [
      {
        id: "1",
        author: "Bilal Ahmed",
        role: "user",
        message: "I was charged twice for the same service. Please investigate.",
        date: "2023-10-18",
        time: "10:00 AM",
        avatar: "B",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bilal",
      },
      {
        id: "2",
        author: "Support Team",
        role: "admin",
        message:
          "We have reviewed your account and confirmed the duplicate charge. A refund of 500 PKR has been processed to your original payment method. It will reflect within 3-5 business days.",
        date: "2023-10-18",
        time: "02:30 PM",
        avatar: "ST",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Support",
      },
      {
        id: "3",
        author: "Support Team",
        role: "admin",
        message: "Your case has been resolved. Please let us know if you need any further assistance.",
        date: "2023-10-19",
        time: "09:15 AM",
        avatar: "ST",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Support",
      },
    ],
  })
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, "pending" | "resolved">>({})

  // Fetch issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        const status = activeTab === 'all' ? undefined : activeTab
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (searchTerm.trim()) params.append('search', searchTerm.trim())
        const query = params.toString() ? `?${params.toString()}` : ''

        const response = await fetch(`${API_ROOT_URL}/support/issues${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        const data = await response.json()
        console.log('Admin Support - API Response:', data)
        console.log('Admin Support - Response status:', response.status)
        
        if (!response.ok) {
          setError(data.message || `Failed to fetch issues (${response.status})`)
          console.error('Admin Support - API Error:', data)
          if (response.status === 401) {
            setError('Authentication required. Please login.')
          }
          setTickets([])
        } else if (data.success && Array.isArray(data.data)) {
          setError("")
          setTickets(data.data)
          // Initialize statuses
          const statusMap: Record<string, "pending" | "resolved"> = {}
          data.data.forEach((ticket: Ticket) => {
            statusMap[ticket.id] = ticket.status
          })
          setTicketStatuses(statusMap)
          // Select first ticket if available and none selected
          if (data.data.length > 0 && (!selectedTicket || !data.data.find((t: Ticket) => t.id === selectedTicket))) {
            setSelectedTicket(data.data[0].id)
          } else if (data.data.length === 0) {
            setSelectedTicket("")
          }
        } else {
          console.error('Admin Support - Unexpected response format:', data)
          setError(data.message || 'Unexpected response format')
          setTickets([])
        }
      } catch (error: any) {
        console.error('Error fetching issues:', error)
        setError(`Network error: ${error.message || 'Failed to connect to server'}`)
        setTickets([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchIssues()
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [activeTab, searchTerm])

  // Fetch comments when ticket is selected
  useEffect(() => {
    if (!selectedTicket) return

    const fetchComments = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_ROOT_URL}/support/issues/${selectedTicket}/comments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setComments((prev) => ({
            ...prev,
            [selectedTicket]: data.data,
          }))
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }

    fetchComments()
  }, [selectedTicket])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "query":
        return "text-blue-600 bg-blue-100 border-blue-300"
      case "dispute":
        return "text-red-600 bg-red-100 border-red-300"
      case "complaint":
        return "text-orange-600 bg-orange-100 border-orange-300"
      default:
        return "text-gray-600 bg-gray-100 border-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700"
      case "resolved":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Filtering is now done on the backend, but we can add client-side filtering for search
  const filteredTickets = tickets

  const currentTicket = tickets.find((t) => t.id === selectedTicket)
  const currentComments = comments[selectedTicket] || []
  const currentStatus = ticketStatuses[selectedTicket] || "pending"

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || isSendingReply) return

    setIsSendingReply(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_ROOT_URL}/support/issues/${selectedTicket}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: replyMessage }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh comments
        const commentsResponse = await fetch(`${API_ROOT_URL}/support/issues/${selectedTicket}/comments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const commentsData = await commentsResponse.json()
        if (commentsData.success && Array.isArray(commentsData.data)) {
          setComments((prev) => ({
            ...prev,
            [selectedTicket]: commentsData.data,
          }))
        }
        setReplyMessage("")
      } else {
        alert(data.message || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply. Please try again.')
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleMarkResolved = async () => {
    if (!selectedTicket) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_ROOT_URL}/support/issues/${selectedTicket}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'resolved' }),
      })

      const data = await response.json()
      if (data.success) {
        setTicketStatuses((prev) => ({
          ...prev,
          [selectedTicket]: "resolved",
        }))
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket ? { ...t, status: "resolved" as const } : t)))
      } else {
        alert(data.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicket(ticketId)
    setShowDetail(true)
  }

  const handleBackClick = () => {
    setShowDetail(false)
  }

  return (
    <div className="h-screen bg-[#0E4B5B] p-3 md:p-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 h-full">
        {/* Left Column - Tickets List */}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col ${showDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex border-b border-gray-200">
            {["all", "pending", "resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-semibold text-xs md:text-sm transition-all ${
                  activeTab === tab ? "text-[#0E4B5B] border-b-4 border-[#0E4B5B]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 md:p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#0E4B5B] text-sm"
              />
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 md:p-4">
            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm font-medium">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No tickets found</p>
                {!error && <p className="text-xs mt-2">Issues submitted from the Help Center will appear here.</p>}
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket.id)}
                  className={`w-full p-3 md:p-4 rounded-xl text-left transition-all border-2 ${
                    selectedTicket === ticket.id
                      ? "border-[#0E4B5B] bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getTypeColor(ticket.type)}`}>
                      {ticket.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{ticket.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-3">{ticket.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7">
                        <Avatar image={ticket.userImage} initial={ticket.userInitial} name={ticket.userName} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{ticket.userName}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(ticketStatuses[ticket.id])}`}>
                      {ticketStatuses[ticket.id].charAt(0).toUpperCase() + ticketStatuses[ticket.id].slice(1)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Ticket Details */}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col ${showDetail ? 'flex' : 'hidden lg:flex'}`}>
          {currentTicket ? (
            <>
              <div className="p-3 md:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between mb-2 lg:mb-0">
                  <button
                    onClick={handleBackClick}
                    className="lg:hidden text-[#0E4B5B] font-bold text-sm flex items-center gap-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getTypeColor(currentTicket.type)}`}
                    >
                      {currentTicket.type.toUpperCase()}
                    </span>
                    <span className="text-xs md:text-sm font-medium text-gray-600">
                      Ticket #{currentTicket.id.padStart(3, "0")}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(currentStatus)}`}>
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 bg-gray-50">
                {/* Original Ticket Message */}
                {currentTicket && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full overflow-hidden">
                      <Avatar image={currentTicket.userImage} initial={currentTicket.userInitial} name={currentTicket.userName} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-xs md:text-sm text-gray-900">{currentTicket.userName}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-300 text-gray-700">
                          User
                        </span>
                        <p className="text-xs text-gray-500">
                          {currentTicket.date} {currentTicket.time}
                        </p>
                      </div>
                      <div className="inline-block rounded-lg p-3 bg-white border border-gray-200">
                        <p className="text-xs md:text-sm mb-2">{currentTicket.description}</p>
                        {currentTicket.attachment && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Attachment:</p>
                            <img 
                              src={currentTicket.attachment} 
                              alt="Issue attachment" 
                              className="max-w-full max-h-64 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(currentTicket.attachment || '', '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Comments */}
                {currentComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No admin replies yet</p>
                  </div>
                ) : (
                  currentComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`flex gap-3 ${comment.role === "admin" ? "flex-row-reverse" : ""}`}
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full overflow-hidden">
                        <Avatar image={comment.image} initial={comment.avatar} name={comment.author} />
                      </div>
                      <div className={`flex-1 ${comment.role === "admin" ? "text-right" : ""}`}>
                        <div
                          className={`flex items-center gap-2 mb-1 flex-wrap ${comment.role === "admin" ? "justify-end" : ""}`}
                        >
                          <p className="font-bold text-xs md:text-sm text-gray-900">{comment.author}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              comment.role === "admin" ? "bg-[#0E4B5B] text-white" : "bg-gray-300 text-gray-700"
                            }`}
                          >
                            {comment.role === "admin" ? "Admin" : "User"}
                          </span>
                          <p className="text-xs text-gray-500">
                            {comment.date} {comment.time}
                          </p>
                        </div>
                        <div
                          className={`inline-block rounded-lg p-3 ${
                            comment.role === "admin" ? "bg-[#0E4B5B] text-white" : "bg-white border border-gray-200"
                          }`}
                        >
                          <p className="text-xs md:text-sm">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="p-3 md:p-4 border-t border-gray-200 bg-white space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isSendingReply && handleSendReply()}
                    disabled={isSendingReply}
                    className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#0E4B5B] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="px-3 md:px-4 py-2.5 md:py-3 bg-[#0E4B5B] hover:bg-[#093540] text-white rounded-lg font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingReply ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>

                {currentStatus === "pending" && currentComments.some((c) => c.role === "admin") && (
                  <button
                    onClick={handleMarkResolved}
                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Check size={18} />
                    Mark as Resolved
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}