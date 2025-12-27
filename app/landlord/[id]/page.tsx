'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, MapPin, Phone, Mail, Globe, User, MessageSquare, Wrench, Scale, Briefcase, ArrowLeft, Camera, Calendar, CheckCircle, XCircle, AlertCircle, BadgeCheck, Flag, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Landlord {
  id: string
  name: string
  company_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  city: string
  province: string
  country: string
  description: string | null
  overall_rating: number
  responsiveness_rating: number
  maintenance_rating: number
  communication_rating: number
  fairness_rating: number
  professionalism_rating: number
  total_reviews: number
  profile_image?: string
  created_at: string
}

interface Review {
  id: string
  user_id: string
  review: string
  comment?: string
  pros: string | null
  cons: string | null
  overall_rating: number
  responsiveness?: number
  responsiveness_rating?: number | null
  maintenance?: number
  maintenance_rating?: number | null
  communication?: number
  communication_rating?: number | null
  fairness?: number
  fairness_rating?: number | null
  professionalism?: number
  professionalism_rating?: number | null
  years_rented: number | null
  monthly_rent: number | null
  would_recommend: boolean | null
  is_anonymous: boolean
  display_name: string | null
  created_at: string
  status: string
  images?: string[] | null
  verification_request_id?: string | null
}

interface UserProfile {
  id: string
  is_verified_tenant: boolean
}

export default function LandlordPage() {
  const params = useParams()
  const router = useRouter()
  const [landlord, setLandlord] = useState<Landlord | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [recommendFilter, setRecommendFilter] = useState<'all' | 'recommend' | 'not-recommend'>('all')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set())
  const [allPhotos, setAllPhotos] = useState<Array<{url: string, reviewId: string, userId: string, displayName: string}>>([])
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, reviewId: string, userId: string, displayName: string} | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchLandlord()
      checkCurrentUser()
    }
  }, [params.id])

  // Recheck hasReviewed when currentUser or reviews change
  useEffect(() => {
    if (currentUser && reviews.length > 0) {
      const userReview = reviews.find((review: any) => review.user_id === currentUser.id)
      setHasReviewed(!!userReview)
    }
  }, [currentUser, reviews])

  const checkCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUser(session.user)
      }
    } catch (error) {
      console.error('Error checking current user:', error)
      // Don't block page load if auth check fails
    }
  }

  const fetchLandlord = async () => {
    try {
      setLoading(true)
      
      // Use API route for reliable data fetching
      const response = await fetch(`/api/landlord/${params.id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching landlord:', errorData)
        alert(errorData.error || 'Failed to load landlord. Please try again.')
        setLandlord(null)
        setLoading(false)
        return
      }

      const data = await response.json()
      const { landlord: landlordData, reviews: reviewsData, pendingCount, verifiedUserIds } = data

      if (!landlordData) {
        console.error('No landlord data received')
        alert('Landlord not found')
        setLandlord(null)
        setLoading(false)
        return
      }

      setLandlord(landlordData)
      setPendingReviewCount(pendingCount || 0)
      setVerifiedUsers(new Set(verifiedUserIds || []))

      // Process reviews and photos
      console.log('📊 Reviews data received:', { 
        reviewsCount: reviewsData?.length || 0, 
        totalReviews: landlordData.total_reviews,
        pendingCount: pendingCount,
        reviews: reviewsData 
      })
      
      if (reviewsData && reviewsData.length > 0) {
        console.log('📸 Fetched reviews:', reviewsData)
        
        // Collect all photos for gallery
        const photoList: Array<{url: string, reviewId: string, userId: string, displayName: string}> = []
        reviewsData.forEach((review: any) => {
          if (review.images) {
            let imageUrls: string[] = []
            if (Array.isArray(review.images)) {
              imageUrls = review.images
            } else if (typeof review.images === 'string') {
              try {
                const parsed = JSON.parse(review.images)
                imageUrls = Array.isArray(parsed) ? parsed : [review.images]
              } catch {
                imageUrls = [review.images]
              }
            }
            
            imageUrls.forEach((url: string) => {
              photoList.push({
                url,
                reviewId: review.id,
                userId: review.user_id,
                displayName: review.is_anonymous ? 'Anonymous User' : (review.display_name || 'Anonymous User')
              })
            })
          }
        })
        setAllPhotos(photoList)
        setReviews(reviewsData)
        
        // Check if current user has reviewed this landlord
        if (currentUser) {
          const userReview = reviewsData.find((review: any) => review.user_id === currentUser.id)
          setHasReviewed(!!userReview)
        }
      } else {
        setReviews([])
        setAllPhotos([])
      }
    } catch (error: any) {
      console.error('Error fetching landlord:', error)
      alert('Failed to load landlord: ' + (error.message || 'Unknown error'))
      setLandlord(null)
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'from-green-500 to-emerald-600'
    if (rating >= 3.5) return 'from-blue-500 to-cyan-600'
    if (rating >= 2.5) return 'from-yellow-500 to-orange-500'
    if (rating >= 1.5) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-rose-700'
  }

  const getRatingTextColor = (rating: number) => {
    // Good ratings: 4.0 and above = green
    if (rating >= 4.0) return 'text-green-600'
    // Normal ratings: 3.0 to 3.9 = yellow
    if (rating >= 3.0) return 'text-yellow-600'
    // Bad ratings: below 3.0 = red
    return 'text-red-600'
  }

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 3.5) return 'Good'
    if (rating >= 2.5) return 'Average'
    if (rating >= 1.5) return 'Poor'
    return 'Very Poor'
  }

  const handleReportPhoto = async (photoUrl: string, reviewId: string, reviewType: string) => {
    if (!currentUser) {
      alert('Please log in to report a photo')
      return
    }

    const reason = prompt('Why are you reporting this photo? (e.g., Inappropriate, Spam, Fake)')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('photo_reports')
        .insert({
          photo_url: photoUrl,
          review_id: reviewId,
          review_type: reviewType,
          reported_by: currentUser.id,
          reason: reason
        })

      if (error) throw error
      alert('✅ Photo reported. Thank you for helping keep our community safe!')
    } catch (error: any) {
      console.error('Error reporting photo:', error)
      alert('Failed to report photo: ' + error.message)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !landlord) return

    // Check if user is logged in
    if (!currentUser) {
      alert('❌ Please log in to upload a profile image')
      return
    }

    // Check if user has reviewed this landlord
    if (!hasReviewed) {
      alert('❌ Only users who have reviewed this landlord can upload profile images.\n\nPlease submit a review first!')
      return
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${landlord.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Upload to landlord-images bucket
      const { error: uploadError } = await supabase.storage
        .from('landlord-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload image')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('landlord-images')
        .getPublicUrl(filePath)

      // Update landlord record
      const { error: updateError } = await supabase
        .from('landlords')
        .update({ profile_image: publicUrl })
        .eq('id', landlord.id)

      if (updateError) {
        console.error('Update error:', updateError)
        alert('Failed to update profile image')
        return
      }

      // Update local state
      setLandlord({ ...landlord, profile_image: publicUrl })
      alert('✅ Profile image updated!')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading landlord profile...</p>
        </div>
      </div>
    )
  }

  if (!landlord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">404</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Landlord Not Found</h2>
            <p className="text-gray-600 mb-8">
              Sorry, we couldn&apos;t find this landlord. They may have been removed or the link is incorrect.
            </p>
            <Link
              href="/explore"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const ratingColor = getRatingColor(landlord.overall_rating)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Minimal Header */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0 mx-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{landlord.name}</h1>
              {landlord.company_name && (
                <p className="text-sm text-gray-500 truncate mt-0.5">{landlord.company_name}</p>
              )}
            </div>
            {/* Prominent Rating Display */}
            <div className="flex items-center gap-2 bg-gradient-to-br from-amber-50 to-yellow-50 px-4 py-2 rounded-xl border border-amber-200/50">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div className="flex flex-col">
                <span className={`text-2xl font-bold leading-none ${getRatingTextColor(landlord.overall_rating || 0)}`}>{(landlord.overall_rating || 0).toFixed(1)}</span>
                <span className="text-xs text-gray-600 leading-none mt-0.5">{landlord.total_reviews || 0} review{landlord.total_reviews !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* LEFT SIDE - Profile Information (Sticky) */}
          <div className="w-full lg:w-[380px] lg:flex-shrink-0 lg:border-r lg:border-gray-100 lg:pr-8">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Profile Image/Initial */}
              <div className="relative">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 group">
                  {landlord.profile_image ? (
                    <img 
                      src={landlord.profile_image} 
                      alt={landlord.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-6xl font-bold text-white opacity-90">{landlord.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {landlord.profile_image && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100" style={{ display: 'none' }}>
                      <span className="text-6xl font-bold text-white opacity-90">{landlord.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {hasReviewed && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            {landlord.profile_image ? 'Change' : 'Add Photo'}
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm">{landlord.city}, {landlord.province}</span>
              </div>

              {/* Prominent Rate Button */}
              <Link
                href={`/rate/landlord?prefill=${encodeURIComponent(JSON.stringify({ landlord: landlord.name }))}`}
                className="block w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center px-6 py-3.5 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold text-base shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transform hover:-translate-y-0.5"
              >
                ⭐ Rate This Landlord
              </Link>

              {/* Verified Badge - Compact */}
              {Array.from(verifiedUsers).length > 0 && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-200/50">
                  <div className="flex items-center justify-center space-x-2">
                    <BadgeCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {Array.from(verifiedUsers).length} Verified {Array.from(verifiedUsers).length === 1 ? 'Tenant' : 'Tenants'}
                    </span>
                  </div>
                </div>
              )}

              {/* Rating Breakdown - Compact */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Rating Breakdown</h2>
                <div className="space-y-2.5">
                  {[
                    { label: 'Responsiveness', rating: landlord.responsiveness_rating || 0, icon: MessageSquare, color: 'blue' },
                    { label: 'Maintenance', rating: landlord.maintenance_rating || 0, icon: Wrench, color: 'green' },
                    { label: 'Communication', rating: landlord.communication_rating || 0, icon: MessageSquare, color: 'purple' },
                    { label: 'Fairness', rating: landlord.fairness_rating || 0, icon: Scale, color: 'yellow' },
                    { label: 'Professionalism', rating: landlord.professionalism_rating || 0, icon: Briefcase, color: 'indigo' },
                  ].map((category) => {
                    const Icon = category.icon
                    const ratingValue = category.rating || 0
                    const percentage = (ratingValue / 5) * 100
                    return (
                      <div key={category.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">{category.label}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className={`text-xs font-bold ${getRatingTextColor(ratingValue)}`}>{ratingValue.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              percentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              percentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Reviews */}
          <div className="w-full lg:flex-1 lg:min-w-0">
            {/* Reviews Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Reviews</h2>
              <p className="text-sm text-gray-600">{reviews.length || 0} {reviews.length === 1 ? 'review' : 'reviews'}</p>
            </div>

            {/* Pending Reviews Notice */}
            {pendingReviewCount > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1 text-sm">Review Under Approval</h3>
                    <p className="text-xs text-amber-800">
                      {pendingReviewCount === 1 
                        ? '1 review pending approval'
                        : `${pendingReviewCount} reviews pending approval`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters - Simplified */}
            {reviews.length > 0 && (
              <div className="mb-6 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {/* Rating Filter */}
                  <select
                    value={ratingFilter || ''}
                    onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white hover:border-gray-300 transition-colors"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>

                  {/* Recommendation Filter */}
                  <select
                    value={recommendFilter}
                    onChange={(e) => setRecommendFilter(e.target.value as 'all' | 'recommend' | 'not-recommend')}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white hover:border-gray-300 transition-colors"
                  >
                    <option value="all">All Reviews</option>
                    <option value="recommend">Recommended</option>
                    <option value="not-recommend">Not Recommended</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest' | 'lowest')}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white hover:border-gray-300 transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                </div>
              </div>
            )}
            
            {reviews.length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-semibold mb-2">No reviews yet</p>
                  <p className="text-gray-500 text-sm mb-6">Be the first to rate this landlord</p>
                  <Link
                    href={`/rate/landlord?landlord=${landlord.id}`}
                    className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/20"
                  >
                    ⭐ Write First Review
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews
                    .filter(review => {
                      // Rating filter
                      if (ratingFilter) {
                        const reviewAvg = Math.round(review.overall_rating)
                        if (reviewAvg !== ratingFilter) return false
                      }
                      
                      // Recommendation filter
                      if (recommendFilter === 'recommend' && !review.would_recommend) return false
                      if (recommendFilter === 'not-recommend' && review.would_recommend) return false
                      
                      return true
                    })
                    .sort((a, b) => {
                      switch (sortBy) {
                        case 'oldest':
                          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        case 'highest':
                          return b.overall_rating - a.overall_rating
                        case 'lowest':
                          return a.overall_rating - b.overall_rating
                        case 'newest':
                        default:
                          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      }
                    })
                    .map((review) => {
                      const displayName = review.is_anonymous ? 'Anonymous User' : (review.display_name || 'Anonymous User')
                      const reviewText = review.comment || review.review || null
                      
                      return (
                        <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                          {/* Review Header - Simplified */}
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRatingColor(review.overall_rating)} flex items-center justify-center text-white font-bold flex-shrink-0 text-xs`}>
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                  <p className="font-semibold text-xs text-gray-900">{displayName}</p>
                                  {verifiedUsers.has(review.user_id) && (
                                    <BadgeCheck className="w-3 h-3 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                            </div>
                            {/* Rating Badge - Compact */}
                            <div className={`bg-gradient-to-r ${getRatingColor(review.overall_rating)} px-2.5 py-1 rounded-md flex items-center space-x-1 flex-shrink-0`}>
                              <Star className="w-3 h-3 text-white fill-white" />
                              <span className="font-bold text-xs text-white">{review.overall_rating.toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Review Text - Full text, no clamp */}
                          {reviewText && (
                            <div className="mb-3">
                              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{reviewText}</p>
                            </div>
                          )}

                          {/* Pros and Cons */}
                          {(review.pros || review.cons) && (
                            <div className="mb-3 space-y-2">
                              {review.pros && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                                  <p className="text-xs font-semibold text-green-900 mb-1">✓ Pros</p>
                                  <p className="text-xs text-green-800 leading-relaxed whitespace-pre-wrap">{review.pros}</p>
                                </div>
                              )}
                              {review.cons && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                  <p className="text-xs font-semibold text-red-900 mb-1">✗ Cons</p>
                                  <p className="text-xs text-red-800 leading-relaxed whitespace-pre-wrap">{review.cons}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Review Images - Fixed Height */}
                          {review.images && (
                            <div className="mb-2.5">
                              {(() => {
                                // Handle both array and string cases
                                let imageUrls: string[] = []
                                if (Array.isArray(review.images)) {
                                  imageUrls = review.images
                                } else if (typeof review.images === 'string') {
                                  try {
                                    const parsed = JSON.parse(review.images)
                                    imageUrls = Array.isArray(parsed) ? parsed : [review.images]
                                  } catch {
                                    imageUrls = [review.images]
                                  }
                                }
                                
                                if (imageUrls.length === 0) return null
                                
                                return (
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {imageUrls.slice(0, 4).map((imageUrl, idx) => (
                                      <div key={idx} className="relative group h-16 rounded-md overflow-hidden bg-gray-100">
                                        <img
                                          src={imageUrl}
                                          alt={`Review image ${idx + 1}`}
                                          className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                                          onClick={() => setSelectedPhoto({
                                            url: imageUrl,
                                            reviewId: review.id,
                                            userId: review.user_id,
                                            displayName: displayName
                                          })}
                                          onError={(e) => {
                                            console.error('❌ Failed to load image:', imageUrl)
                                            e.currentTarget.style.display = 'none'
                                          }}
                                        />
                                        {currentUser && currentUser.id !== review.user_id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleReportPhoto(imageUrl, review.id, 'landlord')
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Report photo"
                                          >
                                            <Flag className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          )}

                          {/* Category Ratings - Compact */}
                          <div className="flex flex-wrap gap-1 mb-2 pt-2 border-t border-gray-100">
                            {(review.responsiveness || review.responsiveness_rating) && (
                              <div className="flex items-center space-x-0.5 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-[9px] font-medium text-gray-600">Resp</span>
                                <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                                <span className={`text-[9px] font-bold ${getRatingTextColor(review.responsiveness || review.responsiveness_rating || 0)}`}>{(review.responsiveness || review.responsiveness_rating).toFixed(1)}</span>
                              </div>
                            )}
                            {(review.maintenance || review.maintenance_rating) && (
                              <div className="flex items-center space-x-0.5 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-[9px] font-medium text-gray-600">Maint</span>
                                <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                                <span className={`text-[9px] font-bold ${getRatingTextColor(review.maintenance || review.maintenance_rating || 0)}`}>{(review.maintenance || review.maintenance_rating).toFixed(1)}</span>
                              </div>
                            )}
                            {(review.communication || review.communication_rating) && (
                              <div className="flex items-center space-x-0.5 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-[9px] font-medium text-gray-600">Comm</span>
                                <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                                <span className={`text-[9px] font-bold ${getRatingTextColor(review.communication || review.communication_rating || 0)}`}>{(review.communication || review.communication_rating).toFixed(1)}</span>
                              </div>
                            )}
                            {(review.fairness || review.fairness_rating) && (
                              <div className="flex items-center space-x-0.5 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-[9px] font-medium text-gray-600">Fair</span>
                                <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                                <span className={`text-[9px] font-bold ${getRatingTextColor(review.fairness || review.fairness_rating || 0)}`}>{(review.fairness || review.fairness_rating).toFixed(1)}</span>
                              </div>
                            )}
                            {(review.professionalism || review.professionalism_rating) && (
                              <div className="flex items-center space-x-0.5 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-[9px] font-medium text-gray-600">Prof</span>
                                <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                                <span className={`text-[9px] font-bold ${getRatingTextColor(review.professionalism || review.professionalism_rating || 0)}`}>{(review.professionalism || review.professionalism_rating).toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          {/* Additional Info - Compact */}
                          <div className="flex flex-wrap gap-1.5 text-[10px] pt-2 border-t border-gray-100">
                            {review.years_rented && (
                              <span className="text-gray-600">Rented {review.years_rented}yr{review.years_rented !== 1 ? 's' : ''}</span>
                            )}
                            {review.monthly_rent && (
                              <span className="text-gray-600">${review.monthly_rent.toLocaleString()}/mo</span>
                            )}
                            {review.would_recommend !== null && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                review.would_recommend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {review.would_recommend ? '✓ Recommends' : '✗ No'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img
                src={selectedPhoto.url}
                alt="Review photo"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Photo by <span className="font-semibold">{selectedPhoto.displayName}</span>
              </p>
              {currentUser && currentUser.id !== selectedPhoto.userId && (
                <button
                  onClick={() => {
                    handleReportPhoto(selectedPhoto.url, selectedPhoto.reviewId, 'landlord')
                    setSelectedPhoto(null)
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report this photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Section */}
      {allPhotos.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <ImageIcon className="w-6 h-6" />
            <span>Photo Gallery</span>
            <span className="text-lg text-gray-500 font-normal">({allPhotos.length} photos)</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
                {currentUser && currentUser.id !== photo.userId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReportPhoto(photo.url, photo.reviewId, 'landlord')
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Report photo"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
