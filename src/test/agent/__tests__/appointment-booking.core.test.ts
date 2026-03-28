/**
 * Appointment booking conversation flow tests.
 * Verifies the assistant captures lead AND books appointment when caller
 * wants to schedule a visit.
 */
import { describe, it, expect } from 'vitest'
import { runConversation } from '../runner'
import { APPOINTMENT_BOOKING } from '../fixtures'

describe('Appointment booking', () => {
  it('creates lead and books appointment for cooperative booker', async () => {
    const result = await runConversation(APPOINTMENT_BOOKING)

    const toolNames = result.toolCalls.map((tc) => tc.name)
    expect(toolNames).toContain('create_lead')
    expect(toolNames).toContain('book_appointment')

    const lead = result.toolCalls.find((tc) => tc.name === 'create_lead')!
    expect(lead.args.full_name).toMatch(/sarah\s+johnson/i)
    expect(lead.args.phone).toContain('647')

    const booking = result.toolCalls.find((tc) => tc.name === 'book_appointment')!
    expect(booking.args.full_name).toMatch(/sarah\s+johnson/i)
    expect(booking.args.address).toBeTruthy()
    expect(booking.args.preferred_date).toBeTruthy()
    expect(booking.args.preferred_time).toBeTruthy()

    expect(result.turnCount).toBeLessThanOrEqual(
      APPOINTMENT_BOOKING.expectations.max_turns!
    )
  })

  it('books appointment after lead is created (correct ordering)', async () => {
    const result = await runConversation(APPOINTMENT_BOOKING)

    const leadIdx = result.toolCalls.findIndex((tc) => tc.name === 'create_lead')
    const bookIdx = result.toolCalls.findIndex((tc) => tc.name === 'book_appointment')

    expect(leadIdx).toBeGreaterThanOrEqual(0)
    expect(bookIdx).toBeGreaterThanOrEqual(0)
    expect(leadIdx).toBeLessThan(bookIdx)
  })
})
