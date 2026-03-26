## Description
<!-- Describe your changes in detail -->

## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Database schema change

## Database & Performance Checklist
<!-- REQUIRED for any changes to search/filters/queries -->

### If you added a new filter parameter:
- [ ] Added to `PermitSearchParams` type in `src/types/permits.ts`
- [ ] Added to `hasAnyFilters` check in `src/app/api/permits/search/route.ts` (line ~187)
- [ ] Added query filter logic to route handler
- [ ] Added performance test in `route.core.test.ts` with <3s threshold
- [ ] Ran `EXPLAIN ANALYZE` and verified index usage (attach results if relevant)
- [ ] Updated `docs/database-maintenance.md` if new index needed

### If you modified database schema:
- [ ] Created migration file in `supabase/migrations/`
- [ ] Migration is reversible (has DOWN migration)
- [ ] Tested migration on local database
- [ ] Added/updated indexes if needed
- [ ] Ran `ANALYZE` after migration
- [ ] Updated TypeScript types in `src/types/supabase.public.types.ts`

### Performance verification:
- [ ] All tests pass: `bunx vitest run`
- [ ] No new slow query warnings in console logs
- [ ] Checked Supabase dashboard for query performance (if deployed)
- [ ] Added query logging for new filters/features

## Testing
<!-- Describe how you tested your changes -->

### Manual Testing
- [ ] Tested locally
- [ ] Tested with various filter combinations
- [ ] Verified pagination works correctly
- [ ] Checked Network tab for response times

### Automated Testing
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] Added performance tests (if applicable)
- [ ] All existing tests pass

## Screenshots / Query Plans
<!-- If applicable, add screenshots or EXPLAIN ANALYZE results -->

### Before (if performance improvement):
```
Execution Time: XXms
```

### After:
```
Execution Time: XXms
```

## Documentation
- [ ] Updated relevant documentation
- [ ] Added inline code comments for complex logic
- [ ] Updated API documentation (if applicable)

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have checked for any N+1 query issues
- [ ] I have considered the impact on existing users/data

## Related Issues
<!-- Link to related issues, if any -->
Closes #

## Deployment Notes
<!-- Any special considerations for deployment? -->
- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires data backfill
- [ ] Safe to deploy immediately
- [ ] Requires coordinated deployment (backend + frontend)

## Rollback Plan
<!-- How to revert this change if issues arise in production -->

---

### For Reviewers
**Database Changes Review:**
- [ ] Verified `hasAnyFilters` includes all new filters
- [ ] Checked performance test threshold is appropriate
- [ ] Reviewed EXPLAIN ANALYZE results (if provided)
- [ ] Confirmed migration is safe and reversible
- [ ] Verified no new N+1 queries introduced

**Code Quality:**
- [ ] Code is readable and well-documented
- [ ] Tests are comprehensive
- [ ] No obvious performance issues
- [ ] Follows project conventions

