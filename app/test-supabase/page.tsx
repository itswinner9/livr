'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...')
  const [details, setDetails] = useState<any>({})
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    const start = performance.now()
    const results: any = {
      env_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
      env_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING',
      client_side_blocked: false,
    }

    const withTimeout = async <T,>(promise: Promise<T>, label: string, timeoutMs = 15000): Promise<T> => {
      let timeoutId: NodeJS.Timeout
      return new Promise<T>((resolve, reject) => {
        timeoutId = setTimeout(() => {
          const error = new Error(`${label} timed out after ${timeoutMs}ms`)
          results[`${label}_timeout`] = true
          results.client_side_blocked = true
          reject(error)
        }, timeoutMs)

        promise
          .then((value) => {
            clearTimeout(timeoutId)
            resolve(value)
          })
          .catch((error) => {
            clearTimeout(timeoutId)
            reject(error)
          })
      })
    }

    // Test 1: Can we reach Supabase?
    try {
      const { data, error } = await withTimeout(
        supabase.from('user_profiles').select('count').limit(1),
        'database_connection'
      )
      results.database_connection = error ? 'ERROR: ' + error.message : 'SUCCESS'
      results.database_error = error || null
      results.database_rows = data || null
    } catch (e: any) {
      results.database_connection = results.database_connection || 'EXCEPTION: ' + e.message
      results.database_error = e?.message || e?.toString()
    }

    // Test 2: Can we check auth?
    try {
      const { data: session } = await withTimeout(supabase.auth.getSession(), 'auth_check')
      results.auth_check = session ? 'SUCCESS' : 'NO SESSION'
      results.auth_session = session || null
    } catch (e: any) {
      results.auth_check = results.auth_check || 'EXCEPTION: ' + e.message
      results.auth_check_error = e?.message || e?.toString()
    }

    // Test 3: Try a simple auth operation
    try {
      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'wrong',
      }), 'auth_test')
      results.auth_test = error ? 'Expected error (good): ' + error.message : 'Unexpected success'
      results.auth_test_response = { data, error }
    } catch (e: any) {
      results.auth_test = 'EXCEPTION: ' + e.message
      results.auth_test_error = e?.message || e?.toString()
    }

    const end = performance.now()
    const totalDuration = Math.round(end - start)
    results.duration_ms = totalDuration
    results.user_agent = navigator.userAgent
    setDuration(totalDuration)
    setDetails(results)

    if (results.env_url === 'MISSING' || results.env_key === 'MISSING') {
      setStatus('❌ FAILED: Environment variables missing')
    } else if (results.database_connection && results.database_connection.includes('ERROR')) {
      setStatus('❌ FAILED: Cannot connect to database')
    } else if (results.auth_test && results.auth_test.includes('EXCEPTION')) {
      setStatus('❌ FAILED: Auth not working')
    } else if (results.client_side_blocked) {
      setStatus('⚠️ TIMEOUT: Browser or network blocked the Supabase request')
    } else {
      setStatus('✅ SUCCESS: Supabase is configured correctly')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
          
          <div className={`p-4 rounded-lg mb-6 text-lg font-bold ${
            status.includes('SUCCESS') ? 'bg-green-100 text-green-800' : 
            status.includes('FAILED') ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
            {duration !== null && (
              <div className="text-sm font-normal text-gray-600 mt-2">
                Total duration: {duration} ms
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Test Results:</h2>
            
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded">
                <div className="font-semibold text-gray-700 mb-2">
                  {key.replace(/_/g, ' ').toUpperCase()}:
                </div>
                <div className="text-sm font-mono bg-white p-3 rounded border">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">What to do:</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>If ENV variables are MISSING: Create .env.local file and restart server</li>
              <li>If DATABASE connection fails: Check Supabase project is active</li>
              <li>If AUTH fails: Check Supabase anon key is correct</li>
              <li>Copy these results and share them for help</li>
            </ul>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={testConnection}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Run Test Again
            </button>
            <a
              href="/login"
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 inline-block"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


