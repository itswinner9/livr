import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://eehtzdpzbjsuendgwnwy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  const results: any = {
    config: {
      supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
      supabaseKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
      url: supabaseUrl,
    },
    tests: {},
  }

  // Test 1: Check neighborhoods table
  try {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('id, name, city, province')
      .limit(5)

    results.tests.neighborhoods = {
      success: !error,
      error: error?.message || null,
      count: data?.length || 0,
      sample: data?.slice(0, 2) || [],
    }
  } catch (err: any) {
    results.tests.neighborhoods = {
      success: false,
      error: err.message || String(err),
      count: 0,
    }
  }

  // Test 2: Check buildings table
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, city, province')
      .limit(5)

    results.tests.buildings = {
      success: !error,
      error: error?.message || null,
      count: data?.length || 0,
      sample: data?.slice(0, 2) || [],
    }
  } catch (err: any) {
    results.tests.buildings = {
      success: false,
      error: err.message || String(err),
      count: 0,
    }
  }

  // Test 3: Check landlords table
  try {
    const { data, error } = await supabase
      .from('landlords')
      .select('id, name, city, province')
      .limit(5)

    results.tests.landlords = {
      success: !error,
      error: error?.message || null,
      count: data?.length || 0,
      sample: data?.slice(0, 2) || [],
    }
  } catch (err: any) {
    results.tests.landlords = {
      success: false,
      error: err.message || String(err),
      count: 0,
    }
  }

  // Test 4: Check rent_companies table
  try {
    const { data, error } = await supabase
      .from('rent_companies')
      .select('id, name, city, province')
      .limit(5)

    results.tests.rentCompanies = {
      success: !error,
      error: error?.message || null,
      count: data?.length || 0,
      sample: data?.slice(0, 2) || [],
    }
  } catch (err: any) {
    results.tests.rentCompanies = {
      success: false,
      error: err.message || String(err),
      count: 0,
    }
  }

  return NextResponse.json(results)
}

