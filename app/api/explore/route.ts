import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeSupabaseRequest } from '@/lib/supabaseSafe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://eehtzdpzbjsuendgwnwy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') || 'all'
  const searchQuery = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const ratingMin = parseFloat(searchParams.get('ratingMin') || '0')
  const hasReviews = searchParams.get('hasReviews') === 'true'
  const multipleReviews = searchParams.get('multipleReviews') === 'true'
  const sortBy = searchParams.get('sortBy') || 'rating'

  // Fetch all requested categories in parallel
  const result = await safeSupabaseRequest(async () => {
    const promises: Promise<any>[] = []
    const results: any = {
      neighborhoods: [],
      buildings: [],
      landlords: [],
      rentCompanies: [],
    }

    // Helper to build query - only select necessary fields for performance
    const buildQuery = (table: string, searchFields: string[], selectColumns: string) => {
      // Only fetch fields needed for display - columns vary by table
      let query: any = supabase.from(table).select(selectColumns)

      if (searchQuery.trim()) {
        const searchConditions = searchFields.map(field => `${field}.ilike.%${searchQuery}%`).join(',')
        query = query.or(searchConditions)
      }

      // Apply sorting
      if (sortBy === 'rating') {
        query = query.order('overall_rating', { ascending: false }).order('total_reviews', { ascending: false })
      } else if (sortBy === 'reviews') {
        query = query.order('total_reviews', { ascending: false }).order('overall_rating', { ascending: false })
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'lowest') {
        query = query.order('overall_rating', { ascending: true }).order('total_reviews', { ascending: false })
      } else {
        query = query.order('overall_rating', { ascending: false }).order('total_reviews', { ascending: false })
      }

      if (ratingMin > 0) {
        query = query.gte('overall_rating', ratingMin)
      }

      if (hasReviews) {
        query = query.gt('total_reviews', 0)
      }

      if (multipleReviews) {
        query = query.gte('total_reviews', 3)
      }

      if (location) {
        const locationParts = location.split(', ')
        if (locationParts.length === 2) {
          query = query.eq('city', locationParts[0]).eq('province', locationParts[1])
        } else if (location.length === 2 && location.match(/^[A-Z]{2}$/)) {
          query = query.eq('province', location)
        } else {
          query = query.or(`city.ilike.%${location}%,province.ilike.%${location}%`)
        }
      }

      query = query.limit(50) // Reduced limit for faster queries
      return query
    }

    // Define columns for each category (each table has different image column names)
    const neighborhoodColumns = 'id, name, slug, city, province, overall_rating, total_reviews, cover_image, created_at'
    const buildingColumns = 'id, name, slug, address, city, province, overall_rating, total_reviews, cover_image, created_at'
    const landlordColumns = 'id, name, slug, city, province, overall_rating, total_reviews, profile_image, created_at'
    const companyColumns = 'id, name, slug, city, province, overall_rating, total_reviews, profile_image, created_at'

    // Fetch neighborhoods
    if (category === 'all' || category === 'neighborhoods') {
      promises.push(
        buildQuery('neighborhoods', ['name', 'city', 'province'], neighborhoodColumns).then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching neighborhoods:', error)
          }
          if (!error && data) results.neighborhoods = data
          return data
        }).catch((err: any) => {
          console.error('Neighborhoods query failed:', err)
          return []
        })
      )
    }

    // Fetch buildings
    if (category === 'all' || category === 'buildings') {
      promises.push(
        buildQuery('buildings', ['name', 'city', 'province'], buildingColumns).then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching buildings:', error)
          }
          if (!error && data) results.buildings = data
          return data
        }).catch((err: any) => {
          console.error('Buildings query failed:', err)
          return []
        })
      )
    }

    // Fetch landlords
    if (category === 'all' || category === 'landlords') {
      promises.push(
        buildQuery('landlords', ['name', 'city'], landlordColumns).then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching landlords:', error)
          }
          if (!error && data) results.landlords = data
          return data
        }).catch((err: any) => {
          console.error('Landlords query failed:', err)
          return []
        })
      )
    }

    // Fetch companies
    if (category === 'all' || category === 'companies') {
      promises.push(
        buildQuery('rent_companies', ['name', 'city'], companyColumns).then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching companies:', error)
          }
          if (!error && data) results.rentCompanies = data
          return data
        }).catch((err: any) => {
          console.error('Companies query failed:', err)
          return []
        })
      )
    }

    await Promise.all(promises)
    return results
  }, { timeoutMs: 6000, retries: 0 })

  if (result.timedOut) {
    return NextResponse.json(
      { error: 'Request timed out. Please try again.' },
      { status: 504 }
    )
  }

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status ?? 500 }
    )
  }

  const response = NextResponse.json({
    neighborhoods: result.data?.neighborhoods || [],
    buildings: result.data?.buildings || [],
    landlords: result.data?.landlords || [],
    rentCompanies: result.data?.rentCompanies || [],
  })
  
  // Add caching headers for better performance
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  return response
}

// Enable route segment config for caching
export const revalidate = 60 // Revalidate every 60 seconds
