'use client'

import { Shield, Lock, Users, CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function Privacy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-orange-600 text-white py-24">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white opacity-10 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-white opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6">Privacy Policy</h1>
          <p className="text-2xl text-white/90 leading-relaxed mb-4">
            Your privacy and data security are our top priorities
          </p>
          <p className="text-white/80">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Secure Data</h3>
              <p className="text-gray-600">All data encrypted and securely stored</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No Data Selling</h3>
              <p className="text-gray-600">We never sell your information</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Your Control</h3>
              <p className="text-gray-600">Delete or modify data anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* What We Collect */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">Information We Collect</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Account Information</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Email address and username for account creation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Profile information you choose to provide</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Location data when you share reviews</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Review Content</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Reviews, ratings, and comments you post</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Photos uploaded with reviews</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">How We Use Your Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border-2 border-blue-200">
                <h3 className="text-xl font-black text-gray-900 mb-4">Platform Services</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Provide and maintain our review platform</li>
                  <li>• Process and display your reviews</li>
                  <li>• Enable search and discovery</li>
                  <li>• Moderate content for quality</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border-2 border-green-200">
                <h3 className="text-xl font-black text-gray-900 mb-4">User Experience</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Personalize your experience</li>
                  <li>• Send relevant notifications</li>
                  <li>• Improve our services</li>
                  <li>• Provide customer support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">Data Sharing</h2>
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-8 border-2 border-yellow-200">
              <h3 className="text-2xl font-black text-gray-900 mb-4">We DO NOT sell your data</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                We never sell, rent, or trade your personal information to third parties for marketing purposes. 
                We only share data with trusted service providers who help us operate the platform under strict 
                confidentiality agreements.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">Your Rights</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-4">Access & Control</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Request a copy of your data</li>
                  <li>• Edit or delete your reviews</li>
                  <li>• Update your profile anytime</li>
                  <li>• Delete your account</li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-4">Privacy Settings</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Control profile visibility</li>
                  <li>• Manage email preferences</li>
                  <li>• Opt out of notifications</li>
                  <li>• Report data issues</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">Data Security</h2>
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border-2 border-green-200">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Encryption in transit and at rest</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Regular security audits</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Access controls and monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl p-12 border-2 border-primary-200 text-center">
            <Mail className="w-16 h-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-gray-900 mb-4">Questions?</h2>
            <p className="text-lg text-gray-600 mb-8">Contact us about privacy</p>
            <Link href="mailto:privacy@livrank.ca" className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-primary-700 transition-all shadow-xl transform hover:scale-105 inline-flex items-center gap-2">
              Contact Privacy Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
