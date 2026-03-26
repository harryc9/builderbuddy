'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePermitsSearch } from '@/hooks/usePermitsSearch'
import { useUser } from '@/hooks/useUser'
import type { PermitSearchParams } from '@/types/permits'
import {
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { authenticatedFetch } from '@/lib/api-client'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from 'lucide-react'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs'
import { useState } from 'react'
import { columns } from './PermitsTableColumns'

const CURRENT_YEAR = new Date().getFullYear()
const DEFAULT_START_YEAR = CURRENT_YEAR - 3 // 2022
const DEFAULT_END_YEAR = CURRENT_YEAR // 2025

const viewOptions = ['all', 'saved', 'ignored'] as const

export function PermitsTable() {
  // Read filter params from URL
  const [statuses] = useQueryState(
    'status',
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const [parentCategorySlugs] = useQueryState(
    'parent_category_slugs',
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const [costMin] = useQueryState('cost_min', parseAsInteger)
  const [costMax] = useQueryState('cost_max', parseAsInteger)
  const [yearRange] = useQueryState('years', parseAsArrayOf(parseAsInteger))
  const [postal] = useQueryState('postal', parseAsString)
  const [builderSearch] = useQueryState('builder', parseAsString)
  const [query] = useQueryState('q', parseAsString)
  const [hasBuilder] = useQueryState('has_builder', parseAsBoolean)
  const [hasCost] = useQueryState('has_cost', parseAsBoolean)
  const [view] = useQueryState(
    'view',
    parseAsStringLiteral(viewOptions).withDefault('all'),
  )

  // Pagination state
  const [page, setPage] = useState(1)

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'issued_date', desc: true },
  ])

  // Fetch user profile for address/distance calculations
  const { data: user } = useUser()

  // Build search params from URL filters
  const params: PermitSearchParams = {
    page,
    per_page: 50,
    sort_by: sorting[0]?.id || 'issued_date',
    sort_order: sorting[0]?.desc ? 'desc' : 'asc',
    status: statuses.length > 0 ? statuses : undefined,
    parent_category_slugs:
      parentCategorySlugs.length > 0 ? parentCategorySlugs : undefined,
    cost_min: costMin ?? undefined,
    cost_max: costMax ?? undefined,
    // Convert year range to date range
    issued_from: yearRange?.[0]
      ? `${yearRange[0]}-01-01`
      : `${DEFAULT_START_YEAR}-01-01`,
    issued_to: yearRange?.[1]
      ? `${yearRange[1]}-12-31`
      : `${DEFAULT_END_YEAR}-12-31`,
    postal: postal ? [postal] : undefined,
    builder_name: builderSearch ? [builderSearch] : undefined,
    query: query ?? undefined,
    has_builder: hasBuilder ?? undefined,
    has_cost: hasCost ?? undefined,
    view: view, // Add view parameter
  }

  const { data, isLoading, error, refetch, isFetching } = usePermitsSearch(
    params,
    user?.address_lat,
    user?.address_lng,
  )

  const table = useReactTable({
    data: data?.permits || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    pageCount: data?.pagination.total_pages || 0,
    meta: {
      userLat: user?.address_lat,
      userLng: user?.address_lng,
    },
  })

  const [isExporting, setIsExporting] = useState(false)

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setPage((prev) => prev + 1)
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const qs = new URLSearchParams()
      const exportParams: Record<string, unknown> = { ...params }
      delete exportParams.page
      delete exportParams.per_page

      for (const [key, value] of Object.entries(exportParams)) {
        if (value == null) continue
        if (Array.isArray(value)) {
          for (const v of value) qs.append(key, String(v))
        } else {
          qs.append(key, String(value))
        }
      }

      const res = await authenticatedFetch(`/api/permits/export?${qs}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `permits-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
    } finally {
      setIsExporting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-4 lg:px-8 py-6">
        <div className="text-sm text-muted-foreground mb-6 text-center">
          Loading permits
          <span className="animate-ellipsis" />
        </div>
        <div className="space-y-3 flex-1 flex flex-col">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md flex-1" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading permits</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // No data
  if (!data || data.permits.length === 0) {
    return (
      <div className="p-4">
        <Alert className="w-fit">
          <AlertTitle>No permits found</AlertTitle>
          <AlertDescription>
            Try adjusting your filters or search criteria.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full px-4 lg:px-8 pb-4 lg:pb-6">
        {/* Pagination header - with horizontal padding to avoid overlapping with fixed buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2 sm:gap-4 py-4 lg:py-6 px-16 sm:px-20 lg:px-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!data.pagination.has_prev || isFetching}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {/* Mobile: Show just page numbers */}
            <span className="sm:hidden">
              {data.pagination.page}/{data.pagination.total_pages}
            </span>
            {/* Desktop: Show full details */}
            <span className="hidden sm:inline">
              Page {data.pagination.page}
              {data.pagination.total_pages > 0 &&
                ` of ${data.pagination.total_pages} (${data.pagination.total_count >= 1000 ? `~${(data.pagination.total_count / 1000).toFixed(1)}k` : data.pagination.total_count} results)`}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!data.pagination.has_next || isFetching}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            title="Export to CSV"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
          </Button>
        </div>

        {/* Table - Scrollable container with calculated height */}
        <div className="flex-1 rounded-md border overflow-auto bg-white min-h-0">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const isSorted = header.column.getIsSorted()

                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className="flex items-center gap-2 cursor-pointer select-none"
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                header.column.getToggleSortingHandler()?.(e)
                              }
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <span className="text-muted-foreground">
                              {isSorted === 'asc' ? (
                                <ArrowUp size={14} />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown size={14} />
                              ) : (
                                <ArrowUpDown size={14} />
                              )}
                            </span>
                          </button>
                        ) : (
                          <div>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
