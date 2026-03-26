'use client'

import { Button } from '@/components/ui/button'
import {
  type Notification,
  useDismissNotification,
  useMarkNotificationRead,
} from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type NotificationItemProps = {
  notification: Notification
  onClose: () => void
}

export function NotificationItem({
  notification,
  onClose,
}: NotificationItemProps) {
  const router = useRouter()
  const markReadMutation = useMarkNotificationRead()
  const dismissMutation = useDismissNotification()

  const handleAction = () => {
    if (!notification.action_url) return

    // Mark as read
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id)
    }

    // Handle action
    if (notification.action_url.startsWith('/api/')) {
      // API call (like Stripe portal)
      window.location.href = notification.action_url
    } else if (notification.action_url === '#') {
      // Open user settings with appropriate tab
      let tab = 'account'

      // Determine which tab to open based on notification type
      if (
        notification.notification_type === 'trial_active' ||
        notification.notification_type === 'trial_ending' ||
        notification.notification_type === 'trial_expired' ||
        notification.notification_type === 'payment_failed' ||
        notification.action_label?.toLowerCase().includes('subscription') ||
        notification.action_label?.toLowerCase().includes('billing')
      ) {
        tab = 'billing'
      } else if (notification.notification_type === 'setup_missing_address') {
        tab = 'account' // Service area is in account tab
      } else if (
        notification.notification_type === 'setup_missing_categories'
      ) {
        tab = 'emails' // Categories are in emails tab
      }

      // Dispatch custom event to open settings with appropriate tab
      window.dispatchEvent(
        new CustomEvent('openUserSettings', {
          detail: { tab },
        }),
      )
      onClose()
    } else {
      // Navigate to URL
      router.push(notification.action_url)
      onClose()
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Mark as read when dismissing
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id)
    }
    dismissMutation.mutate(notification.id)
  }

  // Get icon and colors based on severity
  const getIconAndStyles = () => {
    switch (notification.severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          borderColor: 'border-l-red-500',
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50',
          iconColor: 'text-orange-600',
          borderColor: 'border-l-orange-500',
        }
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          borderColor: 'border-l-blue-500',
        }
    }
  }

  const { icon: Icon, bgColor, iconColor, borderColor } = getIconAndStyles()

  return (
    <div
      className={cn(
        'relative p-4 border-l-4',
        borderColor,
        !notification.is_read && 'bg-muted/30',
      )}
    >
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 hover:bg-background"
        onClick={handleDismiss}
        disabled={dismissMutation.isPending}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <div className="flex gap-3 pr-6">
        {/* Icon */}
        <div className={cn('rounded-full p-2 shrink-0 self-start', bgColor)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight">
              {notification.title}
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {notification.description}
          </p>

          {/* Action button */}
          {notification.action_url && notification.action_label && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleAction()
              }}
            >
              {notification.action_label}
            </Button>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-muted-foreground pt-1">
            {getRelativeTime(notification.created_at)}
          </p>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600" />
      )}
    </div>
  )
}

// Helper function to format relative time
function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  })
}
