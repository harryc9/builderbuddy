# 416Permits — Development Roadmap

## Where We Are

416permits.com is a permit search tool: 300K+ Toronto-area building permits, daily updates, filterable by trade, cost, status, location, and builder name. It delivers 10-30 leads/week to subcontractors and saves them 4-6 hours of manual permit searching.

The builder name field is currently a dead end. Users can see "TARESA CONSTRUCTION" pulled a $1M permit but can't get a phone number, email, or website.

## Where We're Going

**416permits becomes a lead gen platform.** The core new feature is **builder enrichment** — turning raw builder names into actionable contact data (phone, website, email, company name).

Today: "Search 300K+ permits by trade, cost, and location"
Tomorrow: "Find who's building in your area — with their phone number and email"

## Who Wants This

- **Subcontractors** (electricians, plumbers, HVAC) — bid on projects before they start
- **Material suppliers** — sell to builders starting new projects
- **Equipment rental** — reach builders at the right time
- **Staffing (UBILD)** — find businesses that need temporary labourers
- **Insurance/bonding** — find active builders

UBILD is the first customer (dogfooding).

---

## The Enrichment Problem

The "Builder" field from City of Toronto permits is messy. Sampled ~100 recent permits (Permit Issued, Has Builder, Has Cost):

| Type | % | Example | Can We Enrich? |
|------|---|---------|----------------|
| Personal name | 62% | AZIZUR MOLLAH, GEORGINA MYERS | Mixed — many are homeowners, some are builders |
| Named company | 25% | TARESA CONSTRUCTION INC, ROYAL STAR BUILDERS INC | Yes |
| Numbered corp | 8% | 2825138 ONTARIO INC | Need to resolve to operating name first |
| Address-based corp | 3% | 111 NORTON AVENUE INC | Usually a single-property shell — skip |
| Estate/other | 1% | ESTATE OF BERTRAM WOODS... | Skip |

Only 25% are clean company names. The rest require classification work before enrichment.

---

## Development Plan

### Step 1: Builder Name Classifier

Classify every builder name into one of: `named_company`, `numbered_corp`, `address_corp`, `personal_name`, `estate`.

**Heuristics (covers ~90% of cases):**
- `/^\d{5,10}\s+(ONTARIO|CANADA)\s+(INC|LTD|CORP|LIMITED)/i` → numbered_corp
- `/^\d+\s+[A-Z]+.*\s+(AVE|ST|DR|RD|CRES|BLVD|CRT).*\s+(INC|LTD)/i` → address_corp
- `/^ESTATE\s+OF/i` → estate
- Contains INC, LTD, CORP, CONSTRUCTION, BUILDERS, HOMES, DEVELOPMENT, DESIGN, HOLDINGS, ENGINEERING → named_company
- Everything else → personal_name

**For personal names, sub-classify builder vs homeowner:**
- Same name on 2+ permits at different addresses → builder
- New construction / demolish+rebuild / multi-unit → likely developer
- $500K+ new construction → likely builder
- Single low-value addition/renovation → likely homeowner → skip

**AI fallback** for ambiguous cases: send name + permit description + cost to GPT with structured output.

**Deliverable:** Every permit row gets a `classification` column. Run on full dataset, measure distribution.

### Step 2: Google Maps Enrichment (Named Companies)

For every `named_company` builder, search Google Maps Places API:
- Query: `"{builder name}" construction Toronto`
- Extract: website, phone, address, Google Maps URL, rating, review count

This is the highest-ROI step. ~25% of permits, expected 60-70% match rate on those = ~15-18% of all permits get enriched with contact info in one step.

**Cost:** ~$0.032/search via Google Places Text Search API.

**Deliverable:** Enriched columns added to permit rows: `company_phone`, `company_website`, `company_address`, `google_maps_url`.

### Step 3: Numbered Corp Resolution

For `numbered_corp` builders (8% of permits), resolve to an operating name:
- Google search: `"{corp number} Ontario"` — often surfaces the operating name from corporate filings, news, or court records
- If operating name found → run through Step 2 (Google Maps enrichment)

**Later phase:** Build an Apify scraper for Ontario Business Registry (ServiceOntario) to automate lookups. No public API exists — requires web scraping.

**Deliverable:** Resolved numbered corps get fed back into Google Maps enrichment.

### Step 4: Personal Name Builder Enrichment

For personal names classified as likely builders (~15-20% of permits):
- Google search: `"{name}" builder OR construction Toronto`
- If a company is found → run through Step 2
- If no match → flag as `unenrichable` (acceptable — these are often sole proprietors with no web presence)

**Deliverable:** Some personal-name builders get resolved to companies and enriched. The rest are flagged.

### Step 5: Enrichment UI + CSV Export

Surface enrichment data in the 416permits UI:
- New columns on permit rows: company name, phone, website
- Filter: "Has Enrichment" toggle (like "Has Builder" and "Has Cost" today)
- CSV export with all enriched fields
- Badge or indicator showing enrichment status (enriched / unenrichable / pending)

**Deliverable:** Users can filter for enriched permits and download CSV with contact info.

### Step 6 (Optional): Deep Enrichment — Email via Amplemarket

For companies where we found a website/domain:
- Amplemarket People Search → find decision makers (Owner, CEO, Project Manager)
- Email reveal (1.5 credits/person)

This could be:
- A premium 416permits feature (user pays per enrichment)
- An internal UBILD-only step (not exposed to other 416permits users)

**Deliverable:** Contact person name + email added to enriched rows.

---

## Enrichment Pipeline Summary

```
Permit Row (status = "Permit Issued", has builder, has cost)
  │
  ├─ named_company (25%) ──► Google Maps ──► phone, website, address
  │
  ├─ numbered_corp (8%) ──► Google Search ──► resolve name ──► Google Maps
  │
  ├─ personal_name
  │    ├─ repeat builder (~15%) ──► Google Search ──► try to find company
  │    └─ likely homeowner (~47%) ──► SKIP
  │
  ├─ address_corp (3%) ──► SKIP
  │
  └─ estate (1%) ──► SKIP
  
  Result: ~40-45% of permits become enrichable
  Of those, ~60-70% successfully enriched = ~25-30% of all permits get contact info
```

---

## Data Model Changes

Add to the permits table (or a linked enrichment table):

| Column | Type | Description |
|--------|------|-------------|
| classification | text | named_company / numbered_corp / address_corp / personal_name / estate |
| is_likely_builder | boolean | For personal names: builder vs homeowner |
| enrichment_status | text | pending / enriched / unenrichable / skipped |
| resolved_company_name | text | For numbered corps / personal names that resolve to a company |
| company_phone | text | From Google Maps |
| company_website | text | From Google Maps |
| company_address | text | From Google Maps |
| google_maps_url | text | From Google Maps |
| google_maps_rating | numeric | From Google Maps |
| google_maps_reviews | integer | From Google Maps |
| contact_person | text | From Amplemarket (optional) |
| contact_email | text | From Amplemarket (optional) |
| enriched_at | timestamptz | When enrichment was last run |

---

## Open Decisions

1. **Should enrichment run automatically or on-demand?**
   - Auto: daily cron on new "Permit Issued" rows — hands-off, always fresh
   - On-demand: user clicks "Enrich" on a batch — more control, lower API costs
   - Hybrid: auto-classify all rows (free), auto-enrich named companies (cheap), manual trigger for deep enrichment (expensive)

2. **Is deep enrichment (email) a 416permits feature or UBILD-only?**
   - If 416permits feature → premium tier, credits-based pricing
   - If UBILD-only → keep Amplemarket integration internal, 416permits just outputs company + phone + website

3. **How to handle the 62% personal names?**
   - Aggressive: try to enrich all of them via Google search
   - Conservative: only enrich repeat builders (appear on 2+ permits)
   - Recommended: classify all, only enrich those with builder signals (repeat, high-value, new construction)

4. **Permit status scope?**
   - Start with "Permit Issued" only
   - Later consider "Inspection" (project already underway — even stronger signal but later in the cycle)
