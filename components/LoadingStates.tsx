/**
 * Production-ready loading components for fast, beautiful UX
 */

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-transparent border-t-primary-600 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-6 text-lg font-semibold text-gray-700">{message}</p>
        <p className="mt-2 text-sm text-gray-500">Please wait...</p>
      </div>
    </div>
  )
}

export function ExploreSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Skeleton */}
        <div className="text-center mb-8 lg:mb-12 animate-pulse">
          <div className="h-12 bg-gray-200 rounded-xl w-1/3 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-1/2 mx-auto"></div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 max-w-4xl mx-auto animate-pulse">
          <div className="h-14 bg-gray-200 rounded-xl"></div>
          <div className="flex gap-2 mt-4 justify-center">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl w-24"></div>
            ))}
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-xl w-40"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-48 bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Skeleton */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mb-8 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
              <div className="h-5 bg-gray-200 rounded-lg w-1/2"></div>
              <div className="flex gap-4">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-xl w-1/4 animate-pulse"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-6 bg-gray-200 rounded w-16"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-orange-600 py-20 lg:py-32 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="h-16 bg-white/20 rounded-xl w-2/3 mx-auto"></div>
            <div className="h-8 bg-white/20 rounded-lg w-1/2 mx-auto"></div>
            <div className="h-14 bg-white/20 rounded-xl w-full max-w-2xl mx-auto mt-8"></div>
          </div>
        </div>
      </div>

      {/* Featured Properties Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-48 bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InlineSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg', message?: string }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className={`${sizes[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
      {message && <p className="text-gray-600 font-medium">{message}</p>}
    </div>
  )
}

export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
  }
  
  return (
    <div className={`${sizes[size]} border-white/30 border-t-white rounded-full animate-spin inline-block`}></div>
  )
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="h-48 bg-gray-200"></div>
          <div className="p-5 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorMessage({ 
  message, 
  onRetry 
}: { 
  message: string
  onRetry?: () => void 
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">Oops! Something went wrong</h3>
      <p className="text-red-700 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

