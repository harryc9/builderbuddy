# Permit Category Badges - Job Role Categorization

**Goal:** Add job role badges to permits so contractors can subscribe to relevant trade opportunities

**Scope:** Categorize 2024-2025 permits (~44,712 permits) using LLM analysis

**Key Decisions:**
- ✅ Job categories only (trade roles, not project types or scales)
- ✅ Broad categories (50 job roles, not subdivided by residential/commercial)
- ✅ Replace `trade_keywords` with `subscribed_categories`
- ✅ Always send email (fallback to 3 interesting permits if no matches)
- ✅ All categories free tier (no premium gating)
- ✅ GPT-4o-mini model
- ✅ No confidence thresholds (assign all LLM suggestions)

---

## PRODUCT SECTION

### Problem Statement

**Current State:**
- Users subscribe to "trade keywords" (HVAC, Electrical, Plumbing, etc.) during onboarding
- Keywords are simple string matching in permit descriptions
- Limited granularity - users miss relevant permits or get too many irrelevant ones
- No standardized categorization across permits
- Users must manually filter through results

**Pain Points:**
1. **Too broad:** "HVAC" keyword catches everything from residential furnace replacements to massive commercial HVAC systems
2. **Too narrow:** Searching for "Plumbing" misses "drain" or "water service" permits
3. **No project size awareness:** Contractors get flooded with $1000 bathroom renovations when they want $500k+ commercial projects
4. **No structure type filtering:** Electrical contractors specializing in multi-family buildings see single-family permits

**What Users Actually Want:**
- "I only want multi-family residential projects over $100k"
- "Show me commercial HVAC retrofits, not residential furnace replacements"
- "I specialize in restaurant kitchens - give me commercial kitchen permits"
- "I need structural steel projects for high-rise construction"

### Solution: LLM-Powered Category Badges

**High-Level Approach:**
Add multiple category badges to each permit, derived from LLM analysis of:
- Description (primary signal)
- Permit type
- Structure type
- Estimated construction cost
- Current/proposed use

**Example Categorization:**

**Permit #1:**
```
Description: "HVAC - Proposal for interior alterations to existing restaurant including new commercial kitchen ventilation"
Permit Type: Mechanical(MS)
Structure Type: Restaurant
Cost: $75,000

Categories:
✅ Commercial - Restaurant
✅ HVAC - Commercial Kitchen
✅ Interior Alterations
✅ Cost Range: $50k-$100k
```

**Permit #2:**
```
Description: "Proposal to construct a new 42-storey mixed use building consisting of 412 residential units, 4 levels of below grade parking"
Permit Type: New Building
Structure Type: Mixed Use/Res w Non Res
Cost: $100,000,000

Categories:
✅ New Construction - High Rise
✅ Multi-Family Residential
✅ Mixed Use Development
✅ Underground Parking
✅ Cost Range: $50M+
```

### Job Role Categories (Complete List)

**Total: 50 Job Roles** (aligned with ICP: specialty trade contractors)

1. Architect / Designer
2. Civil Engineer / Technician
3. Concrete Worker
4. Construction Engineer
5. Construction Manager / Superintendent
6. Demolition Worker
7. Driver
8. Drywaller
9. Electrician
10. Environmental Technician
11. Equipment Mechanic
12. Estimator / Quantity Surveyor
13. Finish Carpenter
14. Fire Protection Technician
15. Flooring Installer
16. Foreman
17. Glazier / Window Installer
18. HVAC Technician
19. Handyman
20. Hazardous Materials Removal
21. Heavy Equipment Operator
22. Insulation Installer
23. Interior Systems Installer
24. Ironworker / Steel Erector
25. Labourer
26. Landscaper
27. Mason
28. Millworker
29. Other
30. Painter
31. Paving Worker
32. Pipefitter
33. Plasterer
34. Plumber
35. Project Coordinator
36. Project Manager
37. Quality Control Inspector
38. Roofer
39. Rough Carpenter
40. Safety Inspector / Officer
41. Scaffold Worker
42. Sheet Metal Worker
43. Siding / Cladding Installer
44. Site Services
45. Site Supervisor
46. Surveyor
47. Tilesetter
48. Traffic Control / Flagger
49. Waterproofing Specialist
50. Welder

**Design Principles:**
- ✅ Broad categories (not subdivided by residential/commercial/industrial)
- ✅ Based on actual construction job roles (aligned with ICP)
- ✅ Multiple categories per permit (most permits involve 3-8 trades)
- ✅ Simple, memorable names (no jargon)
- ✅ All categories free tier (no premium gating)

### User Experience Changes

#### Onboarding Flow (Revised)

**Step 1: Select Your Trade(s)** (multi-select, max 10)
```
What's your trade or specialty?

Popular:
☐ Electrician
☐ Plumber
☐ HVAC Technician
☐ Carpenter (Rough/Finish)
☐ Roofer

All Trades (alphabetical):
☐ Architect / Designer
☐ Civil Engineer / Technician
☐ Concrete Worker
☐ Construction Manager / Superintendent
☐ Demolition Worker
☐ Drywaller
☐ Electrician
☐ Fire Protection Technician
☐ Flooring Installer
☐ Glazier / Window Installer
☐ HVAC Technician
... (see full list above)

[Search trades...]
```

**Step 2: Service Areas** (postal codes)
```
Where do you work?
Enter postal code prefixes (e.g., M4B, M5H, M6G)

_________________

💡 Tip: Add multiple areas to see more opportunities
```

**Step 3: Optional Preferences**
```
Any other preferences? (optional)

Minimum project cost: [$0] [$25k] [$100k] [$500k] [No Minimum]

☐ Only show permits with builder info
☐ Only show permits with cost estimates

[Skip] [Save Preferences]
```

#### Daily Email Changes

**Current Email:**
```
Subject: 23 new permits matching "HVAC, Plumbing"

You have 23 new permits:
1. HVAC - Interior alterations to dwelling...
2. Plumbing - New restaurant kitchen...
3. HVAC - Proposal for 42-storey mixed use...
[All lumped together]
```

**New Email with Job Roles:**
```
Subject: 8 permits for Electrician, HVAC Technician - M4B, M5H

⚡ Your Daily Permit Digest - Nov 7, 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 ELECTRICIAN (3 permits)

1. Restaurant Renovation - $120,000
   📍 456 Queen St East, M4M
   🏷️ Electrician, Plumber, HVAC Technician
   🏗️ Builder: ABC Construction Ltd
   📅 Issued: Nov 7, 2024
   → View Details

2. Office Interior Alterations - $85,000
   📍 789 King St West, M5H
   🏷️ Electrician, Drywaller, Painter
   🏗️ Builder: XYZ Contractors
   📅 Issued: Nov 7, 2024
   → View Details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌡️ HVAC TECHNICIAN (5 permits)

3. 4-Unit Conversion - $550,000
   📍 789 Bloor St West, M6G
   🏷️ HVAC Technician, Plumber, Electrician, Rough Carpenter
   🏗️ Builder: Metro Renovations
   📅 Issued: Nov 6, 2024
   → View Details

...
```

**Fallback Email (No Matches):**
```
Subject: No exact matches today - 3 interesting permits near you

⚡ Your Daily Permit Digest - Nov 7, 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We didn't find permits matching your exact trades today,
but here are 3 interesting projects in your area:

1. Mixed-Use Development - $100M
   📍 123 Main St, M5H (1.2 km from you)
   🏷️ Electrician, Plumber, HVAC, Concrete Worker, Ironworker
   🏗️ Builder: Major Developments Corp
   💰 Large opportunity
   📅 Issued: Nov 7, 2024
   → View Details

2. Commercial Office Renovation - $2.5M
   📍 456 King St, M5J (2.5 km from you)
   🏷️ Electrician, HVAC Technician, Drywaller
   🏗️ Builder: Premium Contractors
   📅 Issued: Nov 6, 2024
   → View Details

3. Multi-Family Residential - $850K
   📍 789 Queen St, M4M (3.1 km from you)
   🏷️ Plumber, Electrician, Roofer
   🏗️ Builder: City Builders Inc
   📅 Issued: Nov 5, 2024
   → View Details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Want more results? Expand your service areas or trades in settings.
```

#### Dashboard UI Changes

**Permit Card with Job Role Badges:**
```
┌─────────────────────────────────────────┐
│ 123 King St West                        │
│ M5H 2J4 • Issued: Nov 7, 2024          │
│                                         │
│ [Electrician] [Plumber] [HVAC]          │
│ [Fire Protection] [Drywaller]           │
│                                         │
│ Proposed interior alterations to        │
│ existing restaurant including new...    │
│                                         │
│ 💰 $75,000 • 📋 Mechanical(MS)         │
│ 🏗️ Builder: ABC Construction           │
└─────────────────────────────────────────┘
```

**New Filter Panel:**
```
🔍 Filters

Job Roles (Your Trades)
☑ Electrician (156)
☑ HVAC Technician (89)
☐ Plumber (134)

All Trades
☐ Architect / Designer (23)
☐ Concrete Worker (45)
☐ Drywaller (67)
☐ Fire Protection (12)
☐ Flooring Installer (34)
☐ Glazier (18)
☐ Roofer (56)
... (collapsible)

Project Size
☐ Has cost estimate
☐ $0-$25k
☐ $25k-$100k
☑ $100k-$500k
☐ $500k+

Other
☐ Has builder info
☐ Issued this week
☐ Status: Approved
```

### Business Value

**For Users:**
1. **Higher Quality Matches:** Only see permits relevant to their specialty
2. **Faster Discovery:** Categories allow instant filtering
3. **Better Prioritization:** Focus on high-value projects
4. **Time Savings:** No need to read 100 descriptions to find 5 relevant permits

**For PermitPulse:**
1. **Higher Conversion:** Better matching = more value = higher trial-to-paid
2. **Lower Churn:** Users get value immediately, don't cancel
3. **Differentiation:** Competitors have keyword search; we have intelligent categorization
4. **Upsell Opportunities:** Premium categories (e.g., "Mega Projects $5M+")
5. **Data Moat:** LLM-categorized permits = proprietary dataset

**Success Metrics:**
- **Email Open Rate:** 40% → 60%+ (more relevant = more opens)
- **Dashboard Engagement:** 3 logins/week → 5+ logins/week
- **Time to First Export:** 10 min → 2 min
- **Trial-to-Paid Conversion:** 25% → 40%+
- **User Satisfaction:** "Do you find permits relevant?" - 60% → 90%+

---

## TECH SECTION

### Database Schema

**Add new table: `permit_job_roles`** (many-to-many: permits → job roles)

```sql
CREATE TABLE permit_job_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  job_role_slug VARCHAR NOT NULL, -- 'electrician', 'plumber', 'hvac-technician'
  
  -- LLM metadata (optional, for debugging)
  llm_model VARCHAR, -- 'gpt-4o-mini'
  llm_reasoning TEXT, -- Why this role was assigned
  
  -- Timestamps
  categorized_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(permit_id, job_role_slug)
);

-- Indexes for fast filtering
CREATE INDEX idx_permit_job_roles_permit_id ON permit_job_roles(permit_id);
CREATE INDEX idx_permit_job_roles_job_role_slug ON permit_job_roles(job_role_slug);

-- Composite index for common query pattern (filter by multiple roles)
CREATE INDEX idx_permit_job_roles_slug_permit ON permit_job_roles(job_role_slug, permit_id);
```

**Add new table: `job_role_definitions`** (master list of 50 job roles)

```sql
CREATE TABLE job_role_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Job role metadata
  job_role_name VARCHAR NOT NULL, -- 'Electrician', 'Plumber', 'HVAC Technician'
  job_role_slug VARCHAR NOT NULL UNIQUE, -- 'electrician', 'plumber', 'hvac-technician'
  description TEXT, -- What this role does
  
  -- Display metadata
  display_order INTEGER, -- For UI sorting (popular trades first)
  icon_name VARCHAR, -- Lucide icon name
  color_hex VARCHAR(7), -- Badge color (#3B82F6)
  
  -- Matching keywords (for LLM context and rule-based fallback)
  keywords JSONB, -- ["hvac", "heating", "ventilation", "air conditioning", "furnace", "ac"]
  
  -- Active status
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE, -- Show in "Popular" section during onboarding
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_role_definitions_slug ON job_role_definitions(job_role_slug);
CREATE INDEX idx_job_role_definitions_popular ON job_role_definitions(is_popular);
CREATE INDEX idx_job_role_definitions_keywords ON job_role_definitions USING GIN(keywords);
```

**Update `users` table:**

```sql
-- Replace trade_keywords with subscribed_job_roles
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribed_job_roles TEXT[]; -- Array of job_role_slug values

-- Keep service_areas as-is
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_areas TEXT[]; -- postal code prefixes (already exists)

-- Add optional preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS min_project_cost NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS only_with_builder BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS only_with_cost BOOLEAN DEFAULT FALSE;

-- Drop old column (after migration)
-- ALTER TABLE users DROP COLUMN trade_keywords;
```

### LLM Categorization Strategy

**Option 1: Batch Processing (Recommended for MVP)**

**Pros:**
- Cost-efficient (batch API discounts)
- Parallel processing (fast)
- Can use cheaper models (GPT-4o-mini, Claude Haiku)
- Easy to retry failures
- Can audit/review before committing

**Cons:**
- Not real-time
- Need to re-run for new permits

**Implementation:**
1. Export 44,712 permits (2024-2025) to JSONL file
2. Send to OpenAI/Anthropic Batch API
3. Parse results, insert into `permit_categories`
4. Cost: ~$0.001 per permit = $45-90 total

**Option 2: Real-Time Categorization**

**Pros:**
- Works for new permits automatically
- Always up-to-date
- Can integrate into ingestion pipeline

**Cons:**
- More expensive (no batch discount)
- Slower (sequential processing)
- Need to handle rate limits

**Hybrid Approach (Best):**
1. **Batch process 2024-2025 permits** (one-time, historical data)
2. **Real-time categorization** for daily ingestion (new permits)

### LLM Prompt Design

**System Prompt:**

```
You are an expert construction permit analyst. Your job is to identify which construction job roles/trades would be interested in a building permit.

You will be given a permit with:
- Description (most important signal)
- Permit type
- Structure type
- Estimated cost

Your task: Assign relevant job role slugs from the provided list.

Rules:
- Assign 2-10 job roles per permit (realistic set of trades needed)
- Focus on what trades would actually work on this project
- Description is the primary signal (e.g., "HVAC" in description → hvac-technician)
- Consider ALL trades mentioned or implied (direct and indirect)
- Include supporting trades (e.g., electrician for HVAC work, drywaller for renovation)
- No confidence scores needed - assign all relevant roles

Examples:
- "HVAC installation" → hvac-technician, electrician (power), sheet-metal-worker
- "Restaurant renovation" → electrician, plumber, hvac-technician, drywaller, painter, flooring-installer
- "New 3-storey building" → rough-carpenter, concrete-worker, electrician, plumber, hvac-technician, roofer, insulation-installer, drywaller, finish-carpenter, painter, flooring-installer
- "Backwater valve install" → plumber
```

**User Prompt Template:**

```
Identify job roles for this permit:

DESCRIPTION: {description}
PERMIT TYPE: {permit_type}
STRUCTURE TYPE: {structure_type}
ESTIMATED COST: {est_const_cost || 'Not specified'}

Valid job role slugs:
{job_role_slugs_json}

Return JSON array of slugs only:
{
  "job_roles": ["electrician", "plumber", "hvac-technician", ...]
}
```

**Example Input:**

```json
{
  "description": "HVAC - Proposal for interior alterations to existing restaurant including new commercial kitchen ventilation system and makeup air",
  "permit_type": "Mechanical(MS)",
  "structure_type": "Restaurant 30 Seats or Less",
  "est_const_cost": 75000
}
```

**Example LLM Response:**

```json
{
  "job_roles": [
    "hvac-technician",
    "sheet-metal-worker",
    "electrician",
    "fire-protection-technician",
    "drywaller",
    "painter"
  ]
}
```

**Reasoning (not included in response, but LLM considers):**
- `hvac-technician`: Primary - commercial kitchen ventilation and makeup air
- `sheet-metal-worker`: Ductwork fabrication/installation
- `electrician`: Power for HVAC equipment and kitchen appliances
- `fire-protection-technician`: Kitchen hood fire suppression system
- `drywaller`: Interior alterations, patching walls for ductwork
- `painter`: Finishing after drywall work

### Model Selection

**Selected: OpenAI GPT-4o-mini** ✅
- Cost: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- Speed: Fast batch processing
- Quality: Good for structured categorization
- Estimated cost: ~$45-90 for 44k permits

**Cost Breakdown:**
- Input: ~300 tokens/permit (description + context + job roles list)
- Output: ~50 tokens/permit (JSON array of 5 job roles)
- Total: 350 tokens × 44,712 permits = 15.6M tokens
- Input cost: 15M input × $0.075/1M = $1.13
- Output cost: 2.2M output × $0.30/1M = $0.66
- **Total: ~$2-3 for full batch**

**No confidence thresholds:** Assign all job roles LLM suggests (simpler, more inclusive)

### Implementation Steps

---

## STEP 1: DEFINE JOB ROLE TAXONOMY

**Goal:** Create master list of 50 job roles

**Tasks:**
1. Create `job_role_definitions` seed data (50 roles)
2. Assign display_order (popular trades first: electrician, plumber, hvac-technician, carpenter, roofer)
3. Write keywords/synonyms for each role (for LLM context)
4. Assign icons (Lucide React icons)
5. Assign badge colors (hex codes)
6. Mark popular roles (top 10-15 for onboarding UI)
7. Insert into database

**Deliverables:**
- SQL migration with `job_role_definitions` seed data
- TypeScript types for job roles
- Documentation: job role descriptions

**Job Role Slug Conventions:**
- Use kebab-case: `hvac-technician`, `finish-carpenter`, `fire-protection-technician`
- Be specific: `rough-carpenter` vs `finish-carpenter`
- Avoid abbreviations: `hvac-technician` (not `hvac-tech`)

---

## STEP 2: DATABASE SCHEMA MIGRATION

**Goal:** Add tables and columns for categories

**Tasks:**
1. Create `permit_categories` table
2. Create `category_definitions` table
3. Add `subscribed_categories` to `users` table
4. Add `min_project_cost`, `max_project_cost` to `users` table
5. Create all indexes
6. Test schema with sample data

**Migration Script:**
```sql
-- See schema above
-- Run as Supabase migration
```

**Rollback Plan:**
- Keep `trade_keywords` column (don't drop yet)
- Can revert subscribed_categories → trade_keywords if needed

---

## STEP 3: LLM CATEGORIZATION SCRIPT

**Goal:** Build script to categorize permits using LLM

**Components:**

**A. Data Preparation Script**
```typescript
// scripts/prepare-permits-for-categorization.ts
// 1. Query permits from 2024-2025
// 2. Format as JSONL for batch API
// 3. Include permit metadata (id, description, type, etc.)
// 4. Export to file
```

**B. LLM Batch API Integration**
```typescript
// scripts/categorize-permits-batch.ts
// 1. Read category_definitions from database
// 2. Build prompt template
// 3. Send JSONL to OpenAI Batch API
// 4. Poll for completion
// 5. Download results
```

**C. Results Import Script**
```typescript
// scripts/import-categorization-results.ts
// 1. Parse batch API response
// 2. Validate category_slug values (exist in category_definitions)
// 3. Filter by confidence threshold (e.g., >= 0.70)
// 4. Insert into permit_categories
// 5. Log statistics (success rate, avg confidence, etc.)
```

**D. Validation/Audit Script**
```typescript
// scripts/audit-categorization.ts
// 1. Sample 100 random permits
// 2. Display description + assigned categories
// 3. Flag low-confidence assignments
// 4. Export for manual review
```

**Testing Strategy:**
1. Start with 100 permits (test prompt quality)
2. Manual review + iterate on prompt
3. Scale to 1,000 permits (test accuracy)
4. Measure precision/recall with labeled sample
5. Run full 44k permits batch

**Cost Control:**
- Use GPT-4o-mini for initial testing
- Set max_tokens limit (200 tokens per response)
- Cache category definitions (don't send every time)
- Monitor spend in OpenAI dashboard

---

## STEP 4: UPDATE ONBOARDING FLOW

**Goal:** Replace trade keywords with category subscriptions

**UI Changes:**

**A. Create Category Selection Component**
```tsx
// src/components/onboarding/CategorySelector.tsx
// Multi-select UI with grouped categories
// Trade categories (primary)
// Structure type categories
// Special categories
// Project scale slider/dropdown
```

**B. Update Onboarding Page**
```tsx
// src/app/onboarding/page.tsx
// Step 1: Select categories
// Step 2: Project scale preferences (min/max cost)
// Step 3: Service areas (postal codes)
// Save to users.subscribed_categories
```

**C. Update User Profile/Settings**
```tsx
// src/app/settings/page.tsx
// Allow users to update category subscriptions
// Show "Popular categories" suggestions
// Show "Your categories" with edit button
```

**Data Migration:**
For existing users with `trade_keywords`:
```sql
-- Map old keywords to new categories
-- 'HVAC' → ['hvac-residential', 'hvac-commercial']
-- 'Electrical' → ['electrical-residential', 'electrical-commercial']
-- 'Plumbing' → ['plumbing-residential', 'plumbing-commercial']
```

---

## STEP 5: UPDATE DAILY EMAIL MATCHING

**Goal:** Match permits to users based on subscribed job roles

**Current Logic:**
```typescript
// Match by trade_keywords (simple string search in description)
if (user.trade_keywords.some(kw => permit.description.includes(kw))) {
  // Include permit
}
```

**New Logic with Fallback:**
```typescript
// 1. Try to match by subscribed_job_roles
let permits = await supabase
  .from('permits')
  .select(`
    *,
    permit_job_roles!inner(job_role_slug)
  `)
  .in('permit_job_roles.job_role_slug', user.subscribed_job_roles)
  .overlaps('postal', user.service_areas) // postal code prefix match
  .gte('est_const_cost', user.min_project_cost || 0)
  .gte('issued_date', yesterday)
  .order('issued_date', { ascending: false })
  .limit(20)

// 2. If no matches (permits.length === 0), send 3 interesting permits
if (permits.length === 0) {
  permits = await supabase
    .from('permits')
    .select('*')
    .gte('issued_date', yesterday)
    .order('est_const_cost', { ascending: false, nullsLast: true }) // high-value first
    .not('builder_name', 'is', null) // has builder
    .not('est_const_cost', 'is', null) // has cost
    .overlaps('postal', user.service_areas) // if service_areas exists
    .limit(3)
  
  // Flag as "fallback" in email template
  emailType = 'fallback'
}

// 3. Group permits by job role (for email sections)
const groupedByRole = groupBy(permits, (p) => p.permit_job_roles[0].job_role_slug)
```

**Email Template Logic:**
- **If matches:** Group by job role, show subscribed roles first
- **If no matches:** Show "No exact matches" + 3 interesting permits (high cost, has builder, nearby)

**Performance:**
- Index on `permit_job_roles(job_role_slug, permit_id)` ensures fast lookup
- Consider materialized view for daily digest (precompute overnight)

---

## STEP 6: UPDATE DASHBOARD FILTERS

**Goal:** Add category-based filtering to dashboard

**UI Changes:**

**A. Filter Panel**
```tsx
// src/components/permits/PermitsTableFilters.tsx
// Replace keyword search with category multi-select
// Group by category_type
// Show count next to each category
// Collapsible sections
```

**B. Permit Cards**
```tsx
// src/components/permits/PermitCard.tsx
// Display category badges
// Color-coded by category type
// Clickable (filter by category)
```

**C. Search API Update**
```typescript
// src/app/api/permits/search/route.ts
// Add category_slugs[] parameter
// JOIN with permit_categories
// Filter by category_slugs
```

**Performance Optimization:**
- Precompute category counts (cache in Redis or materialized view)
- Paginate results (20-50 per page)
- Use Supabase RLS to restrict access (auth)

---

## STEP 7: REAL-TIME CATEGORIZATION (FUTURE)

**Goal:** Automatically categorize new permits during daily ingestion

**Integration Point:**
```typescript
// scripts/ingest-permits.ts (existing)
// After inserting permits into database:
// 1. Send permit to LLM API (real-time)
// 2. Get categories
// 3. Insert into permit_categories
// 4. Continue with ingestion
```

**Rate Limiting:**
- OpenAI: 500 requests/min (Tier 1)
- Use queue (BullMQ, Inngest) for async processing
- Fallback to batch API for bulk (daily) ingestion

**Cost:**
- ~10-50 new permits per day (Toronto)
- Cost: ~$0.001 per permit = $0.01-$0.05 per day = $0.30-$1.50/month
- Negligible compared to $29/month subscription

**Future Optimization:**
- Build fine-tuned classifier (cheaper, faster)
- Use rule-based system for obvious cases (e.g., permit_type = 'Plumbing(PS)' → 'plumbing')
- LLM only for ambiguous cases

---

## EDGE CASES & CONSIDERATIONS

### 1. ~~Low-Confidence Categories~~ (N/A - no confidence thresholds)

**Decision:** Assign all job roles LLM suggests (no confidence filtering)
**Reasoning:** Simpler, more inclusive, avoids false negatives

### 2. Missing/Null Descriptions

**Problem:** ~15% of permits have null/empty descriptions
**Solution:**
- Use permit_type + structure_type only
- Assign generic categories (e.g., "Plumbing(PS)" → "plumbing-residential")
- Mark with `confidence_score = 0.50` to indicate fallback

### 3. Multi-Language Descriptions

**Problem:** Some descriptions in French or other languages
**Solution:**
- LLM handles multi-language well (GPT-4o, Claude)
- Explicitly mention in prompt: "Handle French/English descriptions"

### 4. Ambiguous Descriptions

**Example:** "Interior alterations to existing building"
**Problem:** Too vague - could be HVAC, plumbing, electrical, etc.
**Solution:**
- Assign multiple generic categories ("Interior Alterations", "Renovation")
- Don't over-specify (avoid false positives)
- Rely on permit_type + structure_type for additional context

### 5. Category Drift Over Time

**Problem:** New construction trends emerge (e.g., EV charging, heat pumps)
**Solution:**
- Periodically review uncategorized permits (confidence < 0.70)
- Add new categories to `category_definitions`
- Re-categorize permits with new categories (batch)

### 6. User Over-Subscription

**Problem:** User selects 20+ job roles → email has 100+ permits
**Solution:**
- Limit to 10 job roles during onboarding (UI enforced)
- Cap email at 20 permits (show "View 47 more in dashboard" link)
- Prioritize: high cost, has builder, most recent

### 7. Zero Permits Matched ✅ SOLVED

**Problem:** User's job role combo + service area has no matches
**Solution:** Always send email with 3 interesting permits (fallback)
- Criteria: High cost, has builder, has cost estimate, nearby (if service_areas set)
- Email template: "No exact matches today - 3 interesting projects near you"
- CTA: "Expand your service areas or trades in settings"

### 8. Job Role Overlap

**Example:** User subscribed to both "Rough Carpenter" and "Finish Carpenter"
**Solution:**
- Allow overlap (it's okay!)
- UI: Show all relevant job role badges
- Matching: User subscribed to ANY matching role → permit is included (OR logic)
- Deduplication: Same permit doesn't appear twice in email

### 9. Historical Permits (Pre-2024) ✅ DEFERRED

**Decision:** Only categorize 2024-2025 permits (~44k permits, ~$3 cost)
**Reasoning:** Focus on recent, relevant permits
**Future:** Batch categorize older permits if users request (276k permits = $10-15 cost)

### 10. LLM Hallucination

**Problem:** LLM assigns non-existent job_role_slug
**Solution:**
- Provide valid job_role_slugs in prompt (constrain output)
- Validate against `job_role_definitions` before inserting
- Reject invalid slugs (log for review, don't insert)
- Use JSON schema validation (OpenAI structured outputs)

---

## ANALYTICS & MONITORING

### Categorization Quality Metrics

Track in database:
```sql
-- Job role distribution (which roles are most common?)
SELECT 
  jr.job_role_name,
  COUNT(*) as permit_count
FROM permit_job_roles pjr
JOIN job_role_definitions jr ON jr.job_role_slug = pjr.job_role_slug
GROUP BY jr.job_role_name
ORDER BY permit_count DESC;

-- Avg job roles per permit
SELECT AVG(role_count) 
FROM (
  SELECT permit_id, COUNT(*) as role_count
  FROM permit_job_roles
  GROUP BY permit_id
) subq;

-- Permits with no job roles assigned
SELECT COUNT(*) 
FROM permits 
WHERE issued_date >= '2024-01-01'
  AND id NOT IN (SELECT permit_id FROM permit_job_roles);

-- Most common job role combinations
SELECT 
  ARRAY_AGG(job_role_slug ORDER BY job_role_slug) as role_combo,
  COUNT(*) as count
FROM permit_job_roles
GROUP BY permit_id
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;
```

### User Engagement Metrics

Track in app analytics:
- **Job role selection rate:** % of users who select job roles during onboarding
- **Avg job roles per user:** How many roles do users subscribe to?
- **Email open rate by job role:** Which roles drive highest engagement?
- **Job role filter usage:** Which roles are most filtered in dashboard?
- **Fallback email rate:** % of daily emails using fallback (no matches)

### Business Metrics

- **Permits matched per user per day:** Are users getting enough results?
- **Zero-match rate:** % of users with no matches (bad experience)
- **Over-match rate:** % of users with >50 matches (too many)
- **Trial conversion by category:** Which categories convert best?

---

## ROLLOUT PLAN

### Phase 1: Foundation (Week 1)
1. ✅ Define category taxonomy (50-100 categories)
2. ✅ Create database schema
3. ✅ Populate `category_definitions` table
4. ✅ Test schema with sample data

### Phase 2: Categorization (Week 2)
5. ✅ Build LLM categorization script
6. ✅ Test on 100 permits → iterate prompt
7. ✅ Test on 1,000 permits → validate quality
8. ✅ Run full batch (44k permits)
9. ✅ Audit results (sample 500 for manual review)

### Phase 3: User Experience (Week 3)
10. ✅ Update onboarding flow (category selector)
11. ✅ Migrate existing users (trade_keywords → subscribed_categories)
12. ✅ Update daily email matching logic
13. ✅ Update email template (grouped by category)

### Phase 4: Dashboard (Week 4)
14. ✅ Add category badges to permit cards
15. ✅ Build category filter panel
16. ✅ Update search API (category filtering)
17. ✅ Test performance (query speed, UX)

### Phase 5: Polish & Launch (Week 5)
18. ✅ Real-time categorization for new permits
19. ✅ Analytics dashboards (categorization quality)
20. ✅ User feedback loop (report incorrect categories)
21. ✅ Documentation for users (category guide)

---

## COST ESTIMATE

### One-Time Costs (Historical Categorization)

**LLM API Costs:**
- 44,712 permits × 350 tokens/permit = 15.6M tokens
- Input: $0.075 per 1M tokens = $1.13
- Output: $0.30 per 1M tokens = $0.66
- **Total: $2-3** (GPT-4o-mini batch API)

**Development Time:**
- 40 hours × $100/hr = **$4,000** (if outsourced)
- OR in-house time (2 weeks sprint)

**Total One-Time:** **$5-10** (LLM) + dev time

### Ongoing Costs (Monthly)

**Real-Time Categorization:**
- 30 days × 30 permits/day × $0.0001/permit = **$0.09/month**

**Storage:**
- permit_job_roles table: 44k permits × 5 roles/permit × 200 bytes = **44 MB**
- Negligible cost (Supabase free tier = 500 MB)

**Total Ongoing:** **$0.10/month** (negligible)

### ROI Estimate

**Assumptions:**
- Current trial-to-paid: 25%
- Target trial-to-paid: 40% (with better matching)
- 100 trial signups/month
- $29/month subscription

**Revenue Impact:**
- Current: 100 trials × 25% = 25 paid × $29 = **$725/month**
- Target: 100 trials × 40% = 40 paid × $29 = **$1,160/month**
- **Lift: $435/month** (+60% revenue)

**Payback Period:**
- One-time cost: $5 (LLM only)
- Monthly lift: $435
- Payback: **<1 day**

**Annual Impact:**
- $435/month × 12 = **$5,220/year** additional revenue
- ROI: $5,220 / $5 = **1,044x** in year 1 🚀

---

## CLARIFYING QUESTIONS

## ✅ ALL QUESTIONS ANSWERED

### Product Decisions ✅

1. **Job Role Selection:** ✅ Users select during onboarding (manual selection)
2. **Granularity:** ✅ Broad (50 job roles, not subdivided)
3. **Email Grouping:** ✅ Group by job role
4. **Zero Matches:** ✅ Always send email (fallback to 3 interesting permits)
5. **Job Role Limits:** ✅ Max 10 job roles during onboarding
6. **Freemium Strategy:** ✅ All job roles free tier (no premium gating)

### Technical Decisions ✅

1. **LLM Model:** ✅ GPT-4o-mini
2. **Real-Time Categorization:** ✅ Batch historical + real-time for new permits
3. **Confidence Threshold:** ✅ None - assign all LLM suggestions
4. **Fallback Strategy:** ✅ Queue for retry (use BullMQ or Inngest)
5. **Historical Permits:** ✅ 2024-2025 only (44k permits, ~$3 cost)
6. **Job Role Hierarchy:** ✅ Flat structure (no parent-child)
7. **Denormalization:** ✅ Normalized (separate table, JOIN at query time)

### Data Quality Decisions ✅

1. **Manual Review:** ✅ Audit sample of 100 permits after initial batch
2. **User Feedback:** ⏳ Future enhancement (report incorrect job role)
3. **Re-Categorization:** ⏳ As needed (when new job roles added)
4. **Audit Trail:** ✅ Keep created_at timestamp, no versioning

---

## SUCCESS CRITERIA

### Launch Readiness

- [ ] 44,712 permits categorized (2024-2025)
- [ ] Average confidence score ≥ 0.75
- [ ] <5% of permits with zero categories
- [ ] Manual audit: ≥90% accuracy (sample of 100)
- [ ] Onboarding flow updated
- [ ] Daily email matching works
- [ ] Dashboard filters work
- [ ] Performance: queries <500ms

### Post-Launch (30 days)

- [ ] Email open rate: 40% → 55%+
- [ ] Trial-to-paid conversion: 25% → 35%+
- [ ] Dashboard logins/week: 3 → 5+
- [ ] User feedback: ≥80% "permits are relevant"
- [ ] Zero-match rate: <10%
- [ ] Category selection rate: ≥90% (users complete onboarding)

---

## FUTURE ENHANCEMENTS

### Phase 2 (Post-MVP)

1. **Smart Recommendations:**
   - "Based on your activity, you might like: [Roofing] [Fire Protection]"
   - ML model: user engagement → suggest new categories

2. **Saved Searches:**
   - Save complex filter combinations
   - Name: "High-rise HVAC over $500k in downtown"
   - One-click apply

3. **Category Alerts:**
   - Push notification when high-value permit in your category
   - "🚨 New $5M hospital HVAC project in M5G"

4. **Competitor Intelligence:**
   - "Your competitor just pulled a permit for..."
   - Track specific `builder_name` values

5. **Map View:**
   - Show permits on map
   - Filter by category + location
   - Heatmap of categories

6. **Category Trends:**
   - "HVAC - Commercial Kitchen permits up 30% this month"
   - "New construction down, renovations up"

### Phase 3 (Enterprise)

7. **Custom Categories:**
   - Allow users to create custom categories
   - "Luxury Residential over $2M in M4W/M5A"

8. **API Access:**
   - `/api/permits?categories=hvac-commercial,plumbing-commercial`
   - For integrations (CRM, project management)

9. **White-Label Reports:**
   - PDF export: "Monthly HVAC Commercial Report"
   - Branded for user's company

10. **Team Collaboration:**
    - Shared category subscriptions
    - Assign permits to team members

