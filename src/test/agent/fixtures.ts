/**
 * Test fixtures for agent conversation evals.
 * Contains sample business data, caller personas, and composed test scenarios.
 */
import type { CallerPersona, ScrapedBusiness, TestScenario } from './types'

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export const ACME_ROOFING: ScrapedBusiness = {
  business_name: 'Acme Roofing Co.',
  business_name_pronunciation: 'Acme Roofing Co.',
  url: 'https://acmeroofing.com',
  scraped_content: `Acme Roofing Co. — Toronto's trusted roofing experts since 1998.

Services: roof inspections, roof repair, full roof replacement, gutter cleaning, emergency leak repair.
Service area: Toronto, Mississauga, Brampton, Vaughan, Markham.
Hours: Monday–Friday 8 AM – 6 PM, Saturday 9 AM – 2 PM, closed Sunday.
Phone: (416) 555-7890.

We offer free estimates for all residential and commercial roofing projects.
Emergency leak repair available 24/7 — call our main line.`,
}

export const BRIGHT_PLUMBING: ScrapedBusiness = {
  business_name: 'Bright Plumbing & Heating',
  business_name_pronunciation: 'Bright Plumbing and Heating',
  url: 'https://brightplumbing.ca',
  scraped_content: `Bright Plumbing & Heating — full-service plumbing for the GTA.

Services: drain cleaning, pipe repair, water heater installation, bathroom renovation plumbing, emergency plumbing.
Service area: Toronto, Etobicoke, Scarborough, North York.
Hours: Monday–Friday 7 AM – 7 PM, Saturday 8 AM – 4 PM.
Phone: (416) 555-2345.

Licensed and insured. Same-day service available for emergencies.`,
}

// ---------------------------------------------------------------------------
// Caller Personas
// ---------------------------------------------------------------------------

export const COOPERATIVE_LEAD: CallerPersona = {
  name: 'John Smith',
  phone: '416-555-1234',
  scenario:
    'I noticed some shingles missing after the last storm and I think there might be a leak starting. I want someone to come take a look.',
  info: {
    address: '123 Main Street, Toronto',
    service_type: 'roof inspection',
    urgency: 'medium',
  },
  style: 'cooperative',
}

export const COOPERATIVE_BOOKER: CallerPersona = {
  name: 'Sarah Johnson',
  phone: '647-555-9876',
  scenario:
    'I need a full roof replacement quote. My roof is about 20 years old and the inspector said it needs to be replaced. I want to book an estimate visit.',
  info: {
    address: '456 Oak Avenue, Mississauga',
    service_type: 'roof replacement',
    preferred_date: 'next Friday',
    preferred_time: '2 PM',
  },
  style: 'cooperative',
}

export const RAMBLING_CALLER: CallerPersona = {
  name: 'Mike Williams',
  phone: '905-555-4321',
  scenario:
    'My basement has been getting damp every time it rains, and my neighbour told me it could be the roof, or maybe the gutters, I dunno. Last year we had a similar thing and the guy who came just patched something.',
  info: {
    address: '789 Elm Drive, Brampton',
    service_type: 'roof inspection',
    urgency: 'medium',
  },
  style: 'rambling',
}

export const VAGUE_CALLER: CallerPersona = {
  name: 'Lisa Chen',
  phone: '416-555-6789',
  scenario:
    "There's something wrong with my roof, I'm not exactly sure what. I just noticed a stain on my ceiling.",
  info: {
    address: '321 Pine Road, Toronto',
    service_type: 'roof inspection',
  },
  style: 'vague',
}

export const EMERGENCY_CALLER: CallerPersona = {
  name: 'David Brown',
  phone: '416-555-0000',
  scenario:
    'Water is actively dripping through my ceiling right now! I need someone here as soon as possible, this is an emergency.',
  info: {
    address: '55 Water Street, Toronto',
    service_type: 'emergency leak repair',
    urgency: 'emergency',
  },
  style: 'impatient',
}

export const PRICING_ONLY_CALLER: CallerPersona = {
  name: 'Tom Davis',
  phone: '647-555-3333',
  scenario:
    "I'm just looking for a ballpark price on a roof replacement for a 1,500 sq ft bungalow. I'm not ready to book anything yet.",
  info: {
    service_type: 'roof replacement',
  },
  style: 'cooperative',
}

export const CORRECTION_CALLER: CallerPersona = {
  name: 'Maria Garcia',
  phone: '416-555-8888',
  scenario:
    'I need a roof inspection. When asked for my name, initially say "Maria Garza" then correct it to "Garcia" — G-A-R-C-I-A. When asked for my phone number, first say "416-555-8889" then correct it to "416-555-8888".',
  info: {
    address: '200 Queen Street, Toronto',
    service_type: 'roof inspection',
  },
  style: 'cooperative',
}

export const WRONG_SERVICE_CALLER: CallerPersona = {
  name: 'Amy Wilson',
  phone: '416-555-7777',
  scenario:
    "I need my driveway repaved. Do you guys do that? Also my fence needs fixing. And maybe some landscaping.",
  info: {},
  style: 'confused',
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export const LEAD_CAPTURE_COOPERATIVE: TestScenario = {
  name: 'Lead capture — cooperative caller',
  description: 'Caller with clear need provides info when asked. Agent should create_lead.',
  business: ACME_ROOFING,
  persona: COOPERATIVE_LEAD,
  maxTurns: 15,
  expectations: {
    tools_called: ['create_lead'],
    tool_args: {
      create_lead: {
        full_name: 'John Smith',
        phone: '416-555-1234',
      },
    },
    max_turns: 10,
  },
}

export const LEAD_CAPTURE_RAMBLING: TestScenario = {
  name: 'Lead capture — rambling caller',
  description: 'Caller who rambles. Agent should still extract info and create_lead.',
  business: ACME_ROOFING,
  persona: RAMBLING_CALLER,
  maxTurns: 18,
  expectations: {
    tools_called: ['create_lead'],
    tool_args: {
      create_lead: {
        full_name: 'Mike Williams',
      },
    },
    max_turns: 12,
  },
}

export const LEAD_CAPTURE_VAGUE: TestScenario = {
  name: 'Lead capture — vague caller',
  description: 'Caller with unclear needs. Agent should ask clarifying questions and still capture lead.',
  business: ACME_ROOFING,
  persona: VAGUE_CALLER,
  maxTurns: 18,
  expectations: {
    tools_called: ['create_lead'],
    tool_args: {
      create_lead: {
        full_name: 'Lisa Chen',
      },
    },
    max_turns: 12,
  },
}

export const APPOINTMENT_BOOKING: TestScenario = {
  name: 'Appointment booking — full flow',
  description: 'Caller wants to book an estimate. Agent should create_lead AND book_appointment.',
  business: ACME_ROOFING,
  persona: COOPERATIVE_BOOKER,
  maxTurns: 18,
  expectations: {
    tools_called: ['create_lead', 'book_appointment'],
    tool_args: {
      create_lead: {
        full_name: 'Sarah Johnson',
        phone: '647-555-9876',
      },
      book_appointment: {
        full_name: 'Sarah Johnson',
        address: '456 Oak Avenue',
      },
    },
    max_turns: 12,
  },
}

export const EMERGENCY_LEAD: TestScenario = {
  name: 'Emergency caller — urgent lead capture',
  description: 'Caller with active leak. Agent should capture lead with emergency urgency.',
  business: ACME_ROOFING,
  persona: EMERGENCY_CALLER,
  maxTurns: 15,
  expectations: {
    tools_called: ['create_lead'],
    tool_args: {
      create_lead: {
        full_name: 'David Brown',
      },
    },
    max_turns: 8,
  },
}

export const PRICING_INQUIRY: TestScenario = {
  name: 'Pricing inquiry — no booking',
  description:
    'Caller just wants pricing info. Agent should NOT make up prices, should still capture lead, should NOT book appointment.',
  business: ACME_ROOFING,
  persona: PRICING_ONLY_CALLER,
  maxTurns: 15,
  expectations: {
    tools_called: ['create_lead'],
    tools_not_called: ['book_appointment'],
    max_turns: 10,
  },
}

export const WRONG_SERVICE: TestScenario = {
  name: 'Wrong service — out of scope',
  description:
    'Caller asks for services the business does not offer. Agent should explain limitations and offer to take a message.',
  business: ACME_ROOFING,
  persona: WRONG_SERVICE_CALLER,
  maxTurns: 12,
  expectations: {
    tools_called: [],
    tools_not_called: ['book_appointment'],
    max_turns: 8,
  },
}

export const CORRECTION_FLOW: TestScenario = {
  name: 'Correction — caller fixes name and phone',
  description:
    'Caller gives wrong name/phone then corrects. Agent should use the corrected values in create_lead.',
  business: ACME_ROOFING,
  persona: CORRECTION_CALLER,
  maxTurns: 18,
  expectations: {
    tools_called: ['create_lead'],
    tool_args: {
      create_lead: {
        full_name: 'Maria Garcia',
        phone: '416-555-8888',
      },
    },
    max_turns: 12,
  },
}

export const DIFFERENT_BUSINESS: TestScenario = {
  name: 'Lead capture — different business context',
  description: 'Same cooperative flow but for a plumbing business. Verifies prompt adapts to business context.',
  business: BRIGHT_PLUMBING,
  persona: {
    ...COOPERATIVE_LEAD,
    scenario: 'My kitchen sink is backed up and the drain is really slow. I need someone to come fix it.',
    info: {
      ...COOPERATIVE_LEAD.info,
      service_type: 'drain cleaning',
    },
  },
  maxTurns: 15,
  expectations: {
    tools_called: ['create_lead'],
    tool_args: {
      create_lead: {
        full_name: 'John Smith',
        phone: '416-555-1234',
      },
    },
    max_turns: 10,
  },
}
