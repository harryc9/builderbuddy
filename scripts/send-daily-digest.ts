#!/usr/bin/env bun

/**
 * Daily Digest Email Script
 * Runs via GitHub Actions cron
 *
 * This script sends daily email digests to all subscribed users with
 * relevant permits based on their preferences.
 */

import type { Database } from '@/types/supabase.public.types'
import { createClient } from '@supabase/supabase-js'
import DailyDigestEmail from 'emails/daily-digest'
import { DateTime } from 'luxon'
import { Client } from 'pg'
import { Resend } from 'resend'

type User = Database['public']['Tables']['users']['Row']

type PermitWithDetails = {
  id: string
  permit_num: string
  revision_num: string | null
  full_address: string | null
  est_const_cost: number | null
  status: string | null
  issued_date: string | null
  first_seen_at: string | null
  description: string | null
  builder_name: string | null
  latitude: number | null
  longitude: number | null
  job_roles: Array<{ slug: string; name: string; color_hex: string }>
  has_recent_critical_change: boolean
  latest_change?: {
    change_type: string
    business_impact: string
    changed_fields: string[]
    old_values: Record<string, unknown>
    new_values: Record<string, unknown>
  }
  distance_km?: number
  score?: number
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function main() {
  const startTime = Date.now()

  try {
    console.log('\n📧 Starting daily digest email job...')
    console.log(`   Time: ${DateTime.now().toISO()}`)

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }

    const sb = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    // Get all users who should receive digests
    console.log('\n👥 Fetching eligible users...')
    const { data: users, error: usersError } = await sb
      .from('users')
      .select('*')
      .eq('daily_email_enabled', true)
      .not('subscribed_categories', 'is', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      console.log('   No users with daily_email_enabled found')
      process.exit(0)
    }

    // Filter users with active subscriptions or trials
    const usersWithAccess = users.filter((user) => {
      // Admin always has access
      if (user.admin) return true

      // Check subscription status
      const status = user.subscription_status
      const now = new Date()

      // Active paid subscription
      if (status === 'active') return true

      // Trial period - check if still within trial window
      if (status === 'trialing' && user.trial_end) {
        return now < new Date(user.trial_end)
      }

      // No subscription access
      return false
    })

    console.log(
      `   Found ${users.length} users total, ${usersWithAccess.length} with active subscriptions`,
    )

    let successCount = 0
    let failCount = 0
    let skippedCount = 0

    // Process each user
    for (const user of usersWithAccess) {
      console.log(`\n👤 Processing user: ${user.email}`)

      try {
        // Check if user has subscribed categories
        if (
          !user.subscribed_categories ||
          user.subscribed_categories.length === 0
        ) {
          console.log('   ⚠️  Skipping - no subscribed categories')
          skippedCount++
          continue
        }

        // Fetch permits for this user with dynamic limit
        console.log('   📦 Fetching permits...')
        let userPermits = await fetchPermitsForUser(user, 100)
        console.log(`   Found ${userPermits.length} matching permits`)

        if (userPermits.length === 0) {
          console.log('   ⚠️  Skipping - no matching permits')
          skippedCount++
          continue
        }

        // Apply user filters
        let relevantPermits = userPermits

        // Add distance if user has address
        if (user.address_lat && user.address_lng) {
          const permitIds = relevantPermits.map((p) => p.id)
          const { data: distances } = await sb.rpc('add_distance_to_permits', {
            permit_uuids: permitIds,
            user_lat: Number(user.address_lat),
            user_lng: Number(user.address_lng),
          })

          if (distances) {
            const distanceMap = new Map(
              distances.map((d) => [d.permit_id, d.distance_km]),
            )
            relevantPermits = relevantPermits.map((p) => ({
              ...p,
              distance_km: distanceMap.get(p.id),
            }))
          }
        }

        // Apply filters
        relevantPermits = applyUserFilters(relevantPermits, user)
        console.log(`   After filters: ${relevantPermits.length} permits`)

        // Keep fetching more permits until we have at least 10 that match filters
        const fetchLimits = [100, 500, 1000, 2000]
        let currentLimitIndex = 0

        while (
          relevantPermits.length < 10 &&
          currentLimitIndex < fetchLimits.length
        ) {
          const currentLimit = fetchLimits[currentLimitIndex]

          // Skip if we already fetched this limit
          if (userPermits.length >= currentLimit) {
            currentLimitIndex++
            continue
          }

          console.log(
            `   🔄 Only ${relevantPermits.length} permits, fetching ${currentLimit} total...`,
          )
          userPermits = await fetchPermitsForUser(user, currentLimit)
          console.log(`   Found ${userPermits.length} matching permits from DB`)

          // If we got fewer permits than requested, we've exhausted the database
          if (userPermits.length < currentLimit) {
            console.log('   ℹ️  Exhausted database, using what we found')
            currentLimitIndex = fetchLimits.length // Break the loop
          }

          relevantPermits = userPermits

          // Re-apply distance calculation
          if (user.address_lat && user.address_lng) {
            const permitIds = relevantPermits.map((p) => p.id)
            const { data: distances } = await sb.rpc(
              'add_distance_to_permits',
              {
                permit_uuids: permitIds,
                user_lat: Number(user.address_lat),
                user_lng: Number(user.address_lng),
              },
            )

            if (distances) {
              const distanceMap = new Map(
                distances.map((d) => [d.permit_id, d.distance_km]),
              )
              relevantPermits = relevantPermits.map((p) => ({
                ...p,
                distance_km: distanceMap.get(p.id),
              }))
            }
          }

          // Re-apply filters
          relevantPermits = applyUserFilters(relevantPermits, user)
          console.log(`   After filters: ${relevantPermits.length} permits`)

          currentLimitIndex++
        }

        if (relevantPermits.length === 0) {
          console.log('   ⚠️  Skipping - no permits after filters')
          skippedCount++
          continue
        }

        // Score and sort permits
        const scoredPermits = relevantPermits.map((permit) => ({
          ...permit,
          score: calculatePermitScore(permit, user),
        }))

        scoredPermits.sort((a, b) => b.score - a.score)

        // Get top 10 (or fewer if that's all we have)
        const topPermits = scoredPermits.slice(0, 10)

        // Send email
        console.log(`   📧 Sending email with ${topPermits.length} permits...`)
        const emailResult = await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            '416Permits <onboarding@resend.dev>',
          to: user.email,
          subject: `🔨 ${topPermits.length} urgent permits in Toronto - ${DateTime.now().toFormat('MMM d')}`,
          react: DailyDigestEmail({
            userId: user.id,
            permits: topPermits.map((p) => ({
              ...p,
              full_address: p.full_address ?? 'Address Unknown',
              est_const_cost: Number(p.est_const_cost ?? 0),
              est_const_cost_formatted: Number(
                p.est_const_cost ?? 0,
              ).toLocaleString('en-US'),
              status: p.status ?? 'Unknown',
              issued_date: p.issued_date ?? '',
              description: p.description ?? '',
              score: p.score ?? 0,
              latitude: p.latitude ?? undefined,
              longitude: p.longitude ?? undefined,
            })),
            totalMatchingPermits: relevantPermits.length,
            digestDate: DateTime.now().toFormat('MMMM d, yyyy'),
          }),
        })

        if (emailResult.error) {
          console.error('   ❌ Email send error:', emailResult.error)
          failCount++
        } else {
          console.log('   ✅ Email sent successfully!')
          successCount++

          // Record which permits were sent to this user
          const permitIds = topPermits.map((p) => p.id)
          await recordSentPermits(user.id, permitIds)
        }
      } catch (userError) {
        console.error(`   ❌ Error processing user ${user.email}:`, userError)
        failCount++
      }
    }

    const totalTime = Date.now() - startTime
    console.log('\n✅ Daily digest job complete!')
    console.log(`   Total users: ${users.length}`)
    console.log(`   Emails sent: ${successCount}`)
    console.log(`   Failed: ${failCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    console.log(`   Duration: ${(totalTime / 1000).toFixed(1)}s`)

    process.exit(failCount > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    const totalTime = Date.now() - startTime
    console.error(`   Failed after ${(totalTime / 1000).toFixed(1)}s`)
    process.exit(1)
  }
}

// Fetch digest-worthy permits FOR A SPECIFIC USER
async function fetchPermitsForUser(
  user: User,
  limit = 100,
): Promise<PermitWithDetails[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  try {
    const yesterday = DateTime.now().minus({ days: 1 }).toISO()
    const threeDaysAgo = DateTime.now().minus({ days: 3 }).toISO()
    const sevenDaysAgo = DateTime.now().minus({ days: 7 }).toISODate()

    // If user has no categories, return empty
    if (
      !user.subscribed_categories ||
      user.subscribed_categories.length === 0
    ) {
      return []
    }

    const result = await client.query(
      `
      SELECT 
        p.id,
        p.permit_num,
        p.revision_num,
        p.full_address,
        p.est_const_cost,
        p.status,
        p.issued_date,
        p.first_seen_at,
        p.description,
        p.builder_name,
        ST_Y(p.location::geometry) as latitude,
        ST_X(p.location::geometry) as longitude,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'slug', jrd.job_role_slug,
              'name', jrd.job_role_name,
              'color_hex', jrd.color_hex
            )
          ) FILTER (WHERE jrd.job_role_slug IS NOT NULL),
          '[]'
        ) as job_roles,
        EXISTS(
          SELECT 1 FROM permit_changes pc
          WHERE pc.permit_id = p.id
            AND pc.detected_at >= $1
            AND pc.business_impact IN ('CRITICAL', 'HIGH')
        ) as has_recent_critical_change,
        (
          SELECT jsonb_build_object(
            'change_type', pc.change_type,
            'business_impact', pc.business_impact,
            'changed_fields', pc.changed_fields,
            'old_values', pc.old_values,
            'new_values', pc.new_values
          )
          FROM permit_changes pc
          WHERE pc.permit_id = p.id
            AND pc.detected_at >= $1
          ORDER BY pc.detected_at DESC
          LIMIT 1
        ) as latest_change
      FROM permits p
      INNER JOIN permit_job_roles pjr ON p.id = pjr.permit_id
      INNER JOIN job_role_definitions jrd ON pjr.job_role_slug = jrd.job_role_slug
      WHERE (
        -- Time filters: recent permits OR changed permits
        p.first_seen_at >= $2
        OR p.issued_date >= $3
        OR EXISTS(
          SELECT 1 FROM permit_changes pc
          WHERE pc.permit_id = p.id
            AND pc.detected_at >= $1
            AND pc.business_impact IN ('CRITICAL', 'HIGH')
        )
      )
      AND (
        -- Category filter: match user's parent categories
        jrd.parent_category = ANY($4)
      )
      AND (
        -- Exclude permits already sent to this user
        NOT EXISTS(
          SELECT 1 FROM user_digest_history udh
          WHERE udh.user_id = $5
            AND udh.permit_id = p.id
        )
      )
      AND (
        -- Exclude permits without addresses
        p.full_address IS NOT NULL
        AND p.full_address != ''
      )
      GROUP BY p.id, p.permit_num, p.revision_num, p.full_address, p.est_const_cost, 
               p.status, p.issued_date, p.first_seen_at, p.description, p.builder_name
      ORDER BY p.issued_date DESC
      LIMIT $6
    `,
      [
        yesterday,
        threeDaysAgo,
        sevenDaysAgo,
        user.subscribed_categories,
        user.id,
        limit,
      ],
    )

    return result.rows
  } finally {
    await client.end()
  }
}

// Apply strict user filters
function applyUserFilters(
  permits: PermitWithDetails[],
  user: User,
): PermitWithDetails[] {
  let filtered = permits

  if (user.only_with_builder) {
    filtered = filtered.filter((p) => p.builder_name)
  }

  if (user.only_with_cost) {
    filtered = filtered.filter((p) => p.est_const_cost && p.est_const_cost > 0)
  }

  // Filter by cost range
  if (user.cost_min !== null || user.cost_max !== null) {
    filtered = filtered.filter((p) => {
      if (!p.est_const_cost || p.est_const_cost <= 0) return false
      const cost = Number(p.est_const_cost)
      const minCost = user.cost_min !== null ? Number(user.cost_min) : 1000
      const maxCost =
        user.cost_max !== null
          ? Number(user.cost_max)
          : Number.POSITIVE_INFINITY
      return cost >= minCost && cost <= maxCost
    })
  }

  // Legacy min_project_cost support
  if (!user.cost_min && user.min_project_cost) {
    filtered = filtered.filter(
      (p) =>
        p.est_const_cost &&
        Number(p.est_const_cost) >= Number(user.min_project_cost),
    )
  }

  return filtered
}

// Calculate permit score
function calculatePermitScore(permit: PermitWithDetails, user: User): number {
  let score = 0

  // Critical change (0-30 points) - HIGHEST PRIORITY
  if (permit.has_recent_critical_change && permit.latest_change) {
    const newStatus = permit.latest_change.new_values?.status
    const changedFields = permit.latest_change.changed_fields || []

    // Status changes - prioritize by urgency
    if (changedFields.includes('status')) {
      if (newStatus === 'Permit Issued') {
        score += 30
      } else if (
        newStatus === 'Ready for Issuance' ||
        newStatus === 'Issuance Pending'
      ) {
        score += 25
      } else if (newStatus === 'Inspection') {
        score += 20
      } else if (
        newStatus === 'Under Review' ||
        newStatus === 'Response Received'
      ) {
        score += 15
      } else {
        score += 10
      }
    }

    // Cost increases (significant scope change)
    if (changedFields.includes('est_const_cost')) {
      const oldCost =
        (permit.latest_change.old_values?.est_const_cost as number) || 0
      const newCost =
        (permit.latest_change.new_values?.est_const_cost as number) || 0
      if (oldCost > 0) {
        const pctChange = ((newCost - oldCost) / oldCost) * 100
        if (Math.abs(pctChange) >= 20) {
          score += 15
        }
      }
    }

    // Builder assignment (new contact info)
    if (changedFields.includes('builder_name')) {
      score += 10
    }
  } else if (permit.has_recent_critical_change) {
    score += 15
  }

  // Category match (0-30 points)
  if ((user.subscribed_categories?.length ?? 0) > 0) {
    const permitCategories = permit.job_roles?.map((r) => r.slug) || []
    const categoryMatches = permitCategories.filter((cat) =>
      user.subscribed_categories?.includes(cat),
    ).length
    score += Math.min(categoryMatches * 10, 30)
  }

  // Cost match (0-15 points)
  if (permit.est_const_cost) {
    if (
      user.min_project_cost &&
      Number(permit.est_const_cost) >= Number(user.min_project_cost)
    ) {
      score += 15
    } else if (
      !user.min_project_cost &&
      Number(permit.est_const_cost) > 50000
    ) {
      score += 8
    }
  }

  // Distance bonus (0-20 points)
  if (permit.distance_km !== undefined) {
    if (permit.distance_km <= 5) score += 20
    else if (permit.distance_km <= 10) score += 15
    else if (permit.distance_km <= 25) score += 10
    else if (permit.distance_km <= 50) score += 5
  }

  // Freshness (0-10 points)
  if (permit.has_recent_critical_change) {
    score += 10
  } else if (permit.first_seen_at) {
    const firstSeenDate = new Date(permit.first_seen_at)
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate()
    if (firstSeenDate >= yesterday) {
      score += 8
    } else if (permit.issued_date) {
      const issuedDate = new Date(permit.issued_date)
      const daysSinceIssued = Math.floor(
        (Date.now() - issuedDate.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysSinceIssued <= 3) {
        score += 5
      }
    }
  }

  // Builder present (0-5 points)
  if (permit.builder_name && user.only_with_builder) {
    score += 5
  }

  return score
}

// Record which permits were sent to a user (to prevent duplicates in future digests)
async function recordSentPermits(
  userId: string,
  permitIds: string[],
): Promise<void> {
  if (permitIds.length === 0) return

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  try {
    // Build VALUES clause for bulk insert
    const values = permitIds
      .map((_, idx) => `($1, $${idx + 2}, NOW())`)
      .join(', ')

    await client.query(
      `
      INSERT INTO user_digest_history (user_id, permit_id, sent_at)
      VALUES ${values}
      ON CONFLICT (user_id, permit_id) DO NOTHING
    `,
      [userId, ...permitIds],
    )

    console.log(`   📝 Recorded ${permitIds.length} permits in digest history`)
  } catch (error) {
    console.error(`   ⚠️  Error recording digest history:`, error)
    // Don't throw - we don't want to fail the entire job if logging fails
  } finally {
    await client.end()
  }
}

// Optional: Clean up old digest history (keeps table size manageable)
// Run this manually or set up a cron job to remove entries older than 30 days
// Example: bun run scripts/send-daily-digest.ts --cleanup
export async function cleanupOldDigestHistory(daysToKeep = 30): Promise<void> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  try {
    const result = await client.query(
      `
      DELETE FROM user_digest_history
      WHERE sent_at < NOW() - INTERVAL '${daysToKeep} days'
    `,
    )

    console.log(
      `🧹 Cleaned up ${result.rowCount} old digest history records (older than ${daysToKeep} days)`,
    )
  } catch (error) {
    console.error('⚠️  Error cleaning up digest history:', error)
  } finally {
    await client.end()
  }
}

// Run the script only if not in test mode
if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  main()
}
