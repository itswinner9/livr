'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, CheckCircle, Circle, Trash2, Filter, X, 
  CheckCircle2, Clock, AlertTriangle, Shield, Star, 
  UserCheck, Building2, MapPin, ArrowRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type NotificationType = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [filter, setFilter] = useState<NotificationType>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (loading === false) {
      fetchNotifications()
    }
  }, [filter])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (loading) return

    let channel: any = null

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      channel = supabase
        .channel(`notifications-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [loading])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setLoading(false)
  }

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (filter === 'unread') {
        query = query.eq('read', false)
      } else if (filter === 'read') {
        query = query.eq('read', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const markAsRead = async (id: string) => {
    setActionLoading(true)
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (!error) {
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    }
    setActionLoading(false)
  }

  const markAsUnread = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: false })
      .eq('id', id)

    if (!error) {
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    setActionLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false)

    if (!error) {
      fetchNotifications()
      setSelectedNotifications(new Set())
    }
    setActionLoading(false)
  }

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    setActionLoading(true)
    // Optimistically remove from UI
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      // Revert on error
      fetchNotifications()
      alert('Failed to delete notification. Please try again.')
    }
    setActionLoading(false)
  }

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedNotifications.size} notification(s)?`)) return

    setActionLoading(true)
    const ids = Array.from(selectedNotifications)
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids)

    if (!error) {
      fetchNotifications()
      setSelectedNotifications(new Set())
    }
    setActionLoading(false)
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedNotifications(newSelected)
  }

  const selectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'review_rejected':
        return <X className="w-5 h-5 text-red-600" />
      case 'review_pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'admin_action':
        return <Shield className="w-5 h-5 text-primary-600" />
      case 'verified_tenant':
        return <UserCheck className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200'
    
    switch (type) {
      case 'review_approved':
        return 'bg-green-50 border-green-200'
      case 'review_rejected':
        return 'bg-red-50 border-red-200'
      case 'review_pending':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-primary-50 border-primary-200'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading notifications...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {unreadCount > 0 ? (
                  <span className="font-semibold text-primary-600">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  'All caught up! 🎉'
                )}
              </p>
            </div>

            {selectedNotifications.size > 0 ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={deleteSelected}
                  disabled={actionLoading}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] active:scale-95 touch-manipulation"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedNotifications.size})
                  </span>
                </button>
                <button
                  onClick={() => setSelectedNotifications(new Set())}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm sm:text-base hover:bg-gray-300 transition-colors min-h-[44px] active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={actionLoading}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] active:scale-95 touch-manipulation"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] active:scale-95 touch-manipulation ${
                filter === 'all'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] active:scale-95 touch-manipulation ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] active:scale-95 touch-manipulation ${
                filter === 'read'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 sm:p-16 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? 'No read notifications yet.'
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Select All Checkbox */}
            {filteredNotifications.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={selectAll}
                    className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Select all ({filteredNotifications.length})
                  </span>
                </label>
              </div>
            )}

            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl border-2 p-4 sm:p-6 transition-all hover:shadow-lg animate-fade-in-up ${
                  getNotificationColor(notification.type, notification.read)
                } ${selectedNotifications.has(notification.id) ? 'ring-2 ring-primary-500' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => toggleSelection(notification.id)}
                    className="mt-1 w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />

                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={`text-base sm:text-lg font-bold mb-1 ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm sm:text-base mb-3 ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                      </div>

                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        {notification.read ? (
                          <button
                            onClick={() => markAsUnread(notification.id)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[32px] active:scale-95 touch-manipulation"
                          >
                            Mark unread
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors min-h-[32px] active:scale-95 touch-manipulation"
                          >
                            Mark read
                          </button>
                        )}
                        
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => markAsRead(notification.id)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors min-h-[32px] active:scale-95 touch-manipulation flex items-center gap-1"
                          >
                            View
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}

                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[32px] min-w-[32px] active:scale-95 touch-manipulation"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
