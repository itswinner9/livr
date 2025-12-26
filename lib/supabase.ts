import { createClient } from '@supabase/supabase-js'

// Get environment variables
const DEFAULT_SUPABASE_URL = 'https://eehtzdpzbjsuendgwnwy.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY) environment variables.')
}

// Check if variables are set
const isConfigured = supabaseUrl && supabaseAnonKey

// Log configuration status (client-side only)
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  })
  
  if (!isConfigured) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ SUPABASE NOT CONFIGURED!')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('1. Check if .env.local exists in project root')
    console.error('2. Restart dev server: npm run dev')
    console.error('3. Hard refresh browser: Ctrl+Shift+R')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }
}

// Create Supabase client (will fail gracefully if not configured)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Export configuration status for UI checks
export const supabaseConfigured = isConfigured

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Neighborhood {
  id: string
  name: string
  city: string
  province: string
  slug?: string
  cover_image?: string
  user_id?: string
  overall_rating?: number
  safety_rating?: number
  noise_rating?: number
  transit_rating?: number
  amenities_rating?: number
  community_rating?: number
  average_rating?: number
  images?: string[]
  total_ratings?: number
  total_reviews?: number
  latitude?: number
  longitude?: number
  created_at: string
  updated_at?: string
  user?: User
}

export interface Building {
  id: string
  name: string
  address: string
  city: string
  province: string
  slug?: string
  cover_image?: string
  user_id?: string
  management?: number
  cleanliness?: number
  maintenance?: number
  rent_value?: number
  noise?: number
  amenities?: number
  average_rating: number
  images?: string[]
  total_ratings?: number
  total_reviews?: number
  latitude?: number
  longitude?: number
  created_at: string
  updated_at?: string
  user?: User
}

export interface NeighborhoodReview {
  id: string
  neighborhood_id: string
  user_id: string
  safety?: number
  noise?: number
  transit?: number
  amenities?: number
  community?: number
  overall_rating?: number
  comment?: string
  images?: string[]
  is_anonymous?: boolean
  display_name?: string
  status?: string
  helpful_count?: number
  not_helpful_count?: number
  created_at: string
  updated_at?: string
  user?: User
}

export interface BuildingReview {
  id: string
  building_id: string
  user_id: string
  management: number
  cleanliness: number
  maintenance: number
  rent_value: number
  noise: number
  amenities: number
  comment?: string
  images: string[]
  is_anonymous?: boolean
  display_name?: string
  status?: string
  helpful_count?: number
  not_helpful_count?: number
  created_at: string
  updated_at: string
  user?: User
}

