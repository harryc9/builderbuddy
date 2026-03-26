# Marketing & Sales Automation: 0 → $10K MRR

**Goal:** Reach $10K MRR with minimal time investment through automated marketing and sales  
**Current State:** Cold email via Instantly.ai  
**Target:** Solo founder, tech-focused, automated solutions only

---

## PRODUCT SECTION

### Current Marketing State

**What's Working:**
- Instantly.ai pre-warmed accounts set up
- Cold email templates written (personalized, founder-led approach)
- ICP defined (specialty trade contractors in Toronto)
- Product has clear value prop (save 4-6 hours/week on permit research)
- Pricing: $29/month (low friction)

**What's Missing:**
- No inbound lead gen (SEO, content, paid ads)
- No automated nurture sequences
- No product-led growth mechanics
- No referral program
- No social proof/testimonials
- No retargeting for website visitors
- No conversion optimization on landing page

### The Math: Path to $10K MRR

**Pricing:** $29/month  
**Target:** $10,000 MRR = **345 paying customers**

**Assumptions:**
- Trial-to-paid conversion: 25% (industry standard for B2B SaaS)
- Churn: 5% monthly (early stage, acceptable)
- Need ~14 trials/week to hit 345 customers in 6 months

**Monthly Targets:**
- Month 1: 20 customers ($580 MRR)
- Month 2: 50 customers ($1,450 MRR)
- Month 3: 100 customers ($2,900 MRR)
- Month 4: 175 customers ($5,075 MRR)
- Month 5: 260 customers ($7,540 MRR)
- Month 6: 345 customers ($10,005 MRR)

**Lead Volume Needed:**
- 56 trials/month = 14 trials/week
- At 25% conversion: 224 signups/month
- At 3% cold email conversion: 7,467 cold emails/month
- At 10% landing page conversion: 2,240 website visits/month

---

## Marketing Channels (Ranked by Automation + ROI)

### Tier 1: Highest Automation, Best ROI

#### 1. Cold Email (Instantly.ai)
**Current Status:** Active  
**Time Investment:** 2-3 hours/week  
**Cost:** $65-97/month  
**Expected Results:** 10-15 trials/month

**Why This Works:**
- Highly targeted (Apollo lists of Toronto contractors)
- Automated sending (set and forget)
- Personalized at scale
- Direct to decision-makers
- Fast feedback loop

**Optimization Plan:**
- A/B test subject lines (track open rates)
- A/B test email bodies (track reply rates)
- Segment by trade (HVAC vs electrical vs plumbing)
- Track which templates convert best
- Scale to 500 emails/month once optimized

**Action Items:**
- Launch first 200-contact campaign (this week)
- Analyze results after 2 weeks
- Iterate templates based on reply themes
- Scale winning template to 500/month
- Add 2nd email account for volume (if needed)

---

#### 2. SEO + Content Marketing (Long-Term)
**Current Status:** Not started  
**Time Investment:** 4-6 hours/month (batched)  
**Cost:** $0 (DIY) or $300/month (writer)  
**Expected Results:** 50-100 organic visitors/month by Month 3

**Why This Works:**
- Toronto contractors search "toronto building permits" every day
- Low competition keywords (niche + local)
- Content = SEO + nurture + trust-building
- Compounds over time (traffic grows automatically)
- Automated once published

**Content Strategy:**

**Pillar 1: SEO-optimized guides** (attract search traffic)
- "How to Search Toronto Building Permits (2025 Guide)"
- "Toronto Building Permit Process: Complete Timeline"
- "What GTA Contractors Need to Know About Building Permits"
- "Toronto Permit Fees: Complete Cost Breakdown"

**Pillar 2: Use case articles** (convert visitors)
- "How HVAC Contractors Find New Projects in Toronto"
- "Finding Electrical Projects: Toronto Permit Data Strategy"
- "Plumbing Contractor Lead Gen: Toronto Building Permits"

**Pillar 3: Market intelligence** (demonstrate expertise)
- "Toronto Construction Trends: Q4 2025 Permit Analysis"
- "Which Toronto Neighborhoods Have the Most Construction?"
- "Average Toronto Building Permit Costs by Type"

**Implementation:**
- Write 2 articles/month (or outsource to Upwork writer)
- Optimize for keywords: "toronto building permits", "gta construction permits"
- Internal link to signup page
- Add CTA at end: "Get these permits delivered daily"

**Technical Setup:**
- Add `/blog` route to Next.js
- Use MDX for blog posts (easy to write)
- Add sitemap.xml for Google
- Add robots.txt
- Submit to Google Search Console

---

#### 3. Product-Led Growth Mechanics
**Current Status:** Not implemented  
**Time Investment:** 1 week dev time  
**Cost:** $0  
**Expected Results:** 10-20% increase in trial signups, 5-10% increase in conversions

**Why This Works:**
- Removes friction from signup
- Provides immediate value
- Lets product sell itself
- Automated once built

**PLG Optimizations:**

**A. Remove friction in signup:**
- Allow searching permits BEFORE signing up (limited to 10 results)
- Show full table UI on landing page (interactive demo)
- One-click social login (Google, Microsoft)
- No credit card for trial

**B. Instant gratification in trial:**
- Show permits immediately after signup (don't wait for email)
- Auto-populate filters based on email domain (if @hvaccompany.com → auto-select HVAC)
- Send welcome email with setup tips within 5 minutes
- Day 1 email: "Your first digest will arrive tomorrow at 5 AM"

**C. Activation triggers:**
- Track key activation events: search, filter, export CSV
- Send automated emails when user doesn't activate:
  - Day 2: "Haven't logged in yet? Here's what you're missing"
  - Day 3: "Need help setting up? Reply to this email"
  - Day 5: "Your trial ends in 2 days - here's what you found"

**D. Viral mechanics:**
- "Share this permit with a colleague" button (email + social)
- "Invite team member" for multi-seat (coming soon)
- Email signature: "Sent from 416permits - Find Toronto building permits daily"

---

#### 4. Paid Ads (Google Ads)
**Current Status:** Not started  
**Time Investment:** 2 hours setup, 1 hour/week monitoring  
**Cost:** $300-500/month ad spend  
**Expected Results:** 30-50 trials/month at $10-15 CAC

**Why This Works:**
- High-intent keywords (people searching for solution)
- Toronto-specific targeting
- Instant traffic (no waiting for SEO)
- Automated bidding (Google AI optimizes)

**Google Ads Strategy:**

**Campaign 1: Search Ads (High Intent)**

**Keywords:**
- "toronto building permits" (exact match)
- "toronto construction permits" (exact match)
- "toronto permit search" (exact match)
- "find toronto building permits" (phrase match)
- "toronto permit data" (phrase match)

**Ad Copy:**
```
Headline: Toronto Building Permits - Delivered Daily
Description: Search 300K+ permits. Filter by trade, cost, location. Free 7-day trial.
```

**Landing Page:**
- Send directly to signup page (not homepage)
- A/B test headlines, images, CTAs
- Add trust signals: "47 Toronto contractors use 416permits"

**Budget:**
- Start with $300/month ($10/day)
- Bid on long-tail keywords first (cheaper)
- Track cost per trial signup (goal: <$15)
- Scale winning keywords

**Campaign 2: Remarketing (Bring Back Visitors)**
- Show ads to people who visited site but didn't sign up
- Banner ads: "Come back to 416permits - Start your free trial"
- Lower cost (display ads cheaper than search ads)

---

#### 5. Automated Email Nurture Sequences
**Current Status:** Only trial reminders  
**Time Investment:** 1 day setup  
**Cost:** $0 (Resend already set up)  
**Expected Results:** 10-15% increase in trial-to-paid conversion

**Why This Works:**
- Educates users during trial
- Builds trust and urgency
- Automated once set up
- Re-engages inactive users

**Email Sequences:**

**Sequence 1: Trial Onboarding (7 days)**

**Day 0 (signup):**
- Subject: "Welcome to 416permits!"
- Content: How to set up filters, what to expect, when first digest arrives

**Day 1 (morning after first digest):**
- Subject: "Your first permit digest is here"
- Content: How to use dashboard, export CSV, save permits

**Day 2:**
- Subject: "How HVAC contractors use 416permits"
- Content: Case study, example workflow, tips

**Day 3:**
- Subject: "Did you know? Status change alerts"
- Content: Feature highlight (coming soon), value prop

**Day 5:**
- Subject: "Your trial ends in 2 days"
- Content: What you found (X permits), time saved (Y hours), ROI calc

**Day 6:**
- Subject: "Last day of trial - 24 hours left"
- Content: Urgency, CTA to subscribe, what happens if you don't

**Day 8 (after trial ends):**
- Subject: "Your trial has ended"
- Content: Re-engage, offer 3-day extension if they reply

**Sequence 2: Inactive User (Didn't log in during trial)**

**Day 3 (if no login):**
- Subject: "Having trouble with 416permits?"
- Content: Offer help, reply to email, quick call

**Day 5 (if still no login):**
- Subject: "We found 47 permits for you this week"
- Content: Show them what they're missing, real examples

**Sequence 3: Churned User (Canceled subscription)**

**Day 1 (after cancel):**
- Subject: "Sorry to see you go"
- Content: Ask for feedback, offer discount to return

**Day 30 (after cancel):**
- Subject: "New features since you left"
- Content: Re-engage with product updates, special offer

---

### Tier 2: Medium Automation, Good ROI

#### 6. LinkedIn Outreach
**Current Status:** Not started  
**Time Investment:** 3-4 hours/week  
**Cost:** LinkedIn Sales Navigator $79/month  
**Expected Results:** 5-10 trials/month

**Why This Works:**
- Direct access to decision-makers
- Toronto contractors are on LinkedIn
- Can message without email
- Less saturated than email

**Strategy:**
- Search: "HVAC contractor Toronto" OR "Electrical contractor Toronto"
- Filter: Greater Toronto Area, 10-100 employees
- Send connection request with note: "Hi [Name], saw you're in [trade] in Toronto. Built a tool you might find useful for finding permit leads."
- After acceptance: "Quick question: how much time do you spend searching Toronto permits each week?"
- Share link if interested

**Automation:**
- Use LinkedIn Sales Navigator saved searches (auto-updates)
- Template messages (personalize first line)
- Track replies in spreadsheet
- Scale to 50 connections/week

---

#### 7. Partnerships & Referrals
**Current Status:** Not started  
**Time Investment:** 2-3 hours/week  
**Cost:** $0 (revenue share)  
**Expected Results:** 10-20 trials/month by Month 3

**Why This Works:**
- Trusted referrals convert 3-5x better
- Partners have existing audiences
- Passive lead gen once set up

**Partnership Targets:**

**1. Construction software companies:**
- Procore, Buildertrend, CoConstruct users
- Offer affiliate commission: 20% recurring revenue
- Co-marketing: webinar, guest blog post

**2. Trade associations:**
- HVAC Association of Toronto
- Electrical Contractors Association of Ontario
- Ontario Plumbing Inspectors Association
- Offer discount for members

**3. Suppliers & equipment rental:**
- HVAC suppliers, electrical wholesalers
- They want same data (permit leads)
- Cross-promote to their customers

**4. Accounting/bookkeeping firms:**
- Serve contractors, know pain points
- Affiliate commission for referrals

**Implementation:**
- Create affiliate program (Rewardful or manual)
- Outreach to 20 potential partners
- Offer rev share: 20% for 12 months
- Track referrals via UTM codes

---

#### 8. Local Citations & Directories
**Current Status:** Not started  
**Time Investment:** 8 hours (one-time)  
**Cost:** $0-300 (DIY vs Fiverr)  
**Expected Results:** 10-20 organic visitors/month

**Why This Works:**
- Toronto contractors search local directories
- Improves Google Maps ranking
- One-time effort, long-term benefit

**Directories to Submit:**
- Google Business Profile (critical)
- Yelp
- Yellow Pages Canada
- Clutch (for B2B software)
- Capterra
- G2
- Product Hunt (launch announcement)
- BetaList (if still in beta)
- Construction software directories

**Google Business Profile Setup:**
- Category: Software Company
- Service Area: Greater Toronto Area
- Description: "Search 300,000+ Toronto building permits..."
- Photos: Dashboard screenshots, team photo
- Posts: Weekly updates about permit trends

---

### Tier 3: Low Automation, Okay ROI

#### 9. Community Building (Reddit, Forums)
**Current Status:** Not started  
**Time Investment:** 2-3 hours/week  
**Cost:** $0  
**Expected Results:** 5-10 trials/month

**Target Communities:**
- r/Toronto
- r/TorontoConstruction (if exists)
- r/SmallBusiness
- r/Entrepreneur
- Construction forums (contractor talk)

**Strategy:**
- Provide value first (answer questions about permits)
- Soft pitch: "I built a tool for this"
- Share permit data insights (free value)
- Example: "Toronto permit trends this month: X residential, Y commercial"

**Rules:**
- Don't spam
- 10:1 ratio (10 helpful comments per 1 promotional post)
- Genuine engagement only

---

#### 10. Direct Mail (Physical Letters)
**Current Status:** Not started  
**Time Investment:** 4 hours setup  
**Cost:** $2-3 per letter  
**Expected Results:** 3-5% response rate

**Why This Works:**
- Contractors get ZERO physical mail for software
- Stands out in mailbox
- High perceived value
- Older contractors prefer physical

**Strategy:**
- Buy Toronto contractor addresses (Yellow Pages, Apollo)
- Send personalized letter:
  - "We found 47 HVAC permits in North York last month"
  - "Tired of manually searching the city portal?"
  - Include QR code to signup page
- Follow up with email 1 week later

**Test:**
- Send 100 letters to HVAC contractors
- Track response rate via unique QR code
- Scale if >3% response

---

## Tech-First Automation Stack

### Tools Needed

**Email Marketing:**
- Resend (already have) - $0-10/month
- Instantly.ai (cold email) - $65-97/month

**Analytics:**
- PostHog or Plausible - $0-20/month
- Track: signups, trial starts, conversions, churn

**CRM (Optional for now):**
- Notion database (free)
- Track: leads, status, last contact, notes

**SEO:**
- Google Search Console (free)
- Ahrefs or SEMrush (optional, $99/month)

**Paid Ads:**
- Google Ads - $300-500/month ad spend

**Affiliate/Referral:**
- Rewardful - $49/month
- Or manual tracking in Notion

**Total Monthly Cost:** $500-800/month

---

## Metrics to Track (Automated Dashboard)

### Acquisition Metrics
- **Website visitors:** Total, organic, paid, referral
- **Signup rate:** Visitors → signups (goal: 5-10%)
- **Source breakdown:** Cold email, SEO, paid ads, referral

### Activation Metrics
- **Trial starts:** Signups → trial starts (goal: 80%+)
- **First action:** % who search/filter/export in first session
- **Email open rate:** % who open first digest (goal: 60%+)

### Conversion Metrics
- **Trial-to-paid:** % who convert (goal: 25-30%)
- **Days to convert:** Average days in trial before paying
- **Conversion rate by source:** Which channels convert best

### Retention Metrics
- **Monthly churn:** % who cancel (goal: <5%)
- **MRR:** Monthly recurring revenue (goal: $10K)
- **Customer lifetime value:** Average revenue per customer

### Engagement Metrics
- **Daily email open rate:** % who open digests (goal: 50%+)
- **Dashboard logins:** Avg logins per user per week (goal: 2-3)
- **CSV exports:** % who export permits (goal: 40%+)

---

## Weekly Operating Rhythm (2-3 hours/week)

### Monday (30 min)
- Review metrics from last week
- Check cold email results (opens, replies)
- Respond to any cold email replies

### Wednesday (45 min)
- Write 1 blog post outline OR review draft
- Check Google Ads performance
- Adjust bids if needed

### Friday (45 min)
- Review trial signups this week
- Check trial-to-paid conversions
- Send manual follow-up to high-value prospects
- Plan next week's tasks

### Monthly (2 hours)
- Analyze channel performance (what's working?)
- A/B test results review
- Adjust budgets (double down on winners)
- Plan next month's content

---

## Optimization Priorities (Do These First)

### Week 1-2: Launch Cold Email
- Upload 200 contacts to Instantly.ai
- Configure 3-email sequence
- Launch campaign
- **Expected output:** 4-6 trials

### Week 3-4: Optimize Landing Page
- Add social proof ("47 Toronto contractors")
- Add permit preview table (interactive)
- A/B test headline
- Add exit-intent popup ("Wait! Start your free trial")
- **Expected output:** 5% → 8% conversion rate

### Month 2: Launch SEO Content
- Write 4 pillar articles
- Optimize for "toronto building permits"
- Submit to Google Search Console
- Share on LinkedIn, Reddit
- **Expected output:** 20-30 organic visitors

### Month 3: Launch Google Ads
- Set up Search campaign
- Budget: $300/month
- Target high-intent keywords
- Track cost per trial
- **Expected output:** 20-30 trials at $10-15 CAC

### Month 4: Add Nurture Sequences
- Build 7-day trial onboarding sequence
- Add inactive user re-engagement
- Add churned user win-back
- **Expected output:** +10% trial-to-paid conversion

### Month 5: Launch Partnerships
- Reach out to 20 potential partners
- Set up affiliate program
- Create partner landing pages
- **Expected output:** 10-15 trials from referrals

### Month 6: Scale What Works
- Double down on best-performing channel
- Increase cold email volume (500/month)
- Increase Google Ads budget ($500/month)
- Scale content (4 articles/month)
- **Expected output:** Hit $10K MRR

---

## What NOT to Do (Time Wasters)

**❌ Conferences & Trade Shows**
- High time investment (2-3 days per event)
- Expensive ($2-5K per show)
- Hard to track ROI
- Not automated

**❌ Podcasts & PR**
- Low conversion rate
- Hard to track attribution
- Time-consuming (prep + interview)
- Better for brand, not leads

**❌ Twitter/Social Media Growth**
- Requires daily engagement
- Slow growth
- Low conversion to B2B SaaS
- Not automated

**❌ Complex Integrations**
- Zapier workflows, Salesforce sync, API partnerships
- High dev time
- Low impact on 0→$10K
- Do after hitting $10K

**❌ Video Content (YouTube)**
- High production time
- Slow growth
- Better for consumer, not B2B contractors
- Do after hitting $50K MRR

---

## Success Criteria by Month

### Month 1 ($580 MRR - 20 customers)
- ✅ Cold email campaign launched (200 contacts)
- ✅ Landing page optimized (8%+ conversion)
- ✅ Analytics tracking set up
- ✅ Trial onboarding sequence live
- **KPI:** 80 trials, 20 conversions (25% rate)

### Month 2 ($1,450 MRR - 50 customers)
- ✅ 4 SEO articles published
- ✅ 2nd cold email campaign (200 more contacts)
- ✅ Google Business Profile claimed
- ✅ Churned user win-back sequence
- **KPI:** 120 new trials, 30 conversions

### Month 3 ($2,900 MRR - 100 customers)
- ✅ Google Ads launched ($300 budget)
- ✅ 4 more SEO articles
- ✅ Affiliate program set up
- ✅ 5 partnerships signed
- **KPI:** 200 new trials, 50 conversions

### Month 4 ($5,075 MRR - 175 customers)
- ✅ Google Ads scaled ($500 budget)
- ✅ Cold email scaled (500/month)
- ✅ LinkedIn outreach started
- ✅ Product-led growth features shipped
- **KPI:** 300 new trials, 75 conversions

### Month 5 ($7,540 MRR - 260 customers)
- ✅ Content marketing at 8 articles/month
- ✅ Referral program launched
- ✅ Retargeting ads live
- ✅ Local citations completed
- **KPI:** 340 new trials, 85 conversions

### Month 6 ($10,005 MRR - 345 customers)
- ✅ All channels optimized
- ✅ Doubled down on winners
- ✅ Automated reporting dashboard
- ✅ Churn <5% monthly
- **KPI:** 340 new trials, 85 conversions

---

## Quick Wins (This Week)

1. **Launch cold email campaign** (200 contacts) - 3 hours
2. **Add social proof to landing page** - 30 min
3. **Set up Google Search Console** - 30 min
4. **Create Notion tracker for leads** - 30 min
5. **Write first SEO article outline** - 1 hour

**Total time:** 5.5 hours  
**Expected outcome:** 4-6 trials this month

---

## Questions to Answer Before Starting

1. **What's your risk tolerance for ad spend?** ($300-500/month okay?)
2. **Can you write blog posts or need to outsource?** (Affects timeline)
3. **Do you have Apollo/ZoomInfo for lead lists?** (For cold email scaling)
4. **What's your current website conversion rate?** (Baseline for optimization)
5. **Do you have testimonials/case studies yet?** (For social proof)

---

## Next Steps

1. **This week:** Launch first 200-contact cold email campaign
2. **Next week:** Optimize landing page (add social proof, permit preview)
3. **Week 3-4:** Write first 2 SEO articles
4. **Month 2:** Launch Google Ads + scale cold email

**Should I help you implement Step 1 (cold email campaign)?**

