import { syncSubscriptionNotifications } from '@/lib/notifications'
import { stripe } from '@/lib/stripe'
import { sb } from '@lib/supabase'
import { DateTime } from 'luxon'
import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

/**
 * Stripe webhook handler for subscription events
 *
 * Note: We use @ts-expect-error for some fields because Stripe's API version 2024-11-20.acacia
 * has TypeScript definitions that don't match the actual webhook payloads.
 * The actual webhook data contains properties like current_period_end at the subscription level,
 * but the types indicate they're in subscription.items.data[0]. This is a known Stripe SDK issue.
 * See: https://discord.com/channels/841573134531821608/841573134531821616/1407372325505990666
 */

/**
 * Get stripe columns based on whether the event is from test mode
 */
function getStripeColumnsForEvent(event: Stripe.Event) {
  const isTestMode = event.livemode === false
  return {
    customer_id: isTestMode ? 'stripe_customer_id_test' : 'stripe_customer_id',
    subscription_id: isTestMode
      ? 'stripe_subscription_id_test'
      : 'stripe_subscription_id',
    subscription_current_period_end: isTestMode
      ? 'subscription_current_period_end_test'
      : 'subscription_current_period_end',
    trial_start: isTestMode ? 'trial_start_test' : 'trial_start',
    trial_end: isTestMode ? 'trial_end_test' : 'trial_end',
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    const error = err as Error
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    )
  }

  const stripeColumns = getStripeColumnsForEvent(event)
  const modeLabel = event.livemode ? 'LIVE' : 'TEST'
  console.log(`📥 [${modeLabel}] Stripe webhook received:`, event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user ID in session metadata')
          break
        }

        console.log(`✅ [${modeLabel}] Checkout completed for user:`, userId)

        const subscriptionId = session.subscription as string
        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        // SAFEGUARD: Check for duplicate subscriptions and cancel extras
        const customerId = session.customer as string
        const allSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 20,
        })

        const activeSubscriptions = allSubscriptions.data.filter(
          (s) => s.status === 'active' || s.status === 'trialing',
        )

        if (activeSubscriptions.length > 1) {
          console.warn(
            `⚠️ [${modeLabel}] Found ${activeSubscriptions.length} active subscriptions for customer ${customerId}`,
          )

          // Keep the most recently created subscription, cancel the rest
          const sorted = activeSubscriptions.sort(
            (a, b) => b.created - a.created,
          )
          const toKeep = sorted[0]
          const toCancel = sorted.slice(1)

          for (const duplicate of toCancel) {
            console.log(
              `❌ [${modeLabel}] Canceling duplicate subscription: ${duplicate.id}`,
            )
            await stripe.subscriptions.cancel(duplicate.id)
          }

          console.log(
            `✅ [${modeLabel}] Kept subscription ${toKeep.id}, cancelled ${toCancel.length} duplicates`,
          )
        }

        // @ts-expect-error - Stripe API version 2024-11-20.acacia has type issues
        const currentPeriodEnd = sub.current_period_end

        await sb
          .from('users')
          .update({
            [stripeColumns.customer_id]: session.customer as string,
            [stripeColumns.subscription_id]: subscriptionId,
            subscription_status: sub.status,
            [stripeColumns.trial_start]: sub.trial_start
              ? DateTime.fromSeconds(sub.trial_start).toUTC().toISO()
              : null,
            [stripeColumns.trial_end]: sub.trial_end
              ? DateTime.fromSeconds(sub.trial_end).toUTC().toISO()
              : null,
            [stripeColumns.subscription_current_period_end]:
              currentPeriodEnd && typeof currentPeriodEnd === 'number'
                ? DateTime.fromSeconds(currentPeriodEnd).toUTC().toISO()
                : null,
            updated_at: DateTime.now().toUTC().toISO(),
          })
          .eq('id', userId)

        console.log(
          `✅ [${modeLabel}] User subscription status updated:`,
          sub.status,
        )

        // Sync notifications after subscription update
        await syncSubscriptionNotifications(userId).catch((err) =>
          console.error('Failed to sync notifications:', err),
        )

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.supabase_user_id

        if (!userId) {
          const { data: user } = await sb
            .from('users')
            .select('id')
            .eq(stripeColumns.subscription_id, sub.id)
            .single()

          if (!user) {
            console.error('No user found for subscription:', sub.id)
            break
          }
        }

        // @ts-expect-error - Stripe API version 2024-11-20.acacia has type issues
        const currentPeriodEnd = sub.current_period_end

        await sb
          .from('users')
          .update({
            subscription_status: sub.status,
            [stripeColumns.subscription_current_period_end]:
              currentPeriodEnd && typeof currentPeriodEnd === 'number'
                ? DateTime.fromSeconds(currentPeriodEnd).toUTC().toISO()
                : null,
            [stripeColumns.trial_start]: sub.trial_start
              ? DateTime.fromSeconds(sub.trial_start).toUTC().toISO()
              : undefined,
            [stripeColumns.trial_end]: sub.trial_end
              ? DateTime.fromSeconds(sub.trial_end).toUTC().toISO()
              : undefined,
            updated_at: DateTime.now().toUTC().toISO(),
          })
          .eq(stripeColumns.subscription_id, sub.id)

        console.log(`✅ [${modeLabel}] Subscription updated:`, sub.status)

        // Sync notifications after subscription update
        if (userId) {
          await syncSubscriptionNotifications(userId).catch((err) =>
            console.error('Failed to sync notifications:', err),
          )
        }

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object

        await sb
          .from('users')
          .update({
            subscription_status: 'canceled',
            updated_at: DateTime.now().toUTC().toISO(),
          })
          .eq(stripeColumns.subscription_id, sub.id)

        console.log(`✅ [${modeLabel}] Subscription canceled`)

        break
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object
        const subscriptionId =
          // @ts-expect-error - Stripe returns this but types are wrong in 2024-11-20.acacia
          typeof inv.subscription === 'string'
            ? // @ts-expect-error - Stripe returns this but types are wrong in 2024-11-20.acacia
              inv.subscription
            : // @ts-expect-error - Stripe returns this but types are wrong in 2024-11-20.acacia
              inv.subscription?.id

        if (!subscriptionId) break

        await sb
          .from('users')
          .update({
            subscription_status: 'active',
            [stripeColumns.subscription_current_period_end]:
              DateTime.fromSeconds(inv.period_end).toUTC().toISO(),
            updated_at: DateTime.now().toUTC().toISO(),
          })
          .eq(stripeColumns.subscription_id, subscriptionId)

        console.log(
          `✅ [${modeLabel}] Payment succeeded for subscription:`,
          subscriptionId,
        )

        // Sync notifications after payment success
        const { data: userData } = await sb
          .from('users')
          .select('id')
          .eq(stripeColumns.subscription_id, subscriptionId)
          .single()

        if (userData?.id) {
          await syncSubscriptionNotifications(userData.id).catch((err) =>
            console.error('Failed to sync notifications:', err),
          )
        }

        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object
        const subscriptionId =
          // @ts-expect-error - Stripe returns this but types are wrong in 2024-11-20.acacia
          typeof inv.subscription === 'string'
            ? // @ts-expect-error - Stripe returns this but types are wrong in 2024-11-20.acacia
              inv.subscription
            : // @ts-expect-error - Stripe returns this but types are wrong in 2024-11-20.acacia
              inv.subscription?.id

        if (!subscriptionId) break

        await sb
          .from('users')
          .update({
            subscription_status: 'past_due',
            updated_at: DateTime.now().toUTC().toISO(),
          })
          .eq(stripeColumns.subscription_id, subscriptionId)

        console.log(
          `❌ [${modeLabel}] Payment failed for subscription:`,
          subscriptionId,
        )

        // Sync notifications after payment failure
        const { data: userData } = await sb
          .from('users')
          .select('id')
          .eq(stripeColumns.subscription_id, subscriptionId)
          .single()

        if (userData?.id) {
          await syncSubscriptionNotifications(userData.id).catch((err) =>
            console.error('Failed to sync notifications:', err),
          )
        }

        break
      }

      default:
        console.log(`[${modeLabel}] Unhandled event type:`, event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const err = error as Error
    console.error(`[${modeLabel}] Error processing webhook:`, err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}
