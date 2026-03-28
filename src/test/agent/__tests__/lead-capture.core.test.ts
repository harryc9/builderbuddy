/**
 * Lead capture conversation flow tests.
 * Verifies the assistant correctly collects caller info and calls create_lead
 * across different caller styles and business contexts.
 */
import { describe, it, expect } from 'vitest'
import { runConversation } from '../runner'
import {
  LEAD_CAPTURE_COOPERATIVE,
  LEAD_CAPTURE_RAMBLING,
  LEAD_CAPTURE_VAGUE,
  EMERGENCY_LEAD,
  DIFFERENT_BUSINESS,
} from '../fixtures'

describe('Lead capture', () => {
  it('captures lead from cooperative caller', async () => {
    const result = await runConversation(LEAD_CAPTURE_COOPERATIVE)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')

    const lead = result.toolCalls.find((tc) => tc.name === 'create_lead')!
    expect(lead.args.full_name).toMatch(/john\s+smith/i)
    expect(lead.args.phone).toContain('416')
    expect(lead.args.service_type).toBeTruthy()

    expect(result.turnCount).toBeLessThanOrEqual(
      LEAD_CAPTURE_COOPERATIVE.expectations.max_turns!
    )
  })

  it('captures lead from rambling caller', async () => {
    const result = await runConversation(LEAD_CAPTURE_RAMBLING)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')

    const lead = result.toolCalls.find((tc) => tc.name === 'create_lead')!
    expect(lead.args.full_name).toMatch(/mike\s+williams/i)
    expect(lead.args.phone).toBeTruthy()

    expect(result.turnCount).toBeLessThanOrEqual(
      LEAD_CAPTURE_RAMBLING.expectations.max_turns!
    )
  })

  it('captures lead from vague caller with clarifying questions', async () => {
    const result = await runConversation(LEAD_CAPTURE_VAGUE)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')

    const lead = result.toolCalls.find((tc) => tc.name === 'create_lead')!
    expect(lead.args.full_name).toMatch(/lisa\s+chen/i)
  })

  it('captures emergency lead with urgency', async () => {
    const result = await runConversation(EMERGENCY_LEAD)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')

    const lead = result.toolCalls.find((tc) => tc.name === 'create_lead')!
    expect(lead.args.full_name).toMatch(/david\s+brown/i)

    expect(result.turnCount).toBeLessThanOrEqual(
      EMERGENCY_LEAD.expectations.max_turns!
    )
  })

  it('adapts to different business context', async () => {
    const result = await runConversation(DIFFERENT_BUSINESS)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')

    const lead = result.toolCalls.find((tc) => tc.name === 'create_lead')!
    expect(lead.args.full_name).toMatch(/john\s+smith/i)
    expect(lead.args.phone).toContain('416')
  })
})
