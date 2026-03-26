'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { useUser } from '@/hooks/useUser'
import { Bug } from 'lucide-react'
import { useEffect, useState } from 'react'

type SubscriptionOverride = {
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | null
  trial_end?: string // ISO date string
  subscription_current_period_end?: string
  hasServiceArea?: boolean
  hasCategories?: boolean
}

type SubscriptionType = 'trialing' | 'active' | null

const SUBSCRIPTION_OPTIONS = [
  { label: '🎉 Trial (3 days)', value: 'trialing' as const },
  { label: '✅ Active', value: 'active' as const },
  { label: '❌ No Access', value: null },
]

export function SubscriptionDebugger() {
  const { data: user } = useUser()
  const [isVisible, setIsVisible] = useState(false)
  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>(null)
  const [hasServiceArea, setHasServiceArea] = useState(true)
  const [hasCategories, setHasCategories] = useState(true)
  const [hasActiveOverride, setHasActiveOverride] = useState(false)

  // Only show for admin users
  const shouldShow = user?.admin

  // Load override from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('subscription_debug_override')
    setHasActiveOverride(stored !== null)

    if (stored) {
      try {
        const override: SubscriptionOverride = JSON.parse(stored)
        setSubscriptionType(override.subscription_status as SubscriptionType)
        setHasServiceArea(override.hasServiceArea ?? true)
        setHasCategories(override.hasCategories ?? true)
      } catch (e) {
        console.error('Failed to parse subscription override:', e)
      }
    }
  }, [])

  const buildOverride = (
    status: SubscriptionType,
    serviceArea: boolean,
    categories: boolean,
  ): SubscriptionOverride | null => {
    if (status === null) {
      return { subscription_status: null }
    }

    const override: SubscriptionOverride = {
      subscription_status: status,
      hasServiceArea: serviceArea,
      hasCategories: categories,
    }

    if (status === 'trialing') {
      override.trial_end = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString()
    } else if (status === 'active') {
      override.subscription_current_period_end = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString()
    }

    return override
  }

  const applyState = () => {
    const override = buildOverride(
      subscriptionType,
      hasServiceArea,
      hasCategories,
    )
    if (override) {
      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify(override),
      )
    } else {
      localStorage.removeItem('subscription_debug_override')
    }
    // Force reload to apply changes
    window.location.reload()
  }

  const syncNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/sync', {
        method: 'POST',
      })
      if (response.ok) {
        // Reload to show new notifications
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to sync notifications:', error)
    }
  }

  const clearOverride = () => {
    localStorage.removeItem('subscription_debug_override')
    setSubscriptionType(null)
    setHasServiceArea(true)
    setHasCategories(true)
    window.location.reload()
  }

  if (!shouldShow) return null

  return (
    <>
      {/* Toggle button */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg"
          type="button"
        >
          <Bug className="h-5 w-5" />
        </button>
      )}

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-sm">Subscription Test</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Subscription Type Dropdown */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5 block">
                Subscription
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="w-full" variant="outline">
                    {SUBSCRIPTION_OPTIONS.find(
                      (opt) => opt.value === subscriptionType,
                    )?.label || 'Select...'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Subscription Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SUBSCRIPTION_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onClick={() => setSubscriptionType(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Setup Checkboxes - Only show if has subscription */}
            {subscriptionType !== null && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-gray-600">Setup State</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="serviceArea"
                    checked={hasServiceArea}
                    onCheckedChange={(checked) =>
                      setHasServiceArea(checked === true)
                    }
                  />
                  <label
                    htmlFor="serviceArea"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Has Service Area
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="categories"
                    checked={hasCategories}
                    onCheckedChange={(checked) =>
                      setHasCategories(checked === true)
                    }
                  />
                  <label
                    htmlFor="categories"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Has Categories
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button size="sm" className="w-full" onClick={applyState}>
                Apply State
              </Button>
              {hasActiveOverride && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full text-xs"
                  onClick={clearOverride}
                >
                  Clear Override
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
