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

  // Fetch all reviews with joins (much faster than sequential queries)
  const result = await safeSupabaseRequest(async () => {
    const allReviews: any[] = []

    // Fetch neighborhood reviews with join
    const { data: nReviews, error: nError } = await supabase
      .from('neighborhood_reviews')
      .select(`
        *,
        neighborhood:neighborhoods(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (nError) throw nError

    if (nReviews) {
      for (const review of nReviews) {
        allReviews.push({
          ...review,
          type: 'neighborhood',
          location: review.neighborhood || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Fetch building reviews with join
    const { data: bReviews, error: bError } = await supabase
      .from('building_reviews')
      .select(`
        *,
        building:buildings(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (bError) throw bError

    if (bReviews) {
      for (const review of bReviews) {
        allReviews.push({
          ...review,
          type: 'building',
          location: review.building || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Fetch landlord reviews with join
    const { data: lReviews, error: lError } = await supabase
      .from('landlord_reviews')
      .select(`
        *,
        landlord:landlords(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (lError) throw lError

    if (lReviews) {
      for (const review of lReviews) {
        allReviews.push({
          ...review,
          type: 'landlord',
          location: review.landlord || null,
          avg: review.overall_rating || 0
        })
      }
    }

    // Fetch company reviews with join
    const { data: cReviews, error: cError } = await supabase
      .from('rent_company_reviews')
      .select(`
        *,
        company:rent_companies(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (cError) throw cError

    if (cReviews) {
      for (const review of cReviews) {
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
  }, { timeoutMs: 15000, retries: 1 })

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

  return NextResponse.json({ reviews: result.data || [] })
}

