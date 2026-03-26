import { authenticatedFetch } from '@/lib/api-client'
import type { PermitSearchParams, PermitSearchResponse } from '@/types/permits'
import { useQuery } from '@tanstack/react-query'

// Fetch function for React Query
async function fetchPermits(
  params: PermitSearchParams,
  userLat?: number | null,
  userLng?: number | null,
): Promise<PermitSearchResponse> {
  const queryString = new URLSearchParams()

  // Build query string from params
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue

    if (Array.isArray(value)) {
      for (const v of value) {
        queryString.append(key, String(v))
      }
    } else {
      queryString.append(key, String(value))
    }
  }

  // Only add coordinates if filtering by distance
  // For display-only distances, we calculate client-side to avoid double queries
  if (params.max_distance_km != null && userLat != null && userLng != null) {
    queryString.append('user_lat', String(userLat))
    queryString.append('user_lng', String(userLng))
  }

  const url = `/api/permits/search?${queryString}`

  // Always use authenticatedFetch so we can filter out ignored permits
  const response = await authenticatedFetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// React Query hook
export function usePermitsSearch(
  params: PermitSearchParams,
  userLat?: number | null,
  userLng?: number | null,
) {
  return useQuery({
    // Don't include coordinates in cache key unless filtering by distance
    // This prevents double queries when user data loads
    queryKey: ['permits', 'search', params],
    queryFn: () => fetchPermits(params, userLat, userLng),
    staleTime: 0, // Always consider stale so invalidation triggers immediate refetch
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
