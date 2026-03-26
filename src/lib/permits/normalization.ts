import { DateTime } from 'luxon'
import type { TorontoPermitRaw } from './toronto-api'

export interface NormalizedPermit {
  permit_num: string
  revision_num: string | null
  permit_type: string | null
  structure_type: string | null
  work: string | null
  street_num: string | null
  street_name: string | null
  street_type: string | null
  street_direction: string | null
  postal: string | null
  full_address: string | null
  geo_id: string | null
  ward_grid: string | null
  location: string | null
  application_date: string | null
  issued_date: string | null
  completed_date: string | null
  status: string | null
  description: string | null
  current_use: string | null
  proposed_use: string | null
  dwelling_units_created: number | null
  dwelling_units_lost: number | null
  est_const_cost: number | null
  assembly: number | null
  institutional: number | null
  residential: number | null
  business_and_personal_services: number | null
  mercantile: number | null
  industrial: number | null
  interior_alterations: number | null
  demolition: number | null
  builder_name: string | null
  raw_data: TorontoPermitRaw
  first_seen_at: string
  data_source_version: string
  source: string
}

export function normalizePermit(permit: TorontoPermitRaw): NormalizedPermit {
  return {
    permit_num: permit.PERMIT_NUM || permit._id?.toString(),
    revision_num: permit.REVISION_NUM || null,
    permit_type: permit.PERMIT_TYPE || null,
    structure_type: permit.STRUCTURE_TYPE || null,
    work: permit.WORK || null,

    street_num: permit.STREET_NUM || null,
    street_name: permit.STREET_NAME || null,
    street_type: permit.STREET_TYPE || null,
    street_direction: permit.STREET_DIRECTION || null,
    postal: permit.POSTAL || null,
    full_address:
      permit.FULL_ADDRESS ||
      `${permit.STREET_NUM || ''} ${permit.STREET_NAME || ''} ${permit.STREET_TYPE || ''}`.trim() ||
      null,

    geo_id: permit.GEO_ID || null,
    ward_grid: permit.WARD_GRID || null,
    location:
      permit.LONGITUDE && permit.LATITUDE
        ? `POINT(${permit.LONGITUDE} ${permit.LATITUDE})`
        : null,

    application_date: permit.APPLICATION_DATE || null,
    issued_date: permit.ISSUED_DATE || null,
    completed_date: permit.COMPLETED_DATE || null,

    status: permit.STATUS || null,
    description: permit.DESCRIPTION || null,
    current_use: permit.CURRENT_USE || null,
    proposed_use: permit.PROPOSED_USE || null,

    dwelling_units_created: permit.DWELLING_UNITS_CREATED
      ? Number(permit.DWELLING_UNITS_CREATED)
      : null,
    dwelling_units_lost: permit.DWELLING_UNITS_LOST
      ? Number(permit.DWELLING_UNITS_LOST)
      : null,
    est_const_cost:
      permit.EST_CONST_COST &&
      permit.EST_CONST_COST !== 'DO NOT UPDATE OR DELETE THIS INFO FIELD' &&
      !Number.isNaN(Number(permit.EST_CONST_COST))
        ? Number(permit.EST_CONST_COST)
        : null,

    assembly: permit.ASSEMBLY ? Number(permit.ASSEMBLY) : null,
    institutional: permit.INSTITUTIONAL ? Number(permit.INSTITUTIONAL) : null,
    residential: permit.RESIDENTIAL ? Number(permit.RESIDENTIAL) : null,
    business_and_personal_services: permit.BUSINESS_AND_PERSONAL_SERVICES
      ? Number(permit.BUSINESS_AND_PERSONAL_SERVICES)
      : null,
    mercantile: permit.MERCANTILE ? Number(permit.MERCANTILE) : null,
    industrial: permit.INDUSTRIAL ? Number(permit.INDUSTRIAL) : null,
    interior_alterations: permit.INTERIOR_ALTERATIONS
      ? Number(permit.INTERIOR_ALTERATIONS)
      : null,
    demolition: permit.DEMOLITION ? Number(permit.DEMOLITION) : null,

    builder_name: permit.BUILDER_NAME || null,

    raw_data: permit,
    first_seen_at: new Date().toISOString(),
    data_source_version: `full_dataset_test_${DateTime.now().toISODate()}`,
    source: 'toronto',
  }
}
