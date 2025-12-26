'use client'

import { useState, useEffect } from 'react'
import { Building2, Edit, Trash2, CheckCircle, XCircle, Star, Mail, Phone, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ManageCompanies() {
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('rent_companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
      alert('Error fetching companies: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (companyId: string) => {
    setActionLoading(companyId)
    try {
      const { error } = await supabase
        .from('rent_companies')
        .update({ is_verified: true })
        .eq('id', companyId)

      if (error) throw error
      
      alert('✅ Company verified successfully!')
      fetchCompanies()
    } catch (error) {
      console.error('Error verifying company:', error)
      alert('Error verifying company: ' + (error as any).message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (companyId: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this company? This action cannot be undone.')) return

    setActionLoading(companyId)
    try {
      const { error } = await supabase
        .from('rent_companies')
        .delete()
        .eq('id', companyId)

      if (error) throw error
      
      alert('✅ Company deleted successfully!')
      fetchCompanies()
      setSelectedCompany(null)
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Error deleting company: ' + (error as any).message)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Rent Company Management</h1>
        <p className="text-gray-600">Manage rent companies, verify profiles, and handle reports</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search companies by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
          <div className="text-sm text-gray-600">Total Companies</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {companies.filter(c => c.is_verified).length}
          </div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {companies.filter(c => !c.is_verified).length}
          </div>
          <div className="text-sm text-gray-600">Unverified</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {companies.filter(c => c.overall_rating && c.overall_rating > 0).length}
          </div>
          <div className="text-sm text-gray-600">With Ratings</div>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No companies found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedCompany(company)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Icon */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                        {company.is_verified && (
                          <CheckCircle className="w-5 h-5 text-green-500" title="Verified" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {company.city && company.province && (
                          <span>{company.city}, {company.province}</span>
                        )}
                        {company.email && (
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {company.email}
                          </span>
                        )}
                        {company.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {company.phone}
                          </span>
                        )}
                      </div>
                      {company.overall_rating && company.overall_rating > 0 && (
                        <div className="flex items-center mt-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="font-semibold text-gray-900">
                            {company.overall_rating.toFixed(1)}
                          </span>
                          <span className="text-gray-600 text-sm ml-1">
                            ({company.total_reviews || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {!company.is_verified && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerify(company.id)
                        }}
                        disabled={actionLoading === company.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(company.id)
                      }}
                      disabled={actionLoading === company.id}
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
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Company Details</h2>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  {selectedCompany.logo_url ? (
                    <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h3>
                  {selectedCompany.is_verified && (
                    <div className="flex items-center text-green-600 mt-1">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedCompany.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone</label>
                  <p className="text-gray-900">{selectedCompany.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Location</label>
                  <p className="text-gray-900">
                    {selectedCompany.city && selectedCompany.province 
                      ? `${selectedCompany.city}, ${selectedCompany.province}`
                      : 'N/A'
                    }
                  </p>
                </div>
                {selectedCompany.website && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Website</label>
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      {selectedCompany.website}
                    </a>
                  </div>
                )}
                {selectedCompany.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Description</label>
                    <p className="text-gray-900">{selectedCompany.description}</p>
                  </div>
                )}
                {selectedCompany.overall_rating && selectedCompany.overall_rating > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Overall Rating</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold text-gray-900">
                        {selectedCompany.overall_rating.toFixed(1)}
                      </span>
                      <span className="text-gray-600">
                        ({selectedCompany.total_reviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex space-x-3">
                {!selectedCompany.is_verified && (
                  <button
                    onClick={() => {
                      handleVerify(selectedCompany.id)
                      setSelectedCompany(null)
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                  >
                    Verify Company
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedCompany.id)
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  Delete Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

