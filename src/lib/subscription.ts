import type { Database } from '@/types/supabase.public.types'
import { isStripeTestMode, stripeColumns } from './stripe-env'

type User = Database['public']['Tables']['users']['Row']

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | null

/**
 * Debug override type - extends User with additional debug-only properties
 */
type DebugOverride = Partial<User> & {
  hasServiceArea?: boolean
  hasCategories?: boolean
}

/**
 * Check if debug override is active (for testing)
 * Exported for use in other components
 */
/**
 * Check if debug override is active
 * Used to test different subscription states without modifying Stripe
 */
export function hasDebugOverride(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('subscription_debug_override') !== null
}

/**
 * Get debug override from localStorage (for testing different subscription states)
 * Only works for admin users or in development mode
 */
function getDebugOverride(user: User | null): DebugOverride | null {
  if (typeof window === 'undefined') return null
  if (!user?.admin && process.env.NODE_ENV !== 'development') return null

  try {
    const override = localStorage.getItem('subscription_debug_override')
    if (override) {
      return JSON.parse(override)
    }
  } catch (e) {
    console.error('Failed to parse subscription debug override:', e)
  }
  return null
}

/**
 * Apply debug override to user data (for testing)
 */
function applyDebugOverride(user: User | null): User | null {
  if (!user) return null

  const override = getDebugOverride(user)
  if (!override) return user

  const result: User = {
    ...user,
    ...override,
    // Always preserve admin status
    admin: user.admin,
  }

  // Handle hasServiceArea override
  if (override.hasServiceArea === false) {
    result.address = null
    result.address_lat = null
    result.address_lng = null
  }

  // Handle hasCategories override
  if (override.hasCategories === false) {
    result.subscribed_categories = []
  }

  return result
}

/**
 * Get effective user data with debug override applied (for testing)
 * This is the public version of applyDebugOverride
 */
export function getEffectiveUser(user: User | null): User | null {
  return applyDebugOverride(user)
}

/**
 * FALLBACK ONLY: Checks subscription access using database values
 *
 * ⚠️ WARNING: Database values may be stale. This should ONLY be used as:
 * 1. Fallback when API fails (graceful degradation)
 * 2. Debug override scenarios (testing)
 * 3. Optimistic UI checks (non-critical)
 *
 * For critical access control, ALWAYS use `/api/subscription/verify` endpoint first.
 * The API calls Stripe directly and is the source of truth.
 *
 * @param user - User object from database
 * @returns boolean - Whether user has access based on DATABASE values (may be stale)
 */
export function hasSubscriptionAccessFallback(user: User | null): boolean {
  if (!user) return false

  // Check if there's an active debug override
  const debugOverride = getDebugOverride(user)

  // Admin always has access UNLESS they have a debug override active (for testing)
  if (user.admin && !debugOverride) return true

  // Apply debug override if exists (for testing)
  const effectiveUser = applyDebugOverride(user)
  if (!effectiveUser) return false

  // CRITICAL: Check if subscription ID exists for the current environment
  // In test mode, check stripe_subscription_id_test; in prod, check stripe_subscription_id
  const subscriptionId = isStripeTestMode
    ? effectiveUser[stripeColumns.subscription_id as keyof User]
    : effectiveUser[stripeColumns.subscription_id as keyof User]

  // No subscription ID = no subscription = no access
  if (!subscriptionId) {
    return false
  }

  const status = effectiveUser.subscription_status

  // Get the correct trial_end column based on environment
  const trialEnd = isStripeTestMode
    ? effectiveUser[stripeColumns.trial_end as keyof User]
    : effectiveUser[stripeColumns.trial_end as keyof User]

  const now = new Date()

  // Active paid subscription
  if (status === 'active') {
    return true
  }

  // Trial period - check if still within trial window
  if (status === 'trialing' && trialEnd && typeof trialEnd === 'string') {
    return now < new Date(trialEnd)
  }

  // All other statuses: no access
  return false
}

/**
 * Get days remaining in trial
 */
export function getDaysLeftInTrial(user: User | null): number {
  if (!user) return 0

  // Apply debug override if exists
  const effectiveUser = applyDebugOverride(user)
  if (!effectiveUser) return 0

  const trialEnd = isStripeTestMode
    ? effectiveUser[stripeColumns.trial_end as keyof User]
    : effectiveUser[stripeColumns.trial_end as keyof User]

  if (
    effectiveUser.subscription_status !== 'trialing' ||
    !trialEnd ||
    typeof trialEnd !== 'string'
  ) {
    return 0
  }

  const now = new Date()
  const trialEndDate = new Date(trialEnd)
  const diffMs = trialEndDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.admin === true
}

/**
 * Get formatted trial end date
 */
export function getTrialEndDate(user: User | null): string | null {
  if (!user) return null

  // Apply debug override if exists
  const effectiveUser = applyDebugOverride(user)

  const trialEnd = isStripeTestMode
    ? effectiveUser?.[stripeColumns.trial_end as keyof User]
    : effectiveUser?.[stripeColumns.trial_end as keyof User]

  if (!trialEnd || typeof trialEnd !== 'string') return null

  const trialEndDate = new Date(trialEnd)
  return trialEndDate.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  })
}

/**
 * Get subscription status message for UI
 */
export function getSubscriptionStatusMessage(user: User | null): {
  message: string
  variant: 'default' | 'warning' | 'destructive'
  showManageLink: boolean
} {
  if (!user) {
    return {
      message: 'Please sign in',
      variant: 'default',
      showManageLink: false,
    }
  }

  // Check if admin has debug override active
  const hasDebugOverride = user.admin && getDebugOverride(user) !== null

  // For admins WITHOUT debug override, show admin message
  if (user.admin && !hasDebugOverride) {
    return {
      message: '👑 Admin Access',
      variant: 'default',
      showManageLink: false,
    }
  }

  // Apply debug override (for admins with override OR non-admins)
  const effectiveUser = applyDebugOverride(user)
  if (!effectiveUser) {
    return {
      message: 'Please sign in',
      variant: 'default',
      showManageLink: false,
    }
  }

  const status = effectiveUser.subscription_status
  const daysLeft = getDaysLeftInTrial(user)

  if (status === 'trialing' && daysLeft > 1) {
    const chargeDate = getTrialEndDate(user)
    return {
      message: `🎉 Trial active: ${daysLeft} days remaining. You'll be charged $29 on ${chargeDate}.`,
      variant: 'default',
      showManageLink: true,
    }
  }

  if (status === 'trialing' && daysLeft === 1) {
    return {
      message: `⏰ Trial active: 1 day remaining. You'll be charged $29 tomorrow.`,
      variant: 'warning',
      showManageLink: true,
    }
  }

  if (status === 'active') {
    const periodEnd = isStripeTestMode
      ? effectiveUser[
          stripeColumns.subscription_current_period_end as keyof User
        ]
      : effectiveUser[
          stripeColumns.subscription_current_period_end as keyof User
        ]

    if (periodEnd) {
      const nextBilling = new Date(periodEnd as string).toLocaleDateString(
        'en-CA',
      )
      return {
        message: `✅ Subscribed - Next billing date: ${nextBilling}`,
        variant: 'default',
        showManageLink: true,
      }
    }
  }

  if (status === 'past_due') {
    return {
      message: `⚠️ Payment failed - Please update your payment method to continue access`,
      variant: 'destructive',
      showManageLink: true,
    }
  }

  return {
    message: 'No active subscription',
    variant: 'destructive',
    showManageLink: false,
  }
}
