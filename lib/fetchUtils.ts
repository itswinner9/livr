/**
 * Safe data fetching utilities with error handling, retries, and timeouts
 */

import { supabase } from './supabase'

export interface FetchOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface FetchResult<T> {
  data: T | null
  error: Error | null
  success: boolean
}

/**
 * Safe fetch with timeout and error handling
 */
export async function safeFetch<T>(
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { timeout = 10000, retries = 2, retryDelay = 1000 } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      })

      // Race between fetch and timeout
      const result = await Promise.race([
        fetchFn(),
        timeoutPromise,
      ])

      if (result.error) {
        lastError = new Error(result.error.message || 'Database error')
        // Don't retry on certain errors
        if (result.error.code === 'PGRST116' || result.error.code === '23505') {
          break
        }
        // Retry on other errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
          continue
        }
      } else {
        return {
          data: result.data,
          error: null,
          success: true,
        }
      }
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }
    }
  }

  return {
    data: null,
    error: lastError,
    success: false,
  }
}

/**
 * Safe parallel fetch - fetch multiple queries in parallel with error handling
 */
export async function safeParallelFetch<T extends Record<string, any>>(
  queries: { [K in keyof T]: () => Promise<{ data: any; error: any }> },
  options: FetchOptions = {}
): Promise<{ [K in keyof T]: FetchResult<T[K]> }> {
  const entries = Object.entries(queries) as [keyof T, () => Promise<{ data: any; error: any }>][]
  
  const results = await Promise.allSettled(
    entries.map(([key, queryFn]) => safeFetch(queryFn, options))
  )

  const output: any = {}
  entries.forEach(([key], index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      output[key] = result.value
    } else {
      output[key] = {
        data: null,
        error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
        success: false,
      }
    }
  })

  return output
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<{ user: any; session: any; error: Error | null }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { user: null, session: null, error: new Error(error.message) }
    }
    
    if (!session) {
      return { user: null, session: null, error: null }
    }
    
    return { user: session.user, session, error: null }
  } catch (error: any) {
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error(String(error)) 
    }
  }
}

/**
 * Check if user is admin
 */
export async function checkAdmin(userId: string): Promise<{ isAdmin: boolean; error: Error | null }> {
  const result = await safeFetch(
    () => supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle(),
    { timeout: 5000, retries: 1 }
  )

  if (result.error) {
    return { isAdmin: false, error: result.error }
  }

  return { isAdmin: result.data?.is_admin === true, error: null }
}

/**
 * Get user profile safely
 */
export async function getUserProfile(userId: string) {
  return safeFetch(
    () => supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    { timeout: 5000, retries: 1 }
  )
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Check if component is mounted (for cleanup)
 */
export function useIsMounted() {
  const mountedRef = { current: true }
  
  return () => {
    mountedRef.current = false
  }
}


