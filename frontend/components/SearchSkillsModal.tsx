"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Page, type Navigation } from "../App"
import { SearchIcon } from "./icons/MiscIcons"
import { CloseIcon } from "./icons/MenuIcons"
import { authApi, type BrowseSkillResult } from "../utils/api"

interface SearchSkillsModalProps {
  isOpen: boolean
  onClose: () => void
  navigation: Navigation
}

const SearchSkillsModal: React.FC<SearchSkillsModalProps> = ({ isOpen, onClose, navigation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<BrowseSkillResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setSearchResults([])
      setErrorMessage("")
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      setSearchResults([])
      setErrorMessage("")
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setErrorMessage("")

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await authApi.browseSkills(trimmedQuery)
        if (isCancelled) return

        if (response.success && Array.isArray(response.data)) {
          setSearchResults(response.data)
        } else {
          setSearchResults([])
          setErrorMessage(response.message || "No results found.")
        }
      } catch (error) {
        if (!isCancelled) {
          setSearchResults([])
          setErrorMessage("Failed to fetch results. Please try again.")
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [searchQuery, isOpen])

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
            ) : isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <p>Searching for "{searchQuery}"...</p>
              </div>
            ) : errorMessage ? (
              <div className="p-8 text-center text-red-500">
                <p>{errorMessage}</p>
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
                      src={result.profilePic || "/asset/user1.jpg"}
                      alt={result.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{result.name}</h3>
                      <p className="text-sm text-gray-600">
                        Teaches:{" "}
                        {result.teachSkills && result.teachSkills.length > 0
                          ? result.teachSkills.slice(0, 3).join(", ")
                          : "N/A"}
                      </p>
                      {result.learnSkills && result.learnSkills.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Learning: {result.learnSkills.slice(0, 2).join(", ")}
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
