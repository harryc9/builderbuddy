import { authenticateRequest } from '@/lib/api-auth'
import { sb } from '@lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * GET /api/permits/actions/count
 *
 * Get count of saved or ignored permits for current user
 * Used for badge display in view toggle
 *
 * Query params:
 * - action: 'saved' | 'ignored'
 *
 * Returns:
 * {
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const auth = await authenticateRequest(request)
  if (!auth.success) return auth.response

  const userId = auth.userId

  try {
    // 2. Parse action type
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (!action || (action !== 'saved' && action !== 'ignored')) {
      return NextResponse.json(
        { error: 'Invalid action parameter. Must be "saved" or "ignored"' },
        { status: 400 },
      )
    }

    // 3. Get count
    const { count, error } = await sb
      .from('user_permit_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to count actions' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { count: count || 0 },
      {
        headers: {
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
