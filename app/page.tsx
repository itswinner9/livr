'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Star, MapPin, Building2, Building as BuildingIcon, TrendingUp, Award, Users, Camera, Shield, User, UserCheck, Heart, CheckCircle, ArrowRight, Compass, HelpCircle, Mail, FileText, Clock, Play, Target, Zap, MessageCircle, BarChart3, Globe, Verified, Sparkles, BadgeCheck, Sparkle, TrendingDown, Home as HomeIcon, KeyRound, Map as MapIcon, ThumbsUp, Gauge, Rocket, Bolt, ChevronRight, Info, Phone, Linkedin, Layers, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Neighborhood, Building } from '@/lib/supabase'
import RateModal from '@/components/RateModal'
import PropertyCard from '@/components/PropertyCard'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'neighborhoods' | 'buildings' | 'landlords' | 'rent-companies'>('all')
  const [isSearching, setIsSearching] = useState(false)
  const searchDebounceTimer = useRef<NodeJS.Timeout>()
  const [topNeighborhoods, setTopNeighborhoods] = useState<Neighborhood[]>([])
  const [topBuildings, setTopBuildings] = useState<Building[]>([])
  const [topLandlords, setTopLandlords] = useState<any[]>([])
  const [topRentCompanies, setTopRentCompanies] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 })
  const [propertyType, setPropertyType] = useState('All Types')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReviews: 0,
    totalLocations: 0
  })

  // Ripple states
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([])
  const [exploreRipples, setExploreRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([])
  
  // Rotating text state
  const [rotatingIndex, setRotatingIndex] = useState(0)
  const rotatingWords = ['neighborhoods', 'buildings', 'landlords']
  
  // Rotating search placeholders
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0)
  const searchPlaceholders = [
    'Search neighborhoods, buildings, landlords...',
    'Find the best places to live...',
    'Discover top-rated properties...',
    'Search by location, rating, or name...',
    'Explore Vancouver neighborhoods...',
    'Find verified reviews...'
  ]

  const createRipple = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, setState: React.Dispatch<React.SetStateAction<Array<{ id: number; x: number; y: number; size: number }>>>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    
    const newRipple = { id: Date.now(), x, y, size }
    setState(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setState(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }

  useEffect(() => {
    // Wrap in try-catch to prevent unhandled errors
    const loadData = async () => {
      try {
        await Promise.all([fetchTopRated(), fetchStats()])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
    
    // Cleanup debounce timer on unmount
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current)
      }
    }
  }, [])

  // Rotating text effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [rotatingWords.length])

  // Rotating search placeholder effect
  useEffect(() => {
    const placeholderInterval = setInterval(() => {
      setSearchPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length)
    }, 4000)
    return () => clearInterval(placeholderInterval)
  }, [searchPlaceholders.length])

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: userCount, error: userError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      
      if (userError) {
        console.warn('Error fetching user count:', userError)
      }
      
      // Get total reviews (all categories)
      const { count: neighborhoodReviews, error: nReviewError } = await supabase
        .from('neighborhood_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
      
      if (nReviewError) {
        console.warn('Error fetching neighborhood reviews:', nReviewError)
      }
      
      const { count: buildingReviews, error: bReviewError } = await supabase
        .from('building_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
      
      if (bReviewError) {
        console.warn('Error fetching building reviews:', bReviewError)
      }
      
      const { count: landlordReviews, error: lReviewError } = await supabase
        .from('landlord_reviews')
        .select('*', { count: 'exact', head: true })
      
      if (lReviewError) {
        console.warn('Error fetching landlord reviews:', lReviewError)
      }
      
      const { count: companyReviews, error: cReviewError } = await supabase
        .from('rent_company_reviews')
        .select('*', { count: 'exact', head: true })
      
      if (cReviewError) {
        console.warn('Error fetching company reviews:', cReviewError)
      }
      
      // Get total unique neighborhoods and buildings
      const { count: neighborhoodCount } = await supabase
        .from('neighborhoods')
        .select('*', { count: 'exact', head: true })
        
      const { count: buildingCount } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true })

      const totalReviews = (neighborhoodReviews || 0) + (buildingReviews || 0) + (landlordReviews || 0) + (companyReviews || 0)
      const totalLocations = (neighborhoodCount || 0) + (buildingCount || 0)

      setStats({
        totalUsers: userCount || 0,
        totalReviews: totalReviews,
        totalLocations: totalLocations
      })

      console.log('✅ Stats fetched:', {
        users: userCount || 0,
        reviews: (neighborhoodReviews || 0) + (buildingReviews || 0),
        locations: (neighborhoodCount || 0) + (buildingCount || 0)
      })
    } catch (error) {
      console.error('❌ Error fetching stats:', error)
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalReviews: 0,
        totalLocations: 0
      })
    }
  }

  const fetchTopRated = async () => {
    try {
      console.log('🔍 Fetching all categories...')
      
      // Fetch ALL neighborhoods, sort by rating and reviews
      const { data: neighborhoods, error: nError } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('overall_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12)

      if (nError) {
        console.error('❌ Error fetching neighborhoods:', nError)
        setTopNeighborhoods([])
      } else {
        console.log('✅ Fetched neighborhoods:', neighborhoods?.length || 0)
        setTopNeighborhoods(neighborhoods || [])
      }

      // Fetch ALL buildings, sort by rating and reviews
      const { data: buildings, error: bError } = await supabase
        .from('buildings')
        .select('*')
        .order('overall_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12)

      if (bError) {
        console.error('❌ Error fetching buildings:', bError)
        setTopBuildings([])
      } else {
        console.log('✅ Fetched buildings:', buildings?.length || 0)
        setTopBuildings(buildings || [])
      }

      // Fetch ALL landlords, sort by rating and reviews
      const { data: landlords, error: lError } = await supabase
        .from('landlords')
        .select('*')
        .order('overall_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12)

      if (lError) {
        console.error('❌ Error fetching landlords:', lError)
        setTopLandlords([])
      } else {
        console.log('✅ Fetched landlords:', landlords?.length || 0)
        setTopLandlords(landlords || [])
      }

      // Fetch ALL rent companies, sort by rating and reviews
      const { data: rentCompanies, error: rError } = await supabase
        .from('rent_companies')
        .select('*')
        .order('overall_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12)

      if (rError) {
        console.error('❌ Error fetching rent companies:', rError)
        setTopRentCompanies([])
      } else {
        console.log('✅ Fetched rent companies:', rentCompanies?.length || 0)
        setTopRentCompanies(rentCompanies || [])
      }
    } catch (error) {
      console.error('❌ Error in fetchTopRated:', error)
      setTopNeighborhoods([])
      setTopBuildings([])
      setTopLandlords([])
      setTopRentCompanies([])
    }
  }

  const handleSearch = (query: string, category?: string) => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    if (category && category !== 'all') {
      params.set('type', category)
    } else if (selectedCategory && selectedCategory !== 'all') {
      params.set('type', selectedCategory)
    }
    const queryString = params.toString()
    router.push(`/explore${queryString ? `?${queryString}` : ''}`)
  }

  const handleCategoryClick = (category: 'neighborhoods' | 'buildings' | 'landlords' | 'rent-companies') => {
    setSelectedCategory(category)
    // Navigate to explore page with category filter
    router.push(`/explore?type=${category}`)
  }

  // Autocomplete function with DB first, then Mapbox
  const fetchAutocompleteSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    try {
      const searchTerm = `%${query}%`
      
      // Fetch based on selected category or all if 'all' is selected
      const promises: Promise<any>[] = []
      
      if (selectedCategory === 'all' || selectedCategory === 'neighborhoods') {
        promises.push(
          Promise.resolve(
            supabase
              .from('neighborhoods')
              .select('id, name, city, province, type')
              .or(`name.ilike.${searchTerm},city.ilike.${searchTerm}`)
              .limit(5)
          ).then(res => res)
        )
      }
      
      if (selectedCategory === 'all' || selectedCategory === 'buildings') {
        promises.push(
          Promise.resolve(
            supabase
              .from('buildings')
              .select('id, name, city, province, type')
              .or(`name.ilike.${searchTerm},city.ilike.${searchTerm}`)
              .limit(5)
          ).then(res => res)
        )
      }
      
      if (selectedCategory === 'all' || selectedCategory === 'landlords') {
        promises.push(
          Promise.resolve(
            supabase
              .from('landlords')
              .select('id, name, city, province, type')
              .or(`name.ilike.${searchTerm},city.ilike.${searchTerm}`)
              .limit(5)
          ).then(res => res)
        )
      }
      
      if (selectedCategory === 'all' || selectedCategory === 'rent-companies') {
        promises.push(
          Promise.resolve(
            supabase
              .from('rent_companies')
              .select('id, name, city, province, type')
              .or(`name.ilike.${searchTerm},city.ilike.${searchTerm}`)
              .limit(5)
          ).then(res => res)
        )
      }
      
      const dbResults = await Promise.all(promises)
      
      // Map results to their types
      let neighborhoodsRes = { data: [] as any[] }
      let buildingsRes = { data: [] as any[] }
      let landlordsRes = { data: [] as any[] }
      let rentCompaniesRes = { data: [] as any[] }
      
      let index = 0
      if (selectedCategory === 'all' || selectedCategory === 'neighborhoods') {
        neighborhoodsRes = dbResults[index++] || { data: [] }
      }
      if (selectedCategory === 'all' || selectedCategory === 'buildings') {
        buildingsRes = dbResults[index++] || { data: [] }
      }
      if (selectedCategory === 'all' || selectedCategory === 'landlords') {
        landlordsRes = dbResults[index++] || { data: [] }
      }
      if (selectedCategory === 'all' || selectedCategory === 'rent-companies') {
        rentCompaniesRes = dbResults[index++] || { data: [] }
      }

      // Combine and format results - filter by selected category if set
      let formattedResults: any[] = []
      
      if (selectedCategory === 'all' || selectedCategory === 'neighborhoods') {
        formattedResults.push(...(neighborhoodsRes.data || []).map(item => ({ ...item, type: 'neighborhood' })))
      }
      if (selectedCategory === 'all' || selectedCategory === 'buildings') {
        formattedResults.push(...(buildingsRes.data || []).map(item => ({ ...item, type: 'building' })))
      }
      if (selectedCategory === 'all' || selectedCategory === 'landlords') {
        formattedResults.push(...(landlordsRes.data || []).map(item => ({ ...item, type: 'landlord' })))
      }
      if (selectedCategory === 'all' || selectedCategory === 'rent-companies') {
        formattedResults.push(...(rentCompaniesRes.data || []).map(item => ({ ...item, type: 'rent-company' })))
      }
      
      // If no results found in DB, try Mapbox search for neighborhoods/places
      if (formattedResults.length === 0 && (selectedCategory === 'all' || selectedCategory === 'neighborhoods')) {
        try {
          const mapboxResults = await searchMapbox(query)
          formattedResults = mapboxResults.slice(0, 8)
        } catch (mapboxError) {
          console.error('Mapbox search error:', mapboxError)
        }
      } else {
        formattedResults = formattedResults.slice(0, 8) // Limit to 8 total results
      }
      
      // For landlords and companies, if no results, show a message to create them
      if (formattedResults.length === 0 && (selectedCategory === 'landlords' || selectedCategory === 'rent-companies' || selectedCategory === 'buildings')) {
        formattedResults.push({
          id: `create_${selectedCategory}`,
          name: `No ${selectedCategory} found. Click to create "${query}"`,
          city: '',
          province: '',
          type: `create-${selectedCategory}`,
          isCreateAction: true,
          query: query
        })
      }

      // If we have DB results, show them
      if (formattedResults.length > 0) {
        setSearchResults(formattedResults)
        setShowSearchResults(true)
        setIsSearching(false)
        return
      }

      // If no DB results, try Mapbox autocomplete
      try {
        const mapboxResults = await searchMapboxAutocomplete(query)
        if (mapboxResults.length > 0) {
          setSearchResults(mapboxResults)
          setShowSearchResults(true)
        } else if (selectedCategory === 'landlords' || selectedCategory === 'rent-companies' || selectedCategory === 'buildings') {
          // For landlords/companies/buildings, show create option
          setSearchResults([{
            id: `create_${selectedCategory}`,
            name: `No ${selectedCategory} found. Click to create "${query}"`,
            city: '',
            province: '',
            type: `create-${selectedCategory}`,
            isCreateAction: true,
            query: query
          }])
          setShowSearchResults(true)
        } else {
          setSearchResults([])
          setShowSearchResults(false)
        }
      } catch (mapboxError) {
        console.error('Mapbox autocomplete error:', mapboxError)
        setSearchResults([])
        setShowSearchResults(false)
      }

      setIsSearching(false)
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error)
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
    }
  }

  // Mapbox autocomplete function - improved for Canadian cities and places
  const searchMapboxAutocomplete = async (query: string): Promise<any[]> => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken) {
      return []
    }

    try {
      // Use Mapbox geocoding with better parameters for Canadian places
      // Search for places, cities, towns, and neighborhoods in Canada
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=ca&` +
        `types=place,locality,neighborhood,district,postcode&` +
        `limit=8&` +
        `autocomplete=true&` +
        `proximity=-106.3468,56.1304&` + // Center of Canada for better results
        `bbox=-141.0,41.7,-52.6,83.1` // Bounding box for Canada
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      
      // Filter and format results
      const results = (data.features || [])
        .filter((feature: any) => {
          // Only include places, cities, neighborhoods - exclude POIs
          const types = feature.place_type || []
          return types.some((type: string) => 
            ['place', 'locality', 'neighborhood', 'district'].includes(type)
          )
        })
        .map((feature: any) => {
          const context = feature.context || []
          
          // Extract city, province, and country from context
          let city = ''
          let province = ''
          let country = 'Canada'
          
          // Parse place_name to extract location info
          const placeParts = feature.place_name?.split(',') || []
          
          // Context parsing
          context.forEach((ctx: any) => {
            if (ctx.id?.startsWith('place')) {
              city = ctx.text || city
            } else if (ctx.id?.startsWith('region')) {
              province = ctx.text || province
            } else if (ctx.id?.startsWith('country')) {
              country = ctx.text || 'Canada'
            }
          })
          
          // If no city from context, try to get from place_name
          if (!city && placeParts.length > 1) {
            city = placeParts[0]?.trim() || ''
          }
          
          // If no province from context, try place_name
          if (!province && placeParts.length > 2) {
            province = placeParts[placeParts.length - 2]?.trim() || ''
          }
          
          // Determine name - use the main text or first part of place_name
          let name = feature.text || feature.place_name?.split(',')[0] || query
          
          // If it's a city/place, use the main feature text
          if (feature.place_type?.includes('place') || feature.place_type?.includes('locality')) {
            name = feature.text || name
            // If city is the same as name, clear city to avoid duplication
            if (city === name) {
              city = ''
            }
          }

          return {
            id: `mapbox_${feature.id}`,
            name: name,
            city: city || '',
            province: province || '',
            country: country,
            type: 'mapbox-neighborhood',
            mapbox_data: {
              place_name: feature.place_name,
              coordinates: feature.center,
              id: feature.id,
              properties: feature.properties,
              place_type: feature.place_type
            },
            isNew: true // Mark as new so user knows they'll be first to rate
          }
        })
      
      // Remove duplicates based on name and city
      const uniqueResults = results.filter((result: any, index: number, self: any[]) => 
        index === self.findIndex((r: any) => 
          r.name === result.name && r.city === result.city && r.province === result.province
        )
      )
      
      return uniqueResults.slice(0, 8)
    } catch (error) {
      console.error('Mapbox autocomplete error:', error)
      return []
    }
  }

  // Mapbox search function - improved for Canadian cities
  const searchMapbox = async (query: string): Promise<any[]> => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken) {
      console.warn('Mapbox token not configured')
      return []
    }

    try {
      // Search for places in Canada with better parameters
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=ca&` +
        `types=place,locality,neighborhood,district,postcode&` +
        `limit=8&` +
        `bbox=-141.0,41.7,-52.6,83.1` // Canada bounding box
      )

      if (!response.ok) {
        throw new Error('Mapbox API error')
      }

      const data = await response.json()
      
      const results = (data.features || [])
        .filter((feature: any) => {
          // Only include places, cities, neighborhoods - exclude POIs
          const types = feature.place_type || []
          return types.some((type: string) => 
            ['place', 'locality', 'neighborhood', 'district'].includes(type)
          )
        })
        .map((feature: any) => {
          const context = feature.context || []
          
          let city = ''
          let province = ''
          let country = 'Canada'
          
          const placeParts = feature.place_name?.split(',') || []
          
          context.forEach((ctx: any) => {
            if (ctx.id?.startsWith('place')) {
              city = ctx.text || city
            } else if (ctx.id?.startsWith('region')) {
              province = ctx.text || province
            } else if (ctx.id?.startsWith('country')) {
              country = ctx.text || 'Canada'
            }
          })
          
          if (!city && placeParts.length > 1) {
            city = placeParts[0]?.trim() || ''
          }
          
          if (!province && placeParts.length > 2) {
            province = placeParts[placeParts.length - 2]?.trim() || ''
          }
          
          let name = feature.text || feature.place_name?.split(',')[0] || query
          
          if (feature.place_type?.includes('place') || feature.place_type?.includes('locality')) {
            name = feature.text || name
            if (city === name) {
              city = ''
            }
          }

          return {
            id: `mapbox_${feature.id}`,
            name: name,
            city: city || '',
            province: province || '',
            country: country,
            type: 'mapbox-neighborhood',
            mapbox_data: {
              place_name: feature.place_name,
              coordinates: feature.center,
              id: feature.id,
              properties: feature.properties,
              place_type: feature.place_type
            },
            isNew: true
          }
        })
      
      // Remove duplicates
      const uniqueResults = results.filter((result: any, index: number, self: any[]) => 
        index === self.findIndex((r: any) => 
          r.name === result.name && r.city === result.city && r.province === result.province
        )
      )
      
      return uniqueResults.slice(0, 8)
    } catch (error) {
      console.error('Mapbox search error:', error)
      return []
    }
  }

  const handleResultClick = async (item: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    
    // If it's a "create" action, navigate to the appropriate rate page
    if (item.isCreateAction) {
      if (item.type === 'create-landlords') {
        router.push(`/rate/landlord?name=${encodeURIComponent(item.query)}`)
        return
      } else if (item.type === 'create-rent-companies') {
        router.push(`/rate/rent-company?name=${encodeURIComponent(item.query)}`)
        return
      } else if (item.type === 'create-buildings') {
        router.push(`/rate/building?name=${encodeURIComponent(item.query)}`)
        return
      }
    }
    
    // If it's a Mapbox result, create it in the database first
    if (item.type === 'mapbox-neighborhood' && item.mapbox_data) {
      try {
        // Create neighborhood in database
        const { data: newNeighborhood, error } = await supabase
          .from('neighborhoods')
          .insert({
            name: item.name,
            city: item.city,
            province: item.province,
            country: item.country || 'Canada',
            latitude: item.mapbox_data.coordinates[1],
            longitude: item.mapbox_data.coordinates[0],
          })
          .select()
          .single()

        if (error && error.code !== '23505') { // Ignore duplicate errors
          console.error('Error creating neighborhood:', error)
          // Still navigate to rate page with mapbox data
          router.push(`/rate/neighborhood?mapbox=${encodeURIComponent(JSON.stringify(item.mapbox_data))}&name=${encodeURIComponent(item.name)}&city=${encodeURIComponent(item.city)}&province=${encodeURIComponent(item.province)}`)
          return
        }

        if (newNeighborhood) {
          router.push(`/neighborhood/${newNeighborhood.id}`)
          return
        }
      } catch (err) {
        console.error('Error handling Mapbox result:', err)
      }
      
      // Fallback: navigate to rate page with mapbox data
      router.push(`/rate/neighborhood?mapbox=${encodeURIComponent(JSON.stringify(item.mapbox_data))}&name=${encodeURIComponent(item.name)}&city=${encodeURIComponent(item.city)}&province=${encodeURIComponent(item.province)}`)
      return
    }
    
    // Regular database result
    router.push(`/${item.type}/${item.id}`)
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Ultra Modern Hero Section with 3D Effects */}
      <section className="relative min-h-screen sm:h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/10 overflow-hidden pt-20 sm:pt-0">
        
        {/* Advanced 3D Background Elements - Reduced on Mobile */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-primary-400/30 to-primary-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 sm:opacity-70 animate-blob animate-float-3d"></div>
          <div className="absolute top-20 right-10 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-orange-400/30 to-orange-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 sm:opacity-70 animate-blob animation-delay-2000 animate-float-3d"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-yellow-300/30 to-yellow-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 sm:opacity-70 animate-blob animation-delay-4000 animate-float-3d"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 sm:opacity-50 animate-blob animation-delay-6000"></div>
        </div>

        {/* Main Content - Mobile Optimized */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-0 sm:h-full flex items-center">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full">
            
            {/* Hero Content - First on Mobile, Left on Desktop */}
              <div className="space-y-6 sm:space-y-8 text-center sm:text-left w-full lg:w-auto order-1">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight animate-fade-in-up">
                    <span className="block">Discover.</span>
                    <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-orange-500 bg-clip-text text-transparent animate-gradient-x">
                      Rate.
                      </span>
                      <Sparkle className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-5 h-5 sm:w-6 sm:h-6 text-primary-400 animate-sparkle" />
                    </span>
                    <span className="block">Live Better.</span>
                  </h1>
                  
                  {/* Rotating Text */}
                  <div className="animate-fade-in-up animation-delay-600">
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 inline-flex flex-wrap items-center justify-center sm:justify-start">
                      Find the best{' '}
                      <span className="ml-2 inline-block">
                        <span className="rotating-word-change bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
                          {rotatingWords[rotatingIndex]}
                        </span>
                      </span>
                    </p>
                  </div>
                  
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed">
                    Powered by{' '}
                    <span className="font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">real community ratings</span>.
                  </p>
                </div>

                {/* Action Buttons with 3D - Mobile Optimized */}
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
                  <button 
                    onClick={() => setShowRateModal(true)}
                    className="group relative bg-gradient-to-r from-primary-600 via-primary-700 to-orange-600 text-white px-6 sm:px-8 py-4 rounded-2xl font-black text-base sm:text-lg hover:from-primary-700 hover:via-primary-800 hover:to-orange-700 transition-all duration-300 shadow-2xl hover:shadow-primary-500/50 active:scale-95 sm:active:scale-105 transform hover:-translate-y-1 sm:hover:-translate-y-2 flex items-center justify-center space-x-2 card-3d animate-glow touch-manipulation min-h-[56px]"
                  >
                    <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Rate Now</span>
                    <Sparkle className="w-4 h-4 group-hover:animate-sparkle" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-orange-400 rounded-2xl blur-2xl opacity-30 group-hover:opacity-60 transition-opacity -z-10"></div>
                  </button>
                  
                  <Link 
                    href="/explore"
                    className="group relative bg-white/90 backdrop-blur-md text-gray-800 px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg border-2 border-gray-200 hover:border-primary-400 hover:bg-white transition-all duration-300 shadow-2xl hover:shadow-3xl active:scale-95 sm:active:scale-105 transform hover:-translate-y-1 sm:hover:-translate-y-2 flex items-center justify-center space-x-2 touch-manipulation min-h-[56px]"
                  >
                    <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform text-primary-600" />
                    <span>Explore All</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform text-primary-600" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Search Content - Second on Mobile, Right on Desktop */}
            <div className="relative w-full lg:w-auto order-2">
              
              {/* Floating Orbs - Hidden on Mobile */}
              <div className="hidden sm:block absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <div className="hidden sm:block absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              {/* Main Search Card with Enhanced 3D - Mobile Optimized */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl sm:rounded-[40px] p-6 sm:p-10 shadow-2xl border-2 border-white/80 hover:shadow-3xl transition-all duration-500 card-3d">
                
                {/* Search Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Start Your Search</h2>
                  <p className="text-sm sm:text-base text-gray-600">Find your perfect place to live</p>
                </div>

                {/* Search Input - Mobile Optimized with Rotating Placeholder */}
                <div className="relative mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-orange-500 rounded-2xl blur-lg opacity-20"></div>
                  <div className="relative flex items-center bg-white rounded-2xl border-2 border-gray-100 focus-within:border-primary-300 transition-all group">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 ml-3 sm:ml-4 flex-shrink-0 group-focus-within:text-primary-500 transition-colors" />
                    
                    {/* Rotating Placeholder Container */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          const value = e.target.value
                          setSearchQuery(value)
                          
                          // Clear previous debounce timer
                          if (searchDebounceTimer.current) {
                            clearTimeout(searchDebounceTimer.current)
                          }
                          
                          // Debounce autocomplete search
                          if (value.length >= 2) {
                            searchDebounceTimer.current = setTimeout(() => {
                              fetchAutocompleteSuggestions(value)
                            }, 300)
                          } else {
                            setSearchResults([])
                            setShowSearchResults(false)
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (searchDebounceTimer.current) {
                              clearTimeout(searchDebounceTimer.current)
                            }
                            handleSearch(searchQuery)
                            setShowSearchResults(false)
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding results to allow clicks
                          setTimeout(() => setShowSearchResults(false), 200)
                        }}
                        onFocus={() => {
                          if (searchQuery.length >= 2 && searchResults.length > 0) {
                            setShowSearchResults(true)
                          }
                        }}
                        className="w-full px-3 sm:px-4 py-4 sm:py-5 bg-transparent text-gray-900 text-base sm:text-lg placeholder-transparent focus:outline-none rounded-2xl"
                        style={{ fontSize: '16px' }} // Prevents zoom on iOS
                      />
                      
                      {/* Animated Placeholder Overlay */}
                      {!searchQuery && (
                        <div className="absolute inset-0 flex items-center pointer-events-none px-3 sm:px-4">
                          <span 
                            key={searchPlaceholderIndex}
                            className="text-base sm:text-lg text-gray-500 transition-opacity duration-500"
                            style={{ animation: 'fade-in 0.5s ease-in-out' }}
                          >
                            {searchPlaceholders[searchPlaceholderIndex]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {isSearching && (
                      <div className="absolute right-16 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      </div>
                    )}
                    
                    {/* Search Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (searchQuery.trim()) {
                          handleSearch(searchQuery)
                          setShowSearchResults(false)
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      Search
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults.map((item, index) => (
                          <button
                            key={`${item.type}-${item.id}-${index}`}
                            onClick={() => handleResultClick(item)}
                            className="w-full px-6 py-4 hover:bg-primary-50 transition-all duration-200 text-left border-b border-gray-100 last:border-b-0 group"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                item.type === 'neighborhood' || item.type === 'mapbox-neighborhood' ? 'bg-blue-100 text-blue-600' :
                                item.type === 'building' ? 'bg-green-100 text-green-600' :
                                item.type === 'landlord' ? 'bg-purple-100 text-purple-600' :
                                item.isCreateAction ? 'bg-yellow-100 text-yellow-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {(item.type === 'neighborhood' || item.type === 'mapbox-neighborhood') && <MapPin className="w-5 h-5" />}
                                {item.type === 'building' && <Building2 className="w-5 h-5" />}
                                {item.type === 'landlord' && <User className="w-5 h-5" />}
                                {item.type === 'rent-company' && <BuildingIcon className="w-5 h-5" />}
                                {item.isCreateAction && <Sparkles className="w-5 h-5" />}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate flex items-center gap-2">
                                  {item.name}
                                  {item.isNew && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      New - Be First!
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {item.city && item.province ? `${item.city}, ${item.province}` : item.city || item.province || 'Canada'}
                                </div>
                              </div>
                              
                              {!item.isCreateAction && (
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.type === 'neighborhood' || item.type === 'mapbox-neighborhood' ? 'bg-blue-100 text-blue-700' :
                                  item.type === 'building' ? 'bg-green-100 text-green-700' :
                                  item.type === 'landlord' ? 'bg-purple-100 text-purple-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {item.type === 'mapbox-neighborhood' ? 'New Location' : item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('-', ' ')}
                                </div>
                              )}
                              {item.isCreateAction && (
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  Create New
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Filters - Mobile Optimized */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                  <button 
                    onClick={() => handleCategoryClick('neighborhoods')}
                    className={`px-3 sm:px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation min-h-[48px] ${
                      selectedCategory === 'neighborhoods' 
                        ? 'bg-primary-600 text-white shadow-lg scale-105' 
                        : 'bg-primary-100 text-primary-700 active:bg-primary-200 hover:bg-primary-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Areas</span>
                  </button>
                  <button 
                    onClick={() => handleCategoryClick('buildings')}
                    className={`px-3 sm:px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation min-h-[48px] ${
                      selectedCategory === 'buildings' 
                        ? 'bg-orange-600 text-white shadow-lg scale-105' 
                        : 'bg-orange-100 text-orange-700 active:bg-orange-200 hover:bg-orange-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Buildings</span>
                  </button>
                  <button 
                    onClick={() => handleCategoryClick('landlords')}
                    className={`px-3 sm:px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation min-h-[48px] ${
                      selectedCategory === 'landlords' 
                        ? 'bg-purple-600 text-white shadow-lg scale-105' 
                        : 'bg-purple-100 text-purple-700 active:bg-purple-200 hover:bg-purple-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Landlords</span>
                  </button>
                  <button 
                    onClick={() => handleCategoryClick('rent-companies')}
                    className={`px-3 sm:px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation min-h-[48px] ${
                      selectedCategory === 'rent-companies' 
                        ? 'bg-green-600 text-white shadow-lg scale-105' 
                        : 'bg-green-100 text-green-700 active:bg-green-200 hover:bg-green-200'
                    }`}
                  >
                    <BuildingIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Companies</span>
                  </button>
                </div>

                {/* Popular Searches - Mobile Optimized */}
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Popular searches:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs sm:text-sm active:bg-gray-200 cursor-pointer transition-all touch-manipulation hover:bg-gray-200" onClick={() => {
                      setSearchQuery('Toronto')
                      handleSearch('Toronto')
                    }}>Toronto</button>
                    <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs sm:text-sm active:bg-gray-200 cursor-pointer transition-all touch-manipulation hover:bg-gray-200" onClick={() => {
                      setSearchQuery('Vancouver')
                      handleSearch('Vancouver')
                    }}>Vancouver</button>
                    <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs sm:text-sm active:bg-gray-200 cursor-pointer transition-all touch-manipulation hover:bg-gray-200" onClick={() => {
                      setSearchQuery('Downtown')
                      handleSearch('Downtown')
                    }}>Downtown</button>
                    <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs sm:text-sm active:bg-gray-200 cursor-pointer transition-all touch-manipulation hover:bg-gray-200" onClick={() => {
                      setSearchQuery('Luxury')
                      handleSearch('Luxury')
                    }}>Luxury</button>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-200 rounded-full blur-2xl opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-200 rounded-full blur-2xl opacity-60 animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary-200/30 to-primary-400/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-orange-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-orange-100 px-4 py-2 rounded-full mb-6 border border-primary-200">
              <Sparkles className="w-5 h-5 text-primary-600 animate-sparkle" />
              <span className="text-primary-600 font-bold">Top Rated</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover top-rated locations and properties from our community
            </p>
          </div>

          {/* Featured Grid with 3D Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Top Neighborhoods */}
            {topNeighborhoods.slice(0, 2).map((neighborhood, index) => (
              <div 
                key={neighborhood.id}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PropertyCard 
                  property={neighborhood}
                  type="neighborhood"
                />
              </div>
            ))}

            {/* Top Buildings */}
            {topBuildings.slice(0, 1).map((building, index) => (
              <div 
                key={building.id}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${(2 + index) * 100}ms` }}
              >
                <PropertyCard 
                  property={building}
                  type="building"
                />
              </div>
            ))}

            {/* Top Landlords */}
            {topLandlords.slice(0, 1).map((landlord, index) => (
              <div 
                key={landlord.id}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${(3 + index) * 100}ms` }}
              >
                <PropertyCard 
                  property={landlord}
                  type="landlord"
                />
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-16 animate-fade-in-up animation-delay-400">
            <Link 
              href="/explore"
              className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-primary-600 via-primary-700 to-orange-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:from-primary-700 hover:via-primary-800 hover:to-orange-700 transition-all duration-300 shadow-2xl hover:shadow-primary-500/50 transform hover:-translate-y-2 hover:scale-105 card-3d"
            >
              <span>View All Properties</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-orange-400 rounded-2xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity -z-10"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-orange-50 relative overflow-hidden">
        {/* 3D Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-40 left-20 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-primary-100 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span className="text-primary-600 font-semibold">Simple Process</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to find your perfect living situation
            </p>
          </div>

          {/* Steps with 3D Effects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="text-center group card-3d">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt animate-glow">
                  <Search className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-xl animate-bounce-slow">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Search & Discover</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Find neighborhoods, buildings, and landlords in your area. Use our advanced search to filter by your preferences.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group card-3d">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt animate-glow" style={{ animationDelay: '0.5s' }}>
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-xl animate-bounce-slow animation-delay-200">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Read Real Reviews</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Browse authentic reviews from verified tenants. Get detailed insights about location, management, and living conditions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group card-3d">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt animate-glow" style={{ animationDelay: '1s' }}>
                  <BadgeCheck className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-xl animate-bounce-slow animation-delay-400">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Make Smart Decisions</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Use community ratings and reviews to choose the best housing option for your needs and budget.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <button 
              onClick={() => setShowRateModal(true)}
              className="group relative bg-gradient-to-r from-primary-600 to-orange-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-primary-700 hover:to-orange-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 inline-flex items-center space-x-3 animate-glow"
            >
              <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>Get Started Now</span>
              <Sparkle className="w-5 h-5 group-hover:animate-sparkle" />
            </button>
          </div>
        </div>
      </section>

      {/* Categories Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-full mb-6">
              <Layers className="w-5 h-5 text-orange-600" />
              <span className="text-orange-600 font-semibold">Rate Everything</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">What You Can Rate</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Share your experiences across all aspects of rental living
            </p>
          </div>

          {/* Categories Grid with 3D Effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Neighborhoods */}
            <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-blue-200 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl card-tilt">
                  <MapIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Neighborhoods</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Rate walkability, safety, amenities, and community vibe in your area.
              </p>
              <Link 
                href="/rate/neighborhood"
                className="inline-flex items-center space-x-2 text-blue-600 font-bold hover:text-blue-700 transition-all group"
              >
                <span>Rate Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Buildings */}
            <div className="group bg-gradient-to-br from-green-50 via-green-100 to-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-green-200 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl card-tilt">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">Buildings</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Review apartments, condos, and rental properties. Share details about amenities and condition.
              </p>
              <Link 
                href="/rate/building"
                className="inline-flex items-center space-x-2 text-green-600 font-bold hover:text-green-700 transition-all group"
              >
                <span>Rate Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Landlords */}
            <div className="group bg-gradient-to-br from-purple-50 via-purple-100 to-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-purple-200 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl card-tilt">
                  <UserCheck className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">Landlords</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Rate responsiveness, fairness, and professionalism of individual landlords.
              </p>
              <Link 
                href="/rate/landlord"
                className="inline-flex items-center space-x-2 text-purple-600 font-bold hover:text-purple-700 transition-all group"
              >
                <span>Rate Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Rental Companies */}
            <div className="group bg-gradient-to-br from-orange-50 via-orange-100 to-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-orange-200 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl card-tilt">
                  <BuildingIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">Rental Companies</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Review property management companies and their service quality.
              </p>
              <Link 
                href="/rate/rent-company"
                className="inline-flex items-center space-x-2 text-orange-600 font-bold hover:text-orange-700 transition-all group"
              >
                <span>Rate Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <HelpCircle className="w-5 h-5 text-primary-400" />
              <span className="text-primary-400 font-semibold">Quick Answers</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about LivRank
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all card-3d">
              <div className="flex items-start space-x-4">
                <Info className="w-6 h-6 text-primary-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2">Is LivRank free?</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Yes! Completely free with no hidden fees or premium tiers. Search, read, and write reviews forever at no cost.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all card-3d">
              <div className="flex items-start space-x-4">
                <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2">Are reviews verified?</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Absolutely! We verify all user accounts and moderate reviews to ensure authenticity and prevent spam.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all card-3d">
              <div className="flex items-start space-x-4">
                <KeyRound className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2">Can I review anonymously?</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Yes, you can choose to post reviews anonymously or with a display name. Your privacy is important to us.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all card-3d">
              <div className="flex items-start space-x-4">
                <Gauge className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2">How quickly are reviews approved?</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Reviews with 3+ stars are approved instantly. Reviews with lower ratings need admin review (usually within 24 hours).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/faq"
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/50 transition-all duration-300"
            >
              <HelpCircle className="w-5 h-5" />
              <span>View All FAQs</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose LivRank Section */}
      <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-40 left-20 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-primary-100 px-4 py-2 rounded-full mb-6">
              <BadgeCheck className="w-5 h-5 text-primary-600" />
              <span className="text-primary-600 font-semibold">Why Choose Us</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Why Choose LivRank?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted by thousands of renters across Canada
            </p>
          </div>

          {/* Features Grid with 3D Effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Verified Reviews */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-green-300 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt">
                  <Verified className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">Verified Reviews</h3>
              <p className="text-gray-600 leading-relaxed">
                All reviews are from real tenants. We verify user authenticity to ensure trustworthy feedback.
              </p>
            </div>

            {/* Comprehensive Coverage */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-blue-300 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Canada-Wide Coverage</h3>
              <p className="text-gray-600 leading-relaxed">
                From Toronto to Vancouver, find reviews for properties in major cities across Canada.
              </p>
            </div>

            {/* Real-Time Updates */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-orange-300 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt">
                  <Bolt className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">Real-Time Updates</h3>
              <p className="text-gray-600 leading-relaxed">
                Get the latest reviews and ratings as soon as they're posted by the community.
              </p>
            </div>

            {/* Community Driven */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-purple-300 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">Community Driven</h3>
              <p className="text-gray-600 leading-relaxed">
                Built by renters, for renters. Our platform is shaped by real tenant experiences.
              </p>
            </div>

            {/* Detailed Insights */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-indigo-300 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">Detailed Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced rating breakdowns help you understand every aspect of your potential home.
              </p>
            </div>

            {/* Free to Use */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-red-300 card-3d">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 card-tilt">
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">Always Free</h3>
              <p className="text-gray-600 leading-relaxed">
                LivRank is completely free to use. No hidden fees, no premium subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Modal */}
      {showRateModal && (
        <RateModal onClose={() => setShowRateModal(false)} />
      )}
    </main>
  )
}