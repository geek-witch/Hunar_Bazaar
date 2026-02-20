"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Page, type Navigation } from "../App"
import { CheckCircleIcon } from "../components/icons/MiscIcons"
import {
  WebDevIcon,
  DesignIcon,
  DataScienceIcon,
  CyberSecurityIcon,
  MobileDevIcon,
  BrainIcon,
} from "../components/icons/SkillIcons"
import { authApi, subscriptionApi, type BrowseSkillResult } from "../utils/api"

const HomePage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [suggestedUsers, setSuggestedUsers] = useState<Array<{ name: string; skill: string; img: string; profileId: string; userId?: string }>>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [plans, setPlans] = useState<any[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)

  const popularSkills = [
    { name: "Web Development", icon: WebDevIcon, bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { name: "UI/UX Design", icon: DesignIcon, bgColor: "bg-green-100", textColor: "text-green-600" },
    { name: "Data Science", icon: DataScienceIcon, bgColor: "bg-purple-100", textColor: "text-purple-600" },
    { name: "CyberSecurity", icon: CyberSecurityIcon, bgColor: "bg-orange-100", textColor: "text-orange-600" },
    { name: "Mobile Development", icon: MobileDevIcon, bgColor: "bg-red-100", textColor: "text-red-600" },
    { name: "Artificial Intelligence", icon: BrainIcon, bgColor: "bg-gray-100", textColor: "text-gray-600" },
  ]

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true)
      try {
        const response = await subscriptionApi.getPlans()
        if (response.success && Array.isArray(response.data)) {
          setPlans(response.data)
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setIsLoadingPlans(false)
      }
    }

    fetchPlans()

    const checkAuthAndFetch = () => {
      const token = localStorage.getItem('token')
      const authenticated = !!token
      setIsAuthenticated(authenticated)

      if (authenticated) {
        fetchSuggestedUsers()
      } else {
        setSuggestedUsers([])
      }
    }

    // Check on mount
    checkAuthAndFetch()

    // Listen for storage changes (login/logout in other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuthAndFetch()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!isLoadingPlans && plans.length > 0) {
      const scrollTo = sessionStorage.getItem('scrollTo')
      if (scrollTo === 'pricing') {
        const element = document.getElementById('pricing')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
          sessionStorage.removeItem('scrollTo')
        }
      }
    }
  }, [isLoadingPlans, plans])

  const fetchSuggestedUsers = async () => {
    setIsLoadingSuggestions(true)
    try {
      const response = await authApi.browseSkills()
      if (response.success && Array.isArray(response.data)) {
        // Limit to 4 users and format them
        const users = response.data.slice(0, 4).map((user: BrowseSkillResult) => {
          const teachSkills = user.teachSkills && user.teachSkills.length > 0
            ? user.teachSkills.slice(0, 3).join(', ')
            : 'No skills listed'
          return {
            name: user.name,
            skill: `Teaches: ${teachSkills}`,
            img: user.profilePic || "/placeholder.svg",
            profileId: user.profileId,
            userId: user.id
          }
        })
        setSuggestedUsers(users)
      } else {
        setSuggestedUsers([])
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error)
      setSuggestedUsers([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleViewProfile = (profileId: string, userId?: string) => {
    sessionStorage.setItem("selectedProfileId", profileId)
    if (userId) {
      sessionStorage.setItem("selectedUserId", userId)
    }
    navigation.navigateTo(Page.ViewProfile)
  }

  return (
    <div className="bg-brand-light-blue min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-r from-brand-teal via-brand-teal-dark to-brand-teal bg-[length:200%_200%] animate-bg-wave text-white p-8 md:p-12 rounded-2xl shadow-lg mb-12 overflow-hidden flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 z-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold">Welcome to Hunar Bazaar!</h1>
            <p className="text-lg text-gray-200 mt-4 max-w-xl mx-auto md:mx-0">
              Ready to learn something new or share your expertise? Explore skills, connect with tutors, and start your journey today.
            </p>
          </div>
          <div className="md:w-1/3 mt-8 md:mt-0 flex justify-center z-10">
            <img src="/asset/1.gif" alt="Learning Illustration" className="rounded-lg shadow-xl" />
          </div>
        </div>

        {/* Popular Skills Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-teal mb-6">Explore Skills</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {popularSkills.map((skill) => {
              const Icon = skill.icon
              return (
                <div
                  key={skill.name}
                  className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm text-center hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center ${skill.bgColor}`}>
                    <Icon className={`w-8 h-8 ${skill.textColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{skill.name}</h3>
                </div>
              )
            })}
          </div>
        </section>

        {/* Suggestions For You */}
        {isAuthenticated && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-brand-teal mb-6">Suggestions For You</h2>
            {isLoadingSuggestions ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading suggestions...</p>
              </div>
            ) : suggestedUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedUsers.map((user, index) => (
                  <div
                    key={`${user.profileId}-${index}`}
                    className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={user.img || "/placeholder.svg"}
                      alt={user.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white ring-2 ring-brand-teal/20 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                    <h3 className="text-lg font-semibold text-brand-teal">{user.name}</h3>
                    <p className="text-gray-500 text-sm">{user.skill}</p>
                    <button
                      onClick={() => handleViewProfile(user.profileId, user.userId)}
                      className="mt-4 bg-brand-teal/10 text-brand-teal px-4 py-1.5 rounded-full text-sm font-medium hover:bg-brand-teal/20"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No suggestions available at the moment.</p>
              </div>
            )}
          </section>
        )}

        {/* Pricing Section */}
        <section id="pricing">
          <h2 className="text-2xl font-bold text-brand-teal mb-6 text-center">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-y-12 md:gap-8 max-w-7xl mx-auto">
            {isLoadingPlans ? (
              <div className="md:col-span-3 text-center py-12 text-gray-500">Loading plans...</div>
            ) : plans.length > 0 ? (
              plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`p-8 rounded-xl shadow-lg border transition-all flex flex-col relative ${plan.type === 'Premium'
                    ? 'bg-brand-teal text-white ring-4 ring-white md:transform md:scale-105'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-brand-teal'
                    }`}
                >
                  {plan.type === 'Premium' && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white text-brand-teal text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold ${plan.type === 'Premium' ? 'text-white' : 'text-brand-teal'}`}>{plan.name}</h3>
                  <p className={`mt-2 ${plan.type === 'Premium' ? 'text-gray-300' : 'text-gray-500'}`}>{plan.description}</p>
                  <p className={`mt-4 text-4xl font-bold ${plan.type === 'Premium' ? 'text-white' : 'text-gray-800'}`}>
                    {plan.price === 0 ? 'Free' : `${plan.price.toFixed(2)} ${plan.currency}`}
                    {plan.price > 0 && <span className={`text-lg font-normal ${plan.type === 'Premium' ? 'text-gray-300' : 'text-gray-500'}`}>/month</span>}
                  </p>
                  <ul className="mt-6 space-y-3 flex-grow">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircleIcon className={`w-5 h-5 mr-2 shrink-0 ${plan.type === 'Premium' ? 'text-white' : 'text-green-500'}`} />
                        <span className={plan.type === 'Premium' ? 'text-white' : 'text-gray-600'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      if (plan.price > 0) {
                        sessionStorage.setItem('selectedPlan', plan.type);
                        navigation.navigateTo(Page.Checkout);
                      }
                    }}
                    className={`mt-8 w-full py-3 rounded-lg font-semibold transition-colors ${plan.type === 'Premium'
                      ? 'bg-white text-brand-teal hover:bg-gray-200'
                      : plan.type === 'Free'
                        ? 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 cursor-default'
                        : 'bg-brand-teal text-white hover:bg-brand-teal-dark'
                      }`}
                  >
                    {plan.type === 'Free' ? 'Your Current Plan' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              ))
            ) : (
              <div className="md:col-span-3 text-center py-12 text-gray-500">No subscription plans available.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
