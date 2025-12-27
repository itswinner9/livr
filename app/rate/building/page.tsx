'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Upload, X, Building2, Users, Sparkles, Wrench, DollarSign, Volume2, Package, ChevronRight, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PhotonAutocomplete from '@/components/PhotonAutocomplete'

interface RatingCategory {
  id: string
  label: string
  icon: React.ReactNode
  value: number
}

export default function RateBuilding() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Location info
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [latitude, setLatitude] = useState<number>(0)
  const [longitude, setLongitude] = useState<number>(0)
  
  // Ratings
  const [ratings, setRatings] = useState<RatingCategory[]>([
    { id: 'management', label: 'Management', icon: <Users className="w-8 h-8" />, value: 0 },
    { id: 'cleanliness', label: 'Cleanliness', icon: <Sparkles className="w-8 h-8" />, value: 0 },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-8 h-8" />, value: 0 },
    { id: 'rent_value', label: 'Rent Value', icon: <DollarSign className="w-8 h-8" />, value: 0 },
    { id: 'noise', label: 'Noise Level', icon: <Volume2 className="w-8 h-8" />, value: 0 },
    { id: 'amenities', label: 'Amenities', icon: <Package className="w-8 h-8" />, value: 0 },
  ])
  
  // Additional info
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [displayName, setDisplayName] = useState('')

  const steps = [
    { number: 1, title: 'Building Details' },
    { number: 2, title: 'Rate Categories' },
    { number: 3, title: 'Review Details' },
    { number: 4, title: 'Submit Review' },
  ]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session with timeout
        const sessionPromise = supabase.auth.getSession()
        const sessionTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timed out')), 5000)
        )
        
        const { data: { session }, error } = await Promise.race([sessionPromise, sessionTimeout]) as any
        
        if (error || !session) {
          router.push('/login?redirect=/rate/building')
          setUserLoading(false)
          return
        }
        
        setUser(session.user)
        
        // Check user status with timeout
        try {
          const profilePromise = supabase
            .from('user_profiles')
            .select('status, banned_until, cooled_until, moderation_reason')
            .eq('id', session.user.id)
            .single()
          
          const profileTimeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Profile check timed out')), 5000)
          )
          
          const { data: profile } = await Promise.race([profilePromise, profileTimeout]) as any

          if (profile?.status === 'banned') {
            const isStillBanned = !profile.banned_until || new Date(profile.banned_until) > new Date()
            if (isStillBanned) {
              alert(`🚫 Account Banned\n\nReason: ${profile.moderation_reason || 'No reason provided'}\n\nYou cannot submit reviews while banned.`)
              router.push('/profile')
              setUserLoading(false)
              return
            }
          }

          if (profile?.status === 'cooled') {
            const isStillCooled = !profile.cooled_until || new Date(profile.cooled_until) > new Date()
            if (isStillCooled) {
              alert(`❄️ Cooling Off Period\n\nReason: ${profile.moderation_reason || 'No reason provided'}\n\nYou cannot submit reviews during your cooling off period.`)
              router.push('/profile')
              setUserLoading(false)
              return
            }
          }
        } catch (profileError: any) {
          console.error('Error checking profile:', profileError)
          // Continue even if profile check fails - don't block the form
        }
        
        setUserLoading(false)
      } catch (error: any) {
        console.error('Error in checkAuth:', error)
        setUserLoading(false)
        router.push('/login?redirect=/rate/building')
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
    
    if (!user || !name || !address || !city || !province) {
      alert('Please fill in the building details')
      return
    }

    if (ratings.some(r => r.value === 0)) {
      alert('Please rate all 6 categories')
      return
    }

    setLoading(true)

    try {
      // Upload images first with timeout
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
          const uploadPromise = supabase.storage
            .from('buildings')
            .upload(fileName, image)
          
          const { error: uploadError } = await withTimeout(uploadPromise, 20000) // 20s timeout per image
          
          if (!uploadError) {
            const { data } = supabase.storage.from('buildings').getPublicUrl(fileName)
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

      // Check if building exists with timeout
      const slug = generateSlug(`${name}-${city}`)
      const checkPromise = Promise.resolve(supabase
        .from('buildings')
        .select('id')
        .eq('slug', slug)
        .single())
      
      const checkResult = await withTimeout(checkPromise, 10000)
      const { data: existingBuilding } = checkResult

      let buildingId: string

      if (existingBuilding) {
        buildingId = existingBuilding.id
      } else {
        const insertPromise = Promise.resolve(supabase
          .from('buildings')
          .insert({
            name,
            address,
            city,
            province,
            slug,
          })
          .select('id')
          .single())

        const insertResult = await withTimeout(insertPromise, 10000)
        const { data: newBuilding, error: buildingError } = insertResult

        if (buildingError) throw buildingError
        if (!newBuilding) throw new Error('Failed to create building')
        buildingId = newBuilding.id
      }

      // Check if user already reviewed this building with timeout
      const reviewCheckPromise = Promise.resolve(supabase
        .from('building_reviews')
        .select('id')
        .eq('building_id', buildingId)
        .eq('user_id', user.id)
        .single())
      
      const reviewCheckResult = await withTimeout(reviewCheckPromise, 10000)
      const { data: existingReview } = reviewCheckResult

      const reviewData = {
        ...Object.fromEntries(ratings.map(r => [r.id, r.value])),
        overall_rating: avgRating,
        review: comment || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        is_anonymous: isAnonymous,
        display_name: !isAnonymous ? displayName : null,
      }

      if (existingReview) {
        const updatePromise = Promise.resolve(supabase
          .from('building_reviews')
          .update({ ...reviewData, updated_at: new Date().toISOString() })
          .eq('id', existingReview.id))
        
        const updateResult = await withTimeout(updatePromise, 10000)
        const { error: updateError } = updateResult
        if (updateError) throw updateError
        
        alert('✅ Your review has been updated!')
      } else {
        const insertPromise = Promise.resolve(supabase
          .from('building_reviews')
          .insert({
            building_id: buildingId,
            user_id: user.id,
            ...reviewData,
          }))
        
        const insertResult = await withTimeout(insertPromise, 10000)
        const { error: insertError } = insertResult
        if (insertError) throw insertError
        
        alert('✅ Rating submitted successfully!')
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
    if (name && address && city && province) count++
    if (ratings.every(r => r.value > 0)) count++
    if (comment || imagePreviews.length > 0) count++
    return count
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return name && address && city && province
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
        <div className="mb-8 lg:mb-16">
          <div className="flex items-center justify-center space-x-4 lg:space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-sm lg:text-base transition-all ${
                    currentStep === step.number
                      ? 'bg-primary-600 text-white shadow-lg scale-110'
                      : currentStep > step.number
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 lg:w-16 h-0.5 transition-all ${
                      currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                    }`} />
                  )}
            </div>
            </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Panel - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Building Details */}
              {currentStep === 1 && (
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Building Information</h2>
                  <p className="text-gray-600 mb-8">Where is this building located?</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Search for your building
                      </label>
              <PhotonAutocomplete
                placeholder="Search for a building address in Canada..."
                onLocationSelect={(query, data) => {
                  if (data) {
                    const fullAddress = data.address || query
                    setAddress(fullAddress)
                            setName(data.name || fullAddress)
                    setCity(data.city || '')
                    setProvince(data.province || '')
                    setLatitude(data.latitude || 0)
                    setLongitude(data.longitude || 0)
                  }
                }}
              />
                    </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Building/Condo Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="Auto-filled from search"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="Auto-filled from search"
                />
              </div>

                    <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Rate This Building</h2>
                  <p className="text-gray-600 mb-8">How would you rate each category?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ratings.map((category, idx) => {
                      const colorMap = ['green', 'blue', 'orange', 'purple', 'pink', 'indigo']
                  return (
                        <RatingCard
                          key={category.id}
                          icon={category.icon}
                          label={category.label}
                          rating={category.value}
                          setRating={(v: number) => updateRating(category.id, v)}
                          color={colorMap[idx % colorMap.length]}
                        />
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
                        placeholder="Share your experience..."
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
                      <div className="grid grid-cols-3 gap-4">
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
                Complete all steps to submit your building review.
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
  const colorClasses = {
    green: 'from-green-50 to-emerald-50 border-green-200',
    blue: 'from-blue-50 to-cyan-50 border-blue-200',
    orange: 'from-orange-50 to-amber-50 border-orange-200',
    purple: 'from-purple-50 to-pink-50 border-purple-200',
    pink: 'from-pink-50 to-rose-50 border-pink-200',
    indigo: 'from-indigo-50 to-blue-50 border-indigo-200',
  }

  return (
    <div className={`p-6 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl border-2 border-dashed hover:shadow-lg transition-all`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-gray-700">{icon}</div>
        <label className="text-lg font-bold text-gray-900">{label}</label>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-all hover:scale-125 active:scale-95"
          >
            <Star className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
