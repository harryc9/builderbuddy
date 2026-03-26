import {
  getDaysLeftInTrial,
  getTrialEndDate,
  isAdmin,
} from '@/lib/subscription'
import type { Database } from '@/types/supabase.public.types'
import { sb } from '@lib/supabase'

type NotificationInsert =
  Database['public']['Tables']['user_notifications']['Insert']

/**
 * Dismiss all notifications of specific types for a user
 */
async function dismissNotificationTypes(
  userId: string,
  types: string[],
): Promise<void> {
  await sb
    .from('user_notifications')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('notification_type', types)
    .eq('is_dismissed', false)
}

/**
 * Create a new notification (upsert to prevent duplicates)
 */
async function createNotification(
  notification: NotificationInsert,
): Promise<void> {
  // First dismiss any existing notification of the same type
  await dismissNotificationTypes(notification.user_id, [
    notification.notification_type,
  ])

  // Create new notification
  const { error } = await sb.from('user_notifications').insert(notification)

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Sync subscription-related notifications for a user based on current subscription state
 */
export async function syncSubscriptionNotifications(
  userId: string,
): Promise<void> {
  // Fetch user data
  const { data: user, error } = await sb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.error('Error fetching user for notification sync:', error)
    return
  }

  // Skip notifications for admin users (they bypass payment checks)
  if (isAdmin(user)) {
    // Clear any existing subscription notifications for admins
    await dismissNotificationTypes(userId, [
      'trial_active',
      'trial_ending',
      'trial_expired',
      'payment_failed',
    ])
    return
  }

  // Clear old subscription-related notifications
  await dismissNotificationTypes(userId, [
    'trial_active',
    'trial_ending',
    'trial_expired',
    'payment_failed',
  ])

  // Generate new notifications based on current subscription state
  const status = user.subscription_status

  if (status === 'trialing' && user.trial_end) {
    const daysLeft = getDaysLeftInTrial(user)
    const trialEndDate = getTrialEndDate(user)
    const trialEndTimestamp = user.trial_end

    if (daysLeft > 1) {
      // Trial active (more than 1 day left)
      // Expires when trial ends
      await createNotification({
        user_id: userId,
        notification_type: 'trial_active',
        severity: 'info',
        title: 'Trial Active',
        description: `${daysLeft} days remaining in your trial. You'll be charged $29 on ${trialEndDate}.`,
        action_url: '#',
        action_label: 'Manage Subscription',
        metadata: {
          days_left: daysLeft,
          trial_end_date: trialEndTimestamp,
        },
        expires_at: trialEndTimestamp,
      })
    } else if (daysLeft === 1) {
      // Trial ending soon (1 day left)
      // Expires when trial ends
      await createNotification({
        user_id: userId,
        notification_type: 'trial_ending',
        severity: 'warning',
        title: 'Trial Ending Soon',
        description:
          "Your trial ends tomorrow. You'll be charged $29 unless you cancel.",
        action_url: '#',
        action_label: 'Manage Subscription',
        metadata: {
          days_left: 1,
          trial_end_date: trialEndTimestamp,
        },
        expires_at: trialEndTimestamp,
      })
    } else if (daysLeft === 0) {
      // Trial expired
      // Expires 7 days after trial end (give them time to see it and take action)
      const expiryDate = new Date(trialEndTimestamp)
      expiryDate.setDate(expiryDate.getDate() + 7)

      await createNotification({
        user_id: userId,
        notification_type: 'trial_expired',
        severity: 'critical',
        title: 'Trial Expired',
        description: 'Your trial has ended. Update payment method to continue.',
        action_url: '#',
        action_label: 'Add Payment Method',
        metadata: {
          days_left: 0,
          trial_end_date: trialEndTimestamp,
        },
        expires_at: expiryDate.toISOString(),
      })
    }
  } else if (status === 'past_due') {
    // Payment failed - immediate notification
    await createNotification({
      user_id: userId,
      notification_type: 'payment_failed',
      severity: 'critical',
      title: 'Payment Failed',
      description: 'Update your payment method to continue access.',
      action_url: '#',
      action_label: 'Update Payment Method',
      metadata: {
        subscription_status: status,
      },
    })
  } else if (status === 'active') {
    // Active subscription - no notification needed
    // Notifications already cleared above
  }
}

/**
 * Check if user has incomplete setup and create notification if needed
 */
export async function syncSetupNotifications(userId: string): Promise<void> {
  // Fetch user data
  const { data: user, error } = await sb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.error('Error fetching user for setup notification sync:', error)
    return
  }

  const hasAddress = Boolean(
    user.address && user.address_lat && user.address_lng,
  )
  const hasCategories = Boolean(
    user.subscribed_categories && user.subscribed_categories.length > 0,
  )

  // Create separate notification for missing service area
  if (!hasAddress) {
    await createNotification({
      user_id: userId,
      notification_type: 'setup_missing_address',
      severity: 'info',
      title: 'Set Your Service Area',
      description:
        'Add your service area to receive permit notifications near you.',
      action_url: '#',
      action_label: 'Set Service Area',
      metadata: {
        has_address: false,
      },
      expires_at: undefined, // Never expires
    })
  } else {
    // Has address, dismiss notification
    await dismissNotificationTypes(userId, ['setup_missing_address'])
  }

  // Create separate notification for missing categories
  if (!hasCategories) {
    await createNotification({
      user_id: userId,
      notification_type: 'setup_missing_categories',
      severity: 'info',
      title: 'Select Trade Categories',
      description:
        'Choose the trade categories you want to receive notifications for.',
      action_url: '#',
      action_label: 'Select Categories',
      metadata: {
        has_categories: false,
      },
      expires_at: undefined, // Never expires
    })
  } else {
    // Has categories, dismiss notification
    await dismissNotificationTypes(userId, ['setup_missing_categories'])
  }

  // Dismiss old combined setup notification if it exists
  await dismissNotificationTypes(userId, ['setup_incomplete'])
}

/**
 * Sync all notifications for a user (subscription + setup)
 */
export async function syncAllNotifications(userId: string): Promise<void> {
  await Promise.all([
    syncSubscriptionNotifications(userId),
    syncSetupNotifications(userId),
  ])
}

/**
 * Cleanup expired notifications (to be run via cron job)
 */
export async function cleanupExpiredNotifications(): Promise<void> {
  const { error } = await sb
    .from('user_notifications')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .lt('expires_at', new Date().toISOString())
    .eq('is_dismissed', false)

  if (error) {
    console.error('Error cleaning up expired notifications:', error)
  }
}
