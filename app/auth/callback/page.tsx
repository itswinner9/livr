'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/supabaseSafe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isProcessing = false
    let redirectTimeout: NodeJS.Timeout | null = null

    const processAuth = async () => {
      // Prevent multiple executions
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
          hashLength: hash?.length,
          url: window.location.href.substring(0, 100)
        })

        // Handle OAuth errors first
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          setError(errorDescription || errorParam || 'Authentication failed')
          setStatus('Authentication failed')
          redirectTimeout = setTimeout(() => {
            window.location.href = '/login?error=auth_failed'
          }, 2000)
          return
        }

        // Handle hash-based OAuth (implicit flow) - Google sometimes uses this
        if (hash && hash.includes('access_token')) {
          setStatus('Setting up your session...')
          
          // Save hash before clearing
          const hashBefore = hash
          
          // Clear hash from URL immediately to prevent re-processing
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
              setStatus('Setting up your session...')
              
              const sessionResult = await withTimeout(
                () => supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                }),
                8000
              )
              
              const { data, error: sessionError } = sessionResult
              
              if (sessionError) {
                console.error('❌ Session error:', sessionError)
                throw sessionError
              }
              
              if (data?.session) {
                console.log('✅ Session created from hash! User:', data.session.user.email)
                setStatus('Login successful! Redirecting...')
                
                // Redirect immediately - session is already set
                window.location.replace('/')
                return
              } else {
                throw new Error('No session returned from hash')
              }
            } catch (err: any) {
              console.error('❌ Error setting session from hash:', err)
              setError(err.message || 'Failed to set session')
              setStatus('Authentication failed')
              redirectTimeout = setTimeout(() => {
                window.location.href = '/login?error=auth_failed'
              }, 2000)
              return
            }
          } else {
            console.error('❌ Missing tokens in hash')
            setError('Missing authentication tokens in URL')
            setStatus('Authentication failed')
            redirectTimeout = setTimeout(() => {
              window.location.href = '/login?error=auth_failed'
            }, 2000)
            return
          }
        }
        
        // Handle code-based OAuth (PKCE flow) - Preferred method
        if (code) {
          setStatus('Exchanging authorization code...')
          
          try {
            console.log('🔐 Exchanging code for session...')
            
            const exchangeResult = await withTimeout(
              () => supabase.auth.exchangeCodeForSession(code),
              8000
            )
            
            const { data, error: codeError } = exchangeResult
            
            if (codeError) {
              console.error('❌ Code exchange error:', codeError)
              throw codeError
            }
            
            if (data?.session) {
              console.log('✅ Code exchanged successfully! User:', data.session.user.email)
              setStatus('Login successful! Redirecting...')
              
              // Redirect immediately - session is already set
              window.location.replace('/')
              return
            } else {
              throw new Error('No session returned from code exchange')
            }
          } catch (err: any) {
            console.error('❌ Error exchanging code:', err)
            const errorMsg = err.message?.includes('timed out') 
              ? 'Request timed out. Please try again.'
              : (err.message || 'Failed to exchange authorization code')
            setError(errorMsg)
            setStatus('Authentication failed')
            redirectTimeout = setTimeout(() => {
              window.location.href = '/login?error=auth_failed'
            }, 2000)
            return
          }
        }
        
        // No hash or code - check if already authenticated
        console.log('⚠️ No hash or code found, checking existing session...')
        setStatus('Checking existing session...')
        
        try {
          const sessionResult = await withTimeout(
            () => supabase.auth.getSession(),
            5000
          )
          
          const { data: { session }, error: sessionError } = sessionResult
          
          if (sessionError) {
            console.error('❌ Error checking session:', sessionError)
            throw sessionError
          }
          
          if (session) {
            console.log('✅ Already authenticated, redirecting...')
            setStatus('Redirecting...')
            window.location.replace('/')
            return
          }
        } catch (err: any) {
          console.error('❌ Error checking session:', err)
        }
        
        // No session found - redirect to login
        console.log('❌ No authentication found - redirecting to login')
        setError('No authentication information found')
        setStatus('Redirecting to login...')
        redirectTimeout = setTimeout(() => {
          window.location.href = '/login?error=no_auth'
        }, 2000)
        
      } catch (err: any) {
        console.error('❌ Unexpected error in callback:', err)
        setError(err.message || 'An unexpected error occurred')
        setStatus('Authentication failed')
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
    }, 50)

    // Safety timeout - redirect after 6 seconds if still processing (reduced from 10s)
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout (6s) - redirecting to home')
      setError('Authentication timed out. Please try again.')
      setStatus('Redirecting...')
      window.location.href = '/login?error=timeout'
    }, 6000)

    return () => {
      clearTimeout(timer)
      clearTimeout(safetyTimeout)
      if (redirectTimeout) clearTimeout(redirectTimeout)
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
