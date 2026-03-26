'use client'

import { useAuth } from '@/context/auth-provider'
import { useUser } from '@/hooks/useUser'
import { authenticatedFetch } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * OAuth callback handler
 *
 * This page handles redirects from OAuth providers (Google) and determines
 * where to send the user based on their onboarding/subscription status:
 *
 * - New users → /onboarding/address
 * - Returning users with incomplete onboarding → appropriate onboarding step
 * - Returning users with active subscription → /app
 * - Returning users with expired subscription → /onboarding/payment
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: userData, isLoading: userLoading } = useUser()
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (authLoading || userLoading || isChecking) return
    if (!isAuthenticated || !userData) return

    const determineRedirect = async () => {
      setIsChecking(true)

      try {
        // Check if user has completed address step
        const hasAddress = !!(
          userData.address &&
          userData.address_lat &&
          userData.address_lng
        )

        // Check if user has completed categories step
        const hasCategories =
          userData.subscribed_categories &&
          userData.subscribed_categories.length > 0

        // If missing onboarding data, redirect to appropriate step
        if (!hasAddress) {
          router.push('/onboarding/address')
          return
        }

        if (!hasCategories) {
          router.push('/onboarding/categories')
          return
        }

        // User has completed address + categories
        // Now check subscription status with Stripe (source of truth)
        try {
          const response = await authenticatedFetch('/api/subscription/verify')
          const verifyData = await response.json()

          if (verifyData.hasAccess) {
            // Has active subscription/trial → go to app
            router.push('/app')
          } else {
            // No active subscription → go to payment
            router.push('/onboarding/payment')
          }
        } catch (error) {
          console.error('Failed to verify subscription:', error)
          // On error, assume needs payment
          router.push('/onboarding/payment')
        }
      } catch (error) {
        console.error('Error determining redirect:', error)
        // Default to onboarding start on error
        router.push('/onboarding/address')
      } finally {
        setIsChecking(false)
      }
    }

    determineRedirect()
  }, [authLoading, userLoading, isAuthenticated, userData, router, isChecking])

  // Show loading state
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
