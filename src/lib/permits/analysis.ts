import { DateTime } from 'luxon'
import type { TorontoPermitRaw } from './toronto-api'

export interface ChangeDetectionAnalysis {
  totalPermits: number
  activePermits: number
  completedPermits: number
  recentPermits: number
  activeStatuses: string[]
  completedStatuses: string[]
}

export function analyzeForChangeDetection(
  permits: TorontoPermitRaw[],
): ChangeDetectionAnalysis {
  const statusCounts = permits.reduce(
    (acc, permit) => {
      const status = permit.STATUS || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const activeStatuses = Object.keys(statusCounts).filter(
    (status) =>
      !status.toLowerCase().includes('completed') &&
      !status.toLowerCase().includes('closed') &&
      !status.toLowerCase().includes('final') &&
      !status.toLowerCase().includes('cancelled'),
  )

  const completedStatuses = Object.keys(statusCounts).filter(
    (status) =>
      status.toLowerCase().includes('completed') ||
      status.toLowerCase().includes('closed') ||
      status.toLowerCase().includes('final') ||
      status.toLowerCase().includes('cancelled'),
  )

  const activePermits = permits.filter(
    (p) => p.STATUS && activeStatuses.includes(p.STATUS),
  )
  const completedPermits = permits.filter(
    (p) => p.STATUS && completedStatuses.includes(p.STATUS),
  )

  const recentPermits = permits.filter((p) => {
    if (!p.APPLICATION_DATE) return false
    const permitDate = DateTime.fromISO(p.APPLICATION_DATE)
    const oneYearAgo = DateTime.now().minus({ years: 1 })
    return permitDate >= oneYearAgo
  })

  return {
    totalPermits: permits.length,
    activePermits: activePermits.length,
    completedPermits: completedPermits.length,
    recentPermits: recentPermits.length,
    activeStatuses,
    completedStatuses,
  }
}

export function analyzePermitData(permits: TorontoPermitRaw[]): void {

  const statusCounts = permits.reduce(
    (acc, permit) => {
      const status = permit.STATUS || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  console.log('\n📊 STATUS BREAKDOWN:')
  const sortedStatuses = Object.entries(statusCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 30)

  for (const [status, count] of sortedStatuses) {
    const percentage = (((count as number) / permits.length) * 100).toFixed(1)
    const isCompleted =
      status.toLowerCase().includes('completed') ||
      status.toLowerCase().includes('closed') ||
      status.toLowerCase().includes('final') ||
      status.toLowerCase().includes('issued')
    const indicator = isCompleted ? '✅' : '🔄'
    console.log(
      `  ${indicator} ${status}: ${(count as number).toLocaleString()} (${percentage}%)`,
    )
  }

  const permitTypes = permits.reduce(
    (acc, permit) => {
      const type = permit.PERMIT_TYPE || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  console.log('\n🏗️  PERMIT TYPE BREAKDOWN:')
  const sortedTypes = Object.entries(permitTypes)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 25)

  for (const [type, count] of sortedTypes) {
    const percentage = (((count as number) / permits.length) * 100).toFixed(1)
    console.log(
      `  ${type}: ${(count as number).toLocaleString()} (${percentage}%)`,
    )
  }

  const dates = permits
    .filter((p) => p.APPLICATION_DATE)
    .map((p) => p.APPLICATION_DATE)
    .filter((d): d is string => d !== undefined)
    .sort()

  console.log('\n📅 DATE RANGE ANALYSIS:')
  console.log(`  Earliest permit: ${dates[0] || 'N/A'}`)
  console.log(`  Latest permit: ${dates[dates.length - 1] || 'N/A'}`)

  const yearlyBreakdown = permits.reduce(
    (acc, permit) => {
      if (permit.APPLICATION_DATE) {
        const year = DateTime.fromISO(permit.APPLICATION_DATE).year
        acc[year] = (acc[year] || 0) + 1
      }
      return acc
    },
    {} as Record<number, number>,
  )

  console.log('\n📈 YEARLY APPLICATION BREAKDOWN & GROWTH:')
  const sortedYears = Object.entries(yearlyBreakdown).sort()
  for (let i = 0; i < sortedYears.length; i++) {
    const [year, count] = sortedYears[i]
    let growthText = ''

    if (i > 0) {
      const prevCount = sortedYears[i - 1][1] as number
      const growth = (((count as number) - prevCount) / prevCount) * 100
      const growthSign = growth >= 0 ? '+' : ''
      growthText = ` (${growthSign}${growth.toFixed(1)}% vs prev year)`
    }

    console.log(
      `  ${year}: ${(count as number).toLocaleString()} permits${growthText}`,
    )
  }

  const validCosts = permits
    .filter(
      (p) =>
        p.EST_CONST_COST &&
        p.EST_CONST_COST !== 'DO NOT UPDATE OR DELETE THIS INFO FIELD' &&
        !Number.isNaN(Number(p.EST_CONST_COST)) &&
        Number(p.EST_CONST_COST) > 0,
    )
    .map((p) => Number(p.EST_CONST_COST))
    .sort((a, b) => a - b)

  if (validCosts.length > 0) {
    const totalValue = validCosts.reduce((sum, cost) => sum + cost, 0)
    const avgValue = totalValue / validCosts.length
    const medianValue = validCosts[Math.floor(validCosts.length / 2)]

    console.log('\n💰 CONSTRUCTION VALUE ANALYSIS:')
    console.log(
      `  Total permits with valid costs: ${validCosts.length.toLocaleString()}`,
    )
    console.log(
      `  Total construction value: $${(totalValue / 1_000_000_000).toFixed(2)}B`,
    )
    console.log(`  Average project value: $${avgValue.toLocaleString()}`)
    console.log(`  Median project value: $${medianValue.toLocaleString()}`)
    console.log(
      `  Highest project value: $${validCosts[validCosts.length - 1].toLocaleString()}`,
    )
  }

  const structureTypes = permits.reduce(
    (acc, permit) => {
      const type = permit.STRUCTURE_TYPE || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  console.log('\n🏢 STRUCTURE TYPE BREAKDOWN:')
  const sortedStructures = Object.entries(structureTypes)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 20)

  for (const [type, count] of sortedStructures) {
    const percentage = (((count as number) / permits.length) * 100).toFixed(1)
    console.log(
      `  ${type}: ${(count as number).toLocaleString()} (${percentage}%)`,
    )
  }

}

