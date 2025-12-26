'use client'

import Link from 'next/link'
import { Star, MapPin, Building2, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'


interface RatingCardProps {
  rating: any
  type: 'neighborhood' | 'building'
  viewMode?: 'grid' | 'list'
}

export default function RatingCard({ rating, type, viewMode = 'grid' }: RatingCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [firstReviewImage, setFirstReviewImage] = useState<string | null>(null)
  
  // Get image from rating (simple structure)
  useEffect(() => {
    if (rating.images && Array.isArray(rating.images) && rating.images.length > 0) {
      setFirstReviewImage(rating.images[0])
    }
  }, [rating])
  
  // Priority: cover_image (admin set) > review image (user uploaded) - NO stock images
  const displayImage = rating.cover_image 
    ? rating.cover_image 
    : (firstReviewImage && !imageError) 
      ? firstReviewImage 
      : null
  
  const hasImage = displayImage !== null
  
  const Icon = type === 'neighborhood' ? MapPin : Building2
  // Use slug for SEO-friendly URLs, fallback to ID
  const linkHref = type === 'neighborhood' 
    ? `/neighborhood/${rating.slug || rating.id}` 
    : `/building/${rating.slug || rating.id}`

  const hasRating = (rating.overall_rating || rating.average_rating) && (rating.overall_rating || rating.average_rating) > 0
  const reviewCount = rating.total_reviews || 0
  const ratingValue = rating.overall_rating || rating.average_rating || 0

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Link href={linkHref} className="block h-full group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="h-full"
      >
        <div className="relative bg-white rounded-2xl border-2 border-gray-200 group-hover:border-primary-400 group-hover:shadow-2xl transition-all duration-300 h-full flex flex-col shadow-lg overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-500/5 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300">
          {/* Image Section with Gradient Overlay */}
          <div className="relative h-52 sm:h-56 md:h-60 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group-hover:brightness-105 transition-all duration-300">
            {hasImage ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-8 h-8 border-3 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                )}
                <motion.img 
                  src={displayImage}
                  alt={rating.name} 
                  className="w-full h-full object-cover"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true)
                    setImageLoaded(true)
                  }}
                />
                
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                {/* Rating Badge with Enhanced Design */}
                {hasRating && (
                  <motion.div 
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-xl flex items-center space-x-2 border-2 border-yellow-200 group-hover:border-yellow-300 group-hover:shadow-2xl group-hover:shadow-yellow-500/20 transition-all duration-300"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                    <span className={`text-sm font-bold ${getRatingColor(ratingValue)}`}>
                      {ratingValue.toFixed(1)}
                    </span>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Icon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {rating.name}
            </h3>
            
            <div className="flex items-center text-gray-600 text-xs mb-3">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              <span className="line-clamp-1">{rating.city}, {rating.province}</span>
            </div>

            {/* Footer with Better Visuals */}
            <div className="mt-auto pt-3 border-t-2 border-gray-100 group-hover:border-primary-100 transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasRating ? (
                  <div className="flex group/star">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.div
                        key={star}
                        whileHover={{ scale: 1.3, rotate: 15 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-all ${
                            star <= Math.round(ratingValue)
                              ? 'text-yellow-400 fill-yellow-400 group-hover/star:shadow-lg group-hover/star:shadow-yellow-400/50'
                              : 'text-gray-300'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">No rating yet</span>
                )}
              </div>
              {reviewCount > 0 && (
                <motion.span 
                  whileHover={{ scale: 1.1 }}
                  className="text-xs font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1 rounded-full border border-gray-200 group-hover:border-primary-200 group-hover:bg-primary-50 transition-all"
                >
                  {reviewCount}
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

