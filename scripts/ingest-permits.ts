#!/usr/bin/env bun

/**
 * Daily Permits Ingestion Script
 * Runs via GitHub Actions cron
 *
 * This script fetches the full dataset of Toronto building permits,
 * detects changes, and stores them in Supabase.
 */

import {
  analyzeForChangeDetection,
  analyzePermitData,
} from '@/lib/permits/analysis'
import { saveToFile } from '@/lib/permits/file-utils'
import { normalizePermit } from '@/lib/permits/normalization'
import { detectChangesInPermitsSQL } from '@/lib/permits/storage'
import { fetchFullDataset, getPackage } from '@/lib/permits/toronto-api'
import { DateTime } from 'luxon'

interface PerformanceMetrics {
  startTime: number
  downloadStartTime?: number
  downloadEndTime?: number
  processingStartTime?: number
  processingEndTime?: number
  totalRecords: number
  dataSize: number
  memoryUsage: NodeJS.MemoryUsage
}

export async function main() {
  const metrics: PerformanceMetrics = {
    startTime: Date.now(),
    totalRecords: 0,
    dataSize: 0,
    memoryUsage: process.memoryUsage(),
  }

  try {
    console.log('\n🚀 Starting full dataset ingestion...')
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`   Time: ${DateTime.now().toISO()}`)

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    // Get package metadata
    console.log('\n📦 Fetching package metadata...')
    const packageData = await getPackage()
    const datastoreResources = packageData.resources.filter(
      (r) => r.datastore_active,
    )

    if (datastoreResources.length === 0) {
      throw new Error('No datastore resources found')
    }

    console.log(`   Found ${datastoreResources.length} datastore resource(s)`)

    // Fetch full dataset
    console.log('\n⬇️  Downloading full dataset...')
    metrics.processingStartTime = Date.now()
    const downloadResult = await fetchFullDataset(datastoreResources[0])
    const { permits, totalDownloadTime, totalDataSize } = downloadResult

    metrics.downloadStartTime = metrics.processingStartTime
    metrics.downloadEndTime = Date.now()
    metrics.processingEndTime = Date.now()
    metrics.totalRecords = permits.length
    metrics.dataSize = totalDataSize

    console.log(`   Downloaded ${permits.length.toLocaleString()} permits`)
    console.log(`   Data size: ${(totalDataSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Time: ${(totalDownloadTime / 1000).toFixed(1)}s`)

    // Analyze for change detection strategy
    console.log('\n🔍 Analyzing permit data...')
    const _analysisResults = analyzeForChangeDetection(permits)

    // Normalize permits for database comparison
    console.log('\n🔄 Normalizing permits...')
    const normalizedPermits = permits.map(normalizePermit)

    // SQL-BASED CHANGE DETECTION
    console.log('\n🔎 Detecting changes...')
    const changeDetectionStartTime = Date.now()
    const changeResults = await detectChangesInPermitsSQL(normalizedPermits)
    const changeDetectionEndTime = Date.now()

    console.log(
      `   Changes detected: ${Object.values(changeResults.changesByImpact || {}).reduce((a, b) => a + b, 0)}`,
    )
    console.log(`   New permits: ${changeResults.newPermitsCount}`)
    console.log(
      `   Time: ${((changeDetectionEndTime - changeDetectionStartTime) / 1000).toFixed(1)}s`,
    )

    // Note: SQL-based change detection already updated the database
    // No need to call storePermitsInSupabase which would update ALL permits

    // Comprehensive analysis
    console.log('\n📊 Running comprehensive analysis...')
    analyzePermitData(permits)

    // Save to file with today's date
    const today = DateTime.now().toISODate()
    const filePath = saveToFile(permits, `permits-${today}.json`)
    console.log(`\n💾 Saved to: ${filePath}`)

    // Final metrics
    const totalTime = Date.now() - metrics.startTime
    const finalMemory = process.memoryUsage()

    console.log('\n✅ Ingestion complete!')
    console.log(
      `   ${permits.length.toLocaleString()} permits • ${Object.values(changeResults.changesByImpact || {}).reduce((a, b) => a + b, 0)} changes • ${(totalTime / 1000).toFixed(1)}s`,
    )
    console.log(
      `   Memory used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    )

    // Exit successfully
    process.exit(0)
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    const totalTime = Date.now() - metrics.startTime
    console.error(`   Failed after ${(totalTime / 1000).toFixed(1)}s`)

    // Exit with error code
    process.exit(1)
  }
}

// Run the script only if not in test mode
if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  main()
}
