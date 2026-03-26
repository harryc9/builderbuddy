# User Onboarding Flow

## PRODUCT

### Overview
Complete user onboarding flow from signup through to payment setup. Users must complete address selection, category preferences, and payment setup before accessing the full application.

### User Flows

#### Flow 1: Email Signup
```
1. User enters email/password on landing page
2. → Redirected to /verify-email (waiting for confirmation)
3. User clicks link in confirmation email
4. → Email confirmed, redirected to /onboarding/address
5. User enters service area address
6. → /onboarding/categories
7. User selects job categories
8. → /onboarding/payment
9. User enters payment info (starts 7-day trial)
10. → /app (full access with trial)
```

#### Flow 2: Google OAuth Signup
```
1. User clicks "Continue with Google" on landing page
2. → Google OAuth consent screen
3. User authorizes
4. → Redirected to /onboarding/address
5. User enters service area address
6. → /onboarding/categories
7. User selects job categories
8. → /onboarding/payment
9. User enters payment info (starts 7-day trial)
10. → /app (full access with trial)
```

#### Flow 3: Returning User (Email Login)
```
1. User enters email/password on landing page
2. → Redirected to /app (full access)
```

#### Flow 4: Returning User (Google Login)
```
1. User clicks "Continue with Google" on landing page
2. → Google OAuth consent screen
3. User authorizes
4. → Redirected to /app (full access)
```

### Onboarding Steps

#### Step 1: Service Area (/onboarding/address)
**Purpose:** Capture user's work location for permit filtering

**UI Elements:**
- Header: "Where do you work?"
- Address autocomplete input (Geoapify)
- Map preview of selected location
- Progress: Step 1 of 3
- Button: "Continue"

**Validation:**
- Address must be selected from autocomplete
- Coordinates must be captured
- Cannot proceed without valid address

**Data Saved:**
- `users.address` (text)
- `users.address_lat` (decimal)
- `users.address_lng` (decimal)

---

#### Step 2: Job Categories (/onboarding/categories)
**Purpose:** Capture user's trade interests for permit filtering and email digest

**UI Elements:**
- Header: "What interests you?"
- Multi-select category cards with icons
- Visual checkmarks for selected categories
- Progress: Step 2 of 3
- Buttons: "Back" | "Continue"

**Validation:**
- Must select at least 1 category
- Can select multiple categories

**Data Saved:**
- `users.subscribed_categories` (text array)

**Available Categories:**
- All active parent categories from `parent_categories` table
- Displayed with icon, name, and description

---

#### Step 3: Payment (/onboarding/payment)
**Purpose:** Collect payment information to start 7-day free trial

**UI Elements:**
- Header: "Start your 7-day free trial"
- Trial messaging: "You won't be charged until [Date]"
- Pricing: "$29/month"
- Feature list
- Stripe Checkout button
- Progress: Step 3 of 3

**Flow:**
1. User clicks "Subscribe Now"
2. → API creates Stripe Checkout Session
3. → Redirected to Stripe Checkout
4. User enters payment info
5. → Stripe creates subscription with trial
6. → Webhook updates user record
7. → Redirected to /app

**Data Saved (via Stripe webhook):**
- `users.stripe_customer_id`
- `users.stripe_subscription_id`
- `users.subscription_status = 'trialing'`
- `users.subscription_current_period_end`

---

### Trial Initialization

**When:** Automatically on user creation via database trigger

**What Gets Set:**
- `subscription_status = 'trialing'`
- `trial_start = NOW()`
- `trial_end = NOW() + 7 days`

**Purpose:** 
- Allows users to complete onboarding without payment
- Gives access to the app during onboarding
- Trial countdown starts immediately

---

### Access Control

#### Before Onboarding Complete
Users in onboarding can access:
- `/onboarding/address`
- `/onboarding/categories`
- `/onboarding/payment`
- `/verify-email` (email signups only)

Users in onboarding are blocked from:
- `/app` (requires payment setup)

#### After Onboarding Complete
Users with active subscription/trial can access:
- `/app` (full permits table)
- All other authenticated routes

---

### Edge Cases

#### User Abandons Onboarding
**Scenario:** User completes step 1 (address) but never returns

**Behavior:**
- Trial countdown continues
- User can resume onboarding anytime by logging in
- Saved data persists (address, categories if selected)
- After trial expires, redirected to `/onboarding/payment` (blocked from /app)

#### User Already Has Address/Categories
**Scenario:** User previously completed some onboarding steps

**Behavior:**
- Forms pre-populate with saved data
- User can update their selections
- Can skip ahead if they've completed earlier steps

#### Email Not Verified (Email Signup)
**Scenario:** User signs up with email but doesn't verify

**Behavior:**
- Cannot log in until email verified
- Redirected to `/verify-email` on login attempts
- Must click confirmation link in email
- After verification, continues to onboarding

#### Existing User Signs Up Again
**Scenario:** User tries to sign up with email they already used

**Behavior:**
- System detects existing account (identities.length === 0)
- Attempts to sign them in with provided password
- If successful, redirects to `/app`
- If password wrong, shows error

---

## TECH

### File Structure
```
src/app/
├── auth/
│   └── callback/
│       └── page.tsx          # OAuth/email callback router
├── onboarding/
│   ├── address/
│   │   └── page.tsx          # Step 1: Service area
│   ├── categories/
│   │   └── page.tsx          # Step 2: Job categories
│   ├── payment/
│   │   └── page.tsx          # Step 3: Payment (old)
│   └── subscribe/
│       └── page.tsx          # Step 3: Payment (new)
├── verify-email/
│   └── page.tsx              # Email confirmation waiting page

src/components/
├── auth/
│   └── AuthForm.tsx          # Login/signup form with redirects
└── onboarding/
    └── OnboardingLayout.tsx  # Shared layout for onboarding steps
```

### Redirect Configuration

#### Email Signup Redirects
```typescript
// In AuthForm.tsx - onSignup()
await sbc.auth.signUp({
  email: values.email,
  password: values.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

**Important:** The `emailRedirectTo` is where the user lands AFTER clicking the confirmation link in their email.

**Flow:**
1. User signs up → Session not created yet
2. Check `data.session` → null
3. Redirect to `/verify-email`
4. User clicks email link → Supabase confirms email
5. Supabase redirects to `emailRedirectTo` → `/auth/callback`
6. Callback page checks user status and routes appropriately

#### Google OAuth Redirects
```typescript
// In AuthForm.tsx - signInWithGoogle()
await sbc.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

**Important:** The `redirectTo` is where the user lands AFTER completing OAuth with Google.

**Flow:**
1. User clicks "Continue with Google"
2. → Google OAuth consent screen
3. User authorizes
4. Google redirects back to Supabase
5. Supabase creates session
6. Supabase redirects to `redirectTo` → `/auth/callback`
7. Callback page checks user status and routes appropriately

#### Auth Callback Logic (/auth/callback)
The callback page is smart and routes users based on their status:

```typescript
// Check onboarding completion
if (!hasAddress) → /onboarding/address
if (!hasCategories) → /onboarding/categories

// Check subscription status (via Stripe API)
if (hasAccess) → /app
else → /onboarding/payment
```

This ensures:
- New users start onboarding
- Partially completed onboarding resumes at correct step
- Returning users with active subscriptions go straight to app
- Returning users with expired subscriptions go to payment

#### Login Redirects (Existing Users)
```typescript
// In AuthForm.tsx - onLogin()
await sbc.auth.signInWithPassword({
  email: values.email,
  password: values.password,
})

// After success:
router.push('/app')
```

**No Supabase redirect needed** - we handle this with Next.js router since session is created immediately.

---

### Supabase Configuration Required

#### Redirect URLs Whitelist
In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, add:

**Production:**
```
https://www.416permits.com/auth/callback
https://416permits.com/auth/callback
https://www.416permits.com/*
https://416permits.com/*
```

**Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/*
```

**Why needed:** Supabase validates redirect URLs for security. Without whitelisting, it defaults to localhost:3000.

#### Email Templates
In Supabase Dashboard → Authentication → Email Templates → Confirm signup:

Update the confirmation link to include proper redirect:
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

Supabase automatically appends the `emailRedirectTo` parameter to the confirmation URL.

---

### Database Trigger

#### User Creation Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    subscription_status,
    trial_start,
    trial_end,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'trialing',
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Purpose:**
- Automatically creates user record in `public.users` when auth user created
- Initializes 7-day trial immediately
- Allows access to onboarding pages without payment

---

### Route Protection Logic

#### AuthGuard Component
Used to protect `/app` route:

```typescript
export function AuthGuard({ children, requireSubscription = true }) {
  const { isAuthenticated } = useAuth()
  const { data: userData } = useUser()
  
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    
    // Check subscription access (FALLBACK - use API /api/subscription/verify for source of truth)
    if (requireSubscription) {
      const hasAccess = hasSubscriptionAccessFallback(userData)
      
      if (!hasAccess) {
        router.push('/onboarding/payment')
        return
      }
    }
  }, [isAuthenticated, userData])
  
  return children
}
```

#### hasSubscriptionAccessFallback() Logic (Database Fallback Only)

⚠️ **WARNING:** This checks database values which may be stale. Use `/api/subscription/verify` for source of truth.

```typescript
export function hasSubscriptionAccessFallback(user: User | null): boolean {
  if (!user) return false
  
  // Admin always has access
  if (user.admin) return true
  
  const status = user.subscription_status
  const now = new Date()
  
  // Active paid subscription
  if (status === 'active') return true
  
  // Trial period - check if still within trial window
  if (status === 'trialing' && user.trial_end) {
    return now < new Date(user.trial_end)
  }
  
  return false
}
```

---

### Common Issues & Solutions

#### Issue: OAuth redirects to localhost:3000
**Cause:** Redirect URL not whitelisted in Supabase
**Solution:** Add production URL to whitelist in Supabase dashboard

#### Issue: Email confirmation link goes to wrong place
**Cause:** `emailRedirectTo` not set correctly
**Solution:** Verify `emailRedirectTo` parameter in `signUp()` call

#### Issue: New user blocked from onboarding
**Cause:** Trial not initialized, `hasSubscriptionAccessFallback()` returns false
**Solution:** Verify database trigger is creating trial on user creation

#### Issue: User stuck in onboarding loop
**Cause:** Missing address or categories data
**Solution:** Check user record has required fields populated

#### Issue: Existing user sent to onboarding
**Cause:** Login redirect logic sending them to wrong place
**Solution:** Verify login checks for existing data and routes to /app

