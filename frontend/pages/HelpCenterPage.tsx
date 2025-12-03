"use client"

import type React from "react"
import { useState } from "react"
import type { Navigation } from "../App"
import { SearchIcon } from "../components/icons/MiscIcons"

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const HelpCenterPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // NEW STATES FOR MODAL
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [issueDescription, setIssueDescription] = useState("")
  const [issueCategory, setIssueCategory] = useState("General Inquiry")

  const faqs: FAQItem[] = [
    {
      id: "1",
      category: "Getting Started",
      question: "How do I create a new learning session?",
      answer:
        "To create a new learning session, navigate to 'Schedule Classes' from the sidebar, click on 'Schedule New Session', and fill in your preferred dates, times, and topics.",
    },
    {
      id: "2",
      category: "Getting Started",
      question: "How do I find tutors in my field?",
      answer:
        "Use the search feature on the homepage to search for tutors by skill, experience level, or availability.",
    },
    {
      id: "3",
      category: "Sessions",
      question: "Can I reschedule a session?",
      answer:
        "Yes, you can reschedule sessions up to 24 hours before the scheduled time.",
    },
    {
      id: "4",
      category: "Sessions",
      question: "What should I do if my tutor doesn't show up?",
      answer:
        "If your tutor is more than 15 minutes late, you can cancel and get a refund.",
    },
    {
      id: "5",
      category: "Payments",
      question: "How do credits work?",
      answer:
        "Credits are virtual currency used to pay for sessions. 1 credit = 1 USD.",
    },
    {
      id: "6",
      category: "Payments",
      question: "Is there a refund policy?",
      answer:
        "Yes, you can request a refund within 7 days of purchasing credits.",
    },
    {
      id: "7",
      category: "Profile",
      question: "How do I verify my credentials?",
      answer:
        "Upload certificates in your profile settings. Our team verifies them in 24–48 hours.",
    },
    {
      id: "8",
      category: "Profile",
      question: "Can I become a tutor on HunarBazaar?",
      answer:
        "Yes! Go to 'Become a Tutor' section and apply.",
    },
    {
      id: "9",
      category: "Technical Issues",
      question: "I'm having trouble accessing the video call.",
      answer:
        "Ensure your internet is stable and permissions are allowed.",
    },
    {
      id: "10",
      category: "Technical Issues",
      question: "How do I change my password?",
      answer:
        "Go to Settings → Security → Change Password.",
    },
  ]

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // SUBMIT ISSUE HANDLER
  const handleSubmitIssue = () => {
    if (!issueDescription.trim()) return

    console.log("Issue submitted:", {
      category: issueCategory,
      description: issueDescription,
      time: new Date().toISOString(),
    })

    setIssueDescription("")
    setIssueCategory("General Inquiry")
    setIsContactModalOpen(false)

    alert("Your issue has been submitted successfully!")
  }

  const FAQItemComponent: React.FC<{ item: FAQItem }> = ({ item }) => (
    <div className="overflow-hidden rounded-xl bg-gradient-to-r from-brand-teal/10 to-blue-100 border border-brand-teal/20 shadow-sm">
      <button
        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        className="w-full px-6 py-4 text-left flex items-center justify-between"
      >
        <div className="flex-1">
          <p className="text-xs font-semibold text-white mb-1">{item.category}</p>
          <p className="font-semibold text-white">{item.question}</p>
        </div>
        <span
          className="text-lg text-gray-500 ml-4 transition-transform"
          style={{ transform: expandedId === item.id ? "rotate(180deg)" : "" }}
        >
          ▼
        </span>
      </button>
      {expandedId === item.id && (
        <div className="px-6 py-4 border-t border-brand-teal/20">
          <p className="text-grey leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Help Center</h1>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search for answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        />
        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <p className="text-white mb-6">
          Showing {filteredFAQs.length} of {faqs.length} questions
          {searchQuery && ` for "${searchQuery}"`}
        </p>

        {filteredFAQs.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center">
            <p className="text-lg text-gray-600">No results found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((item) => (
              <FAQItemComponent key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* CONTACT SUPPORT SECTION */}
      <div className="bg-gradient-to-r from-brand-teal/10 to-blue-100 p-8 rounded-xl border border-brand-teal/20">
        <h2 className="text-xl font-bold text-white mb-2">Still need help?</h2>
        <p className="text-white mb-4">
          Our support team is here to help. Contact us through email for assistance.
        </p>
        <button
          onClick={() => setIsContactModalOpen(true)}
          className="bg-brand-teal text-white px-6 py-2 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
        >
          Contact Support
        </button>
      </div>

      {/* CONTACT SUPPORT MODAL (From Reference Code — COLORS UNCHANGED) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Contact Support</h2>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Describe your issue below and our support team will respond soon.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Category
                  </label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  >
                    <option>General Inquiry</option>
                    <option>Technical Issue</option>
                    <option>Payment Problem</option>
                    <option>Session Issue</option>
                    <option>Account Problem</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Description
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe your issue..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  />
                </div>

                <button
                  onClick={handleSubmitIssue}
                  className="w-full bg-brand-teal text-white py-2 rounded-lg hover:bg-brand-teal-dark transition font-medium"
                >
                  Submit Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpCenterPage
