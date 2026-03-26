#!/usr/bin/env bun

/**
 * Permit Job Role Categorization Script
 * Uses OpenAI GPT-4o-mini to categorize permits by job roles
 *
 * Modes:
 * 1. Historical: Categorize all 2024-2025 permits (batch mode)
 * 2. Daily: Categorize recent uncategorized permits (real-time mode)
 *
 * Usage:
 *   bun run scripts/categorize-permits.ts --mode=historical
 *   bun run scripts/categorize-permits.ts --mode=daily
 */

import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@supabase/supabase-js'
import { generateObject } from 'ai'
import { DateTime } from 'luxon'
import { z } from 'zod'

// Types
type Permit = {
  id: string
  permit_num: string
  description: string | null
  permit_type: string | null
  structure_type: string | null
  est_const_cost: number | null
  issued_date: string | null
  builder_name: string | null
  updated_at: string | null
}

type JobRole = {
  job_role_slug: string
  job_role_name: string
  keywords: string[]
}

/**
 * Create Zod schema with enum constraint based on valid job roles
 */
function createCategorizationSchema(validSlugs: string[]) {
  return z.object({
    job_roles: z
      .array(z.enum(validSlugs as [string, ...string[]]))
      .describe(
        'Array of job_role_slugs for trades that would work on this permit',
      ),
  })
}

type CategorizationResult = {
  job_roles: string[]
}

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

/**
 * Fetch all job role definitions for LLM context
 */
async function getJobRoleDefinitions(): Promise<JobRole[]> {
  const { data, error } = await supabase
    .from('job_role_definitions')
    .select('job_role_slug, job_role_name, keywords')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch job roles: ${error.message}`)
  }

  return data as JobRole[]
}

/**
 * Fetch permits that need categorization
 */
async function getPermitsForCategorization(
  mode: 'historical' | 'daily',
): Promise<Permit[]> {
  // First, get all categorized permit IDs
  const { data: categorizedPermits, error: catError } = await supabase
    .from('permit_job_roles')
    .select('permit_id')

  if (catError) {
    throw new Error(`Failed to fetch categorized permits: ${catError.message}`)
  }

  const categorizedIds = new Set(
    categorizedPermits?.map((p) => p.permit_id) || [],
  )

  // Build query for uncategorized permits
  let query = supabase
    .from('permits')
    .select(
      'id, permit_num, description, permit_type, structure_type, est_const_cost, issued_date, builder_name, updated_at',
    )
    .order('updated_at', { ascending: false })

  if (mode === 'historical') {
    // All 2024-2025 permits
    query = query.gte('issued_date', '2024-01-01')
  } else if (mode === 'daily') {
    // Permits issued OR updated in last 2 days
    const twoDaysAgo = DateTime.now().minus({ days: 2 }).toISODate()
    query = query.or(
      `issued_date.gte.${twoDaysAgo},updated_at.gte.${twoDaysAgo}`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch permits: ${error.message}`)
  }

  // Filter out already categorized permits and permits without meaningful descriptions
  const uncategorizedPermits = (data as Permit[]).filter((permit) => {
    // Skip if already categorized
    if (categorizedIds.has(permit.id)) return false

    // Skip if no description
    if (!permit.description || permit.description.trim().length === 0)
      return false

    // Skip admin permits that just reference other permits
    const desc = permit.description.toLowerCase()
    if (desc.startsWith('admin permit related to')) return false

    return true
  })

  // Prioritize permits with builder_name and est_const_cost
  // These are high-value permits that should be categorized first for email digests
  return uncategorizedPermits.sort((a, b) => {
    const aHasBuilder = Boolean(a.builder_name?.trim())
    const bHasBuilder = Boolean(b.builder_name?.trim())
    const aHasCost = Boolean(a.est_const_cost && a.est_const_cost > 0)
    const bHasCost = Boolean(b.est_const_cost && b.est_const_cost > 0)

    // Priority 1: Has both builder and cost
    const aHasBoth = aHasBuilder && aHasCost
    const bHasBoth = bHasBuilder && bHasCost
    if (aHasBoth && !bHasBoth) return -1
    if (!aHasBoth && bHasBoth) return 1

    // Priority 2: Has builder
    if (aHasBuilder && !bHasBuilder) return -1
    if (!aHasBuilder && bHasBuilder) return 1

    // Priority 3: Has cost
    if (aHasCost && !bHasCost) return -1
    if (!aHasCost && bHasCost) return 1

    // Priority 4: Most recent first (already sorted by issued_date desc)
    return 0
  })
}

/**
 * Build LLM system prompt with job role context
 */
function buildSystemPrompt(jobRoles: JobRole[]): string {
  return `You are an expert construction permit analyst. Your job is to identify which construction job roles/trades would be interested in a building permit.

You will be given a permit with:
- Description (most important signal)
- Permit type
- Structure type
- Estimated cost

Your task: Assign relevant job role slugs from the provided list.

Rules:
- Assign 2-10 job roles per permit (realistic set of trades needed)
- Focus on what trades would actually work on this project
- Description is the primary signal (e.g., "HVAC" in description → hvac-technician)
- Consider ALL trades mentioned or implied (direct and indirect)
- Include supporting trades (e.g., electrician for HVAC work, drywaller for renovation)
- Return only valid job_role_slugs from the list below

Valid job role slugs:
${jobRoles.map((r) => `- ${r.job_role_slug}: ${r.job_role_name}`).join('\n')}

Examples:
- "HVAC installation" → ["hvac-technician", "electrician", "sheet-metal-worker"]
- "Restaurant renovation" → ["electrician", "plumber", "hvac-technician", "drywaller", "painter", "flooring-installer"]
- "New 3-storey building" → ["rough-carpenter", "concrete-worker", "electrician", "plumber", "hvac-technician", "roofer", "insulation-installer", "drywaller", "finish-carpenter", "painter"]
- "Backwater valve install" → ["plumber"]
- "Demolition" → ["demolition-worker", "labourer"]

Return ONLY a JSON object with a "job_roles" array of slugs.`
}

/**
 * Build user prompt for a specific permit
 */
function buildUserPrompt(permit: Permit): string {
  return `Identify job roles for this permit:

DESCRIPTION: ${permit.description || 'Not specified'}
PERMIT TYPE: ${permit.permit_type || 'Not specified'}
STRUCTURE TYPE: ${permit.structure_type || 'Not specified'}
ESTIMATED COST: ${permit.est_const_cost ? `$${permit.est_const_cost.toLocaleString()}` : 'Not specified'}

Return JSON array of slugs only:
{
  "job_roles": ["slug1", "slug2", ...]
}`
}

/**
 * Categorize a single permit using Vercel AI SDK
 */
async function categorizePermit(
  permit: Permit,
  jobRoles: JobRole[],
  systemPrompt: string,
): Promise<CategorizationResult | null> {
  try {
    // Create schema with enum constraint
    const validSlugs = jobRoles.map((r) => r.job_role_slug)
    const schema = createCategorizationSchema(validSlugs)

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema,
      system: systemPrompt,
      prompt: buildUserPrompt(permit),
      temperature: 0.3,
    })

    return { job_roles: object.job_roles }
  } catch (error) {
    console.error(
      `Failed to categorize permit ${permit.permit_num}:`,
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

/**
 * Store categorization results in database
 */
async function storeCategorizationResults(
  permitId: string,
  jobRoleSlugs: string[],
): Promise<void> {
  const records = jobRoleSlugs.map((slug) => ({
    permit_id: permitId,
    job_role_slug: slug,
    llm_model: 'gpt-4o-mini',
    categorized_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('permit_job_roles').upsert(records, {
    onConflict: 'permit_id,job_role_slug',
    ignoreDuplicates: true,
  })

  if (error) {
    throw new Error(`Failed to store results: ${error.message}`)
  }
}

/**
 * Process permits in batches
 */
async function processBatch(
  permits: Permit[],
  jobRoles: JobRole[],
  systemPrompt: string,
  batchSize = 10,
): Promise<{ success: number; failed: number; totalRoles: number }> {
  let success = 0
  let failed = 0
  let totalRoles = 0

  for (let i = 0; i < permits.length; i += batchSize) {
    const batch = permits.slice(i, i + batchSize)
    console.log(
      `\n   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(permits.length / batchSize)} (${batch.length} permits)`,
    )

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (permit) => {
        const result = await categorizePermit(permit, jobRoles, systemPrompt)
        if (result) {
          await storeCategorizationResults(permit.id, result.job_roles)
          return result.job_roles.length
        }
        return 0
      }),
    )

    // Count successes/failures
    for (const result of results) {
      if (result.status === 'fulfilled') {
        success++
        totalRoles += result.value
      } else {
        failed++
        console.error(`   ❌ Error: ${result.reason}`)
      }
    }

    // Rate limiting: wait 100ms between batches
    if (i + batchSize < permits.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Progress update
    console.log(
      `   Progress: ${success}/${permits.length} successful, ${failed} failed`,
    )
  }

  return { success, failed, totalRoles }
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
    const mode = modeArg?.split('=')[1] as 'historical' | 'daily' | undefined

    if (!mode || !['historical', 'daily'].includes(mode)) {
      console.error('❌ Invalid mode. Use --mode=historical or --mode=daily')
      process.exit(1)
    }

    console.log('\n🤖 Starting permit categorization...')
    console.log(`   Mode: ${mode}`)
    console.log(`   Time: ${DateTime.now().toISO()}`)

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    // Fetch job role definitions
    console.log('\n📋 Fetching job role definitions...')
    const jobRoles = await getJobRoleDefinitions()
    console.log(`   Loaded ${jobRoles.length} job roles`)

    // Build system prompt
    const systemPrompt = buildSystemPrompt(jobRoles)

    // Fetch permits to categorize
    console.log(`\n🔍 Finding permits to categorize (${mode} mode)...`)
    const permits = await getPermitsForCategorization(mode)
    console.log(`   Found ${permits.length.toLocaleString()} permits`)

    if (permits.length === 0) {
      console.log('\n✅ No permits to categorize!')
      process.exit(0)
    }

    // Estimate cost
    const estimatedTokens = permits.length * 350 // ~350 tokens per permit
    const estimatedCost = (estimatedTokens / 1_000_000) * (0.075 + 0.3) // Input + output
    console.log(
      `   Estimated cost: $${estimatedCost.toFixed(2)} (${estimatedTokens.toLocaleString()} tokens)`,
    )

    // Process permits
    console.log('\n🔄 Categorizing permits...')
    const results = await processBatch(permits, jobRoles, systemPrompt, 100)

    // Final statistics
    const totalTime = Date.now() - startTime
    const avgRolesPerPermit = (results.totalRoles / results.success).toFixed(1)

    console.log('\n✅ Categorization complete!')
    console.log(`   Successful: ${results.success.toLocaleString()}`)
    console.log(`   Failed: ${results.failed}`)
    console.log(
      `   Total job roles assigned: ${results.totalRoles.toLocaleString()}`,
    )
    console.log(`   Average roles per permit: ${avgRolesPerPermit}`)
    console.log(`   Time: ${(totalTime / 1000).toFixed(1)}s`)
    console.log(
      `   Rate: ${((results.success / (totalTime / 1000)) * 60).toFixed(0)} permits/min`,
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
