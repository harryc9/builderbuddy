# Authentication Flow

## PRODUCT

### Overview
Implement a complete authentication system for Permit Pulse that allows users to sign up and log in using email/password or Google OAuth. The system will gate access to the permits table and provide a foundation for future subscription management.

### User Journey

#### Landing Page with Auth (/)
- **Split view design**: Marketing content (left) + Auth form (right) side-by-side
- **Left Side**: 
  - Hero section with value proposition
  - Preview/screenshot of the permits table to showcase the product
  - Key features and benefits
  - Social proof elements
- **Right Side**:
  - Auth form with dual mode (Sign In / Sign Up toggle)
  - Email/password fields
  - Google OAuth button
  - Clean, professional design
- **Header**: 
  - Logo
  - If authenticated: UserAvatar with access to /app
  - If not authenticated: Show auth form on the same page

#### Protected App Area (/app)
- Full permits table with filters
- Requires authentication to access
- If not authenticated, redirect to / (landing with auth)
- Maintains filter state and search parameters via URL (nuqs)
- Header with UserAvatar and sign out option

### Authentication Rules
1. Unauthenticated users can access:
   - / (landing page with auth form)

2. Authenticated users can access:
   - / (landing page, but shows "Go to App" CTA)
   - /app (permits table) - primary destination

3. Redirect Logic:
   - Unauthenticated user visits /app → redirect to /
   - Authenticated user lands on / → can click through to /app
   - After successful login/signup → redirect to /app
   - After logout → redirect to / (landing page with auth)

### User Experience Considerations
- **7-day free trial** messaging throughout
- Loading states for all auth operations
- Clear error messages for auth failures
- Email confirmation required for email signups
- Google OAuth seamless experience (no email confirmation needed)
- Remember user session across browser sessions
- Secure session management with automatic token refresh
- Clean UI with consistent styling using Shadcn components
- Smooth toggle between Sign In and Sign Up modes
- Preview of product functionality visible before signing up

### Future Enhancements (Out of Scope)
- User settings modal with preferences (trade keywords, service areas, email preferences)
- Password reset flow (/reset-password, /update-password routes)
- Subscription management and billing
- Trial period tracking and conversion
- User profile management
- Multi-factor authentication
- Social proof (testimonials, user count, etc.)

---

## TECH

### Current State Analysis

#### Existing Setup
✅ **Already Implemented:**
- AuthProvider context with session management
- AuthForm component with email and Google OAuth support
- Separate login (/login) and signup (/signup) pages
- Reset password flow (/reset-password, /update-password)
- Supabase client configured
- AuthGuard component for protecting routes
- UserAvatar component with sign out functionality
- LandingPage component with marketing content
- Permits table components (PermitsTable, PermitsTableFilters, PermitsTableColumns)

❌ **Issues to Fix:**
- Root (/) currently shows permits table directly - needs to show landing + auth split view
- Auth form redirects to /dashboard which doesn't exist (should be /app)
- No route protection on permits table
- Need to move permits table from / to /app with auth protection
- Need split-view design at root (marketing + auth form side-by-side)
- Separate /login and /signup pages should be removed (all auth at /)
- Trial messaging shows "7-day free trial"

### Database Schema
- `auth.users` table managed by Supabase Auth
- `public.users` table exists but empty (future: user preferences via settings modal)
- Google OAuth provider needs to be configured in Supabase dashboard (user will set up)

### Technical Architecture

#### File Structure Changes
```
src/app/
├── page.tsx                      # Landing + Auth split view (public)
├── app/                          # NEW: Protected app directory
│   └── page.tsx                  # NEW: Permits table (protected)
├── login/page.tsx                # DELETE: No longer needed
├── signup/page.tsx               # DELETE: No longer needed
├── reset-password/page.tsx       # IGNORE: Future enhancement
└── update-password/page.tsx      # IGNORE: Future enhancement

src/components/
├── auth/
│   └── AuthForm.tsx              # UPDATE: Support toggle between login/signup
├── LandingWithAuth.tsx           # NEW: Split view component
└── PermitsTablePreview.tsx       # NEW: Static preview for landing page
```

#### Authentication Flow

**1. Session Management (Already Working)**
- AuthProvider wraps entire app in layout.tsx
- Uses Supabase Auth SDK (`sbc.auth`)
- Manages session state: user, session, isLoading, isAuthenticated
- Listens to auth state changes with `onAuthStateChange`
- Provides signOut() and refreshSession() methods

**2. Login/Signup Flow (Already Working)**
- Email/password: `sbc.auth.signInWithPassword()` / `sbc.auth.signUp()`
- Google OAuth: `sbc.auth.signInWithOAuth({ provider: 'google' })`
- Comprehensive error handling with user-friendly messages
- Loading states during auth operations
- Single form with toggle between login/signup modes

**3. Route Protection (Needs Implementation)**
- Use AuthGuard component to wrap protected routes
- Check authentication status in page components
- Redirect logic based on auth state (redirect to / instead of /login)

### Implementation Steps

#### Step 1: Create Protected /app Route with Permits Table
**Goal**: Move permits table from root to /app with auth protection

**Tasks**:
1. Create `/src/app/app/page.tsx` directory and file
2. Copy current root page.tsx content to new /app/page.tsx
3. Wrap with AuthGuard to redirect unauthenticated users to /
4. Update AuthGuard to redirect to / instead of /login
5. Test that unauthenticated access redirects to /

**Files Modified**:
- NEW: `/src/app/app/page.tsx` (protected permits table)
- UPDATE: `/src/components/auth/AuthGuard.tsx` (redirect to / instead of /login)

**Validation**: 
- Visit /app unauthenticated → should redirect to /
- Login → should access /app successfully
- Permits table filters and search work as before

---

#### Step 2: Update AuthForm Component
**Goal**: Support inline mode with toggle between login/signup, update redirects, update trial copy

**Tasks**:
1. Update AuthForm to support a new "inline" mode (no "Back to Home" link)
2. Add visual toggle to switch between Sign In and Sign Up modes
3. Update redirects from /dashboard to /app
4. Update trial messaging to show "7-day free trial"
5. Remove "Forgot password?" link (future enhancement)
6. Ensure auth form works in side-by-side layout context

**Files Modified**:
- `/src/components/auth/AuthForm.tsx`

**Validation**:
- Toggle between Sign In and Sign Up modes works smoothly
- After successful auth → redirects to /app
- Trial messaging shows "7-day free trial"
- Form works in split-view layout

---

#### Step 3: Create Landing with Auth Split View Component
**Goal**: Create new component that combines marketing content with auth form side-by-side

**Tasks**:
1. Create new `LandingWithAuth.tsx` component
2. Left side: Hero section with value proposition, table preview image/component
3. Right side: AuthForm component in inline mode
4. Make responsive (stack vertically on mobile)
5. Add table preview/screenshot to showcase the product
6. Update header to show "Go to App" button if authenticated

**Files Modified**:
- NEW: `/src/components/LandingWithAuth.tsx`

**Validation**:
- Visit / → see split view with marketing + auth form
- Responsive design works on mobile
- Table preview visible and attractive
- If authenticated, shows "Go to App" CTA instead of auth form

---

#### Step 4: Replace Root Page with Landing Split View
**Goal**: Update root page to show new split view component

**Tasks**:
1. Replace `/src/app/page.tsx` content with LandingWithAuth component
2. Check auth state - if authenticated, show "Go to App" CTA prominently
3. Keep it simple and focused on conversion

**Files Modified**:
- `/src/app/page.tsx`

**Validation**:
- Visit / unauthenticated → see landing + auth form
- Visit / authenticated → see landing with "Go to App" CTA
- Smooth experience for all states

---

#### Step 5: Delete Unused Auth Routes
**Goal**: Remove separate /login and /signup pages

**Tasks**:
1. Delete `/src/app/login/page.tsx`
2. Delete `/src/app/signup/page.tsx`
3. Ensure no components reference these routes

**Files Deleted**:
- `/src/app/login/page.tsx`
- `/src/app/signup/page.tsx`

**Validation**:
- All auth happens at /
- No broken links to /login or /signup

---

#### Step 6: Update Sign Out Behavior
**Goal**: Ensure sign out redirects to / (landing with auth)

**Tasks**:
1. Check UserAvatar component sign out logic
2. Ensure redirect goes to / after sign out
3. Test from /app

**Files Modified**:
- `/src/components/UserAvatar.tsx` (if needed)

**Validation**:
- Sign out from /app → redirects to /
- User sees landing page with auth form
- Session cleared properly

---

#### Step 7: Test Complete Auth Flows
**Goal**: End-to-end testing of all authentication paths

**Test Cases**:
1. **New User - Email Signup**:
   - Visit /
   - Toggle to "Sign Up" mode
   - Fill out signup form
   - Receive confirmation email
   - Click confirmation link
   - Redirected to /app
   - Can access permits table

2. **New User - Google Signup**:
   - Visit /
   - Click "Continue with Google"
   - Complete Google OAuth
   - Redirected to /app immediately
   - Can access permits table

3. **Existing User - Email Login**:
   - Visit /
   - Enter credentials in "Sign In" mode
   - Redirected to /app
   - Can access permits table

4. **Existing User - Google Login**:
   - Visit /
   - Click "Continue with Google"
   - Redirected to /app
   - Can access permits table

5. **Protected Route Access**:
   - Visit /app while logged out
   - Redirected to /
   - After login, redirected to /app

6. **Sign Out**:
   - Sign out from /app
   - Redirected to / (landing with auth)
   - Cannot access /app anymore

7. **Session Persistence**:
   - Log in
   - Close browser
   - Reopen browser
   - Still logged in
   - Can access /app

8. **Responsive Design**:
   - Visit / on mobile
   - Auth form and content stack vertically
   - Form remains functional
   - Can complete signup/login

**Validation**: All test cases pass successfully

---

### Technical Considerations

#### Security
- All auth tokens stored in httpOnly cookies by Supabase
- CSRF protection handled by Supabase Auth
- Row Level Security (RLS) policies should be enabled on permits table (future step)
- Passwords hashed with bcrypt by Supabase
- Session tokens automatically refresh before expiration

#### Performance
- AuthProvider loads once at app level
- Session state cached in React context
- Minimal re-renders with proper state management
- AuthGuard shows loading spinner during auth check

#### Error Handling
- Comprehensive error messages in AuthForm
- Network errors handled gracefully
- Invalid token errors for password reset
- Email not confirmed errors
- User already exists errors

#### Edge Cases
- Email confirmation required for email signups
- Google OAuth users skip email confirmation
- Invalid reset tokens show clear error
- Expired sessions handled with refresh
- Concurrent tab sessions stay in sync

### Dependencies
- `@supabase/supabase-js`: ^2.79.0 ✅ (already installed)
- `react-hook-form`: ^7.66.0 ✅ (already installed)
- `zod`: ^3.25.76 ✅ (already installed)
- `@hookform/resolvers`: ^3.10.0 ✅ (already installed)
- All UI components from Shadcn ✅ (already installed)

### Migration Notes
- No database migrations needed
- Existing auth.users data preserved
- Supabase Auth schema managed automatically
- No breaking changes to existing auth code

### Rollback Plan
If issues arise:
1. Revert page.tsx changes to show permits table at root (original behavior)
2. Restore /login and /signup routes from git history
3. Keep /app route but make it publicly accessible
4. Remove AuthGuard wrapper
5. Update redirects back to /dashboard (or just remove redirects)

### Future Improvements (Not in This Feature)
- Add user preferences table sync with auth.users
- Implement subscription status checking
- Add trial period tracking
- Email verification reminders
- Rate limiting on auth endpoints
- Audit logging for auth events
- Magic link authentication
- Multi-factor authentication (MFA)

