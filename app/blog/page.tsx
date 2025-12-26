'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Search, ChevronRight, TrendingUp, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { SupabaseSafeError } from '@/lib/supabaseSafe'

interface Blog {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_image: string
  cover_image_alt: string
  author?: {
    full_name?: string
    avatar_url?: string
  } | null
  published_at: string
  views_count: number
  featured: boolean
  categories: Array<{ name: string; slug: string }>
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [featured, setFeatured] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<SupabaseSafeError | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchBlogs(controller)
    return () => controller.abort()
  }, [])

  const fetchBlogs = async (controller?: AbortController) => {
    setLoading(true)
    setError(null)
    setTimedOut(false)

    try {
      const response = await fetch('/api/blogs', {
        signal: controller?.signal,
      })

      if (!response.ok) {
        if (response.status === 504) {
          setTimedOut(true)
        }
        const message = await response.json().catch(() => null)
        setError({
          message: message?.error || 'Failed to load blog posts.',
          status: response.status,
        })
        setFeatured(null)
        setBlogs([])
        return
      }

      const payload = await response.json()
      setFeatured(payload.featured ?? null)
      setBlogs(Array.isArray(payload.blogs) ? payload.blogs : [])
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return
      }
      setError({
        message: err?.message || 'Failed to load blog posts.',
      })
      setFeatured(null)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-gray-200 rounded-2xl w-1/3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error && blogs.length === 0 && !loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white border border-red-200 rounded-3xl p-10 text-center shadow-xl">
            <h1 className="text-3xl font-black text-red-700 mb-4">
              {timedOut ? 'Timed out contacting Supabase.' : 'Error loading blog posts.'}
            </h1>
            <p className="text-red-600 mb-6">
              {error.message || 'Please try again in a moment.'}
            </p>
            <button
              onClick={() => fetchBlogs()}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Search */}
        <div className="mb-16">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base shadow-lg"
            />
          </div>
        </div>

        {/* Blog Grid */}
        <div>
          {filteredBlogs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredBlogs.map((blog) => {
                const resolvedSlug = blog.slug?.trim() ? blog.slug : slugify(blog.title)
                return (
                  <Link key={blog.id} href={`/blog/${resolvedSlug}`} className="group">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-primary-300 transition-all transform hover:-translate-y-2 h-full flex flex-col">
                      <div className="relative h-56 flex-shrink-0">
                        {blog.cover_image ? (
                          <Image
                            src={blog.cover_image}
                            alt={blog.cover_image_alt || blog.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-orange-600"></div>
                        )}
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-3xl font-black text-gray-900 mb-4 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2">
                          {blog.title}
                        </h3>
                        {blog.excerpt && (
                          <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3 flex-1">
                            {blog.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-6">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-black">{formatDate(blog.published_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-black">{blog.views_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-3xl text-gray-600 font-bold">No blog posts found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
