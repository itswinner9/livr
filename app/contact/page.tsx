'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSubmitted(false), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-orange-600 text-white py-24">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white opacity-10 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-white opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-6">Get In Touch</h1>
          <p className="text-2xl text-white/90 leading-relaxed">
            Have questions? We'd love to hear from you
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black text-gray-900 mb-4">Let's Talk</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Whether you have questions or feedback, we're here to help
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 mb-1">Email</h3>
                    <a href="mailto:hello@livrank.ca" className="text-lg text-gray-600 hover:text-blue-600 transition-colors">
                      hello@livrank.ca
                    </a>
                    <p className="text-sm text-gray-500 mt-1">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center text-white">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 mb-1">Phone</h3>
                    <a href="tel:+1800LIVRANK" className="text-lg text-gray-600 hover:text-green-600 transition-colors">
                      1-800-LIV-RANK
                    </a>
                    <p className="text-sm text-gray-500 mt-1">Mon-Fri 9AM-5PM EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center text-white">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 mb-1">Location</h3>
                    <p className="text-lg text-gray-600">Toronto, Canada</p>
                    <p className="text-sm text-gray-500 mt-1">Remote-first team</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-xl">
              <h2 className="text-3xl font-black text-gray-900 mb-8">Send Message</h2>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-green-900 mb-2">Message Sent!</h3>
                  <p className="text-lg text-green-700">We'll get back to you within 24 hours</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-black text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-black text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-black text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="business">Business Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-black text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-orange-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:from-primary-700 hover:to-orange-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/faq" className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:shadow-2xl transition-all">
              <h3 className="text-2xl font-black text-gray-900 mb-3">Visit FAQ</h3>
              <p className="text-gray-600 mb-4">Find answers to common questions</p>
              <div className="text-primary-600 font-black">Browse FAQ →</div>
            </Link>

            <Link href="/explore" className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:shadow-2xl transition-all">
              <h3 className="text-2xl font-black text-gray-900 mb-3">Explore Reviews</h3>
              <p className="text-gray-600 mb-4">See what renters are saying</p>
              <div className="text-primary-600 font-black">Start Exploring →</div>
            </Link>

            <Link href="/signup" className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:shadow-2xl transition-all">
              <h3 className="text-2xl font-black text-gray-900 mb-3">Join LivRank</h3>
              <p className="text-gray-600 mb-4">Start rating and sharing</p>
              <div className="text-primary-600 font-black">Sign Up Free →</div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
