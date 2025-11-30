"use client"

import React from "react"
import { useState } from "react"
import type { Navigation } from "../App"

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
  const [progressData] = useState<ProgressData>({
    totalHoursLearned: 42,
    skillsLearned: 5,
    sessionsCompleted: 18,
    creditsEarned: 240,
    achievements: [
      {
        id: "1",
        title: "Quick Learner",
        description: "Completed 5 sessions in a week",
        earnedDate: "2024-11-20",
        icon: <Rocket className="w-10 h-10 text-teal-600" />,
      },
      {
        id: "2",
        title: "Dedicated Student",
        description: "Maintained a 7-day learning streak",
        earnedDate: "2024-11-18",
        icon: <Star className="w-10 h-10 text-yellow-600" />,
      },
      {
        id: "3",
        title: "Skill Master",
        description: "Completed a full learning path",
        earnedDate: "2024-11-15",
        icon: <Trophy className="w-10 h-10 text-orange-600" />,
      },
    ],
    learningPath: [
      { skill: "React Development", progress: 75, sessionsCount: 8, hoursSpent: 24 },
      { skill: "TypeScript Basics", progress: 60, sessionsCount: 5, hoursSpent: 15 },
      { skill: "Web Design", progress: 40, sessionsCount: 3, hoursSpent: 9 },
      { skill: "JavaScript Advanced", progress: 85, sessionsCount: 2, hoursSpent: 6 },
    ],
  })

  const learningHistory = progressData.learningPath.filter((p) => p.progress > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Your Progress</h1>
      </div>

      {/* Stats Cards (icons removed) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-sm space-y-2">
          <p className="text-gray-600 text-sm">Total Hours Learned</p>
          <p className="text-3xl font-bold text-blue-600">{progressData.totalHoursLearned}</p>
          <p className="text-xs text-gray-500">hours spent</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-sm space-y-2">
          <p className="text-gray-600 text-sm">Skills Learned</p>
          <p className="text-3xl font-bold text-green-600">{progressData.skillsLearned}</p>
          <p className="text-xs text-gray-500">skills acquired</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl shadow-sm space-y-2">
          <p className="text-gray-600 text-sm">Sessions Completed</p>
          <p className="text-3xl font-bold text-purple-600">{progressData.sessionsCompleted}</p>
          <p className="text-xs text-gray-500">sessions done</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-xl shadow-sm space-y-2">
          <p className="text-gray-600 text-sm">Credits Earned</p>
          <p className="text-3xl font-bold text-orange-600">{progressData.creditsEarned}</p>
          <p className="text-xs text-gray-500">learning credits</p>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Achievements</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {progressData.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow bg-white"
            >
              <div className="mb-3 flex items-center justify-center">{achievement.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{achievement.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
              <p className="text-xs text-gray-400">
                {new Date(achievement.earnedDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Learning History */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Learning History</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {learningHistory.map((l) => (
            <div
              key={l.skill}
              className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center font-medium text-gray-800 hover:bg-teal-100 transition-colors"
            >
              {l.skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SeeProgressPage
