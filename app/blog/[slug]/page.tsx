'use client'

import { useState, useEffect } from 'react'
import { Calendar, User, Clock, Share2, ChevronLeft, Tag, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Blog {
  id: string
  slug: string
  title: string
  meta_title: string
  meta_description: string
  excerpt: string
  content: string
  cover_image: string
  cover_image_alt: string
  author: {
    full_name: string
    avatar_url: string
  }
  published_at: string
  views_count: number
  links: Array<{
    link_type: string
    linked_id: string
    link_text: string
  }>
  categories: Array<{ name: string; slug: string }>
  tags: Array<{ name: string; slug: string }>
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchBlog(params.slug)
    }
  }, [params.slug])

  const fetchBlog = async (slug: string) => {
    try {
      // Fetch blog post
      const { data: blogData, error } = await supabase
        .from('blogs')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !blogData) {
        notFound()
      }

      setBlog(blogData as any)

      // Increment views (optional, can be done server-side for accuracy)
      // await supabase.rpc('increment_blog_views', { blog_id: blogData.id })
    } catch (error) {
      console.error('Error fetching blog:', error)
      notFound()
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getLinkUrl = (linkType: string, linkedId: string) => {
    const basePaths = {
      neighborhood: '/neighborhood',
      building: '/building',
      landlord: '/landlord',
      rent_company: '/company',
      blog: '/blog'
    }
    return `${basePaths[linkType as keyof typeof basePaths]}/${linkedId}`
  }

  const sharePost = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-16 bg-gray-200 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!blog) {
    notFound()
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <head>
        <title>{blog.meta_title || blog.title} | LivRank Blog</title>
        <meta name="description" content={blog.meta_description || blog.excerpt} />
        <meta property="og:title" content={blog.meta_title || blog.title} />
        <meta property="og:description" content={blog.meta_description || blog.excerpt} />
        {blog.cover_image && <meta property="og:image" content={blog.cover_image} />}
      </head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors font-bold">
              <ChevronLeft className="w-5 h-5" />
              Back to Blog
            </Link>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                {blog.author?.avatar_url ? (
                  <Image
                    src={blog.author.avatar_url}
                    alt={blog.author.full_name || 'Author'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-orange-600 rounded-full flex items-center justify-center text-white font-black">
                    {blog.author?.full_name?.[0] || 'A'}
                  </div>
                )}
                <span className="font-black text-gray-900">{blog.author?.full_name || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-bold">{formatDate(blog.published_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-bold">{blog.views_count || 0} views</span>
              </div>
              <button
                onClick={sharePost}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors font-bold"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Categories & Tags */}
            {(blog.categories?.length > 0 || blog.tags?.length > 0) && (
              <div className="flex flex-wrap gap-3 mb-8">
                {blog.categories?.map((cat, idx) => (
                  <span key={idx} className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-black">
                    {cat.name}
                  </span>
                ))}
                {blog.tags?.map((tag, idx) => (
                  <span key={idx} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Cover Image */}
          {blog.cover_image && (
            <div className="relative h-96 mb-12 rounded-2xl overflow-hidden">
              <Image
                src={blog.cover_image}
                alt={blog.cover_image_alt || blog.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          {/* Links */}
          {blog.links && blog.links.length > 0 && (
            <div className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-200">
              <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <LinkIcon className="w-6 h-6" />
                Related Links
              </h3>
              <ul className="space-y-3">
                {blog.links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={getLinkUrl(link.link_type, link.linked_id)}
                      className="text-primary-600 hover:text-primary-700 font-bold text-lg transition-colors"
                    >
                      → {link.link_text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-r from-primary-600 to-orange-600 text-white rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-black mb-4">Want to Share Your Story?</h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of renters making informed housing decisions
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/explore"
                className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105 inline-flex items-center gap-2"
              >
                Explore Reviews
              </Link>
              <Link
                href="/signup"
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all inline-flex items-center gap-2"
              >
                Join Now
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}

