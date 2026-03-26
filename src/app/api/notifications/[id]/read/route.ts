import { authenticateRequest } from '@/lib/api-auth'
import type { Database } from '@/types/supabase.public.types'
import { sb } from '@lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH /api/notifications/:id/read - Mark notification as read
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // If this is a debug notification (not a UUID), just return success
    if (id.startsWith('debug-')) {
      return NextResponse.json({
        notification: {
          id,
          is_read: true,
          read_at: new Date().toISOString(),
        },
      })
    }

    const auth = await authenticateRequest(request)
    if (!auth.success) return auth.response

    const userId = auth.userId

    // Update notification (RLS ensures user can only update their own)
    const { data, error } = await sb
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error(
      'Unexpected error in PATCH /api/notifications/:id/read:',
      error,
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
