'use client'

import { Heart, Shield, TrendingUp, Globe, Zap, CheckCircle, Users, Star, Award } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const values = [
    { icon: Heart, title: 'Community First', desc: 'Empowering renters with honest, transparent information' },
    { icon: Shield, title: 'Trust & Safety', desc: 'Verified reviews to ensure authenticity' },
    { icon: TrendingUp, title: 'Continuous Growth', desc: 'Constantly improving based on feedback' },
    { icon: Globe, title: 'Always Free', desc: 'Free for everyone, accessible everywhere' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-orange-600 text-white py-24">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full opacity-10 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-white rounded-full opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-6">
            About <span className="bg-gradient-to-r from-orange-200 to-white bg-clip-text text-transparent">LivRank</span>
          </h1>
          <p className="text-2xl text-white/90 leading-relaxed">
            Revolutionizing how renters find housing. Built by renters, for renters.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h2 className="text-5xl font-black text-gray-900">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              LivRank was born from frustration. After spending weeks searching for apartments only to discover hidden problems, 
              we created a platform where renters could share honest experiences. Today, we're helping thousands of renters 
              make informed housing decisions across Canada.
            </p>
            <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-3xl p-12 border-2 border-primary-200">
              <div className="text-5xl font-black text-primary-600 mb-4">Empower Every Renter</div>
              <p className="text-xl text-gray-700">
                With transparent, honest, and actionable information about housing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-gray-900 text-center mb-16">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-orange-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black mb-6">Join the Community</h2>
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Help renters make better housing decisions
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105 inline-flex items-center gap-2">
              Get Started
              <Zap className="w-5 h-5" />
            </Link>
            <Link href="/explore" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all inline-flex items-center gap-2">
              Explore
              <CheckCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
