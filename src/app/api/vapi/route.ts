/**
 * Vapi Server URL handler — receives webhook events during calls.
 * Handles tool-calls with simulated results for the demo.
 */
import { NextRequest, NextResponse } from 'next/server'

type ToolCall = {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

type VapiMessage = {
  message: {
    type: string
    toolCallList?: ToolCall[]
    call?: { id: string }
    [key: string]: unknown
  }
}

export async function POST(request: NextRequest) {
  const body: VapiMessage = await request.json()
  const messageType = body.message?.type

  if (messageType === 'tool-calls') {
    const toolCalls = body.message.toolCallList ?? []
    const results = toolCalls.map((toolCall) => handleToolCall(toolCall))
    return NextResponse.json({ results })
  }

  if (messageType === 'status-update') {
    return NextResponse.json({})
  }

  if (messageType === 'end-of-call-report') {
    return NextResponse.json({})
  }

  return NextResponse.json({})
}

function handleToolCall(toolCall: ToolCall) {
  const { name, arguments: argsStr } = toolCall.function
  let args: Record<string, unknown> = {}
  try {
    args = JSON.parse(argsStr)
  } catch {
    args = {}
  }

  switch (name) {
    case 'create_lead':
      return {
        toolCallId: toolCall.id,
        result: JSON.stringify({
          status: 'success',
          message: `Lead saved for ${args.full_name}`,
          record_id: `lead_demo_${randomId()}`,
          display_data: {
            full_name: args.full_name,
            phone: args.phone,
            service_type: args.service_type,
            urgency: args.urgency ?? 'medium',
          },
        }),
      }

    case 'book_appointment':
      return {
        toolCallId: toolCall.id,
        result: JSON.stringify({
          status: 'success',
          message: `Appointment confirmed for ${args.preferred_date} at ${args.preferred_time}`,
          record_id: `apt_demo_${randomId()}`,
          display_data: {
            date: args.preferred_date,
            time: args.preferred_time,
            address: args.address,
            service: args.service_type,
            full_name: args.full_name,
          },
        }),
      }

    default:
      return {
        toolCallId: toolCall.id,
        result: JSON.stringify({
          status: 'error',
          message: `Unknown tool: ${name}`,
        }),
      }
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8)
}
