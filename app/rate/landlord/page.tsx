'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Upload, X, User, Users, Wrench, MessageSquare, Scale, Briefcase, ChevronRight, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface RatingCategory {
  id: string
  label: string
  icon: React.ReactNode
  value: number
}

export default function RateLandlord() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Landlord info
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  
  // Ratings
  const [ratings, setRatings] = useState<RatingCategory[]>([
    { id: 'responsiveness', label: 'Responsiveness', icon: <Users className="w-8 h-8" />, value: 0 },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-8 h-8" />, value: 0 },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="w-8 h-8" />, value: 0 },
    { id: 'fairness', label: 'Fairness', icon: <Scale className="w-8 h-8" />, value: 0 },
    { id: 'professionalism', label: 'Professionalism', icon: <Briefcase className="w-8 h-8" />, value: 0 },
  ])
  
  // Additional info
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [displayName, setDisplayName] = useState('')
  
  // Verification
  const [leaseDocument, setLeaseDocument] = useState<File | null>(null)
  const [leasePreview, setLeasePreview] = useState<string | null>(null)

  const steps = [
    { number: 1, title: 'Landlord Info' },
    { number: 2, title: 'Rate Categories' },
    { number: 3, title: 'Review Details' },
    { number: 4, title: 'Submit Review' },
  ]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
        router.push('/login?redirect=/rate/landlord')
          return
        }
        
        setUser(session.user)
        
        // Check user status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('status, banned_until, cooled_until, moderation_reason')
          .eq('id', session.user.id)
          .single()

        if (profile?.status === 'banned') {
          const isStillBanned = !profile.banned_until || new Date(profile.banned_until) > new Date()
          if (isStillBanned) {
            alert(`🚫 Account Banned\n\nReason: ${profile.moderation_reason || 'No reason provided'}\n\nYou cannot submit reviews while banned.`)
            router.push('/profile')
            return
          }
        }

        if (profile?.status === 'cooled') {
          const isStillCooled = !profile.cooled_until || new Date(profile.cooled_until) > new Date()
          if (isStillCooled) {
            alert(`❄️ Cooling Off Period\n\nReason: ${profile.moderation_reason || 'No reason provided'}\n\nYou cannot submit reviews during your cooling off period.`)
            router.push('/profile')
            return
          }
        }
        
        setUserLoading(false)
      } catch (error) {
        router.push('/login?redirect=/rate/landlord')
      }
    }
    
    checkAuth()
  }, [router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }
    
    setImages([...images, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleLeaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, PNG, or HEIC file')
      return
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    setLeaseDocument(file)
    
    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLeasePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setLeasePreview(null) // PDFs don't have preview
    }
  }

  const removeLeaseDocument = () => {
    setLeaseDocument(null)
    setLeasePreview(null)
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const updateRating = (id: string, value: number) => {
    setRatings(ratings.map(r => r.id === id ? { ...r, value } : r))
  }

  // Helper function to add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out. Please try again.')), timeoutMs)
      )
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !name) {
      alert('Please fill in the landlord details')
      return
    }

    if (ratings.some(r => r.value === 0)) {
      alert('Please rate all 5 categories')
      return
    }

    setLoading(true)

    try {
      // Upload images with timeout
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
          const uploadPromise = supabase.storage
            .from('landlord-images')
            .upload(fileName, image)
          
          const { error: uploadError } = await withTimeout(uploadPromise, 20000) // 20s timeout per image

          if (!uploadError) {
            const { data } = supabase.storage.from('landlord-images').getPublicUrl(fileName)
            imageUrls.push(data.publicUrl)
          } else {
            console.warn('Image upload failed:', uploadError)
          }
        } catch (uploadErr: any) {
          console.warn('Image upload error:', uploadErr)
          // Continue with other images even if one fails
        }
      }

      // Calculate overall rating
      const avgRating = Math.round(ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length)

      // Check if landlord exists with timeout
      const slug = generateSlug(name)
      const checkPromise = Promise.resolve(supabase
        .from('landlords')
        .select('id')
        .eq('slug', slug)
        .single())
      
      const result = await withTimeout(checkPromise, 10000)
      const { data: existingLandlord } = result

      let landlordId: string

      if (existingLandlord) {
        landlordId = existingLandlord.id
      } else {
        const insertPromise = Promise.resolve(supabase
          .from('landlords')
          .insert({
            name,
            company_name: companyName || null,
            city: city || null,
            province: province || null,
            slug,
          })
          .select('id')
          .single())

        const insertResult = await withTimeout(insertPromise, 10000)
        const { data: newLandlord, error: landlordError } = insertResult

        if (landlordError) throw landlordError
        if (!newLandlord) throw new Error('Failed to create landlord')
        landlordId = newLandlord.id
      }

      // Check if user already reviewed this landlord with timeout
      const reviewCheckPromise = Promise.resolve(supabase
        .from('landlord_reviews')
        .select('id')
        .eq('landlord_id', landlordId)
        .eq('user_id', user.id)
        .single())
      
      const reviewCheckResult = await withTimeout(reviewCheckPromise, 10000)
      const { data: existingReview } = reviewCheckResult

      const reviewData = {
        ...Object.fromEntries(ratings.map(r => [r.id, r.value])),
        overall_rating: avgRating,
        comment: comment || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        is_anonymous: isAnonymous,
        display_name: !isAnonymous ? displayName : null,
      }

      // Handle lease document upload and verification request with timeout
      let verificationRequestId: string | null = null
      if (leaseDocument) {
        try {
          // Upload lease document to storage
          const leaseFileName = `${user.id}/${Date.now()}-${leaseDocument.name}`
          const leaseUploadPromise = supabase.storage
            .from('verification-documents')
            .upload(leaseFileName, leaseDocument)
          
          const { error: leaseUploadError } = await withTimeout(leaseUploadPromise, 20000)
          
          if (leaseUploadError) {
            console.error('Lease upload error:', leaseUploadError)
            alert('⚠️ Review submitted, but lease document upload failed. You can upload it later from your profile.')
          } else {
            // Get signed URL for the document (private bucket)
            const signedUrlPromise = supabase.storage
              .from('verification-documents')
              .createSignedUrl(leaseFileName, 31536000) // 1 year expiry
            
            const { data: signedUrlData } = await withTimeout(signedUrlPromise, 10000)
            
            const documentUrl = signedUrlData?.signedUrl || leaseFileName
            
            // Create verification request
            const verificationPromise = Promise.resolve(supabase
              .from('verification_requests')
              .insert({
                user_id: user.id,
                document_url: documentUrl,
                document_type: 'lease',
                review_type: 'landlord',
                status: 'pending'
              })
              .select('id')
              .single())
            
            const verificationResult = await withTimeout(verificationPromise, 10000)
            const { data: verificationData, error: verificationError } = verificationResult
            
            if (!verificationError && verificationData) {
              verificationRequestId = verificationData.id
            }
          }
        } catch (leaseErr: any) {
          console.error('Lease document processing error:', leaseErr)
          // Continue without verification if lease upload fails
        }
      }

      const finalReviewData = {
        ...reviewData,
        verification_request_id: verificationRequestId
      }

      if (existingReview) {
        const updatePromise = Promise.resolve(supabase
          .from('landlord_reviews')
          .update({ ...finalReviewData, updated_at: new Date().toISOString() })
          .eq('id', existingReview.id))
        
        const updateResult = await withTimeout(updatePromise, 10000)
        const { error: updateError } = updateResult
        if (updateError) throw updateError
        
        if (verificationRequestId) {
          // Link verification request to review
          const linkPromise = Promise.resolve(supabase
            .from('verification_requests')
            .update({ review_id: existingReview.id })
            .eq('id', verificationRequestId))
          
          await withTimeout(linkPromise, 10000)
        }
        
        alert('✅ Your review has been updated!')
      } else {
        const insertPromise = Promise.resolve(supabase
          .from('landlord_reviews')
          .insert({
            landlord_id: landlordId,
            user_id: user.id,
            ...finalReviewData,
          })
          .select('id')
          .single())
        
        const insertResult = await withTimeout(insertPromise, 10000)
        const { data: newReview, error: reviewError } = insertResult
        
        if (reviewError) throw reviewError
        if (!newReview) throw new Error('Failed to create review')
        
        if (verificationRequestId && newReview) {
          // Link verification request to review
          const linkPromise = Promise.resolve(supabase
            .from('verification_requests')
            .update({ review_id: newReview.id })
            .eq('id', verificationRequestId))
          
          await withTimeout(linkPromise, 10000)
        }
        
        if (verificationRequestId) {
          alert('✅ Rating submitted successfully! Your verification request is pending admin review.')
        } else {
          alert('✅ Rating submitted successfully!')
        }
      }

      // Use window.location for more reliable redirect
      setLoading(false)
      window.location.href = '/explore'
    } catch (error: any) {
      console.error('Error submitting rating:', error)
      setLoading(false)
      const errorMessage = error.message || 'Unknown error occurred'
      alert(`Error submitting rating: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`)
    }
  }

  const getCompletedSteps = () => {
    let count = 0
    if (name) count++
    if (ratings.every(r => r.value > 0)) count++
    if (comment || imagePreviews.length > 0) count++
    return count
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return name
      case 2:
        return ratings.every(r => r.value > 0)
      case 3:
        return true
      default:
        return false
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Progress Steps */}
        <div className="mb-10 lg:mb-16">
          <div className="flex items-center justify-center space-x-2 lg:space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    relative w-12 h-12 lg:w-14 lg:h-14 rounded-2xl 
                    flex items-center justify-center font-black text-base lg:text-lg
                    transition-all duration-300
                    ${currentStep === step.number
                      ? 'bg-gradient-to-br from-primary-600 to-orange-600 text-white shadow-xl shadow-primary-200 scale-110 ring-4 ring-primary-100'
                      : currentStep > step.number
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-100'
                      : 'bg-gray-100 text-gray-400 scale-100'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                    {currentStep === step.number && (
                      <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
                    )}
                  </div>
                  <span className={`
                    mt-2 text-xs lg:text-sm font-bold hidden lg:block transition-colors
                    ${currentStep === step.number 
                      ? 'text-primary-600' 
                      : currentStep > step.number 
                      ? 'text-primary-500' 
                      : 'text-gray-400'
                    }
                  `}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 lg:w-16 h-1 mx-2 lg:mx-4 rounded-full transition-all duration-500
                    ${currentStep > step.number 
                      ? 'bg-gradient-to-r from-primary-600 to-orange-600' 
                      : 'bg-gray-200'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Panel - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Landlord Info */}
              {currentStep === 1 && (
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Landlord Information</h2>
                  <p className="text-gray-600 mb-8">Who are you reviewing?</p>
                  
                  <div className="space-y-6">
                <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Landlord Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g., Smith Properties"
                  />
                </div>

                    <div className="grid grid-cols-2 gap-4">
                <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          City (Optional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder="City"
                  />
                </div>
                <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Province (Optional)
                  </label>
                        <input
                          type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder="Province"
                        />
                </div>
              </div>
            </div>

                  <div className="mt-8 flex justify-end">
                        <button
                          type="button"
                      onClick={() => canProceedToNextStep() && setCurrentStep(2)}
                      disabled={!canProceedToNextStep()}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                        </button>
                  </div>
                </div>
              )}

              {/* Step 2: Ratings */}
              {currentStep === 2 && (
                <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10 border border-gray-100 animate-fade-in">
                  <div className="mb-8">
                    <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Rate This Landlord
                    </h2>
                    <p className="text-lg text-gray-600">
                      How would you rate each category? Click the stars to rate.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                    {ratings.map((category, idx) => {
                      const colorMap = ['green', 'blue', 'orange', 'purple', 'pink']
                      return (
                        <div key={category.id} className="relative">
                          <RatingCard
                            icon={category.icon}
                            label={category.label}
                            rating={category.value}
                            setRating={(v: number) => updateRating(category.id, v)}
                            color={colorMap[idx % colorMap.length]}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => canProceedToNextStep() && setCurrentStep(3)}
                      disabled={!canProceedToNextStep()}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
              </div>
            </div>
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Details</h2>
                  <p className="text-gray-600 mb-8">Add any additional information (optional)</p>
                  
                  <div className="space-y-6">
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Share your experience
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                        placeholder="Share your experience with this landlord..."
                />
              </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Add Photos
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-400 transition-colors cursor-pointer">
                        <label className="flex flex-col items-center cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <span className="text-gray-600 font-medium mb-1">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-sm text-gray-500">Maximum 5 images</span>
                <input
                  type="file"
                            accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                </label>
              </div>

              {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Upload Lease Document (Optional)
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        Upload a lease document to get a "Verified Tenant" badge. This will be reviewed by admins.
                      </p>
                      {!leaseDocument ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-400 transition-colors cursor-pointer">
                          <label className="flex flex-col items-center cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mb-3" />
                            <span className="text-gray-600 font-medium mb-1">
                              Click to upload lease document
                            </span>
                            <span className="text-sm text-gray-500">PDF, JPG, PNG, or HEIC (Max 10MB)</span>
                  <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.heic"
                              onChange={handleLeaseUpload}
                              className="hidden"
                            />
                  </label>
                        </div>
                      ) : (
                        <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {leasePreview ? (
                              <img src={leasePreview} alt="Lease preview" className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">PDF</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{leaseDocument.name}</p>
                              <p className="text-sm text-gray-600">{(leaseDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeLeaseDocument}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                </div>
                
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-5 h-5 mt-0.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="block font-semibold text-gray-900">Submit as anonymous</span>
                          <span className="text-sm text-gray-600">Your name won&apos;t be shown with this review</span>
                        </div>
                  </label>
                </div>
              </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold text-sm flex items-center space-x-2 hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
                  <p className="text-gray-600 mb-8">Double-check your review before submitting</p>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200">
                      <h3 className="font-bold text-lg text-gray-900 mb-4">{name}</h3>
                      <div className="grid grid-cols-5 gap-4">
                        {ratings.map((r) => (
                          <div key={r.id} className="text-center">
                            <div className="text-2xl font-black text-primary-600 mb-1">{r.value}</div>
                            <div className="text-xs text-gray-600">{r.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {comment && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-gray-700 whitespace-pre-wrap">{comment}</p>
                      </div>
                    )}

                    {imagePreviews.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-700">
                          {imagePreviews.length} photo(s) attached
                        </p>
                </div>
              )}
            </div>

                  <div className="mt-8 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
              <button
                type="submit"
                disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-primary-600 via-primary-700 to-orange-600 text-white rounded-lg font-bold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary-700 hover:via-primary-800 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Review</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
              </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Panel - Info */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-8">
              <div className="text-5xl font-black bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent mb-4">
                {getCompletedSteps()}/{steps.length}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Review Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete all steps to submit your landlord review.
              </p>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.number}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        currentStep === step.number
                          ? 'bg-primary-50 border-2 border-primary-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        currentStep === step.number
                          ? 'bg-primary-600 text-white'
                          : currentStep > step.number
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        {currentStep > step.number ? '✓' : step.number}
                      </div>
                      <span className={`font-semibold ${
                        currentStep === step.number ? 'text-primary-900' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RatingCard({ icon, label, rating, setRating, color }: any) {
  const colorConfig = {
    green: {
      bg: 'from-emerald-500/10 to-green-500/10',
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      hover: 'hover:border-emerald-300 hover:shadow-emerald-100/50',
      active: 'border-emerald-400 shadow-lg shadow-emerald-200/30',
    },
    blue: {
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-200/60',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hover: 'hover:border-blue-300 hover:shadow-blue-100/50',
      active: 'border-blue-400 shadow-lg shadow-blue-200/30',
    },
    orange: {
      bg: 'from-orange-500/10 to-amber-500/10',
      border: 'border-orange-200/60',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      hover: 'hover:border-orange-300 hover:shadow-orange-100/50',
      active: 'border-orange-400 shadow-lg shadow-orange-200/30',
    },
    purple: {
      bg: 'from-purple-500/10 to-violet-500/10',
      border: 'border-purple-200/60',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      hover: 'hover:border-purple-300 hover:shadow-purple-100/50',
      active: 'border-purple-400 shadow-lg shadow-purple-200/30',
    },
    pink: {
      bg: 'from-pink-500/10 to-rose-500/10',
      border: 'border-pink-200/60',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      hover: 'hover:border-pink-300 hover:shadow-pink-100/50',
      active: 'border-pink-400 shadow-lg shadow-pink-200/30',
    },
  }

  const config = colorConfig[color as keyof typeof colorConfig] || colorConfig.blue
  const hasRating = rating > 0

  return (
    <div 
      className={`
        group relative p-6 bg-gradient-to-br ${config.bg} 
        rounded-3xl border-2 ${hasRating ? config.active : config.border} 
        ${config.hover} transition-all duration-300 
        hover:scale-[1.02] active:scale-[0.98]
        ${hasRating ? 'shadow-xl' : 'shadow-sm'}
        overflow-hidden
      `}
    >
      {/* Icon and Label */}
      <div className="flex items-center space-x-4 mb-5 relative z-10">
        <div className={`
          ${config.iconBg} ${config.iconColor} 
          p-3 rounded-xl transition-all duration-300
          group-hover:scale-110 group-hover:rotate-3
          ${hasRating ? 'shadow-md' : ''}
        `}>
          <div className="w-6 h-6">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-lg font-bold text-gray-900 block">{label}</label>
          {hasRating && (
            <div className="text-xs text-gray-500 mt-0.5 font-medium">
              {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </div>
          )}
        </div>
      </div>

      {/* Stars */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= rating
            const isHovered = false // Could add hover state if needed
            
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`
                  focus:outline-none transition-all duration-200
                  hover:scale-125 active:scale-95
                  ${isActive ? 'transform' : 'opacity-40 hover:opacity-70'}
                `}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1)' : 'scale(1)'
                }}
              >
                <Star 
                  className={`
                    w-9 h-9 transition-all duration-200
                    ${isActive 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-gray-300 hover:text-amber-300'
                    }
                  `} 
                />
              </button>
            )
          })}
        </div>
        
        {/* Rating Number Badge */}
        {hasRating && (
          <div className={`
            ${config.iconBg} ${config.iconColor}
            px-4 py-2 rounded-xl font-black text-lg
            shadow-md transition-all duration-300
            group-hover:scale-110
          `}>
            {rating}.0
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {hasRating && (
        <div className="mt-4 h-1.5 bg-white/60 rounded-full overflow-hidden backdrop-blur-sm relative z-10">
          <div 
            className={`h-full ${config.iconBg} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${(rating / 5) * 100}%` }}
          />
        </div>
      )}
      
      {/* Background overlay to prevent content showing through */}
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${config.bg} -z-0`} />
    </div>
  )
}
