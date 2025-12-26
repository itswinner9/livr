'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Calendar, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Blog {
  id: string
  slug: string
  title: string
  status: string
  featured: boolean
  published_at: string
  views_count: number
  cover_image: string
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBlogs(data || [])
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchBlogs()
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('Failed to delete blog post')
    }
  }

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || blog.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-gray-900 mb-2">Blog Management</h1>
            <p className="text-xl text-gray-600">Manage blog posts and articles</p>
          </div>
          <Link
            href="/admin/blogs/new"
            className="bg-gradient-to-r from-primary-600 to-orange-600 text-white px-6 py-3 rounded-xl font-black hover:shadow-xl transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Blog List */}
        {filteredBlogs.length > 0 ? (
          <div className="space-y-4">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex gap-6">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                    {blog.cover_image ? (
                      <Image
                        src={blog.cover_image}
                        alt={blog.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-orange-600"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-2xl font-black text-gray-900 truncate">{blog.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-black ${
                            blog.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : blog.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {blog.status}
                        </span>
                        {blog.featured && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-black">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-bold">{formatDate(blog.published_at)}</span>
                      </div>
                      <span className="text-sm font-bold">{blog.views_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/blogs/${blog.id}/edit`}
                        className="bg-primary-100 text-primary-700 px-4 py-2 rounded-xl font-black hover:bg-primary-200 transition-colors inline-flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      {blog.status === 'published' && (
                        <Link
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-black hover:bg-blue-200 transition-colors inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black hover:bg-red-200 transition-colors inline-flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-gray-200">
            <p className="text-2xl text-gray-600 font-bold">No blog posts found</p>
          </div>
        )}
      </div>
    </main>
  )
}

