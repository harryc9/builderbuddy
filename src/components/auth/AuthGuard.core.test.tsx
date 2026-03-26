import type { Database } from '@/types/supabase.public.types'
import { render, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGuard } from './AuthGuard'

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

// Mock user fixture
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

describe('AuthGuard - Redirect Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    })
  })

  describe('Not Authenticated', () => {
    it('should redirect to / when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should redirect to custom redirectTo path', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
      })

      render(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Email Not Verified', () => {
    it('should redirect to /verify-email when email not confirmed', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: null },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: createMockUser(),
        isLoading: false,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify-email')
      })
    })
  })

  describe('Incomplete Onboarding', () => {
    it('should redirect to /onboarding/address when no address', async () => {
      const user = createMockUser({
        address: null,
        address_lat: null,
        address_lng: null,
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'trialing',
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      // Mock API response - no access due to incomplete onboarding
      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({ hasAccess: false }),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/address')
      })
    })

    it('should redirect to /onboarding/categories when no categories', async () => {
      const user = createMockUser({
        subscribed_categories: null,
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'trialing',
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({ hasAccess: false }),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/categories')
      })
    })

    it('should redirect to /onboarding/payment when no subscription', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: null,
        subscription_status: null,
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({ hasAccess: false }),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
      })
    })
  })

  describe('Active Subscription', () => {
    it('should allow access with active subscription', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'active',
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({ hasAccess: true }),
      })

      const { getByText } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('should allow access with active trial', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'trialing',
        trial_end_test: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({ hasAccess: true }),
      })

      const { getByText } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('API Fallback', () => {
    it('should fall back to database check when API fails', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'active',
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      // API fails
      mockAuthenticatedFetch.mockRejectedValue(new Error('Network error'))

      const { getByText } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      // Should fall back to database check and allow access
      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should redirect when API fails and database check denies access', async () => {
      const user = createMockUser({
        stripe_subscription_id_test: null,
        subscription_status: null,
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockRejectedValue(new Error('Network error'))

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
      })
    })
  })

  describe('Debug Override', () => {
    it('should use debug override when set', async () => {
      const user = createMockUser({
        admin: true, // Must be admin to use debug override
        stripe_subscription_id_test: 'sub_test123',
        subscription_status: 'active',
      })

      // Set debug override to deny access
      localStorage.setItem(
        'subscription_debug_override',
        JSON.stringify({
          stripe_subscription_id_test: null,
          subscription_status: 'canceled',
        }),
      )

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: user,
        isLoading: false,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        // Should redirect based on override, not API
        expect(mockPush).toHaveBeenCalledWith('/onboarding/payment')
        // API should not be called when debug override is active
        expect(mockAuthenticatedFetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('No Subscription Required', () => {
    it('should allow access when requireSubscription is false', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: createMockUser({ subscription_status: null }),
        isLoading: false,
      })

      const { getByText } = render(
        <AuthGuard requireSubscription={false}>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
      })

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      // Should show loader
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should show loading when user data is loading', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: true,
      })

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Admin Access', () => {
    it('should allow admin access without subscription check', async () => {
      const adminUser = createMockUser({
        admin: true,
        stripe_subscription_id_test: null,
        subscription_status: null,
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email_confirmed_at: new Date().toISOString() },
        isAuthenticated: true,
        isLoading: false,
      })
      mockUseUser.mockReturnValue({
        data: adminUser,
        isLoading: false,
      })

      mockAuthenticatedFetch.mockResolvedValue({
        json: async () => ({ hasAccess: true, reason: 'Admin user' }),
      })

      const { getByText } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
      })
    })
  })
})
