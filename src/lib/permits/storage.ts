import type { Json } from '@/types/supabase.public.types'
import { sb } from '@lib/supabase'
import { Client } from 'pg'
import type { PermitChange } from './change-detection'
import { detectPermitChanges } from './change-detection'
import type { NormalizedPermit } from './normalization'

export interface ChangeDetectionResult {
  changes: PermitChange[]
  newPermitsCount: number
  totalChecked: number
  changesByType?: Record<string, number>
  changesByImpact?: Record<string, number>
  detectionTime?: string
  deduplicatedPermits?: NormalizedPermit[]
}

/**
 * SQL-BASED CHANGE DETECTION
 * 10-20x faster than fetching all permits into Node.js
 *
 * Process:
 * 1. Create temp table
 * 2. Bulk insert new permits
 * 3. SQL JOIN to detect changes
 * 4. Insert directly to permit_changes
 * 5. Return summary stats
 */
export async function detectChangesInPermitsSQL(
  newPermits: NormalizedPermit[],
): Promise<ChangeDetectionResult> {
  console.log('🔍 Detecting changes (SQL-optimized)...')
  const startTime = Date.now()
  const perfMetrics: Record<string, number> = {}

  // DEDUPLICATE FIRST - before any SQL operations
  const dedupStart = Date.now()
  console.log(
    `📋 Deduplicating ${newPermits.length.toLocaleString()} permits...`,
  )
  const deduplicatedMap = new Map<string, NormalizedPermit>()

  // Keep FIRST occurrence (most recent from API based on testing)
  for (const permit of newPermits) {
    const compositeKey = `${permit.permit_num}||${permit.revision_num}`
    if (!deduplicatedMap.has(compositeKey)) {
      deduplicatedMap.set(compositeKey, permit)
    }
  }

  const deduplicatedPermits = Array.from(deduplicatedMap.values())
  const removedCount = newPermits.length - deduplicatedPermits.length
  perfMetrics.deduplication = Date.now() - dedupStart

  if (removedCount > 0) {
    console.log(
      `✅ Deduplicated: ${newPermits.length.toLocaleString()} → ${deduplicatedPermits.length.toLocaleString()} permits (removed ${removedCount} duplicates) in ${perfMetrics.deduplication}ms\n`,
    )
  }

  // Use deduplicated permits for all SQL operations
  const permitsToProcess = deduplicatedPermits

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 60000, // 60 seconds to establish connection
    query_timeout: 300000, // 5 minutes for queries
    statement_timeout: 300000, // 5 minutes for statements
  })

  try {
    const connectStart = Date.now()
    await client.connect()
    perfMetrics.connect = Date.now() - connectStart

    // Set statement timeout at session level
    await client.query("SET statement_timeout = '300000'") // 5 minutes
    await client.query('BEGIN')

    // Step 1: Create temporary table
    const tempTableStart = Date.now()
    console.log('📦 Creating temporary staging table...')
    await client.query(`
      CREATE TEMP TABLE temp_new_permits (
        permit_num TEXT NOT NULL,
        revision_num TEXT,
        status TEXT,
        issued_date DATE,
        completed_date DATE,
        est_const_cost NUMERIC,
        builder_name TEXT,
        description TEXT,
        dwelling_units_created INTEGER,
        dwelling_units_lost INTEGER,
        current_use TEXT,
        proposed_use TEXT,
        assembly NUMERIC,
        institutional NUMERIC,
        residential NUMERIC,
        industrial NUMERIC,
        business_and_personal_services NUMERIC,
        mercantile NUMERIC,
        interior_alterations NUMERIC,
        demolition NUMERIC,
        street_num TEXT,
        street_name TEXT,
        street_type TEXT,
        street_direction TEXT,
        postal TEXT,
        permit_type TEXT,
        structure_type TEXT,
        work TEXT
      ) ON COMMIT DROP
    `)
    perfMetrics.tempTableCreate = Date.now() - tempTableStart

    // Step 2: Bulk insert new permits (chunked for parameter limits)
    const insertStart = Date.now()
    console.log(
      `📥 Inserting ${permitsToProcess.length.toLocaleString()} permits to staging table...`,
    )
    // PostgreSQL has a limit of ~65535 parameters
    // With 28 fields per row, we can safely do ~2000 rows per batch (56,000 parameters)
    const chunkSize = 2000
    let inserted = 0

    for (let i = 0; i < permitsToProcess.length; i += chunkSize) {
      const chunk = permitsToProcess.slice(i, i + chunkSize)

      // Build parameterized query with proper parameter counting
      const valuesList: string[] = []
      const flatValues: any[] = []
      let paramIndex = 1

      for (const p of chunk) {
        const params = []
        for (let j = 0; j < 28; j++) {
          params.push(`$${paramIndex++}`)
        }
        valuesList.push(`(${params.join(', ')})`)

        flatValues.push(
          p.permit_num,
          p.revision_num || '00',
          p.status,
          p.issued_date,
          p.completed_date,
          p.est_const_cost,
          p.builder_name,
          p.description,
          p.dwelling_units_created,
          p.dwelling_units_lost,
          p.current_use,
          p.proposed_use,
          p.assembly,
          p.institutional,
          p.residential,
          p.industrial,
          p.business_and_personal_services,
          p.mercantile,
          p.interior_alterations,
          p.demolition,
          p.street_num,
          p.street_name,
          p.street_type,
          p.street_direction,
          p.postal,
          p.permit_type,
          p.structure_type,
          p.work,
        )
      }

      await client.query(
        `INSERT INTO temp_new_permits VALUES ${valuesList.join(', ')}`,
        flatValues,
      )

      inserted += chunk.length
      if (inserted % 50000 === 0) {
        console.log(`  📊 Inserted ${inserted.toLocaleString()} permits...`)
      }
    }

    perfMetrics.bulkInsert = Date.now() - insertStart
    console.log(
      `✅ Inserted ${inserted.toLocaleString()} permits to staging table in ${perfMetrics.bulkInsert}ms`,
    )

    // Step 3: Detect new permits
    const newPermitsStart = Date.now()
    console.log('🔍 Detecting new permits...')
    const newPermitsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM temp_new_permits tnp
      LEFT JOIN permits p ON tnp.permit_num = p.permit_num AND tnp.revision_num = p.revision_num
      WHERE p.id IS NULL
    `)
    const newPermitsCount = Number.parseInt(
      newPermitsResult.rows[0]?.count || '0',
      10,
    )
    perfMetrics.detectNewPermits = Date.now() - newPermitsStart
    console.log(
      `✅ Found ${newPermitsCount} new permits in ${perfMetrics.detectNewPermits}ms`,
    )

    // Step 3b: Insert new permits
    if (newPermitsCount > 0) {
      const insertNewStart = Date.now()
      console.log(`📥 Inserting ${newPermitsCount} new permits...`)

      const insertNewResult = await client.query(`
        INSERT INTO permits (
          permit_num, revision_num, permit_type, structure_type, work,
          street_num, street_name, street_type, street_direction, postal,
          issued_date, completed_date, status, est_const_cost, builder_name, 
          description, dwelling_units_created, dwelling_units_lost, 
          current_use, proposed_use, assembly, institutional, residential, 
          industrial, business_and_personal_services, mercantile, 
          interior_alterations, demolition
        )
        SELECT 
          tnp.permit_num, tnp.revision_num, tnp.permit_type, tnp.structure_type, tnp.work,
          tnp.street_num, tnp.street_name, tnp.street_type, tnp.street_direction, tnp.postal,
          tnp.issued_date, tnp.completed_date, tnp.status, tnp.est_const_cost, 
          tnp.builder_name, tnp.description, tnp.dwelling_units_created, tnp.dwelling_units_lost,
          tnp.current_use, tnp.proposed_use, tnp.assembly, tnp.institutional, tnp.residential,
          tnp.industrial, tnp.business_and_personal_services, tnp.mercantile, 
          tnp.interior_alterations, tnp.demolition
        FROM temp_new_permits tnp
        LEFT JOIN permits p ON tnp.permit_num = p.permit_num AND tnp.revision_num = p.revision_num
        WHERE p.id IS NULL
      `)

      perfMetrics.insertNewPermits = Date.now() - insertNewStart
      console.log(
        `✅ Inserted ${insertNewResult.rowCount} new permits in ${perfMetrics.insertNewPermits}ms`,
      )
    }

    // Step 4: Detect changes and insert to permit_changes
    const _changesStart = Date.now()
    console.log('🔍 Detecting changes in existing permits...')

    // DEBUG: Sample a few permits to see what's changing
    const debugResult = await client.query(`
      SELECT 
        p.permit_num,
        p.status as db_status,
        tnp.status as new_status,
        p.revision_num as db_revision,
        tnp.revision_num as new_revision,
        CASE WHEN p.status IS DISTINCT FROM tnp.status THEN 'status' END as status_change,
        CASE WHEN p.revision_num IS DISTINCT FROM tnp.revision_num THEN 'revision_num' END as revision_change
      FROM permits p
      INNER JOIN temp_new_permits tnp ON p.permit_num = tnp.permit_num AND p.revision_num = tnp.revision_num
      WHERE 
        p.status IS DISTINCT FROM tnp.status
        OR p.issued_date IS DISTINCT FROM tnp.issued_date
        OR p.completed_date IS DISTINCT FROM tnp.completed_date
        OR p.est_const_cost IS DISTINCT FROM tnp.est_const_cost
      LIMIT 5
    `)

    console.log('🐛 DEBUG: Sample changes detected:')
    for (const row of debugResult.rows) {
      console.log('  ', JSON.stringify(row))
    }

    // DEBUG: Check total count of changes
    const totalChangesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM permits p
      INNER JOIN temp_new_permits tnp ON p.permit_num = tnp.permit_num AND p.revision_num = tnp.revision_num
      WHERE 
        p.status IS DISTINCT FROM tnp.status
        OR p.issued_date IS DISTINCT FROM tnp.issued_date
        OR p.completed_date IS DISTINCT FROM tnp.completed_date
        OR p.est_const_cost IS DISTINCT FROM tnp.est_const_cost
        OR p.builder_name IS DISTINCT FROM tnp.builder_name
        OR p.description IS DISTINCT FROM tnp.description
        OR p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created
        OR p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost
        OR p.current_use IS DISTINCT FROM tnp.current_use
        OR p.proposed_use IS DISTINCT FROM tnp.proposed_use
    `)
    console.log(
      `🐛 DEBUG: Total changes to be detected: ${totalChangesResult.rows[0]?.count}`,
    )

    const changeInsertStart = Date.now()
    const changeInsertResult = await client.query(`
      WITH changed_permits AS (
        SELECT 
          p.id as permit_id,
          p.permit_num,
          CAST(p.external_id AS INTEGER) as external_id,
          NOW() as changed_at,
          
          -- Build array of changed fields
          ARRAY_REMOVE(ARRAY[
            CASE WHEN p.status IS DISTINCT FROM tnp.status THEN 'status' END,
            CASE WHEN p.issued_date IS DISTINCT FROM tnp.issued_date THEN 'issued_date' END,
            CASE WHEN p.completed_date IS DISTINCT FROM tnp.completed_date THEN 'completed_date' END,
            CASE WHEN p.est_const_cost IS DISTINCT FROM tnp.est_const_cost THEN 'est_const_cost' END,
            CASE WHEN p.builder_name IS DISTINCT FROM tnp.builder_name THEN 'builder_name' END,
            CASE WHEN p.description IS DISTINCT FROM tnp.description THEN 'description' END,
            CASE WHEN p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created THEN 'dwelling_units_created' END,
            CASE WHEN p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost THEN 'dwelling_units_lost' END,
            CASE WHEN p.current_use IS DISTINCT FROM tnp.current_use THEN 'current_use' END,
            CASE WHEN p.proposed_use IS DISTINCT FROM tnp.proposed_use THEN 'proposed_use' END,
            CASE WHEN p.assembly IS DISTINCT FROM tnp.assembly THEN 'assembly' END,
            CASE WHEN p.institutional IS DISTINCT FROM tnp.institutional THEN 'institutional' END,
            CASE WHEN p.residential IS DISTINCT FROM tnp.residential THEN 'residential' END,
            CASE WHEN p.industrial IS DISTINCT FROM tnp.industrial THEN 'industrial' END,
            CASE WHEN p.business_and_personal_services IS DISTINCT FROM tnp.business_and_personal_services THEN 'business_and_personal_services' END,
            CASE WHEN p.mercantile IS DISTINCT FROM tnp.mercantile THEN 'mercantile' END,
            CASE WHEN p.interior_alterations IS DISTINCT FROM tnp.interior_alterations THEN 'interior_alterations' END,
            CASE WHEN p.demolition IS DISTINCT FROM tnp.demolition THEN 'demolition' END,
            CASE WHEN p.street_num IS DISTINCT FROM tnp.street_num THEN 'street_num' END,
            CASE WHEN p.street_name IS DISTINCT FROM tnp.street_name THEN 'street_name' END,
            CASE WHEN p.street_type IS DISTINCT FROM tnp.street_type THEN 'street_type' END,
            CASE WHEN p.street_direction IS DISTINCT FROM tnp.street_direction THEN 'street_direction' END,
            CASE WHEN p.postal IS DISTINCT FROM tnp.postal THEN 'postal' END,
            CASE WHEN p.permit_type IS DISTINCT FROM tnp.permit_type THEN 'permit_type' END,
            CASE WHEN p.structure_type IS DISTINCT FROM tnp.structure_type THEN 'structure_type' END,
            CASE WHEN p.work IS DISTINCT FROM tnp.work THEN 'work' END,
            CASE WHEN p.revision_num IS DISTINCT FROM tnp.revision_num THEN 'revision_num' END
          ], NULL) as changed_fields,
          
          -- Old values as JSONB
          jsonb_strip_nulls(jsonb_build_object(
            'status', CASE WHEN p.status IS DISTINCT FROM tnp.status THEN p.status END,
            'issued_date', CASE WHEN p.issued_date IS DISTINCT FROM tnp.issued_date THEN p.issued_date END,
            'completed_date', CASE WHEN p.completed_date IS DISTINCT FROM tnp.completed_date THEN p.completed_date END,
            'est_const_cost', CASE WHEN p.est_const_cost IS DISTINCT FROM tnp.est_const_cost THEN p.est_const_cost END,
            'builder_name', CASE WHEN p.builder_name IS DISTINCT FROM tnp.builder_name THEN p.builder_name END,
            'description', CASE WHEN p.description IS DISTINCT FROM tnp.description THEN p.description END,
            'dwelling_units_created', CASE WHEN p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created THEN p.dwelling_units_created END,
            'dwelling_units_lost', CASE WHEN p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost THEN p.dwelling_units_lost END,
            'current_use', CASE WHEN p.current_use IS DISTINCT FROM tnp.current_use THEN p.current_use END,
            'proposed_use', CASE WHEN p.proposed_use IS DISTINCT FROM tnp.proposed_use THEN p.proposed_use END,
            'assembly', CASE WHEN p.assembly IS DISTINCT FROM tnp.assembly THEN p.assembly END,
            'institutional', CASE WHEN p.institutional IS DISTINCT FROM tnp.institutional THEN p.institutional END,
            'residential', CASE WHEN p.residential IS DISTINCT FROM tnp.residential THEN p.residential END,
            'industrial', CASE WHEN p.industrial IS DISTINCT FROM tnp.industrial THEN p.industrial END,
            'revision_num', CASE WHEN p.revision_num IS DISTINCT FROM tnp.revision_num THEN p.revision_num END
          )) as old_values,
          
          -- New values as JSONB
          jsonb_strip_nulls(jsonb_build_object(
            'status', CASE WHEN p.status IS DISTINCT FROM tnp.status THEN tnp.status END,
            'issued_date', CASE WHEN p.issued_date IS DISTINCT FROM tnp.issued_date THEN tnp.issued_date END,
            'completed_date', CASE WHEN p.completed_date IS DISTINCT FROM tnp.completed_date THEN tnp.completed_date END,
            'est_const_cost', CASE WHEN p.est_const_cost IS DISTINCT FROM tnp.est_const_cost THEN tnp.est_const_cost END,
            'builder_name', CASE WHEN p.builder_name IS DISTINCT FROM tnp.builder_name THEN tnp.builder_name END,
            'description', CASE WHEN p.description IS DISTINCT FROM tnp.description THEN tnp.description END,
            'dwelling_units_created', CASE WHEN p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created THEN tnp.dwelling_units_created END,
            'dwelling_units_lost', CASE WHEN p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost THEN tnp.dwelling_units_lost END,
            'current_use', CASE WHEN p.current_use IS DISTINCT FROM tnp.current_use THEN tnp.current_use END,
            'proposed_use', CASE WHEN p.proposed_use IS DISTINCT FROM tnp.proposed_use THEN tnp.proposed_use END,
            'assembly', CASE WHEN p.assembly IS DISTINCT FROM tnp.assembly THEN tnp.assembly END,
            'institutional', CASE WHEN p.institutional IS DISTINCT FROM tnp.institutional THEN tnp.institutional END,
            'residential', CASE WHEN p.residential IS DISTINCT FROM tnp.residential THEN tnp.residential END,
            'industrial', CASE WHEN p.industrial IS DISTINCT FROM tnp.industrial THEN tnp.industrial END,
            'revision_num', CASE WHEN p.revision_num IS DISTINCT FROM tnp.revision_num THEN tnp.revision_num END
          )) as new_values,
          
          -- Determine change_type
          CASE
            WHEN 'status' = ANY(ARRAY_REMOVE(ARRAY[
              CASE WHEN p.status IS DISTINCT FROM tnp.status THEN 'status' END,
              CASE WHEN p.issued_date IS DISTINCT FROM tnp.issued_date THEN 'issued_date' END,
              CASE WHEN p.completed_date IS DISTINCT FROM tnp.completed_date THEN 'completed_date' END,
              CASE WHEN p.est_const_cost IS DISTINCT FROM tnp.est_const_cost THEN 'est_const_cost' END,
              CASE WHEN p.description IS DISTINCT FROM tnp.description THEN 'description' END,
              CASE WHEN p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created THEN 'dwelling_units_created' END
            ], NULL)) THEN 'status'
            WHEN 'est_const_cost' = ANY(ARRAY_REMOVE(ARRAY[
              CASE WHEN p.est_const_cost IS DISTINCT FROM tnp.est_const_cost THEN 'est_const_cost' END,
              CASE WHEN p.assembly IS DISTINCT FROM tnp.assembly THEN 'assembly' END,
              CASE WHEN p.residential IS DISTINCT FROM tnp.residential THEN 'residential' END
            ], NULL)) THEN 'cost'
            WHEN 'issued_date' = ANY(ARRAY_REMOVE(ARRAY[
              CASE WHEN p.issued_date IS DISTINCT FROM tnp.issued_date THEN 'issued_date' END,
              CASE WHEN p.completed_date IS DISTINCT FROM tnp.completed_date THEN 'completed_date' END
            ], NULL)) THEN 'timeline'
            WHEN 'description' = ANY(ARRAY_REMOVE(ARRAY[
              CASE WHEN p.description IS DISTINCT FROM tnp.description THEN 'description' END,
              CASE WHEN p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created THEN 'dwelling_units_created' END,
              CASE WHEN p.proposed_use IS DISTINCT FROM tnp.proposed_use THEN 'proposed_use' END
            ], NULL)) THEN 'scope'
            ELSE 'administrative'
          END as change_type,
          
          -- Determine business_impact
          CASE
            WHEN p.status IS DISTINCT FROM tnp.status 
              AND tnp.status IN ('Permit Issued', 'Inspection', 'Ready for Issuance') THEN 'CRITICAL'
            WHEN p.est_const_cost IS DISTINCT FROM tnp.est_const_cost 
              AND p.est_const_cost > 0 
              AND ABS((COALESCE(tnp.est_const_cost, 0) - p.est_const_cost)::FLOAT / p.est_const_cost) > 0.2 THEN 'HIGH'
            WHEN p.builder_name IS DISTINCT FROM tnp.builder_name 
              AND p.builder_name IS NOT NULL 
              AND tnp.builder_name IS NOT NULL THEN 'HIGH'
            WHEN p.issued_date IS DISTINCT FROM tnp.issued_date 
              OR p.completed_date IS DISTINCT FROM tnp.completed_date THEN 'MEDIUM'
            WHEN p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created 
              OR p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost THEN 'MEDIUM'
            ELSE 'LOW'
          END as business_impact
          
        FROM permits p
        INNER JOIN temp_new_permits tnp ON p.permit_num = tnp.permit_num AND p.revision_num = tnp.revision_num
        WHERE 
          p.status IS DISTINCT FROM tnp.status
          OR p.issued_date IS DISTINCT FROM tnp.issued_date
          OR p.completed_date IS DISTINCT FROM tnp.completed_date
          OR p.est_const_cost IS DISTINCT FROM tnp.est_const_cost
          OR p.builder_name IS DISTINCT FROM tnp.builder_name
          OR p.description IS DISTINCT FROM tnp.description
          OR p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created
          OR p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost
          OR p.current_use IS DISTINCT FROM tnp.current_use
          OR p.proposed_use IS DISTINCT FROM tnp.proposed_use
          OR p.assembly IS DISTINCT FROM tnp.assembly
          OR p.institutional IS DISTINCT FROM tnp.institutional
          OR p.residential IS DISTINCT FROM tnp.residential
          OR p.industrial IS DISTINCT FROM tnp.industrial
          OR p.revision_num IS DISTINCT FROM tnp.revision_num
      )
      INSERT INTO permit_changes (
        permit_id,
        permit_num,
        external_id,
        changed_at,
        changed_fields,
        old_values,
        new_values,
        change_type,
        business_impact
      )
      SELECT 
        permit_id,
        permit_num,
        external_id,
        changed_at,
        changed_fields,
        old_values,
        new_values,
        change_type,
        business_impact
      FROM changed_permits
      WHERE array_length(changed_fields, 1) > 0
      RETURNING *
    `)

    const changesCount = changeInsertResult.rowCount || 0
    perfMetrics.changeInsert = Date.now() - changeInsertStart
    console.log(
      `✅ Detected and stored ${changesCount} changes in ${perfMetrics.changeInsert}ms`,
    )

    // Step 5: Update the actual permits with changed data
    if (changesCount > 0) {
      const updateStart = Date.now()
      console.log(`🔄 Updating ${changesCount} changed permits...`)

      const updateResult = await client.query(`
        UPDATE permits p
        SET 
          status = tnp.status,
          issued_date = tnp.issued_date,
          completed_date = tnp.completed_date,
          est_const_cost = tnp.est_const_cost,
          builder_name = tnp.builder_name,
          description = tnp.description,
          dwelling_units_created = tnp.dwelling_units_created,
          dwelling_units_lost = tnp.dwelling_units_lost,
          current_use = tnp.current_use,
          proposed_use = tnp.proposed_use,
          assembly = tnp.assembly,
          institutional = tnp.institutional,
          residential = tnp.residential,
          industrial = tnp.industrial,
          business_and_personal_services = tnp.business_and_personal_services,
          mercantile = tnp.mercantile,
          interior_alterations = tnp.interior_alterations,
          demolition = tnp.demolition,
          street_num = tnp.street_num,
          street_name = tnp.street_name,
          street_type = tnp.street_type,
          street_direction = tnp.street_direction,
          postal = tnp.postal,
          permit_type = tnp.permit_type,
          structure_type = tnp.structure_type,
          work = tnp.work,
          updated_at = NOW()
        FROM temp_new_permits tnp
        WHERE p.permit_num = tnp.permit_num 
          AND p.revision_num = tnp.revision_num
          AND (
            p.status IS DISTINCT FROM tnp.status
            OR p.issued_date IS DISTINCT FROM tnp.issued_date
            OR p.completed_date IS DISTINCT FROM tnp.completed_date
            OR p.est_const_cost IS DISTINCT FROM tnp.est_const_cost
            OR p.builder_name IS DISTINCT FROM tnp.builder_name
            OR p.description IS DISTINCT FROM tnp.description
            OR p.dwelling_units_created IS DISTINCT FROM tnp.dwelling_units_created
            OR p.dwelling_units_lost IS DISTINCT FROM tnp.dwelling_units_lost
            OR p.current_use IS DISTINCT FROM tnp.current_use
            OR p.proposed_use IS DISTINCT FROM tnp.proposed_use
            OR p.assembly IS DISTINCT FROM tnp.assembly
            OR p.institutional IS DISTINCT FROM tnp.institutional
            OR p.residential IS DISTINCT FROM tnp.residential
            OR p.industrial IS DISTINCT FROM tnp.industrial
            OR p.revision_num IS DISTINCT FROM tnp.revision_num
          )
      `)

      perfMetrics.updatePermits = Date.now() - updateStart
      console.log(
        `✅ Updated ${updateResult.rowCount} permits in ${perfMetrics.updatePermits}ms`,
      )
    }

    // Get change statistics from the changes we just inserted
    const statsStart = Date.now()
    const changesByType: Record<string, number> = {}
    const changesByImpact: Record<string, number> = {}

    for (const row of changeInsertResult.rows) {
      const type = row.change_type || 'unknown'
      const impact = row.business_impact || 'unknown'

      changesByType[type] = (changesByType[type] || 0) + 1
      changesByImpact[impact] = (changesByImpact[impact] || 0) + 1
    }
    perfMetrics.stats = Date.now() - statsStart

    const commitStart = Date.now()
    await client.query('COMMIT')
    perfMetrics.commit = Date.now() - commitStart

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(1)
    perfMetrics.total = endTime - startTime

    const criticalCount = changesByImpact.CRITICAL || 0
    const highCount = changesByImpact.HIGH || 0

    console.log(
      `✅ Found ${changesCount} changes (${criticalCount} critical, ${highCount} high) • ${newPermitsCount} new permits`,
    )
    console.log('\n⏱️  PERFORMANCE BREAKDOWN:')
    console.log(`   Deduplication: ${perfMetrics.deduplication}ms`)
    console.log(`   DB Connect: ${perfMetrics.connect}ms`)
    console.log(`   Temp Table: ${perfMetrics.tempTableCreate}ms`)
    console.log(`   Bulk Insert: ${perfMetrics.bulkInsert}ms`)
    console.log(`   Detect New: ${perfMetrics.detectNewPermits}ms`)
    console.log(`   Detect Changes: ${perfMetrics.changeInsert}ms`)
    console.log(`   Stats: ${perfMetrics.stats}ms`)
    console.log(`   Commit: ${perfMetrics.commit}ms`)
    console.log(`   TOTAL: ${perfMetrics.total}ms (${duration}s)\n`)

    return {
      changes: [], // We don't return the full array since it's already in DB
      newPermitsCount,
      totalChecked: permitsToProcess.length,
      changesByType,
      changesByImpact,
      detectionTime: duration,
      deduplicatedPermits: permitsToProcess,
    }
  } catch (error) {
    // Try to rollback if connection is still alive
    try {
      await client.query('ROLLBACK')
    } catch (_rollbackError) {
      // Connection is dead, ignore rollback error
      console.error('⚠️  Could not rollback (connection terminated)')
    }
    console.error('❌ SQL change detection failed:', error)
    throw error
  } finally {
    try {
      await client.end()
    } catch (_endError) {
      // Connection already terminated, ignore
      console.error('⚠️  Connection already closed')
    }
  }
}

export async function detectChangesInPermits(
  newPermits: NormalizedPermit[],
): Promise<ChangeDetectionResult> {
  console.log('🔍 Detecting changes...')

  const startTime = Date.now()
  const changes: PermitChange[] = []
  let newPermitsCount = 0

  console.log('📥 Fetching existing permits from database...')

  // Only fetch fields needed for change detection to avoid timeout
  const fieldsToFetch =
    'id,external_id,permit_num,revision_num,status,issued_date,completed_date,est_const_cost,builder_name,description,dwelling_units_created,dwelling_units_lost,current_use,proposed_use,assembly,institutional,residential,industrial,business_and_personal_services,mercantile,interior_alterations,demolition,street_num,street_name,street_type,street_direction,postal,permit_type,structure_type,work'

  let existingPermits: any[] = []
  let from = 0
  const pageSize = 10000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await sb
      .from('permits')
      .select(fieldsToFetch)
      .range(from, from + pageSize - 1)
      .order('id')

    if (error) {
      console.error('❌ Error fetching existing permits:', error)
      return { changes: [], newPermitsCount: 0, totalChecked: 0 }
    }

    if (data && data.length > 0) {
      existingPermits = existingPermits.concat(data)
      from += pageSize
      hasMore = data.length === pageSize

      // Progress logging
      if (from % 50000 === 0 || !hasMore) {
        console.log(
          `  📊 Fetched ${existingPermits.length.toLocaleString()} permits...`,
        )
      }
    } else {
      hasMore = false
    }
  }

  console.log(
    `✅ Fetched ${existingPermits?.length || 0} existing permits from database`,
  )

  type ExistingPermit = NormalizedPermit & {
    id: string
    external_id: string | number | null
  }
  const existingPermitsMap = new Map<string, ExistingPermit>()
  for (const permit of existingPermits || []) {
    existingPermitsMap.set(permit.permit_num, permit as ExistingPermit)
  }
  console.log(`📊 Built map with ${existingPermitsMap.size} permit numbers`)

  const batchSize = 10000
  let checkedCount = 0

  console.log(
    `🔍 Starting permit comparison for ${newPermits.length.toLocaleString()} permits...`,
  )

  for (let i = 0; i < newPermits.length; i += batchSize) {
    const batch = newPermits.slice(i, i + batchSize)

    for (const newPermit of batch) {
      const existing = existingPermitsMap.get(newPermit.permit_num)

      if (!existing) {
        newPermitsCount++
        // Sample logging for first 3 new permits
        if (newPermitsCount <= 3) {
          console.log(`  🆕 New permit: ${newPermit.permit_num}`)
        }
      } else {
        const change = detectPermitChanges(
          existing,
          newPermit,
          changes.length < 2,
        )
        if (change) {
          changes.push(change)
          // Sample logging for first 3 changes
          if (changes.length <= 3) {
            console.log(`  📝 Change detected: ${newPermit.permit_num}`, {
              fields: change.changed_fields,
              impact: change.business_impact,
            })
          }
        }
      }

      checkedCount++

      // Progress logging every 50k permits
      if (checkedCount % 50000 === 0) {
        console.log(
          `  📊 Progress: ${checkedCount.toLocaleString()}/${newPermits.length.toLocaleString()} checked • ${changes.length} changes • ${newPermitsCount} new`,
        )
      }
    }
  }

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(1)

  const changesByType = changes.reduce(
    (acc, c) => {
      acc[c.change_type] = (acc[c.change_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const changesByImpact = changes.reduce(
    (acc, c) => {
      acc[c.business_impact] = (acc[c.business_impact] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const criticalCount = changesByImpact.CRITICAL || 0
  const highCount = changesByImpact.HIGH || 0

  console.log(
    `✅ Found ${changes.length} changes (${criticalCount} critical, ${highCount} high) • ${newPermitsCount} new permits`,
  )

  return {
    changes,
    newPermitsCount,
    totalChecked: checkedCount,
    changesByType,
    changesByImpact,
    detectionTime: duration,
  }
}

export async function storePermitChanges(changes: PermitChange[]): Promise<{
  success: boolean
  stored: number
  error?: string
  errors?: number
}> {
  if (changes.length === 0) {
    return { success: true, stored: 0 }
  }

  const { error: tableCheckError } = await sb
    .from('permit_changes')
    .select('id')
    .limit(1)

  if (tableCheckError?.message?.includes('does not exist')) {
    console.log('⚠️  permit_changes table does not exist - skipping')
    return { success: false, stored: 0, error: 'Table does not exist' }
  }

  const batchSize = 1000
  let stored = 0
  let errors = 0

  for (let i = 0; i < changes.length; i += batchSize) {
    const batch = changes.slice(i, i + batchSize)

    // Map to match database schema
    const dbBatch = batch.map((change) => ({
      ...change,
      external_id:
        typeof change.external_id === 'string'
          ? Number.parseInt(change.external_id, 10)
          : change.external_id,
      new_values: change.new_values as Json,
      old_values: change.old_values as Json,
    }))

    const { error } = await sb.from('permit_changes').insert(dbBatch)

    if (error) {
      console.error('❌ Error storing changes:', error)
      errors += batch.length
    } else {
      stored += batch.length
    }
  }

  console.log(`💾 Stored ${stored} changes to database`)

  return { success: errors === 0, stored, errors }
}

export async function storePermitsInSupabase(
  permits: NormalizedPermit[],
): Promise<{ successCount: number; errorCount: number }> {
  const startTime = Date.now()
  console.log(`💾 Storing ${permits.length.toLocaleString()} permits...`)

  const { error: tableError } = await sb.from('permits').select('id').limit(1)

  if (tableError) {
    console.log('⚠️  Permits table might not exist:', tableError.message)
  }

  const batchSize = 1000
  const totalBatches = Math.ceil(permits.length / batchSize)
  let successCount = 0
  let errorCount = 0
  const upsertStart = Date.now()

  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * batchSize
    const batchEnd = Math.min(batchStart + batchSize, permits.length)
    const batch = permits.slice(batchStart, batchEnd)

    try {
      // Map to match database schema (raw_data must be Json compatible)
      const dbBatch = batch.map((permit) => ({
        ...permit,
        raw_data: permit.raw_data as unknown as Json,
      }))

      // Use upsert with composite key: permit_num + revision_num
      // This allows multiple revisions of the same permit to be stored
      const { error } = await sb.from('permits').upsert(dbBatch, {
        onConflict: 'permit_num,revision_num',
        ignoreDuplicates: false,
      })

      if (error) {
        console.error(`❌ Batch ${i + 1} error:`, error)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }

      // Progress logging every 50 batches
      if ((i + 1) % 50 === 0) {
        console.log(
          `  📊 Batch ${i + 1}/${totalBatches} • ${successCount.toLocaleString()} stored`,
        )
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} exception:`, error)
      errorCount += batch.length
    }
  }

  const upsertTime = Date.now() - upsertStart
  const totalTime = Date.now() - startTime

  console.log(`✅ Stored ${successCount.toLocaleString()} permits`)
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} errors`)
  }
  console.log(
    `⏱️  Storage Performance: ${upsertTime}ms upsert, ${totalTime}ms total`,
  )

  return { successCount, errorCount }
}
