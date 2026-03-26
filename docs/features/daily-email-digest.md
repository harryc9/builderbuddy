# Daily Email Digest - 6AM Permit Notifications

---

## PRODUCT SECTION

### Problem Statement

Users need to stay on top of relevant permit opportunities without manually checking the app daily. A well-timed, curated email digest at 6AM positions PermitPulse as the first thing contractors see when they start their workday.

### User Story

**As a contractor**, I want to receive an email at 6AM with the most relevant permits so that I can:
- Start my day with fresh opportunities
- Act quickly on high-value projects (first-mover advantage)
- Stay competitive without constant manual searching
- Get notified about permit changes that matter to my business

### Core Product Questions

**1. Timing - When should emails be sent?**

**6AM EST** is optimal because:
- Contractors typically start work at 7-8AM
- Gives them time to review during coffee/breakfast
- Early enough to be the first contact in their inbox
- Matches construction industry work patterns

**How this fits with ingestion:**
- Ingestion runs at 2AM EST (see `.github/workflows/daily-permits.yml`)
- By 2:30AM: ingestion + categorization + geocoding complete
- By 6AM: 3.5 hour buffer for email generation (safe margin)

**2. Content - What permits should be included?**

**Tier 1: Category Matches (Primary)**
- Permits matching user's `subscribed_categories` (from `users.subscribed_categories`)
- User has already expressed explicit interest in these job roles
- These are the "must show" permits

**Tier 2: Location-Based (Secondary)**
- If user has `address_lat` and `address_lng`, calculate distance to permits
- Show permits within reasonable distance (e.g., 10-50km based on user preference)
- Even if not in subscribed categories, proximity matters

**Tier 3: High-Value "Hot Permits" (Fallback)**
If no category or location matches, show 3-5 "most interesting" permits from yesterday:
- High estimated cost (`est_const_cost > $100k`)
- Critical status changes (from `permit_changes` table with `business_impact = 'CRITICAL'`)
- Multi-trade opportunities (permits with 5+ job roles)
- Builder is known/active (has `builder_name`)

**Always send an email** - even if no perfect matches. Empty emails create abandonment.

**3. Permit Freshness - How to select "best permits of the day"?**

**⚠️ CRITICAL INSIGHT:** Even though ingestion runs daily, new permits in our database (`first_seen_at = yesterday`) were often issued 3+ days ago in the real world. Toronto's API has a lag - permits appear in their system days after being issued.

**This means we need TWO definitions of "new":**

**Definition 1: New to Database (Priority 1)**
```sql
WHERE first_seen_at >= NOW() - INTERVAL '24 hours'
```
- Permits we just discovered in yesterday's ingestion
- Users haven't seen these in our system before
- Label: "NEW TO PERMITPULSE"

**Definition 2: Recently Issued (Priority 2)**
```sql
WHERE issued_date >= NOW() - INTERVAL '7 days'
AND first_seen_at >= NOW() - INTERVAL '3 days'
```
- Permits issued in last 7 days (still fresh from Toronto)
- Appeared in our database within last 3 days (to avoid showing very old permits)
- Label: "ISSUED THIS WEEK"

**Updated Permits (Priority 3):**
```sql
JOIN permit_changes pc ON permits.id = pc.permit_id
WHERE pc.detected_at >= NOW() - INTERVAL '24 hours'
AND pc.business_impact IN ('CRITICAL', 'HIGH')
```
- Permits that changed status (e.g., "Application" → "Permit Issued")
- Cost increased by >20%
- Builder/contractor changed
- These signal project movement and urgency
- Label: "UPDATED"

**Email Strategy:**
1. **Show all three types** in the email (New to DB, Recently Issued, Updated)
2. **Prioritize updates** - these are the most actionable (status changes = go/no-go signals)
3. **De-emphasize "new" permits** - clarify they might be a few days old
4. **Focus on "what changed yesterday"** rather than "permits issued yesterday"

**Recency Weighting:**
- Permit changes in last 24h: 100% weight (Priority 1)
- First seen in last 24h: 80% weight (Priority 2)
- Issued in last 7 days: 60% weight (Priority 3)
- Everything else: 0% weight (don't show)

**4. Permit Ranking/Scoring - How to order permits in email?**

Each permit gets a relevance score (0-100):

```typescript
function calculatePermitScore(permit: Permit, user: User): number {
  let score = 0
  
  // Category match (0-40 points)
  const categoryMatches = permit.job_roles?.filter(role => 
    user.subscribed_categories.includes(role.slug)
  ).length || 0
  score += Math.min(categoryMatches * 10, 40) // Cap at 40 points
  
  // Cost match (0-20 points)
  if (permit.est_const_cost) {
    if (user.min_project_cost && permit.est_const_cost >= user.min_project_cost) {
      score += 20
    } else if (!user.min_project_cost && permit.est_const_cost > 50000) {
      score += 10 // Default bonus for substantial projects
    }
  }
  
  // Distance bonus (0-15 points)
  if (user.address_lat && permit.location) {
    const distanceKm = calculateDistance(user.address_lat, user.address_lng, permit.location)
    if (distanceKm <= 5) score += 15
    else if (distanceKm <= 10) score += 10
    else if (distanceKm <= 25) score += 5
  }
  
  // Freshness (0-10 points)
  const hoursSinceIssued = (Date.now() - new Date(permit.first_seen_at).getTime()) / (1000 * 60 * 60)
  if (hoursSinceIssued <= 12) score += 10
  else if (hoursSinceIssued <= 24) score += 5
  
  // Critical change (0-10 points)
  if (permit.hasRecentCriticalChange) score += 10
  
  // Builder present (0-5 points)
  if (permit.builder_name && user.only_with_builder) score += 5
  
  return score
}
```

**Top 10-20 permits** ordered by score descending.

**5. Alternative Approach - User-Defined Alerts?**

**Option A: Daily Digest (Current Proposal)**
- Pros: Simple, predictable, easy to implement
- Cons: Not customizable per-user timing, one-size-fits-all

**Option B: User-Defined Search Alerts**
- User creates custom searches (like saved filters on UI)
- Each search becomes a subscribable "alert"
- More granular control (e.g., "Multi-family projects >$500k in Downtown")
- Pros: Power users love it, very flexible
- Cons: Complex UX, harder to implement, intimidating for casual users

**Recommendation: Start with Daily Digest (Option A)**
- Simpler to build and test
- Covers 90% of use cases
- Can layer on custom alerts later (Phase 2)
- Daily digest is table stakes for SaaS tools

**Option C: Real-Time Alerts (Future)**
- Instant notification when high-value permit posted
- Requires webhooks, push notifications, SMS
- Phase 3 feature (premium tier?)

### Email Content Structure

**Subject Line:**
```
🔨 3 permit updates in Toronto matching [Category] - [Date]
```

Note: Use "updates" instead of "new" to avoid confusion (permits might be days old)

**Email Body:**
1. **Personalized Greeting**
   - "Good morning [First Name]"
   - "Here are today's permits matching your interests"

2. **Top Permits (5-10 cards)**
   Each permit card shows:
   - Full address (clickable link to permit details)
   - Estimated cost (big, prominent)
   - Status badge (color-coded)
   - Job role badges (user's subscribed categories highlighted)
   - Distance from user's address (if available)
   - "New" or "Updated" badge
   - Brief description (truncated to 2 lines)

3. **CTA Section**
   - "View all [N] permits in your dashboard →"
   - Link to app with pre-filtered search (user's categories + yesterday's date)

4. **Footer**
   - Unsubscribe link (honor email preferences)
   - Manage preferences link (to settings page)
   - Company address (CAN-SPAM compliance)

### User Preferences & Controls

Users can control email behavior via settings page:

```typescript
// users.email_preferences (JSONB column)
{
  daily_digest_enabled: boolean          // Default: true
  digest_time: '6am' | '7am' | '8am'     // Default: 6am (future feature)
  max_permits_per_email: number          // Default: 10
  min_permit_cost: number | null         // Default: null (show all)
  include_no_matches: boolean            // Default: true (send "hot permits" fallback)
  distance_filter_km: number | null      // Default: null (show all)
}
```

### Success Metrics

**Email Engagement:**
- Open rate (target: >30%)
- Click-through rate (target: >15%)
- Unsubscribe rate (target: <2%)

**Business Impact:**
- Daily active users (email → app visit)
- Permits viewed via email (conversion)
- Time-to-first-action (how quickly users act on emailed permits)

**Quality Signal:**
- "Mark as irrelevant" feedback (future feature)
- User adjusts filters after email (indicates poor targeting)

---

## TECH SECTION

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ 2:00 AM EST - Ingestion Pipeline (GitHub Actions)      │
│  1. ingest-permits.ts                                   │
│  2. categorize-permits.ts                               │
│  3. geocode-permits.ts                                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 6:00 AM EST - Email Digest Cron (Vercel Cron)          │
│  /api/cron/send-daily-digest/route.ts                  │
│    1. Fetch active users (trial + paid)                │
│    2. For each user:                                    │
│       a. Query matching permits                         │
│       b. Score and rank permits                         │
│       c. Generate email HTML                            │
│       d. Send via Resend                                │
└─────────────────────────────────────────────────────────┘
```

### Database Schema (No Changes Needed)

Existing tables already support this:

**users table:**
- `subscribed_categories` (text[]) - Job role slugs user is interested in
- `address`, `address_lat`, `address_lng` - User location for distance filtering
- `min_project_cost` (numeric) - Minimum project cost filter
- `only_with_builder` (boolean) - Only show permits with builder names
- `email_preferences` (jsonb) - Email preference controls

**permits table:**
- `first_seen_at` (timestamp) - When permit was first ingested (new permits)
- `updated_at` (timestamp) - Last update time
- `location` (geometry) - PostGIS point for distance calculations
- All relevant fields for filtering (cost, status, description, etc.)

**permit_changes table:**
- `detected_at` (timestamp) - When change was detected
- `business_impact` (varchar) - CRITICAL, HIGH, MEDIUM, LOW
- `change_type` (varchar) - status, cost, timeline, scope
- Used to identify "hot" permits with recent important changes

**permit_job_roles table:**
- Links permits to job roles (many-to-many)
- Used for category matching

### Implementation Steps

#### Step 1: Email Infrastructure Setup
1. **Install Resend** (email provider)
   ```bash
   bun add resend
   bun add react-email @react-email/components
   ```

2. **Create Resend account** and get API key
   - Add to Vercel env vars: `RESEND_API_KEY`

3. **Verify sender domain** (e.g., `noreply@permitpulse.com`)

#### Step 2: Email Template Component
Create: `emails/daily-digest.tsx`

```tsx
import {
  Body, Container, Head, Heading, Html, Link,
  Preview, Section, Text
} from '@react-email/components'

type DailyDigestEmailProps = {
  userName: string
  permits: Array<{
    id: string
    permit_num: string
    full_address: string
    est_const_cost: number
    status: string
    description: string
    issued_date: string
    distance_km?: number
    job_roles: Array<{ slug: string; name: string; color_hex: string }>
    is_new: boolean
    is_updated: boolean
  }>
  userCategories: string[]
  totalMatchingPermits: number
  digestDate: string
}

export default function DailyDigestEmail({
  userName,
  permits,
  userCategories,
  totalMatchingPermits,
  digestDate,
}: DailyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {permits.length} new permits matching your interests
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Good morning, {userName}! 👋
          </Heading>
          
          <Text style={text}>
            Here are <strong>{permits.length} permits</strong> from {digestDate} 
            matching your interests:
          </Text>
          
          {permits.map((permit) => (
            <Section key={permit.id} style={permitCard}>
              {/* Address */}
              <Link 
                href={`${process.env.NEXT_PUBLIC_APP_URL}/permits/${permit.id}`}
                style={addressLink}
              >
                {permit.full_address}
              </Link>
              
              {/* Cost + Status */}
               <div style={metaRow}>
                <Text style={cost}>
                  ${(permit.est_const_cost || 0).toLocaleString()}
                </Text>
                <span style={statusBadge}>{permit.status}</span>
                {permit.is_updated && <span style={updatedBadge}>UPDATED</span>}
                {permit.is_new_to_db && <span style={newBadge}>NEW</span>}
                {permit.is_recently_issued && (
                  <span style={recentlyIssuedBadge}>
                    ISSUED {permit.days_since_issued}d ago
                  </span>
                )}
              </div>
              
              {/* Job Role Badges */}
              <div style={badgesRow}>
                {permit.job_roles.slice(0, 5).map((role) => (
                  <span 
                    key={role.slug}
                    style={{
                      ...roleBadge,
                      backgroundColor: userCategories.includes(role.slug) 
                        ? role.color_hex 
                        : '#E5E7EB',
                      fontWeight: userCategories.includes(role.slug) ? 'bold' : 'normal',
                    }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>
              
              {/* Distance */}
              {permit.distance_km && (
                <Text style={distance}>
                  📍 {permit.distance_km.toFixed(1)} km away
                </Text>
              )}
              
              {/* Description */}
              <Text style={description}>
                {permit.description?.substring(0, 150)}...
              </Text>
            </Section>
          ))}
          
          {/* CTA */}
          <Section style={ctaSection}>
            <Link 
              href={`${process.env.NEXT_PUBLIC_APP_URL}/permits?date_from=${digestDate}`}
              style={ctaButton}
            >
              View all {totalMatchingPermits} permits →
            </Link>
          </Section>
          
          {/* Footer */}
          <Section style={footer}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/settings`}>
              Manage preferences
            </Link>
            {' · '}
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/settings?unsubscribe=daily`}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles (inline for email compatibility)
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }
const container = { margin: '0 auto', padding: '20px', maxWidth: '600px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }
const text = { fontSize: '16px', lineHeight: '24px', marginBottom: '16px' }
const permitCard = { 
  backgroundColor: '#ffffff', 
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px'
}
const addressLink = { fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }
const metaRow = { display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }
const cost = { fontSize: '20px', fontWeight: 'bold', color: '#059669' }
const statusBadge = { 
  padding: '4px 8px', 
  backgroundColor: '#dbeafe', 
  borderRadius: '4px',
  fontSize: '12px'
}
const newBadge = { 
  padding: '4px 8px', 
  backgroundColor: '#10b981', 
  color: '#ffffff',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold'
}
const updatedBadge = { 
  padding: '4px 8px', 
  backgroundColor: '#f59e0b', 
  color: '#ffffff',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold'
}
const badgesRow = { display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }
const roleBadge = { 
  padding: '4px 8px', 
  borderRadius: '4px',
  fontSize: '11px'
}
const distance = { fontSize: '14px', color: '#6b7280', marginTop: '8px' }
const description = { fontSize: '14px', color: '#374151', marginTop: '8px' }
const ctaSection = { textAlign: 'center', marginTop: '32px' }
const ctaButton = {
  backgroundColor: '#1d4ed8',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold'
}
const footer = { 
  textAlign: 'center', 
  marginTop: '32px',
  fontSize: '12px',
  color: '#6b7280'
}
```

#### Step 3: Permit Selection & Scoring Logic
Create: `lib/emails/permit-selection.ts`

```typescript
import { sb } from '@lib/supabase'
import type { Database } from '@/types/supabase.public.types'

type User = Database['public']['Tables']['users']['Row']
type Permit = Database['public']['Tables']['permits']['Row'] & {
  job_roles?: Array<{
    slug: string
    name: string
    color_hex: string
  }>
  distance_km?: number
  has_recent_critical_change?: boolean
}

type PermitWithScore = Permit & { score: number }

/**
 * Get permits for user's daily digest
 * Returns top N scored permits from last 24-48 hours
 */
export async function getPermitsForUser(
  user: User,
  limit: number = 10
): Promise<Permit[]> {
  
  // Get permits from multiple freshness categories
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  const threeDaysAgo = new Date(now)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  // Strategy: Get permits that are EITHER:
  // 1. New to database (first_seen_at = yesterday)
  // 2. Recently issued (issued_date within 7 days AND first_seen_at within 3 days)
  // 3. Recently updated (via permit_changes join)
  
  // Build base query - get permits from last 3 days
  let query = sb
    .from('permits')
    .select(`
      *,
      permit_job_roles!inner(
        job_role_slug,
        job_role_definitions!inner(
          job_role_name,
          job_role_slug,
          color_hex
        )
      )
    `)
    .gte('first_seen_at', threeDaysAgo.toISOString())
    .gte('issued_date', sevenDaysAgo.toISOString().split('T')[0]) // Last 7 days issued
  
  // Apply user filters
  if (user.only_with_builder) {
    query = query.not('builder_name', 'is', null)
  }
  
  if (user.only_with_cost) {
    query = query.not('est_const_cost', 'is', null)
    query = query.gt('est_const_cost', 0)
  }
  
  if (user.min_project_cost) {
    query = query.gte('est_const_cost', user.min_project_cost)
  }
  
  // Fetch permits
  const { data: permits, error } = await query
  
  if (error || !permits) {
    console.error('Error fetching permits:', error)
    return []
  }
  
  // Transform to flat structure and add freshness flags
  const permitMap = new Map<string, Permit>()
  for (const permit of permits) {
    if (!permitMap.has(permit.id)) {
      const firstSeenDate = new Date(permit.first_seen_at)
      const issuedDate = new Date(permit.issued_date)
      const daysSinceIssued = Math.floor(
        (now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      permitMap.set(permit.id, {
        ...permit,
        job_roles: [],
        is_new_to_db: firstSeenDate >= yesterday,
        is_recently_issued: daysSinceIssued <= 7,
        days_since_issued: daysSinceIssued
      })
    }
    const p = permitMap.get(permit.id)!
    if (permit.permit_job_roles?.[0]?.job_role_definitions) {
      p.job_roles!.push({
        slug: permit.permit_job_roles[0].job_role_definitions.job_role_slug,
        name: permit.permit_job_roles[0].job_role_definitions.job_role_name,
        color_hex: permit.permit_job_roles[0].job_role_definitions.color_hex
      })
    }
  }
  
  let permitsList = Array.from(permitMap.values())
  
  // Add distance if user has location
  if (user.address_lat && user.address_lng) {
    const permitIds = permitsList.map(p => p.id)
    const { data: distances } = await sb.rpc('add_distance_to_permits', {
      permit_uuids: permitIds,
      user_lat: Number(user.address_lat),
      user_lng: Number(user.address_lng)
    })
    
    if (distances) {
      const distanceMap = new Map(
        distances.map((d: any) => [d.permit_id, d.distance_km])
      )
      permitsList = permitsList.map(p => ({
        ...p,
        distance_km: distanceMap.get(p.id)
      }))
    }
  }
  
  // Get recent critical changes
  const { data: recentChanges } = await sb
    .from('permit_changes')
    .select('permit_id')
    .in('business_impact', ['CRITICAL', 'HIGH'])
    .gte('detected_at', yesterday.toISOString())
  
  const changedPermitIds = new Set(recentChanges?.map(c => c.permit_id) || [])
  permitsList = permitsList.map(p => ({
    ...p,
    has_recent_critical_change: changedPermitIds.has(p.id)
  }))
  
  // Score and rank
  const scoredPermits = permitsList.map(p => ({
    ...p,
    score: calculatePermitScore(p, user)
  }))
  
  scoredPermits.sort((a, b) => b.score - a.score)
  
  // Filter to minimum score threshold (30+)
  const relevantPermits = scoredPermits.filter(p => p.score >= 30)
  
  // If not enough relevant permits, get "hot permits" as fallback
  if (relevantPermits.length < 3) {
    const hotPermits = await getHotPermits(yesterday, 5)
    return [...relevantPermits, ...hotPermits].slice(0, limit)
  }
  
  return relevantPermits.slice(0, limit)
}

/**
 * Calculate relevance score (0-100)
 * 
 * PRIORITY ORDER:
 * 1. Critical changes (most actionable)
 * 2. Category matches (user interest)
 * 3. Recently issued (still fresh opportunities)
 * 4. Cost/distance/builder (refinement)
 */
function calculatePermitScore(permit: Permit, user: User): number {
  let score = 0
  
  // Critical change (0-25 points) - HIGHEST PRIORITY
  // Status changes are the most actionable signal
  if (permit.has_recent_critical_change) score += 25
  
  // Category match (0-30 points)
  const categoryMatches = permit.job_roles?.filter(role => 
    user.subscribed_categories?.includes(role.slug)
  ).length || 0
  score += Math.min(categoryMatches * 10, 30)
  
  // Cost match (0-15 points)
  if (permit.est_const_cost) {
    if (user.min_project_cost && Number(permit.est_const_cost) >= Number(user.min_project_cost)) {
      score += 15
    } else if (!user.min_project_cost && Number(permit.est_const_cost) > 50000) {
      score += 8
    }
  }
  
  // Distance bonus (0-15 points)
  if (permit.distance_km !== undefined) {
    if (permit.distance_km <= 5) score += 15
    else if (permit.distance_km <= 10) score += 10
    else if (permit.distance_km <= 25) score += 5
  }
  
  // Freshness (0-10 points)
  // Prioritize: Updated > New to DB > Recently issued
  if (permit.has_recent_critical_change) {
    score += 10 // Already got 25 points above, add bonus
  } else if (permit.is_new_to_db) {
    score += 8
  } else if (permit.is_recently_issued && permit.days_since_issued <= 3) {
    score += 5
  }
  
  // Builder present (0-5 points)
  if (permit.builder_name && user.only_with_builder) score += 5
  
  return score
}

/**
 * Get "hot permits" as fallback when no category matches
 * High-value, interesting permits regardless of category
 */
async function getHotPermits(
  fromDate: Date,
  limit: number
): Promise<Permit[]> {
  const { data, error } = await sb
    .from('permits')
    .select(`
      *,
      permit_job_roles(
        job_role_definitions(*)
      )
    `)
    .gte('first_seen_at', fromDate.toISOString())
    .not('est_const_cost', 'is', null)
    .gte('est_const_cost', 100000) // High-value only
    .not('builder_name', 'is', null) // Known builders only
    .order('est_const_cost', { ascending: false })
    .limit(limit)
  
  if (error || !data) return []
  
  // Transform structure
  return data.map(p => ({
    ...p,
    job_roles: p.permit_job_roles?.map((pjr: any) => ({
      slug: pjr.job_role_definitions.job_role_slug,
      name: pjr.job_role_definitions.job_role_name,
      color_hex: pjr.job_role_definitions.color_hex
    }))
  }))
}
```

#### Step 4: Cron Job API Route
Create: `src/app/api/cron/send-daily-digest/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import DailyDigestEmail from '@/emails/daily-digest'
import { getPermitsForUser } from '@/lib/emails/permit-selection'
import { sb } from '@/lib/supabase'
import { DateTime } from 'luxon'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  // Verify cron secret (security)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const startTime = Date.now()
  console.log('🔔 Starting daily digest send...')
  
  // Get all users with email digest enabled
  const { data: users, error: usersError } = await sb
    .from('users')
    .select('*')
    .neq('email', null)
  
  if (usersError || !users) {
    console.error('Error fetching users:', usersError)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
  
  // Filter users with digest enabled
  const eligibleUsers = users.filter(u => {
    const prefs = u.email_preferences as any
    return prefs?.daily_digest_enabled !== false // Default: true
  })
  
  console.log(`📧 Found ${eligibleUsers.length} eligible users`)
  
  let emailsSent = 0
  let errors = 0
  const yesterday = DateTime.now().minus({ days: 1 }).toISODate()
  
  for (const user of eligibleUsers) {
    try {
      // Get permits for this user
      const permits = await getPermitsForUser(user, 10)
      
      if (permits.length === 0) {
        console.log(`⏭️  No permits for ${user.email}`)
        continue
      }
      
      // Send email
      const { data, error } = await resend.emails.send({
        from: 'PermitPulse <noreply@permitpulse.com>',
        to: user.email,
        subject: `🔨 ${permits.length} new permits in Toronto - ${yesterday}`,
        react: DailyDigestEmail({
          userName: user.email.split('@')[0], // Use email prefix as name
          permits: permits.map(p => ({
            id: p.id,
            permit_num: p.permit_num,
            full_address: p.full_address || 'Address not available',
            est_const_cost: Number(p.est_const_cost || 0),
            status: p.status || 'Unknown',
            description: p.description || '',
            issued_date: p.issued_date || '',
            distance_km: p.distance_km,
            job_roles: p.job_roles || [],
            is_new: true, // All permits from yesterday are "new"
            is_updated: p.has_recent_critical_change || false
          })),
          userCategories: user.subscribed_categories || [],
          totalMatchingPermits: permits.length,
          digestDate: yesterday || ''
        })
      })
      
      if (error) {
        console.error(`❌ Error sending to ${user.email}:`, error)
        errors++
      } else {
        console.log(`✅ Sent to ${user.email} (${permits.length} permits)`)
        emailsSent++
      }
      
    } catch (err) {
      console.error(`❌ Exception for ${user.email}:`, err)
      errors++
    }
  }
  
  const duration = Date.now() - startTime
  console.log(`\n✅ Daily digest complete:`)
  console.log(`   Emails sent: ${emailsSent}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`)
  
  return NextResponse.json({
    success: true,
    emailsSent,
    errors,
    duration
  })
}
```

#### Step 5: Vercel Cron Configuration
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-daily-digest",
      "schedule": "0 11 * * *"
    }
  ]
}
```

Note: `0 11 * * *` = 11:00 UTC = 6:00 AM EST (UTC-5)

#### Step 6: Environment Variables
Add to Vercel project settings:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
CRON_SECRET=<random-secret-string>
NEXT_PUBLIC_APP_URL=https://permitpulse.com
```

### Testing Plan

**1. Local Testing (Development)**
```bash
# Test email rendering
bun run email:dev

# Test permit selection logic
bun run test lib/emails/permit-selection.test.ts

# Test cron endpoint manually
curl -X GET http://localhost:3000/api/cron/send-daily-digest \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**2. Staging Testing**
- Deploy to staging environment
- Manually trigger cron via Vercel dashboard
- Send test emails to team addresses
- Verify email rendering in Gmail, Outlook, Apple Mail

**3. Production Rollout**
- Start with small batch (10 users)
- Monitor deliverability, open rates, errors
- Gradually increase to full user base
- Set up alerts for high error rates

### Error Handling & Monitoring

**Error Cases:**
1. **User has no permits** → Skip user (log, don't send empty email)
2. **Email send fails** → Log error, continue to next user
3. **Database query fails** → Retry once, then skip user
4. **Rate limit hit** → Batch processing with delays

**Monitoring:**
- Slack notifications for cron job completion
- Error rate alerts (>10% failure = notify team)
- Weekly digest report (emails sent, engagement metrics)

**Logging:**
```typescript
await sendSlackMessage({
  type: 'success',
  title: 'Daily Digest Complete',
  message: `Sent ${emailsSent} emails in ${duration}ms. ${errors} errors.`
})
```

### Cost Estimation

**Resend Pricing:**
- $0.10 per 1,000 emails
- 100 users × 30 days = 3,000 emails/month = **$0.30/month**
- 1,000 users × 30 days = 30,000 emails/month = **$3/month**

**Database Queries:**
- Each user requires ~3-5 queries (permits, distances, changes)
- 100 users = 300-500 queries
- Supabase free tier: 500 MB database, 2 GB bandwidth (plenty)

**Estimated Total Cost:** <$5/month for 1,000 users

### Performance Optimization

**Current Bottleneck:**
- Sequential processing (one user at a time)
- 100 users × 500ms/user = 50 seconds

**Optimization (Phase 2):**
- Batch processing (10 users in parallel)
- 100 users ÷ 10 batches × 500ms = 5 seconds
- Use `Promise.all()` with concurrency limit

**Further Optimization (Phase 3):**
- Pre-compute permit scores during ingestion
- Cache permit data in Redis
- Background job queue (BullMQ, Inngest)

### Future Enhancements

**Phase 2: Customization**
- Multiple digest times (6am, 7am, 8am)
- Frequency control (daily, weekly, Mon/Wed/Fri)
- Digest size preference (5, 10, 20 permits)

**Phase 3: Advanced Features**
- Real-time alerts (critical permits = instant email/SMS)
- Saved searches → custom alerts
- Weekly summary reports
- "Missed opportunities" reminders (permits you ignored that got popular)

**Phase 4: AI Enhancements**
- Personalized permit summaries (AI-generated)
- "Why this permit matches you" explanations
- Learning from user behavior (clicks, ignores) to improve scoring

---

## IMPLEMENTATION ROADMAP

### Step 1: Basic Email Infrastructure
**Goal:** Send first test email

**Tasks:**
1. Install Resend + React Email packages
2. Create Resend account, verify domain
3. Build basic email template (hardcoded data)
4. Create cron API route (single user test)
5. Send test email to team

**Validation:** Successfully receive email in inbox

---

### Step 2: Permit Selection Logic
**Goal:** Query and score permits for user

**Tasks:**
1. Implement `getPermitsForUser()` function
2. Implement `calculatePermitScore()` function
3. Implement `getHotPermits()` fallback
4. Write unit tests for scoring logic
5. Test with real user data

**Validation:** Function returns 10 relevant permits with scores

---

### Step 3: Dynamic Email Generation
**Goal:** Generate emails with real permit data

**Tasks:**
1. Connect email template to permit selection
2. Test email rendering with various permit counts (0, 1, 5, 10)
3. Handle edge cases (no cost, no distance, no categories)
4. Verify email renders in Gmail, Outlook, Apple Mail

**Validation:** Emails look good across all clients

---

### Step 4: Cron Job Integration
**Goal:** Automated daily sends at 6AM

**Tasks:**
1. Add `vercel.json` cron configuration
2. Set up environment variables
3. Deploy to staging
4. Manually trigger cron, verify execution
5. Deploy to production

**Validation:** Cron runs successfully at 6AM EST

---

### Step 5: Monitoring & Alerts
**Goal:** Track email performance

**Tasks:**
1. Add Slack notifications for cron completion
2. Log email send metrics (success, errors)
3. Set up error alerts (>10% failure rate)
4. Create weekly digest report

**Validation:** Team receives Slack notification after each run

---

### Step 6: User Preferences & Controls
**Goal:** Users can customize email behavior

**Tasks:**
1. Add email preferences section to settings page
2. Implement "unsubscribe" link handler
3. Add "manage preferences" link to email
4. Test unsubscribe flow

**Validation:** User can disable daily digest from email

---

## OPEN QUESTIONS & DECISIONS NEEDED

1. **Should we send emails to users with no subscribed categories?**
   - Recommendation: Yes, send "hot permits" (high-value fallback)
   - Rationale: Empty emails = abandonment, always provide value

2. **How do we handle permits that appear days after being issued?**
   - **Problem:** Toronto API has lag - permits issued 3 days ago appear in our DB today
   - **Solution:** Show both "new to database" AND "recently issued" permits
   - **Labeling:** Be transparent - "Issued 3d ago, new to PermitPulse"
   - **Prioritize updates:** Status changes are fresher than new permits

3. **Should we focus on permit CHANGES instead of new permits?**
   - **Recommendation:** YES - this is the killer feature
   - **Rationale:** 
     - Changes signal project movement (more actionable)
     - Less dependent on Toronto's API lag
     - Unique value prop (most tools only show new permits)
     - Real-time competitive intelligence

3. **Should we highlight "first to see" permits (brand new, nobody else notified yet)?**
   - Recommendation: Yes, add "FRESH" badge for <6 hour old permits
   - Rationale: Creates urgency and competitive advantage

4. **Should we A/B test subject lines?**
   - Recommendation: Not initially, add in Phase 2
   - Rationale: Need baseline metrics first

5. **Should we track which permits users click on?**
   - Recommendation: Yes, add UTM parameters to links
   - Rationale: Feedback loop for improving scoring algorithm

6. **Should we allow users to "snooze" daily digest (skip X days)?**
   - Recommendation: Phase 2 feature
   - Rationale: Adds complexity, not critical for MVP

---

## SUCCESS CRITERIA

**Launch Ready When:**
- ✅ Emails sent successfully to 100% of eligible users
- ✅ Email deliverability >95% (not spam)
- ✅ Open rate >25% (industry benchmark: 20-25%)
- ✅ Zero crashes/errors in production
- ✅ Cron job completes in <2 minutes

**Product Success Metrics (30 days post-launch):**
- Open rate: >30%
- Click-through rate: >15%
- Unsubscribe rate: <5%
- User feedback: "This is helpful" (qualitative)

---

## RISKS & MITIGATIONS

**Risk 1: Low Open Rates (<20%)**
- **Cause:** Subject lines not compelling, timing wrong
- **Mitigation:** A/B test subject lines, survey users for preferred time

**Risk 2: High Unsubscribe Rate (>10%)**
- **Cause:** Irrelevant permits, too frequent, poor targeting
- **Mitigation:** Improve scoring algorithm, add frequency controls

**Risk 3: Emails Land in Spam**
- **Cause:** Poor sender reputation, missing SPF/DKIM records
- **Mitigation:** Verify domain properly, use Resend's infrastructure, monitor deliverability

**Risk 4: Cron Job Fails Silently**
- **Cause:** Vercel cron timeout, database connection issues
- **Mitigation:** Set up health check monitoring, Slack alerts

**Risk 5: Database Query Too Slow (>1 minute)**
- **Cause:** Complex joins, no indexes, large dataset
- **Mitigation:** Add indexes on `first_seen_at`, optimize query, batch processing

---

## CONCLUSION

**Recommendation: Build Daily Email Digest (Option A)**

**Why:**
- Proven SaaS pattern (every tool does this)
- Simple to implement (1-2 weeks)
- High ROI (keeps users engaged)
- Foundation for more advanced features later

**Alternative Considered:**
- User-defined search alerts (too complex for MVP)
- Real-time push notifications (requires infrastructure)
- Weekly digests only (not actionable enough)

**Next Step:**
Start with Step 1 (Basic Email Infrastructure) and iterate from there.

