'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { safeSelect, SupabaseSafeError } from '@/lib/supabaseSafe'

interface RentCompany {
  id: string
  name: string
  city: string | null
  province: string | null
}

export default function SafeSupabaseExample() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RentCompany[] | null>(null)
  const [error, setError] = useState<SupabaseSafeError | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)
    setTimedOut(false)

    const result = await safeSelect<RentCompany[]>(
      supabase,
      'rent_companies',
      'id, name, city, province',
      (query) => query.order('created_at', { ascending: false }).limit(5),
      { timeoutMs: 10_000, retries: 1 }
    )

    if (result.error) {
      setError(result.error)
    } else {
      setData(result.data)
    }

    setTimedOut(result.timedOut)
    setLoading(false)
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading companies…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm space-y-2">
        <p className="font-semibold text-red-700">
          {timedOut ? 'Timed out contacting Supabase.' : 'Error loading companies.'}
        </p>
        <p className="text-sm text-red-600">{error.message}</p>
        <button
          onClick={fetchCompanies}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Latest rent companies</h3>
        <button
          onClick={fetchCompanies}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Refresh
        </button>
      </div>

      {(!data || data.length === 0) ? (
        <p className="text-sm text-gray-600">No companies found.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((company) => (
            <li key={company.id} className="rounded-md border border-gray-100 p-3">
              <p className="font-medium text-gray-900">{company.name}</p>
              <p className="text-sm text-gray-600">
                {[company.city, company.province].filter(Boolean).join(', ') || 'Location unknown'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}



