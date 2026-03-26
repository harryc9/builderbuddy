# API Product Hosting Strategy

**Status**: Parked for future consideration  
**Last Updated**: November 18, 2025  
**Current Infrastructure**: Vercel Pro Tier

---

## PRODUCT

### What is This?

A potential enterprise API product that would allow external developers and organizations to programmatically access 416Permits permit data. This would enable:

- **Developers**: Build custom integrations and applications on top of our data
- **Enterprises**: Integrate permit data into their existing systems (CRM, analytics, etc.)
- **Partners**: Resell or white-label our data in their products

### Why API vs Web UI?

**Web UI (Current)**:
- Good for: Individual searches, casual users, manual research
- Limited by: Human speed, no automation, no integrations

**API Product**:
- Good for: Automation, bulk operations, real-time integrations
- Enables: Programmatic access, webhooks, data streaming
- Monetization: Higher willingness to pay from enterprises

### Revenue Models Considered

1. **Tiered Pricing** (Most Common)
   - Free tier: 100 requests/day (developer testing)
   - Starter: $99/month - 10,000 requests/month
   - Pro: $499/month - 100,000 requests/month
   - Enterprise: Custom pricing for unlimited + SLA

2. **Usage-Based Pricing**
   - $0.01 per API call
   - Aligns cost with value
   - Unpredictable revenue but fair to customers

3. **Flat Enterprise Licensing**
   - $5K-$50K/month for unlimited access
   - Predictable revenue
   - Easier sales (no per-call metering)

### Target Customer Segments

**Primary**:
- Construction tech companies (project management, bidding platforms)
- Real estate developers (market intelligence, competitive tracking)
- Financial services (REITs, banks, insurance for risk/investment analysis)

**Secondary**:
- PropTech startups (building data products)
- Analytics platforms (enriching property data)
- Government contractors (compliance, reporting)

### Competitive Landscape

**Direct Competitors**:
- BuildZoom (permit data + contractor verification)
- Dodge Construction Network (project intelligence)
- PermitPlace (permit tracking)

**Indirect Competitors**:
- CoreLogic, ATTOM Data (property data APIs)
- OpenStreetMap API (geospatial data)
- Government open data portals (free but fragmented)

**Our Differentiation**:
- Focus on Toronto/GTA specifically (vs national players)
- Real-time updates (vs stale data)
- Modern API design + developer experience
- Enriched data (permits + contractors + timelines)

### Key Questions to Answer Later

1. **Market validation**: Do customers actually want API access vs web UI?
2. **Pricing**: What's the right price point that customers will pay?
3. **Support burden**: How much technical support will API customers need?
4. **Data freshness**: How real-time do updates need to be?
5. **Coverage**: Do we need to expand beyond Toronto first?

---

## TECH

### Current Infrastructure Analysis

**Vercel Pro Tier Capabilities**:
- ✅ Serverless Functions (10-second timeout on Hobby, 60-second on Pro)
- ✅ Edge Functions (fast, globally distributed)
- ✅ Automatic scaling (handles concurrent requests well)
- ✅ Global CDN (low latency worldwide)
- ✅ Built-in caching
- ⚠️ No dedicated IP (matters for enterprise firewalls)
- ⚠️ No VPC peering (available on Enterprise tier only)
- ⚠️ Function invocation limits (see pricing considerations)

**Current Architecture**:
```
Client → Next.js App → API Routes → Supabase
```

**API Architecture Would Be**:
```
External Client → API Gateway/Auth → API Routes → Supabase
                                   ↓
                              Rate Limiting
                                   ↓
                              Usage Tracking
                                   ↓
                              Billing System
```

### Technical Challenges on Vercel

#### 1. **Function Execution Limits**

**Problem**: Vercel Pro has 60-second timeout for serverless functions
- Long-running queries (e.g., bulk exports of 10K+ permits) would timeout
- Streaming responses help but have limits

**Solutions**:
- **Option A**: Batch processing via background jobs (Vercel Cron + queue)
  - Pros: Reliable, no timeouts
  - Cons: Not real-time, complex architecture
  
- **Option B**: Paginated responses (force clients to request in chunks)
  - Pros: Simple, works within limits
  - Cons: Poor UX for bulk operations
  
- **Option C**: Use Edge Functions for simple queries, route complex ones to external service
  - Pros: Best of both worlds
  - Cons: Dual infrastructure complexity

**Recommendation**: Start with Option B (pagination), move to A if needed

#### 2. **Rate Limiting**

**Problem**: Need to enforce per-customer API limits based on subscription tier

**Options**:

**A. Vercel Edge Config + Middleware**
```typescript
// middleware.ts
import { rateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const limited = await rateLimit(apiKey)
  
  if (limited) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  
  return NextResponse.next()
}
```

- Pros: Runs on Edge (fast), integrated with Vercel
- Cons: Edge Config has read limits (10K/second free, 100K/sec on Pro)

**B. Upstash Redis (serverless Redis)**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
})

const { success } = await ratelimit.limit(apiKey)
```

- Pros: More flexible, battle-tested, persistent storage
- Cons: External dependency, added cost (~$10-50/month)

**C. Supabase (our existing database)**
```typescript
// Track API calls in Supabase
const { count } = await sb
  .from('api_usage')
  .select('*', { count: 'exact', head: true })
  .eq('api_key', apiKey)
  .gte('created_at', oneHourAgo)

if (count >= limit) throw new Error('Rate limit exceeded')
```

- Pros: No new infrastructure, consolidated data
- Cons: Extra database load, slower than in-memory cache

**Recommendation**: **Upstash Redis** - best balance of performance and flexibility

#### 3. **API Authentication**

**Problem**: Need secure, scalable way to authenticate API requests

**Options**:

**A. API Keys (Simple)**
```
Authorization: Bearer pk_live_abc123xyz
```

- Pros: Simple, industry standard, easy to implement
- Cons: Can be stolen if exposed, no granular permissions

**Implementation**:
```typescript
// Store in Supabase
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  key_hash text not null, -- hashed version
  key_prefix text not null, -- first 8 chars for display
  name text, -- "Production API Key"
  tier text not null, -- 'free', 'pro', 'enterprise'
  rate_limit integer not null,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index idx_api_keys_hash on api_keys(key_hash);
```

**B. OAuth 2.0 (Complex)**
- Pros: More secure, granular scopes, refresh tokens
- Cons: Much more complex, overkill for most API use cases

**C. JWT Tokens**
- Pros: Stateless, can encode permissions
- Cons: Can't revoke without blacklist, token size limits

**Recommendation**: **API Keys** - start simple, can always add OAuth later

#### 4. **Usage Tracking & Billing**

**Problem**: Need to track API usage for billing and analytics

**Architecture**:

```typescript
// Log every API call
async function logApiCall(apiKey: string, endpoint: string, status: number) {
  await sb.from('api_logs').insert({
    api_key_id: apiKeyId,
    endpoint,
    status_code: status,
    response_time_ms: duration,
    timestamp: new Date()
  })
}

// Aggregate for billing
create table api_usage_summary (
  id uuid primary key,
  api_key_id uuid references api_keys,
  billing_period text, -- '2025-11'
  total_requests integer,
  requests_by_endpoint jsonb, -- {"GET /api/permits": 1234, ...}
  computed_at timestamptz
);
```

**Billing Integration Options**:

**A. Stripe Metered Billing**
- Report usage to Stripe API
- Stripe handles invoicing automatically
- Pros: Fully automated, handles payment failures
- Cons: Stripe takes 2.9% + 30¢ per transaction

**B. Manual Invoicing**
- Calculate usage, send invoices manually
- Pros: No platform fees
- Cons: Manual work, doesn't scale

**C. Hybrid (Stripe subscriptions + usage alerts)**
- Flat subscription tier in Stripe
- Alert when approaching limits
- Manual upgrades/overages
- Pros: Simple to start, predictable revenue
- Cons: Doesn't scale to pure usage-based

**Recommendation**: **Option C** for MVP, migrate to A at scale

#### 5. **API Documentation**

**Problem**: Developers need clear docs to integrate

**Options**:

**A. OpenAPI/Swagger**
```yaml
openapi: 3.0.0
info:
  title: 416Permits API
  version: 1.0.0
paths:
  /api/v1/permits:
    get:
      summary: Search permits
      parameters:
        - name: address
          in: query
          schema:
            type: string
```

Tools: Swagger UI, Redoc, Stoplight

**B. Custom docs site**
- Build with Nextra (Next.js docs framework)
- Full control over design
- Pros: Beautiful, customizable
- Cons: More work to maintain

**C. Readme.com / Mintlify**
- Hosted documentation platforms
- Pros: Beautiful, low maintenance
- Cons: ~$100/month, another platform to manage

**Recommendation**: **OpenAPI + Swagger UI** - auto-generated from code

#### 6. **Versioning Strategy**

**Problem**: Breaking changes need to be managed without breaking existing integrations

**Options**:

**A. URL Path Versioning**
```
/api/v1/permits
/api/v2/permits
```

- Pros: Clear, easy to route
- Cons: Duplicated code if not careful

**B. Header Versioning**
```
Accept: application/vnd.416permits.v1+json
```

- Pros: Same URL, elegant
- Cons: Less discoverable, harder to test

**C. Query Parameter**
```
/api/permits?version=1
```

- Pros: Flexible
- Cons: Not RESTful, messy URLs

**Recommendation**: **URL Path Versioning** - industry standard, clear

#### 7. **Caching Strategy**

**Problem**: Repeated identical queries waste resources

**Approach**:

```typescript
// Cache GET requests at Edge
export const config = {
  runtime: 'edge',
}

export async function GET(request: Request) {
  const cacheKey = new URL(request.url).searchParams.toString()
  
  // Check cache first
  const cached = await caches.default.match(cacheKey)
  if (cached) return cached
  
  // Fetch from DB
  const data = await fetchPermits()
  
  // Cache for 5 minutes
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate',
      'Content-Type': 'application/json'
    }
  })
  
  caches.default.put(cacheKey, response.clone())
  return response
}
```

**Cache Layers**:
1. **Edge (Vercel CDN)**: 5-15 minutes for common queries
2. **Supabase**: Query-level caching
3. **Client**: ETags + conditional requests

### Recommended Tech Stack

```typescript
// Core API
Framework: Next.js 14 App Router (existing)
Runtime: Vercel Edge Functions (for speed) + Serverless (for complex queries)
Database: Supabase PostgreSQL (existing)

// API Infrastructure
Authentication: API Keys stored in Supabase
Rate Limiting: Upstash Redis
Usage Tracking: Supabase (logs) + aggregation job
Caching: Vercel Edge Cache + Supabase

// Billing
Platform: Stripe (subscriptions + metered billing)
Webhooks: Vercel serverless functions

// Documentation
Spec: OpenAPI 3.0
UI: Swagger UI + Redoc
Hosting: /docs route in Next.js app

// Monitoring
Errors: Vercel Error Tracking (built-in)
Analytics: Vercel Web Analytics + custom API metrics
Logging: Supabase (structured logs)
Alerting: Vercel Monitoring + email alerts
```

### Cost Analysis

**Current Costs** (Consumer Product):
- Vercel Pro: $20/month
- Supabase: ~$25/month (estimate)
- **Total: ~$45/month**

**Projected API Product Costs**:

**At 1M API requests/month**:
- Vercel Pro: $20/month (function invocations included)
- Supabase: $50/month (increased queries)
- Upstash Redis: $30/month (rate limiting)
- Stripe: 2.9% of revenue
- **Total: ~$100/month + payment fees**

**At 10M API requests/month**:
- Vercel Pro: $20/month (still within limits)
- Vercel Enterprise: $400/month (if need dedicated support/SLA)
- Supabase Pro: $200/month (or custom plan)
- Upstash: $150/month
- Stripe: 2.9% of revenue
- **Total: ~$370-770/month + payment fees**

**Break-even Analysis**:
- If charging $500/month per API customer
- Need ~2-3 customers to cover infrastructure costs
- Beyond that is mostly margin (70-90% gross margin typical for API products)

### Scaling Considerations

**When to Upgrade from Vercel Pro**:

1. **Vercel Enterprise ($400+/month)** needed when:
   - Customers require dedicated IPs
   - Need VPC peering for security
   - Need 99.99% SLA (vs 99.9% on Pro)
   - Function invocations exceed Pro tier limits
   - Need priority support

2. **Alternative: Hybrid Architecture**
   - Keep Next.js frontend on Vercel Pro
   - Move API to dedicated service (AWS Lambda, Railway, Render)
   - Pros: More control, potentially cheaper at scale
   - Cons: Manage two infrastructures

**Database Scaling** (Supabase):
- Starter: $25/month - 500MB database, 2GB bandwidth
- Pro: $200/month - 8GB database, 50GB bandwidth
- **Watch**: Connection pooling (500 connections max on Pro)
- **Solution**: Supabase's Supavisor (connection pooler) or PgBouncer

### Security Considerations

**Must-Haves for API Product**:

1. **API Key Management**
   - Hash keys before storing (bcrypt)
   - Allow key rotation without downtime
   - Show only prefix in UI (pk_live_abc123...)
   - Expire unused keys automatically

2. **Rate Limiting (DDoS Protection)**
   - Per-key limits (prevent abuse)
   - Global limits (protect infrastructure)
   - Exponential backoff for violations

3. **Input Validation**
   - Validate all query parameters
   - Sanitize inputs (SQL injection prevention)
   - Limit response sizes (prevent data dumping)

4. **Audit Logging**
   - Log all API access (who, what, when)
   - Retention policy (90 days minimum)
   - Alerting on suspicious patterns

5. **HTTPS Only**
   - Enforce TLS 1.3
   - HSTS headers
   - No mixed content

6. **CORS Configuration**
   ```typescript
   // Only allow specific origins for browser-based API access
   const allowedOrigins = ['https://customer1.com', 'https://customer2.com']
   
   // Or require server-to-server calls only (no CORS)
   ```

### Implementation Phases

**Phase 1: MVP API (4-6 weeks)**
- [ ] API key generation and management
- [ ] Basic authentication middleware
- [ ] 3-5 core endpoints (GET /permits, GET /permit/:id, etc.)
- [ ] Simple rate limiting (Upstash Redis)
- [ ] OpenAPI spec + Swagger UI docs
- [ ] Usage logging to Supabase
- **Goal**: Functional API that 1-2 beta customers can test

**Phase 2: Billing & Monitoring (2-3 weeks)**
- [ ] Stripe subscription integration
- [ ] Usage dashboard for customers
- [ ] Billing alerts (approaching limit)
- [ ] Error monitoring and alerting
- [ ] API analytics dashboard (internal)
- **Goal**: Can charge customers and monitor health

**Phase 3: Scale & Polish (3-4 weeks)**
- [ ] Edge caching optimization
- [ ] Webhook support (notify on new permits)
- [ ] Batch endpoints (bulk operations)
- [ ] Enhanced docs (code examples, tutorials)
- [ ] Tiered rate limits by plan
- **Goal**: Production-ready for 10+ customers

**Phase 4: Enterprise Features (ongoing)**
- [ ] Dedicated IPs (requires Vercel Enterprise)
- [ ] VPC peering / private connectivity
- [ ] Custom SLAs
- [ ] Advanced analytics
- [ ] White-label options

### Open Questions / Decisions Needed

1. **Infrastructure**:
   - [ ] Stay on Vercel Pro or plan for Enterprise upgrade?
   - [ ] Self-host API separately vs keep on Vercel?
   - [ ] Which rate limiting solution? (Upstash recommended)

2. **Product**:
   - [ ] Free tier or paid-only?
   - [ ] Usage-based or tiered subscription?
   - [ ] What's minimum viable API? (How many endpoints?)

3. **Business**:
   - [ ] Who's the primary target customer?
   - [ ] What's acceptable API response time? (< 500ms? < 2s?)
   - [ ] Support model? (Email? Slack? Phone?)

4. **Data**:
   - [ ] Real-time updates or batch? (How fresh is "fresh enough"?)
   - [ ] How much historical data to expose?
   - [ ] Data enrichment priorities? (contractor info? timelines?)

### Alternative: Use Existing API Platform

Instead of building everything from scratch, could use a managed API gateway:

**Kong (Open Source + Cloud)**
- Handles auth, rate limiting, analytics
- Open source (self-host) or cloud ($500+/month)
- Pros: Battle-tested, full-featured
- Cons: Expensive, complex, another platform

**Tyk (API Gateway)**
- Similar to Kong
- Good for high-scale APIs
- Pros: GraphQL support, built-in analytics
- Cons: Overkill for MVP, $$$

**AWS API Gateway**
- Fully managed, scales infinitely
- Native AWS integration
- Pros: Reliable, cheap at scale
- Cons: Vendor lock-in, learning curve

**Recommendation**: **Build on Vercel first**, migrate to gateway only if needed at scale. Most startups don't need these until 100M+ API calls/month.

---

## Next Steps (When Revisiting)

1. **Market Validation**:
   - Interview 10-20 potential API customers
   - Ask: "What would you build if you had API access?"
   - Ask: "What would you pay for X requests/month?"
   - Validate pricing assumptions

2. **MVP Definition**:
   - Define minimum set of endpoints
   - Choose auth + rate limiting solution
   - Decide on pricing model (tiered vs usage)

3. **Technical Spike** (1 week):
   - Prototype API key auth
   - Test rate limiting with Upstash
   - Measure query performance under load
   - Confirm Vercel limits are acceptable

4. **Beta Program**:
   - Find 2-3 friendly beta customers
   - Free access in exchange for feedback
   - Iterate on API design based on real usage

5. **Go-to-Market**:
   - Create /enterprise page
   - Write API docs
   - Launch ProductHunt / HN
   - Direct outreach to target customers

---

## References

- [Vercel API Hosting Guide](https://vercel.com/guides/hosting-backend-apis)
- [Stripe Metered Billing](https://stripe.com/docs/billing/subscriptions/usage-based)
- [OpenAPI Specification](https://swagger.io/specification/)
- [API Best Practices](https://apidog.com/blog/api-management-best-practices)
- [Rate Limiting Patterns](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

