"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Navigation } from "../App"
// search UI removed
import { authApi } from "../utils/api"
import ConfirmModal from "../components/ConfirmModal"
import { Page } from "../App" // Import Page enum for navigation

interface Request {
  id: string
  profileId?: string | null
  senderName: string
  senderAvatar: string
  skill: string
  message: string
  requestType: "incoming" | "outgoing"
  status: "pending" | "accepted" | "rejected"
  sentDate: string
  credits?: number
}

interface Peer {
  id: string
  profileId?: string
  name: string
  avatar?: string
  skill?: string
  connectedSince: string
}

const ManageRequestsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [peers, setPeers] = useState<Peer[]>([])


  const [requests, setRequests] = useState<Request[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const reqs = await authApi.getFriendRequests()
        const frs = await authApi.getFriends()

        const incoming: Request[] = (reqs.success && reqs.data && reqs.data.incoming ? reqs.data.incoming : []).map((r: any) => ({
          id: r.id,
          profileId: r.profileId || r.profile_id || r.userId || null,
          senderName: r.name,
          senderAvatar: r.profilePic || "/asset/p1.jfif",
          skill: "",
          message: "",
          requestType: "incoming",
          status: "pending",
          sentDate: new Date().toISOString()
        }))

        const outgoing: Request[] = (reqs.success && reqs.data && reqs.data.outgoing ? reqs.data.outgoing : []).map((r: any) => ({
          id: r.id,
          profileId: r.profileId || r.profile_id || r.userId || null,
          senderName: r.name,
          senderAvatar: r.profilePic || "/asset/p1.jfif",
          skill: "",
          message: "",
          requestType: "outgoing",
          status: "pending",
          sentDate: new Date().toISOString()
        }))

        const peersList: Peer[] = (frs.success && frs.data ? frs.data : []).map((f: any) => ({
          id: f.id,
          profileId: f.profileId || null,
          name: f.name,
          avatar: f.profilePic || "/asset/p1.jfif",
          skill: "",
          connectedSince: new Date().toISOString()
        }))

        // mark accepted entries as incoming/outgoing depending on whether friend id appeared in incoming set
        const incomingIds = new Set((reqs.success && reqs.data && reqs.data.incoming ? reqs.data.incoming : []).map((x: any) => x.id))

        setRequests([
          ...incoming,
          ...outgoing,
          ...peersList.map(f => ({
            id: `f-${f.id}`,
            profileId: f.profileId || null,
            senderName: f.name,
            senderAvatar: f.avatar,
            skill: f.skill,
            message: 'You are connected',
            requestType: incomingIds.has(f.id) ? 'incoming' : 'outgoing',
            status: 'accepted',
            sentDate: f.connectedSince
          }))
        ])

        setPeers(peersList)
      } catch (e) {
        // fallback: keep empty lists
      }
    }

    load()

    const onUpdate = () => {
      load()
    }

    window.addEventListener('friends:changed', onUpdate)
    window.addEventListener('friendRequests:changed', onUpdate)
    return () => {
      window.removeEventListener('friends:changed', onUpdate)
      window.removeEventListener('friendRequests:changed', onUpdate)
    }
  }, [])

  const filteredRequests = requests.filter((request) => request.requestType === "incoming")

  const handleAcceptRequest = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (!req) return
      ; (async () => {
        try {
          const resp = await authApi.respondFriendRequest(req.id, 'accept')
          if (resp.success) {
            // optimistic UI update: mark request accepted and add friend locally
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r))
            addPeer({ id: `f-${req.id}`, name: req.senderName, avatar: req.senderAvatar, skill: req.skill, connectedSince: new Date().toISOString() })

            // notify other pages to refresh (keeps global state consistent)
            window.dispatchEvent(new CustomEvent('friendRequests:changed'))
            window.dispatchEvent(new CustomEvent('friends:changed'))
          }
        } catch (e) { }
      })()
  }

  const addPeer = (f: Peer) => {
    setPeers((prev) => {
      if (prev.some((p) => p.name === f.name)) return prev
      return [f, ...prev]
    })
  }

  const removePeer = (id: string) => {
    ; (async () => {
      try {
        const resp = await authApi.removeFriend(id)
        if (resp.success) {
          // optimistic remove from local state
          setPeers(prev => prev.filter(f => f.id !== id))
          setRequests(prev => prev.filter(r => r.id !== `f-${id}`))

          window.dispatchEvent(new CustomEvent('friends:changed'))
          window.dispatchEvent(new CustomEvent('friendRequests:changed'))
        }
      } catch (e) { }
    })()
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name?: string } | null>(null)

  const openRemoveConfirm = (id: string, name?: string) => {
    setConfirmTarget({ id, name })
    setConfirmOpen(true)
  }

  const handleConfirmRemove = () => {
    if (!confirmTarget) return
    removePeer(confirmTarget.id)
    setConfirmOpen(false)
    setConfirmTarget(null)
  }

  const handleCancelRemove = () => {
    setConfirmOpen(false)
    setConfirmTarget(null)
  }

  const handleRejectRequest = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (!req) return
      ; (async () => {
        try {
          const resp = await authApi.respondFriendRequest(req.id, 'reject')
          if (resp.success) {
            // optimistic UI update: mark as rejected immediately
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
            window.dispatchEvent(new CustomEvent('friendRequests:changed'))
          }
        } catch (e) { }
      })()
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

  const SlideAction: React.FC<{
    onAccept: () => void
    onReject: () => void
    acceptLabel?: string
    rejectLabel?: string
  }> = ({ onAccept, onReject, acceptLabel = "Accept", rejectLabel = "Decline" }) => {
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
            {/* right teal fill anchored to right */}
            <div
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                right: 0,
                width: `${100 - percent}%`,
                background: "#0F4C5C",
              }}
            />
            <div className="absolute inset-0 flex items-center px-5 pointer-events-none">
              <div className="flex-1 text-left text-white text-sm font-semibold" style={{ color: "rgba(0,0,0,0.6)" }}>
                {rejectLabel}
              </div>
              <div className="flex-1 text-right text-white text-sm font-semibold" style={{ color: "white" }}>
                {acceptLabel}
              </div>
            </div>
            <div
              onPointerDown={handlePointerDown}
              className="absolute top-1/2 -translate-y-1/2 bg-teal-700 shadow-2xl rounded-full"
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

  const RequestCard: React.FC<{ request: Request }> = ({ request }) => (
    <div className="group bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 hover:shadow-2xl hover:shadow-cyan-100/50 transition-all duration-300 relative overflow-hidden">
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl p-1 bg-white shadow-sm border border-slate-100 relative">
            <img
              src={request.senderAvatar || "/placeholder.svg"}
              alt={request.senderName}
              className="w-full h-full rounded-xl object-cover cursor-pointer"
              onClick={() => { sessionStorage.setItem('selectedProfileId', request.profileId || request.id); navigation.navigateTo(Page.ViewProfile) }}
            />
            {request.requestType === 'incoming' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-teal rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-slate-800 truncate cursor-pointer hover:text-brand-teal transition-colors" onClick={() => { sessionStorage.setItem('selectedProfileId', request.profileId || request.id); navigation.navigateTo(Page.ViewProfile) }}>{request.senderName}</h3>
            {request.skill && (
              <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-full mt-1 truncate max-w-full">
                {request.skill}
              </span>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ml-2 ${getStatusBadge(request.status)}`}
        >
          {getStatusLabel(request.status)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6 text-xs font-medium text-slate-400 relative z-10">
        <div className="flex items-center gap-1.5 basic-badge">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{new Date(request.sentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
        {request.credits && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <span>🪙</span> {request.credits} credits
          </span>
        )}
      </div>

      {request.status === "pending" && request.requestType === "incoming" && (
        <div className="relative z-10 pt-2 border-t border-slate-100">
          <SlideAction
            onAccept={() => handleAcceptRequest(request.id)}
            onReject={() => handleRejectRequest(request.id)}
            acceptLabel="Accept"
            rejectLabel="Decline"
          />
        </div>
      )}

      {/* Decorative Gradient Blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-cyan-100/50 to-teal-100/50 rounded-full blur-3xl -z-0"></div>
    </div>
  )



  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center sm:items-start gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Manage Requests</h1>
          <p className="text-cyan-50 text-base max-w-2xl">View your incoming connection requests and manage your friend list.</p>
        </div>
      </div>

      {/* Friends Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand-teal rounded-full"></span>
            My Peers <span className="text-slate-400 font-normal text-base">({peers.length})</span>
          </h2>
          {/* Quick Avatar Stack */}
          <div className="flex -space-x-2 overflow-hidden p-1">
            {peers.slice(0, 6).map((fr) => (
              <div key={fr.id} title={fr.name} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100 shadow-sm overflow-hidden cursor-pointer hover:scale-110 transition-transform relative z-0 hover:z-10" onClick={() => {
                sessionStorage.setItem('selectedProfileId', fr.profileId || fr.id)
                navigation.navigateTo(Page.ViewProfile)
              }}>
                <img src={fr.avatar || '/placeholder.svg'} alt={fr.name} className="w-full h-full object-cover" />
              </div>
            ))}
            {peers.length > 6 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 z-0">
                +{peers.length - 6}
              </div>
            )}
          </div>
        </div>

        {peers.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 italic text-sm">You have no peers yet. Accept a request to connect.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {peers.map((fr) => (
              <div key={fr.id} className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-brand-teal/30 rounded-xl p-3 flex items-center gap-3 transition-all hover:shadow-lg hover:shadow-cyan-100/40">
                <div className="cursor-pointer flex-shrink-0" onClick={() => { sessionStorage.setItem('selectedProfileId', fr.profileId || fr.id); navigation.navigateTo(Page.ViewProfile) }}>
                  <img src={fr.avatar || '/placeholder.svg'} alt={fr.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-slate-800 truncate cursor-pointer hover:text-brand-teal transition-colors text-sm" onClick={() => { sessionStorage.setItem('selectedProfileId', fr.profileId || fr.id); navigation.navigateTo(Page.ViewProfile) }}>{fr.name}</h4>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      const normalizedId = fr.profileId || (typeof fr.id === 'string' && fr.id.startsWith('f-') ? fr.id.replace(/^f-/, '') : fr.id)
                      sessionStorage.setItem("selectedChatUserId", normalizedId as string)
                      navigation.navigateTo(Page.Messenger)
                      try {
                        window.dispatchEvent(new CustomEvent('open:chat', { detail: normalizedId }))
                      } catch (e) { }
                    }}
                    className="p-1.5 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark shadow-sm transition-colors"
                    title="Message"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </button>
                  <button onClick={() => openRemoveConfirm(fr.id, fr.name)} className="p-1.5 bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors" title="Remove Peer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Remove Peer"
        message={confirmTarget ? `Are you sure you want to remove ${confirmTarget.name || 'this person'} from your peers list?` : 'Are you sure you want to remove this peer?'}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />

      {/* Requests Section */}
      <div className="pt-4">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Incoming Requests
            <span className="bg-brand-teal text-white text-sm font-bold px-2.5 py-0.5 rounded-full shadow-sm">{filteredRequests.length}</span>
          </h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Requests Found</h3>
            <p className="text-slate-500 text-lg">You don't have any incoming connection requests at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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