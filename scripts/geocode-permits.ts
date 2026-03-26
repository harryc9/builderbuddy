#!/usr/bin/env bun

/**
 * Permit Geocoding Script
 * Uses Geoapify to geocode permit addresses to lat/lng coordinates
 *
 * Modes:
 * 1. Historical: Geocode all 2024-2025 permits (batch mode)
 * 2. Recent: Geocode permits issued, first seen, or updated in last 30 days
 *
 * Usage:
 *   bun run scripts/geocode-permits.ts --mode=historical
 *   bun run scripts/geocode-permits.ts --mode=recent
 */

import { createClient } from '@supabase/supabase-js'
import { DateTime } from 'luxon'

// Types
type Permit = {
  id: string
  permit_num: string
  full_address: string | null
  location: any
  issued_date?: string | null
  first_seen_at?: string | null
  updated_at?: string | null
}

type GeocodeResult = {
  lat: number
  lng: number
  formatted_address: string
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Geocode an address using Geoapify
 */
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEOAPIFY_API_KEY is not set')
  }

  try {
    // Add Toronto context to improve accuracy
    const searchAddress = address.includes('Toronto')
      ? address
      : `${address}, Toronto, ON, Canada`

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        searchAddress,
      )}&apiKey=${apiKey}&filter=countrycode:ca&limit=1`,
    )

    if (!response.ok) {
      console.error(`   ⚠️  HTTP ${response.status}: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      return {
        lat: feature.properties.lat,
        lng: feature.properties.lon,
        formatted_address: feature.properties.formatted,
      }
    }

    return null
  } catch (error) {
    console.error(
      `   ⚠️  Error geocoding address:`,
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

/**
 * Fetch permits that need geocoding
 */
async function getPermitsForGeocoding(
  mode: 'historical' | 'recent',
): Promise<Permit[]> {
  let query = supabase
    .from('permits')
    .select(
      'id, permit_num, full_address, location, issued_date, first_seen_at, updated_at',
    )
    .is('location', null) // Only fetch permits without location data
    .not('full_address', 'is', null) // Must have an address
    .order('updated_at', { ascending: false })

  if (mode === 'historical') {
    // All 2024-2025 permits
    query = query.gte('issued_date', '2024-01-01')
  } else if (mode === 'recent') {
    // Permits from last 30 days (issued, first seen, or updated)
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toISODate()
    query = query.or(
      `issued_date.gte.${thirtyDaysAgo},first_seen_at.gte.${thirtyDaysAgo},updated_at.gte.${thirtyDaysAgo}`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch permits: ${error.message}`)
  }

  return (data as Permit[]).filter((p) => p.full_address?.trim())
}

/**
 * Update permit with geocoded location
 */
async function updatePermitLocation(
  permitId: string,
  lat: number,
  lng: number,
): Promise<void> {
  // Use PostGIS ST_SetSRID and ST_MakePoint to create a geography point
  const { error } = await supabase.rpc('update_permit_location', {
    permit_id: permitId,
    latitude: lat,
    longitude: lng,
  })

  if (error) {
    // If RPC doesn't exist, use raw SQL
    const { error: rawError } = await supabase
      .from('permits')
      .update({
        location: `POINT(${lng} ${lat})`,
      })
      .eq('id', permitId)

    if (rawError) {
      throw new Error(`Failed to update location: ${rawError.message}`)
    }
  }
}

/**
 * Process permits in batches with rate limiting
 */
async function processBatch(
  permits: Permit[],
  batchSize = 5,
  delayMs = 200,
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < permits.length; i += batchSize) {
    const batch = permits.slice(i, i + batchSize)
    console.log(
      `\n📍 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(permits.length / batchSize)} (${batch.length} permits)`,
    )

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (permit) => {
        if (!permit.full_address) {
          skipped++
          return { success: false, reason: 'no_address' }
        }

        // Geocode the address
        const result = await geocodeAddress(permit.full_address)

        if (result) {
          // Update database
          await updatePermitLocation(permit.id, result.lat, result.lng)
          console.log(
            `   ✅ ${permit.permit_num}: ${permit.full_address} → (${result.lat}, ${result.lng})`,
          )
          return { success: true }
        }

        console.log(`   ❌ ${permit.permit_num}: Failed to geocode`)
        return { success: false, reason: 'geocode_failed' }
      }),
    )

    // Count successes/failures
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          success++
        } else {
          failed++
        }
      } else {
        failed++
        console.error(`   ❌ Error: ${result.reason}`)
      }
    }

    // Rate limiting: wait between batches to respect Geoapify limits
    if (i + batchSize < permits.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    // Progress update
    console.log(
      `   Progress: ${success}/${permits.length} successful, ${failed} failed, ${skipped} skipped`,
    )
  }

  return { success, failed, skipped }
}

/**
 * Main function
 */
export async function main() {
  const startTime = Date.now()

  try {
    // Parse arguments
    const args = process.argv.slice(2)
    const modeArg = args.find((arg) => arg.startsWith('--mode='))
    const mode = modeArg?.split('=')[1] as 'historical' | 'recent' | undefined

    if (!mode || !['historical', 'recent'].includes(mode)) {
      console.error('❌ Invalid mode. Use --mode=historical or --mode=recent')
      process.exit(1)
    }

    console.log('\n🗺️  Starting permit geocoding...')
    console.log(`   Mode: ${mode}`)
    console.log(`   Time: ${DateTime.now().toISO()}`)

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    if (!process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY) {
      throw new Error('NEXT_PUBLIC_GEOAPIFY_API_KEY is not set')
    }

    // Fetch permits to geocode
    console.log(`\n🔍 Finding permits to geocode (${mode} mode)...`)
    const permits = await getPermitsForGeocoding(mode)
    console.log(`   Found ${permits.length.toLocaleString()} permits`)

    if (permits.length === 0) {
      console.log('\n✅ No permits to geocode!')
      process.exit(0)
    }

    // Estimate rate limits
    // Geoapify free tier: 3,000 requests/day
    console.log('\n⚠️  Rate limits:')
    console.log('   Geoapify free: 3,000 requests/day')
    console.log(
      `   This will use: ${Math.min(permits.length, 1500).toLocaleString()} requests (limited to 1,500)`,
    )

    // Limit to 1500 to conserve API quota
    const permitsToProcess = permits.slice(0, 1500)

    // Process permits
    console.log('\n🔄 Geocoding permits...')
    const results = await processBatch(permitsToProcess, 5, 200)

    // Final statistics
    const totalTime = Date.now() - startTime
    const ratePerMin = ((results.success / (totalTime / 1000)) * 60).toFixed(0)

    console.log('\n✅ Geocoding complete!')
    console.log(`   Successful: ${results.success.toLocaleString()}`)
    console.log(`   Failed: ${results.failed}`)
    console.log(`   Skipped: ${results.skipped}`)
    console.log(`   Time: ${(totalTime / 1000).toFixed(1)}s`)
    console.log(`   Rate: ${ratePerMin} permits/min`)
    console.log(
      `   Success rate: ${((results.success / permitsToProcess.length) * 100).toFixed(1)}%`,
    )

    process.exit(0)
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    const totalTime = Date.now() - startTime
    console.error(`   Failed after ${(totalTime / 1000).toFixed(1)}s`)
    process.exit(1)
  }
}

// Run the script only if not in test mode
if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  main()
}
