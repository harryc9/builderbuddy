# Saved & Ignored Permits

---

## PRODUCT SECTION

### Problem Statement

Users browse through hundreds of permits daily but have no way to:
1. **Save permits of interest** for later review or follow-up (bookmarking/favoriting)
2. **Ignore irrelevant permits** to declutter their view and improve signal-to-noise ratio
3. **Quickly access their curated list** of saved permits across sessions

Without this, users must:
- Manually track interesting permits in external tools (spreadsheets, notes)
- Re-filter the same unwanted permits every time they visit
- Lose track of opportunities they wanted to revisit

### User Stories

**As a contractor**, I want to:
- **Save permits** that look promising so I can review them when I'm ready to bid
- **Ignore permits** outside my service area or scope so they don't clutter my view
- **Quickly access my saved permits** without re-filtering every time
- **Remove saved/ignored status** if I change my mind
- **See saved permits from my phone** (persisted to account, not browser)

### Core Product Questions

#### 1. What are the primary use cases?

**Use Case 1: Bookmarking/Pipeline Management**
- User sees interesting permit while browsing
- Clicks "Save" to add to their pipeline
- Later, visits "Saved Permits" view to review and take action (call builder, submit bid, etc.)
- Similar to LinkedIn's "Save Job" or Twitter's "Bookmarks"

**Use Case 2: Noise Reduction**
- User sees permit they're definitely not interested in (wrong location, wrong trade, too small)
- Clicks "Ignore" to hide it from future searches
- Permit disappears from their view permanently
- Reduces cognitive load on subsequent visits

**Use Case 3: Team Collaboration (Future)**
- User saves permit
- Shares link with team member: "Check out this one"
- Team member can see it was saved, add notes
- *Note: This is Phase 2+ feature*

#### 2. Where should the save/ignore actions appear?

**DECISION: Row-level icon buttons with subtle styling**
- Add icon buttons to the LEFT side of each row in PermitsTable
- Use small, subtle gray icons (lucide-react: `Bookmark` and `EyeOff`)
- Icons are gray-400 by default, fill with color on active state:
  - Saved: Filled bookmark in blue-600
  - Ignored: Filled eye-off in gray-500
- Size: 16px icons in 32px (h-8 w-8) button area
- Add tooltip on hover: "Save for later" / "Ignore permit"
- Mobile: Touch-friendly tap targets (44px minimum)

#### 3. How should users access their saved/ignored permits?

**Option A: Dedicated Views (Recommended)**
- Add "Saved" and "Ignored" tabs/buttons above the table
- Clicking switches to filtered view of only saved or only ignored permits
- Clear button to "View All Permits" (return to default view)

**Option B: Filter in Sidebar**
- Add "Show: All | Saved | Ignored" filter to existing filters panel
- Pros: Consistent with existing filter UX
- Cons: Easy to miss, competes with other filters

**Option C: Separate Pages**
- New routes: `/app/permits/saved` and `/app/permits/ignored`
- Pros: Clean separation, shareable URLs
- Cons: More navigation overhead, less seamless

**DECISION: Lean button group above table**
- Compact button group: `[ All ] [ Saved ] [ Ignored ]` with count badges
- Minimal vertical space (single row, h-9 buttons)
- Uses URL query param: `?view=saved` or `?view=ignored`
- Shareable URLs, minimal UI change
- Mobile-friendly (doesn't take sidebar space)

#### 4. Should ignored permits be permanently hidden or soft-hidden?

**Option A: Soft Hide (Recommended)**
- Ignored permits hidden from "All" view by default
- User can view them via "Ignored" tab if needed
- User can "un-ignore" to restore permit
- Pros: Reversible, user has control, transparent
- Cons: Ignored permits still exist in DB queries

**Option B: Hard Hide (Not Recommended)**
- Ignored permits never shown again, even in searches
- No way to un-ignore
- Pros: Simpler implementation, cleaner UX
- Cons: No recovery if user changes mind, feels risky

**Recommendation: Soft Hide**
- Default "All" view excludes ignored permits
- "Ignored" tab shows them for review/management
- Easy to un-ignore if user changes mind

#### 5. What happens when permits update (status changes, cost changes)?

**Saved Permits:**
- Keep saved status even if permit updates
- Optionally, notify user via notification bell: "A saved permit was updated"
- *Phase 2 feature: Email notifications for saved permit changes*

**Ignored Permits:**
- Keep ignored status regardless of updates
- User explicitly chose to ignore, updates don't change that
- Exception: If permit has CRITICAL status change, optionally resurface with "You ignored this, but status changed to [X]" banner

#### 6. Should there be limits on saved/ignored permits?

**Saved Permits Limit:**
- **DECISION: Unlimited saves for all users (free and paid)**
- Rationale: Core feature for UX improvement, removes friction

**Ignored Permits Limit:**
- Unlimited ignores for all users
- Rationale: Core feature for UX improvement, shouldn't be paywalled

#### 7. Should users be able to bulk save/ignore?

**Phase 1: No bulk actions**
- One-at-a-time only
- Keep it simple for MVP

**Phase 2: Bulk actions**
- Select multiple rows → "Save selected" / "Ignore selected"
- Common use case: Ignore all permits in certain postal code
- Requires checkbox column + action bar

### UI/UX Mockup (Text Description)

**PermitsTable Row:**
```
[ 💾 ][  ] | 123 Main St | Elec, Plumb | $50k | Permit Issued | Jan 15 | ...
    ↑    ↑
 Save  Ignore
```

**Active State:**
```
[ ❤️ ][  ] | 123 Main St | Elec, Plumb | $50k | Permit Issued | Jan 15 | ...
    ↑    ↑
 Saved (filled)
 
[  ][ 🚫 ] | 456 Oak Ave | Carpentry | $20k | Under Review | Jan 16 | ...
    ↑    ↑
      Ignored (filled)
```

**View Toggles:**
```
┌─────────────────────────────────────────────┐
│  [ All ] [ Saved (5) ] [ Ignored (12) ]     │  ← Tab toggle
│                                 [Clear]      │  ← "View All" button
├─────────────────────────────────────────────┤
│  Table...                                    │
└─────────────────────────────────────────────┘
```

### Edge Cases & Behaviors

1. **User saves then ignores same permit** → Last action wins (ignore overwrites save)
2. **User ignores then saves same permit** → Last action wins (save overwrites ignore)
3. **User clicks save on already-saved permit** → Un-save (toggle behavior)
4. **User clicks ignore on already-ignored permit** → Un-ignore (toggle behavior)
5. **Permit is deleted from database** → Saved/ignored record remains (orphaned), shown as "Permit no longer available"
6. **User views saved permit that's now ignored** → Shouldn't happen (toggle behavior prevents both states), but if somehow happens, most recent action takes precedence
7. **Anonymous user clicks save/ignore** → Redirect to login page with message "Sign in to save permits"

### Success Metrics

**Engagement:**
- % of active users who save at least 1 permit (target: >40%)
- % of active users who ignore at least 1 permit (target: >60%)
- Average saved permits per user (target: 8-12)
- Average ignored permits per user (target: 15-30)

**Retention:**
- Users with saved permits have higher 7-day retention (hypothesis: +15%)
- Users with ignored permits have better session quality (fewer permits viewed before taking action)

**Product Validation:**
- "Saved" view is visited regularly (target: >20% of users per week)
- Un-save/un-ignore rate <10% (indicates good targeting)

---

## TECH SECTION

### Database Schema

Create new table: `user_permit_actions`

```sql
CREATE TABLE user_permit_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('saved', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one action per user-permit pair
  UNIQUE(user_id, permit_id)
);

-- Indexes for performance
CREATE INDEX idx_user_permit_actions_user_action 
  ON user_permit_actions(user_id, action) 
  WHERE action IS NOT NULL;

CREATE INDEX idx_user_permit_actions_permit 
  ON user_permit_actions(permit_id);

-- RLS policies (Row Level Security)
ALTER TABLE user_permit_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own actions"
  ON user_permit_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions"
  ON user_permit_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions"
  ON user_permit_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own actions"
  ON user_permit_actions FOR DELETE
  USING (auth.uid() = user_id);
```

**Why this design?**
- `UNIQUE(user_id, permit_id)` prevents duplicate entries (user can't save AND ignore)
- `action VARCHAR` allows toggle behavior (update action type or delete row)
- `ON DELETE CASCADE` auto-cleans up if user or permit deleted
- RLS ensures users only see their own actions
- Indexes optimize the two main queries: "get user's saved" and "get user's ignored"

### Server Actions (Mutations)

**Note:** Use Next.js server actions for all mutations (save/ignore). Only use API routes for read operations (GET).

#### 1. Toggle Action (Save/Ignore)

**Server Action:** `togglePermitAction`

**File:** `src/app/actions/permit-actions.ts`

```typescript
'use server'

import { sb } from '@lib/supabase'
import { revalidatePath } from 'next/cache'

export async function togglePermitAction(
  permitId: string,
  action: 'saved' | 'ignored'
): Promise<{
  success: boolean
  action: 'saved' | 'ignored' | null
  message: string
}> {
  // 1. Get authenticated user
  const { data: { user }, error: authError } = await sb.auth.getUser()
  if (authError || !user) {
    return { success: false, action: null, message: 'Not authenticated' }
  }
  
  // 2. Check if action already exists
  const { data: existing } = await sb
    .from('user_permit_actions')
    .select('*')
    .eq('user_id', user.id)
    .eq('permit_id', permitId)
    .single()
  
  // 3. Toggle logic
  if (existing) {
    if (existing.action === action) {
      // Same action → Remove (toggle off)
      await sb
        .from('user_permit_actions')
        .delete()
        .eq('id', existing.id)
      
      revalidatePath('/app')
      return { 
        success: true, 
        action: null, 
        message: `Permit ${action === 'saved' ? 'unsaved' : 'unignored'}` 
      }
    } else {
      // Different action → Update
      await sb
        .from('user_permit_actions')
        .update({ action, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      
      revalidatePath('/app')
      return { 
        success: true, 
        action, 
        message: `Permit ${action}` 
      }
    }
  } else {
    // No existing action → Insert
    await sb
      .from('user_permit_actions')
      .insert({ user_id: user.id, permit_id: permitId, action })
    
    revalidatePath('/app')
    return { 
      success: true, 
      action, 
      message: `Permit ${action}` 
    }
  }
}
```

#### 2. Get User Actions (Batch)

**API Route (Read-only):** `GET /api/permits/actions?permit_ids=uuid1,uuid2,uuid3`

**Response:**
```typescript
{
  actions: {
    [permit_id: string]: 'saved' | 'ignored' | null
  }
}
```

**Use Case:** Get actions for all permits on current page to show correct icon states

#### 3. Existing `/api/permits/search` Modifications

Add new query parameters:
- `?view=saved` - Only show saved permits
- `?view=ignored` - Only show ignored permits
- `?view=all` (default) - Exclude ignored permits

**Implementation:**
```typescript
// In search route
if (params.view === 'saved') {
  query = query
    .select('*, user_permit_actions!inner(*)')
    .eq('user_permit_actions.user_id', userId)
    .eq('user_permit_actions.action', 'saved')
}
else if (params.view === 'ignored') {
  query = query
    .select('*, user_permit_actions!inner(*)')
    .eq('user_permit_actions.user_id', userId)
    .eq('user_permit_actions.action', 'ignored')
}
else {
  // Default: Exclude ignored
  query = query
    .select('*, user_permit_actions(*)')
    .or('user_permit_actions.is.null,user_permit_actions.action.neq.ignored')
}
```

### Client-Side Implementation

#### 1. React Query Hooks

**`usePermitActions.ts`**
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { togglePermitAction } from '@/app/actions/permit-actions'

// Get actions for multiple permits (batch) - Read operation, uses API route
export function usePermitActions(permitIds: string[]) {
  return useQuery({
    queryKey: ['permit-actions', permitIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      permitIds.forEach(id => params.append('permit_ids', id))
      const res = await fetch(`/api/permits/actions?${params}`)
      return res.json()
    },
    enabled: permitIds.length > 0,
    staleTime: 60_000, // 1 minute
  })
}

// Toggle action (save/ignore) - Mutation, uses server action
export function useTogglePermitAction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      permitId, 
      action 
    }: { 
      permitId: string
      action: 'saved' | 'ignored' 
    }) => {
      return await togglePermitAction(permitId, action)
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['permit-actions'] })
      queryClient.invalidateQueries({ queryKey: ['permits', 'search'] })
    },
  })
}
```

#### 2. UI Components

**`PermitActionButtons.tsx`** (New component)
```typescript
import { Bookmark, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTogglePermitAction } from '@/hooks/usePermitActions'
import { cn } from '@/lib/utils'

type Props = {
  permitId: string
  currentAction: 'saved' | 'ignored' | null
}

export function PermitActionButtons({ permitId, currentAction }: Props) {
  const toggleAction = useTogglePermitAction()
  
  const handleSave = () => {
    toggleAction.mutate({ 
      permitId, 
      action: 'saved' 
    })
  }
  
  const handleIgnore = () => {
    toggleAction.mutate({ 
      permitId, 
      action: 'ignored' 
    })
  }
  
  return (
    <div className="flex items-center gap-1">
      {/* Save Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              currentAction === 'saved' && "text-blue-600"
            )}
            onClick={(e) => {
              e.stopPropagation() // Prevent row click
              handleSave()
            }}
          >
            <Bookmark 
              size={16} 
              fill={currentAction === 'saved' ? 'currentColor' : 'none'}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {currentAction === 'saved' ? 'Unsave' : 'Save for later'}
        </TooltipContent>
      </Tooltip>
      
      {/* Ignore Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              currentAction === 'ignored' && "text-gray-400"
            )}
            onClick={(e) => {
              e.stopPropagation()
              handleIgnore()
            }}
          >
            {currentAction === 'ignored' ? (
              <EyeOff size={16} fill="currentColor" />
            ) : (
              <Eye size={16} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {currentAction === 'ignored' ? 'Unignore' : 'Ignore permit'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
```

**Modify `PermitsTableColumns.tsx`:**
```typescript
// Add new column at the start of columns array
{
  id: 'actions',
  header: '', // No header
  cell: ({ row }) => {
    const permitId = row.original.id
    // Get action state from table meta (passed from parent)
    const meta = table.options.meta as { 
      permitActions?: Record<string, 'saved' | 'ignored' | null> 
    } | undefined
    const currentAction = meta?.permitActions?.[permitId] || null
    
    return <PermitActionButtons permitId={permitId} currentAction={currentAction} />
  },
  size: 80,
  enableSorting: false,
}
```

**Modify `PermitsTable.tsx`:**
```typescript
// 1. Fetch actions for current page permits
const permitIds = data?.permits.map(p => p.id) || []
const { data: actionsData } = usePermitActions(permitIds)

// 2. Pass actions to table meta
const table = useReactTable({
  data: data?.permits || [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  // ... other config ...
  meta: {
    userLat: user?.address_lat,
    userLng: user?.address_lng,
    permitActions: actionsData?.actions || {},  // ← Add this
  },
})
```

#### 3. View Toggle Component

**`PermitViewToggle.tsx`** (New component)
```typescript
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const viewOptions = ['all', 'saved', 'ignored'] as const

type Props = {
  savedCount?: number
  ignoredCount?: number
}

export function PermitViewToggle({ savedCount, ignoredCount }: Props) {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(viewOptions).withDefault('all')
  )
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setView('all')}
      >
        All Permits
      </Button>
      
      <Button
        variant={view === 'saved' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setView('saved')}
      >
        Saved
        {savedCount !== undefined && savedCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {savedCount}
          </Badge>
        )}
      </Button>
      
      <Button
        variant={view === 'ignored' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setView('ignored')}
      >
        Ignored
        {ignoredCount !== undefined && ignoredCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {ignoredCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
```

**Add to `PermitsTable.tsx` (above table):**
```typescript
// Fetch counts for badge display
const { data: savedCount } = useQuery({
  queryKey: ['permits', 'saved-count', userId],
  queryFn: async () => {
    const res = await authenticatedFetch('/api/permits/actions/count?action=saved')
    return res.json()
  },
})

const { data: ignoredCount } = useQuery({
  queryKey: ['permits', 'ignored-count', userId],
  queryFn: async () => {
    const res = await authenticatedFetch('/api/permits/actions/count?action=ignored')
    return res.json()
  },
})

return (
  <div>
    <PermitViewToggle 
      savedCount={savedCount?.count} 
      ignoredCount={ignoredCount?.count} 
    />
    <Table>...</Table>
  </div>
)
```

### Performance Considerations

#### 1. Database Query Performance

**Default view (exclude ignored):**
```sql
-- BEFORE (naive approach - SLOW)
SELECT * FROM permits 
WHERE id NOT IN (
  SELECT permit_id FROM user_permit_actions 
  WHERE user_id = $1 AND action = 'ignored'
)

-- AFTER (optimized with LEFT JOIN)
SELECT p.* FROM permits p
LEFT JOIN user_permit_actions upa 
  ON p.id = upa.permit_id 
  AND upa.user_id = $1 
  AND upa.action = 'ignored'
WHERE upa.id IS NULL

-- Index ensures fast lookup
```

**With index:** `idx_user_permit_actions_user_action`
- Query time: ~20-30ms for 250K permits + 500 ignored

#### 2. Client-Side Caching

**Strategy:**
- Cache permit actions for 1 minute (React Query `staleTime: 60_000`)
- Invalidate on mutation (save/ignore action)
- Batch fetch actions for current page (not individual queries)

#### 3. Lazy Loading Actions

**Only fetch actions when needed:**
- User not logged in → Don't fetch actions
- "All" view → Only fetch ignored permit IDs (to exclude)
- "Saved" view → Fetch full saved permits
- "Ignored" view → Fetch full ignored permits

### Error Handling

**1. Network Failures**
- Optimistic UI updates (show icon change immediately)
- On error, revert icon state and show toast: "Failed to save permit. Try again."
- Retry logic in React Query (3 retries with exponential backoff)

**2. Authentication Failures**
- If user not logged in → Redirect to login
- If session expired → Refresh token, retry action

**3. Database Constraints**
- Unique constraint violation → Shouldn't happen (upsert logic prevents it)
- Foreign key violation (permit deleted) → Show error: "Permit no longer exists"

### Testing Plan

#### Unit Tests
- `usePermitActions` hook behavior
- `useTogglePermitAction` mutation logic
- Icon state rendering (saved/ignored/none)

#### Integration Tests
- Save permit → Appears in "Saved" view
- Ignore permit → Disappears from "All" view
- Toggle save twice → Returns to original state
- Save then ignore → Ignore wins (last action)

#### E2E Tests
- Anonymous user clicks save → Redirects to login
- Logged-in user saves permit → Persists across page refresh
- User views saved permits from mobile device → Same list as desktop

### Implementation Steps

#### Step 1: Database Setup
1. Create `user_permit_actions` table with RLS policies
2. Create indexes for performance
3. Test RLS policies work correctly (users can only see own actions)
4. Generate TypeScript types from Supabase schema

**Validation:** Manually insert/query actions via SQL, verify RLS works

---

#### Step 2: Server Actions & API Routes
1. Create server action `togglePermitAction` in `src/app/actions/permit-actions.ts`
2. Create `GET /api/permits/actions?permit_ids=...` for batch fetch (read-only)
3. Create `GET /api/permits/actions/count?action=saved` for count badges (read-only)
4. Modify `GET /api/permits/search` to support `?view=saved|ignored|all`
5. Add authentication checks to server actions
6. Write tests for server actions

**Validation:** Test server action from client component, test API with curl

---

#### Step 3: React Hooks
1. Create `usePermitActions` hook (fetch actions)
2. Create `useTogglePermitAction` hook (mutate)
3. Test hooks in isolation
4. Add error handling and loading states

**Validation:** Console log hook results, verify caching works

---

#### Step 4: UI Components
1. Create `PermitActionButtons` component (save/ignore icons)
2. Create `PermitViewToggle` component (All/Saved/Ignored tabs)
3. Add action column to `PermitsTableColumns`
4. Integrate hooks in `PermitsTable`
5. Style icons and tooltips
6. Test responsive design (mobile/tablet)

**Validation:** Click buttons, verify icons change state, check tooltips

---

#### Step 5: View Filtering
1. Add `view` query param to URL (nuqs)
2. Modify search API to filter by view
3. Update `PermitsTable` to pass view param
4. Test filtering: All/Saved/Ignored views
5. Add count badges to tabs

**Validation:** Switch views, verify correct permits shown

---

#### Step 6: Optimizations
1. Add optimistic UI updates (instant feedback)
2. Batch action fetches (one query per page, not per row)
3. Add loading skeletons during fetch
4. Test performance with 1000+ saved/ignored permits

**Validation:** Check network tab, verify single batch request

---

#### Step 7: Error Handling & Edge Cases
1. Handle anonymous users (redirect to login)
2. Handle network errors (show toast, retry)
3. Handle deleted permits (show "no longer available")
4. Test toggle behavior (save → ignore → unsave)
5. Add success toasts ("Permit saved", "Permit ignored")

**Validation:** Test all error scenarios manually

---

#### Step 8: Analytics & Monitoring
1. Track save/ignore events (Vercel Analytics or Posthog)
2. Log error rates (Sentry or Vercel Logs)
3. Monitor query performance (Supabase Dashboard)
4. Set up alerts for high error rates

**Validation:** Trigger events, verify they appear in analytics

---

### Future Enhancements

#### Phase 2: Bulk Actions
- Select multiple rows → "Save all" / "Ignore all"
- Requires checkbox column + action bar
- DB: Use `INSERT ... ON CONFLICT` for batch upsert

#### Phase 3: Notes & Tags
- Add notes to saved permits: "Follow up on Jan 20"
- Add tags: "High priority", "Waiting for callback"
- Modify `user_permit_actions` table:
  ```sql
  ALTER TABLE user_permit_actions
  ADD COLUMN notes TEXT,
  ADD COLUMN tags TEXT[];
  ```

#### Phase 4: Notifications
- Notify when saved permit status changes
- Notify when saved permit cost increases >20%
- Uses existing `user_notifications` table
- Triggered by daily cron job (compare saved permits to permit_changes)

#### Phase 5: Export Saved Permits
- Export to CSV, PDF, or Excel
- Useful for offline review, sharing with team
- Endpoint: `GET /api/permits/actions/export?format=csv`

#### Phase 6: Smart Suggestions
- "You ignored 10 permits in postal code M4B. Ignore all M4B permits?"
- "You saved 5 HVAC permits. Want to filter to HVAC only?"
- Uses ML to detect patterns, suggest bulk actions

---

## IMPLEMENTATION ROADMAP SUMMARY

**Step 1: Database & API (1-2 days)**
- Create table + RLS policies
- Build API routes
- Test with curl

**Step 2: Client Hooks (1 day)**
- React Query hooks
- Error handling
- Caching strategy

**Step 3: UI Components (2-3 days)**
- Action buttons in table
- View toggle tabs
- Integration with existing table
- Responsive design

**Step 4: Polish & Testing (1-2 days)**
- Optimistic updates
- Error handling
- Edge cases
- Analytics tracking

**Total Estimate: 5-8 days** (1-1.5 weeks)

---

## OPEN QUESTIONS

1. **Should we show a "Saved" count in the main navigation?**
   - **DECISION: No** - Keep main nav clean, counts only in view toggle

2. **Should ignored permits automatically expire after X days?**
   - Recommendation: No auto-expire initially, add in Phase 2
   - Rationale: Users can manually un-ignore if needed

3. **Should we limit saves to paid users only?**
   - **DECISION: No limits** - Unlimited saves for all users (free and paid)
   - Rationale: Core UX feature, shouldn't be paywalled

4. **Should we allow saving permits from email digest?**
   - Recommendation: Yes! Add "Save" CTA button to email cards
   - Requires adding permit action API call from email link

5. **What's the best way to place the view toggle?**
   - **DECISION:** Above table, lean button group with minimal vertical space
   - Compact design (h-9 buttons), left-aligned for easy access
   - Count badges show number of saved/ignored permits

---

## SUCCESS CRITERIA

**Launch Ready When:**
- ✅ Users can save/ignore permits with one click
- ✅ Icons update instantly (optimistic UI)
- ✅ Saved/Ignored views filter correctly
- ✅ Actions persist across sessions and devices
- ✅ Performance: <50ms to toggle action
- ✅ Zero data loss or corruption
- ✅ RLS policies prevent cross-user data access

**Product Success (30 days post-launch):**
- >40% of active users save at least 1 permit
- >60% of active users ignore at least 1 permit
- Users with saved permits have +15% retention
- <5% of actions are reversed (un-save/un-ignore)
- No security incidents (RLS works correctly)

---

## CONCLUSION

**Recommendation: Build Saved & Ignored Permits feature**

**Why:**
- High-impact UX improvement (reduces friction, adds value)
- Relatively simple implementation (5-8 days)
- Foundation for future features (notes, tags, notifications)
- Increases user engagement and retention
- Differentiates from competitors (most don't have this)

**Alternative Approaches Considered:**
- Local storage only → Rejected (doesn't sync across devices)
- Browser bookmarks → Rejected (not integrated, poor UX)
- External CRM integration → Rejected (too complex, not enough demand yet)

**Next Step:**
Start with Step 1 (Database Setup) and iterate through the roadmap.

