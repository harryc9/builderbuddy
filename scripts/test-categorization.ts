#!/usr/bin/env bun

/**
 * Test Permit Categorization
 * Quick test to verify LLM categorization works
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Sample permits to test
const testPermits = [
  {
    description: 'HVAC - Proposal to construct a new 2 storey SFD',
    permit_type: 'Mechanical(MS)',
    structure_type: 'SFD - Detached',
    est_const_cost: 500000,
  },
  {
    description:
      'Plumbing - Proposal to demolish existing 1 storey SFD and construct new 2 storey duplex',
    permit_type: 'Plumbing(PS)',
    structure_type: '2 Unit - Detached',
    est_const_cost: null,
  },
  {
    description: 'Proposal to change use to a Multi-Tenant Assisted Home',
    permit_type: 'Building Additions/Alterations',
    structure_type: 'Other',
    est_const_cost: 960000,
  },
  {
    description:
      'Proposal to demolish existing 1 storey SFD and construct new 2 storey duplex',
    permit_type: 'Demolition Folder (DM)',
    structure_type: '2 Unit - Detached',
    est_const_cost: 0,
  },
  {
    description: 'Drain - Proposal for garden suite at rear of property',
    permit_type: 'Drain and Site Service',
    structure_type: 'Laneway / Rear Yard Suite',
    est_const_cost: null,
  },
]

async function main() {
  console.log('🧪 Testing Permit Categorization\n')

  // Fetch job roles
  console.log('📋 Fetching job role definitions...')
  const { data: jobRoles, error } = await supabase
    .from('job_role_definitions')
    .select('job_role_slug, job_role_name')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch job roles: ${error.message}`)
  }

  console.log(`   Loaded ${jobRoles.length} job roles\n`)

  const systemPrompt = `You are an expert construction permit analyst. Identify which job roles/trades would work on this permit.

Valid job role slugs:
${jobRoles.map((r) => `- ${r.job_role_slug}: ${r.job_role_name}`).join('\n')}

Return JSON: { "job_roles": ["slug1", "slug2", ...] }`

  // Test each permit
  for (let i = 0; i < testPermits.length; i++) {
    const permit = testPermits[i]
    console.log(`\n🔍 Test ${i + 1}/${testPermits.length}`)
    console.log(`   Description: ${permit.description}`)
    console.log(`   Type: ${permit.permit_type}`)
    console.log(`   Structure: ${permit.structure_type}`)
    console.log(
      `   Cost: ${permit.est_const_cost ? `$${permit.est_const_cost.toLocaleString()}` : 'N/A'}`,
    )

    const userPrompt = `Identify job roles:

DESCRIPTION: ${permit.description}
PERMIT TYPE: ${permit.permit_type}
STRUCTURE TYPE: ${permit.structure_type}
COST: ${permit.est_const_cost ? `$${permit.est_const_cost.toLocaleString()}` : 'Not specified'}

Return JSON: { "job_roles": [...] }`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.log('   ❌ No response')
        continue
      }

      const result = JSON.parse(content)
      const validSlugs = jobRoles.map((r) => r.job_role_slug)
      const roles = result.job_roles.filter((slug: string) =>
        validSlugs.includes(slug),
      )

      console.log(`   ✅ Job Roles (${roles.length}):`)
      for (const slug of roles) {
        const role = jobRoles.find((r) => r.job_role_slug === slug)
        console.log(`      - ${role?.job_role_name} (${slug})`)
      }
    } catch (error) {
      console.error(
        `   ❌ Error: ${error instanceof Error ? error.message : error}`,
      )
    }

    // Small delay between requests
    if (i < testPermits.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log('\n✅ Test complete!')
}

main()
