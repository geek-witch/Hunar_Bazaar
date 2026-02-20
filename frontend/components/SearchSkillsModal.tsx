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
  query: string
}

const SearchSkillsModal: React.FC<SearchSkillsModalProps> = ({ isOpen, onClose, navigation, query }) => {
  const [searchResults, setSearchResults] = useState<BrowseSkillResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setSearchResults([])
      setErrorMessage("")
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const trimmedQuery = query.trim()
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
  }, [query, isOpen])

  const handleUserSelect = (profileId: string, userId?: string) => {
    sessionStorage.setItem("selectedProfileId", profileId)
    if (userId) {
      sessionStorage.setItem("selectedUserId", userId)
    }
    navigation.navigateTo(Page.ViewProfile)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100">
      {/* Results Only */}
      <div className="overflow-y-auto max-h-[60vh] p-2">
        {query.trim() === "" ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            <p>Type to search skills & tutors...</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            <p>Searching...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-4 text-center text-red-500 text-sm">
            <p>{errorMessage}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No matches for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-1">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleUserSelect(result.profileId || result.id, result.id)}
                className="p-2 hover:bg-brand-light-blue/30 cursor-pointer transition-colors flex items-center gap-3 rounded-lg"
              >
                <img
                  src={result.profilePic || "/asset/user1.jpg"}
                  alt={result.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{result.name}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    <span className="text-brand-teal font-medium">
                      {result.teachSkills && result.teachSkills.length > 0
                        ? result.teachSkills.slice(0, 2).join(", ")
                        : "N/A"}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchSkillsModal
