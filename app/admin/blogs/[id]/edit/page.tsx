'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { safeSupabaseRequest, SupabaseSafeError } from '@/lib/supabaseSafe'

interface BlogRecord {
  id: string
  title: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  excerpt: string | null
  content: string | null
  cover_image: string | null
  cover_image_alt: string | null
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  published_at: string | null
}

const defaultForm: BlogRecord = {
  id: '',
  title: '',
  slug: '',
  meta_title: '',
  meta_description: '',
  excerpt: '',
  content: '',
  cover_image: '',
  cover_image_alt: '',
  status: 'draft',
  featured: false,
  published_at: null,
}

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const blogId = typeof params?.id === 'string' ? params.id : ''

  const [formData, setFormData] = useState<BlogRecord>(defaultForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<SupabaseSafeError | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  const loadBlog = async () => {
    if (!blogId) {
      setError({ message: 'Missing blog ID.' })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setTimedOut(false)

    const result = await safeSupabaseRequest(async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Blog post not found.')
      return data as BlogRecord
    }, { timeoutMs: 10_000, retries: 1 })

    if (result.error) {
      setError(result.error)
      setTimedOut(result.timedOut)
      setLoading(false)
      return
    }

    const record = result.data
    if (record) {
      setFormData({
        ...defaultForm,
        ...record,
        meta_title: record.meta_title ?? '',
        meta_description: record.meta_description ?? '',
        excerpt: record.excerpt ?? '',
        content: record.content ?? '',
        cover_image: record.cover_image ?? '',
        cover_image_alt: record.cover_image_alt ?? '',
      })

      const generatedSlug = slugify(record.title || '')
      setSlugManuallyEdited(
        record.slug !== generatedSlug && record.slug.length > 0
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadBlog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (name === 'slug') {
      const cleaned = slugify(value)
      setSlugManuallyEdited(cleaned.length > 0)
      setFormData(prev => ({
        ...prev,
        slug: cleaned,
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))

    if (name === 'title' && !slugManuallyEdited) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(value),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      setError({ message: 'Title is required.' })
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage('')

    try {
      const finalSlug = formData.slug || slugify(formData.title)
      const publishedAt =
        formData.status === 'published'
          ? formData.published_at || new Date().toISOString()
          : null

      const payload = {
        title: formData.title,
        slug: finalSlug,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        cover_image: formData.cover_image || null,
        cover_image_alt: formData.cover_image_alt || null,
        status: formData.status,
        featured: formData.featured,
        published_at: publishedAt,
      }

      const { error: updateError } = await supabase
        .from('blogs')
        .update(payload)
        .eq('id', blogId)

      if (updateError) {
        throw updateError
      }

      setSuccessMessage('Blog post updated successfully.')
      setFormData(prev => ({
        ...prev,
        slug: finalSlug,
        published_at: publishedAt,
      }))
      setSlugManuallyEdited(true)
    } catch (err: any) {
      console.error('Error updating blog:', err)
      setError({
        message: err?.message || 'Failed to update blog post.',
        status: err?.status,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-200 rounded-2xl w-1/2"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error && !formData.id) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 border-red-200 rounded-3xl p-10 text-center shadow-xl space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-3xl font-black text-red-700">
              {timedOut ? 'Timed out contacting Supabase.' : 'Failed to load blog post.'}
            </h1>
            <p className="text-red-600">{error.message}</p>
            <button
              onClick={loadBlog}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blogs
          </Link>
          {formData.slug && formData.status === 'published' && (
            <Link
              href={`/blog/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-primary-600 hover:text-primary-700"
            >
              View Live
            </Link>
          )}
        </div>

        <h1 className="text-6xl font-black text-gray-900 mb-4">Edit Blog Post</h1>

        {successMessage && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
            <p className="text-green-700 font-black">{successMessage}</p>
          </div>
        )}

        {error && formData.id && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <p className="text-red-700 font-black">{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 space-y-6">
            <h2 className="text-3xl font-black text-gray-900">Basic Information</h2>

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
                Slug (auto-updates from title unless edited)
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
                value={formData.excerpt ?? ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                placeholder="Short description of the blog post"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 space-y-6">
            <h2 className="text-3xl font-black text-gray-900">SEO Settings</h2>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                name="meta_title"
                value={formData.meta_title ?? ''}
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
                value={formData.meta_description ?? ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                placeholder="SEO description (150-160 characters)"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 space-y-6">
            <h2 className="text-3xl font-black text-gray-900">Cover Image</h2>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Cover Image URL
                  </label>
                  <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Cover Image Alt Text
                  </label>
                  <input
                    type="text"
                    name="cover_image_alt"
                    value={formData.cover_image_alt ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Describe the cover image for accessibility"
                  />
                </div>
              </div>

              <div className="w-full md:w-64 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                {formData.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.cover_image} alt="Cover preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm font-bold">Cover image preview</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 space-y-6">
            <h2 className="text-3xl font-black text-gray-900">Content</h2>

            <textarea
              name="content"
              value={formData.content ?? ''}
              onChange={handleChange}
              rows={12}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono"
              placeholder="Write your blog content here (supports Markdown/HTML)"
            />
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 space-y-6">
            <h2 className="text-3xl font-black text-gray-900">Publishing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  id="featured"
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="featured" className="text-sm font-black text-gray-700">
                  Mark as featured article
                </label>
              </div>
            </div>

            {formData.status === 'published' && formData.published_at && (
              <p className="text-sm text-gray-500">
                Published at:{' '}
                <span className="font-bold">
                  {new Date(formData.published_at).toLocaleString()}
                </span>
              </p>
            )}
          </section>

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => router.push('/admin/blogs')}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-black hover:border-primary-400 transition-all disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-orange-600 text-white font-black hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

