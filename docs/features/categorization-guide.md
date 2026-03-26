# Permit Categorization Guide

## Overview

The permit categorization system uses OpenAI GPT-4o-mini to automatically assign job role tags to building permits based on their descriptions, types, and other metadata.

## How It Works

1. **Input:** Permit description, type, structure type, and cost
2. **LLM Analysis:** GPT-4o-mini identifies which trades would work on the project
3. **Output:** 2-10 job role slugs per permit (e.g., `electrician`, `plumber`, `hvac-technician`)

## Running Categorization

### One-Time Historical Categorization (2024-2025 permits)

```bash
# Categorize all uncategorized 2024-2025 permits
bun run categorize:historical

# Estimated: ~44,000 permits, $2-3 cost, 30-60 minutes
```

### Daily Categorization (New Permits)

```bash
# Categorize permits from last 7 days
bun run categorize:daily

# Runs automatically via GitHub Action after daily ingestion
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
```

⚠️ **Important:** Add `OPENAI_API_KEY` to GitHub Secrets for the daily workflow.

## Example Categorizations

### Clear Descriptions

```
Description: "HVAC - Proposal to construct a new 2 storey SFD"
→ hvac-technician, electrician, sheet-metal-worker

Description: "Plumbing - Proposal to demolish existing SFD and construct new duplex"
→ plumber, demolition-worker, concrete-worker, electrician, hvac-technician

Description: "Proposal to change use to Multi-Tenant Assisted Home"
→ architect-designer, construction-manager, electrician, plumber
```

### Ambiguous Descriptions

For permits with minimal descriptions, the LLM uses:
- **Permit Type:** `Mechanical(MS)` → hvac-technician
- **Structure Type:** `Restaurant` → multiple trades (electrical, plumbing, fire-protection)
- **Work Type:** `Demolition` → demolition-worker, labourer

## Cost Estimation

- **Input tokens:** ~300/permit (description + context)
- **Output tokens:** ~50/permit (5 job roles average)
- **Total:** ~350 tokens/permit
- **Cost:** $0.000065/permit (~$3 for 44,000 permits)

## Performance

- **Rate:** ~60 permits/minute (10 parallel requests per batch)
- **44k permits:** ~30-60 minutes total
- **Daily permits:** <1 minute (typically 10-50 new permits)

## Monitoring Results

```sql
-- View categorization statistics
SELECT 
  jr.job_role_name,
  COUNT(*) as permit_count
FROM permit_job_roles pjr
JOIN job_role_definitions jr ON jr.job_role_slug = pjr.job_role_slug
GROUP BY jr.job_role_name
ORDER BY permit_count DESC
LIMIT 20;

-- Average roles per permit
SELECT AVG(role_count) as avg_roles
FROM (
  SELECT permit_id, COUNT(*) as role_count
  FROM permit_job_roles
  GROUP BY permit_id
) subq;

-- Recently categorized permits
SELECT 
  p.permit_num,
  p.description,
  ARRAY_AGG(pjr.job_role_slug) as job_roles
FROM permits p
JOIN permit_job_roles pjr ON pjr.permit_id = p.id
WHERE pjr.categorized_at > NOW() - INTERVAL '1 hour'
GROUP BY p.id, p.permit_num, p.description
LIMIT 10;
```

## Troubleshooting

### No permits found to categorize
- **Historical mode:** All 2024-2025 permits already categorized
- **Daily mode:** No new permits in last 7 days or already categorized

### OpenAI API errors
- Check API key is valid
- Check rate limits (Tier 1: 500 requests/min)
- Verify billing is active

### Invalid job role slugs
- LLM occasionally returns invalid slugs
- Script validates and filters out invalid ones
- Check logs for warnings

### Cost concerns
- Script shows estimated cost before processing
- Use `--mode=daily` for incremental updates (pennies per day)
- Historical run is one-time cost (~$3)

## GitHub Action Setup

The daily workflow runs automatically after permit ingestion:

```yaml
- name: Categorize new permits with LLM
  run: bun run scripts/categorize-permits.ts --mode=daily
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**Required GitHub Secret:**
- `OPENAI_API_KEY` - Your OpenAI API key

## Next Steps

After categorization is complete:

1. ✅ **Update onboarding flow** - Let users select job roles
2. ✅ **Update daily emails** - Match permits by job roles
3. ✅ **Update dashboard** - Add job role badges and filters





