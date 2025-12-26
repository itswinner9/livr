'use client'

import { Star, Heart } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-2">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-2xl sm:text-3xl font-black">LivRank</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-base sm:text-lg mb-4 sm:mb-6">
              Helping renters make better housing decisions through honest, verified reviews.
            </p>
            <div className="flex items-center gap-2 text-primary-400">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span className="text-xs sm:text-sm font-bold">Made with love in Vancouver</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  Explore
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6">Legal</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-primary-400 active:text-primary-300 transition-colors font-semibold text-sm sm:text-base touch-manipulation inline-block py-1">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left">
            <div className="text-gray-400 font-bold text-sm sm:text-base">
              &copy; {currentYear} LivRank Inc. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
