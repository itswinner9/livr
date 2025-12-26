/**
 * Reusable loading skeleton components
 */

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>

        {/* Image */}
        <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(5)].map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`${sizes[size]} border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin`}></div>
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        {message && <p className="text-gray-700 font-medium">{message}</p>}
      </div>
    </div>
  )
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Spinner size="md" />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    </div>
  )
}


