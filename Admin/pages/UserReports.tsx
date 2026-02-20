"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, ArrowLeft, AlertCircle, CheckCircle2, Trash2 } from "lucide-react"

interface UserReport {
  id: string
  reportedUserId: string
  reportedUserName: string
  reportedUserEmail: string
  reportedUserAvatar?: string
  reporterId: string
  reporterName: string
  reporterEmail: string
  reporterAvatar?: string
  reason: string
  description?: string
  status: "pending" | "reviewed" | "actioned" | "dismissed"
  adminAction: "none" | "warning" | "suspension" | "deletion"
  adminNotes?: string
  warningsSent: number
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

const Avatar = ({ image, initial, name }: { image?: string; initial: string; name: string }) => {
  const [imageError, setImageError] = useState(false)

  if (image && !imageError) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setImageError(true)}
        className="w-full h-full rounded-full object-cover"
      />
    )
  }

  return (
    <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-purple-400 to-purple-600">
      {initial}
    </div>
  )
}

const API_ROOT_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth$/, '') || 'http://localhost:4000/api';

interface UserReportsPageProps {
  onShowNotification?: (notification: { message: string }) => void;
}

export default function UserReports({ onShowNotification }: UserReportsPageProps) {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetail, setShowDetail] = useState(false)
  const [allReports, setAllReports] = useState<UserReport[]>([])
  const [reports, setReports] = useState<UserReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [selectedAction, setSelectedAction] = useState<"warning" | "deletion" | "dismiss" | "">("")
  const [isConfirmingAction, setIsConfirmingAction] = useState(false)
  const [showNoteValidationModal, setShowNoteValidationModal] = useState(false)

  // Fetch all user reports (always fetch all for accurate counting)
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('adminToken')
        
        // Always fetch all reports without status filter for accurate counts
        const params = new URLSearchParams()
        if (searchTerm.trim()) params.append('search', searchTerm.trim())
        const query = params.toString() ? `?${params.toString()}` : ''

        const response = await fetch(`${API_ROOT_URL}/reports/admin/all${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.message || `Failed to fetch reports (${response.status})`)
          console.error('User Reports - API Error:', data)
          if (response.status === 401) {
            setError('Authentication required. Please login again.')
          }
          setAllReports([])
          setReports([])
        } else if (data.success && Array.isArray(data.data)) {
          setError("")
          setAllReports(data.data)
          
          // Filter by active tab
          let filtered = data.data
          if (activeTab !== 'all') {
            filtered = data.data.filter(r => r.status === activeTab)
          }
          setReports(filtered)
          
          if (filtered.length > 0 && (!selectedReport || !filtered.find((r: UserReport) => r.id === selectedReport))) {
            setSelectedReport(filtered[0].id)
          } else if (filtered.length === 0) {
            setSelectedReport("")
          }
        } else {
          console.error('User Reports - Unexpected response format:', data)
          setError(data.message || 'Unexpected response format')
          setAllReports([])
          setReports([])
        }
      } catch (error: any) {
        console.error('Error fetching reports:', error)
        setError(`Network error: ${error.message || 'Failed to connect to server'}`)
        setAllReports([])
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchReports()
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Re-filter when tab changes
  useEffect(() => {
    let filtered = allReports
    if (activeTab !== 'all') {
      filtered = allReports.filter(r => r.status === activeTab)
    }
    setReports(filtered)
    
    if (filtered.length > 0 && (!selectedReport || !filtered.find((r: UserReport) => r.id === selectedReport))) {
      setSelectedReport(filtered[0].id)
    } else if (filtered.length === 0) {
      setSelectedReport("")
    }
  }, [activeTab])

  const currentReport = reports.find((r) => r.id === selectedReport)

  const filteredReports = reports.filter((report) => {
    const search = searchTerm.toLowerCase()
    return (
      report.reportedUserName.toLowerCase().includes(search) ||
      report.reportedUserEmail.toLowerCase().includes(search) ||
      report.reporterName.toLowerCase().includes(search) ||
      report.reason.toLowerCase().includes(search)
    )
  })

  const handleResolveReport = async (action: "warning" | "deletion" | "dismiss") => {
    if (!currentReport) return

    try {
      setIsSavingNotes(true)
      const token = localStorage.getItem('adminToken')
      
      // Check if deletion requires multiple reports
      if (action === 'deletion') {
        if (currentReport.warningsSent < 1) {
          onShowNotification?.({ message: 'User needs at least 1 warning before deletion' })
          setIsSavingNotes(false)
          return
        }
      }

      const endpoint = 
        action === 'warning' ? '/reports/admin/warn' :
        action === 'deletion' ? '/reports/admin/delete' :
        '/reports/admin/dismiss'

      const body = action === 'deletion' 
        ? { reportId: currentReport.id, reason: adminNotes.trim() }
        : action === 'dismiss'
        ? { reportId: currentReport.id, dismissReason: adminNotes.trim() }
        : { reportId: currentReport.id, warningMessage: adminNotes.trim() }

      const response = await fetch(`${API_ROOT_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error resolving report:', data)
        onShowNotification?.({ message: data.message || 'Failed to resolve report' })
        return
      }

      // Update the report in both allReports and reports lists
      const updatedReport = {
        ...currentReport,
        status: action === 'dismiss' ? 'dismissed' : 'actioned',
        adminAction: action === 'dismiss' ? 'none' : action,
        adminNotes: adminNotes.trim(),
        resolvedAt: new Date().toISOString(),
        warningsSent: action === 'warning' ? currentReport.warningsSent + 1 : currentReport.warningsSent
      }
      
      setAllReports((prev) =>
        prev.map((r) => r.id === currentReport.id ? updatedReport : r)
      )
      
      setReports((prev) =>
        prev.map((r) => r.id === currentReport.id ? updatedReport : r)
      )

      const actionMessages = {
        warning: 'User warned successfully',
        deletion: 'User account deleted successfully',
        dismiss: 'Report dismissed successfully'
      }

      onShowNotification?.({ message: actionMessages[action] })
      setAdminNotes("")
      setSelectedAction("")
      setIsConfirmingAction(false)
    } catch (error: any) {
      console.error('Error resolving report:', error)
      onShowNotification?.({ message: 'Failed to resolve report' })
    } finally {
      setIsSavingNotes(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'actioned':
        return 'bg-green-100 text-green-800'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'warning':
        return 'bg-orange-100 text-orange-800'
      case 'suspension':
        return 'bg-red-100 text-red-800'
      case 'deletion':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleBackClick = () => {
    setShowDetail(false)
    setSelectedReport("")
    setSelectedAction("")
    setAdminNotes("")
  }

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId)
    setShowDetail(true)
    const report = reports.find((r) => r.id === reportId)
    setAdminNotes(report?.adminNotes || "")
  }

  const tabs = ['pending', 'reviewed', 'actioned', 'dismissed', 'all']

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        {!showDetail ? (
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'all' 
                    ? ` (${allReports.length})`
                    : ` (${allReports.filter(r => r.status === tab).length})`
                  }
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by user name, email, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    Loading reports...
                  </div>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No reports found</p>
                    <p className="text-sm">Try adjusting your filters or search term</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className={`p-6 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-200 ${
                        selectedReport === report.id ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {report.reporterName} reported {report.reportedUserName}
                              </p>
                              <p className="text-sm text-gray-600">{report.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                            {report.adminAction !== 'none' && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(report.adminAction)}`}>
                                {report.adminAction.charAt(0).toUpperCase() + report.adminAction.slice(1)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-10 h-10 border-2 border-gray-200 rounded-full overflow-hidden">
                            <Avatar image={report.reportedUserAvatar} initial={report.reportedUserName.charAt(0)} name={report.reportedUserName} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Detail View */}
        {showDetail && currentReport && (
          <div className="flex-1 bg-white border-l border-gray-200 flex flex-col">
            {/* Detail Header */}
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Report Details</h2>
              <button
                onClick={handleBackClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Reported User Info */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Reported User</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    <Avatar image={currentReport.reportedUserAvatar} initial={currentReport.reportedUserName.charAt(0)} name={currentReport.reportedUserName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{currentReport.reportedUserName}</p>
                    <p className="text-sm text-gray-600 truncate">{currentReport.reportedUserEmail}</p>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Reported By</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    <Avatar image={currentReport.reporterAvatar} initial={currentReport.reporterName.charAt(0)} name={currentReport.reporterName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{currentReport.reporterName}</p>
                    <p className="text-sm text-gray-600 truncate">{currentReport.reporterEmail}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reason</p>
                <p className="text-gray-700 text-sm">{currentReport.reason}</p>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentReport.status)}`}>
                    {currentReport.status.charAt(0).toUpperCase() + currentReport.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Warnings Sent</p>
                <p className="text-lg font-bold text-gray-900">{currentReport.warningsSent}</p>
              </div>

              {/* Admin Notes */}
              {currentReport.adminNotes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Admin Notes</p>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{currentReport.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {currentReport.status !== 'actioned' && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Enter your notes or warning message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                      rows={3}
                    />
                  </div>

                  {!isConfirmingAction ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!adminNotes.trim()) {
                            setShowNoteValidationModal(true)
                            return
                          }
                          setSelectedAction("warning")
                          setIsConfirmingAction(true)
                        }}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Warn User
                      </button>
                      <button
                        onClick={() => {
                          if (!adminNotes.trim()) {
                            setShowNoteValidationModal(true)
                            return
                          }
                          setSelectedAction("deletion")
                          setIsConfirmingAction(true)
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAction("dismiss")
                          setIsConfirmingAction(true)
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Confirm {selectedAction === 'warning' ? 'warning' : selectedAction === 'deletion' ? 'deletion' : 'dismissing'} this {selectedAction === 'deletion' ? 'user' : 'report'}?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReport(selectedAction as "warning" | "deletion" | "dismiss")}
                          disabled={isSavingNotes}
                          className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                        >
                          {isSavingNotes ? 'Processing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => {
                            setIsConfirmingAction(false)
                            setSelectedAction("")
                          }}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Note Validation Modal */}
      {showNoteValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-orange-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Required Information</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Please enter {selectedAction === 'warning' ? 'a warning message' : 'a reason'} before {selectedAction === 'warning' ? 'sending a warning' : 'taking this action'}.
            </p>
            <button
              onClick={() => setShowNoteValidationModal(false)}
              className="w-full px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
