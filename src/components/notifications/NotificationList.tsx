'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import type { Notification } from '@/hooks/useNotifications'
import { Bell, Loader2 } from 'lucide-react'
import { NotificationItem } from './NotificationItem'

type NotificationListProps = {
  notifications: Notification[]
  isLoading: boolean
  onClose: () => void
}

export function NotificationList({
  notifications,
  isLoading,
  onClose,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No notifications
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You're all caught up!
          </p>
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
