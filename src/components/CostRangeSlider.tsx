'use client'

import { Slider } from '@/components/ui/slider'
import { useEffect, useState } from 'react'

type CostBucket = {
  min: number
  max: number | null
  count: number
  label: string
}

type CostDistribution = {
  buckets: CostBucket[]
  totalPermits: number
  minCost: number
  maxCost: number
  medianCost: number
}

type CostRangeSliderProps = {
  value: [number, number]
  onChange: (value: [number, number]) => void
  className?: string
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000
    return `$${millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`
  }
  return `$${Math.round(value)}`
}

export function CostRangeSlider({
  value,
  onChange,
  className,
}: CostRangeSliderProps) {
  const [distribution, setDistribution] = useState<CostDistribution | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)

  // Fetch cost distribution on mount and cache for 24 hours
  useEffect(() => {
    const CACHE_KEY = 'cost_distribution_cache'
    const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

    async function fetchDistribution() {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            setDistribution(data)
            setIsLoading(false)
            return
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch fresh data
      try {
        const response = await fetch('/api/permits/cost-distribution')
        if (response.ok) {
          const data = await response.json()
          setDistribution(data)
          // Cache the result
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data, timestamp: Date.now() }),
          )
        }
      } catch (error) {
        console.error('Failed to fetch cost distribution:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDistribution()
  }, [])

  // Calculate wave path from distribution data
  const getWavePath = (): string => {
    if (!distribution || distribution.buckets.length === 0) {
      return ''
    }

    const maxCount = Math.max(...distribution.buckets.map((b) => b.count))
    if (maxCount === 0) return ''

    const width = 100 // percentage
    const height = 20 // pixels
    const points = distribution.buckets.map((bucket, i) => {
      const x = (i / (distribution.buckets.length - 1)) * width
      const normalizedHeight = (bucket.count / maxCount) * height
      const y = height - normalizedHeight
      return `${x},${y}`
    })

    return `M 0,${height} L ${points.join(' L ')} L 100,${height} Z`
  }

  // Map slider value (0-100) to actual cost using logarithmic scale
  // This gives more granularity to lower costs where most permits are
  const sliderToCost = (sliderValue: number): number => {
    const MIN_LOG = Math.log10(1000) // Start at $1k
    const MAX_LOG = Math.log10(5000000) // End at $5M
    const logValue = MIN_LOG + (sliderValue / 100) * (MAX_LOG - MIN_LOG)
    return 10 ** logValue
  }

  // Map cost to slider value (0-100) using logarithmic scale
  const costToSlider = (cost: number): number => {
    const MIN_LOG = Math.log10(1000)
    const MAX_LOG = Math.log10(5000000)
    const clampedCost = Math.max(1000, Math.min(cost, 5000000))
    const logCost = Math.log10(clampedCost)
    return ((logCost - MIN_LOG) / (MAX_LOG - MIN_LOG)) * 100
  }

  const handleSliderChange = (newValue: number[]) => {
    const [min, max] = newValue
    onChange([sliderToCost(min), sliderToCost(max)])
  }

  const sliderValue = [costToSlider(value[0]), costToSlider(value[1])]

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="text-sm font-bold">Project Cost Range</div>

        {/* Wave visualization */}
        <div className="relative h-6 w-full">
          {!isLoading && distribution && (
            <svg
              className="absolute top-0 left-0 w-full h-full"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              role="img"
              aria-label="Cost distribution visualization"
            >
              <title>Cost distribution across permits</title>
              <path
                d={getWavePath()}
                fill="hsl(var(--primary))"
                opacity="0.15"
                className="transition-all duration-300"
              />
            </svg>
          )}
        </div>

        {/* Range slider */}
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          className="w-full"
          minStepsBetweenThumbs={1}
        />

        {/* Value labels */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Min</span>
            <span className="font-medium">{formatCurrency(value[0])}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Max</span>
            <span className="font-medium">
              {value[1] >= 5000000 ? '$5M+' : formatCurrency(value[1])}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
