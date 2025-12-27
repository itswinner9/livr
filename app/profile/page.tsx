'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Calendar, Star, MapPin, Building2, Edit, Trash2, 
  Eye, Shield, Award, TrendingUp, Lock, LogOut, AlertCircle, Ban, Clock, AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ProfileSkeleton } from '@/components/LoadingStates'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Fetch profile and reviews in parallel using API routes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        // Get access token from session
        if (!session.access_token) {
          throw new Error('No access token available. Please log in again.')
        }

        const [profileResponse, reviewsResponse] = await Promise.all([
          fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            signal: controller.signal,
          }),
          fetch('/api/profile/reviews', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            signal: controller.signal,
          }),
        ])

        clearTimeout(timeoutId)

        if (!profileResponse.ok) {
          throw new Error('Failed to load profile')
        }

        if (!reviewsResponse.ok) {
          throw new Error('Failed to load reviews')
        }

        const profileData = await profileResponse.json()
        const reviewsData = await reviewsResponse.json()

        setProfile(profileData.profile)
        setFullName(profileData.profile?.full_name || '')
        setReviews(reviewsData.reviews || [])
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error('Request timed out')
          alert('Request timed out. Please try again.')
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      alert('Error loading profile. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      // Use timeout for update operation
      const updatePromise = supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timed out')), 10000)
      )

      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any

      if (!error) {
        alert('✅ Profile updated!')
        setEditing(false)
        checkUser()
      } else {
        alert('❌ Error: ' + error.message)
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.message || 'Request timed out'))
    }
  }

  const handleDeleteReview = async (reviewId: string, type: string) => {
    if (deleteConfirm !== reviewId) {
      setDeleteConfirm(reviewId)
      setTimeout(() => setDeleteConfirm(null), 5000) // Reset after 5 seconds
      return
    }

    setActionLoading(reviewId)
    
    const table = type === 'neighborhood' 
      ? 'neighborhood_reviews' 
      : type === 'building'
      ? 'building_reviews'
      : type === 'landlord'
      ? 'landlord_reviews'
      : 'rent_company_reviews'
    
    console.log('🗑️ Deleting review:', reviewId, 'from', table)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Session expired. Please log in again.')
        router.push('/login')
        return
      }

      // Use timeout for delete operation
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const deletePromise = supabase
        .from(table)
        .delete()
        .eq('id', reviewId)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete timed out')), 10000)
      )

      const { error } = await Promise.race([deletePromise, timeoutPromise]) as any

      clearTimeout(timeoutId)

      if (!error) {
        console.log('✅ Review deleted successfully!')
        alert('✅ Review deleted!')
        setDeleteConfirm(null)
        setActionLoading(null)
        checkUser() // Reload profile data
      } else {
        console.error('❌ Delete error:', error)
        alert('❌ Error deleting review: ' + error.message)
        setActionLoading(null)
        setDeleteConfirm(null)
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error)
      alert('❌ Error deleting review: ' + (error.message || 'Request timed out'))
      setActionLoading(null)
      setDeleteConfirm(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (!error) {
      alert('✅ Password reset email sent! Check your inbox.')
    } else {
      alert('❌ Error: ' + error.message)
    }
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  const stats = {
    totalReviews: reviews.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.avg, 0) / reviews.length).toFixed(1) : '0',
    neighborhoods: reviews.filter(r => r.type === 'neighborhood').length,
    buildings: reviews.filter(r => r.type === 'building').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    pending: reviews.filter(r => r.status === 'pending').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account and review activity</p>
        </div>

        {/* Status Banner */}
        {(profile?.status === 'banned' || profile?.status === 'cooled' || profile?.warning_count > 0) && (
          <div className={`mb-6 p-6 rounded-2xl border-2 ${
            profile.status === 'banned' 
              ? 'bg-red-50 border-red-200' 
              : profile.status === 'cooled'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-4">
              {profile.status === 'banned' && <Ban className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />}
              {profile.status === 'cooled' && <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />}
              {profile.status === 'active' && profile.warning_count > 0 && <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />}
              <div className="flex-1">
                {profile.status === 'banned' && (
                  <>
                    <h3 className="font-bold text-red-900 text-lg mb-2">🚫 Account Banned</h3>
                    <p className="text-red-800 mb-2">{profile.moderation_reason || 'No reason provided'}</p>
                    {profile.banned_until && <p className="text-sm text-red-700">Ban expires: {new Date(profile.banned_until).toLocaleDateString()}</p>}
                  </>
                )}
                {profile.status === 'cooled' && (
                  <>
                    <h3 className="font-bold text-blue-900 text-lg mb-2">❄️ Cooling Off Period</h3>
                    <p className="text-blue-800 mb-2">{profile.moderation_reason || 'No reason provided'}</p>
                    {profile.cooled_until && <p className="text-sm text-blue-700">Period ends: {new Date(profile.cooled_until).toLocaleDateString()}</p>}
                  </>
                )}
                {profile.status === 'active' && profile.warning_count > 0 && (
                  <>
                    <h3 className="font-bold text-yellow-900 text-lg mb-2">⚠️ You have {profile.warning_count} warning{profile.warning_count > 1 ? 's' : ''}</h3>
                    <p className="text-yellow-800">Please review our community guidelines to avoid further action.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {profile?.is_admin && (
                  <span className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-bold text-gray-900">{stats.totalReviews}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Rating</span>
                  <span className="font-bold text-gray-900 flex items-center">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {stats.avgRating}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Published</span>
                  <span className="font-bold text-green-600">{stats.approved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-bold text-yellow-600">{stats.pending}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/explore"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Write Review</div>
                    <div className="text-xs text-gray-500">Rate a location</div>
                  </div>
                </Link>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">Edit Profile</div>
                    <div className="text-xs text-gray-500">Update your name</div>
                  </div>
                </button>

                <button
                  onClick={handleResetPassword}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">Change Password</div>
                    <div className="text-xs text-gray-500">Update password</div>
                  </div>
                </button>

                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Admin Panel</div>
                      <div className="text-xs text-gray-500">Manage platform</div>
                    </div>
                  </Link>
                )}

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors group text-red-600"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Sign Out</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Edit Modal */}
            {editing && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-all font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFullName(profile?.full_name || '')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Your Reviews</h2>
                  <p className="text-sm text-gray-600 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''} posted</p>
                </div>
            <Link
              href="/"
              className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all font-semibold flex items-center justify-center space-x-2 shadow-md"
            >
              <Star className="w-4 h-4" />
              <span>Write New Review</span>
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">Start sharing your experiences!</p>
              <Link
                href="/"
                className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition-all font-semibold"
              >
                Write Your First Review
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 lg:p-6 border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {review.type === 'neighborhood' ? (
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        <h3 className="text-lg lg:text-xl font-bold text-gray-900">{review.location.name}</h3>
                        <span className="text-sm text-gray-500">• {review.location.city}</span>
                        
                        {/* Status Badge */}
                        {review.status === 'approved' && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                            ✓ Live
                          </span>
                        )}
                        {review.status === 'pending' && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">
                            ⏳ Pending
                          </span>
                        )}
                        {review.status === 'rejected' && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                            ✗ Hidden
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="flex items-center justify-center lg:justify-end">
                      <div className="px-4 py-2 rounded-xl shadow-md bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center space-x-2">
                        <Star className="w-5 h-5 fill-white" />
                        <span className="font-bold text-lg">{review.avg.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {review.comment && (
                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
                      <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
                    <Link
                      href={review.type === 'neighborhood' 
                        ? `/neighborhood/${review.location.slug || review.location.id}` 
                        : `/building/${review.location.slug || review.location.id}`
                      }
                      className="bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-all font-semibold flex items-center justify-center space-x-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    
                    <Link
                      href={review.type === 'neighborhood' 
                        ? `/neighborhood/${review.location.slug || review.location.id}` 
                        : `/building/${review.location.slug || review.location.id}`
                      }
                      target="_blank"
                      className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all font-semibold flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteReview(review.id, review.type)}
                      disabled={actionLoading === review.id}
                      className={`px-4 py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center space-x-2 text-sm ${
                        deleteConfirm === review.id
                          ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionLoading === review.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : deleteConfirm === review.id ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Confirm?</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
