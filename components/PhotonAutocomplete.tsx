'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'

interface PhotonAutocompleteProps {
  onLocationSelect: (query: string, data?: any) => void
  placeholder?: string
  showIcon?: boolean
  type?: 'neighborhood' | 'building' | 'general'
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]
    type: string
  }
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    street?: string
    housenumber?: string
    postcode?: string
    osm_type?: string
    osm_key?: string
  }
}

export default function PhotonAutocomplete({ 
  onLocationSelect, 
  placeholder = "Search for neighborhoods or buildings...",
  showIcon = false,
  type = 'general'
}: PhotonAutocompleteProps) {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceTimer = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchPhoton = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🔍 Searching Photon for:', searchQuery)
      
      // Use Photon API (free, no API key needed!)
      // Add Canada bias by using coordinates
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery + ' Canada')}&limit=20&lang=en&lat=56.1304&lon=-106.3468`,
        { 
          signal: AbortSignal.timeout(8000),
          headers: {
            'Accept': 'application/json',
          }
        }
      )
      
      if (!response.ok) {
        console.error('Photon API error:', response.status)
        throw new Error('Search failed')
      }

      const data = await response.json()
      console.log('✅ Photon results:', data.features?.length || 0)
      
      // Filter for Canada first
      let canadianResults = (data.features || []).filter((feature: PhotonFeature) => {
        const country = feature.properties.country
        return country === 'Canada' || country === 'CA'
      })
      
      // Additional filtering for neighborhood searches
      if (type === 'neighborhood') {
        canadianResults = canadianResults.filter((feature: PhotonFeature) => {
          const props = feature.properties
          // Filter out specific street addresses with house numbers
          // Keep neighborhoods, districts, places, cities
          if (props.housenumber) {
            return false // Remove specific addresses
          }
          
          // Keep if it's a place type (neighborhood, suburb, city, etc.)
          if (props.osm_key === 'place') {
            return true
          }
          
          // Keep if no street is specified (likely an area/neighborhood)
          if (!props.street) {
            return true
          }
          
          return false
        })
      }
      
      console.log('🇨🇦 Canadian results:', canadianResults.length)
      
      setSuggestions(canadianResults.slice(0, 8))
      setShowSuggestions(canadianResults.length > 0)
    } catch (error) {
      console.error('❌ Photon search error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    
    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      searchPhoton(value)
    }, 300)
  }

  const handleSelect = (feature: PhotonFeature) => {
    const props = feature.properties
    const coords = feature.geometry.coordinates
    
    // Build address string
    let fullAddress = ''
    if (props.housenumber && props.street) {
      fullAddress = `${props.housenumber} ${props.street}`
    } else if (props.street) {
      fullAddress = props.street
    } else {
      fullAddress = props.name || ''
    }
    
    const city = props.city || ''
    const province = props.state || ''
    const name = props.name || city || fullAddress
    
    // Format display text
    const displayText = `${name}${city ? ', ' + city : ''}${province ? ', ' + province : ''}`
    setQuery(displayText)
    setShowSuggestions(false)
    
    // Call parent callback
    onLocationSelect(displayText, {
      name: name,
      address: fullAddress || name,
      city: city,
      province: province,
      latitude: coords[1],
      longitude: coords[0]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onLocationSelect(query)
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            type="text"
            disabled
            placeholder={placeholder}
            className={`w-full ${showIcon ? 'pl-12' : 'pl-4'} pr-28 py-4 bg-white border-none rounded-xl focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-base`}
          />
          <button
            type="button"
            disabled
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {showIcon && (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          )}
          
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            placeholder={placeholder}
            className={`w-full ${showIcon ? 'pl-12' : 'pl-4'} pr-28 py-4 bg-white border-none rounded-xl focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-base`}
          />
          
          {isLoading && (
            <div className="absolute right-24 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
          )}
          
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {suggestions.map((feature, index) => {
            const props = feature.properties
            const isSelected = index === selectedIndex
            
            // Build display text
            let mainText = props.name || props.street || 'Unknown'
            let subText = [props.city, props.state].filter(Boolean).join(', ')
            
            // Add house number if available
            if (props.housenumber && props.street) {
              mainText = `${props.housenumber} ${props.street}`
              subText = [props.name, props.city, props.state].filter(Boolean).join(', ')
            }
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(feature)}
                className={`w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  isSelected ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{mainText}</p>
                    {subText && (
                      <p className="text-sm text-gray-600 truncate">{subText}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && query.length >= 3 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50">
          <p className="text-gray-500 text-sm text-center">
            No results found in Canada. Try a different search term.
          </p>
        </div>
      )}
    </div>
  )
}

