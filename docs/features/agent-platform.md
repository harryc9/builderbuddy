# Grout Agent Platform

An AI-powered voice agent platform for construction SMBs. Voice is the wedge; workflow automation is the product.

---

# PRODUCT

## Problem

Construction SMBs (roofers, HVAC, plumbers, electricians, general contractors) lose revenue because:

- **Missed calls go unanswered.** A contractor on a job site can't pick up the phone. That missed call is a lost lead — often worth $2K–$20K+ in project revenue.
- **Lead response is slow.** Even when calls are returned, hours or days pass. Speed-to-lead is the single biggest predictor of conversion in home services.
- **Booking is manual and error-prone.** Scheduling estimate visits requires back-and-forth calls, checking calendars, confirming details — all done by the contractor or a receptionist who may not exist.
- **No system of record.** Many SMBs run on sticky notes, text messages, and memory. Leads fall through the cracks.

The pain is acute: these businesses depend on inbound calls for revenue, but their operations make it nearly impossible to handle those calls consistently.

## Value Proposition

Grout is an AI agent that **answers calls, qualifies leads, and takes action** — not just talks.

The critical distinction: most voice AI products stop at conversation. Grout executes downstream workflows:

- Captures lead information into a structured record
- Books estimate appointments on the contractor's calendar
- Sends confirmation SMS to the homeowner
- Notifies the contractor with full context
- Logs everything for follow-up

This is a **revenue capture tool**, not a chatbot.

## Target Customer

Construction SMBs with 1–50 employees:

| Trade | Why they fit |
|---|---|
| Roofers | High ticket, seasonal demand spikes, lots of missed calls |
| HVAC | Emergency + scheduled work, high call volume |
| Plumbers | Emergency-heavy, speed-to-lead matters enormously |
| Electricians | Mix of residential and commercial, repeat business |
| General contractors | Project-based, need to qualify scope before booking |
| Landscapers | Seasonal, high volume of estimate requests |
| Painters | High inbound during spring/summer, straightforward booking |

Common traits:
- Owner-operators or small office staff
- Revenue directly tied to inbound call conversion
- Use simple tools (Google Calendar, phone, maybe Jobber/ServiceTitan/Housecall Pro)
- Willing to pay $200–$500/month for something that reliably captures missed revenue

## First Use Cases

### Use Case 1: Missed Call Recovery

**Trigger:** Contractor doesn't answer an inbound call.

**Flow:**
1. Call is forwarded to Grout after X rings or when busy
2. Agent answers with the contractor's business greeting
3. Agent identifies the caller's need (service type, urgency, location)
4. Agent collects contact info (name, phone, email, address)
5. Agent creates a structured lead record
6. Agent sends SMS to contractor: "New lead: John Smith, roof leak, 123 Main St, urgent"
7. Agent sends SMS to caller: "Thanks for calling [Business]. We've noted your request and will follow up shortly."

**Success metric:** Lead captured with all required fields, contractor notified within 60 seconds.

### Use Case 2: Appointment Booking

**Trigger:** Inbound call requesting an estimate or service visit.

**Flow:**
1. Agent answers and identifies booking intent
2. Agent collects: service type, property address, preferred date/time, contact info
3. Agent checks contractor's calendar for availability
4. Agent proposes available slots
5. Caller confirms a slot
6. Agent books the appointment on the contractor's calendar
7. Agent sends confirmation SMS to both parties
8. Agent creates/updates lead record with appointment details

**Success metric:** Appointment booked on calendar with confirmation sent, zero contractor involvement required.

### Combined Flow

In practice, these two use cases overlap. A missed call recovery often ends with booking an appointment. The agent should handle the full flow seamlessly:

missed call → answer → qualify → collect info → check availability → book → confirm → notify

## Competitive Positioning

**Voice is the wedge, not the product.**

The entry point is "we answer your missed calls." That's simple to explain, simple to sell.

The real value — and the moat — is the **workflow automation behind the voice**:
- Structured lead capture
- Calendar integration
- SMS notifications
- CRM-like record keeping
- Business rules (after-hours behavior, service area filtering, escalation)

Competitors who stop at "AI receptionist" are building a feature. Grout is building the **operating system for contractor lead management**, with voice as the primary interface.

## Pricing Direction

Per-customer monthly SaaS, not per-project services.

| Tier | Price Range | Includes |
|---|---|---|
| Starter | $199–$299/mo | Missed call recovery, lead capture, SMS notifications |
| Pro | $399–$499/mo | + appointment booking, calendar integration, business rules |
| Enterprise | Custom | Multi-location, custom integrations, dedicated support |

Usage-based component: per-minute voice charges passed through (Vapi/Twilio costs) or bundled into a minutes allowance.

The goal is 80–90% of customer variation handled by configuration, not custom code. If onboarding a new customer requires more than 10–20% net-new logic, the platform isn't mature enough.

---

# TECH

## Core Architecture: 4-Layer System

The system separates concerns into four distinct layers. This is the architectural decision that determines whether Grout becomes a scalable product or a custom services business.

```
┌─────────────────────────────────────────────┐
│              VOICE INTERFACE                │
│         (Vapi — thinnest layer)             │
│      ASR → normalized text → TTS            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          LAYER 1: AGENT BRAIN               │
│  conversation state · intent recognition    │
│  slot filling · planning · guardrails       │
│  memory · fallback · escalation             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       LAYER 2: CAPABILITY LAYER             │
│  create_lead · book_appointment · send_sms  │
│  get_availability · qualify_lead            │
│  (business-level actions, vendor-agnostic)  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         LAYER 3: ADAPTER LAYER              │
│  Google Calendar adapter · Twilio adapter   │
│  ServiceTitan adapter · Jobber adapter      │
│  Webhook adapter · Internal DB adapter      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│     LAYER 4: CUSTOMER CONFIGURATION         │
│  enabled capabilities · business rules      │
│  routing · persona · operating hours        │
│  field mappings · escalation rules          │
└─────────────────────────────────────────────┘
```

### Layer 1: Shared Agent Brain

The agent core that stays the same across all customers. This is the product.

**Responsibilities:**
- Conversation state management (what has been said, what's been collected, what's missing)
- Intent classification (booking, inquiry, complaint, emergency, spam)
- Slot filling (systematically collecting required information)
- Capability selection (deciding which business action to invoke)
- Clarification logic (asking for missing or ambiguous info)
- Confirmation behavior (repeating back critical data: names, addresses, times)
- Guardrails (staying within scope, refusing inappropriate requests)
- Fallback/escalation (handing off to human when uncertain)
- Memory (within-call context, cross-call history where applicable)
- Retry behavior (handling tool failures gracefully)

**What this is NOT:**
- Not a general-purpose autonomous planner
- Not a free-form conversational agent
- Not customer-specific logic

The agent operates inside a **controlled action graph**, not an open-ended reasoning loop. For most B2B voice calls:
- Narrow domain
- Limited capability set
- Deterministic routing when possible
- LLM for interpretation, slot filling, summarization, and response generation
- Code for execution

**Hybrid control model:**

| LLM does | Backend does |
|---|---|
| Understand request | Enforce permissions |
| Extract structured inputs | Resolve customer config |
| Choose from allowed capabilities | Call correct adapter |
| Ask clarifying questions | Validate fields |
| Generate user-facing response | Run business rules |
| | Execute side effects |
| | Log everything |

### Layer 2: Capability Layer

Business-level actions that are **vendor-agnostic**. The agent calls capabilities, not raw vendor tools.

**Why this matters:** LLMs handle abstraction better than vendor sprawl. Instead of exposing `hubspot_create_contact`, `servicetitan_create_booking`, `google_calendar_insert_event` — expose clean business actions with stable schemas.

**Initial capabilities for v1:**

| Capability | Description | Required Inputs |
|---|---|---|
| `create_lead` | Create a new lead record | full_name, phone, service_type |
| `qualify_lead` | Assess lead quality/urgency | service_type, urgency, location, budget_range |
| `get_availability` | Check open calendar slots | date_range, service_type, location |
| `book_appointment` | Book an estimate/service visit | lead_id, datetime, service_type, address |
| `send_sms` | Send SMS to a phone number | to_phone, message, message_type |
| `notify_contractor` | Alert contractor of new lead/booking | lead_id, notification_type, urgency |
| `get_customer_record` | Look up existing customer by phone/name | phone or full_name |
| `update_lead` | Update fields on an existing lead | lead_id, fields_to_update |

**Capability definition format:**

```json
{
  "name": "create_lead",
  "description": "Create a new lead in the customer's system for follow-up.",
  "input_schema": {
    "type": "object",
    "properties": {
      "full_name": { "type": "string" },
      "phone": { "type": "string" },
      "email": { "type": "string" },
      "service_type": { "type": "string" },
      "address": { "type": "string" },
      "urgency": { "type": "string", "enum": ["low", "medium", "high", "emergency"] },
      "notes": { "type": "string" },
      "source": { "type": "string" }
    },
    "required": ["full_name", "phone"]
  },
  "preconditions": ["caller_identified"],
  "failure_modes": ["missing_required_fields", "duplicate_lead", "system_unavailable"]
}
```

### Layer 3: Adapter Layer

Where customer-specific implementation lives. Each adapter translates the canonical capability input into the customer's actual system.

**Same capability, different adapter:**

| Customer | `book_appointment` adapter | `send_sms` adapter |
|---|---|---|
| Customer A | ServiceTitan API | Twilio |
| Customer B | Google Calendar API | Twilio |
| Customer C | Jobber API | Jobber built-in SMS |
| Customer D | Webhook to internal system | Webhook |

**Adapter contract:**

Every adapter receives a standardized input and returns a standardized result (see "Standardized Tool Results" below). The adapter is responsible for:
- Authenticating with the external system
- Mapping canonical fields to vendor-specific fields
- Making the API call
- Normalizing the response back to canonical format
- Handling vendor-specific errors

**Initial adapters for v1:**
- **Internal DB adapter** — stores leads/appointments in Grout's own database (default for all customers)
- **Google Calendar adapter** — reads/writes calendar events for availability and booking
- **Twilio SMS adapter** — sends SMS notifications
- **Webhook adapter** — generic HTTP webhook for customers with custom systems

### Layer 4: Customer Configuration

Most variation between customers should live in config, not code.

**Per-customer config structure:**

```json
{
  "customer_id": "acme-roofing",
  "business_name": "Acme Roofing Co.",
  "phone_number": "+14165551234",

  "persona": {
    "greeting": "Thanks for calling Acme Roofing. How can I help you today?",
    "tone": "friendly_professional",
    "name": "Sarah"
  },

  "operating_hours": {
    "timezone": "America/Toronto",
    "weekday": { "start": "08:00", "end": "18:00" },
    "saturday": { "start": "09:00", "end": "14:00" },
    "sunday": null
  },

  "enabled_capabilities": [
    "create_lead",
    "qualify_lead",
    "get_availability",
    "book_appointment",
    "send_sms",
    "notify_contractor"
  ],

  "rules": {
    "after_hours": "collect_lead_only",
    "appointment_requires_confirmation": false,
    "service_area_filter": ["Toronto", "Mississauga", "Brampton"],
    "emergency_escalate_immediately": true,
    "max_appointment_days_out": 14
  },

  "routing": {
    "create_lead": "internal_db",
    "book_appointment": "google_calendar",
    "send_sms": "twilio",
    "notify_contractor": "twilio"
  },

  "field_mappings": {},

  "escalation": {
    "default_phone": "+14165559999",
    "emergency_phone": "+14165558888"
  },

  "service_types": [
    "roof_inspection",
    "roof_repair",
    "roof_replacement",
    "gutter_cleaning",
    "emergency_leak"
  ]
}
```

**Config principle:** If a difference between customers can be expressed as mapping, routing, validation, policy, enable/disable, or thresholds — it belongs in config. If it changes how the agent fundamentally reasons, it may belong in the core.

## Voice Integration: Vapi

Vapi is the voice interface layer. It should be the **thinnest possible layer** — responsible only for:
- Receiving phone calls (via Twilio numbers provisioned through Vapi)
- Speech-to-text (ASR)
- Routing transcribed text to the agent core
- Text-to-speech (TTS) for agent responses
- Managing call lifecycle (answer, hold, transfer, hang up)

**Vapi integration model:**
- Vapi manages the phone number and call routing
- Vapi's server URL points to a Grout API endpoint
- On each user turn, Vapi sends the transcribed text to the agent
- The agent processes the turn (via the 4-layer stack) and returns a text response
- Vapi converts the response to speech and plays it back
- Tool calls are handled server-side by the agent, not by Vapi's built-in tool system

**Why not use Vapi's built-in tool calling?**
- It couples business logic to the voice layer
- It makes testing without voice impossible
- It scatters capability definitions across Vapi dashboards and backend code
- It prevents text-based simulation of the full agent flow

The agent core should work identically whether the input comes from Vapi (voice), a chat widget (text), or a test harness (simulated transcript).

## Canonical Objects

Standardized data models used across all layers. If every customer invents their own data model, the platform dies.

| Object | Key Fields |
|---|---|
| **Lead** | id, full_name, phone, email, address, service_type, urgency, source, status, notes, created_at |
| **Appointment** | id, lead_id, customer_id, datetime, duration, service_type, address, status, confirmed_at |
| **Customer** (the SMB) | id, business_name, phone, config, adapters, created_at |
| **Conversation** | id, customer_id, lead_id, call_sid, channel (voice/chat), transcript, started_at, ended_at, outcome |
| **Action** | id, conversation_id, capability_name, input, output, status, started_at, completed_at |
| **Task** | id, lead_id, customer_id, type, description, due_at, status, assigned_to |

## Action Lifecycle

Every action (capability invocation) follows a standardized lifecycle:

```
requested → validating → executing → succeeded
                                    → failed
                                    → requires_human
```

| State | Meaning |
|---|---|
| `requested` | Agent decided to invoke this capability |
| `validating` | Checking required fields, permissions, business rules |
| `executing` | Adapter is making the external call |
| `succeeded` | Action completed, result available |
| `failed` | Action failed (may be retryable) |
| `requires_human` | Action needs human approval or intervention |

This gives reliable logs, retries, and UI for every action the agent takes.

## Standardized Tool Results

Every adapter returns a standardized result, regardless of the underlying vendor:

```json
{
  "status": "success",
  "message": "Appointment booked for Friday at 2:00 PM",
  "record_id": "apt_abc123",
  "display_data": {
    "time": "2026-03-27 2:00 PM",
    "address": "123 Main St, Toronto",
    "service": "Roof Inspection"
  },
  "retryable": false
}
```

If tool outputs are inconsistent, the agent becomes brittle. The agent brain should never need to parse vendor-specific response formats.

## Error Taxonomy

Standardized error types across all adapters:

| Error | Meaning | Agent behavior |
|---|---|---|
| `missing_input` | Required field not provided | Ask caller for missing info |
| `invalid_input` | Field value doesn't pass validation | Ask caller to correct |
| `auth_error` | Adapter can't authenticate with external system | Apologize, offer to take message |
| `temporary_failure` | Transient error, can retry | Retry once, then fallback |
| `not_found` | Record doesn't exist | Inform caller, offer alternatives |
| `business_rule_violation` | Action blocked by policy (e.g., outside service area) | Explain limitation, offer alternative |
| `conflict` | Duplicate or scheduling conflict | Offer alternative options |
| `human_approval_required` | Action needs manual approval | Collect info, notify contractor |
| `system_unavailable` | External system is down | Collect info for later processing |

## Testing Strategy

Build the agent so that **80–90% of tests pass without a microphone.** Voice testing is reserved for audio edge cases, timing, and naturalness.

### Layer 1: Pure Agent Tests (no voice, no external systems)

Text turns in, expected behavior out. This is the workhorse test layer.

Tests cover:
- Intent recognition from various phrasings
- Slot filling completeness and ordering
- Capability selection logic
- Fallback/escalation triggers
- Policy enforcement (after-hours, service area)
- Confirmation behavior
- Multi-turn dialogue state management

Input format:
```json
[
  { "speaker": "user", "text": "Hi, I need someone to come check my roof leak tomorrow" },
  { "speaker": "expected", "intent": "book_appointment", "slots_extracted": ["service_type:roof_inspection"], "slots_missing": ["full_name", "phone", "address", "preferred_time"] }
]
```

### Layer 2: Transcript Realism Tests

Same as Layer 1, but with messy human speech as input:
- Filler words: "uh yeah hi, I think, like, maybe tomorrow?"
- Self-corrections: "Actually not tomorrow, probably Friday afternoon"
- Incomplete thoughts: "I need a... what do you call it... the thing on the roof"
- Rambling: Long-winded explanations with buried intent
- Repeated info: Caller says the same thing twice differently

This catches dialogue-state problems that look like "voice quality issues" but are actually agent logic failures.

### Layer 3: ASR/TTS Boundary Tests

Test transcription edge cases:
- Phone number parsing ("four one six, five five five, one two three four")
- Name spelling and recognition
- Address parsing with unit numbers, abbreviations
- Date/time interpretation ("next Tuesday", "this coming weekend")
- Noisy audio transcription artifacts

### Layer 4: Live Call Tests

Small number only. Used for:
- Latency measurement (end-to-end response time)
- Turn-taking behavior (interruption handling, barge-in)
- Voice naturalness and tone
- Real-world audio conditions (speakerphone, car, job site noise)

Test matrix:
- Quiet room
- Noisy environment
- Fast speaker
- Accented speaker
- Indecisive/rambling speaker

## Replay and Debug System

Every production call generates a structured log:

| Field | Content |
|---|---|
| `raw_transcript` | Direct ASR output with timestamps |
| `normalized_transcript` | Cleaned transcript used by agent |
| `turns` | Array of turn objects (see below) |
| `actions` | All capability invocations with inputs/outputs |
| `latency` | Per-stage timing (ASR, agent processing, TTS, tool calls) |
| `outcome` | Final call classification (lead_captured, appointment_booked, escalated, abandoned) |

Each turn in the log:
```json
{
  "turn_number": 3,
  "speaker": "user",
  "raw_text": "uh yeah hi my name is john smith",
  "normalized_text": "My name is John Smith",
  "agent_state": {
    "intent": "create_lead",
    "slots_filled": { "full_name": "John Smith" },
    "slots_missing": ["phone", "service_type", "address"],
    "next_action": "ask_for_phone"
  },
  "agent_response": "Thanks John. What's the best phone number to reach you at?",
  "latency_ms": 340
}
```

This enables **transcript replay** — debugging any call as text in an internal tool without re-calling the number.

## Customer Onboarding Flow

Onboarding a new customer should follow this sequence:

**Step 1: Choose use case**
- Not "what tools do you use?" — start from workflow:
  - Missed call recovery
  - Appointment booking
  - Both

**Step 2: Map capabilities**
- Which of the available capabilities does this customer need?
- Which systems implement each one?

**Step 3: Define business rules**
- What can be done automatically vs. requires approval?
- After-hours behavior?
- Service area restrictions?
- Emergency handling?
- Who gets notified and how?

**Step 4: Connect adapters**
- Calendar system (Google Calendar, ServiceTitan, Jobber, etc.)
- SMS provider (Twilio, or via their existing system)
- CRM/lead storage (Grout internal, or push to their system)

**Step 5: Test in simulation**
- Run standardized test scenarios before going live
- Text-based simulation of the full call flow with their config
- Verify adapter connections work end-to-end

**Health metric:** When onboarding a new customer, what percentage is config/mapping vs. net-new logic?
- Healthy: 80–90% config/mapping, 10–20% extensions
- Danger zone: 50%+ new logic per customer

## Handling Customer-Specific Weirdness

Every customer will have edge cases. Do not solve them by mutating the agent core. Use one of these buckets:

| Bucket | Example | Solution |
|---|---|---|
| **Field mapping** | "Customer calls it `site_supervisor_phone`, another calls it `contact_mobile`" | Mapping tables in config |
| **Workflow policy** | "One customer wants immediate booking, another wants draft + approval" | Policy config (`appointment_requires_confirmation: true`) |
| **Custom step injection** | "One customer needs `check_blackout_dates` before scheduling" | Pre/post hooks on capabilities |
| **Customer-specific capability** | Truly unique business logic | Label as `customer_specific`, promote to shared if 3–5 customers need similar |

## Dialogue Design Principles

For production voice, the agent follows a **bounded flow**, not open-ended conversation.

**Do:**
- One question at a time
- Short acknowledgments ("Got it.")
- Explicit state progression (always know what slot you're collecting next)
- Compact confirmations ("Friday at 2 PM in North York, correct?")
- Graceful repair handling ("Sorry, I meant Friday" → update slot, don't restart)

**Don't:**
- Multi-sentence answers when one will do
- Over-explain or narrate what the agent is doing
- Let the model freestyle the whole call
- Use verbose confirmation ("Thank you for confirming that the requested service appointment is for Friday at 2:00 PM Eastern Standard Time at the property located at...")

**Confirmation rules:**
- Always confirm: names, phone numbers, addresses, dates/times, booking details
- Don't confirm: obvious simple facts, low-risk filler, already-confirmed context

## Implementation Steps

Each step is a manageable chunk that can be completed and tested independently.

### Step 1: Database Schema

Set up the core tables for the platform.

**Tables:**
- `customers` — SMB accounts (business_name, phone, config JSON, created_at)
- `customer_capabilities` — enabled capabilities per customer with adapter routing
- `adapters` — adapter registry (type, credentials, config)
- `leads` — captured lead records
- `appointments` — booked appointments
- `conversations` — call/chat session records with transcripts
- `actions` — action log (capability invocations with lifecycle state)
- `conversation_turns` — per-turn state log for replay

**Testable outcome:** Can create a customer, configure capabilities, and store/retrieve leads via direct DB queries.

### Step 2: Agent Core Runtime

Build the conversation engine that powers all interactions.

**Components:**
- State machine for dialogue flow (intent → slot collection → capability dispatch → confirmation → end)
- Intent classifier (LLM-based, constrained to known intents)
- Slot filler (extracts structured data from natural language turns)
- Capability dispatcher (selects and invokes the right capability based on state)
- Response generator (produces agent utterances from state + templates)
- Guardrails (scope enforcement, escalation triggers)

**Key design decision:** The agent operates on normalized text input. It has no knowledge of whether input came from voice, chat, or a test harness. The runtime is a pure function: `(conversation_state, new_turn) → (updated_state, agent_response, actions[])`.

**Testable outcome:** Can run a multi-turn text conversation that collects lead info and triggers a `create_lead` capability call.

### Step 3: First Capabilities

Implement the business-level actions.

**Capabilities:**
- `create_lead` — validates required fields, creates lead in DB, returns lead_id
- `book_appointment` — checks availability, creates appointment, links to lead
- `send_sms` — sends SMS via configured adapter
- `qualify_lead` — scores/categorizes lead based on collected info
- `get_availability` — queries calendar for open slots
- `notify_contractor` — sends notification with lead/booking context

**Testable outcome:** Can invoke each capability directly (without agent or voice) and verify correct DB writes and adapter calls.

### Step 4: Adapter Framework + First Adapters

Build the adapter abstraction and initial implementations.

**Framework:**
- Adapter interface (standardized input/output contract)
- Adapter registry (resolves customer config → correct adapter)
- Error normalization (vendor errors → standard error taxonomy)
- Credential management (per-customer adapter auth)

**First adapters:**
- Internal DB adapter (default — stores everything in Grout's own tables)
- Google Calendar adapter (OAuth2, read availability, create events)
- Twilio SMS adapter (send SMS, track delivery)
- Webhook adapter (generic HTTP POST to customer endpoint)

**Testable outcome:** Can route a `book_appointment` call through Google Calendar adapter and verify the event is created. Can send an SMS via Twilio adapter.

### Step 5: Customer Config System

Build the configuration layer that makes each customer unique without custom code.

**Components:**
- Config schema and validation (Zod)
- Config storage (customers table JSON column or separate config table)
- Config resolution at runtime (merge defaults with customer overrides)
- Business rules engine (simple rule evaluation: after-hours, service area, escalation)
- Persona/greeting management

**Testable outcome:** Can create two customers with different configs (different service types, different operating hours, different adapter routing) and verify the agent behaves differently for each.

### Step 6: Text-Based Testing Infrastructure

Build the testing and simulation framework.

**Components:**
- Test runner that feeds text transcripts through the agent core
- Transcript fixtures (clean + messy/realistic variants)
- Expected-behavior assertions (intent, slots, capability calls, responses)
- Transcript mutation generator (adds filler words, corrections, ASR artifacts)
- Test coverage reporting per capability and intent

**Testable outcome:** Can run a suite of 50+ text-based test cases and get a pass/fail report without touching a phone.

### Step 7: Vapi Voice Integration

Wire up Vapi as the voice interface layer.

**Components:**
- Vapi server URL endpoint (receives transcribed speech, returns agent response)
- Phone number provisioning (via Vapi dashboard or API)
- Call lifecycle management (answer, process turns, end call)
- Vapi assistant configuration (voice selection, interruption settings, silence detection)
- Call forwarding setup (contractor's number → Vapi number on no-answer)

**Testable outcome:** Can call the Vapi number, have a conversation, and see the lead appear in the database with full transcript log.

### Step 8: Call Logging, Replay, and Debugging

Build observability into every call.

**Components:**
- Structured call log writer (raw transcript, normalized transcript, per-turn state, actions, latency)
- Replay viewer (internal tool to step through any call turn-by-turn)
- Latency tracking (per-stage: ASR, agent processing, tool calls, TTS)
- Outcome classification (lead_captured, appointment_booked, escalated, abandoned, spam)
- Alert system (flag calls where agent fell back to escalation or had high latency)

**Testable outcome:** Can replay any production call as text, inspect agent state at each turn, and identify exactly where/why issues occurred.

### Step 9: Customer Onboarding Flow

Build the workflow for setting up new customers.

**Components:**
- Onboarding wizard (web UI or CLI)
  - Use case selection
  - Business info collection
  - Service types configuration
  - Operating hours setup
  - Adapter connection (OAuth for Google Calendar, Twilio credentials)
  - Business rules configuration
  - Persona/greeting customization
- Simulation test suite (run standard test scenarios with new customer's config)
- Go-live checklist (all adapters connected, test calls passed, contractor notified)

**Testable outcome:** Can onboard a new customer end-to-end and have their first call handled correctly within 30 minutes.

### Step 10: Dashboard

Build the customer-facing management interface.

**Components:**
- Call log viewer (list of calls with outcome, duration, lead captured)
- Lead management (view, edit, follow-up status)
- Appointment calendar view
- Configuration editor (service types, hours, greeting, rules)
- Analytics (calls handled, leads captured, appointments booked, response time)
- Adapter status (connection health for Google Calendar, Twilio, etc.)

**Testable outcome:** Customer can log in, see their calls and leads, edit their configuration, and view performance metrics.
