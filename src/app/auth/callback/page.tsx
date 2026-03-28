'use client'

/**
 * OAuth callback page. The Supabase browser client auto-detects
 * tokens from the URL hash fragment via onAuthStateChange.
 * This page just waits for authentication, then redirects.
 */
import { useAuth } from '@/context/auth-provider'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      router.replace('/dashboard')
    } else {
      router.replace('/auth?error=auth_callback_failed')
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
