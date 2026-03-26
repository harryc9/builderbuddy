# Subscription Verification API

**Route:** `/api/subscription/verify`  
**Method:** `GET`  
**Auth:** Bearer token required

## Purpose

This endpoint is the **source of truth** for subscription access. It performs real-time verification with Stripe API and determines:
1. Whether user has active access
2. Whether user is a "returning subscriber" (expired subscription)
3. Full subscription details from Stripe

**DO NOT rely on database columns for subscription checks.** Always use this endpoint.

---

## Why This Exists

### The Problem
Database columns like `subscription_status`, `trial_end`, etc. can be stale or out of sync:
- Webhooks can fail
- Manual changes in Stripe dashboard aren't reflected
- Race conditions during subscription updates
- User cancels in Stripe but DB not updated

### The Solution
This endpoint:
1. Fetches live data from Stripe API
2. Applies business logic consistently
3. Returns definitive access status
4. Identifies returning users accurately

---

## Response Schema

```typescript
{
  hasAccess: boolean           // Can user access the app right now?
  reason: string               // Human-readable explanation
  isReturningUser: boolean     // Had subscription before but expired?
  subscriptionCount: number    // How many subscriptions ever had
  subscription: {              // Current subscription details (if exists)
    id: string
    status: string             // Stripe status
    trialEnd: string | null    // ISO 8601 datetime
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}
```

---

## Access Logic

### Stripe is Source of Truth

If subscription status in Stripe is:
- ✅ `active` → User has access
- ✅ `trialing` (and trial not expired) → User has access
- ❌ `past_due` → **No access** (no grace period)
- ❌ `canceled` → No access
- ❌ `unpaid` → No access
- ❌ `incomplete` → No access
- ❌ `incomplete_expired` → No access

**No grace periods.** If Stripe says it's over, it's over.

---

## Returning User Detection

A "returning user" is someone who:
1. Has a Stripe customer ID (went through checkout before)
2. Does NOT currently have access (subscription expired/canceled)

This is used to show different messaging:
- **New users:** "Start your 7-day free trial"
- **Returning users:** "Your subscription has expired - Subscribe to continue"

### Algorithm

```typescript
// User has customer ID but no subscription ID in DB
if (hasCustomerId && !subscriptionId) {
  // Check Stripe for past subscriptions
  const subscriptions = await stripe.subscriptions.list({ customer: customerId })
  
  // Check if they ever had a real subscription (not just incomplete)
  const hadActivePaidSubscription = subscriptions.data.some(
    sub => 
      sub.status === 'canceled' ||
      sub.status === 'unpaid' ||
      sub.status === 'incomplete_expired' ||
      (sub.status === 'trialing' && DateTime.now() > DateTime.fromSeconds(sub.trial_end))
  )
  
  return { isReturningUser: hadActivePaidSubscription }
}

// User has subscription ID in DB
if (subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const hasAccess = checkAccessLogic(subscription)
  
  return { isReturningUser: !hasAccess && hasCustomerId }
}
```

### Edge Cases

**Customer ID exists but no subscriptions in Stripe:**
- Likely started checkout but never completed
- NOT a returning user
- Show "Start free trial" messaging

**Customer ID and expired trial:**
- If trial ended without converting to paid
- IS a returning user
- Show "Subscribe to continue" messaging

---

## Integration Points

### Client-Side Usage

```typescript
import { authenticatedFetch } from '@/lib/api-client'

const response = await authenticatedFetch('/api/subscription/verify')
const data = await response.json()

if (!data.hasAccess) {
  // Redirect to payment page
  router.push('/onboarding/payment')
}

// Use data.isReturningUser to show appropriate messaging
if (data.isReturningUser) {
  // Show "Welcome back" messaging
} else {
  // Show "Start free trial" messaging
}
```

### Server-Side Usage

```typescript
// In API routes
import { authenticateRequest } from '@/lib/api-auth'

const auth = await authenticateRequest(request)
const userId = auth.userId

// Verify subscription internally
const subscription = await verifySubscriptionForUser(userId)
if (!subscription.hasAccess) {
  return NextResponse.json({ error: 'No active subscription' }, { status: 403 })
}
```

---

## Admin Override

Admins always have access regardless of subscription status:

```typescript
if (user.admin) {
  return {
    hasAccess: true,
    reason: 'Admin user',
    isReturningUser: false
  }
}
```

---

## Error Handling

### Stripe API Errors

**404 - Subscription Not Found:**
- Subscription ID in DB but not in Stripe
- Likely deleted manually in Stripe
- User is considered a returning user

**Other Stripe Errors:**
- Throws 500 error
- Returns `hasAccess: false`
- Logs error for debugging

### Database Errors

**User Not Found:**
- Returns 404
- `hasAccess: false`

---

## Performance

- Caches: None (real-time only)
- Latency: ~100-300ms (Stripe API call)
- Rate limits: Stripe API limits apply

**Why no caching?**
- Subscription status must be real-time accurate
- User could cancel subscription in Stripe at any moment
- Better to have accurate data than fast stale data

---

## Testing

### Test Scenarios

1. **New user, no subscription**
   - Expected: `hasAccess: false`, `isReturningUser: false`

2. **Active trialing user**
   - Expected: `hasAccess: true`, `isReturningUser: false`

3. **Expired trial, never paid**
   - Expected: `hasAccess: false`, `isReturningUser: true`

4. **Active paid subscription**
   - Expected: `hasAccess: true`, `isReturningUser: false`

5. **Canceled subscription**
   - Expected: `hasAccess: false`, `isReturningUser: true`

6. **Past due subscription**
   - Expected: `hasAccess: false`, `isReturningUser: true`

---

## Migration from Database Checks

### Old Pattern (❌ Don't Use)

```typescript
import { hasSubscriptionAccessFallback } from '@/lib/subscription'

const hasAccess = hasSubscriptionAccessFallback(userData)
if (!hasAccess) {
  router.push('/onboarding/payment')
}
```

### New Pattern (✅ Use This)

```typescript
import { authenticatedFetch } from '@/lib/api-client'

const response = await authenticatedFetch('/api/subscription/verify')
const { hasAccess, isReturningUser } = await response.json()

if (!hasAccess) {
  router.push('/onboarding/payment')
}
```

**Note:** The old `hasSubscriptionAccessFallback()` helper can still be used as a **fallback** if the API fails, but should not be the primary check.

---

## Environment Handling

Automatically detects test vs production mode and uses correct Stripe columns:

```typescript
// Test mode (development)
stripe_customer_id_test
stripe_subscription_id_test

// Production mode
stripe_customer_id
stripe_subscription_id
```

No manual environment checks needed in calling code.

