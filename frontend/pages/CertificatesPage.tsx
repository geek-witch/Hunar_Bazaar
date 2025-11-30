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
      icon: <Book className="w-10 h-10 text-teal-600" />,
    },
    {
      id: "2",
      title: "JavaScript Advanced Concepts",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-10-20",
      expiryDate: "2026-10-20",
      credentialId: "CERT-2024-002",
      skills: ["JavaScript", "ES6+", "Async Programming"],
      icon: <FileText className="w-10 h-10 text-purple-600" />,
    },
    {
      id: "3",
      title: "Web Design Fundamentals",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-09-10",
      credentialId: "CERT-2024-003",
      skills: ["Design", "UX/UI", "CSS"],
      icon: <Award className="w-10 h-10 text-orange-600" />,
    },
    {
      id: "4",
      title: "TypeScript Foundations",
      issuer: "HunarBazaar Academy",
      issueDate: "2024-08-05",
      credentialId: "CERT-2024-004",
      skills: ["TypeScript", "Type System", "OOP"],
      icon: <UserCheck className="w-10 h-10 text-blue-600" />,
    },
  ])

  const CertificateCard: React.FC<{ certificate: Certificate }> = ({ certificate }) => {
    const learningSkill = certificate.skills[0] || "N/A"
    const teachingSkill = certificate.skills[1] || "N/A"

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>{certificate.icon}</div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{certificate.title}</h3>
              <p className="text-sm text-gray-500">{certificate.issuer}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-sm text-gray-600">
          <p>
            <strong>Issued:</strong> {new Date(certificate.issueDate).toLocaleDateString()}
          </p>
          {certificate.expiryDate && (
            <p>
              <strong>Expires:</strong> {new Date(certificate.expiryDate).toLocaleDateString()}
            </p>
          )}
          <p>
            <strong>Credential ID:</strong> {certificate.credentialId}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Skills:</p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
              Learned: {learningSkill}
            </span>
            <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
              Taught: {teachingSkill}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 bg-brand-teal text-white py-2 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium text-sm">
            <Book className="w-4 h-4" /> View Certificate
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
            <Download className="w-4 h-4" /> Download Certificate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Certificates</h1>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-brand-teal/10 to-blue-100 p-6 rounded-xl border border-brand-teal/20">
        <p className="text-white">
          You have earned <strong className="text-grey">{certificates.length} certificates</strong> so far. Share
          them with your professional network!
        </p>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.length === 0 ? (
          <div className="col-span-2 bg-white p-12 rounded-xl text-center">
            <div className="text-6xl mb-4">
              <FileText className="inline-block w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Certificates Yet</h3>
            <p className="text-gray-500">Complete courses and learning paths to earn certificates</p>
          </div>
        ) : (
          certificates.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} />)
        )}
      </div>
    </div>
  )
}

export default CertificatesPage
