import { useAuth } from '@/context/auth-provider'
import { sbc } from '@/lib/supabase.client'
import { getEffectiveUser } from '@/lib/subscription'
import { useQuery } from '@tanstack/react-query'

type UserProfile = {
  id: string
  email: string
  address: string | null
  address_lat: number | null
  address_lng: number | null
  subscribed_job_roles: string[] | null
  subscribed_categories: string[] | null
  min_project_cost: number | null
  only_with_builder: boolean | null
  only_with_cost: boolean | null
}

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  console.log('🔍 Fetching user profile for:', userId)
  const { data, error } = await sbc
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('❌ Error fetching user profile:', error)
    return null
  }

  console.log('✅ User profile loaded:', {
    email: data.email,
    address: data.address,
    lat: data.address_lat,
    lng: data.address_lng,
  })

  // Apply debug override if exists (for testing)
  const effectiveUser = getEffectiveUser(data)
  return effectiveUser
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => (user ? fetchUserProfile(user.id) : null),
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
