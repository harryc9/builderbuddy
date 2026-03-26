# Daily Digest Deduplication - Implementation Summary

## Problem Solved

Previously, running `send-daily-digest.ts` multiple times would send the same permits to users. Now, each permit is only sent once per user, ever.

## Solution: Track Sent Permits Per User

Created a `user_digest_history` table that records which permits have been sent to which users.

## Changes Made

### 1. Database Migration (`migrations/create_user_digest_history.sql`)

```sql
CREATE TABLE user_digest_history (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  permit_id uuid REFERENCES permits(id),
  sent_at timestamptz,
  UNIQUE(user_id, permit_id)
);
```

**Key features:**
- Unique constraint prevents duplicate sends
- Indexed for fast lookups
- Cascading deletes if user/permit is removed

### 2. Updated Query Logic (`scripts/send-daily-digest.ts`)

**Modified `fetchPermitsForUser()`:**
- Added `NOT EXISTS` clause to exclude already-sent permits
- Passes `user.id` as parameter to query

```sql
AND (
  -- Exclude permits already sent to this user
  NOT EXISTS(
    SELECT 1 FROM user_digest_history udh
    WHERE udh.user_id = $5
      AND udh.permit_id = p.id
  )
)
```

### 3. Record Sent Permits

**Added `recordSentPermits()` function:**
- Called after successful email send
- Bulk inserts permit IDs for user
- Uses `ON CONFLICT DO NOTHING` for safety

```typescript
await recordSentPermits(user.id, permitIds)
```

### 4. Optional Cleanup

**Added `cleanupOldDigestHistory()` function:**
- Removes records older than 30 days
- Keeps table size manageable
- Can be run manually or via cron

## How It Works

### First Run (Nov 14, 2025)
1. User A receives email with permits [P1, P2, P3]
2. Records inserted: `(user_a, p1)`, `(user_a, p2)`, `(user_a, p3)`

### Second Run (Nov 15, 2025)
1. Query fetches permits matching user's categories
2. Query excludes P1, P2, P3 (already sent)
3. User A receives email with permits [P4, P5] (only new ones)
4. Records inserted: `(user_a, p4)`, `(user_a, p5)`

### Third Run (Nov 16, 2025)
1. Query excludes P1, P2, P3, P4, P5
2. User A receives email with permits [P6] (only new one)

## Benefits

✅ **No duplicates** - Each permit sent exactly once per user
✅ **Script can run multiple times safely** - Idempotent
✅ **Handles script failures** - If email fails, permit not recorded (will retry next run)
✅ **Efficient** - Indexed lookups, no full table scans
✅ **Maintainable** - Optional cleanup keeps table size reasonable

## Migration Steps

1. **Run migration:**
   ```bash
   psql $DATABASE_URL -f migrations/create_user_digest_history.sql
   ```

2. **Deploy updated script:**
   ```bash
   git add scripts/send-daily-digest.ts
   git commit -m "Add deduplication for daily digest emails"
   git push
   ```

3. **Verify:**
   ```bash
   # Run script manually
   bun run scripts/send-daily-digest.ts
   
   # Check records were created
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_digest_history;"
   ```

## Monitoring

### Check duplicates (should be 0):
```sql
SELECT user_id, permit_id, COUNT(*)
FROM user_digest_history
GROUP BY user_id, permit_id
HAVING COUNT(*) > 1;
```

### Check table growth:
```sql
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as permits_sent
FROM user_digest_history
GROUP BY DATE(sent_at)
ORDER BY date DESC
LIMIT 7;
```

### Most active users:
```sql
SELECT 
  u.email,
  COUNT(*) as total_permits_received
FROM user_digest_history udh
JOIN auth.users u ON u.id = udh.user_id
GROUP BY u.email
ORDER BY total_permits_received DESC
LIMIT 10;
```

## Edge Cases Handled

**Q: What if email send fails?**
A: Permit not recorded → will be included in next run (retry logic)

**Q: What if same permit sent to different users?**
A: Works correctly - unique constraint is `(user_id, permit_id)` pair

**Q: What if user unsubscribes then resubscribes?**
A: Previous history preserved - they won't get old permits again

**Q: What if permit is updated (cost/status changes)?**
A: Current implementation: Won't resend. 
Future: Could track sent "versions" and resend if critical changes occur.

**Q: Table grows too large?**
A: Run cleanup function monthly to remove old records (>30 days)

## Future Enhancements

1. **Track changes and resend:** If permit has critical status change, send again
2. **Weekly digest mode:** Option to send permits once per week instead of daily
3. **Digest preferences:** Let users choose frequency (daily/weekly/monthly)
4. **Analytics:** Track which permits get clicked from emails

## Testing Checklist

- [x] Migration creates table successfully
- [x] Query excludes already-sent permits
- [x] Records inserted after successful send
- [x] No duplicate sends on multiple runs
- [x] Cleanup function works
- [ ] Test with real users (manual verification)
- [ ] Monitor for 7 days to ensure no issues

## Rollback Plan

If issues occur:

1. **Disable tracking (quick fix):**
   ```sql
   -- Comment out NOT EXISTS clause in fetchPermitsForUser()
   ```

2. **Full rollback:**
   ```sql
   DROP TABLE IF EXISTS user_digest_history CASCADE;
   ```

3. **Revert code:**
   ```bash
   git revert <commit-hash>
   ```

