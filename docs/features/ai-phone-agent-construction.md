# AI Phone Agent for Construction

**Last Updated:** Dec 9, 2025  
**Status:** Planning  
**Target ICP:** Subcontractors and General Contractors (same as 416Permits)

---

## PRODUCT

### Problem Statement

Construction subcontractors and general contractors are losing revenue from missed phone calls:

- **35-80% of incoming calls go unanswered** (industry average)
- **Responding within 1 minute increases conversions by 391%**
- Missed calls mean lost quotes, lost jobs, lost revenue
- Every missed call = potential $500-$5,000 job lost
- Small teams are on job sites, not answering phones

**Current solutions fail because:**
- Generic AI receptionists don't understand construction terminology
- Vapi/Bland are too technical for non-tech contractors
- Existing services ($200-300/month) are expensive for small operations
- Setup takes days, requires technical knowledge

### Value Proposition

**A construction-specific AI phone agent that answers like a real office admin.**

It handles:
1. Quote requests (collects job details, sends confirmation)
2. Availability inquiries (checks calendar, books site visits)
3. General questions (answers from custom knowledge base)
4. Emergency escalation (transfers to owner's cell immediately)

**Key differentiators:**
- **Non-tech setup:** 10-minute onboarding vs. days of Vapi configuration
- **Construction fluent:** Knows trades, materials, permits, safety requirements
- **Built by 416Permits team:** Credibility with construction audience
- **Subdomain:** `agent.416permits.com` (leverages existing domain authority)

### Target Customer

**Primary:** Specialty trade subcontractors (electricians, plumbers, HVAC, framers)
- 1-10 employees
- $500K-$3M annual revenue
- Receiving 20-100 calls/month
- Operating in GTA

**Secondary:** Small general contractors
- Managing 2-10 active projects
- Need to screen subcontractor inquiries
- Want to capture homeowner leads

**Existing 416Permits customers are perfect cross-sell:**
- Already paying for lead gen
- Already understand value of automation
- Already trust the brand

### Core Features (MVP)

**1. Inbound Call Answering (24/7)**
- Custom greeting with business name
- Natural conversation using Vapi + OpenAI
- Understands construction terminology

**2. Quote Request Handling**
- Collects: job type, location, timeline, budget range, contact info
- Sends SMS/email confirmation to caller
- Sends lead details to business owner via SMS/email
- Logs in dashboard

**3. Availability & Scheduling**
- Checks calendar availability (Google Calendar integration)
- Books site visit appointments
- Sends calendar invites to both parties
- Handles rescheduling requests

**4. Knowledge Base Q&A**
- Answers common questions from custom knowledge base:
  - Services offered
  - Typical pricing ranges
  - Service areas (postal codes)
  - Certifications/insurance
  - Typical project timelines

**5. Smart Escalation**
- Detects urgent keywords: "emergency," "leak," "no power," "safety issue"
- Transfers call to business owner's cell (Vapi call forwarding)
- Detects complex questions outside knowledge base scope
- Offers callback option if owner unavailable

**6. Call Transcripts & Logs**
- Full transcript of every call
- Dashboard showing all calls (date, duration, outcome, caller info)
- Export to CSV
- Analytics: call volume, peak hours, conversion rate

### Service Delivery (Optimized for Construction ICP)

**Standalone Product on Subdomain:**
- Domain: `agent.416permits.com`
- Leverages existing 416Permits domain authority and email warmup
- Separate branding, separate app, separate auth
- Can cross-promote to 416Permits customers, but products remain independent

**Landing Page Experience:**
1. **Hero:** "Never Miss a Call Again - AI Receptionist for Contractors"
2. **Live Demo Call Button:** "Call Now to Test It" → Instant demo with sample AI agent
   - Uses Vapi's web calling feature (no phone needed)
   - Shows real-time transcript as you talk
   - Demonstrates quote collection, scheduling, Q&A
   - 2-minute experience, zero friction
3. **Pricing:** Clear $99/$299 plans, no hidden fees
4. **Social Proof:** "Built by the team behind 416Permits" (credibility, not integration)
5. **CTA:** "Start Free Trial" → 7 days, 50 minutes, no credit card

**Onboarding Flow (10 minutes):**

**Step 1: Account Setup (2 min)**
- Email + password
- Select plan (Starter/Professional)
- Enter business name and type

**Step 2: Phone Number (2 min)**
- **Option A: Get New Number** (instant, recommended for trial)
  - Select area code (416, 647, 437, 905, etc.)
  - Number assigned immediately
  - Ready to use in 30 seconds
  
- **Option B: Port Existing Number** (5-15 business days)
  - Upload recent phone bill
  - Enter account number and PIN
  - We handle the rest with Twilio
  - Use temporary number during porting
  - One-time $25 fee

**Step 3: Business Info (3 min)**
- Services offered (pre-filled templates by trade)
- Service area (postal codes)
- Typical pricing ranges (optional, helps AI answer budget questions)
- Business hours (for "call back tomorrow" logic)

**Step 4: Integrations (2 min)**
- Connect Google Calendar (optional but recommended)
- Set forwarding number for emergencies
- SMS notification number (usually owner's cell)

**Step 5: Test Call (1 min)**
- Click "Call Test Number"
- Have conversation with your AI agent
- Verify greeting, knowledge base, escalation
- Adjust if needed

**Done! Number is live.**

**Daily Usage:**
1. Customer calls business number (new or ported)
2. AI agent answers 24/7, handles inquiry
3. Business owner receives SMS: 
   - "New quote request: Kitchen renovation, $15K budget, Etobicoke. [View Details]"
   - Or: "Emergency call transferred: Burst pipe, 123 Main St"
4. Owner reviews full transcript in dashboard at `agent.416permits.com/app`
5. Owner follows up via phone/email with qualified lead

**Billing:**
- Flat $99/month (Starter) or $299/month (Professional)
- Usage: $0.50/minute overage (Starter), $0.40/minute (Professional)
- Stripe subscription + usage-based billing (billed monthly in arrears)
- **7-day free trial** - 50 test minutes included, no credit card required

### Pricing Strategy

**Tier 1: Starter** - $99/month
- 1 phone number (new or ported)
- 100 minutes included (~20-25 calls/month)
- **$0.50/minute overage** (auto-charged monthly)
- All core features
- Google Calendar integration
- 1 user login
- Email/SMS notifications

**Tier 2: Professional** - $299/month
- 1 phone number (new or ported)
- 300 minutes included (~60-75 calls/month)
- **$0.40/minute overage** (auto-charged monthly)
- Priority support
- 5 user logins
- Custom branding on SMS/email
- Advanced analytics dashboard

**Add-ons:**
- Additional phone number: +$79/month
- Number porting service: $25 one-time fee

**Why this pricing works:**
- **Accessible entry point:** $99/month gets you started immediately
- **High-margin overage:** 65-70% margin on overage minutes funds growth
- **Simple, predictable:** Base plan + usage = easy to understand
- **ROI is obvious:** 1 captured quote ($2K-10K job) pays for 2-10 months
- Customers self-select into right tier based on call volume
- 100 minutes = small contractor (1-3 employees)
- 300 minutes = active contractor (4-10 employees, multiple crews)

### Go-to-Market Strategy

**Phase 1: Existing 416Permits customers (Weeks 1-4)**
- Email campaign to all active subscribers
- In-app banner: "Never miss a call again"
- Goal: 10 beta customers

**Phase 2: Cold outreach to warm leads (Weeks 5-8)**
- Target 416Permits churned users
- Target free trial users who didn't convert
- Pitch: "We know you need leads. Now never miss one."
- Goal: 20 additional customers

**Phase 3: Paid acquisition (Weeks 9-12)**
- Google Ads: "AI receptionist for contractors"
- Local SEO: "Toronto contractor phone answering service"
- Cold email to construction companies in GTA
- Goal: 20 additional customers

**Success metrics:**
- 40 customers (Starter) = $3,960 MRR (base)
- 10 customers (Professional) = $2,990 MRR (base)
- **Target: $10K MRR by Month 3** (50 customers)
  - Base MRR: $6,950
  - Overage revenue (avg 30% use overage @ 25 min/customer): $3,125
  - **Total MRR: $10,075**
  - **Gross profit: ~$7,000** (70% margin)

### Risk Mitigation

**Risk: Customer churns after realizing Vapi is cheaper directly**
- Mitigation: Emphasize setup complexity of Vapi, ongoing support, construction-specific templates, unified dashboard with 416Permits

**Risk: AI makes mistakes, loses customer business**
- Mitigation: Clear disclaimer, easy escalation path, call recording for quality review, 30-day money-back guarantee

**Risk: Twilio/Vapi costs increase**
- Mitigation: Usage-based pricing passes costs to customer, lock in Vapi pricing via enterprise plan

**Risk: Competitors copy within 3 months**
- Mitigation: Speed to market, leverage 416Permits brand, tight integration with existing product, construction-specific knowledge base is moat

---

## TECH

### Architecture Overview

**Tech Stack:**
- **Frontend:** Next.js 15 (same repo as 416Permits, different route groups)
- **Backend:** Supabase (same instance, separate schema or tables)
- **Billing:** Stripe (same account, different products)
- **Voice Infrastructure:** Vapi AI (orchestration) + Twilio (phone numbers)
- **LLM:** OpenAI GPT-4o via Vapi
- **Calendar:** Google Calendar API
- **SMS/Email:** Twilio + Resend (shared infrastructure)

**Key Infrastructure:**
- **Same repo, same Vercel project:** `/Users/hchoi/code/416permits`
- **Subdomain routing:** `agent.416permits.com` routes to agent features via middleware
- **Route groups:**
  - `src/app/(permits)/` - Existing 416Permits app
  - `src/app/(agent)/` - New phone agent app
- **Separate auth contexts:** Different Supabase auth flows, no SSO
- **Shared utilities:** Can reuse Stripe helpers, database client, types
- **Single deployment:** One Vercel deploy serves both subdomains

### Database Schema

**Add to existing Supabase instance:**

New tables in the same database (separate schema or prefix tables with `agent_` for clarity):

```sql
-- Phone agent configurations (one per customer phone number)
create table phone_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  phone_number text not null unique, -- Twilio number
  business_name text not null,
  business_type text not null, -- 'electrician', 'plumber', 'hvac', 'gc', etc.
  vapi_assistant_id text not null unique, -- Vapi assistant ID
  vapi_phone_number_id text not null unique, -- Vapi phone number ID
  knowledge_base jsonb default '{}', -- Custom Q&A pairs
  forwarding_number text, -- Owner's cell for escalation
  google_calendar_id text, -- Google Calendar ID
  greeting_message text, -- Custom greeting
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Call logs (one per inbound call)
create table phone_calls (
  id uuid primary key default gen_random_uuid(),
  phone_agent_id uuid references phone_agents(id) on delete cascade,
  vapi_call_id text not null unique, -- Vapi call ID
  caller_phone_number text,
  call_started_at timestamp with time zone not null,
  call_ended_at timestamp with time zone,
  duration_seconds integer, -- Billable duration
  transcript jsonb, -- Full conversation transcript from Vapi
  call_type text, -- 'quote_request', 'scheduling', 'question', 'escalated', 'other'
  outcome text, -- 'completed', 'transferred', 'voicemail', 'error'
  metadata jsonb default '{}', -- Extracted info (name, job details, etc.)
  cost_cents integer, -- Cost in cents (Vapi + Twilio)
  created_at timestamp with time zone default now()
);

-- Usage tracking for billing
create table phone_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  phone_agent_id uuid references phone_agents(id) on delete cascade,
  billing_period_start date not null,
  billing_period_end date not null,
  total_minutes integer default 0,
  total_calls integer default 0,
  included_minutes integer default 100, -- From subscription plan
  overage_minutes integer default 0,
  overage_cost_cents integer default 0, -- Overage cost in cents
  created_at timestamp with time zone default now(),
  unique(phone_agent_id, billing_period_start)
);

-- Stripe subscriptions (extend existing subscriptions table or add fields)
alter table subscriptions add column phone_agent_enabled boolean default false;
alter table subscriptions add column phone_plan_tier text; -- 'starter', 'professional'
```

**Indexes:**
```sql
create index idx_phone_agents_user_id on phone_agents(user_id);
create index idx_phone_calls_phone_agent_id on phone_calls(phone_agent_id);
create index idx_phone_calls_created_at on phone_calls(created_at);
create index idx_phone_usage_user_id on phone_usage(user_id);
create index idx_phone_usage_billing_period on phone_usage(billing_period_start, billing_period_end);
```

**RLS Policies:**
```sql
-- Users can only access their own phone agents
create policy "Users can view own phone agents"
  on phone_agents for select
  using (auth.uid() = user_id);

create policy "Users can update own phone agents"
  on phone_agents for update
  using (auth.uid() = user_id);

-- Users can only view their own call logs
create policy "Users can view own phone calls"
  on phone_calls for select
  using (
    phone_agent_id in (
      select id from phone_agents where user_id = auth.uid()
    )
  );
```

### Vapi Integration

**Setup flow:**

1. **Create Vapi Assistant** (per customer)
   - API: `POST https://api.vapi.ai/assistant`
   - Configure:
     - Model: `gpt-4o`
     - Voice: `en-US-Neural2-A` (professional male) or `en-US-Neural2-C` (professional female)
     - First message: Custom greeting
     - System prompt: Construction-specific instructions
     - Functions: `collectQuoteRequest`, `checkAvailability`, `bookAppointment`, `answerQuestion`, `escalateToHuman`
     - Knowledge base: Upload customer's services/pricing/FAQ

2. **Create Vapi Phone Number** (per customer)
   - API: `POST https://api.vapi.ai/phone-number`
   - Provider: Twilio
   - Link to assistant ID
   - Configure webhook: `https://416permits.com/api/vapi/webhook`

3. **Store configuration in database**
   - Save `vapi_assistant_id`, `vapi_phone_number_id`, `phone_number`

**System Prompt Template:**

```
You are a professional office administrator for {business_name}, a {business_type} company serving the Greater Toronto Area.

Your job is to:
1. Answer incoming calls professionally and warmly
2. Collect information for quote requests
3. Check availability and book appointments
4. Answer common questions using the knowledge base
5. Escalate urgent or complex issues to the business owner

IMPORTANT RULES:
- Always greet callers with: "{greeting_message}"
- Be concise and professional - you're representing a construction business
- For quote requests, always collect: job type, location, timeline, budget range, contact info
- For emergencies (leak, electrical issue, no heat/AC, safety concern), immediately offer to transfer to the owner
- If you don't know something, don't guess - offer to have someone call them back
- Confirm all appointment times and send calendar invite
- End every call by confirming the caller's contact info

KNOWLEDGE BASE:
{knowledge_base_content}

AVAILABLE FUNCTIONS:
- collectQuoteRequest: When caller requests a quote or pricing
- checkAvailability: When caller asks about availability
- bookAppointment: When booking a site visit or consultation
- answerQuestion: When answering a question from knowledge base
- escalateToHuman: When caller requests to speak to owner or has urgent issue
```

**Function Definitions:**

```json
{
  "functions": [
    {
      "name": "collectQuoteRequest",
      "description": "Collect information for a quote request",
      "parameters": {
        "type": "object",
        "properties": {
          "jobType": { "type": "string", "description": "Type of work needed" },
          "location": { "type": "string", "description": "Job location (address or neighborhood)" },
          "timeline": { "type": "string", "description": "When they need it done" },
          "budgetRange": { "type": "string", "description": "Approximate budget" },
          "contactName": { "type": "string", "description": "Caller's name" },
          "contactPhone": { "type": "string", "description": "Callback number" },
          "contactEmail": { "type": "string", "description": "Email address" },
          "additionalDetails": { "type": "string", "description": "Any other relevant details" }
        },
        "required": ["jobType", "contactName", "contactPhone"]
      }
    },
    {
      "name": "checkAvailability",
      "description": "Check calendar availability for site visit or consultation",
      "parameters": {
        "type": "object",
        "properties": {
          "preferredDate": { "type": "string", "description": "Preferred date in YYYY-MM-DD format" },
          "preferredTime": { "type": "string", "description": "Preferred time window (morning/afternoon/evening)" }
        }
      }
    },
    {
      "name": "bookAppointment",
      "description": "Book a site visit or consultation",
      "parameters": {
        "type": "object",
        "properties": {
          "dateTime": { "type": "string", "description": "Appointment datetime in ISO format" },
          "duration": { "type": "number", "description": "Duration in minutes (default 60)" },
          "location": { "type": "string", "description": "Site address" },
          "contactName": { "type": "string", "description": "Customer name" },
          "contactPhone": { "type": "string", "description": "Customer phone" },
          "contactEmail": { "type": "string", "description": "Customer email" },
          "notes": { "type": "string", "description": "Appointment notes" }
        },
        "required": ["dateTime", "location", "contactName", "contactPhone"]
      }
    },
    {
      "name": "escalateToHuman",
      "description": "Transfer call to business owner",
      "parameters": {
        "type": "object",
        "properties": {
          "reason": { "type": "string", "description": "Reason for escalation" },
          "isUrgent": { "type": "boolean", "description": "Is this an emergency?" }
        },
        "required": ["reason"]
      }
    }
  ]
}
```

**Webhook Handler:**

```typescript
// /api/vapi/webhook/route.ts
// Receives function calls from Vapi
// Executes actions (calendar booking, SMS, logging)
// Returns response to Vapi to relay to caller
```

### Google Calendar Integration

**OAuth Setup:**
- Google Cloud Console: Create OAuth 2.0 credentials
- Scopes: `https://www.googleapis.com/auth/calendar.events`
- Redirect URI: `https://416permits.com/api/google/callback`

**Flow:**
1. User clicks "Connect Google Calendar" in onboarding
2. Redirect to Google OAuth consent screen
3. User authorizes, receives auth code
4. Exchange auth code for access token + refresh token
5. Store refresh token in `phone_agents.google_calendar_id` (encrypted)

**Booking Logic:**
```typescript
// When Vapi calls bookAppointment function:
// 1. Validate dateTime is available (check Google Calendar)
// 2. Create event in Google Calendar
// 3. Send calendar invite to customer email
// 4. Send SMS confirmation to customer phone
// 5. Send notification to business owner
// 6. Return success message to Vapi
```

### Twilio Integration

**Phone Number Provisioning:**
- API: Twilio's Programmable Voice
- Search for available numbers in GTA area codes (416, 647, 437)
- Purchase number via API
- Configure webhook to forward to Vapi

**SMS Notifications:**
- Use Twilio SMS API to send notifications to business owner
- Template: "New quote request from {caller}. {jobType} in {location}. View details: {link}"

### Stripe Integration

**Subscription Plans:**

```typescript
// Create new Stripe products
const starterPlan = await stripe.products.create({
  name: 'Phone Agent - Starter',
  description: '1 phone number, 100 minutes included, $0.50/min overage',
});

const starterPrice = await stripe.prices.create({
  product: starterPlan.id,
  unit_amount: 9900, // $99.00
  currency: 'usd',
  recurring: { interval: 'month' },
});

// Create usage-based pricing for overage (Starter)
const starterOveragePrice = await stripe.prices.create({
  product: starterPlan.id,
  unit_amount: 50, // $0.50 per minute
  currency: 'usd',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
  },
});

const professionalPlan = await stripe.products.create({
  name: 'Phone Agent - Professional',
  description: '1 phone number, 300 minutes included, $0.40/min overage',
});

const professionalPrice = await stripe.prices.create({
  product: professionalPlan.id,
  unit_amount: 29900, // $299.00
  currency: 'usd',
  recurring: { interval: 'month' },
});

// Create usage-based pricing for overage (Professional)
const professionalOveragePrice = await stripe.prices.create({
  product: professionalPlan.id,
  unit_amount: 40, // $0.40 per minute
  currency: 'usd',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
  },
});
```

**Usage-Based Billing:**

```typescript
// Monthly cron job (or Stripe webhook after billing cycle):
// 1. Calculate total minutes used in billing period
// 2. Calculate overage (total_minutes - included_minutes)
// 3. If overage > 0, create usage record
// 4. Stripe will add overage charge to next invoice

const usageRecord = await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  {
    quantity: overageMinutes,
    timestamp: Math.floor(Date.now() / 1000),
  }
);
```

**Webhook Handling:**
- Extend existing `/api/stripe/webhooks/route.ts`
- Handle `invoice.payment_succeeded`, `subscription.updated`, `subscription.deleted`

### Subdomain Routing

**Middleware for subdomain-based routing:**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  // Route agent.416permits.com to /agent/* routes
  if (hostname.startsWith('agent.')) {
    // Rewrite to agent route group
    if (!url.pathname.startsWith('/agent')) {
      url.pathname = `/agent${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  // Main domain (416permits.com) continues to existing app
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Vercel domain configuration:**
```bash
# Add custom domain in Vercel dashboard
# Domains: 
# - 416permits.com (existing)
# - agent.416permits.com (new)

# Both point to same Vercel project
```

**DNS configuration:**
```
# Add A or CNAME record for agent subdomain
A     agent    76.76.21.21  (Vercel IP)
# OR
CNAME agent    cname.vercel-dns.com
```

---

### File Structure

**Organize code with Next.js route groups:**

```
src/
├── app/
│   ├── (permits)/                    # Existing 416Permits app
│   │   ├── layout.tsx                # Permits-specific layout
│   │   ├── page.tsx                  # Landing page (416permits.com)
│   │   ├── app/                      # Permits dashboard
│   │   │   ├── page.tsx
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── (agent)/                      # New phone agent app
│   │   ├── layout.tsx                # Agent-specific layout
│   │   ├── page.tsx                  # Landing page (agent.416permits.com)
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   └── app/                      # Agent dashboard
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── settings/
│   │       ├── calls/
│   │       │   └── [id]/
│   │       └── billing/
│   │
│   └── api/
│       ├── permits/                  # Existing permits APIs
│       ├── stripe/                   # Shared Stripe webhooks
│       ├── phone-agent/              # New agent APIs
│       │   ├── setup/
│       │   ├── [id]/
│       │   └── usage/
│       ├── vapi/
│       │   └── webhook/
│       └── google/
│           └── callback/
│
├── components/
│   ├── permits/                      # Existing permits components
│   ├── agent/                        # New agent components
│   │   ├── DemoWidget.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── CallLogTable.tsx
│   │   ├── CallTranscript.tsx
│   │   └── ...
│   └── ui/                           # Shared UI components (shadcn)
│
├── lib/
│   ├── supabase.ts                   # Shared Supabase client
│   ├── stripe.ts                     # Shared Stripe client
│   ├── vapi.ts                       # New Vapi client
│   ├── twilio.ts                     # New Twilio client
│   └── ...
│
└── types/
    ├── permits.ts
    ├── agent.ts                      # New agent types
    └── supabase.public.types.ts      # Generated from both schemas
```

**Route groups `(permits)` and `(agent)` don't appear in URLs:**
- `src/app/(agent)/page.tsx` → `agent.416permits.com/`
- `src/app/(agent)/app/page.tsx` → `agent.416permits.com/app`
- `src/app/(permits)/page.tsx` → `416permits.com/`

---

### API Endpoints

**New endpoints needed:**

```
# All APIs accessible from both subdomains
# Authentication determines access, not subdomain

POST   /api/phone-agent/setup           # Create new phone agent
GET    /api/phone-agent/list            # List user's phone agents
GET    /api/phone-agent/[id]            # Get phone agent details
PATCH  /api/phone-agent/[id]            # Update phone agent config
DELETE /api/phone-agent/[id]            # Delete phone agent (cancel subscription)

GET    /api/phone-agent/[id]/calls      # List calls for phone agent
GET    /api/phone-agent/call/[callId]   # Get call transcript + metadata

POST   /api/vapi/webhook                # Vapi webhook for function calls
POST   /api/google/callback             # Google OAuth callback

GET    /api/phone-agent/usage           # Get usage stats for billing period
```

### Frontend Components

**New pages/components in `src/app/(agent)/`:**

```
# Routes accessible at agent.416permits.com

(agent)/  page.tsx                              # Landing page with demo widget
pricing/
  page.tsx                              # Pricing page
onboarding/
  page.tsx                              # Onboarding flow (multi-step)
app/
  layout.tsx                            # Agent dashboard layout
  page.tsx                              # Dashboard (calls list, stats)
  settings/
    page.tsx                            # Phone agent settings
  calls/
    [id]/
      page.tsx                          # Call detail page (transcript)
  billing/
    page.tsx                            # Billing + usage page

Components (in src/components/agent/):
- DemoWidget.tsx                        # Landing page demo call widget
- OnboardingWizard.tsx                  # Multi-step onboarding wizard
- CallLogTable.tsx                      # Table of all calls
- CallTranscript.tsx                    # Formatted call transcript
- AgentSettings.tsx                     # Edit knowledge base, greeting, forwarding
- UsageChart.tsx                        # Minutes used chart
- BillingUsage.tsx                      # Monthly usage + invoices
```

### Landing Page Demo Call Implementation

**Technical approach for "Try It Now" demo:**

**Option 1: Vapi Web Widget (Recommended)**
```typescript
// Embed Vapi's web calling widget directly on landing page
// User clicks button → instant voice call in browser (no phone needed)

<VapiWidget
  assistantId="demo-assistant-id"
  buttonLabel="Call Our Demo Agent Now"
  showTranscript={true} // Shows real-time transcript
/>

// Features:
// - Zero setup for visitor (just click)
// - Works on desktop + mobile
// - Shows live transcript as you speak
// - Costs ~$0.10 per demo call
// - Can limit to 2-minute demo to control costs
```

**Option 2: Twilio Programmable Voice + Web SDK**
```typescript
// More complex but gives full control
// Visitor clicks → receives demo call on their phone

// Flow:
// 1. User enters phone number
// 2. Instant call from demo AI agent
// 3. 2-minute demo (quote request simulation)
// 4. Hangs up, shows "Sign up to get your own"
```

**Demo Script (pre-configured assistant):**
```
Demo AI: "Hi! Thanks for calling BuilderBuddy AI. This is a demo of how 
I can help your construction business. I'm here 24/7 to answer calls, 
take quote requests, and book appointments. Let's try a quick simulation - 
can you tell me what kind of work you need done?"

[User responds]

Demo AI: "Great! And where is the job located?"

[User responds]

Demo AI: "Perfect. When do you need this done by?"

[User responds]

Demo AI: "And what's your budget range for this project?"

[User responds]

Demo AI: "Excellent! I've collected all the details. Normally I would send 
you a confirmation text and email your business owner with these details. 
I can also check your calendar and book appointments, or answer questions 
about your services. Want to try your own AI agent? Sign up now at 
BuilderBuddy.com"

[Ends call]
```

**Cost control:**
- Limit demo to 2 minutes (auto-disconnect)
- Max 3 demos per IP per day
- Track conversion: demo → signup (should be >15%)

---

### Implementation Steps

**Step 0: Project Setup (Week 1)**
- Create route groups: `src/app/(agent)/` and reorganize existing code into `src/app/(permits)/`
- Create middleware for subdomain routing
- Add `agent.416permits.com` to Vercel domains
- Test: Visit `agent.416permits.com`, verify middleware routes correctly

**Step 1: Database + Basic API (Week 1)**
- Create database tables (`phone_agents`, `phone_calls`, `phone_usage`)
- Create RLS policies
- Create API endpoint: `POST /api/phone-agent/setup` (basic version, no Vapi yet)
- Test: Create phone agent record in database via API

**Step 2: Vapi Integration (Week 2)**
- Create Vapi account, get API key
- Implement Vapi assistant creation in `POST /api/phone-agent/setup`
- Implement Vapi phone number provisioning (Twilio)
- Create webhook handler: `POST /api/vapi/webhook`
- Test: Provision phone number, call it, verify webhook receives data

**Step 3: Function Calling - Quote Requests (Week 3)**
- Implement `collectQuoteRequest` function handler in webhook
- Store quote request in database (`phone_calls` table)
- Send SMS notification to business owner (Twilio SMS)
- Test: Call phone number, request quote, verify SMS received

**Step 4: Google Calendar Integration (Week 4)**
- Implement Google OAuth flow
- Implement `checkAvailability` function (query Google Calendar)
- Implement `bookAppointment` function (create Google Calendar event)
- Test: Call phone number, book appointment, verify calendar event created

**Step 5: Knowledge Base + Q&A (Week 5)**
- Implement knowledge base upload in onboarding
- Format knowledge base for Vapi assistant
- Test: Call phone number, ask question, verify correct answer

**Step 6: Escalation + Call Transfer (Week 6)**
- Implement `escalateToHuman` function (Vapi call forwarding)
- Configure Vapi to transfer call to forwarding number
- Test: Call phone number, request escalation, verify call transferred

**Step 7: Dashboard + Call Logs (Week 7)**
- Create `src/app/(agent)/app/page.tsx` dashboard
- Create `CallLogTable.tsx` component in `src/components/agent/`
- Create API endpoint: `GET /api/phone-agent/[id]/calls`
- Create `CallTranscript.tsx` component
- Test: View call logs at `agent.416permits.com/app`, view transcript

**Step 8: Onboarding Flow (Week 8)**
- Create `src/app/(agent)/onboarding/page.tsx`
- Create `OnboardingWizard.tsx` multi-step wizard in `src/components/agent/`
- Implement Google Calendar connection step
- Implement knowledge base upload step
- Implement test call step
- Test: Complete onboarding at `agent.416permits.com/onboarding`

**Step 9: Billing + Stripe Integration (Week 9)**
- Create Stripe products + prices (Starter, Professional)
- Create Stripe webhook handler for subscriptions
- Implement usage tracking (log minutes per call)
- Implement monthly usage aggregation cron
- Create usage-based billing records in Stripe
- Test: Subscribe to plan, make calls, verify usage billed correctly

**Step 10: Landing Page + Demo Widget (Week 10)**
- Create `src/app/(agent)/page.tsx` landing page
- Implement Vapi demo widget in `src/components/agent/DemoWidget.tsx`
- Copy: "Never miss a call again" messaging
- CTA: "Start Free Trial"
- Pricing table
- Test: Visit `agent.416permits.com`, demo call works, signup flow works

**Step 11: Cross-sell to 416Permits Users (Week 11)**
- Create email campaign targeting 416Permits customers
- Landing page: `agent.416permits.com?ref=permits` (special offer for existing customers)
- Track conversion rate via UTM parameters
- Test: Email → landing page → signup

**Step 12: Beta Testing + Iteration (Week 12)**
- Recruit 5-10 beta customers
- Monitor call quality, transcripts, errors
- Collect feedback on AI responses
- Iterate on system prompts, knowledge base templates
- Fix bugs, improve UX

### Cost Structure & Margins

**Per customer costs:**

**Vapi:**
- Startup plan: $800/month for 7,500 minutes (100 concurrent calls)
- At 50 customers using avg 120 min/month = 6,000 minutes total
- Effective cost per customer: $800 ÷ 50 = $16/month fixed
- Variable cost: ~$0.11/minute (API costs)

**Twilio:**
- Phone number: $1/month per number
- Inbound calls: $0.0085/minute
- SMS: $0.0075/message (avg 2-3 SMS per call = ~$0.02/call)
- **Total Twilio:** ~$1/month + $0.01/minute

**Total blended cost per minute at scale:** $0.17/minute

---

**Margins:**

**Starter plan ($99/month, 100 minutes included):**
- Revenue: $99
- Costs:
  - Vapi fixed: $16
  - Vapi variable: 100 × $0.11 = $11
  - Twilio fixed: $1
  - Twilio variable: 100 × $0.01 = $1
  - SMS: ~20 calls × $0.02 = $0.40
  - **Total: $29.40**
- **Gross profit: $69.60**
- **Gross margin: 70.4%** ✓

**Professional plan ($299/month, 300 minutes included):**
- Revenue: $299
- Costs:
  - Vapi fixed: $16
  - Vapi variable: 300 × $0.11 = $33
  - Twilio fixed: $1
  - Twilio variable: 300 × $0.01 = $3
  - SMS: ~60 calls × $0.02 = $1.20
  - **Total: $54.20**
- **Gross profit: $244.80**
- **Gross margin: 81.9%** ✓

**Overage minutes (key profit driver):**
- Cost: $0.17/minute
- Price (Starter): $0.50/minute
- **Margin: 66%** ✓
- Price (Professional): $0.40/minute
- **Margin: 57.5%** ✓

**Example customer revenue (Starter, 150 total minutes):**
- Base: $99
- Overage: 50 min × $0.50 = $25
- **Total revenue: $124**
- Total cost: $29.40 + (50 × $0.17) = $37.90
- **Gross profit: $86.10**
- **Effective margin: 69.4%** ✓

**Scaling economics:**
- At 50 customers: $800 Vapi ÷ 50 = $16/customer
- At 100 customers: Vapi Enterprise ~$2K/month ÷ 100 = $20/customer
- **Margins remain 70-85% at scale**
- Overage revenue scales with usage (no marginal marketing cost)

### Success Metrics

**Key Metrics to Track:**

1. **Activation Rate:** % of signups who complete onboarding
2. **Call Quality Score:** Average call duration, completion rate
3. **Escalation Rate:** % of calls that transfer to human
4. **Customer Churn:** % of customers who cancel within 3 months
5. **Usage Distribution:** Average minutes/customer/month
6. **Cross-sell Rate:** % of 416Permits customers who add phone agent
7. **Revenue Metrics:**
   - MRR (base subscriptions)
   - Usage revenue (overage minutes)
   - CAC (customer acquisition cost)
   - LTV (lifetime value)

**Target Benchmarks (Month 3):**
- 50 active phone agents (40 Starter, 10 Professional)
- $6,950 MRR (base) + $3,125 overage = **$10,075 total MRR**
- **~$7,000 gross profit** (70% blended margin)
- <10% churn rate
- >85% activation rate (onboarding completion within 24 hours)
- >4.5/5 customer satisfaction score
- Avg 120 minutes used per customer per month
- 30% of customers use overage minutes (key growth lever)

### Open Questions / Risks

**Technical Risks:**
- Vapi latency: Is call quality acceptable? (Test in beta)
- Google Calendar OAuth: Refresh token expiration handling
- Transcript accuracy: Does Vapi handle construction terminology well?
- Call transfer reliability: Does Vapi reliably forward calls to cell phones?

**Product Risks:**
- Is 15-minute onboarding realistic? (May need to simplify)
- Do customers actually use knowledge base, or just escalate everything?
- Is $99/month + usage too expensive for small contractors?

**Business Risks:**
- Can we scale to 100+ customers on Vapi Startup plan? (May need Enterprise)
- Will 416Permits customers want this, or is it too different?
- Can we support customers effectively (call quality issues, technical support)?

**Next Steps:**
1. Validate with 5-10 existing 416Permits customers (interview)
2. Build Step 1 (database + basic API)
3. Build Step 2 (Vapi integration)
4. Test with 1 real phone call
5. Iterate based on feedback

