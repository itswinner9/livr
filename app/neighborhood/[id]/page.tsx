'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, MapPin, Shield, Sparkles, Volume2, Users, Train, Package, Calendar, ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, User, X, Camera, ThumbsUp, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Neighborhood, NeighborhoodReview } from '@/lib/supabase'
import { generateNeighborhoodStructuredData } from '@/lib/seo'
import ReviewVoting from '@/components/ReviewVoting'

export const dynamic = 'force-dynamic'

export default function NeighborhoodDetail() {
  const params = useParams()
  const router = useRouter()
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null)
  const [reviews, setReviews] = useState<NeighborhoodReview[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [allImages, setAllImages] = useState<string[]>([])
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchNeighborhood(params.id as string)
    }
  }, [params.id])

  const fetchNeighborhood = async (idOrSlug: string) => {
    try {
      setLoading(true)
      console.log('Fetching neighborhood:', idOrSlug)
      
      // Try to fetch by slug first (SEO-friendly), fallback to ID
      let query = supabase.from('neighborhoods').select('*')
      
      // Check if it's a UUID or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
      
      if (isUUID) {
        console.log('Searching by UUID')
        query = query.eq('id', idOrSlug)
      } else {
        console.log('Searching by slug')
        query = query.eq('slug', idOrSlug)
      }
      
      const { data, error } = await query.single()

      if (error || !data) {
        console.error('Error fetching neighborhood:', error)
        setNeighborhood(null)
        setLoading(false)
        return
      }

      console.log('Neighborhood found:', data.name)
      setNeighborhood(data)

      // Fetch reviews using the actual neighborhood ID
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('neighborhood_reviews')
        .select('*')
        .eq('neighborhood_id', data.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
      }

      if (reviewsData && reviewsData.length > 0) {
        console.log('Found reviews:', reviewsData.length)
        setReviews(reviewsData)
        
        const images: string[] = []
        reviewsData.forEach(review => {
          if (review.images && review.images.length > 0) {
            images.push(...review.images)
          }
        })
        setAllImages(images)
      } else if (data.images && data.images.length > 0) {
        // Fallback to old structure
        setAllImages(data.images)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error in fetchNeighborhood:', err)
      setNeighborhood(null)
      setLoading(false)
    }
  }

  const nextImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }
  }

  const prevImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? allImages.length - 1 : prev - 1
      )
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-500"></div>
      </main>
    )
  }

  if (!neighborhood) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Neighborhood not found</p>
          <Link href="/explore" className="text-primary-500 hover:text-primary-600 mt-4 inline-block">
            Back to Explore
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      {/* JSON-LD Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(generateNeighborhoodStructuredData(neighborhood, reviews))
        }}
      />
      
      <div className="max-w-6xl mx-auto">
        <Link 
          href="/explore"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Explore</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Cover Image / Image Gallery */}
          <div className="relative h-[50vh] min-h-[400px] max-h-[600px] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 overflow-hidden">
            {/* Cover Image or User Photos */}
            {(neighborhood.cover_image || allImages.length > 0) ? (
              <>
                <img
                  src={neighborhood.cover_image || allImages[currentImageIndex]}
                  alt={`${neighborhood.name} in ${neighborhood.city}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                  onClick={() => {
                    if (allImages.length > 0) {
                      setShowImageGallery(true)
                      setSelectedImageIndex(currentImageIndex)
                    }
                  }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                
                
                {/* Photo Count */}
                {allImages.length > 0 && (
                  <button
                    onClick={() => {
                      setShowImageGallery(true)
                      setSelectedImageIndex(0)
                    }}
                    className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-black/90 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="font-semibold text-sm">{allImages.length} Photo{allImages.length !== 1 ? 's' : ''}</span>
                  </button>
                )}
                
                {/* Navigation for multiple images */}
                {allImages.length > 1 && !neighborhood.cover_image && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-3 rounded-full shadow-xl hover:bg-white transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-3 rounded-full shadow-xl hover:bg-white transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-900" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-8'
                              : 'bg-white/60 hover:bg-white/80 w-2'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              // Default gradient background if no images
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <MapPin className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-2xl font-bold opacity-75">{neighborhood.name}</p>
                  <p className="text-lg opacity-60">{neighborhood.city}, {neighborhood.province}</p>
                </div>
              </div>
            )}
            
            {/* Enhanced Title Overlay with Rating */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl mb-2">
                    {neighborhood.name}
                  </h1>
                  <div className="flex items-center space-x-2 text-white/90">
                    <MapPin className="w-5 h-5" />
                    <span className="text-base lg:text-lg">{neighborhood.city}, {neighborhood.province}</span>
                  </div>
                </div>
                
                {/* Animated Rating Badge */}
                {(neighborhood.overall_rating || neighborhood.average_rating) > 0 && (
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                      <span className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent animate-gradient">
                        {(neighborhood.overall_rating || neighborhood.average_rating || 0).toFixed(1)}
                        </span>
                      </div>
                    <div className="text-xs text-white/80 text-center font-medium">
                      {neighborhood.total_reviews || 0} Review{(neighborhood.total_reviews || 0) !== 1 ? 's' : ''}
                      </div>
                    {/* Sparkle effects */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-sparkle"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image Thumbnails Gallery - Show if images exist */}
            {allImages.length > 1 && (
            <div className="px-6 lg:px-12 py-4 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Community Photos ({allImages.length})</span>
                </h3>
                  <button
                    onClick={() => {
                      setSelectedImageIndex(0)
                      setShowImageGallery(true)
                    }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {allImages.slice(0, 10).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedImageIndex(idx)
                        setShowImageGallery(true)
                      }}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200 shadow-md"
                    >
                      <img
                        src={img}
                      alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              {allImages.length > 10 && (
                  <button
                    onClick={() => {
                    setSelectedImageIndex(10)
                      setShowImageGallery(true)
                    }}
                  className="mt-3 text-sm text-gray-600 hover:text-primary-600 font-medium"
                  >
                  + {allImages.length - 10} more photos
                  </button>
                )}
              </div>
            )}

          {/* Content - Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-8 xl:p-12 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Left Side - Reviews */}
            <div className="lg:col-span-2 space-y-6">
            {/* All User Reviews */}
            {reviews.length > 0 && (
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <div className="relative">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                      Reviews ({reviews.length})
                    </h2>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Sorted by most helpful • Real residents</span>
                    </p>
                  </div>
                  
                  {/* Rating Filter */}
                  <div className="relative">
                  <select
                    value={ratingFilter || ''}
                    onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
                      className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold bg-white shadow-lg hover:shadow-xl transition-all appearance-none cursor-pointer bg-gradient-to-br from-white to-gray-50"
                  >
                      <option value="">⭐ All Ratings</option>
                    <option value="5">⭐ 5 Stars</option>
                    <option value="4">⭐ 4 Stars</option>
                    <option value="3">⭐ 3 Stars</option>
                    <option value="2">⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews
                    .filter(review => {
                      if (!ratingFilter) return true
                      const s = (review.safety || 0)
                      const n = (review.noise || 0)
                      const t = (review.transit || 0)
                      const a = (review.amenities || 0)
                      const c = (review.community || 0)
                      const reviewAvg = Math.round((s + n + t + a + c) / 5)
                      return reviewAvg === ratingFilter
                    })
                    .sort((a, b) => {
                      const aScore = (a.helpful_count || 0) - (a.not_helpful_count || 0)
                      const bScore = (b.helpful_count || 0) - (b.not_helpful_count || 0)
                      if (aScore !== bScore) return bScore - aScore
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    })
                    .map((review, index) => {
                      const s = (review.safety || 0)
                      const n = (review.noise || 0)
                      const t = (review.transit || 0)
                      const a = (review.amenities || 0)
                      const c = (review.community || 0)
                      const reviewAvg = (s + n + t + a + c) / 5
                    const displayName = review.is_anonymous ? 'Anonymous User' : (review.display_name || 'Anonymous User')
                    
                    return (
                        <div key={review.id} className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:to-purple-50/30 transition-all duration-300 -z-10"></div>
                          
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`relative w-14 h-14 bg-gradient-to-br ${review.is_anonymous ? 'from-gray-400 to-gray-500' : 'from-blue-500 via-purple-500 to-pink-500'} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                                <User className="w-7 h-7 text-white" />
                                {/* Decorative circle */}
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-lg">{displayName}</p>
                                <p className="text-xs text-gray-500 flex items-center space-x-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-3 rounded-2xl shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform">
                              {/* Animated background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                              <Star className="w-6 h-6 text-white fill-white relative z-10" />
                              <span className="font-bold text-white text-xl relative z-10">{reviewAvg.toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Category Ratings */}
                          {review.comment && (
                            <p className="text-gray-700 mb-4 leading-relaxed text-base border-l-4 border-blue-500 pl-4 bg-blue-50/30 py-2 rounded-r-lg">{review.comment}</p>
                          )}

                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              {review.images.slice(0, 6).map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative group/img overflow-hidden rounded-xl cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-2xl"
                                  onClick={() => window.open(img, '_blank')}
                                >
                                  <img
                                    src={img}
                                    alt={`Review image ${idx + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                  {/* Overlay on hover */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="text-white font-semibold text-sm transform translate-y-2 group-hover/img:translate-y-0 transition-transform">View Full Size</div>
                          </div>
                        </div>
                              ))}
                          </div>
                          )}

                          {/* Helpful Buttons */}
                          <div className="flex items-center space-x-3 pt-4 border-t-2 border-gray-100">
                            <button 
                              onClick={async () => {
                                try {
                                  const { data: { user } } = await supabase.auth.getUser()
                                  if (!user) {
                                    alert('Please login to vote')
                                    return
                                  }

                                  // Check if user already voted
                                  const { data: existingVote } = await supabase
                                    .from('image_votes')
                                    .select('vote_type')
                                    .eq('review_id', review.id)
                                    .eq('user_id', user.id)
                                    .single()

                                  let newHelpfulCount = review.helpful_count || 0
                                  let newNotHelpfulCount = review.not_helpful_count || 0

                                  if (existingVote) {
                                    if (existingVote.vote_type === 'like') {
                                      // Already liked, remove like
                                      newHelpfulCount -= 1
                                      await supabase
                                        .from('image_votes')
                                        .delete()
                                        .eq('review_id', review.id)
                                        .eq('user_id', user.id)
                                    } else {
                                      // Was disliked, change to like
                                      newHelpfulCount += 1
                                      newNotHelpfulCount -= 1
                                      await supabase
                                        .from('image_votes')
                                        .update({ vote_type: 'like', updated_at: new Date().toISOString() })
                                        .eq('review_id', review.id)
                                        .eq('user_id', user.id)
                                    }
                                  } else {
                                    // New like
                                    newHelpfulCount += 1
                                    await supabase
                                      .from('image_votes')
                                      .insert({
                                        review_id: review.id,
                                        image_url: '',
                                        user_id: user.id,
                                        vote_type: 'like'
                                      })
                                  }

                                  // Update review counts
                                  await supabase
                                    .from('neighborhood_reviews')
                                    .update({
                                      helpful_count: newHelpfulCount,
                                      not_helpful_count: newNotHelpfulCount
                                    })
                                    .eq('id', review.id)

                                  // Refresh reviews
                                  fetchNeighborhood(params.id as string)
                                } catch (error) {
                                  console.error('Error voting:', error)
                                }
                              }}
                              className="group/vote flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-all hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-100 hover:border-green-200 relative overflow-hidden"
                            >
                              {/* Animated background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover/vote:opacity-10 transition-opacity duration-300"></div>
                              <ThumbsUp className="w-5 h-5 relative z-10 transform group-hover/vote:scale-110 transition-transform" />
                              <span className="text-sm relative z-10">Helpful ({review.helpful_count || 0})</span>
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const { data: { user } } = await supabase.auth.getUser()
                                  if (!user) {
                                    alert('Please login to vote')
                                    return
                                  }

                                  const { data: existingVote } = await supabase
                                    .from('image_votes')
                                    .select('vote_type')
                                    .eq('review_id', review.id)
                                    .eq('user_id', user.id)
                                    .single()

                                  let newHelpfulCount = review.helpful_count || 0
                                  let newNotHelpfulCount = review.not_helpful_count || 0

                                  if (existingVote) {
                                    if (existingVote.vote_type === 'dislike') {
                                      newNotHelpfulCount -= 1
                                      await supabase
                                        .from('image_votes')
                                        .delete()
                                        .eq('review_id', review.id)
                                        .eq('user_id', user.id)
                                    } else {
                                      newNotHelpfulCount += 1
                                      newHelpfulCount -= 1
                                      await supabase
                                        .from('image_votes')
                                        .update({ vote_type: 'dislike', updated_at: new Date().toISOString() })
                                        .eq('review_id', review.id)
                                        .eq('user_id', user.id)
                                    }
                                  } else {
                                    newNotHelpfulCount += 1
                                    await supabase
                                      .from('image_votes')
                                      .insert({
                                        review_id: review.id,
                                        image_url: '',
                                        user_id: user.id,
                                        vote_type: 'dislike'
                                      })
                                  }

                                  await supabase
                                    .from('neighborhood_reviews')
                                    .update({
                                      helpful_count: newHelpfulCount,
                                      not_helpful_count: newNotHelpfulCount
                                    })
                                    .eq('id', review.id)

                                  fetchNeighborhood(params.id as string)
                                } catch (error) {
                                  console.error('Error voting:', error)
                                }
                              }}
                              className="group/vote group/vote2 flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-all hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-100 hover:border-red-200 relative overflow-hidden"
                            >
                              {/* Animated background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-500 opacity-0 group-hover/vote2:opacity-10 transition-opacity duration-300"></div>
                              <ThumbsDown className="w-5 h-5 relative z-10 transform group-hover/vote2:scale-110 transition-transform" />
                              <span className="text-sm relative z-10">Not helpful ({review.not_helpful_count || 0})</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                            </div>
                          </div>
                        )}
            </div>

            {/* Right Sidebar - Neighborhood Info */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Neighborhood Card */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 shadow-xl text-white">
                  <h2 className="text-2xl font-bold mb-2">{neighborhood.name}</h2>
                  <p className="text-blue-100 mb-6">{neighborhood.city}, {neighborhood.province}</p>
                  
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-blue-400/30">
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        <span className="text-4xl font-bold">
                          {(neighborhood.overall_rating || neighborhood.average_rating) > 0 
                            ? (neighborhood.overall_rating || neighborhood.average_rating || 0).toFixed(1) 
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm text-blue-100">{neighborhood.total_reviews || 0} Reviews</div>
                    </div>
                        </div>

                  {/* Photos Gallery */}
                  {allImages.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-blue-100 mb-3 font-semibold">Community Photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {allImages.slice(0, 6).map((img, idx) => (
                          <img
                            key={idx}
                                  src={img}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-white/30"
                                  onClick={() => {
                              setSelectedImageIndex(idx)
                                      setShowImageGallery(true)
                                  }}
                                />
                              ))}
                            </div>
                      {allImages.length > 6 && (
                        <button
                          onClick={() => {
                            setSelectedImageIndex(0)
                            setShowImageGallery(true)
                          }}
                          className="mt-2 text-xs text-white/80 hover:text-white text-center w-full"
                        >
                          View all {allImages.length} photos
                        </button>
                      )}
                          </div>
                        )}

                  {/* Category Ratings */}
                  {reviews.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-blue-100 mb-3 font-semibold">Category Ratings</p>
                      <div className="space-y-3">
                        {[
                          { label: 'Safety', avg: neighborhood.safety_rating || reviews.reduce((sum, r) => sum + (r.safety || 0), 0) / reviews.length },
                          { label: 'Noise', avg: neighborhood.noise_rating || reviews.reduce((sum, r) => sum + (r.noise || 0), 0) / reviews.length },
                          { label: 'Transit', avg: neighborhood.transit_rating || reviews.reduce((sum, r) => sum + (r.transit || 0), 0) / reviews.length },
                          { label: 'Amenities', avg: neighborhood.amenities_rating || reviews.reduce((sum, r) => sum + (r.amenities || 0), 0) / reviews.length },
                          { label: 'Community', avg: neighborhood.community_rating || reviews.reduce((sum, r) => sum + (r.community || 0), 0) / reviews.length },
                        ].map((cat) => {
                          const percentage = (cat.avg / 5) * 100
                          return (
                            <div key={cat.label} className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-blue-100">{cat.label}</span>
                                <span className="text-xs font-bold text-white">{cat.avg.toFixed(1)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percentage >= 80 ? 'bg-green-400' :
                                    percentage >= 60 ? 'bg-blue-400' :
                                    percentage >= 40 ? 'bg-yellow-400' :
                                    'bg-red-400'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

                  {/* Rate Button */}
                  <Link
                    href={`/rate/neighborhood?prefill=${encodeURIComponent(JSON.stringify({
                      name: neighborhood.name,
                      city: neighborhood.city,
                      province: neighborhood.province,
                      latitude: neighborhood.latitude,
                      longitude: neighborhood.longitude
                    }))}`}
                    className="block w-full bg-white text-blue-600 py-3 rounded-xl hover:bg-blue-50 transition-all font-bold text-center shadow-lg"
                  >
                    Rate This Neighborhood
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery Modal */}
        {showImageGallery && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowImageGallery(false)}>
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-all z-20 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowImageGallery(false)
              }}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="max-w-6xl w-full relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={allImages[selectedImageIndex]}
                alt={`Photo ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              
              {/* Navigation Controls */}
              {allImages.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full transition-all shadow-lg z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full transition-all shadow-lg z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium">
                    {selectedImageIndex + 1} / {allImages.length}
            </div>

                  {/* Thumbnail Strip */}
                  {allImages.length <= 10 && (
                    <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto px-4">
                      {allImages.map((img, idx) => (
            <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImageIndex(idx)
                          }}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === selectedImageIndex
                              ? 'border-white scale-110 shadow-lg'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
