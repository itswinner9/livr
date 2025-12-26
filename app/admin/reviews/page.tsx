'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Star, MapPin, Building2, UserCheck, Building, Filter, X, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PendingReview {
  id: string
  review_type: string
  entity_name: string
  entity_id: string
  user_name: string
  title: string
  review: string
  overall_rating: number
  created_at: string
  status: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      // Fetch ALL pending reviews (no limit) from all review tables
      const [neighborhoodData, buildingData, landlordData, rentCompanyData] = await Promise.all([
        supabase.from('neighborhood_reviews')
          .select('id, neighborhood_id, user_id, title, review, overall_rating, created_at, status, neighborhoods!inner(name), user_profiles!inner(email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        
        supabase.from('building_reviews')
          .select('id, building_id, user_id, title, review, overall_rating, created_at, status, buildings!inner(name), user_profiles!inner(email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        
        supabase.from('landlord_reviews')
          .select('id, landlord_id, user_id, title, review, comment, overall_rating, created_at, status, landlords!inner(name), user_profiles!inner(email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        
        supabase.from('rent_company_reviews')
          .select('id, rent_company_id, user_id, title, review, overall_rating, created_at, status, rent_companies!inner(name), user_profiles!inner(email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      ])

      // Log results for debugging
      console.log('📊 Neighborhood reviews:', neighborhoodData.data?.length || 0)
      console.log('📊 Building reviews:', buildingData.data?.length || 0)
      console.log('📊 Landlord reviews:', landlordData.data?.length || 0)
      console.log('📊 Rent company reviews:', rentCompanyData.data?.length || 0)

      const allReviews: PendingReview[] = []
      
      // Fast processing - direct mapping
      neighborhoodData.data?.forEach((r: any) => allReviews.push({
        id: r.id, review_type: 'neighborhood', entity_name: r.neighborhoods.name, entity_id: r.neighborhood_id,
        user_name: r.user_profiles.email, title: r.title, review: r.review, overall_rating: r.overall_rating, created_at: r.created_at, status: r.status
      }))
      buildingData.data?.forEach((r: any) => allReviews.push({
        id: r.id, review_type: 'building', entity_name: r.buildings.name, entity_id: r.building_id,
        user_name: r.user_profiles.email, title: r.title, review: r.review, overall_rating: r.overall_rating, created_at: r.created_at, status: r.status
      }))
      landlordData.data?.forEach((r: any) => allReviews.push({
        id: r.id, review_type: 'landlord', entity_name: r.landlords.name, entity_id: r.landlord_id,
        user_name: r.user_profiles.email, title: r.title, review: r.comment || r.review || '', overall_rating: r.overall_rating, created_at: r.created_at, status: r.status
      }))
      rentCompanyData.data?.forEach((r: any) => allReviews.push({
        id: r.id, review_type: 'rent_company', entity_name: r.rent_companies.name, entity_id: r.rent_company_id,
        user_name: r.user_profiles.email, title: r.title, review: r.review, overall_rating: r.overall_rating, created_at: r.created_at, status: r.status
      }))
      
      setReviews(allReviews)
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId: string, reviewType: string) => {
    setActionLoading(reviewId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Determine which table to update
      const tableName = 
        reviewType === 'neighborhood' ? 'neighborhood_reviews' :
        reviewType === 'building' ? 'building_reviews' :
        reviewType === 'landlord' ? 'landlord_reviews' :
        'rent_company_reviews'

      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', reviewId)

      if (error) {
        console.error('Error approving review:', error)
        alert('Error approving review: ' + error.message)
        return
      }

      console.log('✅ Review approved successfully')
      alert('✅ Review approved! It is now visible to all users.')

      // Refresh the list
      await fetchPendingReviews()
      setSelectedReview(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reviewId: string, reviewType: string) => {
    if (!adminNotes.trim()) {
      alert('⚠️ Please add admin notes explaining why this review is being rejected.')
      return
    }

    setActionLoading(reviewId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Determine which table to update
      const tableName = 
        reviewType === 'neighborhood' ? 'neighborhood_reviews' :
        reviewType === 'building' ? 'building_reviews' :
        reviewType === 'landlord' ? 'landlord_reviews' :
        'rent_company_reviews'

      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', reviewId)

      if (error) {
        console.error('Error rejecting review:', error)
        alert('Error rejecting review: ' + error.message)
        return
      }

      console.log('✅ Review rejected successfully')
      alert('❌ Review rejected. It will not be visible to users.')

      // Refresh the list
      await fetchPendingReviews()
      setSelectedReview(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getReviewIcon = (reviewType: string) => {
    switch (reviewType) {
      case 'neighborhood': return <MapPin className="w-5 h-5 text-blue-500" />
      case 'building': return <Building2 className="w-5 h-5 text-green-500" />
      case 'landlord': return <UserCheck className="w-5 h-5 text-purple-500" />
      case 'rent_company': return <Building className="w-5 h-5 text-orange-500" />
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />
    }
  }

  const getReviewTypeColor = (reviewType: string) => {
    switch (reviewType) {
      case 'neighborhood': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'building': return 'bg-green-100 text-green-800 border-green-200'
      case 'landlord': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'rent_company': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Filter and sort reviews
  const filteredReviews = reviews.filter(review => 
    filterType === 'all' ? true : review.review_type === filterType
  ).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy === 'rating-high') {
      return b.overall_rating - a.overall_rating
    } else if (sortBy === 'rating-low') {
      return a.overall_rating - b.overall_rating
    }
    return 0
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-xl w-72 mb-3 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl shadow-lg animate-pulse"></div>
            ))}
          </div>

          {/* Filters skeleton */}
          <div className="bg-white rounded-xl p-4 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>

          {/* Review cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-64 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="h-7 bg-gray-200 rounded-full w-24"></div>
                </div>
                <div className="h-24 bg-gray-200 rounded-xl mb-4"></div>
                <div className="flex space-x-3">
                  <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
                  <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
              <p className="text-gray-600">Approve or reject user-submitted reviews</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{reviews.length} pending review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('neighborhood')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Neighborhoods</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => r.review_type === 'neighborhood').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('building')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Buildings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => r.review_type === 'building').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('landlord')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Landlords & Rent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => r.review_type === 'landlord' || r.review_type === 'rent_company').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter by Type */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('neighborhood')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'neighborhood'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Neighborhoods
              </button>
              <button
                onClick={() => setFilterType('building')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'building'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Buildings
              </button>
              <button
                onClick={() => setFilterType('landlord')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'landlord'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Landlords & Rent
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badge */}
          {filterType !== 'all' && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filter:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getReviewTypeColor(filterType)}`}>
                {filterType === 'neighborhood' ? 'Neighborhoods' : 
                 filterType === 'building' ? 'Buildings' : 
                 'Landlords & Rent Companies'}
              </span>
              <button
                onClick={() => setFilterType('all')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredReviews.length} Review{filteredReviews.length !== 1 ? 's' : ''} {filterType !== 'all' ? `(${filterType})` : ''}
            </h2>
          </div>
          
          {filteredReviews.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">
                {filterType === 'all' 
                  ? 'No pending reviews to review.' 
                  : `No ${filterType} reviews pending.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg border ${getReviewTypeColor(review.review_type)}`}>
                          {getReviewIcon(review.review_type)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReviewTypeColor(review.review_type)}`}>
                          {review.review_type === 'neighborhood' ? 'NEIGHBORHOOD' : 
                           review.review_type === 'building' ? 'BUILDING' : 
                           review.review_type === 'landlord' ? 'LANDLORD' : 'RENT COMPANY'}
                        </span>
                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.overall_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm font-bold text-gray-700 ml-1">
                            {review.overall_rating}/5
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {review.title || 'No title'}
                      </h3>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {review.review}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-medium">By: {review.user_name}</span>
                        <span>•</span>
                        <span className="font-medium">For: {review.entity_name}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleApprove(review.id, review.review_type)}
                        disabled={actionLoading === review.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 font-medium"
                      >
                        {actionLoading === review.id ? (
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Approve</span>
                      </button>
                      
                      <button
                        onClick={() => handleReject(review.id, review.review_type)}
                        disabled={actionLoading === review.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 font-medium"
                      >
                        {actionLoading === review.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Detail Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedReview(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Review Details</h3>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg border ${getReviewTypeColor(selectedReview.review_type)}`}>
                      {getReviewIcon(selectedReview.review_type)}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getReviewTypeColor(selectedReview.review_type)}`}>
                      {selectedReview.review_type.toUpperCase().replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= selectedReview.overall_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-lg font-bold text-gray-700 ml-2">
                        {selectedReview.overall_rating}/5
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    {selectedReview.title || 'No title'}
                  </h4>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {selectedReview.review}
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="text-gray-600"><strong>Reviewer:</strong> {selectedReview.user_name}</p>
                    <p className="text-gray-600"><strong>Entity:</strong> {selectedReview.entity_name}</p>
                    <p className="text-gray-600"><strong>Submitted:</strong> {new Date(selectedReview.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add notes about this review..."
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedReview.id, selectedReview.review_type)}
                    disabled={actionLoading === selectedReview.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 font-medium"
                  >
                    {actionLoading === selectedReview.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReview.id, selectedReview.review_type)}
                    disabled={actionLoading === selectedReview.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 font-medium"
                  >
                    {actionLoading === selectedReview.id ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
