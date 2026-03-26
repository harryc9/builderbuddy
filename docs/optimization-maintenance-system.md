# Database Optimization Maintenance System

## Overview
This document provides a comprehensive system to ensure database optimizations remain effective as new features and filters are added.

---

## 🎯 Quick Start: Adding a New Filter

**5-Step Checklist (5 minutes):**

1. **Types** - Add to `src/types/permits.ts` → `PermitSearchParams`
2. **Detection** - Add to `src/app/api/permits/search/route.ts` line ~187 (look for `// 👆 ADD NEW FILTERS ABOVE`)
3. **Query** - Add filter logic in route handler  
4. **Test** - Copy template from `test-utils.ts` and add test
5. **Run** - `bunx vitest run` to verify

**Done!** The system will now:
- ✅ Return accurate counts with your filter
- ✅ Monitor performance automatically  
- ✅ Fail CI if performance degrades
- ✅ Track index usage weekly

---

## 📋 System Components

### 1. Inline Code Documentation
**Location:** `src/app/api/permits/search/route.ts` lines 175-255

Clear comments explain:
- Why `hasAnyFilters` check is critical
- How to add new filters (with pointer to exact line)
- Index optimization strategies
- Performance implications

### 2. Test Utilities
**Location:** `src/app/api/permits/search/test-utils.ts`

Reusable helpers:
- `testFilterPerformance()` - Test any filter with thresholds
- `verifyFilterDetection()` - Ensure filter triggers COUNT
- `testFilterCombinations()` - Test multiple filter combos
- Templates for new filter tests

### 3. Performance Tests
**Location:** `src/app/api/permits/search/route.core.test.ts`

- 13 tests covering all filter combinations
- Automatic warmup before tests
- Clear thresholds (5s initial, 3s filtered)
- Runs in CI on every push

### 4. PR Template
**Location:** `.github/pull_request_template.md`

Enforces checklist for:
- Database changes
- Filter additions
- Index requirements
- Performance verification

### 5. Weekly Health Checks
**Location:** `.github/workflows/database-health.yml`

Automatic monitoring:
- Unused indexes (candidates for removal)
- Statistics freshness
- Sequential scan rates
- Index bloat
- Creates GitHub issue if problems found

### 6. Maintenance Guide
**Location:** `docs/database-maintenance.md`

Comprehensive guide covering:
- Weekly/monthly maintenance tasks
- Emergency response procedures
- Index naming conventions
- Code review guidelines
- EXPLAIN ANALYZE examples

### 7. Optimization Documentation
**Location:** `docs/sql-optimization.md`

Performance achievements:
- 85x speedup (2470ms → 29ms)
- Index strategies
- Before/after comparisons
- Query optimization techniques

---

## 🔄 Development Workflow

### When Adding a Filter

```
1. Write feature code
   ├─ Add to PermitSearchParams type
   ├─ Add to hasAnyFilters check (look for 👆 comment)
   └─ Add query filter logic

2. Add tests (use test-utils.ts)
   ├─ testFilterPerformance() 
   ├─ verifyFilterDetection()
   └─ Run: bunx vitest run

3. Check performance
   ├─ Tests must pass (<3s threshold)
   ├─ Check console for slow query warnings
   └─ Run EXPLAIN ANALYZE if > 500ms

4. Create PR
   ├─ PR template guides you through checklist
   ├─ CI runs all performance tests
   └─ Reviewer verifies database checklist

5. Monitor (automatic)
   ├─ Weekly health check runs
   ├─ Supabase dashboard tracks queries
   └─ GitHub issue created if problems
```

### When Index Performance Degrades

```
1. Detect (automatic)
   ├─ Performance test fails in CI
   ├─ Slow query logged in console
   └─ Weekly health check alerts

2. Diagnose
   ├─ Run EXPLAIN ANALYZE
   ├─ Check pg_stat_user_indexes
   └─ Review recent changes

3. Fix
   ├─ Create migration with new index
   ├─ Run ANALYZE
   └─ Test with production-like data

4. Verify
   ├─ Performance test passes
   ├─ EXPLAIN shows index usage
   └─ Deploy and monitor
```

---

## 📊 Performance Targets

| Query Type | Target | Current | Status |
|------------|--------|---------|--------|
| Default page 1 | < 5s | ~500ms | ✅ 10x better |
| Filtered queries | < 3s | ~300ms | ✅ 10x better |
| Subsequent pages | < 3s | ~300ms | ✅ |
| Server execution | < 1s | ~100ms | ✅ |

---

## 🛡️ Safeguards in Place

### Automatic
- ✅ Performance tests run in CI (every push)
- ✅ Test failures block PR merge
- ✅ Weekly index health checks
- ✅ Slow query logging (>300ms)
- ✅ GitHub issues created for problems

### Manual (Code Review)
- ✅ PR template checklist
- ✅ Inline code comments guide developers
- ✅ Reviewer guidelines in database-maintenance.md
- ✅ Test utilities enforce best practices

### Documentation
- ✅ Maintenance procedures documented
- ✅ Emergency response playbook
- ✅ Index strategies explained
- ✅ Performance baselines recorded

---

## 🎓 Training & Onboarding

### For New Developers

**Read these in order:**
1. `docs/sql-optimization.md` - Learn optimization strategies
2. `docs/database-maintenance.md` - Maintenance procedures
3. `src/app/api/permits/search/test-utils.ts` - Test templates
4. `.github/pull_request_template.md` - PR requirements

**Then try:**
1. Add a mock filter (e.g., `test_filter: string`)
2. Follow the 5-step checklist
3. Run tests and see them pass
4. Review inline comments in route.ts

### For Code Reviewers

**Always check:**
1. [ ] New filter in `hasAnyFilters`?
2. [ ] Performance test added?
3. [ ] Test threshold appropriate (<3s)?
4. [ ] EXPLAIN ANALYZE reviewed (if new index)?
5. [ ] No N+1 queries introduced?

---

## 🔧 Maintenance Schedule

### Daily (Automatic)
- CI runs performance tests on every push
- Slow queries logged to console

### Weekly (Automatic)
- GitHub Action runs database health check
- Reports unused indexes, stale statistics
- Creates GitHub issue if problems found

### Monthly (Manual - 15 minutes)
1. Review GitHub issues from health checks
2. Run `ANALYZE permits;` in Supabase SQL Editor
3. Check Supabase dashboard for slow queries
4. Review and remove unused indexes (if idx_scan < 50)

### Quarterly (Manual - 30 minutes)
1. Review all indexes for bloat
2. Update `docs/sql-optimization.md` with new baselines
3. Review and update performance thresholds if needed
4. Check for new optimization opportunities

---

## 📚 Additional Resources

### Files to Reference
- `src/app/api/permits/search/route.ts` - Main search API
- `src/app/api/permits/search/test-utils.ts` - Test helpers
- `src/app/api/permits/search/route.core.test.ts` - Performance tests
- `docs/sql-optimization.md` - Optimization techniques
- `docs/database-maintenance.md` - Maintenance procedures

### SQL Queries for Monitoring

**Check index usage:**
```sql
SELECT indexname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE tablename = 'permits'
ORDER BY idx_scan;
```

**Find slow queries:**
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query ILIKE '%permits%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Check statistics age:**
```sql
SELECT tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'permits';
```

---

## ✅ Success Metrics

**System is working if:**
- All performance tests pass consistently
- No GitHub issues from weekly health checks
- EXPLAIN ANALYZE shows index usage for all queries
- Query times remain under thresholds (<3s)
- No unused indexes accumulating

**Take action if:**
- Performance tests fail (investigate immediately)
- Weekly health check creates issue (review within 1 week)
- Slow queries logged frequently (>10% of requests)
- Statistics not updated in 30+ days
- Indexes growing rapidly (check for bloat)

---

## 🚀 Future Improvements

1. **Redis caching** for expensive queries
2. **Materialized views** for common aggregations
3. **Query result streaming** for large result sets
4. **Automated index recommendations** based on query patterns
5. **Performance regression detection** with historical baselines

---

## 💡 Key Principles

1. **Prevention > Detection > Reaction**
   - Inline comments prevent mistakes
   - Automated tests detect problems
   - Documentation guides reaction

2. **Make it Easy to Do Right**
   - Test utilities remove friction
   - PR template guides process
   - Clear pointers to exact lines

3. **Automatic > Manual**
   - CI runs tests automatically
   - Weekly health checks run automatically
   - GitHub issues created automatically

4. **Document Everything**
   - Inline code comments
   - Comprehensive guides
   - PR templates
   - Migration notes

---

**Questions? See `docs/database-maintenance.md` or ask in #engineering**

