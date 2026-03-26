import { useAuth } from '@/context/auth-provider'
import { sbc } from '@/lib/supabase.client'
import { getEffectiveUser } from '@/lib/subscription'
import type { Database } from '@/types/supabase.public.types'
import { useQuery } from '@tanstack/react-query'

async function fetchUser(
  userId: string,
): Promise<Database['public']['Tables']['users']['Row'] | null> {
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

export function useUser() {
  const { user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => (user ? fetchUser(user.id) : null),
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
