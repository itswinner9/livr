import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeSupabaseRequest } from '@/lib/supabaseSafe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://eehtzdpzbjsuendgwnwy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  // Get auth header
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  // Verify session
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Fetch all reviews with joins in parallel - optimized with only needed fields
  const result = await safeSupabaseRequest(async () => {
    const allReviews: any[] = []

    // Fetch all reviews in parallel for better performance
    const [nReviewsResult, bReviewsResult, lReviewsResult, cReviewsResult] = await Promise.all([
      supabase
        .from('neighborhood_reviews')
        .select(`
          id, user_id, overall_rating, comment, created_at, images,
          neighborhood:neighborhoods(id, name, slug, city, province)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('building_reviews')
        .select(`
          id, user_id, overall_rating, comment, created_at, images,
          building:buildings(id, name, slug, city, province)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('landlord_reviews')
        .select(`
          id, user_id, overall_rating, comment, created_at, images,
          landlord:landlords(id, name, slug, city)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('rent_company_reviews')
        .select(`
          id, user_id, overall_rating, comment, created_at, images,
          company:rent_companies(id, name, slug, city)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    if (nReviewsResult.error) throw nReviewsResult.error
    if (bReviewsResult.error) throw bReviewsResult.error
    if (lReviewsResult.error) throw lReviewsResult.error
    if (cReviewsResult.error) throw cReviewsResult.error

    // Process neighborhood reviews
    if (nReviewsResult.data) {
      for (const review of nReviewsResult.data) {
        allReviews.push({
          ...review,
          type: 'neighborhood',
          location: review.neighborhood || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Process building reviews
    if (bReviewsResult.data) {
      for (const review of bReviewsResult.data) {
        allReviews.push({
          ...review,
          type: 'building',
          location: review.building || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Process landlord reviews
    if (lReviewsResult.data) {
      for (const review of lReviewsResult.data) {
        allReviews.push({
          ...review,
          type: 'landlord',
          location: review.landlord || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Process company reviews
    if (cReviewsResult.data) {
      for (const review of cReviewsResult.data) {
        allReviews.push({
          ...review,
          type: 'company',
          location: review.company || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Sort all reviews by created_at descending
    allReviews.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    return allReviews
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

  const response = NextResponse.json({ reviews: result.data || [] })
  response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return response
}

