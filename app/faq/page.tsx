'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, MessageCircle, Star, Shield, User } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      category: 'reviews',
      question: 'How do I submit a review?',
      answer: 'Click "Rate Now" in the navigation, choose what you want to rate, fill out the form, add photos if you have them, and submit. Your review will be live immediately if rated 3+ stars.'
    },
    {
      category: 'account',
      question: 'Is LivRank free to use?',
      answer: 'Absolutely! LivRank is 100% free with no hidden fees, subscriptions, or premium tiers. You can search, read, and write reviews completely free.'
    },
    {
      category: 'reviews',
      question: 'Can I edit or delete my review?',
      answer: 'Yes! You can edit or delete your reviews from your profile page at any time. Update ratings, change comments, or add new photos whenever you need.'
    },
    {
      category: 'account',
      question: 'Do I need an account?',
      answer: 'You can browse reviews without an account. Create a free account to submit reviews, save favorites, and receive notifications.'
    },
    {
      category: 'reviews',
      question: 'What can I review?',
      answer: 'You can review: Neighborhoods (safety, walkability, community), Buildings (management, amenities, maintenance), Landlords (responsiveness, professionalism), and Companies (service quality).'
    },
    {
      category: 'safety',
      question: 'How do you verify reviews?',
      answer: 'We use email verification, admin moderation for low-rated reviews, automated spam detection, and IP tracking to ensure authenticity.'
    },
    {
      category: 'account',
      question: 'Can I review anonymously?',
      answer: 'Yes! You can choose to post anonymously or with a display name. Your choice is respected and you can change it anytime from your profile.'
    },
    {
      category: 'reviews',
      question: 'Can I upload photos?',
      answer: 'Yes! You can upload up to 5 photos per review. Photos help other renters see actual conditions and make your review more credible.'
    },
    {
      category: 'safety',
      question: 'What happens if someone reports a review?',
      answer: 'All reported reviews are reviewed by our admin team within 24 hours. If a review violates our guidelines, it will be removed.'
    },
    {
      category: 'reviews',
      question: 'Why are some reviews pending?',
      answer: 'Reviews with 2 stars or less are automatically sent for admin review to prevent spam. Reviews with 3+ stars are approved immediately.'
    }
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
          <h1 className="text-6xl md:text-7xl font-black mb-6">FAQ</h1>
          <p className="text-2xl text-white/90 leading-relaxed">
            Everything you need to know about LivRank
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xl font-black text-gray-900 pr-8">{faq.question}</h3>
                  <ChevronDown className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''}`} />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <p className="text-lg text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-5xl font-black mb-6">Still Have Questions?</h2>
          <p className="text-xl text-white/90 mb-10">Our team is here to help</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105 inline-flex items-center gap-2">
              Contact Us
            </Link>
            <Link href="/explore" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all inline-flex items-center gap-2">
              Explore
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
