import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { safeSelect } from '@/lib/supabaseSafe'

export async function GET() {
  const result = await safeSelect(
    supabase,
    'rent_companies',
    'id, name, city, province, created_at',
    (query: any) => query.order('created_at', { ascending: false }).limit(20),
    { timeoutMs: 10_000, retries: 1 }
  )

  if (result.timedOut) {
    return NextResponse.json(
      { error: 'Timed out contacting Supabase. Please try again.' },
      { status: 504 }
    )
  }

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message, details: result.error.details },
      { status: result.error.status ?? 500 }
    )
  }

  return NextResponse.json({ data: result.data, attempts: result.attemptCount })
}



