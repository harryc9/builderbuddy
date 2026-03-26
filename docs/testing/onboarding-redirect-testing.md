# Onboarding Redirect Testing Guide

## Testing Strategy

### Approach
1. **Manual Testing Checklist** - Systematic walkthrough of all flows
2. **Debug Utilities** - Tools to simulate different user states
3. **Test Accounts** - Pre-configured accounts for each scenario
4. **Browser DevTools** - Monitor redirects and state

---

## Debug Utilities

### 1. Subscription Debug Override (Already Implemented)

Test different subscription states without touching Stripe:

```javascript
// In browser console on any page:

// Simulate expired trial
localStorage.setItem('subscription_debug_override', JSON.stringify({
  subscription_status: 'trialing',
  trial_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  stripe_subscription_id: null
}))

// Simulate active subscription
localStorage.setItem('subscription_debug_override', JSON.stringify({
  subscription_status: 'active',
  stripe_subscription_id: 'sub_test_123',
  subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}))

// Simulate incomplete onboarding (no address)
localStorage.setItem('subscription_debug_override', JSON.stringify({
  hasServiceArea: false,
  subscription_status: 'trialing',
  trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}))

// Simulate incomplete onboarding (no categories)
localStorage.setItem('subscription_debug_override', JSON.stringify({
  hasCategories: false,
  subscription_status: 'trialing',
  trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}))

// Clear override
localStorage.removeItem('subscription_debug_override')
```

### 2. Redirect Monitoring Script

Paste this in console to track all redirects:

```javascript
// Track redirects
const originalPush = window.history.pushState
const redirectLog = []

window.history.pushState = function(...args) {
  redirectLog.push({
    time: new Date().toISOString(),
    url: args[2],
    stack: new Error().stack
  })
  console.log('🔀 Redirect:', args[2])
  return originalPush.apply(this, args)
}

// View redirect history
console.table(redirectLog)
```

---

## Manual Testing Checklist

### Test Set 1: New User - Email Signup

**Setup:** Use incognito browser, fresh test email

| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Go to `/` | - | Landing page |
| 2 | Sign up with email/password | → `/verify-email` | ✓ Shows "check your email" |
| 3 | Click email confirmation link | → `/auth/callback` → `/onboarding/address` | ✓ Address form |
| 4 | Enter address + submit | → `/onboarding/categories` | ✓ Category picker |
| 5 | Select categories + submit | → `/onboarding/payment` | ✓ Payment form |
| 6 | Complete Stripe checkout | → `/app` | ✓ Permits table |

**Key Tests:**
- [ ] Cannot access `/app` before completing onboarding
- [ ] Can refresh page and resume at correct step
- [ ] Browser back button doesn't break flow

---

### Test Set 2: New User - Google OAuth

**Setup:** Use incognito browser, test Google account

| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Go to `/` | - | Landing page |
| 2 | Click "Continue with Google" | → Google OAuth → `/auth/callback` → `/onboarding/address` | ✓ Address form |
| 3 | Enter address + submit | → `/onboarding/categories` | ✓ Category picker |
| 4 | Select categories + submit | → `/onboarding/payment` | ✓ Payment form |
| 5 | Complete Stripe checkout | → `/app` | ✓ Permits table |

**Key Tests:**
- [ ] OAuth popup works (no popup blockers)
- [ ] Callback handles OAuth params correctly
- [ ] User record created with Google email

---

### Test Set 3: Returning User - Active Subscription

**Setup:** Use existing account with active subscription

| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Go to `/` | - | Landing page |
| 2 | Sign in with email/password | → `/app` | ✓ Direct to app |
| 3 | Go to `/` (while logged in) | → `/app` | ✓ Auto redirect |
| 4 | Go to `/onboarding/address` | → `/app` | ✓ Skips onboarding |

**Key Tests:**
- [ ] Skips all onboarding steps
- [ ] Cannot access onboarding pages
- [ ] Direct link to `/app` works

---

### Test Set 4: Returning User - Expired Subscription

**Setup:** Test account with canceled/expired subscription

**Option A: Real Test Account**
| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Cancel subscription in Stripe | - | Wait for webhook |
| 2 | Sign in | → `/app` page load → AuthGuard check → `/onboarding/payment` | ✓ Payment page |
| 3 | See "subscription expired" message | - | ✓ Red alert banner |

**Option B: Debug Override**
| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Sign in normally | → `/app` | ✓ |
| 2 | Open console, set override (see above) | - | - |
| 3 | Refresh page | → `/onboarding/payment` | ✓ Returning user UI |
| 4 | Clear override | - | - |
| 5 | Refresh page | → `/app` | ✓ Normal access |

**Key Tests:**
- [ ] Shows "expired subscription" banner
- [ ] Button says "Subscribe Now" (not "Start Free Trial")
- [ ] Cannot access `/app` until resubscribed
- [ ] After resubscription → `/app` access restored

---

### Test Set 5: Abandoned Onboarding

**Setup:** Create account, complete only step 1

| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Sign up + complete address step | → `/onboarding/categories` | ✓ |
| 2 | Close browser (abandon) | - | - |
| 3 | Return later, sign in | → `/onboarding/categories` | ✓ Resumes at step 2 |

**Variations:**
- [ ] Abandoned after address → resume at categories
- [ ] Abandoned after categories → resume at payment
- [ ] Address pre-filled with saved data
- [ ] Categories pre-selected with saved data

---

### Test Set 6: Edge Cases

#### 6.1: Email Not Verified
| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Sign up (don't verify email) | → `/verify-email` | ✓ |
| 2 | Close browser, return | - | - |
| 3 | Try to sign in | → `/verify-email` | ✓ Blocked |
| 4 | Click email confirmation link | → `/auth/callback` → `/onboarding/address` | ✓ Now works |

#### 6.2: Existing User Signs Up Again
| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Try to sign up with existing email | - | ✓ Detects existing |
| 2 | System attempts sign in | → `/app` | ✓ If password correct |
| 3 | OR shows error | - | ✓ If password wrong |

#### 6.3: Direct URL Access (Not Logged In)
| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Go to `/app` (not logged in) | → `/` | ✓ |
| 2 | Go to `/onboarding/address` | → `/` | ✓ |
| 3 | Go to `/onboarding/categories` | → `/` | ✓ |
| 4 | Go to `/onboarding/payment` | → `/` | ✓ |

#### 6.4: AuthGuard with Debug Override
| Step | Action | Expected Redirect | Verify |
|------|--------|-------------------|---------|
| 1 | Sign in normally (admin account) | → `/app` | ✓ |
| 2 | Set debug override (expired trial) | - | Console |
| 3 | Refresh `/app` | → `/onboarding/payment` | ✓ |
| 4 | Clear override | - | Console |
| 5 | Refresh page | → `/app` | ✓ |

---

## Test Accounts Setup

Create these test accounts for quick testing:

```javascript
// Test Account Matrix
const testAccounts = {
  // New user (email not verified)
  newEmailUnverified: {
    email: 'test-new-unverified@example.com',
    password: 'TestPass123!',
    state: 'created, email not verified'
  },
  
  // New user (email verified, no onboarding)
  newEmailVerified: {
    email: 'test-new-verified@example.com',
    password: 'TestPass123!',
    state: 'email verified, no address/categories/payment'
  },
  
  // Partial onboarding (has address)
  partialAddress: {
    email: 'test-partial-address@example.com',
    password: 'TestPass123!',
    state: 'has address, no categories/payment'
  },
  
  // Partial onboarding (has address + categories)
  partialCategories: {
    email: 'test-partial-categories@example.com',
    password: 'TestPass123!',
    state: 'has address + categories, no payment'
  },
  
  // Active trial
  activeTrial: {
    email: 'test-active-trial@example.com',
    password: 'TestPass123!',
    state: 'trial active, full access'
  },
  
  // Active subscription
  activeSubscription: {
    email: 'test-active-sub@example.com',
    password: 'TestPass123!',
    state: 'paid subscription, full access'
  },
  
  // Expired subscription
  expiredSubscription: {
    email: 'test-expired-sub@example.com',
    password: 'TestPass123!',
    state: 'subscription canceled/expired'
  }
}
```

---

## Automated Redirect Testing (Optional)

For more thorough testing, create a test page:

### Create: `src/app/test-redirects/page.tsx`

```typescript
'use client'

import { useAuth } from '@/context/auth-provider'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function RedirectTestPage() {
  const { user } = useAuth()
  const { data: userData } = useUser()
  const [testResults, setTestResults] = useState<string[]>([])

  const runTest = async (testName: string, expectedPath: string) => {
    const result = window.location.pathname === expectedPath
      ? `✅ ${testName}`
      : `❌ ${testName} (expected ${expectedPath}, got ${window.location.pathname})`
    
    setTestResults(prev => [...prev, result])
  }

  const setDebugOverride = (override: any) => {
    localStorage.setItem('subscription_debug_override', JSON.stringify(override))
  }

  const clearDebugOverride = () => {
    localStorage.removeItem('subscription_debug_override')
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Redirect Testing Dashboard</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current User State</h2>
        <pre className="text-xs">{JSON.stringify({
          authenticated: !!user,
          email: user?.email,
          address: userData?.address,
          categories: userData?.subscribed_categories?.length,
          subscription: userData?.subscription_status,
          customer_id: userData?.stripe_customer_id
        }, null, 2)}</pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Tests</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => {
            setDebugOverride({ subscription_status: 'trialing', trial_end: new Date(Date.now() - 1000).toISOString() })
            window.location.reload()
          }}>
            Test: Expired Trial → Payment
          </Button>

          <Button onClick={() => {
            setDebugOverride({ hasServiceArea: false })
            window.location.href = '/app'
          }}>
            Test: No Address → Address Page
          </Button>

          <Button onClick={() => {
            setDebugOverride({ hasCategories: false })
            window.location.href = '/app'
          }}>
            Test: No Categories → Categories Page
          </Button>

          <Button onClick={() => {
            clearDebugOverride()
            window.location.reload()
          }} variant="outline">
            Clear Override
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <ul className="space-y-1">
          {testResults.map((result, i) => (
            <li key={i} className="text-sm font-mono">{result}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

**Note:** Delete this file after testing or restrict to development only:

```typescript
// Add at top of file
if (process.env.NODE_ENV === 'production') {
  redirect('/')
}
```

---

## Testing Checklist Summary

### Critical Paths (Must Test)
- [ ] New email signup → full onboarding flow
- [ ] New Google OAuth → full onboarding flow
- [ ] Returning user (active) → direct to `/app`
- [ ] Returning user (expired) → payment page
- [ ] Abandoned onboarding → resume at correct step

### Edge Cases (Should Test)
- [ ] Email not verified → blocked until verified
- [ ] Existing user signs up again
- [ ] Direct URL access while not logged in
- [ ] Browser back button during onboarding
- [ ] Page refresh during onboarding
- [ ] Debug override functionality

### Performance (Nice to Have)
- [ ] AuthGuard doesn't cause render flashing
- [ ] Redirects happen quickly (< 500ms)
- [ ] Loading states show appropriately
- [ ] No infinite redirect loops

---

## Common Issues & Debugging

### Issue: Redirect Loop
**Symptom:** Page keeps redirecting back and forth
**Debug:**
```javascript
// Check redirect history
console.log(performance.getEntriesByType('navigation'))

// Check AuthGuard state
// (Add console.logs to useEffect in AuthGuard.tsx)
```

### Issue: Wrong Redirect Target
**Symptom:** Goes to wrong page
**Debug:**
1. Check user state in database
2. Check AuthGuard logic
3. Check callback page logic
4. Verify `getOnboardingRedirect()` logic

### Issue: Redirect Not Happening
**Symptom:** Stays on same page when should redirect
**Debug:**
1. Check if `useEffect` is running (add console.log)
2. Check if conditions are met
3. Check `router.push()` is being called
4. Check browser console for errors

---

## Quick Test Commands

```bash
# Clear localStorage (fresh state)
localStorage.clear()

# Check current debug override
JSON.parse(localStorage.getItem('subscription_debug_override') || 'null')

# Monitor redirects (paste in console)
const log = []; const ogPush = history.pushState; history.pushState = (...args) => { log.push(args[2]); console.log('→', args[2]); return ogPush.apply(history, args) }

# View all cookies
document.cookie.split(';').map(c => c.trim())
```

