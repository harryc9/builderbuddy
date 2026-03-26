import { togglePermitAction } from '@/app/actions/permit-actions'
import { useAuth } from '@/context/auth-provider'
import { authenticatedFetch } from '@/lib/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Toggle action (save/ignore) with optimistic cache updates
 *
 * Strategy: Immediately update cache with new action state, then refetch in background.
 * This ensures 0ms UI updates with no flickering.
 */
export function useTogglePermitAction() {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async ({
      permitId,
      action,
    }: {
      permitId: string
      action: 'saved' | 'ignored'
    }) => {
      if (!session?.access_token) {
        throw new Error('No session token')
      }
      return await togglePermitAction(session.access_token, permitId, action)
    },
    onMutate: async ({ permitId, action }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['permits', 'search'] })

      // Snapshot previous state for rollback
      const previousSearches = queryClient.getQueriesData({
        queryKey: ['permits', 'search'],
      })

      // Optimistically update each search cache individually
      for (const [queryKey, oldData] of previousSearches) {
        const old = oldData as any
        if (!old?.permits) continue

        // Find the permit to determine current action state
        const permit = old.permits.find((p: any) => p.id === permitId)
        if (!permit) continue

        const currentAction = permit.user_action
        const newAction = currentAction === action ? null : action

        // Extract view from the query key: ['permits', 'search', { view: 'all', ... }]
        const params = (queryKey[2] as any) || {}
        const currentView = params.view || 'all'

        // Determine if permit should be removed from current view
        const shouldRemove =
          (currentView === 'all' &&
            action === 'ignored' &&
            currentAction !== 'ignored') || // Ignoring from All
          (currentView === 'saved' &&
            (action === 'ignored' ||
              (currentAction === 'saved' && action === 'saved'))) || // Changing saved permit
          (currentView === 'ignored' &&
            currentAction === 'ignored' &&
            action === 'ignored') // Unignoring from Ignored

        if (shouldRemove) {
          // Remove permit from list
          queryClient.setQueryData(queryKey, {
            ...old,
            permits: old.permits.filter((p: any) => p.id !== permitId),
            pagination: {
              ...old.pagination,
              total_count: Math.max(0, (old.pagination?.total_count || 0) - 1),
            },
          })
        } else {
          // Just update the action state
          queryClient.setQueryData(queryKey, {
            ...old,
            permits: old.permits.map((p: any) => {
              if (p.id !== permitId) return p
              return {
                ...p,
                user_action: newAction,
              }
            }),
          })
        }
      }

      return { previousSearches }
    },
    onSuccess: async () => {
      // Refetch in background to sync with server (non-blocking)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['permits', 'search'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['permit-actions', 'count'],
        }),
      ])
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousSearches) {
        for (const [queryKey, data] of context.previousSearches) {
          queryClient.setQueryData(queryKey, data)
        }
      }

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['permits'] })

      console.error('[useTogglePermitAction] Error:', error)
    },
  })
}

/**
 * Get count of saved or ignored permits for badge display
 */
export function usePermitActionCount(action: 'saved' | 'ignored') {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['permit-actions', 'count', action],
    queryFn: async () => {
      const res = await authenticatedFetch(
        `/api/permits/actions/count?action=${action}`,
      )
      if (!res.ok) {
        throw new Error('Failed to fetch action count')
      }

      return res.json() as Promise<{ count: number }>
    },
    enabled: !!user,
    staleTime: 0, // Always consider stale so invalidation triggers immediate refetch
    gcTime: 5 * 60_000, // 5 minutes,
  })
}
