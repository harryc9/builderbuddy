/**
 * Types for permit data
 */

export type Permit = {
  id: string
  external_id: string | null
  source: string | null
  permit_num: string
  revision_num: string | null
  permit_type: string | null
  structure_type: string | null
  work: string | null
  street_num: string | null
  street_name: string | null
  street_type: string | null
  street_direction: string | null
  postal: string | null
  geo_id: string | null
  ward_grid: string | null
  application_date: string | null
  issued_date: string | null
  completed_date: string | null
  status: string | null
  description: string | null
  current_use: string | null
  proposed_use: string | null
  dwelling_units_created: number | null
  dwelling_units_lost: number | null
  est_const_cost: number | null
  assembly: number | null
  institutional: number | null
  residential: number | null
  business_and_personal_services: number | null
  mercantile: number | null
  industrial: number | null
  interior_alterations: number | null
  demolition: number | null
  builder_name: string | null
  location: string | null // PostGIS POINT as text
  full_address: string | null
  created_at: string | null
  updated_at: string | null
  distance_km?: number | null // Distance from user location in kilometers
  user_action?: 'saved' | 'ignored' | null // User's action on this permit (included when authenticated)
  job_roles?: Array<{
    slug: string
    name: string
    color_hex: string | null
    parent_category?: string | null
  }> | null
  parent_categories?: Array<{
    slug: string
    name: string
    color_hex: string | null
  }> | null
}

export type PermitInsert = Omit<Permit, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/**
 * Types for permit database operations
 */
export type PermitDbResults = {
  inserted: number
  failed: number
  duplicates: number
  geocoded: number
}

/**
 * Types for permit change tracking
 */
export type PermitChange = {
  id?: string
  permit_id: string
  permit_num: string
  external_id: number | null
  changed_at: string
  detected_at?: string
  changed_fields: string[]
  old_values: Record<string, any>
  new_values: Record<string, any>
  change_type: 'status' | 'cost' | 'timeline' | 'scope' | 'administrative'
  business_impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  days_since_last_change: number | null
  change_count_for_permit: number | null
  created_at?: string
}

export type ChangeDetectionResult = {
  totalPermitsChecked: number
  changesDetected: number
  changesByType: Record<string, number>
  changesByImpact: Record<string, number>
  newPermits: number
  changes: PermitChange[]
}

/**
 * Types for permit search/filtering
 */
export type PermitSearchParams = {
  // Pagination
  page?: number
  per_page?: number

  // Filters
  status?: string[]
  permit_type?: string[]
  postal?: string[]
  builder_name?: string[]
  job_role_slugs?: string[] // Specific job role slugs (54 subcategories)
  parent_category_slugs?: string[] // Parent category slugs (12 categories)

  // Distance filters (requires user to have address set)
  max_distance_km?: number // Filter permits within this distance from user

  // Ranges
  cost_min?: number
  cost_max?: number
  date_from?: string // application_date
  date_to?: string
  issued_from?: string
  issued_to?: string

  // Search
  query?: string

  // Sorting
  sort_by?: string
  sort_order?: 'asc' | 'desc'

  // Advanced
  has_changes?: boolean
  change_type?: string[]
  business_impact?: string[]
  has_builder?: boolean
  has_cost?: boolean

  // View filter (saved/ignored permits)
  view?: 'all' | 'saved' | 'ignored'
}

export type PermitSearchResponse = {
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

/**
 * Types for REST API responses
 */
export type PermitsApiResponse = {
  success: boolean
  message?: string
  error?: string
  filePath?: string
  count?: number
  total_available?: number
  database_results?: PermitDbResults
  permits?: Permit[]
  changeDetection?: ChangeDetectionResult
  metrics?: {
    totalTime?: number
    downloadTime?: number
    processingTime?: number
    dataSize?: number
    memoryUsed?: number
    totalChanges?: number
    statusChanges?: number
    newPermits?: number
    updatedPermits?: number
    efficiencyScore?: number
    successCount?: number
    errorCount?: number
    errorAt?: number
    changeDetectionTime?: number
    [key: string]: any // Allow additional metrics
  }
}
