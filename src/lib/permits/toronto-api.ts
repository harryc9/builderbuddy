import * as https from 'node:https'

export interface TorontoPermitRaw {
  _id: number
  PERMIT_NUM: string
  REVISION_NUM?: string
  PERMIT_TYPE?: string
  STRUCTURE_TYPE?: string
  WORK?: string
  STREET_NUM?: string
  STREET_NAME?: string
  STREET_TYPE?: string
  STREET_DIRECTION?: string
  POSTAL?: string
  GEO_ID?: string
  WARD_GRID?: string
  APPLICATION_DATE?: string
  ISSUED_DATE?: string
  COMPLETED_DATE?: string
  STATUS?: string
  DESCRIPTION?: string
  CURRENT_USE?: string
  PROPOSED_USE?: string
  DWELLING_UNITS_CREATED?: string | number
  DWELLING_UNITS_LOST?: string | number
  EST_CONST_COST?: string | number
  ASSEMBLY?: string | number
  INSTITUTIONAL?: string | number
  RESIDENTIAL?: string | number
  BUSINESS_AND_PERSONAL_SERVICES?: string | number
  MERCANTILE?: string | number
  INDUSTRIAL?: string | number
  INTERIOR_ALTERATIONS?: string | number
  DEMOLITION?: string | number
  BUILDER_NAME?: string
  LONGITUDE?: number
  LATITUDE?: number
  FULL_ADDRESS?: string
}

interface PackageResource {
  id: string
  datastore_active: boolean
}

interface PackageData {
  resources: PackageResource[]
}

interface DatastoreResult {
  records: TorontoPermitRaw[]
  total: number
  downloadTime: number
  dataSize: number
}

const PACKAGE_ID = '108c2bd1-6945-46f6-af92-02f5658ee7f7'
const BASE_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action'

export async function getPackage(): Promise<PackageData> {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}/package_show?id=${PACKAGE_ID}`, (response) => {
      const dataChunks: Buffer[] = []
      response
        .on('data', (chunk) => {
          dataChunks.push(chunk)
        })
        .on('end', () => {
          const data = Buffer.concat(dataChunks)
          resolve(JSON.parse(data.toString()).result)
        })
        .on('error', (error) => {
          console.error('❌ Package metadata error:', error)
          reject(error)
        })
    })
  })
}

export async function getDatastoreResource(
  resource: PackageResource,
  limit = 32000,
  offset = 0,
): Promise<DatastoreResult> {
  return new Promise<DatastoreResult>((resolve, reject) => {
    const url = `${BASE_URL}/datastore_search?id=${resource.id}&limit=${limit}&offset=${offset}&sort=APPLICATION_DATE desc`

    const startTime = Date.now()
    https.get(url, (response) => {
      const dataChunks: Buffer[] = []
      let totalBytes = 0

      response
        .on('data', (chunk) => {
          dataChunks.push(chunk)
          totalBytes += chunk.length
        })
        .on('end', () => {
          const endTime = Date.now()
          const data = Buffer.concat(dataChunks)
          const parsedData = JSON.parse(data.toString())

          resolve({
            records: parsedData.result.records || [],
            total: parsedData.result.total || 0,
            downloadTime: endTime - startTime,
            dataSize: totalBytes,
          })
        })
        .on('error', (error) => {
          console.error(`❌ Download error at offset ${offset}:`, error)
          reject(error)
        })
    })
  })
}

export async function fetchFullDataset(
  resource: PackageResource,
): Promise<{
  permits: TorontoPermitRaw[]
  totalDownloadTime: number
  totalDataSize: number
}> {
  console.log('📥 Downloading permits from Toronto Open Data...')

  const allPermits: TorontoPermitRaw[] = []
  let offset = 0
  const limit = 32000
  let hasMoreData = true
  let totalDownloadTime = 0
  let totalDataSize = 0
  let batchCount = 0

  while (hasMoreData) {
    try {
      const result = await getDatastoreResource(resource, limit, offset)

      const permits = result.records
      totalDownloadTime += result.downloadTime
      totalDataSize += result.dataSize
      batchCount++

      if (permits.length === 0) {
        hasMoreData = false
        break
      }

      allPermits.push(...permits)

      if (permits.length < limit) {
        hasMoreData = false
      } else {
        offset += limit
      }

      if (offset > 1000000) {
        console.warn('⚠️  Reached safety limit of 1M records')
        hasMoreData = false
      }

      const memUsage = process.memoryUsage()
      if (memUsage.heapUsed > 1024 * 1024 * 1024) {
        console.warn('⚠️  Memory usage approaching 1GB, stopping for safety')
        hasMoreData = false
      }
    } catch (error) {
      console.error('❌ Error fetching batch:', error)
      hasMoreData = false
    }
  }

  console.log(
    `✅ Downloaded ${allPermits.length.toLocaleString()} permits (${(totalDataSize / 1024 / 1024).toFixed(1)}MB in ${(totalDownloadTime / 1000).toFixed(1)}s)`,
  )

  return {
    permits: allPermits,
    totalDownloadTime,
    totalDataSize,
  }
}

