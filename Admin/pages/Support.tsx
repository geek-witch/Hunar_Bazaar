"use client"

import type React from "react"
import { useState } from "react"
import { MessageCircle, Search, Send, Check, ArrowLeft } from "lucide-react"

interface Ticket {
  id: string
  type: "dispute" | "query" | "complaint"
  title: string
  description: string
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

interface Template {
  id: string
  name: string
  text: string
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

export default function Support() {
  const [selectedTicket, setSelectedTicket] = useState<string>("1")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyMessage, setReplyMessage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showDetail, setShowDetail] = useState(false)
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
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, "pending" | "resolved">>({
    "1": "pending",
    "2": "pending",
    "3": "pending",
    "4": "pending",
    "5": "resolved",
  })

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "1",
      type: "query",
      title: "Payment not processed for Premium",
      description:
        "I tried to upgrade to Premium yesterday but the amount was deducted and my plan is still Basic. Please help.",
      userName: "Ali Khan",
      userInitial: "A",
      userImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
      status: "pending",
      date: "2023-10-25",
      time: "09:30 AM",
      priority: "high",
    },
    {
      id: "2",
      type: "dispute",
      title: "Provider did not show up",
      description:
        "I booked a plumber (ID #55) for 2 PM. He never showed up and is not picking up calls. I want a refund of my credits.",
      userName: "Zainab Ali",
      userInitial: "Z",
      userImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zainab",
      status: "pending",
      date: "2023-10-24",
      time: "02:15 PM",
      priority: "high",
    },
    {
      id: "3",
      type: "query",
      title: "Account restriction appeal",
      description: "My account was restricted. I want to appeal this decision and understand the reason.",
      userName: "Hassan Ahmed",
      userInitial: "H",
      userImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan",
      status: "pending",
      date: "2023-10-20",
      time: "11:45 AM",
      priority: "medium",
    },
    {
      id: "4",
      type: "complaint",
      title: "Poor service quality",
      description: "The service was not up to the standard promised. Looking for compensation.",
      userName: "Fatima Khan",
      userInitial: "F",
      userImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima",
      status: "pending",
      date: "2023-10-19",
      time: "03:20 PM",
      priority: "medium",
    },
    {
      id: "5",
      type: "dispute",
      title: "Billing discrepancy",
      description: "I was charged twice for the same service. Please investigate.",
      userName: "Bilal Ahmed",
      userInitial: "B",
      userImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bilal",
      status: "resolved",
      date: "2023-10-18",
      time: "10:00 AM",
      priority: "high",
    },
  ])

  const templates: Template[] = [
    {
      id: "1",
      name: "Request Approved",
      text: "Your request has been approved. We will process this immediately and you will receive confirmation within 24 hours. Thank you for your patience.",
    },
    {
      id: "2",
      name: "More Info Required ",
      text: "Thank you for bringing this to our attention. We need some additional information to investigate this matter further. Could you please provide: user ID, screen shots, and any supporting documents? This will help us resolve your issue faster.",
    },
    {
      id: "3",
      name: "Insufficient Evidence",
      text: "We have reviewed your complaint. Unfortunately, we do not have sufficient evidence to proceed at this time. Please provide additional documentation or proof to support your claim, such as screenshots, receipts, or communication records.",
    },
  ]

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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = activeTab === "all" || ticketStatuses[ticket.id] === activeTab
    return matchesSearch && matchesTab
  })

  const currentTicket = tickets.find((t) => t.id === selectedTicket)
  const currentComments = comments[selectedTicket] || []
  const currentStatus = ticketStatuses[selectedTicket] || "pending"

  const handleTemplateClick = (template: Template) => {
    const now = new Date()
    const newComment: Comment = {
      id: String(Date.now()),
      author: "Support Team",
      role: "admin",
      message: template.text,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      avatar: "ST",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Support",
    }

    setComments((prev) => ({
      ...prev,
      [selectedTicket]: [...(prev[selectedTicket] || []), newComment],
    }))
    setReplyMessage("")
    setSelectedTemplate(null)
  }

  const handleSendReply = () => {
    if (!replyMessage.trim()) return

    const now = new Date()
    const newComment: Comment = {
      id: String(Date.now()),
      author: "Support Team",
      role: "admin",
      message: replyMessage,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      avatar: "ST",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Support",
    }

    setComments((prev) => ({
      ...prev,
      [selectedTicket]: [...(prev[selectedTicket] || []), newComment],
    }))
    setReplyMessage("")
    setSelectedTemplate(null)
  }

  const handleMarkResolved = () => {
    setTicketStatuses((prev) => ({
      ...prev,
      [selectedTicket]: "resolved",
    }))
    setTickets((prev) => prev.map((t) => (t.id === selectedTicket ? { ...t, status: "resolved" as const } : t)))
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
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No tickets found</p>
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
                {currentComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No messages yet</p>
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

              {/* Templates & Reply Input */}
              <div className="p-3 md:p-4 border-t border-gray-200 bg-white space-y-3">
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateClick(template)}
                      className="text-xs font-medium px-2.5 md:px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-[#0E4B5B] hover:text-[#0E4B5B] transition-all"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                    className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#0E4B5B] text-sm"
                  />
                  <button
                    onClick={handleSendReply}
                    className="px-3 md:px-4 py-2.5 md:py-3 bg-[#0E4B5B] hover:bg-[#093540] text-white rounded-lg font-bold transition-colors flex items-center justify-center"
                  >
                    <Send size={18} />
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