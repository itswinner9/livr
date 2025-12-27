'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let redirectTimeout: NodeJS.Timeout | null = null
    let isProcessing = false

    const processAuth = async () => {
      if (isProcessing) {
        console.log('⚠️ Already processing, skipping...')
        return
      }
      isProcessing = true

      try {
        // Get URL parameters
        const hash = window.location.hash
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('🔍 Auth callback started:', { 
          hasHash: !!hash, 
          hasCode: !!code, 
          error: errorParam,
          url: window.location.href.substring(0, 150)
        })

        // Handle OAuth errors first
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          if (mounted) {
            setError(errorDescription || errorParam || 'Authentication failed')
            setStatus('Authentication failed')
          }
          redirectTimeout = setTimeout(() => {
            window.location.href = '/login?error=auth_failed'
          }, 2000)
          return
        }

        // Handle hash-based OAuth (implicit flow) - DEPRECATED, but handle gracefully
        if (hash && hash.includes('access_token')) {
          if (mounted) setStatus('Setting up your session...')
          
          const hashBefore = hash
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          
          const hashParams = new URLSearchParams(hashBefore.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          console.log('🔑 Found tokens in hash:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken 
          })
          
          if (accessToken && refreshToken) {
            try {
              console.log('🔐 Setting session from hash...')
              
              // Set timeout for this operation (5 seconds max)
              const sessionPromise = supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })
              
              const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Session setup timed out')), 5000)
              )
              
              const result = await Promise.race([sessionPromise, timeoutPromise])
              const { data, error: sessionError } = result as any
              
              if (sessionError) {
                console.error('❌ Session error:', sessionError)
                throw sessionError
              }
              
              if (data?.session) {
                console.log('✅ Session created from hash! User:', data.session.user.email)
                // Redirect immediately - don't wait
                window.location.replace('/')
                return
              } else {
                throw new Error('No session returned from hash')
              }
            } catch (err: any) {
              console.error('❌ Error setting session from hash:', err)
              // Redirect immediately on error
              window.location.href = '/login?error=auth_failed'
              return
            }
          } else {
            console.error('❌ Missing tokens in hash')
            // Redirect immediately on error
            window.location.href = '/login?error=auth_failed'
            return
          }
        }
        
        // Handle code-based OAuth (PKCE flow) - Preferred method
        if (code) {
          if (mounted) setStatus('Exchanging authorization code...')
          
          try {
            console.log('🔐 Exchanging code for session...')
            
            // Set timeout for this operation (5 seconds max)
            const exchangePromise = supabase.auth.exchangeCodeForSession(code)
            
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Code exchange timed out')), 5000)
            )
            
            const result = await Promise.race([exchangePromise, timeoutPromise])
            const { data, error: codeError } = result as any
            
            if (codeError) {
              console.error('❌ Code exchange error:', codeError)
              throw codeError
            }
            
            if (data?.session) {
              console.log('✅ Code exchanged successfully! User:', data.session.user.email)
              // Redirect immediately - don't wait
              window.location.replace('/')
              return
            } else {
              throw new Error('No session returned from code exchange')
            }
          } catch (err: any) {
            console.error('❌ Error exchanging code:', err)
            // Redirect immediately on error
            window.location.href = '/login?error=auth_failed'
            return
          }
        }
        
        // No hash or code - check if already authenticated (quick check, 3 seconds max)
        console.log('⚠️ No hash or code found, checking existing session...')
        if (mounted) setStatus('Checking existing session...')
        
        try {
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Session check timed out')), 3000)
          )
          
          const result = await Promise.race([sessionPromise, timeoutPromise])
          const { data: { session }, error: sessionError } = result as any
          
          if (sessionError) {
            console.error('❌ Error checking session:', sessionError)
            throw sessionError
          }
          
          if (session) {
            console.log('✅ Already authenticated, redirecting...')
            window.location.replace('/')
            return
          }
        } catch (err: any) {
          console.error('❌ Error checking session:', err)
        }
        
        // No session found - redirect to login immediately
        console.log('❌ No authentication found - redirecting to login')
        window.location.href = '/login?error=no_auth'
        
      } catch (err: any) {
        console.error('❌ Unexpected error in callback:', err)
        if (mounted) {
          setError(err.message || 'An unexpected error occurred')
          setStatus('Authentication failed')
        }
        redirectTimeout = setTimeout(() => {
          window.location.href = '/login?error=auth_failed'
        }, 2000)
      } finally {
        isProcessing = false
      }
    }

    // Start processing immediately
    const timer = setTimeout(() => {
      processAuth()
    }, 100)

    // Safety timeout - redirect after 8 seconds if still processing (reduced from 10s)
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout (8s) - redirecting to login')
      window.location.href = '/login?error=timeout'
    }, 8000)

    return () => {
      mounted = false
      clearTimeout(timer)
      clearTimeout(safetyTimeout)
      if (redirectTimeout) clearTimeout(redirectTimeout)
      isProcessing = false
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-transparent border-t-primary-600 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-700 font-semibold text-lg mb-2">{status}</p>
        <p className="text-gray-500 text-sm mb-4">Please wait...</p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 animate-fade-in">
            <p className="text-red-700 text-sm font-medium mb-2">Error: {error}</p>
            <p className="text-red-600 text-xs">Redirecting to login...</p>
          </div>
        )}
        {/* Progress indicator */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
