/**
 * Type definitions for the agent conversation eval framework.
 * Used by the runner, fixtures, and test assertions.
 */

export type ScrapedBusiness = {
  business_name: string
  business_name_pronunciation: string
  scraped_content: string
  url: string
}

export type CallerStyle = 'cooperative' | 'rambling' | 'vague' | 'impatient' | 'confused'

export type CallerPersona = {
  name: string
  phone: string
  scenario: string
  info: {
    address?: string
    email?: string
    service_type?: string
    urgency?: string
    preferred_date?: string
    preferred_time?: string
  }
  style: CallerStyle
}

export type TestScenario = {
  name: string
  description: string
  business: ScrapedBusiness
  persona: CallerPersona
  maxTurns?: number
  expectations: {
    tools_called: string[]
    tool_args?: Record<string, Record<string, unknown>>
    tools_not_called?: string[]
    max_turns?: number
  }
}

export type RecordedToolCall = {
  name: string
  args: Record<string, unknown>
  result: Record<string, unknown>
}

export type TranscriptTurn = {
  role: 'assistant' | 'user'
  text: string
  toolCalls?: RecordedToolCall[]
}

export type ConversationResult = {
  transcript: TranscriptTurn[]
  toolCalls: RecordedToolCall[]
  turnCount: number
  endedNaturally: boolean
}
