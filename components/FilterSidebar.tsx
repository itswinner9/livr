'use client'

import { useState, useEffect } from 'react'
import { MapPin, Star, Building2, UserCheck, Building, Sliders, X, ChevronDown, ChevronUp, MessageSquare, Shield, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    location: string
    category: string
    ratingRange: { min: number; max: number }
    hasReviews: boolean
    verifiedOnly: boolean
    recentActivity: boolean
    multipleReviews: boolean
    sortBy: string
  }
  onFiltersChange: (filters: any) => void
}

export default function FilterSidebar({ isOpen, onClose, filters, onFiltersChange }: FilterSidebarProps) {
  const [isClient, setIsClient] = useState(false)
  const [locations, setLocations] = useState<string[]>([])
  const [provinces, setProvinces] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    category: true,
    rating: true,
    reviews: true,
    sort: true
  })

  useEffect(() => {
    setIsClient(true)
    fetchLocations()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const fetchLocations = async () => {
    try {
      setLoading(true)
      
      // Fetch unique cities and provinces from all tables
      const [neighborhoodRes, buildingRes, landlordRes, companyRes] = await Promise.all([
        supabase.from('neighborhoods').select('city, province'),
        supabase.from('buildings').select('city, province'),
        supabase.from('landlords').select('city, province'),
        supabase.from('rent_companies').select('city, province')
      ])

      const allLocations = new Set<string>()
      const allProvinces = new Set<string>()

      // Combine all location data
      const allData = [
        ...(neighborhoodRes.data || []),
        ...(buildingRes.data || []),
        ...(landlordRes.data || []),
        ...(companyRes.data || [])
      ]

      allData.forEach(item => {
        if (item.city && item.province) {
          allLocations.add(`${item.city}, ${item.province}`)
          allProvinces.add(item.province)
        }
      })

      setLocations(Array.from(allLocations).sort())
      setProvinces(Array.from(allProvinces).sort())
    } catch (error) {
      console.error('Error fetching locations:', error)
      // Fallback to hardcoded locations
      setLocations([
        'Toronto, ON',
        'Vancouver, BC',
        'Montreal, QC',
        'Calgary, AB',
        'Ottawa, ON',
        'Edmonton, AB'
      ])
      setProvinces(['ON', 'BC', 'QC', 'AB'])
    } finally {
      setLoading(false)
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({
      location: '',
      category: 'all',
      ratingRange: { min: 0, max: 5 },
      hasReviews: false,
      verifiedOnly: false,
      recentActivity: false,
      multipleReviews: false,
      sortBy: 'rating'
    })
  }

  // Dynamic locations are now fetched in state

  const categories = [
    { id: 'all', label: 'All Categories', icon: Sliders },
    { id: 'neighborhoods', label: 'Neighborhoods', icon: MapPin },
    { id: 'buildings', label: 'Buildings', icon: Building2 },
    { id: 'landlords', label: 'Landlords', icon: UserCheck },
    { id: 'companies', label: 'Rent Companies', icon: Building }
  ]

  const reviewFilters = [
    { id: 'hasReviews', label: 'Has Reviews Only', icon: MessageSquare },
    { id: 'multipleReviews', label: '3+ Reviews', icon: TrendingUp },
    { id: 'recentActivity', label: 'Recent Activity (6 months)', icon: Clock },
    { id: 'verifiedOnly', label: 'Verified Reviews Only', icon: Shield }
  ]

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'newest', label: 'Recently Added' }
  ]

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="w-80 lg:w-80 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-50 
        transition-transform duration-300 overflow-y-auto sidebar-scroll
        ${isOpen ? 'translate-x-0 slide-in-left' : '-translate-x-full lg:translate-x-0'}
        w-80 lg:w-80
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Custom Filter</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Location Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">Location</span>
            </div>
            
            <div className="space-y-2 pl-6">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <>
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="location"
                      value=""
                      checked={filters.location === ''}
                      onChange={(e) => updateFilter('location', e.target.value)}
                      className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900 text-sm font-medium">
                      All Locations
                    </span>
                  </label>
                  
                  {/* Provinces */}
                  {provinces.length > 0 && (
                    <>
                      <div className="pt-2 pb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provinces</span>
                      </div>
                      {provinces.map((province) => (
                        <label key={province} className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="location"
                            value={province}
                            checked={filters.location === province}
                            onChange={(e) => updateFilter('location', e.target.value)}
                            className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900 text-sm font-medium">
                            {province}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                  
                  {/* Cities */}
                  {locations.length > 0 && (
                    <>
                      <div className="pt-2 pb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cities</span>
                      </div>
                      {locations.map((location) => (
                        <label key={location} className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="location"
                            value={location}
                            checked={filters.location === location}
                            onChange={(e) => updateFilter('location', e.target.value)}
                            className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900 text-sm">
                            {location}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">Category</span>
            </div>
            
            <div className="space-y-2 pl-6">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <label key={category.id} className="flex items-center justify-between cursor-pointer group hover:bg-gray-50 p-2 rounded-lg -mx-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={filters.category === category.id}
                          onChange={(e) => updateFilter('category', e.target.value)}
                          className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                        />
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 text-sm">
                          {category.label}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Rating Range Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">Minimum Rating</span>
            </div>
            
            <div className="space-y-2 pl-6">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    value={0}
                    checked={filters.ratingRange.min === 0}
                    onChange={() => updateFilter('ratingRange', { min: 0, max: 5 })}
                    className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-600">Any Rating</span>
                </label>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={filters.ratingRange.min === rating}
                      onChange={(e) => updateFilter('ratingRange', { min: parseInt(e.target.value), max: 5 })}
                      className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                    />
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">& Up</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Review Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">Review Filters</span>
            </div>
            
            <div className="space-y-3 pl-6">
                {reviewFilters.map((filter) => {
                  const Icon = filter.icon
                  return (
                    <label key={filter.id} className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg -mx-2">
                      <input
                        type="checkbox"
                        checked={filters[filter.id as keyof typeof filters] as boolean}
                        onChange={(e) => updateFilter(filter.id, e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-2 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 group-hover:text-gray-900 text-sm">
                        {filter.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">Sort By</span>
            </div>
            
            <div className="space-y-2 pl-6">
                {sortOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={filters.sortBy === option.value}
                      onChange={(e) => updateFilter('sortBy', e.target.value)}
                      className="w-4 h-4 text-primary-600 border-2 border-gray-300 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900 text-sm">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}