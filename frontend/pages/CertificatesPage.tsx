"use client"

import React from "react"
import { useState } from "react"
import type { Navigation } from "../App"

// Import Lucide icons
import { Book, FileText, Award, UserCheck, Download } from "lucide-react"

interface Certificate {
  id: string
  title: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId: string
  skills: string[]
  icon: React.ReactNode
}

const CertificatesPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [certificates] = useState<Certificate[]>([
    {
      id: "1",
      title: "React Development Mastery",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-11-15",
      credentialId: "CERT-2024-001",
      skills: ["React", "JavaScript", "Web Development"],
      icon: <Book className="w-8 h-8 text-white" />,
    },
    {
      id: "2",
      title: "JavaScript Advanced Concepts",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-10-20",
      expiryDate: "2026-10-20",
      credentialId: "CERT-2024-002",
      skills: ["JavaScript", "ES6+", "Async Programming"],
      icon: <FileText className="w-8 h-8 text-white" />,
    },
    {
      id: "3",
      title: "Web Design Fundamentals",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-09-10",
      credentialId: "CERT-2024-003",
      skills: ["Design", "UX/UI", "CSS"],
      icon: <Award className="w-8 h-8 text-white" />,
    },
    {
      id: "4",
      title: "TypeScript Foundations",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-08-05",
      credentialId: "CERT-2024-004",
      skills: ["TypeScript", "Type System", "OOP"],
      icon: <UserCheck className="w-8 h-8 text-white" />,
    },
  ])

  const CertificateCard: React.FC<{ certificate: Certificate }> = ({ certificate }) => {
    const learningSkill = certificate.skills[0] || "N/A"
    const teachingSkill = certificate.skills[1] || "N/A"

    return (
      <div className="group bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal to-cyan-500 shadow-lg shadow-teal-200 flex items-center justify-center">
                {certificate.icon}
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 leading-tight group-hover:text-brand-teal transition-colors">{certificate.title}</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">{certificate.issuer}</p>
              </div>
            </div>
            {/* Badge Icon (Optional, maybe a verified check) */}
            <div className="hidden sm:block">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Issued</p>
              <p className="text-sm font-semibold text-slate-700">{new Date(certificate.issueDate).toLocaleDateString()}</p>
            </div>
            {certificate.expiryDate && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expires</p>
                <p className="text-sm font-semibold text-slate-700">{new Date(certificate.expiryDate).toLocaleDateString()}</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Credential ID</p>
              <p className="text-sm font-mono font-medium text-slate-600">{certificate.credentialId}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Skills Validated</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg">
                Learned: {learningSkill}
              </span>
              <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold px-3 py-1.5 rounded-lg">
                Taught: {teachingSkill}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-brand-teal text-white py-3 rounded-xl hover:bg-brand-teal-dark shadow-lg shadow-teal-200/50 transition-all font-bold text-sm group-hover:translate-y-[-2px]">
              <Book className="w-4 h-4" /> View
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-3 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Certificates</h1>
            <p className="text-cyan-50 text-base mt-1.5">Showcase your achievements and verified skills.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-3 flex items-center gap-3">
            <div className="text-center px-2">
              <p className="text-xl font-bold text-white">{certificates.length}</p>
              <p className="text-[10px] text-cyan-50 font-medium uppercase">Earned</p>
            </div>
            <div className="w-px h-6 bg-white/30"></div>
            <div className="text-center px-2">
              <p className="text-xl font-bold text-white">0</p>
              <p className="text-[10px] text-cyan-50 font-medium uppercase">Expiring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.length === 0 ? (
          <div className="col-span-2 bg-white p-16 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Certificates Yet</h3>
            <p className="text-slate-500 text-lg max-w-md mx-auto">Complete sessions and learning paths to earn verified certificates from HunarBazaar.</p>
          </div>
        ) : (
          certificates.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} />)
        )}
      </div>
    </div>
  )
}

export default CertificatesPage
