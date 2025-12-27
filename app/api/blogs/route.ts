import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { safeSupabaseRequest } from '@/lib/supabaseSafe'

export async function GET() {
  // Fetch both in parallel for better performance
  const [featuredResult, blogsResult] = await Promise.all([
    safeSupabaseRequest(async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, cover_image, published_at, author_id')
        .eq('status', 'published')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .maybeSingle()

      if (error) throw error
      return data
    }, { timeoutMs: 5000, retries: 0 }),
    safeSupabaseRequest(async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, cover_image, published_at, author_id')
        .eq('status', 'published')
        .or('featured.is.null,featured.eq.false')
        .order('published_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    }, { timeoutMs: 5000, retries: 0 })
  ])

  if (featuredResult.timedOut || blogsResult.timedOut) {
    return NextResponse.json(
      { error: 'Timed out contacting Supabase. Please try again.' },
      { status: 504 }
    )
  }

  if (featuredResult.error && blogsResult.error) {
    return NextResponse.json(
      { error: featuredResult.error.message || blogsResult.error.message },
      { status: featuredResult.error.status ?? blogsResult.error.status ?? 500 }
    )
  }

  const response = NextResponse.json({
    featured: featuredResult.data ?? null,
    blogs: (blogsResult.data as any[]) ?? [],
  })
  
  // Cache blogs for longer since they don't change frequently
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  return response
}

export const revalidate = 300 // Revalidate every 5 minutes


