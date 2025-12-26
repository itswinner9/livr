'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, AlertCircle, Download, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface VerificationRequest {
  id: string
  user_id: string
  review_id: string | null
  review_type: string | null
  document_url: string
  document_type: string
  status: string
  rejection_reason: string | null
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  user_profiles?: {
    email: string
    full_name: string | null
    is_verified_tenant: boolean
  }
}

export default function AdminVerificationsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    checkAdminAndFetch()
  }, [filter])

  const checkAdminAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!profile?.is_admin) {
        alert('❌ Access denied. Admin only.')
        router.push('/')
        return
      }

      fetchRequests()
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('verification_requests')
        .select(`
          *,
          user_profiles!verification_requests_user_id_fkey(email, full_name, is_verified_tenant)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      console.error('Error fetching requests:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approve this verification request? The user will receive a "Verified Tenant" badge.')) {
      return
    }

    setActionLoading(requestId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', requestId)

      if (error) throw error

      alert('✅ Verification approved! User is now verified.')
      setSelectedRequest(null)
      setAdminNotes('')
      fetchRequests()
    } catch (error: any) {
      console.error('Error approving:', error)
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    if (!confirm('Reject this verification request?')) {
      return
    }

    setActionLoading(requestId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', requestId)

      if (error) throw error

      // Create notification for user
      const request = requests.find(r => r.id === requestId)
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            type: 'verification_rejected',
            title: 'Verification Request Rejected',
            message: `Your verification request was rejected. Reason: ${rejectionReason}`,
            link: '/profile'
          })
      }

      alert('✅ Verification rejected. User has been notified.')
      setSelectedRequest(null)
      setRejectionReason('')
      setAdminNotes('')
      fetchRequests()
    } catch (error: any) {
      console.error('Error rejecting:', error)
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequestMoreInfo = async (requestId: string) => {
    if (!adminNotes.trim()) {
      alert('Please provide notes about what additional information is needed')
      return
    }

    setActionLoading(requestId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'request_more_info',
          admin_notes: adminNotes,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // Create notification for user
      const request = requests.find(r => r.id === requestId)
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            type: 'verification_more_info',
            title: 'Additional Information Required',
            message: `We need more information to verify your tenant status. ${adminNotes}`,
            link: '/profile'
          })
      }

      alert('✅ User notified to provide more information.')
      setSelectedRequest(null)
      setAdminNotes('')
      fetchRequests()
    } catch (error: any) {
      console.error('Error requesting more info:', error)
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Approved</span></span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center space-x-1"><XCircle className="w-3 h-3" /><span>Rejected</span></span>
      case 'request_more_info':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>More Info Needed</span></span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold flex items-center space-x-1"><Clock className="w-3 h-3" /><span>Pending</span></span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification requests...</p>
        </div>
      </div>
    )
  }

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Verification Requests</h1>
          <p className="text-gray-600">Review and manage tenant verification requests</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({requests.filter(r => f === 'all' ? true : r.status === f).length})
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No verification requests found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900">
                          {request.user_profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600">{request.user_profiles?.email}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Document Type:</span>
                        <p className="font-semibold text-gray-900 capitalize">{request.document_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Review Type:</span>
                        <p className="font-semibold text-gray-900 capitalize">{request.review_type || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <p className="font-semibold text-gray-900">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {request.reviewed_at && (
                        <div>
                          <span className="text-gray-600">Reviewed:</span>
                          <p className="font-semibold text-gray-900">
                            {new Date(request.reviewed_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.rejection_reason && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-900">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{request.rejection_reason}</p>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">Admin Notes:</p>
                        <p className="text-sm text-gray-700">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setAdminNotes(request.admin_notes || '')
                        setRejectionReason(request.rejection_reason || '')
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                    {request.document_url && (
                      <a
                        href={request.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>View Document</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Review Verification Request</h2>
                <p className="text-gray-600 mt-1">
                  {selectedRequest.user_profiles?.full_name || 'Unknown User'} - {selectedRequest.user_profiles?.email}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {selectedRequest.document_url && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Document</label>
                    <a
                      href={selectedRequest.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Document</span>
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes (Optional)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Internal notes (not visible to user)"
                  />
                </div>

                {selectedRequest.status === 'pending' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason (if rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Reason for rejection (visible to user)"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        disabled={actionLoading === selectedRequest.id}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRequestMoreInfo(selectedRequest.id)}
                        disabled={actionLoading === selectedRequest.id || !adminNotes.trim()}
                        className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span>Request More Info</span>
                      </button>
                      <button
                        onClick={() => handleReject(selectedRequest.id)}
                        disabled={actionLoading === selectedRequest.id || !rejectionReason.trim()}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
