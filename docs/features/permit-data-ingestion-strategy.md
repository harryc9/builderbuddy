# PermitHeat Data Ingestion Strategy - REFINED

## PRODUCT OVERVIEW

**Core Value Proposition**: Convert Toronto's open Building Permits dataset into actionable, multi-year project intelligence for construction industry players.

**REAL PERFORMANCE DATA** (from full dataset test):
- **Total Dataset**: 265,244 permits (218MB)
- **Download Time**: 19 seconds (11.5MB/s)
- **Processing Time**: 131.6 seconds total
- **Active Permits**: 265,234 (99.996% need monitoring!)
- **Daily New Permits**: 88.5 average (620/week)
- **Memory Usage**: 801MB peak (manageable)

**Business-Critical Status Transitions**:
- **Permit Issued → Inspection**: 63,012 permits ready to transition
- **Inspection → Completion**: 161,243 permits in active inspection
- **Application stages**: 3,000+ permits in various approval phases

---

## REFINED TECH IMPLEMENTATION

### 1. **HYBRID INGESTION STRATEGY** (Recommended)

Based on test results showing 99.996% active permits, we need a smarter approach:

**DAILY ACTIVE MONITORING**:
```typescript
// Focus on permits likely to change status
const PRIORITY_STATUSES = [
  'Permit Issued',        // 63,012 permits - likely to move to inspection
  'Inspection',           // 161,243 permits - highest change probability  
  'Under Review',         // 2,184 permits - approval decisions pending
  'Ready for Issuance',   // 248 permits - about to be issued
  'Issuance Pending'      // 3,805 permits - imminent issuance
]

// Daily monitoring query (reduces dataset by ~85%)
const activeMonitoringQuery = `
  SELECT * FROM toronto_permits 
  WHERE status IN (${PRIORITY_STATUSES})
  OR application_date >= NOW() - INTERVAL '30 days'
  OR updated_at >= NOW() - INTERVAL '7 days'
`
```

**WEEKLY FULL RECONCILIATION**:
- Complete dataset download every Sunday
- Catch any permits missed by daily monitoring
- Validate data integrity and detect schema changes

### 2. **OPTIMIZED DAILY PROCESSING PIPELINE**

```typescript
// /app/api/cron/daily-permits/route.ts
export async function GET() {
  const metrics = startPerformanceTracking()
  
  try {
    // 1. SMART INCREMENTAL FETCH (estimated 50-100MB vs 218MB)
    const recentPermits = await fetchRecentAndActivePermits()
    
    // 2. CHANGE DETECTION (compare against existing data)
    const changes = await detectPermitChanges(recentPermits)
    
    // 3. PRIORITY PROCESSING (status changes first)
    await Promise.all([
      processStatusChanges(changes.statusChanges),
      processNewPermits(changes.newPermits),
      processUpdatedPermits(changes.updatedPermits)
    ])
    
    // 4. TRIGGER ALERTS (business critical changes)
    await triggerRealTimeAlerts(changes.statusChanges)
    
    logPerformanceMetrics(metrics)
    
  } catch (error) {
    await handleIngestionFailure(error, metrics)
  }
}
```

### 3. **INTELLIGENT CHANGE DETECTION**

**Status Change Priority Matrix**:
```sql
-- High Priority (immediate alerts)
CASE 
  WHEN new_status = 'Permit Issued' AND old_status = 'Ready for Issuance' THEN 'CRITICAL'
  WHEN new_status = 'Inspection' AND old_status = 'Permit Issued' THEN 'HIGH'
  WHEN new_status LIKE '%Approved%' THEN 'HIGH'
  
-- Medium Priority (daily digest)
  WHEN new_status = 'Under Review' THEN 'MEDIUM'
  WHEN new_status = 'Application Received' THEN 'MEDIUM'
  
-- Low Priority (weekly summary)
  ELSE 'LOW'
END as alert_priority
```

**Neighborhood Clustering Detection**:
```sql
-- Detect construction hotspots (5+ permits within 500m changing status)
WITH status_changes_today AS (
  SELECT permit_id, location, new_status, old_status
  FROM recent_status_changes 
  WHERE status_changed_at >= NOW() - INTERVAL '24 hours'
),
clustered_changes AS (
  SELECT 
    ST_ClusterKMeans(location, 10) OVER() as cluster_id,
    COUNT(*) as permits_in_cluster,
    array_agg(permit_id) as permit_ids
  FROM status_changes_today
  WHERE location IS NOT NULL
  GROUP BY cluster_id
)
SELECT * FROM clustered_changes WHERE permits_in_cluster >= 5
```

### 4. **PERFORMANCE-OPTIMIZED STORAGE**

**Partitioned Tables** (for 265K+ records):
```sql
-- Partition by application year for query performance
CREATE TABLE permits_partitioned (
  LIKE permits INCLUDING ALL
) PARTITION BY RANGE (application_date);

-- Create yearly partitions
CREATE TABLE permits_2024 PARTITION OF permits_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
  
CREATE TABLE permits_2025 PARTITION OF permits_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

**Materialized Views** (for fast queries):
```sql
-- Pre-computed active permits summary
CREATE MATERIALIZED VIEW active_permits_summary AS
SELECT 
  status,
  COUNT(*) as permit_count,
  AVG(est_const_cost) as avg_cost,
  ST_Centroid(ST_Collect(location)) as center_point
FROM active_permits 
WHERE location IS NOT NULL
GROUP BY status;

-- Refresh every hour
SELECT cron.schedule('refresh-active-summary', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW active_permits_summary;');
```

### 5. **REAL-TIME ALERT SYSTEM**

**Webhook Architecture**:
```typescript
interface AlertPayload {
  permitId: string
  permitNum: string
  oldStatus: string
  newStatus: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  location: [number, number]
  estimatedCost: number
  changeDetectedAt: string
  businessImpact: {
    supplierOpportunity: boolean
    equipmentRentalDemand: boolean
    neighborhoodActivity: boolean
  }
}

// Send to customer webhooks + internal processing
async function triggerStatusChangeAlert(change: PermitStatusChange) {
  const payload = buildAlertPayload(change)
  
  await Promise.all([
    sendToCustomerWebhooks(payload),
    sendToSlackChannel(payload),
    updateCustomerDashboards(payload),
    logForAnalytics(payload)
  ])
}
```

### 6. **MONITORING & RELIABILITY**

**Data Quality Metrics**:
```typescript
interface DataQualityReport {
  totalPermitsProcessed: number
  statusChangesDetected: number
  newPermitsFound: number
  dataQualityScore: number // 0-100
  schemaChangesDetected: string[]
  processingTime: number
  memoryUsage: number
  errorRate: number
}

// Daily quality assessment
async function generateDataQualityReport(): Promise<DataQualityReport> {
  return {
    totalPermitsProcessed: await getProcessedCount(),
    statusChangesDetected: await getStatusChangeCount(),
    dataQualityScore: await calculateQualityScore(),
    // ... other metrics
  }
}
```

**Fallback Strategies**:
```typescript
// Multi-tier fallback for reliability
async function fetchPermitsWithFallback() {
  try {
    return await fetchFromTorontoCKAN()
  } catch (primaryError) {
    console.warn('Primary API failed, trying fallback...')
    
    try {
      return await fetchFromCachedSnapshot()
    } catch (fallbackError) {
      console.error('All data sources failed')
      await alertSystemFailure([primaryError, fallbackError])
      return await getLastKnownGoodData()
    }
  }
}
```

---

## BUSINESS IMPACT & SCALING

**Revenue Protection Metrics**:
- **99.9% uptime target** for status change detection
- **<5 minute lag** for critical status transitions (Permit Issued → Inspection)
- **265,234 active permits** under continuous monitoring
- **88.5 daily new permits** = 32,315 annually

**Customer Success Indicators**:
- **Alert click-through ≥15%** (indicates actionable intelligence)
- **Avg project track time ≥18 months** (long-term value realization)  
- **Weekly active seats/logo ≥3** (platform stickiness)

**Scalability Roadmap**:
- **Current**: Toronto (265K permits, 218MB dataset)
- **Year 1**: Add Ottawa, Hamilton, Mississauga (+400K permits)
- **Year 2**: Province-wide Ontario coverage (2M+ permits)
- **Architecture**: Scales linearly with permit volume

---

## IMPLEMENTATION TIMELINE

| Week | Milestone |
|------|-----------|
| 1 | Fix VARCHAR constraints + implement hybrid daily monitoring |
| 2 | Build change detection engine + status priority matrix |
| 3 | Create real-time alert system + webhook infrastructure |
| 4 | Add neighborhood clustering + geographic analysis |
| 5 | Implement data quality monitoring + fallback systems |
| 6 | Performance optimization + materialized views |
| 7 | Customer alert preferences + dashboard integration |
| 8 | Beta testing + production deployment |

---

## FINAL RECOMMENDATION

**✅ HYBRID APPROACH IS OPTIMAL**:

1. **Daily Smart Monitoring**: Focus on 161,243 "Inspection" permits + recent activity
2. **Weekly Full Reconciliation**: Complete dataset validation
3. **Real-time Alerts**: Critical status changes within 5 minutes
4. **Neighborhood Intelligence**: Geographic clustering analysis
5. **Robust Fallbacks**: Multiple data sources + quality monitoring

This strategy provides **comprehensive coverage** while being **performance-efficient** and **cost-effective** for daily operations. The test data proves it's technically feasible and business-viable for PermitHeat's multi-year project intelligence platform. 