import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { safeSupabaseRequest } from '@/lib/supabaseSafe'

export async function GET() {
  const featuredResult = await safeSupabaseRequest(async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .maybeSingle()

    if (error) throw error
    return data
  }, { timeoutMs: 10_000, retries: 1 })

  const blogsResult = await safeSupabaseRequest(async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .or('featured.is.null,featured.eq.false')
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  }, { timeoutMs: 10_000, retries: 1 })

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

  return NextResponse.json({
    featured: featuredResult.data ?? null,
    blogs: (blogsResult.data as any[]) ?? [],
  })
}


