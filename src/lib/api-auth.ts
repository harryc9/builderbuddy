import { sb } from '@lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'

type AuthResult =
  | { success: true; userId: string }
  | { success: false; response: NextResponse }

type TokenAuthResult =
  | { success: true; userId: string }
  | { success: false; error: string }

/**
 * Authenticate API requests using Bearer token from Authorization header
 *
 * @param request - Next.js request object
 * @returns AuthResult with userId on success, or error response on failure
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await authenticateRequest(request)
 *   if (!auth.success) return auth.response
 *
 *   const userId = auth.userId
 *   // ... proceed with authenticated request
 * }
 * ```
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthResult> {
  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const token = authHeader.substring(7)

  // Verify token and get user
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token)

  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    success: true,
    userId: user.id,
  }
}

/**
 * Authenticate Server Actions using Bearer token passed as parameter
 *
 * @param token - Access token from client session
 * @returns TokenAuthResult with userId on success, or error message on failure
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function myAction(token: string, data: string) {
 *   const auth = await authenticateToken(token)
 *   if (!auth.success) {
 *     return { success: false, error: auth.error }
 *   }
 *
 *   const userId = auth.userId
 *   // ... proceed with authenticated action
 * }
 * ```
 */
export async function authenticateToken(
  token: string,
): Promise<TokenAuthResult> {
  if (!token) {
    return {
      success: false,
      error: 'No token provided',
    }
  }

  // Verify token and get user
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token)

  if (authError || !user) {
    return {
      success: false,
      error: authError?.message || 'Unauthorized',
    }
  }

  return {
    success: true,
    userId: user.id,
  }
}
