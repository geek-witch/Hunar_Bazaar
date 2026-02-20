"use client"

import React from "react"
import { useState, useEffect } from "react"
import type { Navigation } from "../App"
import { authApi, profileApi } from "../utils/api"

// Achievements icons only
import { Rocket, Star, Trophy } from "lucide-react"

interface ProgressData {
  totalHoursLearned: number
  skillsLearned: number
  sessionsCompleted: number
  creditsEarned: number
  achievements: Achievement[]
  learningPath: LearningPath[]
}

interface Achievement {
  id: string
  title: string
  description: string
  earnedDate: string
  icon: React.ReactNode
}

interface LearningPath {
  skill: string
  progress: number
  sessionsCount: number
  hoursSpent: number
}

const SeeProgressPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    totalHoursLearned: 0,
    skillsLearned: 0,
    sessionsCompleted: 0,
    creditsEarned: 0,
    achievements: [
      {
        id: "1",
        title: "Quick Learner",
        description: "Completed 5 sessions in a week",
        earnedDate: "2024-11-20",
        icon: <Rocket className="w-8 h-8 text-white" />,
      },
      {
        id: "2",
        title: "Dedicated Student",
        description: "Maintained a 7-day learning streak",
        earnedDate: "2024-11-18",
        icon: <Star className="w-8 h-8 text-white" />,
      },
      {
        id: "3",
        title: "Skill Master",
        description: "Completed a full learning path",
        earnedDate: "2024-11-15",
        icon: <Trophy className="w-8 h-8 text-white" />,
      },
    ],
    learningPath: [
      { skill: "React Development", progress: 75, sessionsCount: 8, hoursSpent: 24 },
      { skill: "TypeScript Basics", progress: 60, sessionsCount: 5, hoursSpent: 15 },
      { skill: "Web Design", progress: 40, sessionsCount: 3, hoursSpent: 9 },
      { skill: "JavaScript Advanced", progress: 85, sessionsCount: 2, hoursSpent: 6 },
    ],
  })

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await profileApi.getProgress()
        if (res.success && res.data) {
          const data = res.data as any

          // Map Badges to Achievements
          const realAchievements: Achievement[] = (data.badges || []).map((badgeName: string, index: number) => ({
            id: `badge-${index}`,
            title: badgeName,
            description: 'Badge earned for your dedication!',
            earnedDate: new Date().toISOString(), // Date not tracked in simple string array, fallback to now
            icon: <Trophy className="w-8 h-8 text-white" />
          }));

          setProgressData(prev => ({
            ...prev,
            totalHoursLearned: data.totalLearnedHours || 0,
            skillsLearned: data.skillsMastered || 0,
            sessionsCompleted: data.sessionsTaught || 0, // Changed to Taught sessions per user request "show conducted"
            creditsEarned: data.creditsEarned || 0,
            achievements: realAchievements,
            learningPath: data.activeSkills || []
          }))
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchProgress()
  }, [])

  const learningHistory = progressData.learningPath.filter((p) => p.progress > 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-cyan-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500 text-white"></div>
        <div className="relative z-10 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Progress</h1>
          <p className="text-cyan-50 text-base mt-1.5 font-medium">Track your growth, achievements, and milestones.</p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-900/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
      </div>

      {/* Stats Cards - Redesigned */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="group bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full blur-xl group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-0.5">Total Learned</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800">{progressData.totalHoursLearned}</p>
              <span className="text-xs font-medium text-slate-400">hours</span>
            </div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="group bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full blur-xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-0.5">Skills Mastered</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800">{progressData.skillsLearned}</p>
              <span className="text-xs font-medium text-slate-400">skills</span>
            </div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-1/2 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="group bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-50 rounded-full blur-xl group-hover:bg-purple-100 transition-colors"></div>
          <div className="relative z-10">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-0.5">Sessions Done</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800">{progressData.sessionsCompleted}</p>
              <span className="text-xs font-medium text-slate-400">sessions</span>
            </div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-2/3 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="group bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full blur-xl group-hover:bg-amber-100 transition-colors"></div>
          <div className="relative z-10">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-0.5">Credits Earned</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800">{progressData.creditsEarned}</p>
              <span className="text-xs font-medium text-slate-400">pts</span>
            </div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-full rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Achievements Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-brand-teal rounded-full"></span>
              Achievements
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {progressData.achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-start gap-4 hover:shadow-lg transition-shadow">
                <div className={`p-3 rounded-2xl shrink-0 ${achievement.id === '1' ? 'bg-teal-500 shadow-teal-200' : achievement.id === '2' ? 'bg-amber-500 shadow-amber-200' : 'bg-orange-500 shadow-orange-200'} shadow-lg`}>
                  {achievement.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{achievement.title}</h3>
                  <p className="text-slate-500 text-sm mb-2">{achievement.description}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Earned on {new Date(achievement.earnedDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Path / History Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
            Active Skills
          </h2>
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 space-y-4">
            {learningHistory.map((l, idx) => (
              <div key={l.skill} className="group">
                <div className="flex justify-between items-end mb-1">
                  <span className="font-bold text-slate-700 block group-hover:text-brand-teal transition-colors">{l.skill}</span>
                  <span className="text-xs font-bold text-slate-400">{l.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${idx % 2 === 0 ? 'bg-brand-teal' : 'bg-cyan-500'}`}
                    style={{ width: `${l.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400 font-medium">
                  <span>{l.sessionsCount} sessions</span>
                  <span></span>
                </div>
              </div>
            ))}

            {learningHistory.length === 0 && (
              <p className="text-slate-400 text-center py-4 italic">No active skills yet. Start a session!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeeProgressPage
