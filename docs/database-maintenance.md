# Database Performance Maintenance Guide

## Overview
This guide ensures database optimizations and indexes remain effective as we add new features and filters.

---

## 1. Automated Performance Testing

### Performance Test Requirements

**Every new filter or feature MUST:**
1. Have a performance test in `route.core.test.ts`
2. Meet the threshold: < 3000ms for filtered queries
3. Include EXPLAIN ANALYZE in development

### Test Template

```typescript
it('should handle [NEW_FILTER] efficiently', async () => {
  const { duration, serverExecutionTime, data } = await fetchPermits({
    page: '1',
    per_page: '50',
    [NEW_FILTER]: 'value',
    sort_by: 'issued_date',
    sort_order: 'desc',
  })

  console.log(`[NEW_FILTER] query: ${duration}ms (server: ${serverExecutionTime}ms)`)

  expect(duration).toBeLessThan(THRESHOLDS.WITH_FILTERS) // 3000ms
  expect(data.permits.length).toBeGreaterThan(0)
})
```

---

## 2. Filter Registration System

### `hasAnyFilters` Checklist

**When adding a new filter parameter:**

1. ✅ Add to `PermitSearchParams` type
2. ✅ Add to `hasAnyFilters` check in route.ts
3. ✅ Add to query builder
4. ✅ Add performance test
5. ✅ Document index requirements

### Code Location

```typescript
// File: src/app/api/permits/search/route.ts
// Lines: ~177-192

const hasAnyFilters =
  params.status?.length ||
  params.permit_type?.length ||
  params.postal?.length ||
  params.builder_name?.length ||
  params.job_role_slugs?.length ||
  params.parent_category_slugs?.length ||
  params.cost_min !== undefined ||
  params.cost_max !== undefined ||
  params.date_from ||
  params.date_to ||
  params.issued_from ||
  params.issued_to ||
  params.query ||
  params.has_builder !== undefined ||
  params.has_cost !== undefined
  // ADD NEW FILTERS HERE
```

---

## 3. Index Audit Process

### Weekly Index Health Check

Run this SQL to identify missing or unused indexes:

```sql
-- Check for unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'permits'
  AND idx_scan < 50  -- Less than 50 scans
ORDER BY idx_scan, indexrelname;

-- Check for missing indexes (sequential scans)
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / NULLIF(seq_scan, 0) as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename = 'permits'
  AND seq_scan > 0;

-- Check index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND tablename = 'permits'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Monthly ANALYZE

```sql
-- Update statistics for query planner
ANALYZE permits;
ANALYZE permit_job_roles;
ANALYZE job_role_definitions;

-- Verify statistics are current
SELECT 
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('permits', 'permit_job_roles', 'job_role_definitions');
```

---

## 4. Feature Development Checklist

### Before Adding a New Filter

- [ ] Check if existing index covers it
- [ ] Run EXPLAIN ANALYZE on sample query
- [ ] Estimate query performance (aim for <300ms)
- [ ] Consider composite index if needed

### Implementation Checklist

- [ ] Update `PermitSearchParams` type in `src/types/permits.ts`
- [ ] Add to `hasAnyFilters` check in `route.ts`
- [ ] Add query filter logic
- [ ] Add performance test with threshold
- [ ] Document in `sql-optimization.md`
- [ ] Run full test suite

### After Implementation

- [ ] Monitor slow query logs in production
- [ ] Check Supabase dashboard for query performance
- [ ] Verify index usage with EXPLAIN ANALYZE
- [ ] Update this checklist if needed

---

## 5. Index Naming Convention

Follow consistent naming for maintainability:

```
idx_[table]_[columns]_[optional_type]

Examples:
- idx_permits_issued_date_desc
- idx_permits_status_recent (partial index)
- idx_permits_has_address_issued_composite
- idx_permits_cost_issued_date (composite)
```

### When to Create a New Index

**Create index if:**
- Query runs >500ms consistently
- EXPLAIN shows Seq Scan on large table (>10k rows)
- Filter combination is common (>10% of queries)
- WHERE clause on column not in any index

**Don't create index if:**
- Query already fast (<100ms)
- Filter rarely used (<1% of queries)
- Column has low cardinality (<10 distinct values)
- Table is small (<1k rows)

---

## 6. Query Performance Monitoring

### Development

Add query logging to route handler:

```typescript
const queryStartTime = Date.now()
const { data, error, count } = await query
const queryDuration = Date.now() - queryStartTime

console.log(`🔍 Query took ${queryDuration}ms`, {
  filters: { /* all active filters */ },
  resultCount: data?.length || 0,
  totalCount: count,
})

if (queryDuration > 300) {
  console.warn(`⚠️ SLOW QUERY (${queryDuration}ms)`, {
    params,
    sql: 'Check Supabase logs for query plan'
  })
}
```

### Production (Supabase Dashboard)

1. Go to Database → Query Performance
2. Filter by execution time > 500ms
3. Check for new slow queries after deployments
4. Run EXPLAIN ANALYZE on slow queries

---

## 7. Code Review Guidelines

### For Reviewers

When reviewing PRs that add filters:

1. **Check `hasAnyFilters`**
   - [ ] New filter added to detection logic?
   
2. **Performance Test**
   - [ ] New test added with proper threshold?
   - [ ] Test actually exercises the new filter?
   
3. **Index Strategy**
   - [ ] Existing index covers new filter?
   - [ ] If not, new index proposed?
   - [ ] EXPLAIN ANALYZE run and documented?

4. **Type Safety**
   - [ ] Filter in `PermitSearchParams` type?
   - [ ] Optional chaining used properly?

---

## 8. Emergency Response: Slow Query

If production queries become slow:

### Immediate Actions

1. **Identify the query**
```sql
-- Find current slow queries
SELECT 
  pid,
  now() - query_start as duration,
  query,
  state
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;
```

2. **Kill if necessary**
```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity
WHERE pid = [SLOW_QUERY_PID];
```

3. **Analyze the query**
```sql
EXPLAIN (ANALYZE, BUFFERS) [THE_SLOW_QUERY];
```

### Root Cause Analysis

1. Check if index is being used (look for "Seq Scan")
2. Check if statistics are outdated (run ANALYZE)
3. Check if query parameters changed (new filter combination)
4. Check table size growth (may need new index)

### Fix Implementation

1. Create migration with new index
2. Run ANALYZE to update statistics
3. Test query performance
4. Deploy fix
5. Monitor for 24 hours

---

## 9. Automated Health Checks

### GitHub Action: Weekly Index Health

```yaml
name: Database Health Check

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  check-indexes:
    runs-on: ubuntu-latest
    steps:
      - name: Check Index Usage
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          psql $DATABASE_URL -c "
            SELECT indexname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public' AND tablename = 'permits'
            ORDER BY idx_scan;
          "
      
      - name: Notify if unused indexes found
        # Add Slack notification if idx_scan < 10
```

### Daily Performance Regression Test

Already implemented in CI:
- Runs on every push
- Tests all filter combinations
- Alerts if thresholds exceeded

---

## 10. Documentation Updates

### When to Update Docs

- New filter added → Update this doc + `sql-optimization.md`
- New index created → Document in migration + `sql-optimization.md`
- Performance threshold changed → Update test file + this doc
- New optimization technique → Add to `sql-optimization.md`

### Documentation Locations

| Topic | File |
|-------|------|
| Optimization strategies | `docs/sql-optimization.md` |
| Maintenance procedures | `docs/database-maintenance.md` (this file) |
| Migration history | `supabase/migrations/` |
| Performance tests | `src/app/api/permits/search/route.core.test.ts` |

---

## Quick Reference

### Adding a New Filter (5-Step Checklist)

1. **Types**: Add to `PermitSearchParams`
2. **Detection**: Add to `hasAnyFilters` 
3. **Query**: Add filter to query builder
4. **Test**: Add performance test
5. **Verify**: Run `bunx vitest run` and check passes

### Performance Debugging (3-Step Process)

1. **Measure**: Add console.log in route handler
2. **Analyze**: Run EXPLAIN ANALYZE in Supabase SQL editor
3. **Optimize**: Add index or rewrite query

### Index Maintenance (Monthly Tasks)

1. **Analyze**: Run `ANALYZE permits;`
2. **Check**: Review pg_stat_user_indexes
3. **Clean**: Remove indexes with idx_scan < 50 and size > 100MB

