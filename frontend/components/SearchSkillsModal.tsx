"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Page, type Navigation } from "../App"
import { SearchIcon } from "./icons/MiscIcons"
import { CloseIcon } from "./icons/MenuIcons"

interface SearchResult {
  id: string
  name: string
  skill: string
  img: string
  rating?: number
  reviews?: number
}

interface SearchSkillsModalProps {
  isOpen: boolean
  onClose: () => void
  navigation: Navigation
}

const SearchSkillsModal: React.FC<SearchSkillsModalProps> = ({ isOpen, onClose, navigation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const allUsers: SearchResult[] = [
    { id: "1", name: "Ayesha Rana", skill: "JS, React", img: "/asset/p1.jfif", rating: 4.8, reviews: 47 },
    { id: "2", name: "Ali Khan", skill: "C++, Python", img: "/asset/p2.png", rating: 4.9, reviews: 52 },
    { id: "3", name: "Jaweria Rehman", skill: "UI/UX, Figma", img: "/asset/p3.jpg", rating: 4.7, reviews: 38 },
    { id: "4", name: "Ahmad Khan", skill: "SQL, Databases", img: "/asset/p4.jpg", rating: 4.6, reviews: 29 },
    { id: "5", name: "Emaan Fatima", skill: "Data Science, ML", img: "/asset/p1.jfif", rating: 4.9, reviews: 61 },
    { id: "6", name: "Arsal Arham", skill: "Web Dev, Node.js", img: "/asset/p2.png", rating: 4.8, reviews: 43 },
    { id: "7", name: "Fatima Ali", skill: "Python, Django", img: "/asset/p3.jpg", rating: 4.7, reviews: 35 },
    { id: "8", name: "Issa Khan", skill: "Mobile Dev, Flutter", img: "/asset/p4.jpg", rating: 4.8, reviews: 45 },
  ]

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.skill.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleUserSelect = (userId: string) => {
    // Store selected user ID in sessionStorage to pass to ViewProfilePage
    sessionStorage.setItem("selectedUserId", userId)
    navigation.navigateTo(Page.ViewProfile)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-brand-light-blue">
            <h2 className="text-lg font-semibold text-brand-teal">Search Skills & Users</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close search">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for skills or tutors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-gray-50 text-gray-800 rounded-lg py-3 pl-10 pr-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {searchQuery.trim() === "" ? (
              <div className="p-8 text-center text-gray-500">
                <p>Start typing to search for skills or tutors...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleUserSelect(result.id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
                  >
                    <img
                      src={result.img || "/placeholder.svg"}
                      alt={result.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{result.name}</h3>
                      <p className="text-sm text-gray-600">Teaches: {result.skill}</p>
                      {result.rating && (
                        <p className="text-xs text-gray-500 mt-1">
                          ★ {result.rating} ({result.reviews} reviews)
                        </p>
                      )}
                    </div>
                    <button className="bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-full text-sm font-medium hover:bg-brand-teal/20 transition-colors">
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SearchSkillsModal
