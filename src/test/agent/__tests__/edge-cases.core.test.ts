/**
 * Edge case tests for the demo assistant.
 * Verifies correct behavior for out-of-scope requests, pricing inquiries,
 * and scenarios where certain tools should NOT be called.
 */
import { describe, it, expect } from 'vitest'
import { runConversation } from '../runner'
import { CORRECTION_FLOW, PRICING_INQUIRY, WRONG_SERVICE } from '../fixtures'

describe('Edge cases', () => {
  it('captures lead for pricing inquiry without booking', async () => {
    const result = await runConversation(PRICING_INQUIRY)

    const toolNames = result.toolCalls.map((tc) => tc.name)

    expect(toolNames).toContain('create_lead')
    expect(toolNames).not.toContain('book_appointment')

    expect(result.turnCount).toBeLessThanOrEqual(
      PRICING_INQUIRY.expectations.max_turns!
    )
  })

  it('does not fabricate pricing information', async () => {
    const result = await runConversation(PRICING_INQUIRY)

    const assistantTurns = result.transcript.filter((t) => t.role === 'assistant')
    const allAssistantText = assistantTurns.map((t) => t.text).join(' ').toLowerCase()

    // Agent should not make up specific dollar amounts
    const hasFabricatedPrice = /\$\d{2,}/.test(allAssistantText) &&
      !allAssistantText.includes('free estimate')
    expect(hasFabricatedPrice).toBe(false)
  })

  it('uses corrected name and phone after caller fixes them', async () => {
    const result = await runConversation(CORRECTION_FLOW)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')

    const leadCalls = result.toolCalls.filter((tc) => tc.name === 'create_lead')
    const lastLead = leadCalls[leadCalls.length - 1]

    expect(lastLead.args.full_name).toMatch(/garcia/i)
    expect(lastLead.args.phone).toBe('416-555-8888')

    expect(result.turnCount).toBeLessThanOrEqual(
      CORRECTION_FLOW.expectations.max_turns!
    )
  })

  it('handles wrong service request gracefully', async () => {
    const result = await runConversation(WRONG_SERVICE)

    const toolNames = result.toolCalls
      .filter((tc) => tc.name !== 'end_call')
      .map((tc) => tc.name)

    // Should not book appointment for services the business doesn't offer
    expect(toolNames).not.toContain('book_appointment')

    expect(result.turnCount).toBeLessThanOrEqual(
      WRONG_SERVICE.expectations.max_turns!
    )
  })
})
