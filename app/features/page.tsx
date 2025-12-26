'use client'

import { Search, MapPin, Building2, UserCheck, Building, Shield, Zap, Star, MessageCircle, Camera, TrendingUp, Globe, Lock, Bell, Filter } from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
  const features = [
    { icon: Search, title: 'Advanced Search', desc: 'Smart filters for location, ratings, and more', color: 'from-blue-600 to-blue-700' },
    { icon: MapPin, title: 'Interactive Maps', desc: 'Visualize locations with detailed information', color: 'from-green-600 to-green-700' },
    { icon: Filter, title: 'Smart Filters', desc: 'Narrow down by safety, walkability, amenities', color: 'from-purple-600 to-purple-700' },
    { icon: Building2, title: 'Rate Buildings', desc: 'Review management, amenities, maintenance', color: 'from-orange-600 to-orange-700' },
    { icon: UserCheck, title: 'Rate Landlords', desc: 'Evaluate responsiveness and professionalism', color: 'from-primary-600 to-primary-700' },
    { icon: Shield, title: 'Verified Reviews', desc: 'All reviews verified for authenticity', color: 'from-red-600 to-red-700' },
  ]

  const ratingTypes = [
    { icon: MapPin, title: 'Neighborhoods', desc: 'Safety, walkability, transit, community', link: '/rate/neighborhood' },
    { icon: Building2, title: 'Buildings', desc: 'Management, cleanliness, amenities', link: '/rate/building' },
    { icon: UserCheck, title: 'Landlords', desc: 'Responsiveness, fairness, professionalism', link: '/rate/landlord' },
    { icon: Building, title: 'Companies', desc: 'Service quality and reliability', link: '/rate/rent-company' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-orange-600 text-white py-24">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white opacity-10 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-white opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-6">Powerful Features</h1>
          <p className="text-2xl text-white/90 leading-relaxed">
            Everything you need to make informed housing decisions
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
            </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What You Can Rate */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-black text-gray-900 text-center mb-16">What You Can Rate</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ratingTypes.map((type, index) => {
              const Icon = type.icon
              return (
                <Link key={index} href={type.link} className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-orange-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">{type.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{type.desc}</p>
                  <div className="text-primary-600 font-bold group-hover:text-primary-700 inline-flex items-center gap-2">
                    Rate Now
                    <Zap className="w-4 h-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-10">Join thousands making better decisions</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105 inline-flex items-center gap-2">
              Sign Up Free
              <Zap className="w-5 h-5" />
            </Link>
            <Link href="/explore" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all inline-flex items-center gap-2">
              Explore
              <Star className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
