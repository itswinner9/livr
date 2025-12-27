import { SupabaseClient } from '@supabase/supabase-js'

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export interface SupabaseSafeError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export interface SupabaseSafeResult<T> {
  data: T | null
  error: SupabaseSafeError | null
  timedOut: boolean
  attemptCount: number
}

export interface SafeRequestOptions {
  timeoutMs?: number
  retries?: number
}

const DEFAULT_TIMEOUT = 5_000 // Reduced default timeout for faster failures
const DEFAULT_RETRIES = 0 // No retries by default for faster response

export function withTimeout<T>(
  promiseFactory: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false

    const timeoutId = setTimeout(() => {
      settled = true
      reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promiseFactory()
      .then((value) => {
        if (!settled) {
          clearTimeout(timeoutId)
          resolve(value)
        }
      })
      .catch((error) => {
        if (!settled) {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
  })
}

function normaliseError(error: any): SupabaseSafeError {
  if (!error) {
    return { message: 'Unknown error' }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (error instanceof TimeoutError) {
    return { message: error.message }
  }

  if (error.message || error.status || error.code) {
    return {
      message: error.message || 'Supabase request failed',
      status: error.status,
      code: error.code,
      details: error,
    }
  }

  try {
    return { message: JSON.stringify(error) }
  } catch {
    return { message: 'Supabase request failed' }
  }
}

export async function safeSupabaseRequest<T>(
  operation: () => Promise<T>,
  options: SafeRequestOptions = {}
): Promise<SupabaseSafeResult<T>> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT
  const retries = options.retries ?? DEFAULT_RETRIES

  let lastError: SupabaseSafeError | null = null
  let attempts = 0
  let timedOut = false

  while (attempts <= retries) {
    attempts += 1
    try {
      const data = await withTimeout(operation, timeoutMs)
      return {
        data,
        error: null,
        timedOut: false,
        attemptCount: attempts,
      }
    } catch (error: any) {
      timedOut = timedOut || error instanceof TimeoutError
      lastError = normaliseError(error)

      if (attempts > retries) {
        break
      }
    }
  }

  return {
    data: null,
    error: lastError,
    timedOut,
    attemptCount: attempts,
  }
}

type SelectBuilder =
  | ((builder: any) => any)
  | undefined

export async function safeSelect<T>(
  client: SupabaseClient,
  table: string,
  columns = '*',
  build?: SelectBuilder,
  options?: SafeRequestOptions
): Promise<SupabaseSafeResult<T>> {
  return safeSupabaseRequest<T>(async () => {
    const baseQuery = client.from(table).select(columns)
    const finalQuery = build ? build(baseQuery) : baseQuery
    const { data, error } = await finalQuery

    if (error) {
      throw error
    }

    return data as T
  }, options)
}


