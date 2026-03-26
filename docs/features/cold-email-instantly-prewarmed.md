# Cold Email Campaign - Instantly.ai Setup Guide

**Status:** Pre-warmed accounts connected ✅  
**Next:** Upload contacts → Write emails → Launch campaign  
**Primary Target:** Specialty Trade Contractors (HVAC, Electrical, Plumbing, Roofing, etc.)

---

## STEP 1: Upload Your 200 Contacts

### STEP 1A: Upload GC Contacts (100)

## STEP 1: Upload Your 200 Contacts

### Prepare CSV File

**Format your email list as CSV:**

```csv
email,first_name,company_name,trade
john@hvaccompany.com,John,HVAC Solutions,HVAC
sarah@electricalworks.com,Sarah,Electrical Works,Electrical
mike@plumbingpro.com,Mike,Plumbing Pro,Plumbing
```

**Required columns:**
- `email` (required)
- `first_name` (recommended for personalization)
- `company_name` (optional)
- `trade` (optional - HVAC, Electrical, Plumbing, etc.)

### Upload to Instantly

1. Go to **Leads** in left sidebar
2. Click **Add Leads** (top right)
3. Click **Upload CSV**
4. Select your CSV file
5. Map columns:
   - Email → email
   - First Name → first_name
   - Company → company_name
   - Trade → trade (custom field)
6. Click **Upload**

**Result:** ~200 leads added

---

## STEP 2: Create Campaign

1. Go to **Campaigns** in left sidebar
2. Click **New Campaign** (top right)
3. Name: "Toronto Contractors - Nov 2025"
4. Click **Create**

---

## STEP 3: Add Email Sequence

### Email 1 - Initial Outreach

**Subject:** `{{firstName}}, tired of manually searching Toronto permits?`

**Body:**
```
Hi {{firstName}},

Quick question: How much time do you spend searching Toronto's permit portal for new {{customfield.trade}} projects?

Most contractors I talk to say 3-5 hours per week, manually filtering through hundreds of irrelevant permits.

We built 416permits to solve this:

→ Daily email with permits matching YOUR trade and service area
→ Filter by cost, location, status  
→ Alerts when permits change status (Issued → Inspection)

Example: If you're an HVAC contractor in North York, you'd see:
• "123 Main St - $450K renovation - HVAC system replacement"
• "456 Queen St - $780K commercial build - HVAC installation"  

Try it free for 7 days (no credit card):
https://416permits.com/signup?utm_source=instantly&utm_campaign=nov2025

Quick question: What's your service area (postal codes)?  
I'll set up a custom filter for you.

Best,
[Your Name]
[Your Title]
416permits

---
416permits Inc | Toronto, ON
```

**Wait:** 3 days

---

### Email 2 - Follow-up (Value)

**Subject:** `Toronto {{customfield.trade}} permits - example`

**Body:**
```
Hi {{firstName}},

Following up on my last email about 416permits.

Here's what went live in Toronto yesterday for {{customfield.trade}} contractors:

1. 789 King St - $620K commercial renovation - Status: Permit Issued
2. 321 Queen St - $450K office buildout - Status: Inspection
3. 654 Main St - $380K retail space - Status: Permit Issued

Most contractors find out about these 2-3 weeks late, after calling the project owner.

With 416permits, you get these alerts at 6 AM the day they're issued.

Still interested? Free 7-day trial:
https://416permits.com/signup?utm_source=instantly&utm_campaign=nov2025

Best,
[Your Name]
```

**Wait:** 4 days

---

### Email 3 - Final Follow-up (Breakup)

**Subject:** `Last email from me`

**Body:**
```
Hi {{firstName}},

I'll keep this short - last email from me.

I noticed you didn't respond, so I'm guessing either:
1. Not interested in permit alerts
2. Already have a system that works
3. Timing isn't right

All good - just wanted to close the loop.

If you ever need daily Toronto construction permit alerts, we're here:
https://416permits.com

Best,
[Your Name]
```

---

## STEP 4: Configure Campaign Settings

### Add Emails to Campaign

1. In your campaign, click **Add Email**
2. Paste Email 1 content
3. Click **Save**
4. Click **Add Email** again
5. Paste Email 2 content, set "Wait 3 days"
6. Click **Save**
7. Click **Add Email** again
8. Paste Email 3 content, set "Wait 4 days"
9. Click **Save**

### Campaign Settings

1. Click **Settings** tab in campaign
2. **Sending Schedule:**
   - Days: Monday - Friday
   - Hours: 8 AM - 5 PM EST
   - Max emails per day: 50 (safe starting point)
3. **Stop on Reply:** ON (stops sequence if they reply)
4. **Stop on Link Click:** OFF (let sequence continue)
5. **Unsubscribe Link:** ON
6. Click **Save**

---

## STEP 5: Add Leads to Campaign

1. Go back to **Leads**
2. Select all 200 leads (checkbox at top)
3. Click **Actions** → **Add to Campaign**
4. Select "Toronto Contractors - Nov 2025"
5. Click **Add**

---

## STEP 6: Review & Launch

### Pre-launch Checklist

- [ ] 200 leads added to campaign
- [ ] 3 email sequence configured
- [ ] Personalization variables working ({{firstName}}, {{customfield.trade}})
- [ ] Sending schedule set (Mon-Fri, 8 AM - 5 PM)
- [ ] Max 50 emails/day
- [ ] Unsubscribe link enabled
- [ ] UTM parameters in links (for tracking)

### Launch Campaign

1. Go to campaign page
2. Click **Start Campaign** (top right)
3. Confirm launch

**Result:** Campaign launches, Email 1 starts sending over 4 days (50/day)

---

## STEP 7: Monitor Results

### Metrics to Track (Industry Benchmarks)

```
📧 Sent: 50/day (should stay consistent)
📬 Delivered: 95-98% (should be high with pre-warmed)
📂 Opened: 30-50% (typical cold email)
🖱️ Clicked: 3-8% (clicks on signup link)
✍️ Replied: 2-5% (actual responses)
❌ Bounced: < 3% (pre-warmed accounts are validated)
🚫 Unsubscribed: < 1% (normal)
```

**Red flags:**
- Delivered < 90% → Contact Instantly support
- Bounced > 5% → Email list quality issue
- Unsubscribed > 3% → Email too aggressive/salesy

---

## STEP 8: Respond to Replies

### Check Inbox

1. Go to **Inbox** in Instantly (unified inbox for all replies)
2. Or check your forwarding email (hello@416permits.com)

### Response Templates

**Interested Reply:**
```
Hi {{firstName}},

Great to hear from you! 

Here's your free trial link:
https://416permits.com/signup?utm_source=instantly&utm_campaign=nov2025

During onboarding, you'll:
1. Select your trade ({{trade}})
2. Enter your service area (postal codes)
3. Set cost filters

You'll get your first digest tomorrow at 6 AM with permits matching your criteria.

Need help setting up? Happy to jump on a quick call.

Best,
[Your Name]
```

**Objection Reply (Too Busy):**
```
Totally understand - you're busy.

That's exactly why we built this. Instead of spending 3-5 hours/week searching permits, you get curated leads in your inbox at 6 AM.

5 minutes to set up, then it runs automatically.

Worth a 7-day test? No credit card needed:
https://416permits.com/signup

Best,
[Your Name]
```

**Question Reply (Pricing):**
```
Great question!

$29/month - cancel anytime.

That's about $1/day for daily permit alerts + full dashboard access.

Most contractors tell us they save 4-5 hours/week on manual searches. At your hourly rate, that's $150-300/week saved.

Free 7-day trial to test it:
https://416permits.com/signup

Best,
[Your Name]
```

---

## Expected Results (200 Emails)

**Timeline:**
- Day 1-4: Send all 200 emails (50/day)
- Day 3-7: Follow-up emails start going out
- Day 7-11: Final follow-ups

**Realistic expectations:**

```
📧 Sent: 200
📬 Delivered: 190-195 (95-98%)
📂 Opened: 60-100 (30-50%)
🖱️ Clicked: 6-16 (3-8%)
✍️ Replied: 4-10 (2-5%)
✅ Trial Signups: 4-10 (2-5%)
💰 Paid Conversions: 1-3 (30% of trials)
```

**Best case:**
- 8-10 trial signups
- 2-3 paid customers ($29/mo)
- **$58-87 MRR** from this campaign

**Cost:**
- Instantly: $65 (1 month pre-warmed)
- **ROI:** Break even after 1-2 paid customers

---

## STEP 9: After Campaign Ends

### Cancel Pre-warmed (Optional)

If you want to save money for future campaigns:

1. Set up separate domain (get416permits.com)
2. Connect via "Done-for-you Email Setup" ($37/mo)
3. Warm up for 2 weeks
4. Cancel pre-warmed accounts
5. Future campaigns: $37/mo instead of $65/mo

### Next Campaign

- Wait 3-4 weeks before emailing same list again
- Add new leads from Apollo
- Test different subject lines
- Refine messaging based on replies

---

## Troubleshooting

**Low delivery rate (< 90%)**
→ Contact Instantly support - pre-warmed accounts should be 95%+

**No opens after 2 days**
→ Subject line too generic - try more personalized

**High unsubscribe rate (> 3%)**
→ Email too salesy - add more value, less pitch

**No clicks**
→ CTA not clear - make link more prominent

**No replies but good opens**
→ Value prop unclear - add more concrete examples

---

## Next Steps

1. **Now:** Upload CSV with 200 contacts
2. **Today:** Create campaign + write 3 emails
3. **Tonight:** Review + launch campaign
4. **Tomorrow:** First 50 emails send automatically
5. **Daily:** Check inbox for replies, respond quickly

Ready to upload your contacts? Format that CSV and let's go.

