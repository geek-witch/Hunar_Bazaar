import React, { useState, useEffect } from "react"

const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled, className }) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
)

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { rating: number; comment: string; reportedHours: number }) => void
    isReadOnly?: boolean
    navigation?: {
        showNotification: (message: string) => void
    }
    sessionDetails?: {
        teacherName: string
        skill: string
        sessionHours?: number
    }
    initialData?: {
        rating: number
        comment: string
        reportedHours: number
    }
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isReadOnly = false,
    navigation,
    sessionDetails,
    initialData
}) => {
    const [form, setForm] = useState({
        rating: 0,
        comment: "",
        reportedHours: 0
    })

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({
                    rating: initialData.rating || 0,
                    comment: initialData.comment || "",
                    reportedHours: initialData.reportedHours || (sessionDetails?.sessionHours || 0)
                })
            } else {
                setForm({
                    rating: 0,
                    comment: "",
                    reportedHours: sessionDetails?.sessionHours || 0
                })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-teal to-cyan-500"></div>

                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    {isReadOnly ? (
                        <>
                            <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </span>
                            View Feedback
                        </>
                    ) : (
                        <>
                            <span className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600"><StarIcon className="w-4 h-4" /></span>
                            Review Your Session
                        </>
                    )}
                </h2>

                <div className="space-y-4">
                    {sessionDetails && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Session Summary</p>
                            <p className="text-sm font-bold text-slate-800">
                                {sessionDetails.teacherName} <span className="text-slate-500 font-normal">taught you</span> {sessionDetails.skill}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 italic">Please share how your experience was!</p>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">How was the teacher? (Rating)</label>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => !isReadOnly && setForm({ ...form, rating: star })}
                                    type="button"
                                    className={`transition-transform hover:scale-110 focus:outline-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    <StarIcon filled={star <= form.rating} className={`w-8 h-8 ${star <= form.rating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Duration of Session (Hours)</label>
                        <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={form.reportedHours === 0 ? "" : form.reportedHours}
                            onChange={(e) => {
                                if (isReadOnly) return;
                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                setForm({ ...form, reportedHours: isNaN(val) ? 0 : Math.max(0, val) });
                            }}
                            disabled={isReadOnly}
                            placeholder="e.g. 1.0"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400 transition-all font-semibold text-slate-700 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Your Detailed Feedback</label>
                        <textarea
                            value={form.comment}
                            onChange={(e) => !isReadOnly && setForm({ ...form, comment: e.target.value })}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400 transition-all text-slate-700 text-sm"
                            disabled={isReadOnly}
                            placeholder="How did the session go? What did you learn?"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm"
                    >
                        {isReadOnly ? "Close" : "Decide Later"}
                    </button>

                    {!isReadOnly && (
                        <button
                            onClick={() => {
                                // Validate all required fields
                                if (!form.rating || form.rating === 0) {
                                    if (navigation) navigation.showNotification('Please provide a star rating for the teacher');
                                    else alert('Please provide a star rating for the teacher');
                                    return;
                                }

                                // Robust check: must be a number, not NaN, and > 0
                                const hours = Number(form.reportedHours);
                                if (isNaN(hours) || hours <= 0) {
                                    if (navigation) navigation.showNotification('Please specify the number of hours the session lasted');
                                    else alert('Please specify the number of hours the session lasted');
                                    return;
                                }

                                if (!form.comment || form.comment.trim() === '') {
                                    if (navigation) navigation.showNotification('Please write a brief comment about your experience');
                                    else alert('Please write a brief comment about your experience');
                                    return;
                                }
                                onSubmit(form);
                            }}
                            className="flex-1 bg-brand-teal text-white py-2 rounded-lg hover:bg-brand-teal-dark shadow-lg shadow-teal-200/50 transition-all font-bold text-sm"
                        >
                            Submit Review
                        </button>
                    )}                </div>
            </div>
        </div>
    )
}

export default FeedbackModal
