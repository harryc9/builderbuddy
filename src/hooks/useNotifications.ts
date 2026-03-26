import { useToast } from '@/hooks/use-toast'
import { authenticatedFetch } from '@/lib/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type Notification = {
  id: string
  user_id: string
  notification_type: string
  severity: string
  title: string
  description: string
  is_read: boolean
  is_dismissed: boolean
  read_at: string | null
  dismissed_at: string | null
  action_url: string | null
  action_label: string | null
  metadata: any
  expires_at: string | null
  created_at: string
  updated_at: string
}

type NotificationsResponse = {
  notifications: Notification[]
}

/**
 * Fetch all active notifications for the current user
 */
export function useNotifications(unreadOnly = false) {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (unreadOnly) {
        params.set('unread_only', 'true')
      }

      // Check for debug override in localStorage
      const debugOverride = localStorage.getItem('subscription_debug_override')

      const headers: HeadersInit = {}
      if (debugOverride) {
        headers['x-debug-override'] = debugOverride
      }

      const res = await authenticatedFetch(
        `/api/notifications?${params.toString()}`,
        { headers },
      )
      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return res.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Mark a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await authenticatedFetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
        },
      )
      if (!res.ok) {
        throw new Error('Failed to mark notification as read')
      }
      return res.json()
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        { unreadOnly: false },
      ])

      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(
          ['notifications', { unreadOnly: false }],
          {
            ...previousData,
            notifications: previousData.notifications.map((n) =>
              n.id === notificationId
                ? { ...n, is_read: true, read_at: new Date().toISOString() }
                : n,
            ),
          },
        )
      }

      return { previousData }
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['notifications', { unreadOnly: false }],
          context.previousData,
        )
      }
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Dismiss a notification
 */
export function useDismissNotification() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await authenticatedFetch(
        `/api/notifications/${notificationId}/dismiss`,
        {
          method: 'PATCH',
        },
      )
      if (!res.ok) {
        throw new Error('Failed to dismiss notification')
      }
      return res.json()
    },
    onMutate: async (notificationId) => {
      // Optimistic update - remove notification from list
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        { unreadOnly: false },
      ])

      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(
          ['notifications', { unreadOnly: false }],
          {
            ...previousData,
            notifications: previousData.notifications.filter(
              (n) => n.id !== notificationId,
            ),
          },
        )
      }

      return { previousData }
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['notifications', { unreadOnly: false }],
          context.previousData,
        )
      }
      toast({
        title: 'Error',
        description: 'Failed to dismiss notification',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const res = await authenticatedFetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      if (!res.ok) {
        throw new Error('Failed to mark all notifications as read')
      }
      return res.json()
    },
    onMutate: async () => {
      // Optimistic update - mark all as read
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        { unreadOnly: false },
      ])

      if (previousData) {
        const now = new Date().toISOString()
        queryClient.setQueryData<NotificationsResponse>(
          ['notifications', { unreadOnly: false }],
          {
            ...previousData,
            notifications: previousData.notifications.map((n) => ({
              ...n,
              is_read: true,
              read_at: n.read_at || now,
            })),
          },
        )
      }

      return { previousData }
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['notifications', { unreadOnly: false }],
          context.previousData,
        )
      }
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
