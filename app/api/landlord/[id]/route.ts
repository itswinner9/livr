import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeSupabaseRequest } from '@/lib/supabaseSafe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://eehtzdpzbjsuendgwnwy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const idOrSlug = params.id

  if (!idOrSlug) {
    return NextResponse.json(
      { error: 'Landlord ID or slug is required' },
      { status: 400 }
    )
  }

  console.log('🔍 Fetching landlord:', idOrSlug)

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  // Fetch landlord data (try slug first if not UUID, otherwise try ID)
  const landlordResult = await safeSupabaseRequest(async () => {
    let query = supabase
      .from('landlords')
      .select('id, name, slug, company_name, email, phone, website, city, province, country, description, overall_rating, responsiveness_rating, maintenance_rating, communication_rating, fairness_rating, professionalism_rating, total_reviews, profile_image, created_at')
    
    if (isUUID) {
      query = query.eq('id', idOrSlug)
    } else {
      query = query.eq('slug', idOrSlug)
    }
    
    const { data, error } = await query.single()
    
    if (error && !isUUID) {
      // If slug lookup failed and it's not a UUID, try by ID as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('landlords')
        .select('id, name, slug, company_name, email, phone, website, city, province, country, description, overall_rating, responsiveness_rating, maintenance_rating, communication_rating, fairness_rating, professionalism_rating, total_reviews, profile_image, created_at')
        .eq('id', idOrSlug)
        .single()
      
      if (fallbackError) throw fallbackError
      return fallbackData
    }
    
    if (error) throw error
    return data
  }, { timeoutMs: 6000, retries: 0 })

  if (landlordResult.timedOut) {
    console.error('❌ Landlord fetch timed out')
    return NextResponse.json(
      { error: 'Request timed out. Please try again.' },
      { status: 504 }
    )
  }

  if (landlordResult.error || !landlordResult.data) {
    console.error('❌ Error fetching landlord:', landlordResult.error)
    return NextResponse.json(
      { error: landlordResult.error?.message || 'Landlord not found' },
      { status: landlordResult.error?.status ?? 404 }
    )
  }

  const landlord = landlordResult.data

  // Fetch reviews in parallel with verified users check
  const [reviewsResult, pendingCountResult] = await Promise.all([
    // Fetch approved reviews
    safeSupabaseRequest(async () => {
      const { data, error } = await supabase
        .from('landlord_reviews')
        .select('id, user_id, review, comment, pros, cons, overall_rating, responsiveness, responsiveness_rating, maintenance, maintenance_rating, communication, communication_rating, fairness, fairness_rating, professionalism, professionalism_rating, years_rented, monthly_rent, would_recommend, is_anonymous, display_name, created_at, status, images, verification_request_id')
        .eq('landlord_id', landlord.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data || []
    }, { timeoutMs: 6000, retries: 0 }),
    
    // Fetch pending reviews count
    safeSupabaseRequest(async () => {
      const { data, error } = await supabase
        .from('landlord_reviews')
        .select('id')
        .eq('landlord_id', landlord.id)
        .eq('status', 'pending')
      
      if (error) throw error
      return data?.length || 0
    }, { timeoutMs: 5000, retries: 0 })
  ])

  let reviews = reviewsResult.data || []
  const pendingCount = pendingCountResult.data || 0

  // Fetch verified users if we have reviews
  let verifiedUserIds = new Set<string>()
  if (reviews.length > 0) {
    const userIds = reviews.map((r: any) => r.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const verifiedResult = await safeSupabaseRequest(async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, is_verified_tenant')
          .in('id', userIds)
          .eq('is_verified_tenant', true)
        
        if (error) throw error
        return data?.map((p: any) => p.id) || []
      }, { timeoutMs: 5000, retries: 0 })
      
      if (verifiedResult.data) {
        verifiedUserIds = new Set(verifiedResult.data)
      }
    }
  }

  // Sort reviews: verified first, then by date
  reviews = reviews.sort((a: any, b: any) => {
    const aVerified = verifiedUserIds.has(a.user_id)
    const bVerified = verifiedUserIds.has(b.user_id)
    if (aVerified && !bVerified) return -1
    if (!aVerified && bVerified) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const response = NextResponse.json({
    landlord,
    reviews,
    pendingCount,
    verifiedUserIds: Array.from(verifiedUserIds)
  })
  
  // Cache for 60 seconds
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  return response
}

export const revalidate = 60

