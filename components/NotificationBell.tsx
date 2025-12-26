'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Fetch unread notification count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false)

      setUnreadCount(count || 0)

      // Fetch recent notifications
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setNotifications(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    fetchNotifications()
  }

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false)

    fetchNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_approved':
        return '✅'
      case 'review_pending':
        return '⏳'
      case 'admin_action':
        return '🔨'
      default:
        return '🔔'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link || '#'}
                  onClick={() => markAsRead(notification.id)}
                  className={`flex items-start px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="text-2xl mr-3">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <Link
                href="/notifications"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}




