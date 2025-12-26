'use client'

import { useState, useEffect } from 'react'
import { Shield, Star, Users, MapPin, Building2, Clock, TrendingUp, Activity, AlertTriangle, UserCheck, Building, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    totalNeighborhoods: 0,
    totalBuildings: 0,
    totalLandlords: 0,
    totalRentCompanies: 0,
    lowRatings: 0,
  })

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    // Simple admin check
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, email')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      alert('Access denied. Admin only.')
      router.push('/')
      return
    }

    setUserEmail(profile.email || session.user.email || '')
    fetchStats()
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching admin stats...')
      
      // Fetch all data in parallel for faster loading
      const [
        usersResult,
        nReviewsResult,
        bReviewsResult,
        neighborhoodsResult,
        buildingsResult,
        landlordsResult,
        rentCompaniesResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('id'),
        supabase.from('neighborhood_reviews').select('id, status, safety, cleanliness, noise, community, transit, amenities'),
        supabase.from('building_reviews').select('id, status, management, cleanliness, maintenance, rent_value, noise, amenities'),
        supabase.from('neighborhoods').select('id'),
        supabase.from('buildings').select('id'),
        supabase.from('landlords').select('id'),
        supabase.from('rent_companies').select('id')
      ])

      const users = usersResult.data
      const nReviews = nReviewsResult.data
      const bReviews = bReviewsResult.data
      const neighborhoods = neighborhoodsResult.data
      const buildings = buildingsResult.data
      const landlords = landlordsResult.data
      const rentCompanies = rentCompaniesResult.data

      const allReviews = [...(nReviews || []), ...(bReviews || [])]
      const pending = allReviews.filter(r => r.status === 'pending').length
      const approved = allReviews.filter(r => r.status === 'approved').length
      const rejected = allReviews.filter(r => r.status === 'rejected').length

      // Count low ratings (< 2 stars)
      const lowRatingsCount = [
        ...(nReviews || []).filter(r => {
          const avg = (r.safety + r.cleanliness + r.noise + r.community + r.transit + r.amenities) / 6
          return avg < 2
        }),
        ...(bReviews || []).filter(r => {
          const avg = (r.management + r.cleanliness + r.maintenance + r.rent_value + r.noise + r.amenities) / 6
          return avg < 2
        }),
      ].length

      setStats({
        totalUsers: users?.length || 0,
        totalReviews: allReviews.length,
        pendingReviews: pending,
        approvedReviews: approved,
        rejectedReviews: rejected,
        totalNeighborhoods: neighborhoods?.length || 0,
        totalBuildings: buildings?.length || 0,
        totalLandlords: landlords?.length || 0,
        totalRentCompanies: rentCompanies?.length || 0,
        lowRatings: lowRatingsCount,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-2xl w-80 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded-xl w-96"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-20 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* Location Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-8 bg-gray-300 rounded-xl w-16 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
              </div>
              <div className="h-9 bg-gray-300 rounded-lg w-full"></div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200 animate-pulse">
          <div className="h-7 bg-gray-200 rounded-xl w-40 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-xl p-6">
                <div className="w-10 h-10 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor and manage your LivRank platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 text-blue-600" />
            <span className="text-xs text-gray-500">Registered</span>
          </div>
          <div className="text-4xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
            <span className="text-xs text-gray-500">Awaiting</span>
          </div>
          <div className="text-4xl font-bold text-yellow-600 mb-1">{stats.pendingReviews}</div>
          <div className="text-sm text-gray-600">Pending Reviews</div>
          {stats.pendingReviews > 0 && (
            <Link
              href="/admin/pending"
              className="mt-3 block text-center bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-100 transition-all text-xs font-semibold"
            >
              Review Now →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-10 h-10 text-green-600" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
          <div className="text-4xl font-bold text-green-600 mb-1">{stats.approvedReviews}</div>
          <div className="text-sm text-gray-600">Approved Reviews</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
            <span className="text-xs text-gray-500">Flagged</span>
          </div>
          <div className="text-4xl font-bold text-red-600 mb-1">{stats.lowRatings}</div>
          <div className="text-sm text-gray-600">Low Ratings (&lt;2★)</div>
          {stats.lowRatings > 0 && (
            <Link
              href="/admin/pending"
              className="mt-3 block text-center bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-all text-xs font-semibold"
            >
              Review Now →
            </Link>
          )}
        </div>
      </div>

      {/* Locations Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold mb-1">{stats.totalNeighborhoods}</div>
              <div className="text-blue-100 text-sm">Neighborhoods</div>
            </div>
            <MapPin className="w-12 h-12 text-white/30" />
          </div>
          <Link
            href="/admin/neighborhoods"
            className="block text-center bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all text-sm"
          >
            Manage →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold mb-1">{stats.totalBuildings}</div>
              <div className="text-green-100 text-sm">Buildings</div>
            </div>
            <Building2 className="w-12 h-12 text-white/30" />
          </div>
          <Link
            href="/admin/buildings"
            className="block text-center bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all text-sm"
          >
            Manage →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold mb-1">{stats.totalLandlords}</div>
              <div className="text-purple-100 text-sm">Landlords</div>
            </div>
            <UserCheck className="w-12 h-12 text-white/30" />
          </div>
          <Link
            href="/admin/landlords"
            className="block text-center bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all text-sm"
          >
            Manage →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold mb-1">{stats.totalRentCompanies}</div>
              <div className="text-orange-100 text-sm">Companies</div>
            </div>
            <Building className="w-12 h-12 text-white/30" />
          </div>
          <Link
            href="/admin/companies"
            className="block text-center bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all text-sm"
          >
            Manage →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/pending"
            className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 hover:border-yellow-400 transition-all group"
          >
            <Clock className="w-10 h-10 text-yellow-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Review Pending</h3>
            <p className="text-sm text-gray-600 mb-3">Approve or reject submissions</p>
            <span className="text-yellow-600 font-semibold text-sm group-hover:underline">
              {stats.pendingReviews} waiting →
            </span>
          </Link>

          <Link
            href="/admin/users"
            className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 hover:border-primary-400 transition-all group"
          >
            <Users className="w-10 h-10 text-primary-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600 mb-3">Grant or revoke admin access</p>
            <span className="text-primary-600 font-semibold text-sm group-hover:underline">
              {stats.totalUsers} users →
            </span>
          </Link>

          <Link
            href="/admin/landlords"
            className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all group"
          >
            <UserCheck className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Manage Landlords</h3>
            <p className="text-sm text-gray-600 mb-3">Verify and manage landlords</p>
            <span className="text-purple-600 font-semibold text-sm group-hover:underline">
              {stats.totalLandlords} landlords →
            </span>
          </Link>

          <Link
            href="/admin/companies"
            className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 transition-all group"
          >
            <Building className="w-10 h-10 text-orange-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Manage Companies</h3>
            <p className="text-sm text-gray-600 mb-3">Verify and manage companies</p>
            <span className="text-orange-600 font-semibold text-sm group-hover:underline">
              {stats.totalRentCompanies} companies →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
