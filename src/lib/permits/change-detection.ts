import type { NormalizedPermit } from './normalization'

export interface PermitChange {
  permit_id: string
  permit_num: string
  external_id: string | number | null
  changed_at: string
  changed_fields: string[]
  old_values: Record<string, unknown>
  new_values: Record<string, unknown>
  change_type: string
  business_impact: string
  days_since_last_change: null
  change_count_for_permit: null
}

const TRACKED_FIELDS = [
  'status',
  'issued_date',
  'completed_date',
  'est_const_cost',
  'builder_name',
  'description',
  'dwelling_units_created',
  'dwelling_units_lost',
  'current_use',
  'proposed_use',
  'assembly',
  'institutional',
  'residential',
  'industrial',
  'business_and_personal_services',
  'mercantile',
  'interior_alterations',
  'demolition',
  'street_num',
  'street_name',
  'street_type',
  'street_direction',
  'postal',
  'permit_type',
  'structure_type',
  'work',
  'revision_num',
] as const

function classifyChangeType(fields: string[]): string {
  if (fields.includes('status')) return 'status'
  if (
    fields.includes('est_const_cost') ||
    fields.some((f) =>
      ['assembly', 'institutional', 'residential', 'industrial'].includes(f),
    )
  )
    return 'cost'
  if (fields.includes('issued_date') || fields.includes('completed_date'))
    return 'timeline'
  if (
    fields.includes('description') ||
    fields.includes('dwelling_units_created') ||
    fields.includes('dwelling_units_lost') ||
    fields.includes('proposed_use')
  )
    return 'scope'
  return 'administrative'
}

function calculateBusinessImpact(
  changed_fields: string[],
  old_values: Record<string, unknown>,
  new_values: Record<string, unknown>,
): string {
  if (changed_fields.includes('status')) {
    const criticalStatuses = [
      'Permit Issued',
      'Inspection',
      'Ready for Issuance',
    ]
    const newStatus = String(new_values.status || '')
    if (criticalStatuses.includes(newStatus)) return 'CRITICAL'
  }

  if (changed_fields.includes('est_const_cost')) {
    const oldCost = Number(old_values.est_const_cost) || 0
    const newCost = Number(new_values.est_const_cost) || 0
    if (oldCost > 0) {
      const costChange = Math.abs((newCost - oldCost) / oldCost)
      if (costChange > 0.2) return 'HIGH'
    }
  }

  if (
    changed_fields.includes('builder_name') &&
    old_values.builder_name &&
    new_values.builder_name &&
    old_values.builder_name !== new_values.builder_name
  ) {
    return 'HIGH'
  }

  if (
    changed_fields.includes('issued_date') ||
    changed_fields.includes('completed_date')
  ) {
    return 'MEDIUM'
  }

  if (
    changed_fields.includes('dwelling_units_created') ||
    changed_fields.includes('dwelling_units_lost')
  ) {
    return 'MEDIUM'
  }

  return 'LOW'
}

export function detectPermitChanges(
  existingPermit: NormalizedPermit & {
    id: string
    external_id: string | number | null
  },
  newPermit: NormalizedPermit,
  debug = false,
): PermitChange | null {
  const changed_fields: string[] = []
  const old_values: Record<string, unknown> = {}
  const new_values: Record<string, unknown> = {}

  for (const field of TRACKED_FIELDS) {
    const oldVal = existingPermit[field as keyof NormalizedPermit]
    const newVal = newPermit[field as keyof NormalizedPermit]

    const oldStr = oldVal === null || oldVal === undefined ? '' : String(oldVal)
    const newStr = newVal === null || newVal === undefined ? '' : String(newVal)

    if (oldStr !== newStr) {
      changed_fields.push(field)
      old_values[field] = oldVal
      new_values[field] = newVal

      if (debug) {
        console.log(`    🔄 Field changed: ${field}`)
        console.log(`       OLD: ${oldStr}`)
        console.log(`       NEW: ${newStr}`)
      }
    }
  }

  if (changed_fields.length === 0) return null

  const change_type = classifyChangeType(changed_fields)
  const business_impact = calculateBusinessImpact(
    changed_fields,
    old_values,
    new_values,
  )

  return {
    permit_id: existingPermit.id,
    permit_num: newPermit.permit_num,
    external_id: existingPermit.external_id,
    changed_at: new Date().toISOString(),
    changed_fields,
    old_values,
    new_values,
    change_type,
    business_impact,
    days_since_last_change: null,
    change_count_for_permit: null,
  }
}
