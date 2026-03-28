/**
 * Conversation runner for agent evals using Vapi's Chat API.
 * Sends the exact transient assistant config to Vapi, which processes it
 * through the real pipeline (model, tools). The caller side is an LLM
 * persona that generates customer responses.
 *
 * Tool calls are detected from the Vapi response payload regardless of
 * whether the webhook (serverUrl) is reachable. Set GROUT_TUNNEL_URL
 * if you need tool execution results; otherwise tool invocations are still
 * captured for assertion.
 */
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { buildSystemPrompt } from '@/lib/demo/build-assistant'
import type {
  CallerPersona,
  ConversationResult,
  RecordedToolCall,
  TestScenario,
  TranscriptTurn,
} from './types'

const CALLER_MODEL = 'gpt-5-mini' as const
const VAPI_CHAT_URL = 'https://api.vapi.ai/chat'

function getVapiKey(): string {
  const key = process.env.VAPI_PRIVATE_KEY
  if (!key) throw new Error('VAPI_PRIVATE_KEY not set')
  return key
}

function getServerUrl(): string | undefined {
  const tunnel = process.env.GROUT_TUNNEL_URL
  if (!tunnel) return undefined
  const url = new URL(tunnel)
  return `${url.origin}/api/vapi`
}

type VapiToolCall = {
  id: string
  type: string
  function: { name: string; arguments: string }
}

type VapiChatResponse = {
  id: string
  output: Array<{
    role: string
    content?: string
    tool_calls?: VapiToolCall[]
    tool_call_id?: string
  }>
}

function buildVapiAssistantConfig(scenario: TestScenario) {
  const { business } = scenario
  const spokenName = business.business_name_pronunciation || business.business_name

  return {
    model: {
      provider: 'openai' as const,
      model: 'gpt-5.2-chat-latest',
      messages: [
        {
          role: 'system' as const,
          content: buildSystemPrompt(spokenName, business.scraped_content),
        },
      ],
      tools: [
        {
          type: 'function' as const,
          function: {
            name: 'create_lead',
            description:
              "Create a new lead record after collecting caller information. Call this after you have the caller's name, phone number, and service type.",
            parameters: {
              type: 'object',
              properties: {
                full_name: { type: 'string', description: "Caller's full name" },
                phone: { type: 'string', description: "Caller's phone number" },
                email: { type: 'string', description: "Caller's email address" },
                service_type: { type: 'string', description: 'Type of service requested' },
                address: { type: 'string', description: 'Property address for the service' },
                urgency: {
                  type: 'string',
                  description: 'How urgent the request is',
                  enum: ['low', 'medium', 'high', 'emergency'],
                },
                notes: { type: 'string', description: 'Additional notes from the caller' },
              },
              required: ['full_name', 'phone', 'service_type'],
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'book_appointment',
            description:
              'Book an estimate or service appointment for the caller. Call this when the caller wants to schedule a visit.',
            parameters: {
              type: 'object',
              properties: {
                full_name: { type: 'string', description: "Caller's full name" },
                phone: { type: 'string', description: "Caller's phone number" },
                service_type: { type: 'string', description: 'Type of service' },
                address: { type: 'string', description: 'Property address' },
                preferred_date: { type: 'string', description: 'Preferred date (e.g., next Friday, March 28)' },
                preferred_time: { type: 'string', description: 'Preferred time (e.g., 2 PM, morning)' },
              },
              required: ['full_name', 'phone', 'service_type', 'address', 'preferred_date', 'preferred_time'],
            },
          },
        },
      ],
    },
    ...(getServerUrl() ? { serverUrl: getServerUrl() } : {}),
  }
}

function buildCallerSystemPrompt(persona: CallerPersona): string {
  const styleInstructions: Record<string, string> = {
    cooperative:
      'You answer questions directly and provide information when asked. You are friendly and easy to work with.',
    rambling:
      'You tend to go off on tangents, include unnecessary details, and take a while to get to the point. Mix in filler words like "uh", "you know", "like".',
    vague:
      'You give incomplete answers and are unclear about what you need. The receptionist has to ask follow-up questions to get specifics.',
    impatient:
      'You are in a hurry and want things done quickly. You may give short answers and express frustration if asked too many questions.',
    confused:
      'You are not sure exactly what service you need. You describe symptoms rather than solutions and need guidance.',
  }

  return `You are a homeowner calling a contractor's business. You are playing the role of a customer on a phone call.

## Your Identity
- Name: ${persona.name}
- Phone: ${persona.phone}
${persona.info.address ? `- Address: ${persona.info.address}` : ''}
${persona.info.email ? `- Email: ${persona.info.email}` : ''}

## Your Situation
${persona.scenario}
${persona.info.service_type ? `- You need: ${persona.info.service_type}` : ''}
${persona.info.urgency ? `- Urgency: ${persona.info.urgency}` : ''}
${persona.info.preferred_date ? `- Preferred date: ${persona.info.preferred_date}` : ''}
${persona.info.preferred_time ? `- Preferred time: ${persona.info.preferred_time}` : ''}

## Your Behavior
${styleInstructions[persona.style] ?? styleInstructions.cooperative}

## Rules
- Stay in character as the caller
- Only share information when asked or when it naturally comes up
- Keep responses short (1-2 sentences) like a real phone call
- When the receptionist confirms everything is set, say thanks and goodbye
- Never break character or acknowledge you are an AI
- Do NOT volunteer all your information at once — wait to be asked`
}

async function sendToVapi(
  input: string,
  assistantConfig: ReturnType<typeof buildVapiAssistantConfig>,
  previousChatId?: string
): Promise<VapiChatResponse> {
  const body: Record<string, unknown> = {
    input,
    assistant: assistantConfig,
  }
  if (previousChatId) body.previousChatId = previousChatId

  const res = await fetch(VAPI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getVapiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Vapi Chat API ${res.status}: ${errorBody}`)
  }

  return res.json()
}

function extractToolCalls(chatResponse: VapiChatResponse): RecordedToolCall[] {
  const toolCalls: RecordedToolCall[] = []

  for (const msg of chatResponse.output ?? []) {
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        let args: Record<string, unknown> = {}
        try {
          args = typeof tc.function.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : (tc.function.arguments as unknown as Record<string, unknown>)
        } catch { /* empty */ }
        toolCalls.push({ name: tc.function.name, args, result: {} })
      }
    }
  }

  return toolCalls
}

function extractAssistantText(chatResponse: VapiChatResponse): string {
  const assistantOutputs = (chatResponse.output ?? [])
    .filter((msg) => msg.role === 'assistant' && msg.content)
  return assistantOutputs.at(-1)?.content ?? ''
}

export async function runConversation(scenario: TestScenario): Promise<ConversationResult> {
  const { persona } = scenario
  const maxTurns = scenario.maxTurns ?? 20
  const assistantConfig = buildVapiAssistantConfig(scenario)
  const callerSystemPrompt = buildCallerSystemPrompt(persona)

  const callerMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  const transcript: TranscriptTurn[] = []
  const allToolCalls: RecordedToolCall[] = []
  let previousChatId: string | undefined
  let endedNaturally = false

  const log = (msg: string) => console.log(`  [${scenario.name}] ${msg}`)

  log('Starting conversation via Vapi Chat API...')
  log(`Server URL: ${getServerUrl() ?? '(none — tool calls still detected from response)'}`)

  // Turn 0: send initial greeting trigger to get assistant's first message
  log('→ Sending initial greeting trigger to Vapi...')
  const firstChat = await sendToVapi('Hi', assistantConfig)
  previousChatId = firstChat.id

  const firstAssistantText = extractAssistantText(firstChat)
  if (firstAssistantText) {
    log(`🤖 Assistant: ${firstAssistantText}`)
    const turnTools = extractToolCalls(firstChat)
    allToolCalls.push(...turnTools)
    transcript.push({
      role: 'assistant',
      text: firstAssistantText,
      toolCalls: turnTools.length > 0 ? turnTools : undefined,
    })
    callerMessages.push({ role: 'user', content: firstAssistantText })
  } else {
    log('⚠ No assistant response from initial chat. Raw response:')
    log(JSON.stringify(firstChat, null, 2))
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    log(`--- Turn ${turn + 1}/${maxTurns} ---`)

    // Caller turn — LLM generates customer response
    const callerResult = await generateText({
      model: openai.chat(CALLER_MODEL),
      system: callerSystemPrompt,
      messages: callerMessages,
    })

    const callerText = callerResult.text || ''
    if (!callerText) {
      log('⚠ Caller produced empty response, ending.')
      break
    }

    log(`👤 Caller: ${callerText}`)
    transcript.push({ role: 'user', text: callerText })
    callerMessages.push({ role: 'assistant', content: callerText })

    // Assistant turn — send caller text to Vapi Chat API
    log('→ Sending to Vapi...')
    const chatResponse = await sendToVapi(callerText, assistantConfig, previousChatId)
    previousChatId = chatResponse.id

    const assistantText = extractAssistantText(chatResponse)
    const turnTools = extractToolCalls(chatResponse)
    allToolCalls.push(...turnTools)

    if (turnTools.length > 0) {
      for (const tc of turnTools) {
        log(`🔧 Tool: ${tc.name}(${JSON.stringify(tc.args)})`)
      }
    }

    if (assistantText) {
      log(`🤖 Assistant: ${assistantText}`)
      transcript.push({
        role: 'assistant',
        text: assistantText,
        toolCalls: turnTools.length > 0 ? turnTools : undefined,
      })
      callerMessages.push({ role: 'user', content: assistantText })
    } else {
      log('⚠ Empty assistant response — raw Vapi response:')
      log(JSON.stringify(chatResponse, null, 2))
    }

    // Detect conversation end
    const lowerCaller = callerText.toLowerCase()
    const callerSaidBye =
      lowerCaller.includes('bye') &&
      (lowerCaller.includes('thank') || lowerCaller.includes('good'))
    const assistantSaidBye = assistantText.toLowerCase().includes('bye')

    if (callerSaidBye || assistantSaidBye) {
      log('✓ Conversation ended naturally')
      endedNaturally = true
      break
    }
  }

  log(`Done: ${transcript.filter(t => t.role === 'user').length} turns, ${allToolCalls.length} tool calls`)

  return {
    transcript,
    toolCalls: allToolCalls,
    turnCount: transcript.filter((t) => t.role === 'user').length,
    endedNaturally,
  }
}
