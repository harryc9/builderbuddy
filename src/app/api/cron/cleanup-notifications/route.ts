import { cleanupExpiredNotifications } from '@/lib/notifications'
import { type NextRequest, NextResponse } from 'next/server'

// This endpoint is called daily by Vercel Cron to cleanup expired notifications
export async function GET(request: NextRequest) {
  try {
    // Verify the cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cleanup expired notifications
    await cleanupExpiredNotifications()

    return NextResponse.json({
      success: true,
      message: 'Notification cleanup completed',
    })
  } catch (error) {
    console.error('Error in notification cleanup cron:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
