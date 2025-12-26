'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Image as ImageIcon, Type, FileText, Tag, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NewBlogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    excerpt: '',
    content: '',
    cover_image: '',
    cover_image_alt: '',
    status: 'draft',
    featured: false
  })

  const slugify = useMemo(
    () => (value: string) =>
      value
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (name === 'slug') {
      const cleaned = slugify(value)
      setSlugManuallyEdited(cleaned.length > 0)
      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))

    if (name === 'title' && !slugManuallyEdited) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(value)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Generate slug if not provided
      let finalSlug = formData.slug || slugify(formData.title || '')

      // Prepare blog data
      const blogData = {
        ...formData,
        slug: finalSlug,
        author_id: session.user.id,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      }

      // Insert blog
      const { data, error: insertError } = await supabase
        .from('blogs')
        .insert([blogData])
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(`Failed to insert blog: ${insertError.message}`)
      }

      console.log('✅ Blog created successfully:', data)
      
      // Success - redirect to blogs list
      alert('✅ Blog post created successfully!')
      router.push('/admin/blogs')
      
    } catch (err: any) {
      console.error('Error creating blog:', err)
      setError(err.message || 'Failed to create blog post')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6 font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <h1 className="text-6xl font-black text-gray-900 mb-4">New Blog Post</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <p className="text-red-700 font-black text-lg">{error}</p>
            </div>
          )}

          {/* Title & Slug */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg"
                  placeholder="Enter blog post title"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Slug (auto-generated if left empty)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="blog-post-url-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="Short description of the blog post"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8">SEO Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="SEO title (if different from title)"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="SEO description (150-160 characters)"
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Cover Image</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  name="cover_image_alt"
                  value={formData.cover_image_alt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Describe the image for accessibility"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Content</h2>
            
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                Blog Content (HTML) *
              </label>
              <textarea
                name="content"
                required
                value={formData.content}
                onChange={handleChange}
                rows={20}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none font-mono text-sm"
                placeholder="<p>Enter your blog post content here in HTML format...</p>"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 text-primary-600"
                />
                <label className="text-sm font-black text-gray-700">
                  Featured Post
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/blogs"
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-black text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary-600 to-orange-600 text-white px-8 py-3 rounded-xl font-black hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Create Blog Post'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

