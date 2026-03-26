#!/usr/bin/env bun
import { Client } from 'pg'

async function main() {
  console.log('🔢 Updating permit cost distribution statistics...')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Calculate cost distribution buckets and statistics
    const result = await client.query(`
      WITH cost_buckets AS (
        SELECT
          COUNT(*) FILTER (WHERE est_const_cost >= 0 AND est_const_cost < 50000) as cost_0_50k,
          COUNT(*) FILTER (WHERE est_const_cost >= 50000 AND est_const_cost < 100000) as cost_50k_100k,
          COUNT(*) FILTER (WHERE est_const_cost >= 100000 AND est_const_cost < 200000) as cost_100k_200k,
          COUNT(*) FILTER (WHERE est_const_cost >= 200000 AND est_const_cost < 500000) as cost_200k_500k,
          COUNT(*) FILTER (WHERE est_const_cost >= 500000 AND est_const_cost < 1000000) as cost_500k_1m,
          COUNT(*) FILTER (WHERE est_const_cost >= 1000000 AND est_const_cost < 2000000) as cost_1m_2m,
          COUNT(*) FILTER (WHERE est_const_cost >= 2000000 AND est_const_cost < 5000000) as cost_2m_5m,
          COUNT(*) FILTER (WHERE est_const_cost >= 5000000) as cost_5m_plus,
          COUNT(*) FILTER (WHERE est_const_cost IS NOT NULL AND est_const_cost > 0) as total_with_cost,
          COUNT(*) as total_permits,
          MIN(est_const_cost) FILTER (WHERE est_const_cost > 0) as min_cost,
          MAX(est_const_cost) as max_cost,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY est_const_cost) FILTER (WHERE est_const_cost > 0) as median_cost
        FROM permits
        WHERE issued_date >= CURRENT_DATE - INTERVAL '90 days'
      )
      INSERT INTO permit_cost_stats (
        snapshot_date,
        cost_0_50k,
        cost_50k_100k,
        cost_100k_200k,
        cost_200k_500k,
        cost_500k_1m,
        cost_1m_2m,
        cost_2m_5m,
        cost_5m_plus,
        total_permits_with_cost,
        total_permits,
        min_cost,
        max_cost,
        median_cost,
        updated_at
      )
      SELECT
        CURRENT_DATE,
        cost_0_50k,
        cost_50k_100k,
        cost_100k_200k,
        cost_200k_500k,
        cost_500k_1m,
        cost_1m_2m,
        cost_2m_5m,
        cost_5m_plus,
        total_with_cost,
        total_permits,
        min_cost,
        max_cost,
        median_cost,
        NOW()
      FROM cost_buckets
      ON CONFLICT (snapshot_date) 
      DO UPDATE SET
        cost_0_50k = EXCLUDED.cost_0_50k,
        cost_50k_100k = EXCLUDED.cost_50k_100k,
        cost_100k_200k = EXCLUDED.cost_100k_200k,
        cost_200k_500k = EXCLUDED.cost_200k_500k,
        cost_500k_1m = EXCLUDED.cost_500k_1m,
        cost_1m_2m = EXCLUDED.cost_1m_2m,
        cost_2m_5m = EXCLUDED.cost_2m_5m,
        cost_5m_plus = EXCLUDED.cost_5m_plus,
        total_permits_with_cost = EXCLUDED.total_permits_with_cost,
        total_permits = EXCLUDED.total_permits,
        min_cost = EXCLUDED.min_cost,
        max_cost = EXCLUDED.max_cost,
        median_cost = EXCLUDED.median_cost,
        updated_at = NOW()
      RETURNING *;
    `)

    const stats = result.rows[0]
    console.log('\n📊 Cost Distribution Statistics:')
    console.log(`   $0 - $50K: ${stats.cost_0_50k}`)
    console.log(`   $50K - $100K: ${stats.cost_50k_100k}`)
    console.log(`   $100K - $200K: ${stats.cost_100k_200k}`)
    console.log(`   $200K - $500K: ${stats.cost_200k_500k}`)
    console.log(`   $500K - $1M: ${stats.cost_500k_1m}`)
    console.log(`   $1M - $2M: ${stats.cost_1m_2m}`)
    console.log(`   $2M - $5M: ${stats.cost_2m_5m}`)
    console.log(`   $5M+: ${stats.cost_5m_plus}`)
    console.log(
      `\n   Total permits with cost: ${stats.total_permits_with_cost}`,
    )
    console.log(`   Total permits: ${stats.total_permits}`)
    console.log(
      `   Cost range: $${Number(stats.min_cost).toLocaleString()} - $${Number(stats.max_cost).toLocaleString()}`,
    )
    console.log(
      `   Median cost: $${Number(stats.median_cost).toLocaleString()}`,
    )

    console.log('\n✅ Cost statistics updated successfully!')
  } catch (error) {
    console.error('❌ Error updating cost statistics:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
