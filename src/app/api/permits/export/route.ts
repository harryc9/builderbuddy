/**
 * CSV export endpoint for permits.
 * Applies the same filter chain as /api/permits/search but returns
 * text/csv with up to 100 rows matching the current filters.
 */
import { authenticateRequest } from '@/lib/api-auth'
import type { PermitSearchParams } from '@/types/permits'
import { sb } from '@lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_EXPORT_ROWS = 100

const PARENT_CATEGORY_NAMES: Record<string, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  'hvac-mechanical': 'HVAC & Mechanical',
  'interior-finishing': 'Interior Finishing',
  'carpentry-framing': 'Carpentry & Framing',
  'masonry-concrete': 'Masonry & Concrete',
  'roofing-exteriors': 'Roofing & Exteriors',
  'insulation-envelope': 'Insulation & Envelope',
  'site-work': 'Site Work & Excavation',
  'demolition-labour': 'Demolition & Labour',
  'specialty-trades': 'Specialty Trades',
  'management-professional': 'Management & Professional',
}

const CSV_HEADERS = [
  'Permit #',
  'Address',
  'Categories',
  'Est. Cost',
  'Status',
  'Issued Date',
  'Last Updated',
  'Description',
  'Builder',
]

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatCsvDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const costMinParam = searchParams.get('cost_min')
    const costMaxParam = searchParams.get('cost_max')
    const viewParam = searchParams.get('view') as
      | 'all'
      | 'saved'
      | 'ignored'
      | null

    let userId: string | undefined
    const auth = await authenticateRequest(request)
    if (auth.success) {
      userId = auth.userId
    }

    if (viewParam && viewParam !== 'all' && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params: PermitSearchParams = {
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

    // Fetch ignored permit IDs for "all" view
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

    const hasJobRoleFilter =
      params.job_role_slugs && params.job_role_slugs.length > 0
    const hasParentCategoryFilter =
      params.parent_category_slugs && params.parent_category_slugs.length > 0
    const hasViewFilter = params.view && params.view !== 'all' && userId
    const joinHint =
      hasJobRoleFilter || hasParentCategoryFilter || hasViewFilter
        ? '!inner'
        : ''

    const userActionsJoin = hasViewFilter
      ? `, user_permit_actions!inner(action, user_id)`
      : userId
        ? `, user_permit_actions(action, user_id)`
        : ''

    let query = sb.from('permits').select(
      `
        permit_num, full_address, est_const_cost, status,
        issued_date, updated_at, description, builder_name,
        permit_job_roles${joinHint}(
          job_role_slug,
          job_role_definitions${joinHint}(
            job_role_name, job_role_slug, color_hex, parent_category
          )
        )${userActionsJoin}
      `,
    )

    // Index optimizations (same as search route)
    query = query.eq('has_address', true)
    if (!params.issued_from && !params.issued_to) {
      query = query.gte('issued_date', '2020-01-01')
    }

    if (hasJobRoleFilter) {
      query = query.in('permit_job_roles.job_role_slug', params.job_role_slugs!)
    }
    if (hasParentCategoryFilter) {
      query = query.in(
        'permit_job_roles.job_role_definitions.parent_category',
        params.parent_category_slugs!,
      )
    }

    // View filter
    if (hasViewFilter) {
      query = query.eq('user_permit_actions.user_id', userId!)
      query = query.eq('user_permit_actions.action', params.view!)
    } else if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`, {
        referencedTable: 'user_permit_actions',
      })
      if (ignoredPermitIds.length > 0) {
        query = query.not('id', 'in', `(${ignoredPermitIds.join(',')})`)
      }
    } else if (ignoredPermitIds.length > 0) {
      query = query.not('id', 'in', `(${ignoredPermitIds.join(',')})`)
    }

    // Apply same filters as search route
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status)
    }
    if (params.permit_type && params.permit_type.length > 0) {
      query = query.in('permit_type', params.permit_type)
    }
    if (params.postal && params.postal.length > 0) {
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
    if (params.cost_min !== undefined || params.cost_max !== undefined) {
      query = query.not('est_const_cost', 'is', null)
      query = query.gt('est_const_cost', 0)
      if (params.cost_min !== undefined && params.cost_min > 0) {
        query = query.gte('est_const_cost', params.cost_min)
      }
      if (params.cost_max !== undefined) {
        query = query.lte('est_const_cost', params.cost_max)
      }
    }
    if (params.issued_from) {
      query = query.gte('issued_date', params.issued_from)
    }
    if (params.issued_to) {
      query = query.lte('issued_date', params.issued_to)
    }
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

    query = query.range(0, MAX_EXPORT_ROWS - 1)

    type PermitRow = {
      permit_num: string
      full_address: string | null
      est_const_cost: number | null
      status: string | null
      issued_date: string | null
      updated_at: string | null
      description: string | null
      builder_name: string | null
      permit_job_roles: Array<{
        job_role_slug: string
        job_role_definitions: {
          job_role_name: string
          parent_category: string | null
        } | null
      }> | null
    }

    const { data: permits, error } = (await query) as {
      data: PermitRow[] | null
      error: { message: string } | null
    }

    if (error) {
      return NextResponse.json(
        { error: 'Export query failed' },
        { status: 500 },
      )
    }

    type CsvRow = {
      permit_num: string
      full_address: string | null
      categories: string
      est_const_cost: number | null
      status: string | null
      issued_date: string | null
      updated_at: string | null
      description: string | null
      builder_name: string | null
    }

    const seen = new Map<string, CsvRow>()

    for (const permit of (permits as PermitRow[]) || []) {
      const key = permit.permit_num
      if (seen.has(key)) continue

      const parentCategorySlugs = new Set<string>()
      permit.permit_job_roles?.forEach((pjr) => {
        if (pjr.job_role_definitions?.parent_category) {
          parentCategorySlugs.add(pjr.job_role_definitions.parent_category)
        }
      })

      seen.set(key, {
        permit_num: permit.permit_num,
        full_address: permit.full_address,
        categories: Array.from(parentCategorySlugs)
          .map((slug) => PARENT_CATEGORY_NAMES[slug] || slug)
          .join(', '),
        est_const_cost: permit.est_const_cost,
        status: permit.status,
        issued_date: permit.issued_date,
        updated_at: permit.updated_at,
        description: permit.description,
        builder_name: permit.builder_name,
      })
    }

    const rows = Array.from(seen.values())

    // Build CSV
    const csvLines = [CSV_HEADERS.join(',')]
    for (const row of rows) {
      csvLines.push(
        [
          escapeCsvField(row.permit_num),
          escapeCsvField(row.full_address),
          escapeCsvField(row.categories),
          row.est_const_cost != null && row.est_const_cost !== 0
            ? String(row.est_const_cost)
            : '',
          escapeCsvField(row.status),
          escapeCsvField(formatCsvDate(row.issued_date)),
          escapeCsvField(formatCsvDate(row.updated_at)),
          escapeCsvField(row.description),
          escapeCsvField(row.builder_name),
        ].join(','),
      )
    }

    const csv = csvLines.join('\n')
    const today = new Date().toISOString().slice(0, 10)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="permits-export-${today}.csv"`,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
