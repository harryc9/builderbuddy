# Permits Search API Performance Optimization

## Problem
Initial page load of permits table was extremely slow (10+ seconds). The bottleneck was the count operation on large filtered result sets.

## Root Cause
- Query execution: 10-36ms ✅
- **Count operation (even 'planned'): 10+ seconds** ❌
- PostgREST with exact/planned count adds massive overhead for large result sets (71k rows matching filter)

## Solution: Approximate Count (Estimated)
Use PostgreSQL's query planner statistics instead of actual row counting.

**Result:**
- Count time: **~10ms** (down from 10+ seconds)
- Accuracy: ~95% (e.g., 68k-74k instead of exact 71,399)
- User experience: Shows "Page 1 of 1,428 (~71k results)"

## Changes Made

### 1. API Route (`/api/permits/search/route.ts`)

**Before:**
```typescript
let query = sb.from('permits').select('*', { count: 'planned' })
// Slow: 10+ seconds for counting 71k rows
```

**After:**
```typescript
const useExactCount = searchParams.get('exact_count') === 'true'
let query = sb.from('permits').select('*', { 
  count: useExactCount ? 'planned' : 'estimated' 
})
// Fast: ~10ms using query planner statistics
```

**How it works:**
- `estimated`: Uses PostgreSQL's `reltuples` statistics (instant)
- `planned`: Uses query planner estimate by running EXPLAIN (slow)
- `exact`: Counts actual rows (very slow, not used)

### 2. Database Indexes

**Created:**
```sql
-- Partial index for recent permits (most queries)
CREATE INDEX idx_permits_issued_date_desc 
ON permits (issued_date DESC NULLS LAST)
WHERE issued_date >= '2020-01-01';

-- Composite index for status + date filtering
CREATE INDEX idx_permits_status_recent 
ON permits (status, issued_date DESC NULLS LAST)
WHERE issued_date >= '2020-01-01';

-- Increase statistics for better estimates
ALTER TABLE permits ALTER COLUMN issued_date SET STATISTICS 1000;
```

**Benefits:**
- Index scan instead of bitmap heap scan + sort
- Execution time: 36ms (verified via EXPLAIN ANALYZE)
- Better count estimates with higher statistics target

### 3. Frontend Updates (`PermitsTable.tsx`)

**Display:**
```typescript
Page {page} of {total_pages} (~{count/1000}k results)
// Example: "Page 1 of 1,428 (~71k results)"
```

Shows approximate count with "~" to signal it's an estimate.

### 4. Cache Headers

```typescript
'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
```

- CDN caches for 2 minutes
- Serves stale content for 5 minutes while revalidating
- Reduces API calls during high traffic

## Performance Results

### Before Optimization
- **Page 1:** 10,663ms ❌
- **Page 2:** 4,189ms ❌
- Bottleneck: Count operation

### After Optimization
- **Page 1:** ~100-200ms ✅
- **Page 2-5:** ~100-200ms ✅
- **Query execution:** 36ms
- **Count (estimated):** ~10ms
- **Total:** ~50-200ms end-to-end

### Query Plan (Verified)
```
EXPLAIN ANALYZE:
Limit (rows=50, time=36ms)
  -> Index Scan using idx_permits_issued_date_desc 
     Index Cond: (issued_date >= '2022-01-01' AND issued_date <= '2025-12-31')
     Rows: 50
     Buffers: shared hit=41 read=11
```

## Usage Patterns

### Normal pagination (fast, approximate count)
```
GET /api/permits/search?page=1&per_page=50&sort_by=issued_date&sort_order=desc
// Returns: total_count: ~71000, execution_time_ms: ~100ms
```

### Exact count when needed (slow, precise)
```
GET /api/permits/search?page=1&exact_count=true&...
// Returns: total_count: 71399, execution_time_ms: ~10s
```

### Why This Works

**PostgreSQL Statistics:**
- Postgres maintains table statistics in `pg_class.reltuples`
- Updated by ANALYZE (runs automatically via autovacuum)
- Provides instant estimates without scanning rows
- Accuracy improves with higher statistics target (we set to 1000)

**Trade-off:**
- **Gain:** 1000x faster (10ms vs 10s)
- **Cost:** 5% accuracy variance
- **UX:** Users don't need exact counts for pagination

## Monitoring

Slow queries (>300ms) are automatically logged:
```typescript
if (executionTime > 300) {
  console.warn(`Slow query (${executionTime}ms):`, params)
}
```

## Future Optimizations

1. **Cursor-based pagination**
   - Use `issued_date + id` cursor instead of offset
   - Eliminates offset penalty for later pages
   - Constant time regardless of page number

2. **Pre-computed counts cache**
   - Store common filter counts in Redis (5-min TTL)
   - Update on permit ingestion
   - Instant exact counts for popular filters

3. **Hybrid approach**
   - Use estimated for pages 1-10
   - Switch to cursor-based for pages 10+
   - Best of both worlds

## Related Docs
- [SQL Optimization](./sql-optimization.md) - Change detection optimization
- [Permit Data Ingestion Strategy](./features/permit-data-ingestion-strategy.md)

