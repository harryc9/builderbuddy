# MVP Launch Plan - $29/Month

**Target:** Launch PermitPulse at $29/month with 7-day free trial  
**ICP:** Specialty Trade Contractors (HVAC, Electrical, Plumbing, Roofing)

---

## PRODUCT SECTION

### Current State Analysis

**✅ Already Built:**
- Auth system (Supabase Auth with email/password)
- Auth guards and protected routes
- Database schema (permits, users, permit_changes)
- Permit ingestion (Toronto API)
- Change detection system
- Permits table with filters
- Dashboard UI

**❌ Missing for Launch:**
1. User onboarding flow (trade keywords, service areas)
2. Daily email digest system
3. Stripe subscription integration
4. Trial/payment enforcement (lock users after 7 days)
5. User settings/preferences page
6. Email infrastructure (sending, templates)

### Pricing Strategy

**Free Trial:**
- 7 days full access (credit card required upfront)
- All features unlocked
- After 7 days: Lock out dashboard, redirect to payment

**Paid Plan: $29/month**
- Daily email with curated permits (6 AM EST)
- Full dashboard access (filters, search, export)
- Unlimited permit views
- Status change alerts
- Cancel anytime

**Why $29/month?**
- Low barrier for small contractors ($1/day)
- Still 10x cheaper than manual research time (4 hours/week = $100-200/week)
- Easy credit card approval (under $50/month threshold)
- Room to upsell to $49-99/month later with more features

### User Journey (MVP)

#### Day 0: Sign Up
1. User lands on marketing page
2. Clicks "Start Free Trial"
3. Enters email + password (no credit card)
4. **Onboarding: Select trade keywords** (HVAC, electrical, plumbing, etc.)
5. **Onboarding: Enter postal code prefixes** (M4B, M5H, M6G)
6. Redirected to dashboard with permits

#### Days 1-7: Free Trial
- **Morning:** Receive daily email at 6 AM with curated permits
- **During day:** Log into dashboard to filter, search, export
- **Email reminders:** "2 days left in trial", "Last day of trial"

#### Day 7: Trial Ends
- If not paid: Lock dashboard access
- Redirect to payment page: "Your trial has ended. Continue for $29/month"
- Still receive emails but with CTA to pay

#### Post-Payment: Active Subscriber
- Full dashboard access restored
- Daily emails continue
- Billing every 30 days
- If payment fails: Immediate access lock

---

## TECH SECTION

### Implementation Steps

---

## STEP 1: USER ONBOARDING FLOW

**Goal:** Collect trade keywords and service areas during signup

### Database Schema Updates

```sql
-- Users table already has these columns (from analysis):
-- trade_keywords: text[]
-- service_areas: text[]
-- subscription_status: varchar

-- Add trial tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Update subscription_status to use enum-like values:
-- 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
```

### Onboarding UI Components

**Create: `/src/app/onboarding/page.tsx`**
- Multi-step wizard (2 steps)
- Step 1: Select trade keywords (checkboxes)
- Step 2: Enter postal codes (comma-separated input)
- Save to `users` table
- Set `trial_started_at = NOW()`, `trial_ends_at = NOW() + 7 days`
- Set `subscription_status = 'trial'`

**Trade Keywords Options:**
```typescript
const TRADE_KEYWORDS = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Concrete',
  'Foundation',
  'Drywall',
  'Framing',
  'Fire Suppression',
  'Elevator',
  'Structural Steel',
  'Insulation',
  'Flooring',
]
```

**Postal Code Input:**
- Text input with validation (3-character postal code prefixes)
- Example: "M4B, M5H, M6G"
- Store as array: `['M4B', 'M5H', 'M6G']`

---

## STEP 2: TRIAL ENFORCEMENT & PAYMENT WALL

**Goal:** Lock users out of dashboard after 7-day trial ends

### Access Control Logic

**Create: `/src/lib/subscription.ts`**

```typescript
export type SubscriptionStatus = 
  | 'trial' 
  | 'active' 
  | 'past_due' 
  | 'canceled' 
  | 'incomplete'

export function hasAccess(user: UserWithSubscription): boolean {
  // Active paid subscription
  if (user.subscription_status === 'active') {
    return true
  }

  // Trial period
  if (user.subscription_status === 'trial') {
    const now = new Date()
    const trialEnds = new Date(user.trial_ends_at)
    return now < trialEnds
  }

  return false
}

export function getDaysLeftInTrial(user: UserWithSubscription): number {
  if (user.subscription_status !== 'trial') return 0
  
  const now = new Date()
  const trialEnds = new Date(user.trial_ends_at)
  const diffMs = trialEnds.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}
```

### Payment Wall Component

**Create: `/src/components/PaymentWall.tsx`**

```typescript
// Shown when trial ends or subscription lapses
// Shows:
// - "Your trial has ended"
// - "Continue with PermitPulse for $29/month"
// - Stripe checkout button
// - Features list
// - Testimonial/social proof
```

### Update AuthGuard

**Modify: `/src/components/auth/AuthGuard.tsx`**

Add subscription check:
```typescript
export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  // Check if user has access (trial or paid)
  const hasSubscriptionAccess = user ? hasAccess(user) : false
  
  if (!isLoading && !isAuthenticated) {
    redirect(redirectTo)
  }
  
  if (!isLoading && isAuthenticated && !hasSubscriptionAccess) {
    redirect('/subscribe') // Payment wall
  }
  
  // ... rest of component
}
```

---

## STEP 3: STRIPE INTEGRATION

**Goal:** Collect payments and manage subscriptions

### Stripe Setup

1. **Install Stripe:**
```bash
bun add stripe @stripe/stripe-js
```

2. **Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_... # $29/month price ID
```

3. **Create Stripe Price:**
- Log into Stripe Dashboard
- Create Product: "PermitPulse Pro"
- Create Price: $29/month recurring
- Copy Price ID

### Stripe Checkout Flow

**Create: `/src/app/api/stripe/create-checkout-session/route.ts`**

```typescript
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()
    
    // Create or retrieve Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        supabase_user_id: userId,
      },
    })
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
      metadata: {
        supabase_user_id: userId,
      },
    })
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
```

### Stripe Webhooks

**Create: `/src/app/api/stripe/webhooks/route.ts`**

Handle Stripe events:
- `checkout.session.completed` → Activate subscription
- `invoice.payment_succeeded` → Renew subscription
- `invoice.payment_failed` → Set to `past_due`
- `customer.subscription.deleted` → Set to `canceled`

```typescript
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase.server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }
  
  const supabase = createClient()
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      
      if (!userId) break
      
      // Update user subscription
      await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId)
      
      break
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      
      // Find user by subscription ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      
      if (!user) break
      
      await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        })
        .eq('id', user.id)
      
      break
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      
      if (!user) break
      
      await supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('id', user.id)
      
      break
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()
      
      if (!user) break
      
      await supabase
        .from('users')
        .update({ subscription_status: 'canceled' })
        .eq('id', user.id)
      
      break
    }
  }
  
  return NextResponse.json({ received: true })
}
```

---

## STEP 4: DAILY EMAIL DIGEST

**Goal:** Send users curated permits at 6 AM daily

### Email Infrastructure Setup

**Option 1: Resend (Recommended)**
- Easy setup, developer-friendly
- $0.10 per 1000 emails (cheap)
- Great deliverability
- React email templates

**Option 2: SendGrid**
- More established
- Free tier: 100 emails/day
- Harder to set up

**Install Resend:**
```bash
bun add resend
bun add react-email @react-email/components
```

### Email Template

**Create: `/emails/daily-digest.tsx`**

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

type DailyDigestEmailProps = {
  userName: string
  permits: Array<{
    permit_num: string
    full_address: string
    est_const_cost: number
    status: string
    description: string
    issued_date: string
  }>
  tradeKeywords: string[]
  postalCodes: string[]
}

export default function DailyDigestEmail({
  userName,
  permits,
  tradeKeywords,
  postalCodes,
}: DailyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your daily permit digest - {permits.length} new permits</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Good morning, {userName}!</Heading>
          
          <Text style={text}>
            We found <strong>{permits.length} permits</strong> matching your criteria:
          </Text>
          
          <Section style={keywordsSection}>
            <Text style={smallText}>
              🔍 Trades: {tradeKeywords.join(', ')}
            </Text>
            <Text style={smallText}>
              📍 Areas: {postalCodes.join(', ')}
            </Text>
          </Section>
          
          {permits.map((permit) => (
            <Section key={permit.permit_num} style={permitCard}>
              <Heading style={h2}>{permit.full_address}</Heading>
              
              <Text style={permitDetails}>
                <strong>Cost:</strong> ${permit.est_const_cost.toLocaleString()}<br />
                <strong>Status:</strong> {permit.status}<br />
                <strong>Issued:</strong> {permit.issued_date}<br />
              </Text>
              
              <Text style={description}>{permit.description}</Text>
              
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL}/permits/${permit.permit_num}`}
                style={button}
              >
                View Details →
              </Link>
            </Section>
          ))}
          
          <Section style={footer}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`} style={link}>
              View All Permits in Dashboard
            </Link>
            
            <Text style={smallText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/settings`}>
                Update preferences
              </Link>
              {' · '}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles omitted for brevity
```

### Daily Digest Cron Job

**Create: `/src/app/api/cron/send-daily-digest/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase.server'
import { Resend } from 'resend'
import DailyDigestEmail from '@/emails/daily-digest'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  // Verify cron secret (security)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createClient()
  
  // Get all active users (trial or paid)
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .in('subscription_status', ['trial', 'active'])
  
  if (!users) {
    return NextResponse.json({ error: 'No users found' }, { status: 404 })
  }
  
  let emailsSent = 0
  let errors = 0
  
  for (const user of users) {
    try {
      // Get permits matching user's criteria
      let query = supabase
        .from('permits')
        .select('*')
        .order('issued_date', { ascending: false })
        .limit(20)
      
      // Filter by postal codes
      if (user.service_areas && user.service_areas.length > 0) {
        const postalFilters = user.service_areas.map(
          (postal: string) => `postal.ilike.${postal}%`
        )
        query = query.or(postalFilters.join(','))
      }
      
      // Filter by trade keywords (in description)
      if (user.trade_keywords && user.trade_keywords.length > 0) {
        const keywordFilters = user.trade_keywords.map(
          (keyword: string) => `description.ilike.%${keyword}%`
        )
        query = query.or(keywordFilters.join(','))
      }
      
      // Only new permits from last 24 hours
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      query = query.gte('first_seen_at', yesterday.toISOString())
      
      const { data: permits } = await query
      
      if (!permits || permits.length === 0) {
        console.log(`No permits for user ${user.email}`)
        continue
      }
      
      // Send email
      await resend.emails.send({
        from: 'PermitPulse <digest@permitpulse.com>',
        to: user.email,
        subject: `Your Daily Permit Digest - ${permits.length} New Permits`,
        react: DailyDigestEmail({
          userName: user.email.split('@')[0],
          permits: permits.slice(0, 10), // Top 10
          tradeKeywords: user.trade_keywords || [],
          postalCodes: user.service_areas || [],
        }),
      })
      
      emailsSent++
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error)
      errors++
    }
  }
  
  return NextResponse.json({
    success: true,
    emailsSent,
    errors,
    totalUsers: users.length,
  })
}
```

### Configure Vercel Cron

**Update: `/vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/send-daily-digest",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Schedule: `0 10 * * *` = 10:00 AM UTC = 6:00 AM EST (daily)

---

## STEP 5: USER SETTINGS PAGE

**Goal:** Allow users to update preferences and manage subscription

**Create: `/src/app/settings/page.tsx`**

Sections:
1. **Trade Keywords** (update checkboxes)
2. **Service Areas** (update postal codes)
3. **Email Preferences** (daily digest on/off)
4. **Billing** (view subscription, update payment method, cancel)

**Billing Section:**
- Show current plan: "$29/month"
- Show next billing date
- "Update Payment Method" → Stripe portal
- "Cancel Subscription" → Stripe portal

**Stripe Customer Portal:**

```typescript
// /src/app/api/stripe/create-portal-session/route.ts
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  const { customerId } = await req.json()
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })
  
  return NextResponse.json({ url: session.url })
}
```

---

## STEP 6: TRIAL REMINDER EMAILS

**Goal:** Remind users before trial ends to encourage conversion

### Reminder Schedule

- **Day 2 (1 day left):** "Your trial ends tomorrow"
- **Day 3 (trial ended):** "Your trial has ended - Subscribe to continue"

**Create: `/emails/trial-reminder.tsx`**

```tsx
type TrialReminderEmailProps = {
  userName: string
  daysLeft: number // 1 or 0
  totalPermitsFound: number
}

export default function TrialReminderEmail({
  userName,
  daysLeft,
  totalPermitsFound,
}: TrialReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {daysLeft === 1 
          ? 'Your trial ends tomorrow' 
          : 'Your trial has ended'}
      </Preview>
      <Body>
        <Container>
          <Heading>
            {daysLeft === 1 
              ? `Hi ${userName}, your trial ends tomorrow` 
              : `Hi ${userName}, your trial has ended`}
          </Heading>
          
          <Text>
            In the last {daysLeft === 1 ? '6 days' : '7 days'}, we found 
            <strong> {totalPermitsFound} permits</strong> matching your criteria.
          </Text>
          
          <Text>
            Continue with PermitPulse for just <strong>$29/month</strong> to keep 
            receiving daily permits and never miss an opportunity.
          </Text>
          
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/subscribe`}>
            Subscribe Now →
          </Link>
        </Container>
      </Body>
    </Html>
  )
}
```

**Create: `/src/app/api/cron/send-trial-reminders/route.ts`**

```typescript
// Run daily, check for users whose trial ends in 1 day or just ended
// Send appropriate reminder email
```

---

## IMPLEMENTATION SUMMARY

### Phase 1: Core Subscription System (Week 1)
1. ✅ Add trial columns to users table
2. ✅ Build onboarding flow (trade keywords + postal codes)
3. ✅ Implement subscription access control
4. ✅ Create payment wall component
5. ✅ Integrate Stripe checkout
6. ✅ Set up Stripe webhooks

### Phase 2: Email System (Week 2)
7. ✅ Set up Resend account
8. ✅ Build email templates (daily digest, trial reminders)
9. ✅ Create daily digest cron job
10. ✅ Create trial reminder cron job
11. ✅ Configure Vercel cron schedules

### Phase 3: User Management (Week 3)
12. ✅ Build settings page
13. ✅ Implement Stripe customer portal
14. ✅ Add email preference toggles
15. ✅ Test full user lifecycle (signup → trial → paid → cancel)

---

## TESTING CHECKLIST

### Onboarding Flow
- [ ] User can sign up with email/password
- [ ] User selects trade keywords
- [ ] User enters postal codes
- [ ] Trial dates are set correctly (7 days)
- [ ] User redirected to dashboard with access

### Trial Enforcement
- [ ] User has access during trial (days 1-3)
- [ ] User locked out after trial ends (day 4)
- [ ] Payment wall shows correctly
- [ ] Trial reminder emails sent on schedule

### Stripe Integration
- [ ] Checkout session creates successfully
- [ ] Payment processes correctly
- [ ] Webhook updates subscription status
- [ ] User gains access after payment
- [ ] Failed payments trigger past_due status
- [ ] Canceled subscriptions lock access

### Daily Emails
- [ ] Cron job runs at 6 AM EST
- [ ] Emails sent to trial + paid users only
- [ ] Permits filtered by trade keywords
- [ ] Permits filtered by postal codes
- [ ] Only new permits (last 24 hours) included
- [ ] Email unsubscribe works

### Settings Page
- [ ] User can update trade keywords
- [ ] User can update postal codes
- [ ] User can toggle email preferences
- [ ] Stripe portal link works
- [ ] Cancel subscription works

---

## ENVIRONMENT VARIABLES

```env
# Supabase (already set)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_... # $29/month

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://permitpulse.com
CRON_SECRET=random_secret_for_cron_auth
```

---

## LAUNCH CHECKLIST

### Pre-Launch
- [ ] All tests passing
- [ ] Stripe webhooks verified in production
- [ ] Resend domain verified (no-reply@permitpulse.com)
- [ ] Cron jobs scheduled in Vercel
- [ ] Environment variables set in production
- [ ] Error monitoring set up (Sentry)
- [ ] Analytics set up (Plausible/PostHog)

### Marketing Page
- [ ] Value proposition clear
- [ ] Pricing displayed ($29/month)
- [ ] "Start Free Trial" CTA
- [ ] Features list
- [ ] ICP targeting (HVAC, electrical, plumbing)
- [ ] Social proof/testimonials (if available)

### Launch Day
- [ ] Deploy to production
- [ ] Test full signup → trial → payment flow
- [ ] Monitor Stripe dashboard for payments
- [ ] Monitor error logs
- [ ] Check email deliverability
- [ ] First daily digest sent successfully

---

## POST-LAUNCH METRICS

### Week 1-4 Goals
- **Signups:** 10-20 trial users
- **Trial-to-paid conversion:** 20-30%
- **Email open rate:** >40%
- **Dashboard logins:** 3+ per week per user
- **Churn:** <10% monthly

### Key Metrics to Track
1. **Acquisition:**
   - Signups per day
   - Traffic sources
   - Trial start rate

2. **Activation:**
   - Onboarding completion rate
   - Time to first export
   - Permits viewed in trial

3. **Retention:**
   - Daily email open rate
   - Dashboard logins per week
   - Feature usage (filters, exports)

4. **Revenue:**
   - Trial-to-paid conversion
   - MRR (Monthly Recurring Revenue)
   - Average customer lifetime value

5. **Churn:**
   - Cancellation rate
   - Cancellation reasons
   - Failed payment recovery rate

---

## FUTURE ENHANCEMENTS (Post-MVP)

### Phase 2 Features (Month 2-3)
- Status change alerts (email when permit moves to Inspection)
- Saved searches (save filter combinations)
- CSV export with custom columns
- Mobile app (React Native)

### Phase 3 Features (Month 4-6)
- Multi-seat plans ($49/month for 3 seats)
- Team collaboration (share permits, comments)
- API access for integrations
- Slack/Teams notifications
- Map view of permits

### Enterprise Features (Month 6+)
- Custom branding
- SSO (Single Sign-On)
- Dedicated account manager
- Custom data exports
- White-label reports






