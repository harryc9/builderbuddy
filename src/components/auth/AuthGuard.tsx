'use client'

import { useAuth } from '@/context/auth-provider'
import { useUser } from '@/hooks/useUser'
import { authenticatedFetch } from '@/lib/api-client'
import {
  hasDebugOverride,
  hasSubscriptionAccessFallback,
} from '@/lib/subscription'
import type { Database } from '@/types/supabase.public.types'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type AuthGuardProps = {
  children: React.ReactNode
  redirectTo?: string
  requireSubscription?: boolean
}

type User = Database['public']['Tables']['users']['Row']

/**
 * Determines the correct onboarding step to redirect user to based on their progress
 */
function getOnboardingRedirect(user: User | null): string {
  if (!user) return '/onboarding/address'

  // Check if they have completed address step
  const hasAddress = !!(user.address && user.address_lat && user.address_lng)
  if (!hasAddress) {
    return '/onboarding/address'
  }

  // Check if they have completed categories step
  const hasCategories =
    user.subscribed_categories && user.subscribed_categories.length > 0
  if (!hasCategories) {
    return '/onboarding/categories'
  }

  // Check if they have an active subscription (not just customer ID)
  // This is checked by hasSubscriptionAccessFallback, so if they reach here
  // without subscription access, they need to go to payment
  return '/onboarding/payment'
}

export function AuthGuard({
  children,
  redirectTo = '/',
  requireSubscription = true,
}: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: userData, isLoading: userLoading } = useUser()
  const [verifiedAccess, setVerifiedAccess] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const isLoading = authLoading || userLoading

  // Real-time subscription verification with Stripe API
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      requireSubscription &&
      userData &&
      !isVerifying &&
      verifiedAccess === null
    ) {
      const verifyWithStripe = async () => {
        setIsVerifying(true)
        try {
          // Check for debug override first - if present, skip API verification
          // (API can't access localStorage, so debug overrides won't work there)
          if (hasDebugOverride()) {
            const dbAccess = hasSubscriptionAccessFallback(userData)
            setVerifiedAccess(dbAccess)

            if (!dbAccess) {
              const onboardingStep = getOnboardingRedirect(userData)
              router.push(onboardingStep)
            }
            return
          }

          const response = await authenticatedFetch('/api/subscription/verify')
          const data = await response.json()

          setVerifiedAccess(data.hasAccess)

          if (!data.hasAccess) {
            const onboardingStep = getOnboardingRedirect(userData)
            router.push(onboardingStep)
          }
        } catch (error) {
          console.error('Subscription verification failed:', error)
          // On error, fall back to database check
          const dbAccess = hasSubscriptionAccessFallback(userData)
          setVerifiedAccess(dbAccess)

          if (!dbAccess) {
            const onboardingStep = getOnboardingRedirect(userData)
            router.push(onboardingStep)
          }
        } finally {
          setIsVerifying(false)
        }
      }

      verifyWithStripe()
    }
  }, [
    isLoading,
    isAuthenticated,
    requireSubscription,
    userData,
    router,
    verifiedAccess,
    isVerifying,
  ])

  useEffect(() => {
    // First check: Authentication
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
      return
    }

    // Second check: Email confirmation
    if (!isLoading && isAuthenticated && user && !user.email_confirmed_at) {
      router.push('/verify-email')
      return
    }

    // Third check: If subscription not required, we're done
    if (!isLoading && isAuthenticated && !requireSubscription) {
      return
    }
  }, [
    isAuthenticated,
    isLoading,
    redirectTo,
    requireSubscription,
    user,
    router,
  ])

  // Show loading while verifying
  if (isLoading || (requireSubscription && isVerifying)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check if should show content
  const isEmailConfirmed = user?.email_confirmed_at
  const hasAccess = requireSubscription
    ? (verifiedAccess ?? hasSubscriptionAccessFallback(userData ?? null))
    : true

  const shouldShowContent = isAuthenticated && isEmailConfirmed && hasAccess

  return shouldShowContent ? children : null
}
