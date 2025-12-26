'use client'

import Link from 'next/link'
import { Star, MapPin, Building2, Users, Bed, Bath, Square, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
// import { motion } from 'framer-motion' - temporarily disabled
import { supabase } from '@/lib/supabase'


interface PropertyCardProps {
  property: any
  type: 'neighborhood' | 'building' | 'landlord' | 'rent-company'
}

export default function PropertyCard({ property, type }: PropertyCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Priority: cover_image/profile_image > first review image (NO stock images)
  const getDisplayImage = () => {
    // For landlords, check profile_image first
    if (type === 'landlord' && property.profile_image) {
      return property.profile_image
    }
    
    // For other types, check cover_image (admin set)
    if (property.cover_image) {
      return property.cover_image
    }
    
    // Check for images from reviews (user uploaded)
    if (property.images && property.images[0] && !imageError) {
      return property.images[0]
    }
    
    // Return null if no image - will show placeholder
    return null
  }
  
  const displayImage = getDisplayImage()
  const hasImage = displayImage !== null
  
  // Use slug for SEO-friendly URLs, fallback to ID
  const linkHref = `/${type}/${property.slug || property.id}`
  
  const hasRating = (property.overall_rating || property.average_rating) && (property.overall_rating || property.average_rating) > 0
  const reviewCount = property.total_reviews || 0
  const ratingValue = property.overall_rating || property.average_rating || 0

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'neighborhood': return 'bg-blue-100 text-blue-700'
      case 'building': return 'bg-green-100 text-green-700'
      case 'landlord': return 'bg-purple-100 text-purple-700'
      case 'rent-company': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatPrice = (price: number) => {
    if (!price) return null
    return `$${price.toLocaleString()}`
  }

  return (
    <Link href={linkHref} className="block h-full group">
      <div className="h-full property-card">
        <div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden group-hover:border-primary-400 group-hover:-translate-y-1 group-hover:scale-[1.01]">
          
          {/* Image Section - Mobile Optimized */}
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden h-48 sm:h-56 md:h-64 rounded-t-3xl">
            {hasImage ? (
              <div className="relative w-full h-full overflow-hidden rounded-t-3xl">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
                    <div className="w-8 h-8 border-3 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                )}
                <img 
                  src={displayImage}
                  alt={property.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ borderRadius: 'inherit' }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true)
                    setImageLoaded(true)
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  {type === 'neighborhood' && <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-2" />}
                  {type === 'building' && <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-2" />}
                  {type === 'landlord' && <Users className="w-16 h-16 text-gray-400 mx-auto mb-2" />}
                  {type === 'rent-company' && <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-2" />}
                  <p className="text-xs text-gray-500 font-medium">No image available</p>
                </div>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-3xl pointer-events-none"></div>
            
            {/* Type Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg ${getTypeColor(type)}`}>
              {type === 'rent-company' ? 'Company' : type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
            
            {/* Rating Badge */}
            {hasRating && (
              <div 
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg flex items-center space-x-1 transition-transform duration-200 hover:scale-110"
              >
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className={`text-sm font-bold ${getRatingColor(ratingValue)}`}>
                  {ratingValue.toFixed(1)}
                </span>
              </div>
            )}
            
            {/* Photo Count */}
            {property.images && property.images.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1 font-semibold">
                <Camera className="w-3 h-3" />
                <span>{property.images.length}</span>
              </div>
            )}
          </div>

          {/* Content - Mobile Optimized */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            {/* Price (if available) */}
            {property.price && (
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(property.price)}
                <span className="text-xs sm:text-sm font-normal text-gray-500">/month</span>
              </div>
            )}
            
            <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {property.name}
            </h3>
            
            <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-primary-500 flex-shrink-0" />
              <span className="line-clamp-1">{property.city}, {property.province}</span>
            </div>

            {/* Property Details (if building) */}
            {type === 'building' && (property.bedrooms || property.bathrooms || property.square_feet) && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                {property.bedrooms && (
                  <div className="flex items-center space-x-1">
                    <Bed className="w-4 h-4" />
                    <span>{property.bedrooms} bed</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center space-x-1">
                    <Bath className="w-4 h-4" />
                    <span>{property.bathrooms} bath</span>
                  </div>
                )}
                {property.square_feet && (
                  <div className="flex items-center space-x-1">
                    <Square className="w-4 h-4" />
                    <span>{property.square_feet} sqft</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {property.description}
              </p>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasRating ? (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(ratingValue)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 font-medium">No rating yet</span>
                )}
              </div>
              {reviewCount > 0 && (
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
