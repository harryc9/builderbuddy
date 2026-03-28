/**
 * Builds a fully transient Vapi assistant config for the landing page demo.
 * No dashboard assistant needed — everything is defined in code.
 */

type ScrapedBusiness = {
  business_name: string
  business_name_pronunciation: string
  scraped_content: string
  url: string
}

export function buildTransientAssistant(business: ScrapedBusiness) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const spokenName = business.business_name_pronunciation || business.business_name

  return {
    name: 'Grout Demo',
    model: {
      provider: 'openai' as const,
      // TODO: use the correct model gpt-5.2-chat-latest
      model: 'gpt-5.2-chat-latest',
      messages: [
        {
          role: 'system' as const,
          content: buildSystemPrompt(spokenName, business.scraped_content),
        },
      ],
      tools: [
        { type: 'endCall' as const },
        ...buildTools(),
      ],
    },
    voice: {
      provider: '11labs' as const,
      voiceId: 'sarah',
      model: 'eleven_turbo_v2_5',
    },
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-3',
    },
    firstMessageMode: 'assistant-speaks-first-with-model-generated-message' as const,
    serverUrl: `${origin}/api/vapi`,
    clientMessages: [
      'transcript',
      'tool-calls',
      'tool-calls-result',
      'conversation-update',
    ],
    maxDurationSeconds: 180,
    silenceTimeoutSeconds: 10,
  }
}

export function buildSystemPrompt(businessName: string, context: string): string {
  return `You are the AI receptionist answering the phone on behalf of ${businessName}. You work FOR this company. The person calling you is a potential customer — NOT the business. you DON'T KNOW THE PERSON CALLING YOU, their name, or their phone number.

## First Message
When the call begins, greet the caller by saying something like: "Hi, thanks for calling ${businessName}! How can I help you today?" Keep it brief and natural.

## About the Business You Work For
${context}

## Your Role
- You represent ${businessName} and answer their incoming calls
- The caller is a potential customer looking for services
- Understand what service they need
- Collect their name, phone number, and service details
- If they want to schedule, book an appointment

## Conversation Flow
1. Greet the caller warmly on behalf of ${businessName}
2. Listen to their request and ask clarifying questions about the service needed
3. Collect their full name, phone number, and property address
4. Use create_lead to save the lead
5. If they want to schedule an estimate or service visit, ask for preferred date and time, then use book_appointment
6. Confirm what was done and let them know the team will follow up

## Rules
- Be conversational and natural — you're on a phone call, not writing an email
- Keep responses concise (1-2 sentences at a time)
- Don't ask for all information at once — have a natural back-and-forth
- If unsure about services offered, refer to the business context above
- If the caller asks something outside your scope, let them know you'll have the team follow up
- Never make up pricing or timelines — say the team will provide that info
- Always confirm details before calling a tool
- When the caller says goodbye or the conversation is clearly over, say a brief farewell and use the endCall tool to hang up`
}

function buildTools() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'create_lead',
        description:
          'Create a new lead record after collecting caller information. Call this after you have the caller\'s name, phone number, and service type.',
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
  ]
}
