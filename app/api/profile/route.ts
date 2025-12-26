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

  // Fetch profile with timeout
  const result = await safeSupabaseRequest(async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  }, { timeoutMs: 8000, retries: 1 })

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

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: result.data,
  })
}

