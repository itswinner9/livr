import { supabase } from './supabase'

export interface UserStatus {
  isBlocked: boolean
  status: 'active' | 'warning' | 'cooled' | 'banned'
  reason?: string
  canPost: boolean
  canRate: boolean
  warnings: number
  bannedUntil?: Date
  cooledUntil?: Date
}

export async function checkUserStatus(userId: string): Promise<UserStatus> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('status, moderation_reason, warning_count, banned_until, cooled_until')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return {
        isBlocked: false,
        status: 'active',
        canPost: true,
        canRate: true,
        warnings: 0
      }
    }

    const now = new Date()
    const bannedUntil = profile.banned_until ? new Date(profile.banned_until) : null
    const cooledUntil = profile.cooled_until ? new Date(profile.cooled_until) : null

    const isBanned = profile.status === 'banned' && (!bannedUntil || bannedUntil > now)
    const isCooled = profile.status === 'cooled' && (!cooledUntil || cooledUntil > now)

    return {
      isBlocked: isBanned || isCooled,
      status: profile.status || 'active',
      reason: profile.moderation_reason,
      canPost: !isBanned && !isCooled,
      canRate: !isBanned && !isCooled,
      warnings: profile.warning_count || 0,
      bannedUntil: bannedUntil || undefined,
      cooledUntil: cooledUntil || undefined
    }
  } catch (error) {
    console.error('Error checking user status:', error)
    return {
      isBlocked: false,
      status: 'active',
      canPost: true,
      canRate: true,
      warnings: 0
    }
  }
}

export function getStatusMessage(status: UserStatus): string {
  if (status.status === 'banned' && status.bannedUntil) {
    return `Your account has been banned until ${status.bannedUntil.toLocaleDateString()}. Reason: ${status.reason}`
  } else if (status.status === 'banned') {
    return `Your account has been permanently banned. Reason: ${status.reason}`
  } else if (status.status === 'cooled' && status.cooledUntil) {
    return `You are in a cooling off period until ${status.cooledUntil.toLocaleDateString()}. Reason: ${status.reason}`
  } else if (status.status === 'cooled') {
    return `You are in a cooling off period. Reason: ${status.reason}`
  } else if (status.warnings > 0) {
    return `You have ${status.warnings} warning(s). Please review our community guidelines.`
  }
  return ''
}



