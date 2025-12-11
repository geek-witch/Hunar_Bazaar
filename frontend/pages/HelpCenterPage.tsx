"use client"

import type React from "react"
import { useState } from "react"
import type { Navigation } from "../App"
import { SearchIcon } from "../components/icons/MiscIcons"
import { supportApi } from "../utils/api"

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
  const [issueAttachment, setIssueAttachment] = useState<File | null>(null)

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
        "If your tutor is more than 15 minutes late, you can cancel.",
    },
    {
      id: "5",
      category: "Payments",
      question: "How do credits work?",
      answer:
        "you get credits by your teaching skills and through them you can get badges of achievement or skill recognition."
    },
    {
      id: "6",
      category: "Payments",
      question: "Is there a refund policy?",
      answer:
        "No, For subscription plans , there is no refund policy.",
    },
    {
      id: "7",
      category: "Profile",
      question: "Can I become a teacher on HunarBazaar?",
      answer:
        "Yes! on Hunar Bazaar everyone is a teacher.",
    },
    {
      id: "8",
      category: "Technical Issues",
      question: "I'm having trouble accessing the video call.",
      answer:
        "Ensure your internet is stable and permissions are allowed.",
    },
    {
      id: "9",
      category: "Technical Issues",
      question: "How do I change my password?",
      answer:
        "Go to Settings → Privacy and Security → Change Password.",
    },
  ]

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitIssue = async () => {
    if (!issueDescription.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter a description' })
      return
    }

    if (isSubmitting) {
      return // Prevent double submission
    }

    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })
    try {
      // Convert image to base64 if attachment exists
      let attachmentBase64 = null
      if (issueAttachment) {
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (issueAttachment.size > maxSize) {
          setSubmitStatus({ type: 'error', message: 'Image size exceeds 10MB limit. Please choose a smaller image.' })
          setIsSubmitting(false)
          return
        }

        // Check file type - some browsers may report JPG as 'image/jpeg' or have empty type
        const fileType = issueAttachment.type.toLowerCase()
        const fileName = issueAttachment.name.toLowerCase()
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        
        // Check MIME type first, then fallback to file extension
        const isValidType = fileType && validTypes.includes(fileType)
        const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
        
        if (!isValidType && !isValidExtension) {
          console.error('File validation failed:', {
            fileName: issueAttachment.name,
            fileType: issueAttachment.type,
            fileSize: issueAttachment.size
          })
          setSubmitStatus({ type: 'error', message: `Invalid file type. Detected: ${fileType || 'unknown'}. Please upload PNG, JPG, GIF, or WEBP only.` })
          setIsSubmitting(false)
          return
        }

        try {
          const reader = new FileReader()
          attachmentBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string
              if (result && result.startsWith('data:image/')) {
                resolve(result)
              } else {
                reject(new Error('Failed to read image file'))
              }
            }
            reader.onerror = () => reject(new Error('Error reading file'))
            reader.readAsDataURL(issueAttachment)
          })
        } catch (readError) {
          console.error('Error converting image to base64:', readError)
          setSubmitStatus({ type: 'error', message: 'Failed to process image. Please try a different file.' })
          setIsSubmitting(false)
          return
        }
      }

      const response = await supportApi.submitIssue({
        category: issueCategory,
        description: issueDescription,
        attachment: attachmentBase64,
      })

      if (response.success) {
        setIssueDescription("")
        setIssueCategory("General Inquiry")
        setIssueAttachment(null)
        setIsContactModalOpen(false)
        setSubmitStatus({ type: 'success', message: 'Your issue has been submitted successfully! Our support team will get back to you soon.' })
        setTimeout(() => {
          setSubmitStatus({ type: null, message: '' })
        }, 5000)
      } else {
        setSubmitStatus({ type: 'error', message: response.message || "Failed to submit issue. Please try again." })
      }
    } catch (error) {
      console.error("Error submitting issue:", error)
      setSubmitStatus({ type: 'error', message: "An error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
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

  // --- Function to handle modal closure and reset all related states ---
  const closeContactModal = () => {
    setIsContactModalOpen(false)
    setIssueDescription("")
    setIssueCategory("General Inquiry")
    setIssueAttachment(null)
  }
  // ---------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Help Center</h1>
      </div>

      {submitStatus.type === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm text-center">{submitStatus.message}</p>
        </div>
      )}
      {submitStatus.type === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm text-center">{submitStatus.message}</p>
        </div>
      )}

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

      {/* CONTACT SUPPORT MODAL (MODIFIED) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Contact Support</h2>
                <button
                  onClick={closeContactModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Describe your issue below and our support team will respond soon. Adding a screenshot helps us understand the problem faster.
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
                
                {/* NEW FILE ATTACHMENT FIELD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Screenshot/Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null
                      if (file) {
                        console.log('File selected:', {
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          sizeKB: (file.size / 1024).toFixed(2)
                        })
                      }
                      setIssueAttachment(file)
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-brand-teal hover:file:bg-gray-200"
                  />
                  {issueAttachment && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">
                        Selected: {issueAttachment.name} ({(issueAttachment.size / 1024).toFixed(2)} KB)
                      </p>
                      {issueAttachment.type && (
                        <p className="text-xs text-gray-400">
                          Type: {issueAttachment.type}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* END NEW FIELD */}


                <button
                  type="button"
                  onClick={handleSubmitIssue}
                  className="w-full bg-brand-teal text-white py-2 rounded-lg hover:bg-brand-teal-dark transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!issueDescription.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
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