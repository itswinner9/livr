'use client'

import { FileText, Shield, Users, CheckCircle, Ban, Mail } from 'lucide-react'
import Link from 'next/link'

export default function Terms() {
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
            <FileText className="w-10 h-10" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6">Terms of Service</h1>
          <p className="text-2xl text-white/90 leading-relaxed mb-4">
            The rules and guidelines for using our platform
          </p>
          <p className="text-white/80">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Honest Reviews</h3>
              <p className="text-gray-600">All reviews must be truthful and based on real experiences</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Respectful Community</h3>
              <p className="text-gray-600">Treat all users with respect and courtesy</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Platform Safety</h3>
              <p className="text-gray-600">Help us maintain a safe and helpful platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Acceptance */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">1. Acceptance of Terms</h2>
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border-2 border-blue-200">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                By accessing or using LivRank ("the Platform"), you agree to be bound by these Terms of Service.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You must be at least 18 years old to use our services</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>These terms apply to all users of the platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You are responsible for complying with local laws</span>
                </li>
              </ul>
            </div>
          </div>

          {/* User Accounts */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">2. User Accounts</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Provide accurate and complete information during registration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Maintain the security of your account credentials</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Notify us immediately of any unauthorized access</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You are responsible for all activity under your account</span>
                </li>
              </ul>
            </div>
          </div>

          {/* User Conduct */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">3. User Conduct</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                All reviews must be honest, respectful, and helpful to other users.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">You May:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Share genuine experiences and honest opinions</li>
                    <li>• Post photos of properties and conditions</li>
                    <li>• Engage respectfully with other users</li>
                    <li>• Report inappropriate content</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">You May Not:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Post fake, defamatory, or misleading reviews</li>
                    <li>• Harass, threaten, or intimidate other users</li>
                    <li>• Post personal information about others</li>
                    <li>• Violate any applicable laws or regulations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Content Moderation */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">4. Content Moderation</h2>
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-8 border-2 border-yellow-200">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We reserve the right to review, edit, or remove any content that violates these terms.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span>All content is subject to moderation for quality and safety</span>
                </li>
                <li className="flex items-start gap-3">
                  <Ban className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Violations may result in warnings, suspension, or permanent ban</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You retain ownership of your content and grant us license to use it</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimers */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">5. Disclaimers</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>The platform is provided "as is" without warranties of any kind</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>We do not guarantee the accuracy of user-submitted reviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Use the platform at your own risk</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">6. Limitation of Liability</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <p className="text-lg text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, LivRank shall not be liable for any indirect, 
                incidental, or consequential damages arising from your use of the platform.
              </p>
            </div>
          </div>

          {/* Changes to Terms */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-8">7. Changes to Terms</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <p className="text-lg text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We'll notify users of significant 
                changes via email or platform notifications. Continued use after changes indicates acceptance 
                of the updated terms.
              </p>
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
            <p className="text-lg text-gray-600 mb-8">Contact us about our terms</p>
            <Link href="mailto:legal@livrank.ca" className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-primary-700 transition-all shadow-xl transform hover:scale-105 inline-flex items-center gap-2">
              Contact Legal Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
