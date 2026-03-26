/**
 * Types for job role categorization
 */

export type ParentCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  icon_name: string | null
  color_hex: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ParentCategorySlug =
  | 'electrical'
  | 'plumbing'
  | 'hvac-mechanical'
  | 'interior-finishing'
  | 'carpentry-framing'
  | 'masonry-concrete'
  | 'roofing-exteriors'
  | 'insulation-envelope'
  | 'site-work'
  | 'demolition-labour'
  | 'specialty-trades'
  | 'management-professional'

export type JobRoleDefinition = {
  id: string
  job_role_name: string
  job_role_slug: string
  description: string | null
  parent_category: string | null
  display_order: number
  icon_name: string | null
  color_hex: string
  keywords: string[] // JSONB array
  is_active: boolean
  is_popular: boolean
  created_at: string
  updated_at: string
}

export type PermitJobRole = {
  id: string
  permit_id: string
  job_role_slug: string
  llm_model: string | null
  llm_reasoning: string | null
  categorized_at: string
  created_at: string
}

export type PermitWithJobRoles = {
  id: string
  permit_num: string
  description: string | null
  full_address: string | null
  est_const_cost: number | null
  issued_date: string | null
  status: string | null
  builder_name: string | null
  job_roles: JobRoleDefinition[]
  parent_categories?: ParentCategory[]
}

/**
 * Job role slug union type (for type safety)
 */
export type JobRoleSlug =
  | 'electrician'
  | 'plumber'
  | 'hvac-technician'
  | 'rough-carpenter'
  | 'finish-carpenter'
  | 'roofer'
  | 'drywaller'
  | 'painter'
  | 'concrete-worker'
  | 'mason'
  | 'architect-designer'
  | 'civil-engineer'
  | 'construction-engineer'
  | 'construction-manager'
  | 'demolition-worker'
  | 'driver'
  | 'environmental-technician'
  | 'equipment-mechanic'
  | 'estimator'
  | 'fire-protection-technician'
  | 'flooring-installer'
  | 'foreman'
  | 'glazier'
  | 'handyman'
  | 'hazmat-removal'
  | 'heavy-equipment-operator'
  | 'insulation-installer'
  | 'interior-systems-installer'
  | 'ironworker'
  | 'labourer'
  | 'landscaper'
  | 'millworker'
  | 'other'
  | 'paving-worker'
  | 'pipefitter'
  | 'plasterer'
  | 'project-coordinator'
  | 'project-manager'
  | 'quality-inspector'
  | 'safety-inspector'
  | 'scaffold-worker'
  | 'sheet-metal-worker'
  | 'siding-installer'
  | 'site-services'
  | 'site-supervisor'
  | 'surveyor'
  | 'tilesetter'
  | 'traffic-control'
  | 'waterproofing-specialist'
  | 'welder'
