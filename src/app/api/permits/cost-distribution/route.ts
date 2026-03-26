import { sbc } from '@/lib/supabase.client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type CostDistribution = {
  buckets: {
    min: number
    max: number | null
    count: number
    label: string
  }[]
  totalPermits: number
  minCost: number
  maxCost: number
  medianCost: number
}

/**
 * GET /api/permits/cost-distribution
 * Returns the latest cost distribution statistics for the wave visualization
 */
export async function GET() {
  try {
    // Get the most recent cost stats snapshot
    const { data: stats, error } = await sbc
      .from('permit_cost_stats')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !stats) {
      // If no stats available, return empty distribution
      return NextResponse.json({
        buckets: [],
        totalPermits: 0,
        minCost: 0,
        maxCost: 0,
        medianCost: 0,
      } as CostDistribution)
    }

    // Transform database buckets into API response format
    const distribution: CostDistribution = {
      buckets: [
        {
          min: 0,
          max: 50000,
          count: stats.cost_0_50k || 0,
          label: '$0 - $50K',
        },
        {
          min: 50000,
          max: 100000,
          count: stats.cost_50k_100k || 0,
          label: '$50K - $100K',
        },
        {
          min: 100000,
          max: 200000,
          count: stats.cost_100k_200k || 0,
          label: '$100K - $200K',
        },
        {
          min: 200000,
          max: 500000,
          count: stats.cost_200k_500k || 0,
          label: '$200K - $500K',
        },
        {
          min: 500000,
          max: 1000000,
          count: stats.cost_500k_1m || 0,
          label: '$500K - $1M',
        },
        {
          min: 1000000,
          max: 2000000,
          count: stats.cost_1m_2m || 0,
          label: '$1M - $2M',
        },
        {
          min: 2000000,
          max: 5000000,
          count: stats.cost_2m_5m || 0,
          label: '$2M - $5M',
        },
        {
          min: 5000000,
          max: null,
          count: stats.cost_5m_plus || 0,
          label: '$5M+',
        },
      ],
      totalPermits: stats.total_permits || 0,
      minCost: Number(stats.min_cost) || 0,
      maxCost: Number(stats.max_cost) || 0,
      medianCost: Number(stats.median_cost) || 0,
    }

    return NextResponse.json(distribution)
  } catch (error) {
    console.error('Error fetching cost distribution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost distribution' },
      { status: 500 },
    )
  }
}
