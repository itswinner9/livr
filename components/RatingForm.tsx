'use client'

import { Star, Upload, X, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface RatingCategory {
  id: string
  label: string
  icon: React.ReactNode
  value: number
  color: string
  description: string
}

interface RatingFormProps {
  categories: RatingCategory[]
  onRatingChange: (categoryId: string, value: number) => void
  comment: string
  setComment: (comment: string) => void
  images: File[]
  imagePreviews: string[]
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  isAnonymous: boolean
  setIsAnonymous: (isAnonymous: boolean) => void
  displayName: string
  setDisplayName: (name: string) => void
  submitLabel?: string
  loading?: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function RatingForm({
  categories,
  onRatingChange,
  comment,
  setComment,
  images,
  imagePreviews,
  onImageUpload,
  onRemoveImage,
  isAnonymous,
  setIsAnonymous,
  displayName,
  setDisplayName,
  submitLabel = 'Submit Review',
  loading = false,
  onSubmit,
}: RatingFormProps) {
  const StarRating = ({ value, onChange, label, color, icon, description }: {
    value: number
    onChange: (value: number) => void
    label: string
    color: string
    icon: React.ReactNode
    description: string
  }) => {
    const [hoverValue, setHoverValue] = useState(0)

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{label}</h4>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          {value > 0 && (
            <div className="flex items-center space-x-1">
              <Star className={`w-5 h-5 ${value >= 4 ? 'text-green-500 fill-green-500' : value >= 3 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500'}`} />
              <span className={`font-bold text-sm ${value >= 4 ? 'text-green-600' : value >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                {value}.0
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              className={`transition-all transform hover:scale-110 ${
                star <= (hoverValue || value)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverValue || value) ? 'fill-yellow-400' : 'fill-transparent'
                } transition-all`}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const totalRating = categories.reduce((sum, cat) => sum + cat.value, 0) / categories.length

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Overall Rating Display */}
      {totalRating > 0 && (
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Overall Rating</h3>
              <p className="text-sm text-gray-600">Your average rating across all categories</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= Math.round(totalRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    } transition-all`}
                  />
                ))}
              </div>
              <div className="text-3xl font-bold text-primary-600">
                {totalRating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Categories */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Star className="w-6 h-6 mr-2 text-yellow-500" />
          Rate Each Category
        </h3>
        <div className="grid gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all shadow-sm"
            >
              <StarRating
                value={category.value}
                onChange={(value) => onRatingChange(category.id, value)}
                label={category.label}
                color={category.color}
                icon={category.icon}
                description={category.description}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comment Section */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Share Your Experience</h3>
          <span className="text-sm text-gray-500">{comment.length}/1000 characters</span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience... What was great? What could be better?"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
          rows={5}
          maxLength={1000}
        />
      </div>

      {/* Image Upload */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Photos</h3>
          <span className="text-sm text-gray-500">{images.length}/5 images</span>
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 5 && (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
            <span className="text-sm text-gray-600 group-hover:text-primary-600 font-medium">
              Upload Photos (Max 5)
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={onImageUpload}
            />
          </label>
        )}
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Settings</h3>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
            />
            <div>
              <div className="font-medium text-gray-900">Post Anonymously</div>
              <div className="text-sm text-gray-600">Your name will be hidden from this review</div>
            </div>
          </label>

          {!isAnonymous && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How would you like to be identified?"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-gray-200">
        <p className="text-sm text-gray-600">
          By submitting, you agree to our review guidelines
        </p>
        <button
          type="submit"
          disabled={loading || totalRating === 0}
          className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

