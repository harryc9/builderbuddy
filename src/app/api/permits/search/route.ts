import { authenticateRequest } from '@/lib/api-auth'
import type { PermitSearchParams, PermitSearchResponse } from '@/types/permits'
import type { Database } from '@/types/supabase.public.types'
import { sb } from '@lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Deploy to edge for lower latency
export const dynamic = 'force-dynamic'

/**
 * Handle distance-based permit search using optimized PostGIS function
 * Uses spatial indexes and efficient geography calculations
 */
async function handleDistanceSearch({
  startTime,
  params,
  page,
  per_page,
  userLat,
  userLng,
}: {
  startTime: number
  params: PermitSearchParams
  page: number
  per_page: number
  userLat: number
  userLng: number
}) {
  const offset = (page - 1) * per_page

  // Define the return type for the RPC function
  type DistanceSearchResult = {
    permit_id: string
    permit_num: string
    full_address: string
    description: string
    status: string
    issued_date: string
    est_const_cost: number
    distance_km: number
    permit_data: Record<string, unknown>
  }

  // Call the distance search function
  const { data: results, error } = await sb.rpc(
    'search_permits_with_distance',
    {
      user_lat: userLat,
      user_lng: userLng,
      max_distance_km: params.max_distance_km,
      search_query: params.query,
      job_role_slugs: params.job_role_slugs?.length
        ? params.job_role_slugs
        : undefined,
      parent_category_slugs: params.parent_category_slugs?.length
        ? params.parent_category_slugs
        : undefined,
      status_filter: params.status?.length ? params.status : undefined,
      min_cost: params.cost_min,
      max_cost: params.cost_max,
      issued_from: params.issued_from,
      issued_to: params.issued_to,
      limit_count: per_page,
      offset_count: offset,
    },
  )

  if (error) {
    console.error('❌ Distance search error:', error)
    return NextResponse.json(
      { error: 'Distance search failed', details: error.message },
      { status: 500 },
    )
  }

  // Transform results to match expected format
  const permits =
    (results as DistanceSearchResult[] | null)?.map((r) => ({
      ...(r.permit_data as any),
      distance_km: r.distance_km,
    })) || []

  // For distance-based searches, we don't have exact count
  // Estimate based on whether we got a full page
  const hasMore = permits.length === per_page
  const estimatedTotal = hasMore
    ? page * per_page + per_page
    : (page - 1) * per_page + permits.length

  const response: PermitSearchResponse = {
    permits,
    pagination: {
      page,
      per_page,
      total_count: estimatedTotal,
      total_pages: Math.ceil(estimatedTotal / per_page),
      has_next: hasMore,
      has_prev: page > 1,
    },
    execution_time_ms: Date.now() - startTime,
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const per_page = Math.min(
      Number.parseInt(searchParams.get('per_page') || '50', 10),
      100,
    )

    const costMinParam = searchParams.get('cost_min')
    const costMaxParam = searchParams.get('cost_max')
    const maxDistanceParam = searchParams.get('max_distance_km')
    const userLatParam = searchParams.get('user_lat')
    const userLngParam = searchParams.get('user_lng')
    const viewParam = searchParams.get('view') as
      | 'all'
      | 'saved'
      | 'ignored'
      | null

    // Get authenticated user for view filtering
    // Always get user if they're authenticated, so we can exclude ignored permits from 'all' view
    let userId: string | undefined
    const auth = await authenticateRequest(request)

    if (auth.success) {
      userId = auth.userId
    }

    // Only require auth for saved/ignored views
    if (viewParam && viewParam !== 'all' && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params: PermitSearchParams = {
      page,
      per_page,
      status: searchParams.getAll('status'),
      permit_type: searchParams.getAll('permit_type'),
      postal: searchParams.getAll('postal'),
      builder_name: searchParams.getAll('builder_name'),
      job_role_slugs: searchParams.getAll('job_role_slugs'),
      parent_category_slugs: searchParams.getAll('parent_category_slugs'),
      cost_min:
        costMinParam !== null ? Number.parseFloat(costMinParam) : undefined,
      cost_max:
        costMaxParam !== null ? Number.parseFloat(costMaxParam) : undefined,
      max_distance_km:
        maxDistanceParam !== null
          ? Number.parseFloat(maxDistanceParam)
          : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      issued_from: searchParams.get('issued_from') || undefined,
      issued_to: searchParams.get('issued_to') || undefined,
      query: searchParams.get('query') || undefined,
      sort_by: searchParams.get('sort_by') || 'issued_date',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
      has_builder:
        searchParams.get('has_builder') === 'true' ? true : undefined,
      has_cost: searchParams.get('has_cost') === 'true' ? true : undefined,
      view: (searchParams.get('view') as 'all' | 'saved' | 'ignored') || 'all',
    }

    // Only use distance search when explicitly filtering by distance
    // Having coordinates alone isn't enough - user must specify max_distance_km
    if (userLatParam && userLngParam && params.max_distance_km) {
      const userLat = Number.parseFloat(userLatParam)
      const userLng = Number.parseFloat(userLngParam)

      if (!Number.isNaN(userLat) && !Number.isNaN(userLng)) {
        return handleDistanceSearch({
          startTime,
          params,
          page,
          per_page,
          userLat,
          userLng,
        })
      }
    }

    // ============================================================================
    // PERFORMANCE OPTIMIZATION: Filter Detection
    // ============================================================================
    // This check is CRITICAL for performance. When adding a new filter:
    // 1. Add it to PermitSearchParams type (src/types/permits.ts)
    // 2. Add check here (maintain alphabetical order for readability)
    // 3. Add performance test in route.core.test.ts
    // 4. Update docs/database-maintenance.md
    //
    // Why? We skip COUNT on unfiltered page 1 (saves 1-2s) but need accurate
    // counts with filters. Missing a filter here = incorrect pagination.
    // ============================================================================
    const hasAnyFilters =
      params.status?.length ||
      params.permit_type?.length ||
      params.postal?.length ||
      params.builder_name?.length ||
      params.job_role_slugs?.length ||
      params.parent_category_slugs?.length ||
      params.cost_min !== undefined ||
      params.cost_max !== undefined ||
      params.date_from ||
      params.date_to ||
      params.issued_from ||
      params.issued_to ||
      params.query ||
      params.has_builder !== undefined ||
      params.has_cost !== undefined ||
      params.view !== 'all'
    // 👆 ADD NEW FILTERS ABOVE THIS LINE

    // Only skip count for default page 1 with NO filters
    const useCount = page > 1 || hasAnyFilters
    const useExactCount = searchParams.get('exact_count') === 'true'

    // For "all" view: fetch ignored permit IDs first (fast, indexed query)
    let ignoredPermitIds: string[] = []
    if (params.view === 'all' && userId) {
      const { data: ignoredActions } = await sb
        .from('user_permit_actions')
        .select('permit_id')
        .eq('user_id', userId)
        .eq('action', 'ignored')

      if (ignoredActions && ignoredActions.length > 0) {
        ignoredPermitIds = ignoredActions.map((a) => a.permit_id)
      }
    }

    // Determine join type: use inner join when filtering by job roles, parent categories, or view
    const hasJobRoleFilter =
      params.job_role_slugs && params.job_role_slugs.length > 0
    const hasParentCategoryFilter =
      params.parent_category_slugs && params.parent_category_slugs.length > 0
    const hasViewFilter = params.view && params.view !== 'all' && userId
    const joinType =
      hasJobRoleFilter || hasParentCategoryFilter || hasViewFilter
        ? 'inner'
        : 'left'

    // Build main query - inner join filters permits, left join gets all roles
    const joinHint = joinType === 'inner' ? '!inner' : ''

    // Add user_permit_actions join
    // - For saved/ignored views: inner join (filters permits)
    // - For all view (authenticated): left join (includes action state without filtering)
    const userActionsJoin = hasViewFilter
      ? `,
        user_permit_actions!inner(action, user_id)`
      : userId
        ? `,
        user_permit_actions(action, user_id)`
        : ''

    let query = sb.from('permits').select(
      `
        *,
        permit_job_roles${joinHint}(
          job_role_slug,
          job_role_definitions${joinHint}(
            job_role_name,
            job_role_slug,
            color_hex,
            parent_category
          )
        )${userActionsJoin}
      `,
      {
        count: useCount ? (useExactCount ? 'planned' : 'estimated') : undefined,
      },
    )

    // ============================================================================
    // INDEX OPTIMIZATION: has_address + issued_date
    // ============================================================================
    // Uses idx_permits_has_address_issued_composite for 85x speedup (2470ms → 29ms)
    // Generated column (has_address) is faster than NULL checks
    // See: docs/sql-optimization.md for EXPLAIN ANALYZE results
    // ============================================================================
    query = query.eq('has_address', true)

    // ============================================================================
    // INDEX OPTIMIZATION: Force date range for partial index
    // ============================================================================
    // Ensures query planner uses idx_permits_has_address_issued_composite
    // which has WHERE issued_date >= '2020-01-01'
    // Without this, query planner may choose Sequential Scan (very slow)
    // ============================================================================
    if (!params.issued_from && !params.issued_to) {
      query = query.gte('issued_date', '2020-01-01')
    }

    // Filter by job role slugs using the inner-joined table
    if (hasJobRoleFilter) {
      query = query.in('permit_job_roles.job_role_slug', params.job_role_slugs!)
    }

    // Filter by parent category slugs
    if (hasParentCategoryFilter) {
      query = query.in(
        'permit_job_roles.job_role_definitions.parent_category',
        params.parent_category_slugs!,
      )
    }

    // ============================================================================
    // VIEW FILTER: Saved/Ignored Permits
    // ============================================================================
    // Filter permits based on user's saved/ignored actions
    // - 'all': Exclude ignored permits (simple NOT IN - fast with index)
    // - 'saved': Only show saved permits (inner join)
    // - 'ignored': Only show ignored permits (inner join)
    // ============================================================================
    if (hasViewFilter) {
      query = query.eq('user_permit_actions.user_id', userId!)
      query = query.eq('user_permit_actions.action', params.view!)
    } else if (userId) {
      // For authenticated users in 'all' view, filter LEFT JOIN to current user
      // This ensures user_action field only contains their own actions
      query = query.or(`user_id.eq.${userId},user_id.is.null`, {
        referencedTable: 'user_permit_actions',
      })

      // Still exclude ignored permits from 'all' view
      if (ignoredPermitIds.length > 0) {
        query = query.not('id', 'in', `(${ignoredPermitIds.join(',')})`)
      }
    } else if (ignoredPermitIds.length > 0) {
      // For 'all' view, exclude ignored permits with simple NOT IN
      query = query.not('id', 'in', `(${ignoredPermitIds.join(',')})`)
    }

    // Apply filters
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status)
    }

    if (params.permit_type && params.permit_type.length > 0) {
      query = query.in('permit_type', params.permit_type)
    }

    if (params.postal && params.postal.length > 0) {
      // Match postal code prefix (e.g., 'M4B' matches 'M4B 1A1')
      const postalFilters = params.postal.map((p) => `postal.ilike.${p}%`)
      query = query.or(postalFilters.join(','))
    }

    if (params.builder_name && params.builder_name.length > 0) {
      query = query.in('builder_name', params.builder_name)
    }

    if (params.has_builder !== undefined) {
      if (params.has_builder) {
        query = query.not('builder_name', 'is', null)
      } else {
        query = query.is('builder_name', null)
      }
    }

    if (params.has_cost !== undefined) {
      if (params.has_cost) {
        query = query.not('est_const_cost', 'is', null)
        query = query.gt('est_const_cost', 0)
      } else {
        query = query.or('est_const_cost.is.null,est_const_cost.eq.0')
      }
    }

    // Cost filters - exclude null and $0 values when filtering by cost
    if (params.cost_min !== undefined || params.cost_max !== undefined) {
      query = query.not('est_const_cost', 'is', null)
      query = query.gt('est_const_cost', 0) // Exclude $0 permits

      // Only apply cost_min filter if it's greater than 0 (to avoid conflict with gt(0))
      if (params.cost_min !== undefined && params.cost_min > 0) {
        query = query.gte('est_const_cost', params.cost_min)
      }

      if (params.cost_max !== undefined) {
        query = query.lte('est_const_cost', params.cost_max)
      }
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

    // Full-text search (uses existing FTS column with GIN index)
    if (params.query) {
      query = query.textSearch('fts', params.query, {
        type: 'websearch',
        config: 'english',
      })
    }

    // Sorting
    query = query.order(params.sort_by || 'issued_date', {
      ascending: params.sort_order === 'asc',
      nullsFirst: false,
    })

    // Pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)

    const {
      data: permits,
      error,
      count,
    } = (await query) as {
      data: any[] | null
      error: any
      count: number | null
    }

    if (error) {
      // Handle the case where offset exceeds available rows (PGRST103)
      if (error.code === 'PGRST103') {
        // Return empty result set with correct pagination metadata
        const response: PermitSearchResponse = {
          permits: [],
          pagination: {
            page,
            per_page,
            total_count: count ?? 0,
            total_pages: count ? Math.ceil(count / per_page) : 0,
            has_next: false,
            has_prev: page > 1,
          },
          execution_time_ms: Date.now() - startTime,
        }
        return NextResponse.json(response)
      }

      console.error('Database query error:', error)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 },
      )
    }

    const executionTime = Date.now() - startTime

    // Add distances to permits if user coordinates are provided (for display only, not filtering)
    let permitsWithDistance = permits
    if (userLatParam && userLngParam && permits && permits.length > 0) {
      const userLat = Number.parseFloat(userLatParam)
      const userLng = Number.parseFloat(userLngParam)

      if (!Number.isNaN(userLat) && !Number.isNaN(userLng)) {
        try {
          const permitIds = permits.map((p) => p.id)
          const { data: distances } = await sb.rpc('add_distance_to_permits', {
            permit_uuids: permitIds,
            user_lat: userLat,
            user_lng: userLng,
          })

          if (distances) {
            // Create distance lookup map
            const distanceMap = new Map(
              distances.map((d: any) => [d.permit_id, d.distance_km]),
            )

            // Add distances to permits
            permitsWithDistance = permits.map((permit: any) => ({
              ...permit,
              distance_km: distanceMap.get(permit.id) || null,
            }))
          }
        } catch (err) {
          console.error('Error calculating distances:', err)
          // Continue without distances if calculation fails
        }
      }
    }

    // Transform nested job roles structure to flat array
    type PermitWithJobRoles = Database['public']['Tables']['permits']['Row'] & {
      permit_job_roles: Array<{
        job_role_slug: string
        job_role_definitions:
          | Database['public']['Tables']['job_role_definitions']['Row']
          | null
      }> | null
      user_permit_actions?: Array<{
        action: 'saved' | 'ignored'
        user_id: string
      }> | null
    }

    // When using inner join with job role filter, we get duplicate permits (one per role match)
    // Need to deduplicate and merge job roles
    const permitMap = new Map<string, ReturnType<typeof transformPermit>>()

    function transformPermit(permit: PermitWithJobRoles) {
      const jobRoles =
        permit.permit_job_roles
          ?.filter(
            (
              pjr,
            ): pjr is typeof pjr & {
              job_role_definitions: NonNullable<typeof pjr.job_role_definitions>
            } =>
              pjr?.job_role_definitions !== null &&
              pjr?.job_role_definitions !== undefined,
          )
          .map((pjr) => ({
            slug: pjr.job_role_definitions.job_role_slug,
            name: pjr.job_role_definitions.job_role_name,
            color_hex: pjr.job_role_definitions.color_hex,
            parent_category: pjr.job_role_definitions.parent_category,
          })) || null

      // Extract unique parent categories
      const parentCategories = jobRoles
        ? Array.from(
            new Map(
              jobRoles
                .filter((role) => role.parent_category)
                .map((role) => [role.parent_category, role]),
            ).values(),
          ).map((role) => ({
            slug: role.parent_category!,
            name: role.parent_category!, // Will be enriched by client if needed
            color_hex: role.color_hex,
          }))
        : null

      // Extract user action (will be null if not authenticated or no action)
      const userAction =
        permit.user_permit_actions && permit.user_permit_actions.length > 0
          ? permit.user_permit_actions[0].action
          : null

      const {
        permit_job_roles: _,
        user_permit_actions: __,
        location,
        ...permitWithoutJoined
      } = permit
      return {
        ...permitWithoutJoined,
        location: location as string | null,
        user_action: userAction,
        job_roles: jobRoles,
        parent_categories: parentCategories,
      }
    }

    for (const permit of (permitsWithDistance as PermitWithJobRoles[]) || []) {
      if (hasJobRoleFilter) {
        // With inner join, we may have duplicates - merge job roles
        const existing = permitMap.get(permit.id)
        if (existing) {
          // Merge job roles from duplicate entries
          const existingRoles = existing.job_roles || []
          const newRoles =
            permit.permit_job_roles
              ?.filter(
                (
                  pjr,
                ): pjr is typeof pjr & {
                  job_role_definitions: NonNullable<
                    typeof pjr.job_role_definitions
                  >
                } =>
                  pjr?.job_role_definitions !== null &&
                  pjr?.job_role_definitions !== undefined,
              )
              .map((pjr) => ({
                slug: pjr.job_role_definitions.job_role_slug,
                name: pjr.job_role_definitions.job_role_name,
                color_hex: pjr.job_role_definitions.color_hex,
                parent_category: pjr.job_role_definitions.parent_category,
              })) || []

          // Deduplicate by slug
          const roleMap = new Map(existingRoles.map((r) => [r.slug, r]))
          for (const role of newRoles) {
            roleMap.set(role.slug, role)
          }
          existing.job_roles = Array.from(roleMap.values())

          // Recalculate parent categories
          existing.parent_categories = Array.from(
            new Map(
              existing.job_roles
                .filter((role) => role.parent_category)
                .map((role) => [role.parent_category, role]),
            ).values(),
          ).map((role) => ({
            slug: role.parent_category!,
            name: role.parent_category!,
            color_hex: role.color_hex,
          }))
        } else {
          permitMap.set(permit.id, transformPermit(permit))
        }
      } else {
        // No duplicates with left join
        permitMap.set(permit.id, transformPermit(permit))
      }
    }

    const transformedPermits = Array.from(permitMap.values())

    // For default first page without count, estimate based on table size
    // Only use estimate when no filters and page 1
    const estimatedTotalForDefaultPage =
      !hasAnyFilters && page === 1 ? 250000 : undefined
    const totalCount = count ?? estimatedTotalForDefaultPage ?? 0

    const response: PermitSearchResponse = {
      permits: transformedPermits,
      pagination: {
        page,
        per_page,
        total_count: totalCount,
        total_pages: totalCount ? Math.ceil(totalCount / per_page) : 0,
        has_next: permits ? permits.length === per_page : false,
        has_prev: page > 1,
      },
      execution_time_ms: executionTime,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
