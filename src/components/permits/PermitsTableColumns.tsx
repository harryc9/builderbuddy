import { Badge } from '@/components/ui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Permit } from '@/types/permits'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, Copy } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { useCallback, useState } from 'react'
import { PermitActionButtons } from './PermitActionButtons'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    },
    [text],
  )

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover/cell:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted transition-opacity"
    >
      {copied ? (
        <Check size={13} className="text-green-500" />
      ) : (
        <Copy size={13} className="text-muted-foreground" />
      )}
    </button>
  )
}

// Shorthand mapping for parent categories (by slug)
const PARENT_CATEGORY_SHORTHAND: Record<string, string> = {
  electrical: 'Elec',
  plumbing: 'Plumb',
  'hvac-mechanical': 'HVAC',
  'interior-finishing': 'Interior',
  'carpentry-framing': 'Carp',
  'masonry-concrete': 'Masonry',
  'roofing-exteriors': 'Roofing',
  'insulation-envelope': 'Insul',
  'site-work': 'Site',
  'demolition-labour': 'Demo',
  'specialty-trades': 'Special',
  'management-professional': 'Mgmt',
}

function getParentCategoryShorthand(slug: string): string {
  return PARENT_CATEGORY_SHORTHAND[slug] || slug
}

// Status badge variants
function getStatusVariant(
  status: string | null,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!status) return 'outline'

  if (status === 'Permit Issued') return 'default'
  if (status === 'Inspection') return 'secondary'
  if (status === 'Completed') return 'outline'
  if (status.includes('Review')) return 'secondary'

  return 'outline'
}

// Format currency
function formatCurrency(amount: number | null): string {
  // Treat null, undefined, and 0 as no cost data
  if (amount === null || amount === undefined || amount === 0) return '–'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date
function formatDate(dateString: string | null): string {
  if (!dateString) return '–'

  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Parse PostGIS POINT format - handles both string and object formats
function parseLocation(
  location: string | Record<string, any> | null,
): [number, number] | null {
  if (!location) return null

  // Handle string format: "POINT(lng lat)"
  if (typeof location === 'string') {
    const match = location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
    if (!match) return null
    return [parseFloat(match[1]), parseFloat(match[2])]
  }

  // Handle GeoJSON format: {type: 'Point', coordinates: [lng, lat]}
  if (
    typeof location === 'object' &&
    location.coordinates &&
    Array.isArray(location.coordinates)
  ) {
    return [location.coordinates[0], location.coordinates[1]]
  }

  return null
}

// CUSTOMER PRIORITY ORDER:
// 0. Job Categories (quick visual indicator for targeting)
// 1. Address (location-first)
// 2. Cost (money drives decisions)
// 3. Status (project stage)
// 4. Issued Date (timing)
// 5. Description (project details - brief with hover)
// 6. Builder (competitive intelligence)

// Hook to get selected parent category slugs for highlighting
function useSelectedParentCategories(): string[] {
  const [parentCategorySlugs] = useQueryState(
    'parent_category_slugs',
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  return parentCategorySlugs
}

export const columns: ColumnDef<Permit>[] = [
  // 0. ACTIONS - Save/Ignore buttons
  {
    id: 'actions',
    header: '', // No header text
    cell: ({ row }) => {
      const permitId = row.original.id
      const userAction = row.original.user_action || null

      return <PermitActionButtons permitId={permitId} userAction={userAction} />
    },
    size: 80,
    enableSorting: false,
  },
  // 1. ADDRESS - Most important (location, location, location)
  {
    accessorKey: 'full_address',
    header: 'Address',
    cell: ({ row, table }) => {
      const address = row.getValue('full_address') as string | null
      const location = row.original.location

      // Get user coordinates from table meta
      const meta = table.options.meta as
        | { userLat?: number | null; userLng?: number | null }
        | undefined
      const userLat = meta?.userLat
      const userLng = meta?.userLng

      // Calculate distance if both user location and permit location exist
      let distance: number | null = null
      if (userLat != null && userLng != null && location) {
        const permitCoords = parseLocation(location)

        if (permitCoords) {
          distance = calculateDistance(
            userLat,
            userLng,
            permitCoords[1],
            permitCoords[0],
          )
        }
      }

      return (
        <div className="min-w-[200px] max-w-[300px] flex items-center gap-2">
          <div
            className="font-medium cursor-pointer hover:text-primary transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
            title={address || '–'}
          >
            {address || '–'}
          </div>
          {distance !== null && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 whitespace-nowrap shrink-0"
            >
              {distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  // 1. PARENT CATEGORIES - Visual filtering for trade targeting
  {
    accessorKey: 'parent_categories',
    header: 'Categories',
    cell: ({ row }) => {
      const parentCategories = row.getValue(
        'parent_categories',
      ) as Permit['parent_categories']
      const selectedSlugs = useSelectedParentCategories()

      if (!parentCategories || parentCategories.length === 0) {
        return (
          <div className="text-muted-foreground text-xs min-w-[120px]">–</div>
        )
      }

      // Sort categories: selected ones first, then others
      const sortedCategories = [...parentCategories].sort((a, b) => {
        const aSelected = selectedSlugs.includes(a.slug)
        const bSelected = selectedSlugs.includes(b.slug)
        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1
        return 0
      })

      const visibleCategories = sortedCategories.slice(0, 3)
      const remainingCount = sortedCategories.length - 3

      return (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <div className="flex gap-1 items-center min-w-[120px] max-w-[200px] cursor-pointer">
              {visibleCategories.map((category) => (
                <Badge
                  key={category.slug}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 whitespace-nowrap font-medium flex items-center gap-1"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: category.color_hex || '#6B7280',
                    }}
                  />
                  {getParentCategoryShorthand(category.slug)}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-medium"
                >
                  +{remainingCount}
                </Badge>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto max-w-md" align="start">
            <div className="flex flex-wrap gap-1.5">
              {sortedCategories.map((category) => (
                <Badge
                  key={category.slug}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-medium flex items-center gap-1.5"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: category.color_hex || '#6B7280',
                    }}
                  />
                  {category.name}
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
    size: 180,
    enableSorting: false,
  },
  // 2. COST - Money drives decisions
  {
    accessorKey: 'est_const_cost',
    header: 'Est. Cost',
    cell: ({ row }) => {
      const amount = row.getValue('est_const_cost') as number | null
      return (
        <div className="text-right font-semibold whitespace-nowrap min-w-[100px]">
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  // 3. STATUS - Project stage
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string | null
      return (
        <div className="min-w-[120px]">
          <Badge
            variant={getStatusVariant(status)}
            className="whitespace-nowrap"
          >
            {status || 'Unknown'}
          </Badge>
        </div>
      )
    },
    enableSorting: false,
  },
  // 4. ISSUED DATE - Timing matters
  {
    accessorKey: 'issued_date',
    header: 'Issued Date',
    cell: ({ row }) => (
      <div className="whitespace-nowrap min-w-[110px]">
        {formatDate(row.getValue('issued_date'))}
      </div>
    ),
  },
  // 5. LAST UPDATED - Shows recent activity
  {
    accessorKey: 'updated_at',
    header: () => <div className="whitespace-nowrap">Last Updated</div>,
    cell: ({ row }) => (
      <div className="whitespace-nowrap min-w-[110px]">
        {formatDate(row.getValue('updated_at'))}
      </div>
    ),
  },
  // 6. DESCRIPTION - Project details (brief, hover for full)
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null

      if (!description) {
        return <div className="text-muted-foreground min-w-[150px]">–</div>
      }

      // Truncate to ~50 characters for brief display
      const brief =
        description.length > 50 ? `${description.slice(0, 50)}...` : description

      return (
        <div className="group/cell flex items-center gap-1 min-w-[150px] max-w-[250px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate cursor-help border-b border-dotted border-muted-foreground/30">
                {brief}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p className="text-xs whitespace-pre-wrap">{description}</p>
            </TooltipContent>
          </Tooltip>
          <CopyButton text={description} />
        </div>
      )
    },
    enableSorting: false,
  },
  // 7. BUILDER - Track competitors
  {
    accessorKey: 'builder_name',
    header: 'Builder',
    cell: ({ row }) => {
      const builder = row.getValue('builder_name') as string | null
      return (
        <div
          className="group/cell flex items-center gap-1 min-w-[150px] max-w-[200px]"
          title={builder || '–'}
        >
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            {builder || '–'}
          </span>
          {builder && <CopyButton text={builder} />}
        </div>
      )
    },
    enableSorting: false,
  },
]
