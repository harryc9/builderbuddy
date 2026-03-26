/**
 * Test Utilities for Performance Testing
 *
 * Use these helpers when adding new filters to ensure performance standards are met.
 */

import { expect } from 'vitest'

// Standard performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  INITIAL_LOAD: 5000, // 5 seconds for initial page load (includes cold start)
  SUBSEQUENT_PAGES: 3000, // 3 seconds for subsequent pages (warm server)
  WITH_FILTERS: 3000, // 3 seconds with filters applied
  SERVER_EXECUTION: 1000, // 1 second for server-side execution
} as const

export const API_BASE_URL = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:4002'}`

export type FilterTestCase = {
  name: string
  params: Record<string, string>
  expectedMinResults?: number
  maxDuration?: number
}

/**
 * Fetch permits from the search API
 */
export async function fetchPermits(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params)
  const startTime = Date.now()

  const response = await fetch(
    `${API_BASE_URL}/api/permits/search?${searchParams.toString()}`,
  )

  const endTime = Date.now()
  const duration = endTime - startTime

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()

  return {
    data,
    duration,
    serverExecutionTime: data.execution_time_ms,
  }
}

/**
 * Test a single filter for performance
 *
 * @example
 * ```typescript
 * await testFilterPerformance({
 *   name: 'status filter',
 *   params: { status: 'Permit Issued' },
 *   expectedMinResults: 1,
 * })
 * ```
 */
export async function testFilterPerformance(testCase: FilterTestCase) {
  const {
    name,
    params,
    expectedMinResults = 0,
    maxDuration = PERFORMANCE_THRESHOLDS.WITH_FILTERS,
  } = testCase

  const { duration, serverExecutionTime, data } = await fetchPermits(params)

  console.log(`${name}: ${duration}ms total (server: ${serverExecutionTime}ms)`)

  // Performance assertion
  expect(duration).toBeLessThan(maxDuration)

  // Results validation
  if (expectedMinResults > 0) {
    expect(data.permits.length).toBeGreaterThanOrEqual(expectedMinResults)
  }

  // Pagination validation
  expect(data.pagination).toMatchObject({
    page: expect.any(Number),
    per_page: expect.any(Number),
    total_count: expect.any(Number),
    total_pages: expect.any(Number),
    has_next: expect.any(Boolean),
    has_prev: expect.any(Boolean),
  })

  return { duration, serverExecutionTime, data }
}

/**
 * Test multiple filter combinations
 *
 * Useful for regression testing when adding new filters
 *
 * @example
 * ```typescript
 * await testFilterCombinations([
 *   { name: 'status only', params: { status: 'Permit Issued' } },
 *   { name: 'cost only', params: { cost_min: '100000' } },
 *   { name: 'status + cost', params: { status: 'Permit Issued', cost_min: '100000' } },
 * ])
 * ```
 */
export async function testFilterCombinations(testCases: FilterTestCase[]) {
  const results = []

  for (const testCase of testCases) {
    const result = await testFilterPerformance(testCase)
    results.push({ ...testCase, ...result })
  }

  // Report summary
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const maxDurationFound = Math.max(...results.map((r) => r.duration))
  const minDurationFound = Math.min(...results.map((r) => r.duration))

  console.log(`\n📊 Filter Combination Test Summary:`)
  console.log(`   Tests run: ${results.length}`)
  console.log(`   Avg duration: ${avgDuration.toFixed(0)}ms`)
  console.log(`   Min duration: ${minDurationFound}ms`)
  console.log(`   Max duration: ${maxDurationFound}ms`)

  return results
}

/**
 * Verify a filter is included in hasAnyFilters check
 *
 * This tests that adding a filter triggers the COUNT query (non-zero total_count)
 * vs the default behavior of returning estimated 250k
 *
 * @example
 * ```typescript
 * await verifyFilterDetection('new_filter', 'some_value')
 * ```
 */
export async function verifyFilterDetection(
  filterKey: string,
  filterValue: string,
) {
  // Test page 1 with filter
  const withFilter = await fetchPermits({
    page: '1',
    per_page: '50',
    [filterKey]: filterValue,
  })

  // Should NOT be the default estimate (250000)
  // Should be an actual count based on the filter
  if (withFilter.data.pagination.total_count === 250000) {
    throw new Error(
      `Filter '${filterKey}' is not detected in hasAnyFilters check! ` +
        `Got default estimate (250k) instead of actual count. ` +
        `Add this filter to the hasAnyFilters check in route.ts (line ~187)`,
    )
  }

  console.log(
    `✅ Filter '${filterKey}' properly detected (count: ${withFilter.data.pagination.total_count})`,
  )

  return withFilter
}

/**
 * Warmup helper - run before performance tests
 *
 * Ensures database connections are warm and caches are primed
 */
export async function warmupDatabaseConnections() {
  console.log('🔥 Warming up database connections...')

  const warmupQueries: Record<string, string>[] = [
    // Default query (no filters)
    {
      page: '1',
      per_page: '50',
      sort_by: 'issued_date',
      sort_order: 'desc',
    },
    // With filters
    {
      page: '1',
      per_page: '50',
      status: 'Permit Issued',
    },
  ]

  for (const params of warmupQueries) {
    await fetchPermits(params)
  }

  console.log('✅ Warmup complete\n')
}

/**
 * Template for adding a new filter test
 *
 * Copy this template when adding a new filter:
 *
 * ```typescript
 * describe('NEW_FILTER Performance', () => {
 *   it('should handle NEW_FILTER efficiently', async () => {
 *     await testFilterPerformance({
 *       name: 'NEW_FILTER',
 *       params: {
 *         page: '1',
 *         per_page: '50',
 *         NEW_FILTER: 'value',
 *         sort_by: 'issued_date',
 *         sort_order: 'desc',
 *       },
 *       expectedMinResults: 1,
 *     })
 *   })
 *
 *   it('should detect NEW_FILTER in hasAnyFilters check', async () => {
 *     await verifyFilterDetection('NEW_FILTER', 'value')
 *   })
 *
 *   it('should combine NEW_FILTER with other filters efficiently', async () => {
 *     await testFilterCombinations([
 *       {
 *         name: 'NEW_FILTER alone',
 *         params: { NEW_FILTER: 'value' },
 *       },
 *       {
 *         name: 'NEW_FILTER + status',
 *         params: { NEW_FILTER: 'value', status: 'Permit Issued' },
 *       },
 *       {
 *         name: 'NEW_FILTER + cost',
 *         params: { NEW_FILTER: 'value', cost_min: '100000' },
 *       },
 *     ])
 *   })
 * })
 * ```
 */
export const NEW_FILTER_TEST_TEMPLATE = `
describe('NEW_FILTER Performance', () => {
  it('should handle NEW_FILTER efficiently', async () => {
    await testFilterPerformance({
      name: 'NEW_FILTER',
      params: {
        page: '1',
        per_page: '50',
        NEW_FILTER: 'value',
        sort_by: 'issued_date',
        sort_order: 'desc',
      },
      expectedMinResults: 1,
    })
  })

  it('should detect NEW_FILTER in hasAnyFilters check', async () => {
    await verifyFilterDetection('NEW_FILTER', 'value')
  })
})
`
