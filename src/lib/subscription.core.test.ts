import type { Database } from '@/types/supabase.public.types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getDaysLeftInTrial,
  getEffectiveUser,
  getSubscriptionStatusMessage,
  getTrialEndDate,
  hasSubscriptionAccessFallback,
  isAdmin,
} from './subscription'

type UserRow = Database['public']['Tables']['users']['Row']

// Mock user fixtures
const createMockUser = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'user-123',
  email: 'test@example.com',
  admin: false,
  subscription_status: null,
  trial_end: null,
  trial_start: null,
  trial_end_test: null,
  trial_start_test: null,
  subscription_current_period_end: null,
  subscription_current_period_end_test: null,
  stripe_customer_id: null,
  stripe_customer_id_test: null,
  stripe_subscription_id: null,
  stripe_subscription_id_test: null,
  address: null,
  address_lat: null,
  address_lng: null,
  address_location: null,
  subscribed_categories: null,
  subscribed_job_roles: null,
  cost_min: null,
  cost_max: null,
  min_project_cost: null,
  only_with_builder: null,
  only_with_cost: null,
  daily_email_enabled: true,
  email_preferences: null,
  trade_keywords: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('Subscription Debug Override System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Admin-Only Debug Override', () => {
    it('should allow admin users to set debug overrides', () => {
      const adminUser = createMockUser({ admin: true })
      const override = {
        subscription_status: 'trialing' as const,
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      // Set override
      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify(override),
      )

      // Get effective user
      const effectiveUser = getEffectiveUser(adminUser)

      expect(effectiveUser?.subscription_status).toBe('trialing')
      expect(effectiveUser?.trial_end).toBe(override.trial_end)
      expect(effectiveUser?.admin).toBe(true) // Admin status preserved
    })

    it('should ignore debug override for non-admin users in production', () => {
      const regularUser = createMockUser({
        admin: false,
        subscription_status: 'active',
      })
      const override = {
        subscription_status: 'trialing' as const,
      }

      // Set override
      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify(override),
      )

      // Get effective user
      const effectiveUser = getEffectiveUser(regularUser)

      // Should remain active (override ignored)
      expect(effectiveUser?.subscription_status).toBe('active')
    })

    it('should always preserve admin status even with override', () => {
      const adminUser = createMockUser({ admin: true })
      const maliciousOverride = {
        admin: false, // Try to remove admin
        subscription_status: 'trialing' as const,
      }

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify(maliciousOverride),
      )

      const effectiveUser = getEffectiveUser(adminUser)

      // Admin status must be preserved
      expect(effectiveUser?.admin).toBe(true)
    })
  })

  describe('Trial Status Overrides', () => {
    it('should correctly calculate days left with trial override', () => {
      const adminUser = createMockUser({ admin: true })
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: sevenDaysFromNow.toISOString(),
        }),
      )

      const daysLeft = getDaysLeftInTrial(adminUser)
      expect(daysLeft).toBe(7)
    })

    it('should return 0 days for expired trial override', () => {
      const adminUser = createMockUser({ admin: true })
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: yesterday.toISOString(),
        }),
      )

      const daysLeft = getDaysLeftInTrial(adminUser)
      expect(daysLeft).toBe(0)
    })

    it('should correctly format trial end date with override', () => {
      const adminUser = createMockUser({ admin: true })
      const futureDate = new Date('2025-12-25T12:00:00Z')

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: futureDate.toISOString(),
        }),
      )

      const formattedDate = getTrialEndDate(adminUser)
      expect(formattedDate).toBeTruthy()
      expect(formattedDate).toContain('December')
      expect(formattedDate).toContain('25')
    })
  })

  describe('Access Control with Overrides', () => {
    it('should deny access to admin with expired trial override', () => {
      const adminUser = createMockUser({ admin: true })
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      // Admin has access by default
      expect(hasSubscriptionAccessFallback(adminUser)).toBe(true)

      // Set override to expired trial
      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: yesterday.toISOString(),
        }),
      )

      // With override, admin should be denied (testing experience)
      expect(hasSubscriptionAccessFallback(adminUser)).toBe(false)
    })

    it('should grant access with active trial override', () => {
      const adminUser = createMockUser({ admin: true })
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: nextWeek.toISOString(),
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(true)
    })

    it('should grant access with active subscription override', () => {
      const adminUser = createMockUser({ admin: true })

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'active',
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(true)
    })

    it('should deny access with past_due status', () => {
      const adminUser = createMockUser({ admin: true })

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'past_due',
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(false)
    })

    it('should deny access with canceled subscription override', () => {
      const adminUser = createMockUser({ admin: true })

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          subscription_status: 'canceled',
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(false)
    })
  })

  describe('UI Status Messages with Overrides', () => {
    it('should show trial active message with 7 days override', () => {
      const adminUser = createMockUser({ admin: true })
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: nextWeek.toISOString(),
        }),
      )

      const status = getSubscriptionStatusMessage(adminUser)
      expect(status.message).toContain('7 days remaining')
      expect(status.variant).toBe('default')
      expect(status.showManageLink).toBe(true)
    })

    it('should show warning message with 1 day left override', () => {
      const adminUser = createMockUser({ admin: true })
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: tomorrow.toISOString(),
        }),
      )

      const status = getSubscriptionStatusMessage(adminUser)
      expect(status.message).toContain('1 day remaining')
      expect(status.variant).toBe('warning')
      expect(status.showManageLink).toBe(true)
    })

    it('should show active subscription message with override', () => {
      const adminUser = createMockUser({ admin: true })
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'active',
          subscription_current_period_end_test: nextMonth.toISOString(),
        }),
      )

      const status = getSubscriptionStatusMessage(adminUser)
      expect(status.message).toContain('Subscribed')
      expect(status.variant).toBe('default')
      expect(status.showManageLink).toBe(true)
    })

    it('should show past due message with override', () => {
      const adminUser = createMockUser({ admin: true })

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'past_due',
        }),
      )

      const status = getSubscriptionStatusMessage(adminUser)
      expect(status.message).toContain('Payment failed')
      expect(status.variant).toBe('destructive')
      expect(status.showManageLink).toBe(true)
    })

    it('should show admin message when no override active', () => {
      const adminUser = createMockUser({ admin: true })

      // No override set
      const status = getSubscriptionStatusMessage(adminUser)
      expect(status.message).toContain('Admin Access')
      expect(status.variant).toBe('default')
      expect(status.showManageLink).toBe(false)
    })
  })

  describe('Override Persistence Across Navigation', () => {
    it('should persist override after multiple function calls', () => {
      const adminUser = createMockUser({ admin: true })
      const override = {
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'trialing' as const,
        trial_end_test: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify(override),
      )

      // Call multiple times (simulating navigation)
      const result1 = hasSubscriptionAccessFallback(adminUser)
      const result2 = getDaysLeftInTrial(adminUser)
      const result3 = getSubscriptionStatusMessage(adminUser)
      const result4 = getEffectiveUser(adminUser)

      // Override should persist
      expect(result1).toBe(true)
      expect(result2).toBe(5)
      expect(result3.message).toContain('5 days remaining')
      expect(result4?.subscription_status).toBe('trialing')
    })

    it('should clear override when localStorage item removed', () => {
      const adminUser = createMockUser({ admin: true })

      // Set override
      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({ subscription_status: 'trialing' }),
      )

      expect(getEffectiveUser(adminUser)?.subscription_status).toBe('trialing')

      // Remove override
      localStorage.removeItem('subscription_debug_override')

      // Should revert to original (null)
      expect(getEffectiveUser(adminUser)?.subscription_status).toBe(null)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON in localStorage gracefully', () => {
      const adminUser = createMockUser({ admin: true })

      // Set invalid JSON
      localStorage.setItem('subscription_debug_override', 'invalid-json{')

      // Should not crash and return original user
      const effectiveUser = getEffectiveUser(adminUser)
      expect(effectiveUser).toEqual(adminUser)
    })

    it('should handle null user input', () => {
      expect(hasSubscriptionAccessFallback(null)).toBe(false)
      expect(getDaysLeftInTrial(null)).toBe(0)
      expect(getTrialEndDate(null)).toBe(null)
      expect(isAdmin(null)).toBe(false)
      expect(getEffectiveUser(null)).toBe(null)
    })
  })

  describe('Real-World Debug Scenarios', () => {
    it('should simulate "Trial - 7 days left" state', () => {
      const adminUser = createMockUser({ admin: true })
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: sevenDaysFromNow.toISOString(),
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(true)
      expect(getDaysLeftInTrial(adminUser)).toBe(7)
      expect(getSubscriptionStatusMessage(adminUser).message).toContain(
        '7 days',
      )
    })

    it('should simulate "Trial Expired" state', () => {
      const adminUser = createMockUser({ admin: true })
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'trialing',
          trial_end_test: oneDayAgo.toISOString(),
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(false)
      expect(getDaysLeftInTrial(adminUser)).toBe(0)
    })

    it('should simulate "Active Subscriber" state', () => {
      const adminUser = createMockUser({ admin: true })
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'active',
          subscription_current_period_end_test: nextMonth.toISOString(),
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(true)
      expect(getSubscriptionStatusMessage(adminUser).message).toContain(
        'Subscribed',
      )
    })

    it('should simulate "Past Due" state', () => {
      const adminUser = createMockUser({ admin: true })

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: 'sub_test123',
          subscription_status: 'past_due',
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(false)
      expect(getSubscriptionStatusMessage(adminUser).variant).toBe(
        'destructive',
      )
    })

    it('should simulate "No Subscription" state', () => {
      const adminUser = createMockUser({ admin: true })

      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          subscription_status: null,
        }),
      )

      expect(hasSubscriptionAccessFallback(adminUser)).toBe(false)
    })
  })
})
