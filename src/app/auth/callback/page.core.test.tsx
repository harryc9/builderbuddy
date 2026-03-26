import type { Database } from '@/types/supabase.public.types'
import { render, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthCallbackPage from './page'

type UserRow = Database['public']['Tables']['users']['Row']

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock auth context
vi.mock('@/context/auth-provider', () => ({
  useAuth: vi.fn(),
}))

// Mock useUser hook
vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(),
}))

import { useAuth } from '@/context/auth-provider'
import { useUser } from '@/hooks/useUser'
import { authenticatedFetch } from '@/lib/api-client'

const mockPush = vi.fn()
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockUseUser = useUser as ReturnType<typeof vi.fn>
const mockAuthenticatedFetch = authenticatedFetch as ReturnType<typeof vi.fn>

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
  address: '123 Test St',
  address_lat: 43.65,
  address_lng: -79.38,
  address_location: null,
  subscribed_categories: ['plumbing', 'electrical'],
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

describe('Auth Callback Page - Routing Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    })
  })

  describe('New User Onboarding', () => {
    it('should redirect to /onboarding/address when no address', async () => {
      const user = createMockUser({
        address: null,
        address_lat: null,
        address_lng: null,
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/address')
      })
    })

    it('should redirect to /onboarding/categories when no categories', async () => {
      const user = createMockUser({
        subscribed_categories: null,
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/categories')
      })
    })

    it('should redirect to /onboarding/categories when categories array is empty', async () => {
      const user = createMockUser({
        subscribed_categories: [],
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/categories')
      })
    })
  })

  describe('Returning User - Active Subscription', () => {
    it('should redirect to /app when user has active subscription', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'active',
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({
          hasAccess: true,
          reason: 'Active subscription',
        }),
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app')
      })
    })

    it('should redirect to /app when user has active trial', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'trialing',
        trial_end_test: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({
          hasAccess: true,
          reason: 'Active trial',
        }),
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app')
      })
    })
  })

  describe('Returning User - Expired Subscription', () => {
    it('should redirect to /onboarding/payment when subscription expired', async () => {
      const user = createMockUser({
        stripe_customer_id_test: 'cus_test123',
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'canceled',
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({
          hasAccess: false,
          reason: 'Subscription expired or canceled',
        }),
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
      })
    })

    it('should redirect to /onboarding/payment when trial expired', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'trialing',
        trial_end_test: new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString(),
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({
          hasAccess: false,
          reason: 'Trial expired',
        }),
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
      })
    })
  })

  describe('API Error Handling', () => {
    it('should redirect to /onboarding/payment on API error', async () => {
      const user = createMockUser()

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockRejectedValue(new Error('Network error'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
      })
    })
  })

  describe('Partial Onboarding Resume', () => {
    it('should resume at correct step - address missing', async () => {
      const user = createMockUser({
        address: null,
        address_lat: null,
        address_lng: null,
        subscribed_categories: ['plumbing'],
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/address')
      })
    })

    it('should resume at correct step - categories missing', async () => {
      const user = createMockUser({
        address: '123 Test St',
        address_lat: 43.65,
        address_lng: -79.38,
        subscribed_categories: null,
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/categories')
      })
    })

    it('should check subscription when onboarding complete', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: null,
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({
          hasAccess: false,
          reason: 'No subscription',
        }),
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
          '/api/subscription/verify',
        )
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
      })

      const { container } = render(<AuthCallbackPage />)

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should show loading when user data is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: true,
      })

      const { container } = render(<AuthCallbackPage />)

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should not redirect while checking', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: true,
      })

      render(<AuthCallbackPage />)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing user data gracefully', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      // Should not crash, stays on loading screen
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle partially complete address (missing lat/lng)', async () => {
      const user = createMockUser({
        address: '123 Test St',
        address_lat: null,
        address_lng: null,
      })

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/address')
      })
    })
  })
})
