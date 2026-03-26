'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { useTogglePermitAction } from '@/hooks/usePermitActions'
import { cn } from '@/lib/utils'
import { Bookmark, EyeOff } from 'lucide-react'

type Props = {
  permitId: string
  userAction: 'saved' | 'ignored' | null
}

export function PermitActionButtons({ permitId, userAction }: Props) {
  const toggleAction = useTogglePermitAction()

  const handleSave = () => {
    toggleAction.mutate(
      { permitId, action: 'saved' },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast({
              title: result.message,
              duration: 2000,
            })
          } else {
            toast({
              title: 'Error saving permit',
              description: result.message || 'Unknown error',
              variant: 'destructive',
              duration: 5000,
            })
          }
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description:
              error instanceof Error
                ? error.message
                : 'Failed to save permit. Please try again.',
            variant: 'destructive',
            duration: 5000,
          })
        },
      },
    )
  }

  const handleIgnore = () => {
    toggleAction.mutate(
      { permitId, action: 'ignored' },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast({
              title: result.message,
              duration: 2000,
            })
          } else {
            toast({
              title: 'Error ignoring permit',
              description: result.message || 'Unknown error',
              variant: 'destructive',
              duration: 5000,
            })
          }
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description:
              error instanceof Error
                ? error.message
                : 'Failed to ignore permit. Please try again.',
            variant: 'destructive',
            duration: 5000,
          })
        },
      },
    )
  }

  return (
    <div className="flex items-center gap-1">
      {/* Save Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', userAction === 'saved' && 'text-blue-600')}
            onClick={(e) => {
              e.stopPropagation() // Prevent row click
              handleSave()
            }}
          >
            <Bookmark
              size={16}
              fill={userAction === 'saved' ? 'currentColor' : 'none'}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {userAction === 'saved' ? 'Unsave' : 'Save'}
        </TooltipContent>
      </Tooltip>

      {/* Ignore Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              userAction === 'ignored' && 'text-gray-500',
            )}
            onClick={(e) => {
              e.stopPropagation()
              handleIgnore()
            }}
          >
            <EyeOff
              size={16}
              fill={userAction === 'ignored' ? 'currentColor' : 'none'}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {userAction === 'ignored' ? 'Unignore' : 'Ignore'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
