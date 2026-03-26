import { authenticateRequest } from '@/lib/api-auth'
import { stripe } from '@/lib/stripe'
import { stripeColumns } from '@/lib/stripe-env'
import { sb } from '@lib/supabase'
import { DateTime } from 'luxon'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Real-time subscription verification with Stripe API
 *
 * This endpoint:
 * 1. Checks if user has a subscription ID in the database
 * 2. If yes, verifies it's still valid with Stripe API in real-time
 * 3. Returns current access status AND subscription history
 * 4. Helps determine if user is a "returning subscriber" (had subscription before but expired)
 *
 * This is more robust than just checking database values.
 */
export async function GET(request: NextRequest) {
  // Authenticate using Bearer token
  const auth = await authenticateRequest(request)
  if (!auth.success) return auth.response

  const userId = auth.userId

  try {
    // Get user from database
    const { data: user, error: userError } = await sb
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { hasAccess: false, reason: 'User not found', isReturningUser: false },
        { status: 404 },
      )
    }

    // Admin always has access
    if (user.admin) {
      return NextResponse.json({
        hasAccess: true,
        reason: 'Admin user',
        subscription: null,
        isReturningUser: false,
      })
    }

    // Get customer ID and subscription ID based on environment
    const customerId = user[stripeColumns.customer_id as keyof typeof user] as
      | string
      | null
    const subscriptionId = user[
      stripeColumns.subscription_id as keyof typeof user
    ] as string | null

    // Check if user has ever been through checkout (has customer ID)
    const hasCustomerId = !!customerId

    // No subscription ID in database
    if (!subscriptionId) {
      // Check if they have a customer ID but no subscription
      // This could mean they:
      // 1. Started checkout but never completed (new user mid-onboarding)
      // 2. Had a subscription that was deleted from our DB (edge case)

      // If they have a customer ID, check Stripe for any past subscriptions
      if (hasCustomerId && customerId) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 100,
          })

          // Check if they ever had any subscription (active, canceled, etc.)
          const hasEverHadSubscription = subscriptions.data.length > 0
          const hadActivePaidSubscription = subscriptions.data.some(
            (sub) =>
              sub.status === 'canceled' ||
              sub.status === 'unpaid' ||
              sub.status === 'incomplete_expired' ||
              (sub.status === 'trialing' &&
                sub.trial_end &&
                DateTime.now() > DateTime.fromSeconds(sub.trial_end)),
          )

          return NextResponse.json({
            hasAccess: false,
            reason: hasEverHadSubscription
              ? 'Subscription expired or canceled'
              : 'No subscription found',
            subscription: null,
            isReturningUser: hadActivePaidSubscription,
            subscriptionCount: subscriptions.data.length,
          })
        } catch (error) {
          console.error('Error checking customer subscriptions:', error)
        }
      }

      return NextResponse.json({
        hasAccess: false,
        reason: 'No subscription ID found',
        subscription: null,
        isReturningUser: false,
        subscriptionCount: 0,
      })
    }

    // Verify subscription with Stripe API - this is the source of truth
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      const now = DateTime.now()
      const trialEnd = subscription.trial_end
        ? DateTime.fromSeconds(subscription.trial_end)
        : null
      // @ts-expect-error - Stripe API version 2024-11-20.acacia has type issues with current_period_end
      const currentPeriodEndTimestamp = subscription.current_period_end
      const periodEnd = currentPeriodEndTimestamp
        ? DateTime.fromSeconds(currentPeriodEndTimestamp)
        : null

      // Check if subscription gives access based on Stripe status
      // Stripe is the source of truth - if it's over there, it's over here
      let hasAccess = false
      let reason = ''

      if (subscription.status === 'active') {
        hasAccess = true
        reason = 'Active subscription'
      } else if (
        subscription.status === 'trialing' &&
        trialEnd &&
        now < trialEnd
      ) {
        hasAccess = true
        reason = 'Active trial'
      } else {
        // Any other status means no access (past_due, canceled, unpaid, etc.)
        hasAccess = false
        reason = `Subscription status: ${subscription.status}`
      }

      // A returning user is someone who doesn't have access but previously had a subscription
      // (not just currently trialing for the first time)
      const isReturningUser = !hasAccess && hasCustomerId

      return NextResponse.json({
        hasAccess,
        reason,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEnd: trialEnd?.toISO() || null,
          currentPeriodEnd: periodEnd?.toISO() || null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        isReturningUser,
        subscriptionCount: 1,
      })
    } catch (stripeError: any) {
      // Subscription not found or invalid in Stripe
      if (stripeError.statusCode === 404) {
        // Subscription ID exists in DB but not in Stripe - likely deleted
        // This user had a subscription before, so they're a returning user
        return NextResponse.json({
          hasAccess: false,
          reason: 'Subscription not found in Stripe',
          subscription: null,
          isReturningUser: hasCustomerId,
          subscriptionCount: 0,
        })
      }

      throw stripeError
    }
  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json(
      {
        hasAccess: false,
        reason: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error',
        isReturningUser: false,
      },
      { status: 500 },
    )
  }
}
