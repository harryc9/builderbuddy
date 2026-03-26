/**
 * Stripe Environment Helper
 *
 * In development/test, uses test mode columns and test keys.
 * In production, uses production columns and live keys.
 */

const isTestMode =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

/**
 * Get the appropriate column name based on environment
 */
export const stripeColumns = {
  customer_id: isTestMode ? 'stripe_customer_id_test' : 'stripe_customer_id',
  subscription_id: isTestMode
    ? 'stripe_subscription_id_test'
    : 'stripe_subscription_id',
  subscription_current_period_end: isTestMode
    ? 'subscription_current_period_end_test'
    : 'subscription_current_period_end',
  trial_start: isTestMode ? 'trial_start_test' : 'trial_start',
  trial_end: isTestMode ? 'trial_end_test' : 'trial_end',
} as const

/**
 * Check if we're in test mode
 */
export const isStripeTestMode = isTestMode

/**
 * Get the Stripe mode label for logging
 */
export const stripeModeLabel = isTestMode ? 'TEST' : 'LIVE'
