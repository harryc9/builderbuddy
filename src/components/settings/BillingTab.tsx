'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getDaysLeftInTrial,
  getEffectiveUser,
  getSubscriptionStatusMessage,
} from '@/lib/subscription'
import type { Database } from '@/types/supabase.public.types'
import Image from 'next/image'

type User = Database['public']['Tables']['users']['Row']

type BillingTabProps = {
  userData: User | null
  onManageBilling: () => void
}

export function BillingTab({ userData, onManageBilling }: BillingTabProps) {
  if (!userData) {
    return (
      <div className="space-y-4 py-4">
        <div className="text-center text-sm text-muted-foreground">
          Loading billing information...
        </div>
      </div>
    )
  }

  // Get effective user data with debug override applied
  const effectiveUser = getEffectiveUser(userData)
  if (!effectiveUser) return null

  const statusInfo = getSubscriptionStatusMessage(userData)
  const status = effectiveUser.subscription_status
  const daysLeft = getDaysLeftInTrial(userData)
  const nextBillingDate = effectiveUser.subscription_current_period_end
    ? new Date(
        effectiveUser.subscription_current_period_end,
      ).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const getStatusBadgeVariant = () => {
    if (status === 'active') return 'default'
    if (status === 'trialing') return 'secondary'
    if (status === 'past_due') return 'destructive'
    return 'outline'
  }

  const getStatusLabel = () => {
    if (status === 'active') return 'Active'
    if (status === 'trialing') {
      return daysLeft > 0 ? `Trial - ${daysLeft} days` : 'Trial'
    }
    if (status === 'past_due') return 'Past Due'
    if (status === 'canceled') return 'Canceled'
    return 'No Subscription'
  }

  return (
    <div className="space-y-6 py-4">
      {/* Plan Details */}
      {(status === 'active' || status === 'trialing') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Pro - $29/month</span>
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusLabel()}
              </Badge>
            </div>
          </div>

          {nextBillingDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Next Billing Date
              </span>
              <span className="text-sm font-medium">{nextBillingDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Manage Billing Button */}
      {statusInfo.showManageLink && (
        <Button onClick={onManageBilling} className="w-full" variant="outline">
          <Image src="/stripe.svg" alt="Stripe" width={48} height={24} />
          Manage Billing
        </Button>
      )}
    </div>
  )
}
