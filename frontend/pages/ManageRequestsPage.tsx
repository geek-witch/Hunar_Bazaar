"use client"

import type React from "react"
import { useState } from "react"
import type { Navigation } from "../App"
import { SearchIcon } from "../components/icons/MiscIcons"

interface Request {
  id: string
  senderName: string
  senderAvatar: string
  skill: string
  message: string
  requestType: "incoming" | "outgoing"
  status: "pending" | "accepted" | "rejected"
  sentDate: string
  credits?: number
}

interface Friend {
  id: string
  name: string
  avatar?: string
  skill?: string
  connectedSince: string
}

const ManageRequestsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all")

  const [friends, setFriends] = useState<Friend[]>([])

  const [requests, setRequests] = useState<Request[]>([
    {
      id: "1",
      senderName: "Ayesha Rana",
      senderAvatar: "/asset/p1.jfif",
      skill: "React Development",
      message: "I would like to learn React from you. I am a beginner and eager to learn.",
      requestType: "incoming",
      status: "pending",
      sentDate: "2024-11-24T10:30:00",
    },
    {
      id: "2",
      senderName: "Ali Khan",
      senderAvatar: "/asset/p2.png",
      skill: "Python Basics",
      message: "Can you teach me Python? I have some programming background.",
      requestType: "incoming",
      status: "pending",
      sentDate: "2024-11-23T15:45:00",
    },
    {
      id: "3",
      senderName: "Jaweria Rehman",
      senderAvatar: "/asset/p3.jpg",
      skill: "UI/UX Design",
      message: "I accepted your request to teach you UI/UX Design!",
      requestType: "outgoing",
      status: "accepted",
      sentDate: "2024-11-22T12:00:00",
    },
    {
      id: "4",
      senderName: "Ahmad Khan",
      senderAvatar: "/asset/p4.jpg",
      skill: "Database Management",
      message: "Sorry, I cannot teach Database Management right now.",
      requestType: "outgoing",
      status: "rejected",
      sentDate: "2024-11-21T09:20:00",
    },
    {
      id: "5",
      senderName: "Emaan Fatima",
      senderAvatar: "/asset/p1.jfif",
      skill: "JavaScript Advanced",
      message: "I would love to learn advanced JavaScript concepts with you.",
      requestType: "incoming",
      status: "accepted",
      sentDate: "2024-11-20T14:15:00",
    },
  ])

  const filteredRequests = requests.filter((request) => {
    const matchesTab = request.requestType === activeTab
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesSearch =
      request.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.skill.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesStatus && matchesSearch
  })

  const handleAcceptRequest = (id: string) => {
    const updated = requests.map((req) => (req.id === id ? { ...req, status: "accepted" as const } : req))
    const acceptedReq = requests.find((r) => r.id === id)
    setRequests(updated)

    // If we accepted an incoming request, add both users as friends (local state)
    if (acceptedReq) {
      // add friend entry for the sender
      addFriend({
        id: `f-${acceptedReq.id}`,
        name: acceptedReq.senderName,
        avatar: acceptedReq.senderAvatar,
        skill: acceptedReq.skill,
        connectedSince: new Date().toISOString(),
      })

      // Optionally: if the request was outgoing and now accepted (someone accepted our request),
      // we also add that connection. Here we're treating all accepts as mutual connections.
    }
  }

  const addFriend = (f: Friend) => {
    setFriends((prev) => {
      if (prev.some((p) => p.name === f.name)) return prev
      return [f, ...prev]
    })
  }

  const removeFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id))
  }

  const handleRejectRequest = (id: string) => {
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "rejected" as const } : req)))
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const RequestCard: React.FC<{ request: Request }> = ({ request }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={request.senderAvatar || "/placeholder.svg"}
            alt={request.senderName}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{request.senderName}</h3>
            <p className="text-sm text-gray-500 truncate">{request.skill}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusBadge(request.status)}`}
        >
          {getStatusLabel(request.status)}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{request.message}</p>

      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
        <span>{new Date(request.sentDate).toLocaleDateString()}</span>
        {request.credits && (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
            {request.credits} credits
          </span>
        )}
      </div>

      {request.status === "pending" && request.requestType === "incoming" && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAcceptRequest(request.id)}
            className="flex-1 bg-brand-teal text-white py-2 px-4 rounded-lg hover:bg-brand-teal-dark transition-colors text-sm font-medium"
          >
            Accept
          </button>
          <button
            onClick={() => handleRejectRequest(request.id)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  )

  const pendingCount = requests.filter((r) => r.requestType === activeTab && r.status === "pending").length
  const acceptedCount = requests.filter((r) => r.requestType === activeTab && r.status === "accepted").length
  const rejectedCount = requests.filter((r) => r.requestType === activeTab && r.status === "rejected").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Manage Requests</h1>
        
      </div>

      {/* Friends Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Friends</p>
            <p className="text-2xl font-bold">{friends.length}</p>
          </div>
          <div className="flex gap-2">
            {friends.slice(0, 6).map((fr) => (
              <div key={fr.id} title={fr.name} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm overflow-hidden">
                <img src={fr.avatar || '/placeholder.svg'} alt={fr.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">You have no friends yet. Accept a request to connect.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {friends.map((fr) => (
              <div key={fr.id} className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                <img src={fr.avatar || '/placeholder.svg'} alt={fr.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 truncate">{fr.name}</h4>
                    <span className="text-xs text-gray-500">{new Date(fr.connectedSince).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500">{fr.skill}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="text-sm bg-brand-teal text-white px-3 py-1 rounded-lg">Message</button>
                  <button onClick={() => removeFriend(fr.id)} className="text-sm bg-gray-100 px-3 py-1 rounded-lg">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-blue-500">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Accepted</p>
          <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-4">
  {/* Incoming Requests Button */}
  <button
    onClick={() => setActiveTab("incoming")}
    className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
      activeTab === "incoming"
        ? "bg-brand-teal text-white shadow-md"
        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
    }`}
  >
    Incoming Requests
  </button>

  {/* Sent Requests Button */}
  <button
    onClick={() => setActiveTab("outgoing")}
    className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
      activeTab === "outgoing"
        ? "bg-brand-teal text-white shadow-md"
        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
    }`}
  >
    Sent Requests
  </button>
</div>


      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 rounded-lg py-2 pl-10 pr-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              />
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                statusFilter === "all" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                statusFilter === "pending" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                statusFilter === "accepted" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                statusFilter === "rejected" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div>
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requests Found</h3>
            <p className="text-gray-500">
              {activeTab === "incoming"
                ? "You don't have any incoming requests yet"
                : "You haven't sent any requests yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageRequestsPage
