import { sbc } from '@/lib/supabase.client'

/**
 * Make an authenticated API request with automatic Bearer token injection
 *
 * @param url - The API endpoint URL
 * @param options - Standard fetch options
 * @returns Fetch response
 * @throws Error if not authenticated
 *
 * @example
 * ```ts
 * const response = await authenticatedFetch('/api/notifications', {
 *   method: 'GET',
 * })
 * ```
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  // Get session token
  const {
    data: { session },
  } = await sbc.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  // Merge authorization header with any existing headers
  const headers = new Headers(options?.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)

  return fetch(url, {
    ...options,
    headers,
  })
}
