import { authenticateRequest } from '@/lib/api-auth'
import type { Database } from '@/types/supabase.public.types'
import { sb } from '@lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success) return auth.response

    const userId = auth.userId

    // Update all unread, non-dismissed notifications
    const { data, error } = await sb
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .select()

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      count: data?.length || 0,
      notifications: data,
    })
  } catch (error) {
    console.error(
      'Unexpected error in PATCH /api/notifications/read-all:',
      error,
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
