# Landing Page Redesign - Dual ICP Strategy

**Last Updated:** November 20, 2025  
**Status:** Planning  
**Goal:** Showcase both Primary ICPs (GCs and Specialty Subs) with clear use case differentiation

---

## PRODUCT CONTEXT

### Two Primary ICPs with Different Permit Status Needs:

**Primary ICP 1A: Specialty Trade Contractors (Subs)**
- **Permit Status:** "Permit Issued" (GC already attached, selecting subs)
- **Use Case:** Find GCs who need their specific trade
- **Timing:** Day permits are issued = first-mover advantage
- **Volume:** 1,000+ in GTA
- **WTP:** $200-500/month

**Primary ICP 1B: General Contractors (GCs)**
- **Permit Status:** "Application Filed" / "Under Review" (before GC selected)
- **Use Case:** Find projects before developer picks a GC
- **Timing:** 2-4 weeks before permit issued = early relationship building
- **Volume:** 300-500 in GTA
- **WTP:** $400-800/month

---

## CURRENT LANDING PAGE STRUCTURE

### Section 1: Hero (KEEP AS IS)

**Current elements:**
- Headline: "Every GTA building permit searchable and delivered"
- Subheadline: "Search 300,000+ Toronto-area permits by trade, address, and cost. Get new and updated permits delivered every morning."
- Stats: 255K+ permits tracked, $285K avg project value, 5 AM daily delivery
- Permit table preview (3 rows)
- Auth form on right side (desktop) / bottom (mobile)

**Keep this section** - it's clear, conversion-focused, and works well.

---

## SECTION 2: USE CASES FOR MAIN ICPs (NEW)

### Goal
Immediately clarify which use case applies to the visitor based on their contractor type.

### Layout Option A: Side-by-Side Cards

```
┌─────────────────────────────────────────────────────────────┐
│  WHO IS THIS FOR?                                           │
├──────────────────────────┬──────────────────────────────────┤
│  FOR GENERAL CONTRACTORS │  FOR SPECIALTY CONTRACTORS       │
│  ├─ Icon/Image           │  ├─ Icon/Image                   │
│  ├─ Use Case             │  ├─ Use Case                     │
│  ├─ Timing Advantage     │  ├─ Timing Advantage             │
│  └─ Example              │  └─ Example                      │
└──────────────────────────┴──────────────────────────────────┘
```

### Layout Option B: Tabbed Interface

```
┌─────────────────────────────────────────────────────────────┐
│  [ General Contractors ]  [ Specialty Contractors ]         │
├─────────────────────────────────────────────────────────────┤
│  [Content for selected tab]                                 │
│  - Use case description                                     │
│  - Timing advantage                                         │
│  - Example permits                                          │
│  - CTA                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Layout Option C: Accordion/Expandable

```
┌─────────────────────────────────────────────────────────────┐
│  > Are you a General Contractor?                            │
│    [Expanded: use case, example, CTA]                       │
│                                                             │
│  > Are you a Specialty Trade Contractor?                   │
│    [Collapsed]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## RECOMMENDED: Layout Option A (Side-by-Side Cards)

### Why:
- Both ICPs are equally important (Tier 1A and 1B)
- No interaction required (passive information)
- Mobile-friendly (stack vertically)
- Clear visual separation
- Easy to scan

### Content Structure:

#### Card 1: General Contractors

**Headline:** "For General Contractors"

**Use Case (1 sentence):**
"See permit applications before the developer picks a GC"

**Timing Advantage:**
- Icon: ⚡ or 🎯
- Text: "2-4 weeks earlier than competitors"
- Detail: "Contact developers at application stage, before permit is issued"

**Example Permit:**
```
📍 123 Yonge St, Toronto
💰 $4.2M commercial renovation
📋 Status: Application Filed (Nov 18)
👤 Developer: XYZ Properties
→ GC not selected yet
```

**Stat:**
"GCs using 416permits contact 8-10 new developers per month"

**CTA:** "See Application-Stage Permits →"

---

#### Card 2: Specialty Trade Contractors

**Headline:** "For Specialty Trade Contractors"

**Use Case (1 sentence):**
"Find GCs who need your trade the day permits are issued"

**Timing Advantage:**
- Icon: ⚡ or 🎯
- Text: "Same-day alerts, before competitors"
- Detail: "Call GCs when they're selecting subs, not 2 weeks late"

**Example Permit:**
```
📍 456 King St, Toronto
💰 $1.8M office renovation
📋 Status: Permit Issued (Nov 18)
👤 GC: Premier Builders Inc.
⚙️ Trades: HVAC, Electrical, Plumbing
```

**Stat:**
"Subs using 416permits find 10-30 qualified leads per week"

**CTA:** "See Issued Permits for Your Trade →"

---

## DESIGN SPECS

### Card Styling

**General Contractors Card:**
- Border: Blue (#2563EB) 2px
- Background: Blue tint (#EFF6FF)
- Icon color: Blue
- CTA button: Blue solid

**Specialty Contractors Card:**
- Border: Green (#16A34A) 2px
- Background: Green tint (#F0FDF4)
- Icon color: Green
- CTA button: Green solid

### Responsive Behavior

**Desktop (≥1024px):**
- Two cards side-by-side
- Equal width (50/50)
- 24px gap between cards

**Tablet (768px - 1023px):**
- Two cards side-by-side
- Equal width
- 16px gap

**Mobile (<768px):**
- Stack vertically
- Full width
- 16px gap between cards

---

## SECTION 3: HOW IT WORKS (EXISTING - KEEP)

Current section showing:
- Search filters
- Daily email digest
- Status change alerts

**Keep as is** - it's clear and educational.

---

## SECTION 4: SOCIAL PROOF (EXISTING - KEEP)

Current section showing:
- Testimonials (if any)
- Trust badges
- Customer logos (if any)

---

## COPYWRITING GUIDELINES

### For GC Card:
**Focus on:**
- "Before GC is selected"
- "Application stage"
- "2-4 weeks earlier"
- "Contact developers directly"
- "Win bids before competitors know projects exist"

**Avoid:**
- "Subcontractor" language
- "Trade" language
- "Issued permits" (that's too late for them)

### For Sub Card:
**Focus on:**
- "Permits just issued"
- "GCs selecting subs now"
- "Your specific trade"
- "Same-day alerts"
- "Before competitors call"

**Avoid:**
- "Developer" language
- "Application stage" (that's too early for them)
- "Prime contractor" language

---

## CTA BEHAVIOR

### Option 1: Direct to Signup (Simpler)
Both CTAs go to same signup page, no differentiation needed yet

### Option 2: Filtered Onboarding (Better UX)
- GC CTA → `/signup?type=gc` (sets contractor_type in URL)
- Sub CTA → `/signup?type=sub` (sets contractor_type in URL)
- Onboarding flow asks different questions based on type

**Recommended:** Option 2 (better personalization)

---

## IMPLEMENTATION NOTES

### Component Structure
```typescript
<LandingPage>
  <HeroSection /> {/* Keep existing */}
  <UseCaseSection> {/* NEW */}
    <UseCaseCard 
      type="gc" 
      title="For General Contractors"
      useCase="..."
      example={...}
      cta="See Application-Stage Permits"
    />
    <UseCaseCard 
      type="sub" 
      title="For Specialty Trade Contractors"
      useCase="..."
      example={...}
      cta="See Issued Permits for Your Trade"
    />
  </UseCaseSection>
  <HowItWorksSection /> {/* Keep existing */}
  <SocialProofSection /> {/* Keep existing */}
</LandingPage>
```

### Data Requirements
- No new data needed
- Example permits can be hardcoded (for visual clarity)
- Stats can be approximated based on user behavior

---

## SUCCESS METRICS

**After launching new use case section:**

### Engagement Metrics:
- Time on page (expect +20-30% as users read use cases)
- Scroll depth (expect 80%+ reach Section 2)
- CTA clicks from use case cards

### Conversion Metrics:
- Signup rate (expect slight increase as messaging is clearer)
- Trial activation (expect +10-15% as users understand value prop better)
- Paid conversion (expect +5-10% as self-qualification improves)

### Qualitative Feedback:
- Customer interviews: "Did you understand which use case applied to you?"
- Onboarding surveys: "What type of contractor are you?"
- Support tickets: Fewer "this isn't relevant to me" complaints

---

## OPEN QUESTIONS

1. **Should we show permit table in Section 1 or move to Section 2?**
   - Option A: Keep in hero (shows data immediately)
   - Option B: Move to use case cards (show relevant examples per ICP)

2. **Should we add a "Which are you?" quiz/button?**
   - Could help visitors self-select faster
   - Adds interaction complexity

3. **Should CTAs differ in copy?**
   - "Start Free Trial" (generic)
   - vs "See Application Permits" / "See Issued Permits" (specific)

4. **Should we mention pricing in use case cards?**
   - GCs: $400-800/month
   - Subs: $200-500/month
   - Pro: Clear expectations
   - Con: May cause sticker shock before seeing value

---

## NEXT STEPS

1. **Get feedback on layout options** (A, B, or C?)
2. **Finalize copy for both cards**
3. **Design mockups** (Figma or similar)
4. **Implement in `Landing.tsx`**
5. **A/B test** (new vs old) for 2 weeks
6. **Measure impact** on signup rate and trial activation

---

## REVISION HISTORY

- **November 20, 2025** - Initial landing page redesign doc created to showcase dual ICP strategy (GCs and Specialty Subs) based on permit status differentiation

