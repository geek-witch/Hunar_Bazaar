"use client"

import type React from "react"
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

const HomePage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const popularSkills = [
    { name: "Web Development", icon: WebDevIcon, bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { name: "UI/UX Design", icon: DesignIcon, bgColor: "bg-green-100", textColor: "text-green-600" },
    { name: "Data Science", icon: DataScienceIcon, bgColor: "bg-purple-100", textColor: "text-purple-600" },
    { name: "CyberSecurity", icon: CyberSecurityIcon, bgColor: "bg-orange-100", textColor: "text-orange-600" },
    { name: "Mobile Development", icon: MobileDevIcon, bgColor: "bg-red-100", textColor: "text-red-600" },
    { name: "Artificial Intelligence", icon: BrainIcon, bgColor: "bg-gray-100", textColor: "text-gray-600" },
  ]

  const suggestedUsers = [
    { name: "Ayesha Rana", skill: "Teaches: JS, React", img: "/asset/p1.jfif" },
    { name: "Ali Qais", skill: "Teaches: C++, Python", img: "/asset/p2.png" },
    { name: "Sana Noor", skill: "Teaches: UI/UX, Figma", img: "/asset/p3.jpg" },
    { name: "Ahmad Amjad", skill: "Teaches: SQL, Databases", img: "/asset/p4.jpg" },
  ]

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
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-teal mb-6">Suggestions For You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedUsers.map((user) => (
              <div
                key={user.name}
                className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-lg transition-shadow"
              >
                <img
                  src={user.img || "/placeholder.svg"}
                  alt={user.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white ring-2 ring-brand-teal/20"
                />
                <h3 className="text-lg font-semibold text-brand-teal">{user.name}</h3>
                <p className="text-gray-500 text-sm">{user.skill}</p>
                <button
                  onClick={() => navigation.navigateTo(Page.ViewProfile)}
                  className="mt-4 bg-brand-teal/10 text-brand-teal px-4 py-1.5 rounded-full text-sm font-medium hover:bg-brand-teal/20"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section>
          <h2 className="text-2xl font-bold text-brand-teal mb-6 text-center">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-y-12 md:gap-8 max-w-7xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col hover:border-brand-teal transition-all">
              <h3 className="text-2xl font-bold text-brand-teal">Basic</h3>
              <p className="mt-2 text-gray-500">For casual learners</p>
              <p className="mt-4 text-4xl font-bold text-gray-800">Free</p>
              <ul className="mt-6 space-y-3 text-gray-600 flex-grow">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Skill exchange for free
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Access the basic features
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Basic profile customization and management
                </li>
              </ul>
              <button className="mt-8 w-full bg-brand-teal/10 text-brand-teal py-3 rounded-lg font-semibold hover:bg-brand-teal/20 transition-colors">
                Your Current Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-brand-teal text-white p-8 rounded-xl shadow-2xl flex flex-col ring-4 ring-white md:transform md:scale-105 relative">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white text-brand-teal text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold">Premium</h3>
              <p className="mt-2 text-gray-300">For dedicated learners & teachers</p>
              <p className="mt-4 text-4xl font-bold">
                300.00 PKR<span className="text-lg font-normal text-gray-300">/month</span>
              </p>
              <ul className="mt-6 space-y-3 flex-grow">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-white mr-2 shrink-0" /> Unlimited skill exchanges
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-white mr-2 shrink-0" /> Advanced profile analytics
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-white mr-2 shrink-0" /> AI support
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-white mr-2 shrink-0" /> Reminders Option
                </li>
              </ul>
              <button
                onClick={() => navigation.navigateTo(Page.Checkout)}
                className="mt-8 w-full bg-white text-brand-teal py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Upgrade to Premium
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col hover:border-brand-teal transition-all">
              <h3 className="text-2xl font-bold text-brand-teal">Professional</h3>
              <p className="mt-2 text-gray-500">For power users & companies</p>
              <p className="mt-4 text-4xl font-bold text-gray-800">
                500.00 PKR<span className="text-lg font-normal text-gray-500">/month</span>
              </p>
              <ul className="mt-6 space-y-3 text-gray-600 flex-grow">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Everything in Premium
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Access for all Employees
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Access to exclusive workshops
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 shrink-0" /> Customized AI features
                </li>
              </ul>
              <button
                onClick={() => navigation.navigateTo(Page.Checkout)}
                className="mt-8 w-full bg-brand-teal text-white py-3 rounded-lg font-semibold hover:bg-brand-teal-dark transition-colors"
              >
                Upgrade to Professional
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
