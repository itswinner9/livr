'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, SlidersHorizontal, X, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import PropertyCard from '@/components/PropertyCard'
import { ExploreSkeleton, InlineSpinner } from '@/components/LoadingStates'

function ExploreContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type') || 'all'

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isClient, setIsClient] = useState(false)
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [landlords, setLandlords] = useState<any[]>([])
  const [rentCompanies, setRentCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 24
  
  const [filters, setFilters] = useState({
    category: initialType || 'all',
    sortBy: 'rating' as 'rating' | 'reviews' | 'newest' | 'lowest',
    ratingMin: 0,
    hasReviews: false,
    multipleReviews: false,
    location: '',
  })

  const searchDebounceTimer = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)

    try {
      // Build query params
      const params = new URLSearchParams({
        category: filters.category,
        q: searchQuery,
        location: filters.location,
        ratingMin: filters.ratingMin.toString(),
        hasReviews: filters.hasReviews.toString(),
        multipleReviews: filters.multipleReviews.toString(),
        sortBy: filters.sortBy,
      })

      console.log('📡 Fetching from /api/explore:', params.toString())

      const response = await fetch(`/api/explore?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      })

      console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API Error:', response.status, errorData)
        
        if (response.status === 504) {
          console.error('Request timed out')
          setLoading(false)
          return
        }
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Data received:', {
        neighborhoods: data.neighborhoods?.length || 0,
        buildings: data.buildings?.length || 0,
        landlords: data.landlords?.length || 0,
        rentCompanies: data.rentCompanies?.length || 0,
      })

      setNeighborhoods(data.neighborhoods || [])
      setBuildings(data.buildings || [])
      setLandlords(data.landlords || [])
      setRentCompanies(data.rentCompanies || [])
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled
      }
      console.error('Error fetching data:', error)
      setNeighborhoods([])
      setBuildings([])
      setLandlords([])
      setRentCompanies([])
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery])

  useEffect(() => {
    if (isClient) {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current)
      }

      searchDebounceTimer.current = setTimeout(() => {
        fetchData()
        setCurrentPage(1)
      }, 300)

      return () => {
        if (searchDebounceTimer.current) {
          clearTimeout(searchDebounceTimer.current)
        }
      }
    }
  }, [isClient, searchQuery, filters, fetchData])

  const getAllResults = () => {
    let results: any[] = []
    
    if (filters.category === 'all') {
      results = [
        ...neighborhoods.map(item => ({ ...item, type: 'neighborhood' })),
        ...buildings.map(item => ({ ...item, type: 'building' })),
        ...landlords.map(item => ({ ...item, type: 'landlord' })),
        ...rentCompanies.map(item => ({ ...item, type: 'rent-company' }))
      ]
    } else if (filters.category === 'neighborhoods') {
      results = neighborhoods.map(item => ({ ...item, type: 'neighborhood' }))
    } else if (filters.category === 'buildings') {
      results = buildings.map(item => ({ ...item, type: 'building' }))
    } else if (filters.category === 'landlords') {
      results = landlords.map(item => ({ ...item, type: 'landlord' }))
    } else if (filters.category === 'companies') {
      results = rentCompanies.map(item => ({ ...item, type: 'rent-company' }))
    }

    // Apply sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          const ratingA = a.overall_rating || a.average_rating || 0
          const ratingB = b.overall_rating || b.average_rating || 0
          if (ratingB !== ratingA) return ratingB - ratingA
          return (b.total_reviews || 0) - (a.total_reviews || 0)
        case 'reviews':
          return (b.total_reviews || 0) - (a.total_reviews || 0)
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'lowest':
          const lowA = a.overall_rating || a.average_rating || 0
          const lowB = b.overall_rating || b.average_rating || 0
          return lowA - lowB
        default:
          return 0
      }
    })

    return results
  }

  const results = getAllResults()
  
  // Pagination calculations
  const totalPages = Math.ceil(results.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedResults = results.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)

    if (currentPage > 3) {
      pages.push('...')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('...')
    }

    pages.push(totalPages)

    return pages
  }

  if (!isClient) {
    return <ExploreSkeleton />
  }

  const categoryOptions = [
    { value: 'all', label: 'All' },
    { value: 'neighborhoods', label: 'Neighborhoods' },
    { value: 'buildings', label: 'Buildings' },
    { value: 'landlords', label: 'Landlords' },
    { value: 'companies', label: 'Companies' }
  ]

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'newest', label: 'Newest First' },
    { value: 'lowest', label: 'Lowest Rated' },
  ]

  const activeFiltersCount = [
    filters.ratingMin > 0,
    filters.hasReviews,
    filters.multipleReviews,
    filters.location.trim() !== '',
  ].filter(Boolean).length

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-3">
            Explore Properties
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover top-rated neighborhoods, buildings, and landlords
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, or location..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
              style={{ fontSize: '16px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFilters({ ...filters, category: option.value })
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  filters.category === option.value
                    ? 'bg-gradient-to-r from-primary-600 to-orange-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters({ ...filters, sortBy: e.target.value as any })
                setCurrentPage(1)
              }}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none shadow-sm hover:border-primary-300 transition-colors"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filter Toggle Button */}
                <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 bg-white border rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${
                showFilters || activeFiltersCount > 0
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-gray-300 text-gray-700 hover:border-primary-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                    </span>
                  )}
                </button>
                
            {/* Results Count */}
            <div className="text-sm text-gray-600 font-medium">
              {results.length.toLocaleString()} {results.length === 1 ? 'result' : 'results'}
            </div>
          </div>

          {loading && (
            <div className="flex items-center text-sm font-medium text-primary-600">
              <div className="w-4 h-4 border-2 border-primary-300 rounded-full animate-spin border-t-primary-600 mr-2"></div>
              Loading...
            </div>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Minimum Rating: {filters.ratingMin.toFixed(1)} ⭐
                </label>
                    <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.ratingMin}
                  onChange={(e) => {
                    setFilters({ ...filters, ratingMin: parseFloat(e.target.value) })
                    setCurrentPage(1)
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => {
                    setFilters({ ...filters, location: e.target.value })
                    setCurrentPage(1)
                  }}
                  placeholder="City or province..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Boolean Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasReviews}
                      onChange={(e) => {
                        setFilters({ ...filters, hasReviews: e.target.checked })
                        setCurrentPage(1)
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Has Reviews</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.multipleReviews}
                      onChange={(e) => {
                        setFilters({ ...filters, multipleReviews: e.target.checked })
                        setCurrentPage(1)
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">3+ Reviews</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                    <button 
                  onClick={() => {
                    setFilters({
                      category: filters.category,
                      sortBy: 'rating',
                      ratingMin: 0,
                      hasReviews: false,
                      multipleReviews: false,
                      location: '',
                    })
                    setCurrentPage(1)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Grid */}
        {loading && results.length === 0 ? (
          <ExploreSkeleton />
        ) : loading && results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((property) => (
                <PropertyCard
                  key={`${property.type}-${property.id}`}
                  property={property}
                  type={property.type}
                />
              ))}
            </div>
            <InlineSpinner message="Updating results..." />
          </>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedResults.map((property) => (
                  <PropertyCard
                    key={`${property.type}-${property.id}`}
                    property={property}
                    type={property.type}
                  />
                ))}
              </div>

            {/* Improved Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Info */}
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, results.length)} of {results.length.toLocaleString()} results
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-primary-600 to-orange-600 text-white shadow-lg scale-110'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No results found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery 
                ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search or filters.`
                : 'No properties match your current filters. Try adjusting your search criteria.'
              }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({
                      category: 'all',
                  sortBy: 'rating',
                  ratingMin: 0,
                      hasReviews: false,
                      multipleReviews: false,
                  location: '',
                    })
                setCurrentPage(1)
                  }}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-orange-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-orange-700 transition-all shadow-lg"
                >
              Clear All Filters
                </button>
              </div>
            )}
      </div>
    </main>
  )
}

export default function Explore() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent />
    </Suspense>
  )
}
