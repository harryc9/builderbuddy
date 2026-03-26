# Job Role Categorization - Implementation Progress

## ✅ Step 1: COMPLETE - Database Schema & Job Role Taxonomy

**Completed:**
- Created `job_role_definitions` table with 50 job roles
- Created `permit_job_roles` table (many-to-many relationship)
- Added user preference columns to `users` table
- Created TypeScript types for job roles
- All 50 roles seeded with:
  - Names, slugs, descriptions
  - Display order (popular first)
  - Lucide React icon names
  - Color hex codes
  - Keywords for LLM context
  - Popular flag (10 popular trades)

**Database Tables:**
- `job_role_definitions` - 50 rows ✅
- `permit_job_roles` - 0 rows (will populate via LLM)
- `users.subscribed_job_roles` - TEXT[] column ✅
- `users.min_project_cost` - NUMERIC column ✅
- `users.only_with_builder` - BOOLEAN column ✅
- `users.only_with_cost` - BOOLEAN column ✅

**Popular Job Roles (shown first in onboarding):**
1. Electrician
2. Plumber
3. HVAC Technician
4. Carpenter (Rough)
5. Carpenter (Finish)
6. Roofer
7. Drywaller
8. Painter
9. Concrete Worker
10. Mason

---

## ✅ Step 2: COMPLETE - LLM Categorization Script

**Completed:**
- Created `categorize-permits.ts` script with two modes:
  - `historical`: Categorize all 2024-2025 permits
  - `daily`: Categorize recent uncategorized permits (last 7 days)
- Uses OpenAI GPT-4o-mini with structured JSON output
- Validates job role slugs against `job_role_definitions`
- Processes in parallel batches (10 permits at a time)
- Stores results in `permit_job_roles` table
- Rate limiting (1 second between batches)
- Cost estimation before processing
- Comprehensive error handling and logging

**GitHub Action:**
- Updated `daily-permits.yml` workflow
- Runs categorization automatically after daily ingestion
- Requires `OPENAI_API_KEY` GitHub secret

**Scripts Available:**
```bash
bun run categorize:historical  # One-time: categorize all 2024-2025 permits
bun run categorize:daily        # Daily: categorize last 7 days
bun run categorize:test         # Test: run on 5 sample permits
```

**Performance:**
- ~60 permits/minute
- 44k permits in ~30-60 minutes
- Cost: ~$2-3 total for historical run
- Cost: ~$0.01/day for daily updates

**Documentation:**
- `docs/features/categorization-guide.md` - Full usage guide
- `scripts/test-categorization.ts` - Quick test script

---

## 📋 Next Steps

### Step 3: Update Onboarding Flow
Build UI components:
1. Job role selector (multi-select)
2. Service area input
3. Optional preferences

### Step 4: Update Daily Email Matching
Modify email logic:
1. Match by `subscribed_job_roles`
2. Fallback to 3 interesting permits if no matches

### Step 5: Update Dashboard Filters
Add job role filtering:
1. Badge display on permit cards
2. Filter panel with job roles
3. Search by job roles

---

## 🧪 Testing Step 1

Run these queries to verify setup:

```sql
-- View all popular job roles
SELECT job_role_name, job_role_slug, display_order
FROM job_role_definitions
WHERE is_popular = true
ORDER BY display_order;

-- View all job roles
SELECT job_role_name, job_role_slug, keywords
FROM job_role_definitions
ORDER BY display_order;

-- Check users table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('subscribed_job_roles', 'min_project_cost');
```

---

## 📊 Database Schema

```sql
-- job_role_definitions (master list)
CREATE TABLE job_role_definitions (
  id UUID PRIMARY KEY,
  job_role_name VARCHAR(100),
  job_role_slug VARCHAR(100) UNIQUE,
  description TEXT,
  display_order INTEGER,
  icon_name VARCHAR(50),
  color_hex VARCHAR(7),
  keywords JSONB,
  is_active BOOLEAN,
  is_popular BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- permit_job_roles (many-to-many)
CREATE TABLE permit_job_roles (
  id UUID PRIMARY KEY,
  permit_id UUID REFERENCES permits(id),
  job_role_slug VARCHAR(100) REFERENCES job_role_definitions(job_role_slug),
  llm_model VARCHAR(50),
  llm_reasoning TEXT,
  categorized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  UNIQUE(permit_id, job_role_slug)
);

-- users table additions
ALTER TABLE users
  ADD COLUMN subscribed_job_roles TEXT[],
  ADD COLUMN min_project_cost NUMERIC,
  ADD COLUMN only_with_builder BOOLEAN,
  ADD COLUMN only_with_cost BOOLEAN;
```

