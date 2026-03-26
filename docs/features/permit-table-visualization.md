# Permit Table Visualization - Self-Serve Data Exploration

## CUSTOMER FEEDBACK & PRIORITIES

### What Customers Actually Care About (In Order):
1. **ADDRESS & LOCATION** 🗺️ - "Where is this project?" (map visualization critical)
2. **COST** 💰 - "How much is this project worth?"
3. **DATE RANGE** 📅 - "When was this permit issued?" (need year slider 2009-2025)
4. **FILTERS** 🔍 - Comprehensive, visual, intuitive filtering (not buried in dropdowns)
5. **STATUS** ⚡ - "What stage is the project in?"

### What Customers DON'T Care About:
- ❌ Permit # (internal ID - meaningless to customers)
- ❌ Technical database fields
- ❌ Complex query builders

### Design Philosophy:
> "Make finding a $2M construction project as easy as finding a restaurant on Google Maps"

**Core Principle**: Visual, location-first, filter-heavy exploration tool.

---

## PRODUCT SECTION

### Core Value Proposition

Transform 255K+ building permits into a **self-serve data exploration tool** that enables construction industry professionals to find opportunities, track competitors, and analyze market trends without technical expertise.

### Target Users & Use Cases

#### 1. **SUPPLY CHAIN OPPORTUNITY TRACKING**
**User Personas**: Material suppliers, equipment rental companies, specialty trade vendors

**User Story**: "As a commercial HVAC supplier, I want to find all permits over $500K that were recently issued in my service area, so I can reach out before they select a vendor."

**Required Filters**:
- `est_const_cost` range selector (e.g., $500K - $5M)
- `status` = "Permit Issued" (projects starting soon)
- `permit_type` multiselect (e.g., "New Building", "Addition/Alteration")
- `description` keyword search ("HVAC", "electrical", "plumbing", "roofing", "concrete")
- `issued_date` sort (most recent = hottest leads)
- `postal` code filter (service area targeting)

**Expected Results**: 50-200 qualified leads per week in Toronto

**Business Impact**: 
- Reduce lead generation cost by 70% (vs cold calling)
- Increase win rate by 3x (early contact advantage)
- Pipeline visibility: $2-5M in active opportunities

---

#### 2. **COMPETITIVE INTELLIGENCE & BUILDER TRACKING**
**User Personas**: General contractors, developers, real estate investors

**User Story**: "As a mid-size GC, I want to track what projects my top 5 competitors are winning, so I can adjust my bidding strategy and identify new developer relationships."

**Required Filters**:
- `builder_name` multiselect (track specific competitors)
- `status` transitions (watching pipeline movement)
- `est_const_cost` descending sort (biggest projects)
- `application_date` range (last 30/60/90 days activity)
- `ward_grid` or `postal` grouping (neighborhood concentration)
- Show `permit_changes` count (active vs dormant projects)

**Expected Results**: Monitor 10-20 active competitors across 100-500 permits

**Business Impact**:
- Identify emerging builders before they dominate market
- Adjust pricing strategy based on competitor activity
- Target same clients/neighborhoods as successful competitors

---

#### 3. **PROJECT TIMELINE INTELLIGENCE**
**User Personas**: Subcontractors, labor agencies, project managers

**User Story**: "As a drywall contractor, I need to know which projects are moving from 'Permit Issued' to 'Inspection' so I can plan my crew scheduling 3-6 months ahead."

**Required Filters**:
- `status` = "Inspection" (projects nearing completion)
- Calculate days between `issued_date` and today (project duration)
- `status` = "Under Review" (projects about to be approved)
- `application_date` ascending sort (oldest = likely to move soon)
- `status_changed_at` recent (activity indicator)
- `permit_changes` filtered by `change_type` = "status"

**Expected Results**: 200-400 permits in active inspection phase, 50-100 moving to inspection weekly

**Business Impact**:
- Improve crew utilization by 25% (better scheduling)
- Reduce idle time between jobs
- Cash flow planning (predict payment milestones)

---

#### 4. **GEOGRAPHIC MARKET ANALYSIS**
**User Personas**: Real estate investors, urban planners, market analysts

**User Story**: "As a real estate investor, I want to identify neighborhoods with 10+ new residential permits in the last 6 months and average project value over $1M, indicating gentrification opportunities."

**Required Filters**:
- `postal` prefix grouping (neighborhood-level)
- `ward_grid` filter (political boundaries)
- Aggregate SUM(`est_const_cost`) by area
- `proposed_use` = "Residential" or filter by `dwelling_units_created` > 0
- `application_date` range (last 6-12 months)
- Map visualization using `location` coordinates
- Count permits per postal code

**Expected Results**: 10-15 hot neighborhoods, 5-8 emerging areas

**Business Impact**:
- Early identification of appreciation zones (6-12 months before price surge)
- Target pre-construction investments
- Understand development patterns (residential vs commercial shifts)

---

#### 5. **SCOPE & RISK ASSESSMENT**
**User Personas**: Insurance companies, lenders, due diligence firms

**User Story**: "As an underwriter, I need to flag permits with 3+ scope changes or cost increases over 20% as high-risk for construction loans."

**Required Filters**:
- `revision_num` > 1 (projects with permit revisions)
- `permit_changes` count > 3 (volatile projects)
- `business_impact` = "HIGH" or "CRITICAL" in changes table
- `est_const_cost` delta > 20% (join with `permit_changes` old/new values)
- `change_type` = "scope" (unstable requirements)
- `days_since_last_change` < 30 (ongoing instability)
- `changed_fields` contains "builder_name" (contractor switches = red flag)

**Expected Results**: 5-10% of permits flagged as high-risk (12,000-25,000 permits)

**Business Impact**:
- Reduce loan default rate by 15-20%
- Adjust premiums/rates for risky projects
- Early intervention on troubled projects

---

#### 6. **NEW PERMIT ALERTS & MONITORING**
**User Personas**: All user types - proactive opportunity discovery

**User Story**: "I want to be notified within 24 hours when a new permit matching my saved criteria appears (e.g., 'New commercial permits over $1M in downtown Toronto')."

**Required Filters**:
- `application_date` or `first_seen_at` = last 7 days
- `status` = "Application Received" (earliest stage)
- **Saved Search** functionality (save filter combinations)
- Sort by `first_seen_at` descending (newest first)
- Bulk export filtered results (CSV/Excel)
- Email/Slack notifications for new matches

**Expected Results**: 10-30 new permits daily matching user criteria (88.5 avg daily permits)

**Business Impact**:
- First-mover advantage (contact before 95% of competitors)
- Automated lead generation (zero manual searching)
- Higher close rates (early relationship building)

---

#### 7. **FINANCIAL OPPORTUNITY SIZING**
**User Personas**: Business development, market analysts, investors

**User Story**: "Show me the total construction value of all active residential permits in North York to size the local drywall supply market."

**Required Filters**:
- Aggregate SUM(`est_const_cost`) for filtered results
- Filter by cost breakdown: `residential`, `institutional`, `industrial`, `mercantile`
- `permit_type` filter
- `demolition` > 0 (demo/rebuild projects = full scope)
- `interior_alterations` > 0 (tenant improvement market)
- `status` != "Completed" (active projects only)
- Group by `ward_grid` or `postal` prefix

**Expected Results**: Market sizing reports like "$847M in active residential construction across 1,234 permits"

**Business Impact**:
- Data-driven market entry decisions
- Prioritize high-value segments (institutional vs residential)
- Support investor/lender pitch decks

---

### Key Product Metrics

**User Engagement**:
- **Daily active users**: 60-80% of paid seats
- **Avg session duration**: 8-15 minutes (deep exploration)
- **Filters per session**: 3-5 combinations
- **Export actions**: 15-25% of sessions (high intent)
- **Saved searches**: 2-4 per user (repeat usage)

**Business Outcomes**:
- **Lead conversion**: 3-5% of viewed permits → sales pipeline
- **Time saved**: 4-6 hours/week vs manual spreadsheet analysis
- **Willingness to pay**: $200-500/month per seat (vs $0 for raw data)

---

## TECH SECTION

### Architecture Overview

**Component Stack**:
```
┌─────────────────────────────────────────────┐
│  shadcn/ui Table Components (UI layer)       │
├─────────────────────────────────────────────┤
│  TanStack Table v8 (data grid logic)         │
├─────────────────────────────────────────────┤
│  React Query (data fetching/caching)         │
├─────────────────────────────────────────────┤
│  Next.js API Route (GET /api/permits/search)│
├─────────────────────────────────────────────┤
│  Supabase Client (query builder)             │
├─────────────────────────────────────────────┤
│  PostgreSQL + PostGIS (255K+ permits)        │
└─────────────────────────────────────────────┘
```

### Data Strategy: Server-Side vs Client-Side

**✅ SERVER-SIDE (Recommended)**:
- Filtering (SQL WHERE clauses)
- Pagination (LIMIT/OFFSET)
- Aggregations (SUM, COUNT, GROUP BY)
- Full-text search (PostgreSQL tsvector)

**✅ CLIENT-SIDE**:
- Column sorting (current page only)
- Column visibility toggling
- Row selection (checkboxes)
- UI interactions (expand/collapse)

**Why**: 255K rows is too large for client-side processing. Server-side filtering with proper indexes keeps queries under 200ms.

---

### Database Indexes Required

```sql
-- Critical performance indexes for table queries
CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_permits_issued_date ON permits(issued_date DESC);
CREATE INDEX idx_permits_application_date ON permits(application_date DESC);
CREATE INDEX idx_permits_postal ON permits(postal);
CREATE INDEX idx_permits_est_const_cost ON permits(est_const_cost DESC);
CREATE INDEX idx_permits_permit_type ON permits(permit_type);
CREATE INDEX idx_permits_builder_name ON permits(builder_name);

-- Composite indexes for common filter combinations
CREATE INDEX idx_permits_status_issued_date 
  ON permits(status, issued_date DESC);

CREATE INDEX idx_permits_postal_status 
  ON permits(postal, status);

-- Full-text search index
CREATE INDEX idx_permits_search 
  ON permits USING GIN(to_tsvector('english', 
    COALESCE(description, '') || ' ' || 
    COALESCE(full_address, '') || ' ' || 
    COALESCE(builder_name, '')));

-- Geospatial index for map queries
CREATE INDEX idx_permits_location 
  ON permits USING GIST(location);
```

---

### API Endpoint Design

**Route**: `/api/permits/search`

**Request Parameters**:
```typescript
type PermitSearchParams = {
  // Pagination
  page?: number              // default: 1
  per_page?: number         // default: 50, max: 100
  
  // Filters
  status?: string[]         // multiselect: ['Permit Issued', 'Inspection']
  permit_type?: string[]    // multiselect
  postal?: string[]         // ['M4B', 'M5H']
  builder_name?: string[]   // ['ABC Construction', 'XYZ Builders']
  
  // Ranges
  cost_min?: number         // 500000
  cost_max?: number         // 5000000
  date_from?: string        // '2024-01-01' (application_date)
  date_to?: string          // '2024-12-31'
  issued_from?: string      // issued_date range
  issued_to?: string
  
  // Search
  query?: string            // full-text search across description/address/builder
  
  // Sorting
  sort_by?: string          // 'issued_date' | 'est_const_cost' | 'application_date'
  sort_order?: 'asc' | 'desc'
  
  // Advanced
  has_changes?: boolean     // permits with recent changes
  change_type?: string[]    // ['status', 'cost']
  business_impact?: string[] // ['CRITICAL', 'HIGH']
}
```

**Response Format**:
```typescript
type PermitSearchResponse = {
  permits: Permit[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  aggregations?: {
    total_cost: number
    avg_cost: number
    permit_count_by_status: Record<string, number>
  }
  execution_time_ms: number
}
```

---

### Performance Optimization

**CRITICAL: Performance is the #1 priority for user experience**

**Query Performance Targets**:
- Simple filter (1-2 conditions): **<100ms**
- Complex filter (5+ conditions): **<200ms**
- Full-text search: **<400ms**
- Geospatial queries: **<150ms**
- Time to Interactive: **<1.5 seconds**

**Database Performance**:
```sql
-- Use EXPLAIN ANALYZE to verify all queries use indexes
EXPLAIN ANALYZE
SELECT * FROM permits 
WHERE status = 'Permit Issued' 
  AND issued_date >= '2024-01-01'
  AND est_const_cost BETWEEN 500000 AND 5000000
ORDER BY issued_date DESC
LIMIT 50;

-- Target: Seq Scan should NEVER appear
-- Goal: Index Scan or Bitmap Index Scan only
```

**Database Connection Pooling**:
- Use Supabase connection pooler (pgBouncer) in transaction mode
- Max 10 concurrent connections for read queries
- Connection reuse to eliminate handshake overhead
- Prepared statements for repeated queries

**API Response Time Budget**:
```
Database query:    100ms (70%)
Network latency:    30ms (20%)
JSON serialization: 15ms (10%)
─────────────────────────
Total:            145ms target
```

**Frontend Performance**:
```typescript
// Debounce filter inputs to reduce API calls
import { useDebouncedCallback } from 'use-debounce'

const debouncedSearch = useDebouncedCallback(
  (value) => setSearchQuery(value),
  300 // Wait 300ms after user stops typing
)
```

**Caching Strategy** (React Query):
```typescript
// React Query configuration for optimal performance
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 60 seconds - data is fresh for 1 min
      gcTime: 5 * 60 * 1000,       // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 3,                    // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Cache key factory for type safety
export const permitQueryKeys = {
  all: ['permits'] as const,
  search: (params: PermitSearchParams) => ['permits', 'search', params] as const,
}
```

---

### UI Component Structure

**File Structure**:
```
src/
  components/
    permits/
      PermitsTable.tsx          // Main container
      PermitsTableColumns.tsx   // Column definitions (TanStack)
      PermitsTableFilters.tsx   // Filter UI components
      PermitsTableToolbar.tsx   // Actions (export, saved searches)
      PermitsTablePagination.tsx // Pagination controls
      SavedSearchDialog.tsx     // Save/load filter sets
      PermitDetailDrawer.tsx    // Expanded row view
  hooks/
    usePermitsSearch.ts         // React Query hook
  app/
    api/
      permits/
        search/
          route.ts              // GET endpoint
    layout.tsx                  // Add QueryClientProvider here
```

### Data Fetching Hook (React Query)

**React Query Hook** (`src/hooks/usePermitsSearch.ts`):
```typescript
import { useQuery } from '@tanstack/react-query'
import type { PermitSearchParams, PermitSearchResponse } from '@/types/permits'

// Fetch function for React Query
async function fetchPermits(params: PermitSearchParams): Promise<PermitSearchResponse> {
  const queryString = new URLSearchParams()
  
  // Build query string from params
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return
    
    if (Array.isArray(value)) {
      value.forEach(v => queryString.append(key, String(v)))
    } else {
      queryString.append(key, String(value))
    }
  })

  const response = await fetch(`/api/permits/search?${queryString}`)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// React Query hook
export function usePermitsSearch(params: PermitSearchParams) {
  return useQuery({
    queryKey: ['permits', 'search', params],
    queryFn: () => fetchPermits(params),
    staleTime: 60 * 1000,        // 60 seconds
    gcTime: 5 * 60 * 1000,       // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Example usage in component:
// const { data, isLoading, error, refetch } = usePermitsSearch(filterParams)
```

### API Endpoint Implementation

**Route**: `src/app/api/permits/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import type { PermitSearchParams, PermitSearchResponse } from '@/types/permits'

export const runtime = 'edge' // Deploy to edge for lower latency

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse query parameters
    const params: PermitSearchParams = {
      page: parseInt(searchParams.get('page') || '1'),
      per_page: Math.min(parseInt(searchParams.get('per_page') || '50'), 100),
      status: searchParams.getAll('status'),
      permit_type: searchParams.getAll('permit_type'),
      postal: searchParams.getAll('postal'),
      builder_name: searchParams.getAll('builder_name'),
      cost_min: searchParams.get('cost_min') ? parseFloat(searchParams.get('cost_min')!) : undefined,
      cost_max: searchParams.get('cost_max') ? parseFloat(searchParams.get('cost_max')!) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      issued_from: searchParams.get('issued_from') || undefined,
      issued_to: searchParams.get('issued_to') || undefined,
      query: searchParams.get('query') || undefined,
      sort_by: searchParams.get('sort_by') || 'issued_date',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    }

    const supabase = createClient()
    
    // Build query with filters
    let query = supabase
      .from('permits')
      .select('*', { count: 'exact' })

    // Apply filters
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status)
    }
    
    if (params.permit_type && params.permit_type.length > 0) {
      query = query.in('permit_type', params.permit_type)
    }
    
    if (params.postal && params.postal.length > 0) {
      // Match postal code prefix (e.g., 'M4B' matches 'M4B 1A1')
      const postalFilters = params.postal.map(p => `postal.ilike.${p}%`)
      query = query.or(postalFilters.join(','))
    }
    
    if (params.builder_name && params.builder_name.length > 0) {
      query = query.in('builder_name', params.builder_name)
    }
    
    if (params.cost_min) {
      query = query.gte('est_const_cost', params.cost_min)
    }
    
    if (params.cost_max) {
      query = query.lte('est_const_cost', params.cost_max)
    }
    
    if (params.date_from) {
      query = query.gte('application_date', params.date_from)
    }
    
    if (params.date_to) {
      query = query.lte('application_date', params.date_to)
    }
    
    if (params.issued_from) {
      query = query.gte('issued_date', params.issued_from)
    }
    
    if (params.issued_to) {
      query = query.lte('issued_date', params.issued_to)
    }
    
    // Full-text search (uses GIN index)
    if (params.query) {
      query = query.textSearch('fts', params.query, {
        type: 'websearch',
        config: 'english'
      })
    }
    
    // Sorting
    query = query.order(params.sort_by, { 
      ascending: params.sort_order === 'asc',
      nullsFirst: false 
    })
    
    // Pagination
    const from = (params.page - 1) * params.per_page
    const to = from + params.per_page - 1
    query = query.range(from, to)

    const { data: permits, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    const executionTime = Date.now() - startTime
    
    // Log slow queries for optimization
    if (executionTime > 300) {
      console.warn(`Slow query (${executionTime}ms):`, params)
    }

    const response: PermitSearchResponse = {
      permits: permits || [],
      pagination: {
        page: params.page,
        per_page: params.per_page,
        total_count: count || 0,
        total_pages: Math.ceil((count || 0) / params.per_page),
        has_next: (count || 0) > to + 1,
        has_prev: params.page > 1,
      },
      execution_time_ms: executionTime,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60', // CDN cache for 60 seconds
      }
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Column Priority (Customer Perspective)**:
```typescript
// src/components/permits/PermitsTableColumns.tsx
import { ColumnDef } from '@tanstack/react-table'
import { Permit } from '@/types/permits'

// PRIORITY ORDER (what customers actually care about):
export const columns: ColumnDef<Permit>[] = [
  // 1. ADDRESS - Most important (location, location, location)
  {
    accessorKey: 'full_address',
    header: 'Address',
    cell: ({ row }) => (
      <Button 
        variant="link" 
        onClick={() => openMapView(row.original)}
        className="text-left font-medium"
      >
        {row.getValue('full_address')}
      </Button>
    ),
    enableSorting: false,
  },
  // 2. COST - Money drives decisions
  {
    accessorKey: 'est_const_cost',
    header: 'Est. Cost',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('est_const_cost'))
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 0,
      }).format(amount)
    },
  },
  // 3. STATUS - Project stage
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.getValue('status'))}>
        {row.getValue('status')}
      </Badge>
    ),
  },
  // 4. ISSUED DATE - Timing matters
  {
    accessorKey: 'issued_date',
    header: 'Issued Date',
    cell: ({ row }) => formatDate(row.getValue('issued_date')),
  },
  // 5. BUILDER - Track competitors
  {
    accessorKey: 'builder_name',
    header: 'Builder',
    cell: ({ row }) => row.getValue('builder_name'),
    enableSorting: false,
  },
  // 6. DESCRIPTION - Project details (expandable)
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className="max-w-[400px] truncate">
        {row.getValue('description')}
      </div>
    ),
    enableSorting: false,
  },
]

// NOTE: permit_num removed - customers don't care about internal IDs
// They care about WHERE projects are, HOW MUCH they cost, and WHEN they happen
```

---

### Critical Features Implementation

#### 1. **COMPREHENSIVE FILTERS PANEL** (Customer Priority #1)
**Design Philosophy**: Make every relevant filter accessible, intuitive, and visual

```typescript
// src/components/permits/PermitsTableFilters.tsx
'use client'

import { useState } from 'react'
import { useQueryState, parseAsArrayOf, parseAsString, parseAsInteger } from 'nuqs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Filter, MapPin } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { DateTime } from 'luxon'

export function PermitsTableFilters() {
  // URL-based state management
  const [statuses, setStatuses] = useQueryState(
    'status',
    parseAsArrayOf(parseAsString).withDefault([])
  )
  const [costMin, setCostMin] = useQueryState('cost_min', parseAsInteger)
  const [costMax, setCostMax] = useQueryState('cost_max', parseAsInteger)
  const [yearRange, setYearRange] = useQueryState('years', parseAsArrayOf(parseAsInteger))
  const [postal, setPostal] = useQueryState('postal', parseAsString)
  const [builderSearch, setBuilderSearch] = useQueryState('builder', parseAsString)
  const [query, setQuery] = useQueryState('q', parseAsString)

  // Date range slider state (2009-2025 based on data)
  const MIN_YEAR = 2009
  const MAX_YEAR = 2025
  const [dateSliderValues, setDateSliderValues] = useState([
    yearRange?.[0] || MIN_YEAR,
    yearRange?.[1] || MAX_YEAR
  ])

  // Available statuses from data
  const availableStatuses = [
    'Permit Issued',
    'Inspection',
    'Under Review',
    'Response Received',
    'Revision Issued',
    "Examiner's Notice Sent",
    'Completed',
    'Application Received',
  ]

  // Cost ranges (preset buckets)
  const costRanges = [
    { label: 'Under $100K', min: 0, max: 100000 },
    { label: '$100K - $500K', min: 100000, max: 500000 },
    { label: '$500K - $1M', min: 500000, max: 1000000 },
    { label: '$1M - $5M', min: 1000000, max: 5000000 },
    { label: '$5M+', min: 5000000, max: null },
  ]

  // Clear all filters
  const clearFilters = () => {
    setStatuses([])
    setCostMin(null)
    setCostMax(null)
    setYearRange(null)
    setPostal(null)
    setBuilderSearch(null)
    setQuery(null)
    setDateSliderValues([MIN_YEAR, MAX_YEAR])
  }

  // Count active filters
  const activeFilterCount = [
    statuses.length > 0,
    costMin != null || costMax != null,
    yearRange != null,
    postal != null,
    builderSearch != null,
    query != null,
  ].filter(Boolean).length

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DATE RANGE SLIDER - Most Visual, Most Important */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Permit Date Range
          </Label>
          <div className="px-2 pt-4 pb-2">
            <Slider
              min={MIN_YEAR}
              max={MAX_YEAR}
              step={1}
              value={dateSliderValues}
              onValueChange={(values) => {
                setDateSliderValues(values)
                setYearRange(values)
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {dateSliderValues[0]}
              </span>
              <span className="text-xs">
                {dateSliderValues[1] - dateSliderValues[0] + 1} years selected
              </span>
              <span className="font-medium text-foreground">
                {dateSliderValues[1]}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* COST RANGE - Visual Preset Buttons */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Estimated Construction Cost
          </Label>
          <div className="flex flex-wrap gap-2">
            {costRanges.map((range) => {
              const isActive = 
                (costMin === range.min || (!costMin && range.min === 0)) &&
                (costMax === range.max || (!costMax && range.max === null))
              
              return (
                <Button
                  key={range.label}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCostMin(range.min || null)
                    setCostMax(range.max)
                  }}
                >
                  {range.label}
                </Button>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCostMin(null)
                setCostMax(null)
              }}
            >
              Any
            </Button>
          </div>
          
          {/* Custom range inputs */}
          <div className="flex items-center gap-2 pt-2">
            <Input
              type="number"
              placeholder="Min $"
              value={costMin || ''}
              onChange={(e) => setCostMin(e.target.value ? parseInt(e.target.value) : null)}
              className="w-32"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max $"
              value={costMax || ''}
              onChange={(e) => setCostMax(e.target.value ? parseInt(e.target.value) : null)}
              className="w-32"
            />
          </div>
        </div>

        <Separator />

        {/* LOCATION FILTER */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location (Postal Code)
          </Label>
          <Input
            type="text"
            placeholder="e.g. M4B, M5H, M6G"
            value={postal || ''}
            onChange={(e) => setPostal(e.target.value || null)}
            className="uppercase"
            maxLength={3}
          />
          <p className="text-xs text-muted-foreground">
            Enter first 3 characters of postal code to filter by area
          </p>
        </div>

        <Separator />

        {/* STATUS FILTER - Checkboxes */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Project Status</Label>
          <div className="grid grid-cols-2 gap-3">
            {availableStatuses.map((status) => {
              const isChecked = statuses.includes(status)
              return (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatuses([...statuses, status])
                      } else {
                        setStatuses(statuses.filter((s) => s !== status))
                      }
                    }}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* BUILDER SEARCH */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Builder Name</Label>
          <Input
            type="text"
            placeholder="Search by builder/contractor name..."
            value={builderSearch || ''}
            onChange={(e) => setBuilderSearch(e.target.value || null)}
          />
        </div>

        <Separator />

        {/* KEYWORD SEARCH */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Keyword Search
          </Label>
          <Input
            type="text"
            placeholder="Search description, address, etc..."
            value={query || ''}
            onChange={(e) => setQuery(e.target.value || null)}
          />
          <p className="text-xs text-muted-foreground">
            Search across project description, address, and builder
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Benefits**:
- **Visual Date Range Slider**: Intuitive year selection (2009-2025)
- **Cost Presets**: Quick filtering with common ranges
- **Shareable URLs**: Send filtered view to colleague
- **Browser Navigation**: Back/forward works
- **Bookmark Searches**: Save URLs for repeated use
- **Real-time Feedback**: Active filter count badge

---

#### 2. **MAP VISUALIZATION** (Customer Priority #2)
**Why Map Matters**: Location is the #1 driver of construction decisions

```typescript
// src/components/permits/PermitsMap.tsx
'use client'

import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, List, Navigation } from 'lucide-react'
import type { Permit } from '@/types/permits'
import 'leaflet/dist/leaflet.css'

type ViewMode = 'table' | 'map' | 'split'

export function PermitsMapView({ permits }: { permits: Permit[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null)

  // Filter permits with valid location data
  const permitsWithLocation = useMemo(() => {
    return permits.filter(p => p.location != null)
  }, [permits])

  // Parse PostGIS POINT format: "POINT(-79.3832 43.6532)"
  const parseLocation = (location: string) => {
    const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/)
    if (!match) return null
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2])
    }
  }

  // Toronto center coordinates
  const TORONTO_CENTER: [number, number] = [43.6532, -79.3832]

  // Cost-based marker colors
  const getMarkerColor = (cost: number | null) => {
    if (!cost) return '#gray'
    if (cost < 500000) return '#3b82f6' // blue - small
    if (cost < 1000000) return '#10b981' // green - medium
    if (cost < 5000000) return '#f59e0b' // orange - large
    return '#ef4444' // red - mega projects
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            <Navigation className="h-4 w-4 mr-1" />
            Split View
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {permitsWithLocation.length} permits with location data
        </div>
      </div>

      {/* Map View */}
      {(viewMode === 'map' || viewMode === 'split') && (
        <Card>
          <CardContent className="p-0">
            <MapContainer
              center={TORONTO_CENTER}
              zoom={11}
              style={{ height: '600px', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {permitsWithLocation.map((permit) => {
                const coords = parseLocation(permit.location!)
                if (!coords) return null

                return (
                  <Circle
                    key={permit.id}
                    center={[coords.lat, coords.lng]}
                    radius={Math.min(
                      Math.sqrt(permit.est_const_cost || 100000) / 2,
                      200
                    )} // Size based on cost
                    fillColor={getMarkerColor(permit.est_const_cost)}
                    fillOpacity={0.6}
                    color={getMarkerColor(permit.est_const_cost)}
                    weight={2}
                  >
                    <Popup>
                      <div className="space-y-2 min-w-[250px]">
                        <h3 className="font-semibold text-base">
                          {permit.full_address}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('en-CA', {
                                style: 'currency',
                                currency: 'CAD',
                                minimumFractionDigits: 0,
                              }).format(permit.est_const_cost || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="secondary">{permit.status}</Badge>
                          </div>
                          {permit.builder_name && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Builder:</span>
                              <span>{permit.builder_name}</span>
                            </div>
                          )}
                          {permit.issued_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Issued:</span>
                              <span>
                                {new Date(permit.issued_date).toLocaleDateString('en-CA')}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setSelectedPermit(permit)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Circle>
                )
              })}
            </MapContainer>

            {/* Map Legend */}
            <div className="p-4 border-t bg-muted/50">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-medium">Project Size:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                  <span>&lt;$500K</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span>$500K-$1M</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span>$1M-$5M</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span>$5M+</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table integration handled by parent component */}
    </div>
  )
}
```

**Map Features**:
- **Cost-Based Visualization**: Circle size & color = project value
- **Interactive Popups**: Click marker for quick details
- **View Modes**: Table, Map, or Split View
- **Cluster Support**: Group nearby permits at higher zoom levels (future)
- **Heat Map Mode**: Density visualization for market analysis (future)
- **Draw Tools**: Draw polygon to filter permits by area (future)

**Library Choice**: 
- Use `react-leaflet` (lightweight, open source)
- Alternative: `@vis.gl/react-google-maps` (better UX, requires API key)

---

#### 3. **Export Functionality**
```typescript
// Export filtered results to CSV
async function exportToCSV(filterParams: PermitSearchParams) {
  // Fetch ALL results matching filters (no pagination)
  const response = await fetch('/api/permits/export', {
    method: 'POST',
    body: JSON.stringify({ ...filterParams, format: 'csv' }),
  })
  
  const blob = await response.blob()
  downloadFile(blob, `permits-${Date.now()}.csv`)
}
```

**Limits**:
- Max 10,000 rows per export (prevent abuse)
- Rate limit: 5 exports per hour per user
- Background job for large exports (email download link)

---

#### 3. **Saved Searches**
```sql
-- Database table for saved searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  filter_params JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0
);
```

**UI Flow**:
1. User applies 3-5 filters
2. Clicks "Save Search" button
3. Names it "Downtown HVAC Leads"
4. Appears in sidebar for quick access
5. Click to instantly apply those filters

---

#### 4. **Change Highlighting**
```typescript
// Visual indicator for recently changed permits
function PermitRow({ permit }: { permit: Permit }) {
  const hasRecentChanges = permit.status_changed_at && 
    isWithinLast7Days(permit.status_changed_at)
  
  return (
    <TableRow className={hasRecentChanges ? 'bg-yellow-50' : ''}>
      {hasRecentChanges && (
        <Badge variant="outline" className="ml-2">
          <ActivityIcon size={12} className="mr-1" />
          Changed
        </Badge>
      )}
      {/* ... row cells */}
    </TableRow>
  )
}
```

---

#### 5. **Bulk Actions**
```typescript
// Select multiple permits and add to watchlist
const [selectedPermits, setSelectedPermits] = useState<string[]>([])

function BulkActionsToolbar() {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => addToWatchlist(selectedPermits)}
        disabled={selectedPermits.length === 0}
      >
        Add {selectedPermits.length} to Watchlist
      </Button>
      <Button 
        variant="outline"
        onClick={() => exportSelected(selectedPermits)}
      >
        Export Selected
      </Button>
    </div>
  )
}
```

---

### Responsive Design

**Desktop (>1024px)**:
- Show 10-12 columns
- Horizontal scroll for additional columns
- Fixed left column (permit_num, address)

**Tablet (768-1024px)**:
- Show 6-8 key columns
- Collapsible filters sidebar
- Card view option

**Mobile (<768px)**:
- Card-based layout (not table)
- Essential fields only (permit #, status, cost, address)
- Tap to expand full details
- Filter drawer (bottom sheet)

---

### Performance Monitoring

**Track Query Performance**:
```typescript
// Log performance metrics for optimization
function logPerformanceMetric(
  filterParams: PermitSearchParams,
  executionTime: number,
  resultCount: number
) {
  // Send to analytics
  if (executionTime > 300) {
    console.warn('Slow query detected:', {
      executionTime,
      resultCount,
      filters: Object.keys(filterParams).filter(k => filterParams[k]),
    })
  }
}
```

**Usage in Component**:
```typescript
'use client'

import { useState } from 'react'
import { usePermitsSearch } from '@/hooks/usePermitsSearch'

function PermitsTable() {
  const [filterParams, setFilterParams] = useState<PermitSearchParams>({
    page: 1,
    per_page: 50,
  })
  
  // React Query hook - automatic caching, refetching, error handling
  const { data, isLoading, error, refetch, isFetching } = usePermitsSearch(filterParams)
  
  // Log slow queries
  useEffect(() => {
    if (data && data.execution_time_ms > 300) {
      console.warn('Slow query:', {
        time: data.execution_time_ms,
        filters: filterParams,
      })
    }
  }, [data, filterParams])
  
  if (isLoading) return <TableSkeleton />
  if (error) return <ErrorState error={error} retry={refetch} />
  if (!data) return null
  
  return (
    <div>
      {isFetching && <LoadingIndicator />}
      <Table data={data.permits} />
      <Pagination {...data.pagination} />
    </div>
  )
}
```

**Setup QueryClientProvider** (`src/app/layout.tsx`):
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 3,
      },
    },
  }))

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* Only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

---

## IMPLEMENTATION STEPS (Customer-Centric Priority)

### Step 1: Update Table Columns (Remove Permit #, Prioritize Address)
**Duration: 15-30 minutes**

**Changes**:
1. Remove `permit_num` column from `PermitsTableColumns.tsx`
2. Move `full_address` to first position (most important)
3. Reorder: Address → Cost → Status → Issued Date → Builder → Description

**Test**: Verify table renders with new column order, address is clickable for future map integration

---

### Step 2: Comprehensive Filters Panel with Date Range Slider
**Duration: 2-3 hours**

**Tasks**:
1. Create `src/components/permits/PermitsTableFilters.tsx`
2. Install `nuqs` for URL state management: `bun add nuqs`
3. Implement visual date range slider (2009-2025)
4. Add cost range presets + custom inputs
5. Add postal code filter with visual map icon
6. Add status checkboxes (all 8 statuses)
7. Add builder name search
8. Add keyword search
9. Connect all filters to API via `usePermitsSearch` hook

**Performance**: 
- Debounce text inputs (300ms)
- URL parameters for shareability
- Active filter count badge

**Test**: Apply multiple filters, verify URL updates, check query performance <200ms

---

### Step 3: Map Visualization (Basic)
**Duration: 3-4 hours**

**Tasks**:
1. Install: `bun add react-leaflet leaflet`
2. Install types: `bun add -d @types/leaflet`
3. Create `src/components/permits/PermitsMap.tsx`
4. Parse PostGIS POINT format from database
5. Render markers with cost-based colors/sizes
6. Add interactive popups with permit details
7. Add view mode toggle (Table / Map / Split View)

**Features**:
- Color-coded by project size (<$500K, $500K-$1M, $1M-$5M, $5M+)
- Circle radius based on cost
- Popup with: address, cost, status, builder, issued date
- Map legend for color coding

**Test**: Click markers, verify popup data, test view mode switching

---

### Step 4: Connect Filters to API (Backend)
**Duration: 1-2 hours**

**Tasks**:
1. Update `src/app/api/permits/search/route.ts`
2. Add year range filtering (convert to issued_from/issued_to)
3. Add postal code prefix matching
4. Add builder name search (ILIKE query)
5. Test all filter combinations for performance

**Performance Validation**:
- Run EXPLAIN ANALYZE on all queries
- Verify index usage (no sequential scans)
- Target: <200ms for complex filters

**Test**: Apply all filters simultaneously, check execution time, verify result accuracy

---

### Step 5: Integrate Everything
**Duration: 1-2 hours**

**Tasks**:
1. Update `src/app/dashboard/page.tsx` to include:
   - `PermitsTableFilters` at top
   - `PermitsMapView` with table/map/split view modes
   - `PermitsTable` integrated with map selection
2. Add filter state synchronization between components
3. Add loading states during filtering
4. Add result count summary

**User Flow**:
1. User sees filters at top
2. Adjusts date slider, cost range, location
3. Results update in real-time (table + map)
4. Can toggle between table/map/split view
5. Click address → highlights on map
6. Click map marker → selects in table

**Test**: Full user workflow, verify smooth interactions

---

### Step 6: Performance Optimization & Polish
**Duration: 2-3 hours**

**Tasks**:
1. Add React.memo to table rows
2. Optimize map rendering (only show visible permits)
3. Add debouncing to all filter inputs
4. Add loading skeletons
5. Add empty states (no results, no filters)
6. Add error boundaries
7. Mobile responsive adjustments

**Performance Targets**:
- Filter application: <150ms
- Map render: <500ms for 500 permits
- Table render: <300ms
- Total Time to Interactive: <1.5s

**Test**: Apply rapid filter changes, test with large result sets (1000+ permits)

---

### Step 7: Database Indexes (Critical for Performance)
**Duration: 30 minutes**

**Run Migration**:
```sql
-- Critical performance indexes
CREATE INDEX IF NOT EXISTS idx_permits_issued_date ON permits(issued_date DESC);
CREATE INDEX IF NOT EXISTS idx_permits_application_date ON permits(application_date DESC);
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
CREATE INDEX IF NOT EXISTS idx_permits_postal ON permits(postal);
CREATE INDEX IF NOT EXISTS idx_permits_est_const_cost ON permits(est_const_cost DESC);
CREATE INDEX IF NOT EXISTS idx_permits_builder_name ON permits(builder_name);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_permits_status_issued_date 
  ON permits(status, issued_date DESC);

CREATE INDEX IF NOT EXISTS idx_permits_postal_status 
  ON permits(postal, status);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_permits_fts 
  ON permits USING GIN(to_tsvector('english', 
    COALESCE(description, '') || ' ' || 
    COALESCE(full_address, '') || ' ' || 
    COALESCE(builder_name, '')));

-- Geospatial index for map queries
CREATE INDEX IF NOT EXISTS idx_permits_location 
  ON permits USING GIST(location);
```

**Validation**:
- Run EXPLAIN ANALYZE before/after
- Verify query times drop by 80-90%
- Check index sizes (monitor disk usage)

**Test**: Re-run all filter combinations, verify <200ms execution times

---

## SUCCESS METRICS

### Technical Performance (CRITICAL)
- **Query response time**: p95 < 200ms, p99 < 400ms
- **Time to Interactive**: < 1.5 seconds
- **Filter application**: < 150ms (with debounce)
- **Cache hit rate**: > 60%
- **Export generation**: < 5 seconds (1000 rows)
- **Bundle size**: < 150KB (table components + dependencies)

### User Engagement
- **Daily usage**: 60%+ of paid users
- **Filters per session**: 3-5 average
- **Saved searches**: 2+ per user
- **Export rate**: 15-20% of sessions

### Business Impact
- **Lead generation efficiency**: 4-6 hours saved per week per user
- **Conversion to pipeline**: 3-5% of viewed permits
- **Feature satisfaction**: 4.5+ / 5.0 (user surveys)
- **Willingness to pay premium**: 70%+ of users

---

## FUTURE ENHANCEMENTS (Post-MVP)

1. **Saved Searches & Alerts**: Save filter combinations, get email when new permits match
2. **CSV Export**: Download filtered results (max 10K rows)
3. **Bulk Actions**: Select multiple permits, add to watchlist
4. **Change Highlighting**: Visual indicator for recently changed permits
5. **Map Integration**: Geographic filtering with polygon drawing
6. **Comparison Mode**: Select 2-3 permits and compare side-by-side
7. **Advanced Aggregations**: Show total construction value, avg cost by type
8. **Custom Columns**: User-defined calculated fields

---

## COMPETITIVE ADVANTAGE

**Why This Beats Raw Open Data**:
- ✅ No technical skills required (vs SQL queries)
- ✅ Real-time change detection (vs static downloads)
- ✅ Purpose-built filters (vs generic spreadsheets)
- ✅ Saved searches & alerts (vs manual checking)
- ✅ Historical change tracking (not in open data)

**Why This Beats Generic BI Tools (Tableau, Looker)**:
- ✅ Domain-specific filters (permit types, statuses)
- ✅ Construction industry workflows (builder tracking, supply chain)
- ✅ Real-time permit notifications (proactive vs reactive)
- ✅ Lower cost ($200/mo vs $1000+/mo)
- ✅ No IT setup required (instant value)

**Market Positioning**: "Permits as a Service" - we make open data **actionable** for construction professionals.

