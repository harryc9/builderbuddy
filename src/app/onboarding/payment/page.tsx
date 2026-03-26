'use client'

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-provider'
import { useUser } from '@/hooks/useUser'
import { authenticatedFetch } from '@/lib/api-client'
import { isStripeTestMode } from '@/lib/stripe-env'
import {
  hasDebugOverride,
  hasSubscriptionAccessFallback,
} from '@/lib/subscription'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type VerifyResponse = {
  hasAccess: boolean
  reason: string
  isReturningUser: boolean
  subscriptionCount: number
  subscription?: {
    id: string
    status: string
    trialEnd: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}

export default function OnboardingPaymentPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: userData, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [trialEndDate, setTrialEndDate] = useState('')
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Calculate trial end date
  useEffect(() => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    setTrialEndDate(
      endDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    )
  }, [])

  // Verify subscription status with Stripe API for robust returning user detection
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      !userLoading &&
      userData &&
      !verifyData &&
      !isVerifying
    ) {
      const verifySubscription = async () => {
        setIsVerifying(true)
        try {
          // Check for debug override - if present, use local check instead of API
          let data: VerifyResponse

          if (hasDebugOverride()) {
            // Use local subscription check when debug override is active
            const hasAccess = hasSubscriptionAccessFallback(userData)
            data = {
              hasAccess,
              reason: hasAccess ? 'Debug override active' : 'No access (debug)',
              isReturningUser: false,
              subscriptionCount: 0,
            }
          } else {
            const response = await authenticatedFetch(
              '/api/subscription/verify',
            )
            data = await response.json()
          }

          setVerifyData(data)

          // If user has access and payment method, redirect to app
          const hasPaymentMethod = isStripeTestMode
            ? !!userData.stripe_customer_id_test
            : !!userData.stripe_customer_id

          if (data.hasAccess && hasPaymentMethod) {
            router.push('/app')
          }
        } catch (error) {
          console.error('Failed to verify subscription:', error)
          // On error, don't block the user - they can still proceed with checkout
        } finally {
          setIsVerifying(false)
        }
      }

      verifySubscription()
    }
  }, [
    authLoading,
    isAuthenticated,
    userLoading,
    userData,
    verifyData,
    isVerifying,
    router,
  ])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  const handleStartTrial = async () => {
    setIsCreatingCheckout(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      window.location.href = data.url
    } catch (error) {
      const err = error as Error
      console.error('Checkout error:', err)
      toast.error(err.message || 'Failed to start checkout')
      setIsCreatingCheckout(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/categories')
  }

  if (authLoading || userLoading || isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Use API verification data if available, otherwise fall back to database check
  const isReturningUser = verifyData
    ? verifyData.isReturningUser
    : // Fallback: check database (less robust but works if API fails)
      (isStripeTestMode
        ? !!userData?.stripe_customer_id_test
        : !!userData?.stripe_customer_id) &&
      !hasSubscriptionAccessFallback(userData ?? null)

  return (
    <OnboardingLayout
      currentStep={3}
      centerContent
      actions={
        <div className="flex gap-3">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={isCreatingCheckout}
            size="lg"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleStartTrial}
            disabled={isCreatingCheckout}
            size="lg"
            className="flex-1"
          >
            {isCreatingCheckout ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : isReturningUser ? (
              'Subscribe Now'
            ) : (
              'Start Free Trial'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-8 max-w-md mx-auto">
        {/* Expired Subscription Alert - Only show for returning users */}
        {isReturningUser && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Your subscription has expired
              </h3>
              <p className="text-sm text-red-700">
                Subscribe now to regain access to daily permit alerts and the
                full database.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            {isReturningUser
              ? 'Subscribe to continue'
              : 'Start your free trial'}
          </h2>
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-5xl font-bold text-foreground">$29</span>
            <span className="text-xl font-medium text-muted-foreground">
              /month
            </span>
          </div>
          <p className="text-muted-foreground">
            {isReturningUser
              ? 'Cancel anytime • No hidden fees'
              : '7 days free, then billed monthly'}
          </p>
        </div>

        {/* Trial benefits - Only show for first-time users */}
        {!isReturningUser && (
          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-foreground">
                Cancel anytime before {trialEndDate}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-foreground">
                No charge if you cancel during trial
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-foreground">
                Payment info required to prevent abuse
              </span>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-4">
          <h3 className="font-semibold">What you'll get:</h3>
          <div className="space-y-3">
            {[
              'Daily email digests with matching permits',
              'Full access to 300,000+ Toronto permits',
              'Advanced filtering by location & cost',
              'Real-time permit updates',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-2" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
