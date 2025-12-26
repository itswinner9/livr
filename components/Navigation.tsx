'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Star, Compass, User, LogOut, MapPin, Building2, Menu, X, PlusCircle, Shield, UserCheck, Building, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import NotificationBell from './NotificationBell'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showRateDropdown, setShowRateDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      // Check if admin
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle()
        
        console.log('Nav admin check:', { profile, error, email: session.user.email })
        setIsAdmin(profile?.is_admin === true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle()
        
        console.log('Nav auth change admin check:', { profile, error })
        setIsAdmin(profile?.is_admin === true)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowMobileMenu(false)
    router.push('/')
  }

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/blog', label: 'Blog', icon: BookOpen },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-white/98 to-white/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative border-b border-gray-100/60">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo with 3D Effect */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group relative">
            {/* Pulse glow effect */}
            <div className="absolute -left-4 -top-4 w-20 h-20 bg-gradient-to-br from-primary-400 to-orange-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse"></div>
            
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-primary-500/50 group-hover:shadow-xl">
              <Star className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-white group-hover:animate-sparkle" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl sm:rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl sm:rounded-3xl pointer-events-none"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Liv<span className="bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">Rank</span>
              </span>
              <span className="text-xs text-gray-500 hidden lg:block font-medium">Real Reviews, Real Tenants</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group-nav flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 relative whitespace-nowrap ${
                    isActive
                      ? 'text-primary-700 bg-gradient-to-r from-primary-50 to-orange-50 shadow-sm'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-50/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-primary-700' : 'group-nav-hover:scale-110 group-nav-hover:rotate-3'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary-600 to-orange-600 rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Rate Dropdown with 3D */}
                <div className="relative">
                  <button
                    onClick={() => setShowRateDropdown(!showRateDropdown)}
                    onBlur={() => setTimeout(() => setShowRateDropdown(false), 200)}
                    className="group relative bg-gradient-to-r from-primary-600 via-primary-700 to-orange-600 text-white px-7 py-3 rounded-full font-black hover:from-primary-700 hover:via-primary-800 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center space-x-2 text-sm border-2 border-white/20"
                  >
                    <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Rate Now</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-orange-400 rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-opacity -z-10"></div>
                  </button>
                  
                  {showRateDropdown && (
                    <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-gray-100 py-3 z-50 animate-fade-in-up">
                      <Link
                        href="/rate/neighborhood"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 transition-colors"
                        onClick={() => setShowRateDropdown(false)}
                      >
                        <MapPin className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Rate a Neighborhood</p>
                          <p className="text-xs text-gray-500">Share your experience</p>
                        </div>
                      </Link>
                      <Link
                        href="/rate/building"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 transition-colors"
                        onClick={() => setShowRateDropdown(false)}
                      >
                        <Building2 className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Rate a Building</p>
                          <p className="text-xs text-gray-500">Review your apartment</p>
                        </div>
                      </Link>
                      <Link
                        href="/rate/landlord"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 transition-colors"
                        onClick={() => setShowRateDropdown(false)}
                      >
                        <UserCheck className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Rate a Landlord</p>
                          <p className="text-xs text-gray-500">Review your landlord</p>
                        </div>
                      </Link>
                      <Link
                        href="/rate/rent-company"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 transition-colors"
                        onClick={() => setShowRateDropdown(false)}
                      >
                        <Building className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Rate a Rent Company</p>
                          <p className="text-xs text-gray-500">Review rent companies</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    onBlur={() => setTimeout(() => setShowProfileDropdown(false), 200)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-sm">Account</span>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <User className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-900">My Profile</p>
                          <p className="text-xs text-gray-500">View your reviews</p>
                        </div>
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 transition-colors bg-primary-50/50"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <Shield className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-semibold text-primary-900">Admin Panel</p>
                            <p className="text-xs text-primary-600">Manage site</p>
                          </div>
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          handleSignOut()
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold rounded-full hover:bg-gray-50 transition-all text-sm"
                >
                  Login
                </Link>
                <Link href="/signup" className="bg-primary-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary-600 transition-all duration-200 hover:shadow-lg text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Touch Friendly */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu - Enhanced for Touch */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <Link
              href="/"
              className={`flex items-center space-x-3 px-5 py-4 rounded-xl text-base font-semibold touch-manipulation ${
                pathname === '/' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 active:bg-gray-100'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              <span>Home</span>
            </Link>

            <Link
              href="/explore"
              className={`flex items-center space-x-3 px-5 py-4 rounded-xl text-base font-semibold touch-manipulation ${
                pathname === '/explore' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 active:bg-gray-100'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <Compass className="w-5 h-5 flex-shrink-0" />
              <span>Explore</span>
            </Link>

            <Link
              href="/blog"
              className={`flex items-center space-x-3 px-5 py-4 rounded-xl text-base font-semibold touch-manipulation ${
                pathname === '/blog' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 active:bg-gray-100'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              <span>Blog</span>
            </Link>

            {user && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <Link
                  href="/profile"
                  className={`flex items-center space-x-3 px-5 py-4 rounded-xl text-base font-semibold touch-manipulation ${
                    pathname === '/profile' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 active:bg-gray-100'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span>My Reviews</span>
                </Link>

                <div className="px-5 py-3">
                  <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">Rate Now</p>
                  <div className="space-y-2">
                    <Link
                      href="/rate/neighborhood"
                      className="flex items-center space-x-3 px-5 py-4 bg-primary-50 rounded-xl text-primary-700 font-semibold active:bg-primary-100 touch-manipulation"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <span>Rate a Neighborhood</span>
                    </Link>
                    <Link
                      href="/rate/building"
                      className="flex items-center space-x-3 px-5 py-4 bg-primary-50 rounded-xl text-primary-700 font-semibold active:bg-primary-100 touch-manipulation"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Building2 className="w-5 h-5 flex-shrink-0" />
                      <span>Rate a Building</span>
                    </Link>
                    <Link
                      href="/rate/landlord"
                      className="flex items-center space-x-3 px-5 py-4 bg-primary-50 rounded-xl text-primary-700 font-semibold active:bg-primary-100 touch-manipulation"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <UserCheck className="w-5 h-5 flex-shrink-0" />
                      <span>Rate a Landlord</span>
                    </Link>
                    <Link
                      href="/rate/rent-company"
                      className="flex items-center space-x-3 px-5 py-4 bg-primary-50 rounded-xl text-primary-700 font-semibold active:bg-primary-100 touch-manipulation"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Building className="w-5 h-5 flex-shrink-0" />
                      <span>Rate a Rent Company</span>
                    </Link>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-5 py-4 text-red-600 active:bg-red-50 rounded-xl w-full text-base font-semibold touch-manipulation"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </>
            )}

            {!user && (
              <div className="px-5 py-3 space-y-3 border-t border-gray-200 mt-2">
                <Link
                  href="/login"
                  className="block text-center px-5 py-4 text-gray-700 active:bg-gray-100 rounded-xl font-semibold text-base touch-manipulation"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block text-center px-5 py-4 bg-gradient-to-r from-primary-600 to-orange-600 text-white rounded-xl font-bold text-base active:opacity-90 touch-manipulation shadow-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
