import { authenticateRequest } from '@/lib/api-auth'
import { sb } from '@lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'

// Helper to get debug override from request
function getDebugOverride(request: NextRequest) {
  const debugHeader = request.headers.get('x-debug-override')
  if (debugHeader) {
    try {
      return JSON.parse(debugHeader)
    } catch {
      return null
    }
  }
  return null
}

// Helper to generate fake notifications for debug mode
function generateDebugNotifications(debugOverride: any, userId: string) {
  const notifications: any[] = []
  const status = debugOverride.subscription_status
  const now = new Date().toISOString()

  // Subscription-related notifications
  if (status === 'trialing' && debugOverride.trial_end) {
    // Calculate days left using the debug trial_end
    const trialEnd = new Date(debugOverride.trial_end)
    const diffMs = trialEnd.getTime() - Date.now()
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const trialEndDate = trialEnd.toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    })

    if (daysLeft > 1) {
      notifications.push({
        id: 'debug-trial-active',
        user_id: userId,
        notification_type: 'trial_active',
        severity: 'info',
        title: 'Trial Active',
        description: `${daysLeft} days remaining in your trial. You'll be charged $29 on ${trialEndDate}.`,
        action_url: '#',
        action_label: 'Manage Subscription',
        is_read: false,
        is_dismissed: false,
        read_at: null,
        dismissed_at: null,
        metadata: {
          days_left: daysLeft,
          trial_end_date: debugOverride.trial_end,
        },
        expires_at: debugOverride.trial_end,
        created_at: now,
        updated_at: now,
      })
    } else if (daysLeft === 1) {
      notifications.push({
        id: 'debug-trial-ending',
        user_id: userId,
        notification_type: 'trial_ending',
        severity: 'warning',
        title: 'Trial Ending Soon',
        description:
          "Your trial ends tomorrow. You'll be charged $29 unless you cancel.",
        action_url: '#',
        action_label: 'Manage Subscription',
        is_read: false,
        is_dismissed: false,
        read_at: null,
        dismissed_at: null,
        metadata: { days_left: 1, trial_end_date: debugOverride.trial_end },
        expires_at: debugOverride.trial_end,
        created_at: now,
        updated_at: now,
      })
    } else if (daysLeft <= 0) {
      notifications.push({
        id: 'debug-trial-expired',
        user_id: userId,
        notification_type: 'trial_expired',
        severity: 'critical',
        title: 'Trial Expired',
        description: 'Your trial has ended. Update payment method to continue.',
        action_url: '#',
        action_label: 'Add Payment Method',
        is_read: false,
        is_dismissed: false,
        read_at: null,
        dismissed_at: null,
        metadata: { days_left: 0, trial_end_date: debugOverride.trial_end },
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: now,
        updated_at: now,
      })
    }
  } else if (status === 'past_due') {
    notifications.push({
      id: 'debug-payment-failed',
      user_id: userId,
      notification_type: 'payment_failed',
      severity: 'critical',
      title: 'Payment Failed',
      description: 'Update your payment method to continue access.',
      action_url: '#',
      action_label: 'Update Payment Method',
      is_read: false,
      is_dismissed: false,
      read_at: null,
      dismissed_at: null,
      metadata: { subscription_status: status },
      expires_at: debugOverride.subscription_current_period_end
        ? new Date(
            new Date(debugOverride.subscription_current_period_end).getTime() +
              3 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : null,
      created_at: now,
      updated_at: now,
    })
  }

  // Setup-related notifications
  if (debugOverride.hasServiceArea === false) {
    notifications.push({
      id: 'debug-setup-missing-address',
      user_id: userId,
      notification_type: 'setup_missing_address',
      severity: 'info',
      title: 'Set Your Service Area',
      description:
        'Add your service area to receive permit notifications near you.',
      action_url: '#',
      action_label: 'Set Service Area',
      is_read: false,
      is_dismissed: false,
      read_at: null,
      dismissed_at: null,
      metadata: { has_address: false },
      expires_at: null,
      created_at: now,
      updated_at: now,
    })
  }

  if (debugOverride.hasCategories === false) {
    notifications.push({
      id: 'debug-setup-missing-categories',
      user_id: userId,
      notification_type: 'setup_missing_categories',
      severity: 'info',
      title: 'Select Trade Categories',
      description:
        'Choose the trade categories you want to receive notifications for.',
      action_url: '#',
      action_label: 'Select Categories',
      is_read: false,
      is_dismissed: false,
      read_at: null,
      dismissed_at: null,
      metadata: { has_categories: false },
      expires_at: null,
      created_at: now,
      updated_at: now,
    })
  }

  return notifications
}

// GET /api/notifications - Fetch active notifications for current user
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success) return auth.response

    const userId = auth.userId

    // Check for debug override
    const debugOverride = getDebugOverride(request)

    if (debugOverride) {
      // Return fake notifications based on debug state
      const debugNotifications = generateDebugNotifications(
        debugOverride,
        userId,
      )
      return NextResponse.json({ notifications: debugNotifications })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Build query
    let query = sb
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    // Filter by unread if requested
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // Execute query
    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 },
      )
    }

    // Sort by severity priority then created_at
    const severityOrder = { critical: 1, warning: 2, info: 3 }
    const sorted = notifications.sort((a, b) => {
      const severityDiff =
        severityOrder[a.severity as keyof typeof severityOrder] -
        severityOrder[b.severity as keyof typeof severityOrder]
      if (severityDiff !== 0) return severityDiff
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      )
    })

    return NextResponse.json({ notifications: sorted })
  } catch (error) {
    console.error('Unexpected error in GET /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
