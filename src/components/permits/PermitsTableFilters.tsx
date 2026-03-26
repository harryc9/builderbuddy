'use client'

import { CostRangeSlider } from '@/components/CostRangeSlider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { usePermitActionCount } from '@/hooks/usePermitActions'
import { ChevronDown, X } from 'lucide-react'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs'
import { useEffect, useState } from 'react'
import { PermitViewToggle } from './PermitViewToggle'

// Date range: 2009-2025 based on data
const MIN_YEAR = 2009
const MAX_YEAR = 2025
const CURRENT_YEAR = new Date().getFullYear()
const DEFAULT_START_YEAR = Math.max(CURRENT_YEAR - 3, MIN_YEAR) // Current year - 3 (2022)
const DEFAULT_END_YEAR = CURRENT_YEAR // 2025

// Grouped statuses for simpler UI
const STATUS_GROUPS = [
  {
    label: 'Permit Issued',
    statuses: ['Permit Issued'],
  },
  {
    label: 'Inspection',
    statuses: ['Inspection'],
  },
  {
    label: 'Pre-Construction',
    statuses: [
      'Under Review',
      'Response Received',
      'Revision Issued',
      "Examiner's Notice Sent",
      'Application Received',
    ],
  },
]

// Parent categories for filtering (12 categories)
const PARENT_CATEGORIES = [
  { slug: 'electrical', name: 'Electrical', color: '#F59E0B' },
  { slug: 'plumbing', name: 'Plumbing', color: '#3B82F6' },
  { slug: 'hvac-mechanical', name: 'HVAC & Mechanical', color: '#10B981' },
  { slug: 'interior-finishing', name: 'Interior Finishing', color: '#8B5CF6' },
  { slug: 'carpentry-framing', name: 'Carpentry & Framing', color: '#D97706' },
  { slug: 'masonry-concrete', name: 'Masonry & Concrete', color: '#6B7280' },
  { slug: 'roofing-exteriors', name: 'Roofing & Exteriors', color: '#DC2626' },
  {
    slug: 'insulation-envelope',
    name: 'Insulation & Envelope',
    color: '#06B6D4',
  },
  { slug: 'site-work', name: 'Site Work & Excavation', color: '#84CC16' },
  { slug: 'demolition-labour', name: 'Demolition & Labour', color: '#EF4444' },
  { slug: 'specialty-trades', name: 'Specialty Trades', color: '#F97316' },
  {
    slug: 'management-professional',
    name: 'Management & Professional',
    color: '#1F2937',
  },
]

export function PermitsTableFilters() {
  // URL-based state management
  const [statuses, setStatuses] = useQueryState(
    'status',
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const [parentCategorySlugs, setParentCategorySlugs] = useQueryState(
    'parent_category_slugs',
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const [costMin, setCostMin] = useQueryState('cost_min', parseAsInteger)
  const [costMax, setCostMax] = useQueryState('cost_max', parseAsInteger)
  const [yearRange, setYearRange] = useQueryState(
    'years',
    parseAsArrayOf(parseAsInteger),
  )
  const [query, setQuery] = useQueryState('q', parseAsString)
  const [hasBuilder, setHasBuilder] = useQueryState(
    'has_builder',
    parseAsBoolean,
  )
  const [hasCost, setHasCost] = useQueryState('has_cost', parseAsBoolean)
  const [jobRoleSlugs, setJobRoleSlugs] = useQueryState(
    'job_role_slugs',
    parseAsArrayOf(parseAsString).withDefault([]),
  )

  // Fetch counts for view toggle badges
  const { data: savedCountData } = usePermitActionCount('saved')
  const { data: ignoredCountData } = usePermitActionCount('ignored')

  // Date range slider state - default to 2022-2025 (current year - 3)
  const [dateSliderValues, setDateSliderValues] = useState([
    yearRange?.[0] ?? DEFAULT_START_YEAR,
    yearRange?.[1] ?? DEFAULT_END_YEAR,
  ])

  // Initialize default year range on mount if not set
  useEffect(() => {
    if (!yearRange || yearRange.length === 0) {
      setYearRange([DEFAULT_START_YEAR, DEFAULT_END_YEAR])
    }
  }, [yearRange, setYearRange]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear all filters
  const clearFilters = () => {
    setStatuses([])
    setParentCategorySlugs([])
    setCostMin(null)
    setCostMax(null)
    setYearRange([DEFAULT_START_YEAR, DEFAULT_END_YEAR])
    setQuery(null)
    setHasBuilder(null)
    setHasCost(null)
    setJobRoleSlugs([])
    setDateSliderValues([DEFAULT_START_YEAR, DEFAULT_END_YEAR])
  }

  // Count active filters
  const activeFilterCount = [
    statuses.length > 0,
    parentCategorySlugs.length > 0,
    costMin != null || costMax != null,
    yearRange != null &&
      (yearRange[0] !== DEFAULT_START_YEAR ||
        yearRange[1] !== DEFAULT_END_YEAR),
    query != null,
    hasBuilder != null,
    hasCost != null,
    jobRoleSlugs.length > 0,
  ].filter(Boolean).length

  // Get active status count
  const activeStatusCount = STATUS_GROUPS.reduce((count, group) => {
    const hasAny = group.statuses.some((s) => statuses.includes(s))
    return hasAny ? count + 1 : count
  }, 0)

  return (
    <div className="space-y-4">
      {/* View Toggle - All/Saved/Ignored */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">View</Label>
        <PermitViewToggle
          savedCount={savedCountData?.count}
          ignoredCount={ignoredCountData?.count}
        />
      </div>

      <Separator />

      {/* Header */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full justify-start bg-gray-100 h-8"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}

      {/* DATE RANGE SLIDER - Keep expanded */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Permit Date</Label>
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
          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {dateSliderValues[0]}
            </span>
            <span className="font-medium text-foreground">
              {dateSliderValues[1]}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* COST RANGE SLIDER */}
      <CostRangeSlider
        value={[costMin ?? 1000, costMax ?? 5000000]}
        onChange={([min, max]) => {
          // Set to null if at the extremes (meaning "no filter")
          setCostMin(min <= 1000 ? null : min)
          setCostMax(max >= 5000000 ? null : max)
        }}
      />

      <Separator />

      {/* STATUS FILTER - Popover */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Status</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between h-9 text-xs"
            >
              <div className="flex items-center gap-2">
                <span>
                  {activeStatusCount > 0
                    ? `${activeStatusCount} selected`
                    : 'All Statuses'}
                </span>
                {activeStatusCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {activeStatusCount}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-3"
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <div className="space-y-3">
              {STATUS_GROUPS.map((group) => {
                const hasAnyChecked = group.statuses.some((s) =>
                  statuses.includes(s),
                )
                const allChecked = group.statuses.every((s) =>
                  statuses.includes(s),
                )
                const isIndeterminate = hasAnyChecked && !allChecked

                return (
                  <div
                    key={group.label}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`status-${group.label}`}
                      checked={allChecked}
                      // @ts-expect-error - indeterminate is supported
                      indeterminate={isIndeterminate}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newStatuses = [
                            ...new Set([...statuses, ...group.statuses]),
                          ]
                          setStatuses(newStatuses)
                        } else {
                          setStatuses(
                            statuses.filter((s) => !group.statuses.includes(s)),
                          )
                        }
                      }}
                    />
                    <label
                      htmlFor={`status-${group.label}`}
                      className="text-xs leading-none cursor-pointer"
                    >
                      {group.label}
                    </label>
                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      {/* CATEGORIES (PARENT CATEGORIES) FILTER - Popover */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Categories</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between h-9 text-xs"
            >
              <div className="flex items-center gap-2">
                <span>
                  {parentCategorySlugs.length > 0
                    ? `${parentCategorySlugs.length} selected`
                    : 'All Categories'}
                </span>
                {parentCategorySlugs.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {parentCategorySlugs.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-3 max-h-[300px] overflow-y-auto"
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <div className="space-y-2.5">
              {PARENT_CATEGORIES.map((category) => (
                <div
                  key={category.slug}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`category-${category.slug}`}
                    checked={parentCategorySlugs.includes(category.slug)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setParentCategorySlugs([
                          ...parentCategorySlugs,
                          category.slug,
                        ])
                      } else {
                        setParentCategorySlugs(
                          parentCategorySlugs.filter(
                            (s) => s !== category.slug,
                          ),
                        )
                      }
                    }}
                  />
                  <label
                    htmlFor={`category-${category.slug}`}
                    className="text-xs leading-none cursor-pointer flex items-center gap-2"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      {/* HAS BUILDER - Compact inline */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-builder"
          checked={hasBuilder === true}
          onCheckedChange={(checked) => {
            setHasBuilder(checked ? true : null)
          }}
        />
        <label
          htmlFor="has-builder"
          className="text-xs leading-none cursor-pointer font-medium"
        >
          Has Builder
        </label>
      </div>

      {/* HAS COST - Compact inline */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-cost"
          checked={hasCost === true}
          onCheckedChange={(checked) => {
            setHasCost(checked ? true : null)
          }}
        />
        <label
          htmlFor="has-cost"
          className="text-xs leading-none cursor-pointer font-medium"
        >
          Has Cost
        </label>
      </div>

      <Separator />

      {/* KEYWORD SEARCH */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Keyword</Label>
        <Input
          type="text"
          placeholder="Search..."
          value={query ?? ''}
          onChange={(e) => setQuery(e.target.value || null)}
          className="text-sm h-9"
        />
      </div>
    </div>
  )
}
