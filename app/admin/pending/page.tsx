'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, CheckCircle, XCircle, Star, MapPin, Building2, Users, 
  Calendar, MessageCircle, Camera, Eye, AlertTriangle, Mail, 
  Shield, Sparkles, Volume2, Train, Package, Wrench, DollarSign
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PendingReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'low' | 'high'>('all')

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    console.log('🔍 Fetching pending reviews...')
    
    try {
      // Fetch neighborhood reviews with separate queries (simpler)
      const { data: nReviews, error: nError } = await supabase
        .from('neighborhood_reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('Raw neighborhood reviews:', nReviews?.length || 0, nError)

      // Fetch building reviews
      const { data: bReviews, error: bError } = await supabase
        .from('building_reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('Raw building reviews:', bReviews?.length || 0, bError)

      // Fetch landlord reviews
      const { data: lReviews, error: lError } = await supabase
        .from('landlord_reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('Raw landlord reviews:', lReviews?.length || 0, lError)

      const allReviews: any[] = []

      // Process neighborhood reviews
      if (nReviews && nReviews.length > 0) {
        for (const review of nReviews) {
          // Get neighborhood data
          const { data: neighborhood } = await supabase
            .from('neighborhoods')
            .select('*')
            .eq('id', review.neighborhood_id)
            .single()

          // Get user data
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('email, full_name')
            .eq('id', review.user_id)
            .single()

          if (neighborhood) {
            allReviews.push({
              ...review,
              type: 'neighborhood',
              location: neighborhood,
              user: userProfile || { email: 'Unknown', full_name: 'Unknown' },
              avg: (review.safety + review.cleanliness + review.noise + review.community + review.transit + review.amenities) / 6
            })
          }
        }
      }

      // Process building reviews
      if (bReviews && bReviews.length > 0) {
        for (const review of bReviews) {
          // Get building data
          const { data: building } = await supabase
            .from('buildings')
            .select('*')
            .eq('id', review.building_id)
            .single()

          // Get user data
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('email, full_name')
            .eq('id', review.user_id)
            .single()

          if (building) {
            allReviews.push({
              ...review,
              type: 'building',
              location: building,
              user: userProfile || { email: 'Unknown', full_name: 'Unknown' },
              avg: (review.management + review.cleanliness + review.maintenance + review.rent_value + review.noise + review.amenities) / 6
            })
          }
        }
      }

      // Process landlord reviews
      if (lReviews && lReviews.length > 0) {
        for (const review of lReviews) {
          // Get landlord data
          const { data: landlord } = await supabase
            .from('landlords')
            .select('*')
            .eq('id', review.landlord_id)
            .single()

          // Get user data
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('email, full_name')
            .eq('id', review.user_id)
            .single()

          if (landlord) {
            const avgRating = (
              (review.responsiveness || 0) + 
              (review.maintenance || 0) + 
              (review.communication || 0) + 
              (review.fairness || 0) + 
              (review.professionalism || 0)
            ) / 5

            allReviews.push({
              ...review,
              type: 'landlord',
              location: landlord,
              user: userProfile || { email: 'Unknown', full_name: 'Unknown' },
              avg: avgRating
            })
          }
        }
      }

      console.log('✅ Total pending reviews processed:', allReviews.length)
      console.log('Reviews:', allReviews)
      
      setReviews(allReviews)
    } catch (err) {
      console.error('❌ Error in fetchPendingReviews:', err)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId: string, type: string) => {
    setActionLoading(reviewId)
    
    const table = 
      type === 'neighborhood' ? 'neighborhood_reviews' : 
      type === 'building' ? 'building_reviews' : 
      'landlord_reviews'
    
    const { error } = await supabase
      .from(table)
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (!error) {
      alert('✅ Review Approved!\n\nThis review is now:\n• Visible to all users\n• Counted in location stats\n• Displayed on cards and detail pages\n\nThe user can see it on their profile.')
      fetchPendingReviews()
    } else {
      console.error('Approve error:', error)
      alert('❌ Error: ' + error.message)
    }
    
    setActionLoading(null)
  }

  const handleReject = async (reviewId: string, type: string) => {
    setActionLoading(reviewId)
    
    const reason = prompt('Why are you rejecting this review? (Optional - will be shown to user)')

    const table = 
      type === 'neighborhood' ? 'neighborhood_reviews' : 
      type === 'building' ? 'building_reviews' : 
      'landlord_reviews'
    
    const { error } = await supabase
      .from(table)
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (!error) {
      alert('✅ Review Rejected\n\nThe review has been rejected and hidden from public view.')
      fetchPendingReviews()
    } else {
      console.error('Reject error:', error)
      alert('❌ Error: ' + error.message)
    }
    
    setActionLoading(null)
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === 'low') return r.avg < 2
    if (filter === 'high') return r.avg >= 2
    return true
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded-xl w-64 mb-3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-80 animate-pulse"></div>
        </div>

        {/* Filter skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-2 inline-flex space-x-2 animate-pulse">
          <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
        </div>

        {/* Review cards skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                  <div>
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
              </div>
              <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
                <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Reviews</h1>
        <p className="text-gray-600">Review and approve user submissions</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-2 inline-flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
            filter === 'low' ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Low Ratings (&lt;2★) ({reviews.filter(r => r.avg < 2).length})</span>
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filter === 'high' ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50'
          }`}
        >
          Good Ratings (≥2★) ({reviews.filter(r => r.avg >= 2).length})
        </button>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending reviews to approve</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                review.avg < 2 
                  ? 'border-red-300 bg-red-50/30' 
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {review.type === 'neighborhood' ? (
                      <MapPin className="w-5 h-5 text-blue-600" />
                    ) : review.type === 'landlord' ? (
                      <Users className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Building2 className="w-5 h-5 text-green-600" />
                    )}
                    <h3 className="text-xl font-bold text-gray-900">{review.location.name}</h3>
                    <span className="text-sm text-gray-500">
                      {review.location.city}{review.location.province ? `, ${review.location.province}` : ''}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                      {review.type === 'landlord' ? 'Landlord' : review.type === 'neighborhood' ? 'Neighborhood' : 'Building'}
                    </span>
                    {review.avg < 2 && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>LOW RATING - NEEDS REVIEW</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{review.user?.email || 'Unknown user'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl shadow-md ${
                  review.avg < 2 ? 'bg-red-500' : 'bg-primary-500'
                } text-white`}>
                  <Star className="w-5 h-5 fill-white" />
                  <span className="font-bold text-lg">{review.avg.toFixed(1)}</span>
                </div>
              </div>

              {/* Category Ratings */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {review.type === 'neighborhood' ? (
                  <>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <Shield className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Safety</div>
                      <div className="font-bold text-gray-900">{review.safety}/5</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <Sparkles className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Clean</div>
                      <div className="font-bold text-gray-900">{review.cleanliness}/5</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Volume2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Noise</div>
                      <div className="font-bold text-gray-900">{review.noise}/5</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <Users className="w-4 h-4 text-pink-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Community</div>
                      <div className="font-bold text-gray-900">{review.community}/5</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <Train className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Transit</div>
                      <div className="font-bold text-gray-900">{review.transit}/5</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Package className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Amenities</div>
                      <div className="font-bold text-gray-900">{review.amenities}/5</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Mgmt</div>
                      <div className="font-bold text-gray-900">{review.management}/5</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <Sparkles className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Clean</div>
                      <div className="font-bold text-gray-900">{review.cleanliness}/5</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Wrench className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Maint</div>
                      <div className="font-bold text-gray-900">{review.maintenance}/5</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Value</div>
                      <div className="font-bold text-gray-900">{review.rent_value}/5</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Volume2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Noise</div>
                      <div className="font-bold text-gray-900">{review.noise}/5</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <Package className="w-4 h-4 text-pink-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 mb-1">Amenities</div>
                      <div className="font-bold text-gray-900">{review.amenities}/5</div>
                    </div>
                  </>
                )}
              </div>

              {review.comment && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="w-4 h-4 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-900 mb-1">User Comment:</p>
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                    </div>
                  </div>
                </div>
              )}

              {review.images && review.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{review.images.length} Photos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {review.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Review photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleApprove(review.id, review.type)}
                  disabled={actionLoading === review.id}
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all font-semibold flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === review.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Approve & Publish</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(review.id, review.type)}
                  disabled={actionLoading === review.id}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all font-semibold flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Reject</span>
                </button>
                <Link
                  href={review.type === 'neighborhood' 
                    ? `/neighborhood/${review.location.slug || review.location.id}` 
                    : `/building/${review.location.slug || review.location.id}`
                  }
                  target="_blank"
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center space-x-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>Preview</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

