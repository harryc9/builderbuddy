# When Do Contractors Want to Know About Permits?

## The Permit Lifecycle

```
Application → Under Review → Ready for Issuance → Permit Issued → Inspection → Complete
```

## Contractor Timing Strategies

### Strategy 1: Early Bird (Application/Under Review)
**When to reach out:** During application or review phase

**Pros:**
- Get in before competition
- Build relationship with builder early
- Influence material/subcontractor selection
- Negotiate better rates (builder hasn't committed yet)
- More time to prepare/schedule

**Cons:**
- Project might not get approved
- Timeline uncertain (could be weeks/months)
- Builder might change plans
- Wasted effort if permit denied

**Best for:**
- Established contractors with existing builder relationships
- Larger projects ($500k+)
- Specialty trades (unique value prop)

---

### Strategy 2: Ready to Start (Permit Issued)
**When to reach out:** Immediately after "Permit Issued" status

**Pros:**
- ✅ Project confirmed (approved by city)
- ✅ Work starting soon (urgent need)
- ✅ Builder actively hiring subs
- ✅ Clear timeline
- ✅ High conversion rate

**Cons:**
- Builder might already have subs lined up
- Less time to negotiate
- Competitive (other contractors see it too)

**Best for:**
- Most contractors (sweet spot)
- Quick-turnaround trades
- Volume-based businesses

---

### Strategy 3: In Progress (Inspection Phase)
**When to reach out:** During construction

**Pros:**
- See actual progress
- Builder might need replacement subs
- Emergency opportunities (original sub failed)

**Cons:**
- ❌ Too late for most trades
- ❌ Only relevant for later-stage work (finishing, landscaping)
- ❌ Lower volume of opportunities

**Best for:**
- Finishing trades (drywall, painting, flooring)
- Remedial work specialists
- Last-minute contractors

---

## Recommendation: Multi-Stage Alerts

### Critical Priority: Status Changes

**HIGH URGENCY (24h window):**
1. `Ready for Issuance → Permit Issued` ⭐⭐⭐
   - Project approved, work starting imminently
   - Builder needs subs NOW

2. `Under Review → Ready for Issuance`
   - Project about to be approved (1-2 days)
   - Early bird opportunity

3. `Permit Issued → Inspection`
   - Work has started
   - Still relevant for some trades

**MEDIUM URGENCY (3-7 day window):**
4. `Application → Under Review`
   - Project moving forward
   - Early relationship building

5. Cost increases >20%
   - Scope expansion = more work
   - Builder might need additional subs

6. Builder assignment
   - `null → Builder Name`
   - Contact info now available

**LOW URGENCY:**
7. Minor updates (address changes, description edits)

---

## Email Strategy

### Daily Digest Segmentation:

**Section 1: 🚨 URGENT - Ready to Start**
- Status just changed to "Permit Issued" (last 24h)
- Builder needs subs immediately
- Call to action: "Contact builder today"

**Section 2: 🔥 Coming Soon - About to Start**
- Status: "Ready for Issuance" or "Issuance Pending"
- Will be issued in next 1-3 days
- Call to action: "Get ahead of competition"

**Section 3: 📋 Early Opportunities**
- New applications (last 3 days)
- Under Review phase
- Call to action: "Build relationship early"

---

## Scoring Algorithm Updates

Current scoring prioritizes critical changes equally. We should differentiate:

```typescript
// Status change scoring (0-30 points instead of flat 25)
if (permit.has_recent_critical_change && permit.latest_change) {
  const oldStatus = permit.latest_change.old_values?.status
  const newStatus = permit.latest_change.new_values?.status
  
  // HIGH URGENCY - Immediate action needed
  if (newStatus === 'Permit Issued') {
    score += 30 // Was: 25
  }
  else if (newStatus === 'Ready for Issuance') {
    score += 25
  }
  else if (newStatus === 'Inspection') {
    score += 20
  }
  
  // MEDIUM URGENCY
  else if (newStatus === 'Under Review') {
    score += 15
  }
  
  // Other changes
  else {
    score += 10
  }
}
```

---

## User Preferences (Future)

Let users choose their strategy:

```
Email Timing Preference:
( ) Early Bird - Notify me when permits are submitted/under review
(•) Ready to Start - Notify me when permits are issued (Default)
( ) All Updates - Notify me of any status changes

Urgency Filter:
[x] Critical (Permit Issued)
[x] High (Ready for Issuance)
[ ] Medium (Under Review)
[ ] Low (All other changes)
```

---

## Data to Support Decision

Query to analyze conversion:
```sql
-- Which status changes get the most email opens/clicks?
SELECT 
  pc.change_type,
  pc.old_values->>'status' as old_status,
  pc.new_values->>'status' as new_status,
  COUNT(*) as change_count,
  -- Future: JOIN with email_opens/clicks when we have that data
FROM permit_changes pc
WHERE pc.business_impact = 'CRITICAL'
GROUP BY 1,2,3
ORDER BY change_count DESC
```

---

## Conclusion

**For MVP:** Focus on "Permit Issued" status changes
- Highest urgency
- Clearest action (builder needs subs now)
- Best conversion rate
- Easiest to explain to users

**Post-launch:** A/B test with early-stage alerts and measure:
- Email open rates by timing
- Click-through rates
- User feedback ("too early" vs "too late")
- Conversion to paid plans

The sweet spot is likely **24-48h after "Permit Issued"** - project confirmed, builder hiring, not too late.



