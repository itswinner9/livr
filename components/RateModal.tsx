'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Building2, Building, Shield, Users, Star, Sparkles, UserCheck, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface RateModalProps {
  onClose: () => void
}

export default function RateModal({ onClose }: RateModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })
  }, [])

  const handleChoice = (type: 'neighborhood' | 'building' | 'landlord' | 'rent-company') => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push(`/login?redirect=/rate/${type}`)
      } else {
        router.push(`/rate/${type}`)
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full animate-scale-in overflow-hidden border border-gray-100">
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">What would you like to rate?</h2>
              <p className="text-xs text-white/90">Share your experience and help others</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Neighborhood Option */}
            <button
              onClick={() => handleChoice('neighborhood')}
              className="group relative bg-white rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 hover:border-blue-500 overflow-hidden"
            >
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1">Neighborhood</h3>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">Safety, cleanliness & transit</p>
                
                <div className="text-blue-600 font-semibold text-xs group-hover:text-blue-700 flex items-center">
                  <span>Rate Now</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>

            {/* Building Option */}
            <button
              onClick={() => handleChoice('building')}
              className="group relative bg-white rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 hover:border-green-500 overflow-hidden"
            >
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1">Building</h3>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">Management, maintenance & value</p>
                
                <div className="text-green-600 font-semibold text-xs group-hover:text-green-700 flex items-center">
                  <span>Rate Now</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>

            {/* Landlord Option */}
            <button
              onClick={() => handleChoice('landlord')}
              className="group relative bg-white rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 hover:border-purple-500 overflow-hidden"
            >
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1">Landlord</h3>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">Responsiveness & communication</p>
                
                <div className="text-purple-600 font-semibold text-xs group-hover:text-purple-700 flex items-center">
                  <span>Rate Now</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>

            {/* Rent Company Option */}
            <button
              onClick={() => handleChoice('rent-company')}
              className="group relative bg-white rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 hover:border-orange-500 overflow-hidden"
            >
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md mb-3 group-hover:scale-105 transition-transform">
                  <Building className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1">Rent Company</h3>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">Service quality & reliability</p>
                
                <div className="text-orange-600 font-semibold text-xs group-hover:text-orange-700 flex items-center">
                  <span>Rate Now</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

