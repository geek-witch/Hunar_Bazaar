"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, ArrowLeft, Check, AlertCircle } from "lucide-react"

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
  status: "pending" | "resolved"
  createdAt: string
  resolvedAt?: string
  adminNotes?: string
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
    <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-gray-400 to-gray-500">
      {initial}
    </div>
  )
}

const API_ROOT_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth$/, '') || 'http://localhost:4000/api';

interface ReportsPageProps {
  onShowNotification?: (notification: { message: string }) => void;
}

export default function Reports({ onShowNotification }: ReportsPageProps) {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetail, setShowDetail] = useState(false)
  const [reports, setReports] = useState<UserReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Fetch all user reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('adminToken')
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

        if (!response.ok) {
          setError(data.message || `Failed to fetch reports (${response.status})`)
          console.error('Admin Reports - API Error:', data)
          if (response.status === 401) {
            setError('Authentication required. Please login.')
          }
          setReports([])
        } else if (data.success && Array.isArray(data.data)) {
          setError("")
          setReports(data.data)
          if (data.data.length > 0 && (!selectedReport || !data.data.find((r: UserReport) => r.id === selectedReport))) {
            setSelectedReport(data.data[0].id)
          } else if (data.data.length === 0) {
            setSelectedReport("")
          }
        } else {
          console.error('Admin Reports - Unexpected response format:', data)
          setError(data.message || 'Unexpected response format')
          setReports([])
        }
      } catch (error: any) {
        console.error('Error fetching reports:', error)
        setError(`Network error: ${error.message || 'Failed to connect to server'}`)
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchReports()
    }, searchTerm ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [activeTab, searchTerm])

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

  const handleResolveReport = async () => {
    if (!currentReport) return
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_ROOT_URL}/support/issues/${currentReport.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: 'resolved'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error resolving report:', data)
        onShowNotification?.({ message: data.message || 'Failed to resolve report' })
        return
      }

      // Update the report in the list
      setReports((prev) =>
        prev.map((r) =>
          r.id === currentReport.id
            ? { ...r, status: 'resolved', adminNotes: adminNotes.trim(), resolvedAt: new Date().toISOString() }
            : r
        )
      )

      onShowNotification?.({ message: 'Report marked as resolved' })
      setAdminNotes("")
    } catch (error: any) {
      console.error('Error resolving report:', error)
      onShowNotification?.({ message: 'Failed to resolve report' })
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

  const handleBackClick = () => {
    setShowDetail(false)
    setSelectedReport("")
  }

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId)
    setShowDetail(true)
    const report = reports.find((r) => r.id === reportId)
    setAdminNotes(report?.adminNotes || "")
  }

  const tabs = ['pending', 'resolved', 'all']

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0E4B5B] mb-4">User Reports</h1>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
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
          <div className="p-3 md:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#0E4B5B] text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Reports List */}
        <div className={`w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col ${showDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto space-y-3 p-3 md:p-4">
            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm font-medium">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No reports found</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handleReportClick(report.id)}
                  className={`w-full p-3 md:p-4 rounded-xl text-left transition-all border-2 ${
                    selectedReport === report.id
                      ? "border-[#0E4B5B] bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        report.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {report.status === 'pending' ? 'PENDING' : 'RESOLVED'}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(report.createdAt).split(',')[0]}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 font-medium">
                    Report against: {report.reportedUserName}
                  </p>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">Reason: {report.reason}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6">
                      <Avatar image={report.reporterAvatar} initial={report.reporterName.charAt(0)} name={report.reporterName} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Reported by: {report.reporterName}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Report Details */}
        <div className={`w-full lg:w-2/3 bg-white flex flex-col ${showDetail ? 'flex' : 'hidden lg:flex'}`}>
          {currentReport ? (
            <>
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between mb-4 lg:mb-0">
                  <button
                    onClick={handleBackClick}
                    className="lg:hidden text-[#0E4B5B] font-bold text-sm flex items-center gap-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        currentReport.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {currentReport.status === 'pending' ? 'PENDING' : 'RESOLVED'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(currentReport.createdAt)}</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-6">
                  {/* Reported User Info */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-bold text-[#0E4B5B] mb-3">User Being Reported</h3>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10">
                        <Avatar
                          image={currentReport.reportedUserAvatar}
                          initial={currentReport.reportedUserName.charAt(0)}
                          name={currentReport.reportedUserName}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{currentReport.reportedUserName}</p>
                        <p className="text-sm text-gray-600">{currentReport.reportedUserEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-bold text-[#0E4B5B] mb-3">Reported By</h3>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10">
                        <Avatar
                          image={currentReport.reporterAvatar}
                          initial={currentReport.reporterName.charAt(0)}
                          name={currentReport.reporterName}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{currentReport.reporterName}</p>
                        <p className="text-sm text-gray-600">{currentReport.reporterEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Report Reason */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-[#0E4B5B] mb-2">Report Reason</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{currentReport.reason}</p>
                  </div>

                  {/* Admin Notes */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-[#0E4B5B] mb-2">Admin Notes</h3>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this report..."
                      disabled={currentReport.status === 'resolved'}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B5B]/50 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                      rows={4}
                    />
                  </div>

                  {currentReport.status === 'resolved' && currentReport.resolvedAt && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-700">
                        <strong>Resolved on:</strong> {formatDate(currentReport.resolvedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer - Action Buttons */}
              {currentReport.status === 'pending' && (
                <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50 flex gap-3">
                  <button
                    onClick={handleResolveReport}
                    disabled={isSavingNotes}
                    className="flex-1 py-3 bg-[#0E4B5B] hover:bg-[#093540] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={18} />
                    {isSavingNotes ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a report to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
