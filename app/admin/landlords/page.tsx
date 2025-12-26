'use client'

import { useState, useEffect } from 'react'
import { UserCheck, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Star, Mail, Phone, Building } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ManageLandlords() {
  const router = useRouter()
  const [landlords, setLandlords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLandlord, setSelectedLandlord] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchLandlords()
  }, [])

  const fetchLandlords = async () => {
    try {
      const { data, error } = await supabase
        .from('landlords')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLandlords(data || [])
    } catch (error) {
      console.error('Error fetching landlords:', error)
      alert('Error fetching landlords: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (landlordId: string) => {
    setActionLoading(landlordId)
    try {
      const { error } = await supabase
        .from('landlords')
        .update({ is_verified: true })
        .eq('id', landlordId)

      if (error) throw error
      
      alert('✅ Landlord verified successfully!')
      fetchLandlords()
    } catch (error) {
      console.error('Error verifying landlord:', error)
      alert('Error verifying landlord: ' + (error as any).message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (landlordId: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this landlord? This action cannot be undone.')) return

    setActionLoading(landlordId)
    try {
      const { error } = await supabase
        .from('landlords')
        .delete()
        .eq('id', landlordId)

      if (error) throw error
      
      alert('✅ Landlord deleted successfully!')
      fetchLandlords()
      setSelectedLandlord(null)
    } catch (error) {
      console.error('Error deleting landlord:', error)
      alert('Error deleting landlord: ' + (error as any).message)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredLandlords = landlords.filter(landlord =>
    landlord.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    landlord.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    landlord.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Landlord Management</h1>
        <p className="text-gray-600">Manage landlords, verify profiles, and handle reports</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search landlords by name, company, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{landlords.length}</div>
          <div className="text-sm text-gray-600">Total Landlords</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {landlords.filter(l => l.is_verified).length}
          </div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {landlords.filter(l => !l.is_verified).length}
          </div>
          <div className="text-sm text-gray-600">Unverified</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {landlords.filter(l => l.overall_rating && l.overall_rating > 0).length}
          </div>
          <div className="text-sm text-gray-600">With Ratings</div>
        </div>
      </div>

      {/* Landlords List */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        {filteredLandlords.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No landlords found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLandlords.map((landlord) => (
              <div
                key={landlord.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedLandlord(landlord)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Profile Image */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      {landlord.profile_image ? (
                        <img src={landlord.profile_image} alt={landlord.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-2xl font-bold">
                          {landlord.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{landlord.name}</h3>
                        {landlord.is_verified && (
                          <CheckCircle className="w-5 h-5 text-green-500" title="Verified" />
                        )}
                      </div>
                      {landlord.company_name && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building className="w-4 h-4 mr-1" />
                          <span className="text-sm">{landlord.company_name}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {landlord.city && landlord.province && (
                          <span>{landlord.city}, {landlord.province}</span>
                        )}
                        {landlord.email && (
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {landlord.email}
                          </span>
                        )}
                        {landlord.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {landlord.phone}
                          </span>
                        )}
                      </div>
                      {landlord.overall_rating && landlord.overall_rating > 0 && (
                        <div className="flex items-center mt-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="font-semibold text-gray-900">
                            {landlord.overall_rating.toFixed(1)}
                          </span>
                          <span className="text-gray-600 text-sm ml-1">
                            ({landlord.total_reviews || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {!landlord.is_verified && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerify(landlord.id)
                        }}
                        disabled={actionLoading === landlord.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(landlord.id)
                      }}
                      disabled={actionLoading === landlord.id}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLandlord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Landlord Details</h2>
                <button
                  onClick={() => setSelectedLandlord(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {selectedLandlord.profile_image ? (
                    <img src={selectedLandlord.profile_image} alt={selectedLandlord.name} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {selectedLandlord.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedLandlord.name}</h3>
                  {selectedLandlord.is_verified && (
                    <div className="flex items-center text-green-600 mt-1">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Company Name</label>
                  <p className="text-gray-900">{selectedLandlord.company_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedLandlord.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone</label>
                  <p className="text-gray-900">{selectedLandlord.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Location</label>
                  <p className="text-gray-900">
                    {selectedLandlord.city && selectedLandlord.province 
                      ? `${selectedLandlord.city}, ${selectedLandlord.province}`
                      : 'N/A'
                    }
                  </p>
                </div>
                {selectedLandlord.website && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Website</label>
                    <a href={selectedLandlord.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedLandlord.website}
                    </a>
                  </div>
                )}
                {selectedLandlord.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Description</label>
                    <p className="text-gray-900">{selectedLandlord.description}</p>
                  </div>
                )}
                {selectedLandlord.overall_rating && selectedLandlord.overall_rating > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Overall Rating</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold text-gray-900">
                        {selectedLandlord.overall_rating.toFixed(1)}
                      </span>
                      <span className="text-gray-600">
                        ({selectedLandlord.total_reviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex space-x-3">
                {!selectedLandlord.is_verified && (
                  <button
                    onClick={() => {
                      handleVerify(selectedLandlord.id)
                      setSelectedLandlord(null)
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                  >
                    Verify Landlord
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedLandlord.id)
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  Delete Landlord
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

