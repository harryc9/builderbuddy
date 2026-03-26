import { stripe } from '@/lib/stripe'
import { stripeColumns, stripeModeLabel } from '@/lib/stripe-env'
import { sb } from '@lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user from database
    const result = await sb
      .from('users')
      .select('id, email, stripe_customer_id, stripe_customer_id_test')
      .eq('id', userId)
      .single()

    const { data: userData, error: userError } = result as {
      data: {
        id: string
        email: string | null
        stripe_customer_id: string | null
        stripe_customer_id_test: string | null
      } | null
      error: any
    }

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 },
      )
    }

    if (!userData || !userData.email) {
      return NextResponse.json(
        { error: 'User not found or no email' },
        { status: 404 },
      )
    }

    const customerId =
      ((userData as any)[stripeColumns.customer_id] as string | null) || null

    console.log(
      `[${stripeModeLabel}] Creating checkout session for user ${userId}`,
    )

    // Check for existing active subscriptions first
    if (customerId) {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      })

      const activeSubscriptions = existingSubscriptions.data.filter(
        (sub) => sub.status === 'active' || sub.status === 'trialing',
      )

      if (activeSubscriptions.length > 0) {
        console.log(
          `[${stripeModeLabel}] Customer already has ${activeSubscriptions.length} active subscription(s)`,
        )
        return NextResponse.json(
          {
            error: 'Customer already has an active subscription',
            subscription_id: activeSubscriptions[0].id,
          },
          { status: 400 },
        )
      }
    }

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: userId,
        },
      })

      const newCustomerId = customer.id

      console.log(
        `[${stripeModeLabel}] Created new Stripe customer: ${newCustomerId}`,
      )

      // Save customer ID to database
      await sb
        .from('users')
        .update({ [stripeColumns.customer_id]: newCustomerId } as any)
        .eq('id', userId)

      return createCheckoutSession(newCustomerId, userId)
    }

    return createCheckoutSession(customerId, userId)
  } catch (error) {
    const err = error as Error
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}

async function createCheckoutSession(customerId: string, userId: string) {
  try {
    // Create Checkout session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: userId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/app?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/payment`,
      metadata: {
        supabase_user_id: userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const err = error as Error
    console.error('Stripe checkout session error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
