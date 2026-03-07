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

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitIssue = async () => {
    if (!issueDescription.trim()) {
      navigation.showNotification('Please enter a description')
      return
    }

    if (isSubmitting) {
      return // Prevent double submission
    }

    setIsSubmitting(true)
    try {
      // Convert image to base64 if attachment exists
      let attachmentBase64 = null
      if (issueAttachment) {
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (issueAttachment.size > maxSize) {
          navigation.showNotification('Image size exceeds 10MB limit. Please choose a smaller image.')
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
          navigation.showNotification(`Invalid file type. Detected: ${fileType || 'unknown'}. Please upload PNG, JPG, GIF, or WEBP only.`)
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
          navigation.showNotification('Failed to process image. Please try a different file.')
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
        navigation.showNotification('Query sent successfully! Our support team will get back to you soon.')
      } else {
        navigation.showNotification(response.message || "Failed to submit issue. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting issue:", error)
      navigation.showNotification("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const FAQItemComponent: React.FC<{ item: FAQItem }> = ({ item }) => (
    <div className={`overflow-hidden rounded-xl border transition-all duration-300 ${expandedId === item.id ? 'bg-white shadow-lg shadow-teal-100 border-teal-100' : 'bg-white border-slate-100 hover:border-teal-100'}`}>
      <button
        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
      >
        <div className="flex-1">
          <p className="text-[9px] uppercase font-bold text-brand-teal tracking-wider mb-1">{item.category}</p>
          <p className="font-bold text-slate-800 text-base">{item.question}</p>
        </div>
        <span
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${expandedId === item.id ? "bg-brand-teal text-white rotate-180" : "bg-slate-100 text-slate-400"}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <div 
        className={`px-4 transition-all duration-300 ease-in-out ${expandedId === item.id ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 pb-0 opacity-0 overflow-hidden'}`}
      >
        <div className="pt-1.5 border-t border-slate-100">
             <p className="text-slate-600 leading-relaxed mt-3 text-sm">{item.answer}</p>
        </div>
      </div>
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
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Help Center</h1>
            <p className="text-cyan-50 text-base mt-1.5 font-medium">Find answers and support for your journey.</p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>


      {/* Search Input */}
      <div className="relative -mt-12 z-20">
        <div className="bg-white p-1.5 rounded-xl shadow-lg shadow-slate-200/60 border border-slate-100 flex items-center">
             <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <SearchIcon className="w-5 h-5" />
             </div>
            <input
            type="text"
            placeholder="Search for answers, topics, or issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 font-medium px-3 py-2 focus:outline-none focus:ring-0 text-base"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
         <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <span className="w-2 h-6 bg-brand-teal rounded-full"></span>
                Frequently Asked Questions
            </h2>
             <p className="text-white mb-6 text-sm">
                Showing {filteredFAQs.length} of {faqs.length} questions
                {searchQuery && ` for "${searchQuery}"`}
            </p>

            {filteredFAQs.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-lg font-bold text-slate-700">No results found.</p>
                    <p className="text-slate-500 mt-1">Try searching for keywords like "password", "session", or "credits".</p>
                </div>
            ) : (
                <div className="space-y-4">
                {filteredFAQs.map((item) => (
                    <FAQItemComponent key={item.id} item={item} />
                ))}
                </div>
            )}
         </div>

         {/* Contact Support Section */}
         <div>
            <div className="bg-gradient-to-br from-brand-teal to-cyan-600 p-8 rounded-3xl shadow-xl shadow-cyan-200/50 text-white relative overflow-hidden sticky top-8">
                 {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30">
                         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
                    <p className="text-cyan-50 mb-8 leading-relaxed">
                        Our dedicated support team is here to assist you with any inquiries or technical issues.
                    </p>
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="w-full bg-white text-brand-teal px-6 py-4 rounded-xl hover:bg-cyan-50 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Contact Support
                    </button>
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium text-cyan-200">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> 24/7 Support</span>
                        <span>•</span>
                        <span>Fast Response</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* CONTACT SUPPORT MODAL (MODIFIED) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/20 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-teal to-cyan-500"></div>

            <div className="flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">Contact Support</h2>
                     <button
                        onClick={closeContactModal}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-slate-500 mb-6">
                    Describe your issue below and our support team will respond soon.
                </p>
            </div>

            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Issue Category
                  </label>
                   <div className="relative">
                        <select
                            value={issueCategory}
                            onChange={(e) => setIssueCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                        >
                            <option>General Inquiry</option>
                            <option>Technical Issue</option>
                            <option>Payment Problem</option>
                            <option>Session Issue</option>
                            <option>Account Problem</option>
                            <option>Other</option>
                        </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Issue Description
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={5}
                    placeholder="Please explain the issue in detail..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all text-slate-700"
                  />
                </div>
                
                {/* NEW FILE ATTACHMENT FIELD */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Attach Screenshot (Optional)
                  </label>
                  <div className="relative">
                      <input
                        type="file"
                        id="modal-file-upload"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null
                          setIssueAttachment(file)
                        }}
                        className="sr-only"
                      />
                      <label 
                        htmlFor="modal-file-upload"
                        className="flex items-center justify-between w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                         <span className={`text-sm ${issueAttachment ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                            {issueAttachment ? issueAttachment.name : "Click to upload image..."}
                         </span>
                         <span className="bg-white text-slate-500 text-xs font-bold px-2 py-1 rounded-md border border-slate-200 shadow-sm">Browse</span>
                      </label>
                  </div>
                  
                  {issueAttachment && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-xs text-emerald-700 font-bold">Ready to upload</span>
                        </div>
                        <span className="text-xs text-emerald-600">{(issueAttachment.size / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                </div>
                {/* END NEW FIELD */}
             </div>

            <div className="flex-shrink-0 pt-6 mt-2">
                <button
                  type="button"
                  onClick={handleSubmitIssue}
                  className="w-full bg-brand-teal text-white py-3.5 rounded-xl hover:bg-brand-teal-dark shadow-lg shadow-teal-200/50 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  disabled={!issueDescription.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpCenterPage