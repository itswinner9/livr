'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Mail, Calendar, CheckCircle, XCircle, Search, AlertTriangle, Clock, Ban, Thermometer, Bell, ChevronRight, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showCoolingModal, setShowCoolingModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [moderationReason, setModerationReason] = useState('')
  const [duration, setDuration] = useState('3')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profiles) {
      setUsers(profiles)
    }
    setLoading(false)
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId)

    if (!error) {
      alert(`✅ Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully!`)
      fetchUsers()
    } else {
      alert(`❌ Error: ${error.message}`)
    }
    setActionLoading(null)
  }

  const toggleVerifiedTenant = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} the verified tenant badge for this user?`)) {
      return
    }

    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_verified_tenant: !currentStatus })
        .eq('id', userId)

      if (!error) {
        alert(`✅ Verified tenant badge ${!currentStatus ? 'granted' : 'removed'} successfully!`)
        
        // Create notification for user
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: !currentStatus ? 'verification_approved' : 'verification_revoked',
            title: !currentStatus ? 'Verified Tenant Badge Granted' : 'Verified Tenant Badge Removed',
            message: !currentStatus 
              ? 'Congratulations! You have been granted the "Verified Tenant" badge by an admin.'
              : 'Your "Verified Tenant" badge has been removed by an admin.',
            link: '/profile'
          })
        
        fetchUsers()
      } else {
        alert(`❌ Error: ${error.message}`)
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Warning Function
  const handleWarning = async () => {
    if (!moderationReason.trim()) {
      alert('❌ Please provide a reason for the warning.')
      return
    }

    setActionLoading(selectedUser.id)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const user = session.user

      // Update warning count
      const newWarningCount = (selectedUser.warning_count || 0) + 1
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          warning_count: newWarningCount,
          moderation_reason: moderationReason,
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // Log moderation action
      const { error: logError } = await supabase
        .from('user_moderation_log')
        .insert({
          user_id: selectedUser.id,
          action: 'warning',
          duration_months: null,
          reason: moderationReason,
          moderated_by: user.id
        })

      if (logError) console.error('Log error:', logError)

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.id,
          type: 'warning',
          title: '⚠️ Warning Issued',
          message: `You have received a warning: ${moderationReason}. Please review our community guidelines.`,
          link: '/profile'
        })

      if (notifError) console.error('Notification error:', notifError)

      alert(`⚠️ Warning issued successfully!\n\nUser now has ${newWarningCount} warning(s).`)
      fetchUsers()
      setShowWarningModal(false)
      setModerationReason('')
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
    
    setActionLoading(null)
  }

  // Cooling Off Function
  const handleCoolingOff = async () => {
    if (!moderationReason.trim()) {
      alert('❌ Please provide a reason for the cooling off period.')
      return
    }

    setActionLoading(selectedUser.id)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const user = session.user

      const durationMonths = parseInt(duration)
      const cooledUntil = new Date()
      cooledUntil.setMonth(cooledUntil.getMonth() + durationMonths)

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'cooled',
          cooled_until: cooledUntil.toISOString(),
          moderation_reason: moderationReason,
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // Log moderation action
      const { error: logError } = await supabase
        .from('user_moderation_log')
        .insert({
          user_id: selectedUser.id,
          action: 'cooling_off',
          duration_months: durationMonths,
          reason: moderationReason,
          moderated_by: user.id
        })

      if (logError) console.error('Log error:', logError)

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.id,
          type: 'cooling_off',
          title: '❄️ Cooling Off Period',
          message: `You have been placed on a ${duration}-month cooling off period: ${moderationReason}. You cannot post reviews during this time.`,
          link: '/profile'
        })

      if (notifError) console.error('Notification error:', notifError)

      alert(`❄️ Cooling off period applied successfully!\n\nUser cannot post reviews for ${duration} month(s).`)
      fetchUsers()
      setShowCoolingModal(false)
      setModerationReason('')
      setDuration('3')
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
    
    setActionLoading(null)
  }

  // Ban Function
  const handleBan = async () => {
    if (!moderationReason.trim()) {
      alert('❌ Please provide a reason for banning this user.')
      return
    }

    setActionLoading(selectedUser.id)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const user = session.user

      const durationMonths = duration === 'permanent' ? null : parseInt(duration)
      const bannedUntil = durationMonths ? new Date() : null
      if (bannedUntil) {
        bannedUntil.setMonth(bannedUntil.getMonth() + durationMonths)
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'banned',
          banned_until: bannedUntil?.toISOString() || null,
          moderation_reason: moderationReason,
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // Log moderation action
      const { error: logError } = await supabase
        .from('user_moderation_log')
        .insert({
          user_id: selectedUser.id,
          action: 'ban',
          duration_months: durationMonths,
          reason: moderationReason,
          moderated_by: user.id
        })

      if (logError) console.error('Log error:', logError)

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.id,
          type: 'banned',
          title: '🚫 Account Banned',
          message: `Your account has been banned: ${moderationReason}. ${durationMonths ? `You can appeal after ${durationMonths} month(s).` : 'This ban is permanent.'}`,
          link: '/profile'
        })

      if (notifError) console.error('Notification error:', notifError)

      alert(`🚫 User banned successfully!\n\nDuration: ${durationMonths ? `${durationMonths} month(s)` : 'Permanent'}`)
      fetchUsers()
      setShowBanModal(false)
      setModerationReason('')
      setDuration('3')
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
    
    setActionLoading(null)
  }

  // Unban/Cooling Off End Function
  const handleRestore = async (userId: string) => {
    setActionLoading(userId)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'active',
          banned_until: null,
          cooled_until: null,
          moderation_reason: null
        })
        .eq('id', userId)

      if (error) throw error

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'restored',
          title: '✅ Account Restored',
          message: 'Your account access has been restored. You can now use the platform normally.',
          link: '/profile'
        })

      if (notifError) console.error('Notification error:', notifError)

      alert(`✅ Account restored successfully!`)
      fetchUsers()
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
    
    setActionLoading(null)
  }

  const handleDelete = async () => {
    if (!moderationReason.trim()) {
      alert('❌ Please provide a reason for deleting this user.')
      return
    }

    setActionLoading(selectedUser.id)
    
    try {
      // Delete user's reviews
      await supabase.from('neighborhood_reviews').delete().eq('user_id', selectedUser.id)
      await supabase.from('building_reviews').delete().eq('user_id', selectedUser.id)
      await supabase.from('landlord_reviews').delete().eq('user_id', selectedUser.id)
      await supabase.from('rent_company_reviews').delete().eq('user_id', selectedUser.id)
      
      // Delete user profile
      const { error } = await supabase.from('user_profiles').delete().eq('id', selectedUser.id)

      if (error) throw error

      alert(`🗑️ User deleted successfully!`)
      fetchUsers()
      setShowDeleteModal(false)
      setModerationReason('')
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
    
    setActionLoading(null)
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (user: any) => {
    if (user.status === 'banned') {
      return (
        <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
          <Ban className="w-3 h-3" />
          <span>Banned</span>
        </span>
      )
    }
    if (user.status === 'cooled') {
      const isStillCooled = user.cooled_until && new Date(user.cooled_until) > new Date()
      if (isStillCooled) {
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>Cooling</span>
          </span>
        )
      }
    }
    if (user.warning_count > 0) {
      return (
        <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
          <AlertTriangle className="w-3 h-3" />
          <span>{user.warning_count} Warning{user.warning_count > 1 ? 's' : ''}</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
        <CheckCircle className="w-3 h-3" />
        <span>Active</span>
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-12 bg-gray-200 rounded-2xl w-80 mb-8 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-3">User Management</h1>
        <p className="text-lg text-gray-600">Manage user accounts, warnings, and moderation</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-8 shadow-lg border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by email or name..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-black mb-1">{users.length}</div>
          <div className="text-sm opacity-90">Total Users</div>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-black mb-1">
            {users.filter(u => u.is_admin).length}
          </div>
          <div className="text-sm opacity-90">Admins</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-black mb-1">
            {users.filter(u => u.status === 'active' || !u.status).length}
          </div>
          <div className="text-sm opacity-90">Active Users</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-black mb-1">
            {users.filter(u => u.warning_count > 0).length}
          </div>
          <div className="text-sm opacity-90">Warned Users</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <Ban className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-black mb-1">
            {users.filter(u => u.status === 'banned').length}
          </div>
          <div className="text-sm opacity-90">Banned Users</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <BadgeCheck className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-black mb-1">
            {users.filter(u => u.is_verified_tenant).length}
          </div>
          <div className="text-sm opacity-90">Verified Tenants</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-gray-900">{user.email}</div>
                      {user.full_name && (
                        <div className="text-sm text-gray-500">{user.full_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(user)}
                      {user.is_verified_tenant && (
                        <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold w-fit">
                          <BadgeCheck className="w-3 h-3" />
                          <span>Verified Tenant</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_admin ? (
                      <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                        <Shield className="w-3 h-3" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                        <Users className="w-3 h-3" />
                        <span>User</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                          user.is_admin
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        } ${actionLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading === user.id ? '...' : (user.is_admin ? 'Remove Admin' : 'Make Admin')}
                      </button>

                      <button
                        onClick={() => toggleVerifiedTenant(user.id, user.is_verified_tenant || false)}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center space-x-1 ${
                          user.is_verified_tenant
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } ${actionLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        <span>{actionLoading === user.id ? '...' : (user.is_verified_tenant ? 'Remove Verified' : 'Verify Tenant')}</span>
                      </button>
                      
                      {(user.status === 'banned' || user.status === 'cooled') ? (
                        <button
                          onClick={() => handleRestore(user.id)}
                          disabled={actionLoading === user.id}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs bg-green-600 text-white hover:bg-green-700 ${actionLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setModerationReason('')
                              setShowWarningModal(true)
                            }}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-yellow-500 text-white hover:bg-yellow-600 transition-all disabled:opacity-50"
                          >
                            <Bell className="w-3 h-3 inline mr-1" />
                            Warn
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setModerationReason('')
                              setDuration('3')
                              setShowCoolingModal(true)
                            }}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            <Thermometer className="w-3 h-3 inline mr-1" />
                            Cool Off
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setModerationReason('')
                              setDuration('3')
                              setShowBanModal(true)
                            }}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                          >
                            <Ban className="w-3 h-3 inline mr-1" />
                            Ban
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setModerationReason('')
                          setShowDeleteModal(true)
                        }}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs bg-red-100 text-red-700 hover:bg-red-200 transition-all disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-7 h-7 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Issue Warning</h3>
                <p className="text-sm text-gray-600">User will receive a warning notification</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                User: <span className="text-gray-600">{selectedUser?.email}</span>
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Current warnings: <span className="font-bold">{selectedUser?.warning_count || 0}</span>
              </p>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Reason for warning:
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g., Spam content, inappropriate language..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none transition-all"
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowWarningModal(false)
                  setModerationReason('')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWarning}
                disabled={actionLoading === selectedUser?.id || !moderationReason.trim()}
                className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedUser?.id ? 'Issuing...' : 'Issue Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cooling Off Modal */}
      {showCoolingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Cooling Off Period</h3>
                <p className="text-sm text-gray-600">User cannot post reviews during this time</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-4">
                User: <span className="text-gray-600">{selectedUser?.email}</span>
              </p>
              
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Duration:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>

              <label className="block text-sm font-bold text-gray-900 mb-3">
                Reason:
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g., Repeated spam, low quality reviews..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCoolingModal(false)
                  setModerationReason('')
                  setDuration('3')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCoolingOff}
                disabled={actionLoading === selectedUser?.id || !moderationReason.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedUser?.id ? 'Applying...' : 'Apply Cooling Off'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Ban className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Ban User</h3>
                <p className="text-sm text-gray-600">Prevent user from accessing the platform</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-4">
                User: <span className="text-gray-600">{selectedUser?.email}</span>
              </p>
              
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Duration:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all mb-4"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="permanent">Permanent</option>
              </select>

              <label className="block text-sm font-bold text-gray-900 mb-3">
                Reason:
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g., Severe violations, spam, harassment..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all"
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setModerationReason('')
                  setDuration('3')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading === selectedUser?.id || !moderationReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedUser?.id ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Delete User</h3>
                <p className="text-sm text-red-600 font-bold">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                User: <span className="text-gray-600">{selectedUser?.email}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                This will permanently delete their account and all their reviews.
              </p>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Reason for deletion:
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g., Account closure request, severe violations..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all"
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setModerationReason('')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === selectedUser?.id || !moderationReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedUser?.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
