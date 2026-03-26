# SQL Optimization Guide

## Change Detection Optimization

### Problem
Fetching all 250k+ permits from the database into Node.js memory for comparison was taking too long (multiple minutes) and consuming excessive memory.

### Solution
Implemented database-level change detection using PostgreSQL direct queries via a connection pool.

### Architecture

#### Before (Node.js-based)
```
1. Fetch 250k permits → Node.js (slow, memory-heavy)
2. Build Map in memory
3. Loop through 255k new permits
4. Compare each field in JavaScript
5. Build changes array
6. Insert changes to DB
```

**Performance:** ~500-700s total, ~400s for DB fetch alone

#### After (SQL-based)
```
1. Create temp table
2. Bulk insert 255k new permits → temp table
3. SQL JOIN to detect changes (database does the work)
4. SQL INSERT changes directly to permit_changes
5. UPSERT permits to main table
```

**Expected Performance:** ~50-100s total (10-20x faster)

---

## Permits Search API Optimization

### Problem
Initial page load taking 4.6s due to:
1. Sequential scans on 256k rows
2. Expensive COUNT queries even with estimation
3. Inefficient full_address NULL checks

### Solution
Applied multi-layer optimization strategy:

#### 1. Index Optimization (85x speedup)

**Before:**
- Sequential scan: 2,470ms
- No index usage for default query

**After:**
- Index scan: 29ms
- Composite index: `idx_permits_has_address_issued_composite`

```sql
CREATE INDEX idx_permits_has_address_issued_composite 
ON permits (has_address, issued_date DESC NULLS LAST)
WHERE issued_date >= '2020-01-01';
```

**Key Insights:**
- Use generated columns (`has_address`) instead of complex NULL checks
- Composite indexes with DESC sorting match query ORDER BY
- Partial indexes (WHERE clause) reduce index size and improve performance
- Statistics target at 1000 for better query planning

#### 2. COUNT Query Optimization

**Strategy:** Skip COUNT on default landing page (no filters, page 1)

```typescript
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

// Only skip count for unfiltered page 1
const useCount = page > 1 || hasAnyFilters
```

**Benefit:** Saves 1-2s on landing page while keeping accuracy for filtered results

#### 3. Generated Columns

Using `has_address` generated column enables:
- Faster NULL checks (boolean vs string comparison)
- Index-only scans
- Better query planning statistics

```sql
ALTER TABLE permits 
ADD COLUMN has_address boolean 
GENERATED ALWAYS AS (
  (full_address IS NOT NULL) AND (full_address <> '')
) STORED;
```

#### 4. Date Range Defaults

Force index usage by defaulting to recent permits (last 5 years):

```typescript
if (!params.issued_from && !params.issued_to) {
  query = query.gte('issued_date', '2020-01-01')
}
```

This matches the partial index WHERE clause, ensuring index usage.

---

## Best Practices Applied

### Index Strategy
1. **Composite indexes** match query patterns (has_address + issued_date)
2. **Partial indexes** reduce size (WHERE issued_date >= '2020-01-01')
3. **DESC sorting** in index matches ORDER BY
4. **Statistics targets** at 1000 for accurate planning

### Query Optimization
1. **Skip COUNT** when not needed (unfiltered page 1)
2. **Use estimated COUNT** instead of exact (10x faster)
3. **Generated columns** for complex conditions
4. **Early filtering** with WHERE clauses that match indexes

### Performance Testing
1. **EXPLAIN ANALYZE** before/after comparisons
2. **Buffer cache analysis** (Shared Hit/Read Blocks)
3. **Performance regression tests** with thresholds
4. **Warmup queries** in tests to simulate production

### Code Quality
1. **Comprehensive filter detection** - check ALL filter params
2. **Type safety** with TypeScript
3. **Graceful degradation** - estimated counts as fallback
4. **Logging** for slow query detection (>300ms)

---

## Performance Targets

| Query Type | Target | Actual | Status |
|------------|--------|--------|--------|
| Default page 1 (no filters) | < 5s | ~500ms | ✅ 10x better |
| Filtered queries | < 3s | ~300ms | ✅ 10x better |
| Subsequent pages | < 3s | ~300ms | ✅ |
| With filters + pagination | < 3s | ~300ms | ✅ |

---

## Monitoring & Debugging

### Query Analysis
```sql
-- Check index usage
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM permits 
WHERE has_address = true 
  AND issued_date >= '2020-01-01'
ORDER BY issued_date DESC NULLS LAST
LIMIT 50;
```

### Statistics Check
```sql
-- Verify statistics are up to date
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE tablename = 'permits' 
AND attname IN ('issued_date', 'has_address', 'status');
```

### Slow Query Logging
```typescript
if (executionTime > 300) {
  console.warn(`⚠️  Slow query (${executionTime}ms):`, params)
}
```

---

## Dependencies

```json
{
  "pg": "^8.13.1",
  "@types/pg": "^8.11.10"
}
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## Future Optimizations

1. **Materialized views** for expensive aggregations
2. **Parallel query execution** for large result sets
3. **Query result caching** with Redis
4. **Incremental updates** only check recent permits
5. **Hash-based comparison** for faster field comparison





