'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useMarkAllNotificationsRead,
  useNotifications,
} from '@/hooks/useNotifications'
import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NotificationList } from './NotificationList'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useNotifications()
  const markAllReadMutation = useMarkAllNotificationsRead()

  // Count unread notifications
  const unreadCount = data?.notifications?.filter((n) => !n.is_read).length || 0

  // Auto-mark all as read when opening the popover
  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllReadMutation.mutate()
    }
  }, [open, unreadCount, markAllReadMutation.mutate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] max-w-[calc(100vw-2rem)] p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationList
          notifications={data?.notifications || []}
          isLoading={isLoading}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
