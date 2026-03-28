'use client'

/**
 * Dashboard placeholder — shows authenticated user info and sign out.
 */
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/icons/logo'
import { useAuth } from '@/context/auth-provider'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  if (isLoading) return null

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      <nav className="bg-[#fafafa]/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-5 w-auto text-primary" />
            <span className="font-semibold text-lg text-gray-900 tracking-tight">
              Grout
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-900"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-24">
        <h1 className="font-serif font-semibold text-3xl text-gray-900">
          Welcome{user?.email ? `, ${user.email}` : ''}
        </h1>
        <p className="text-gray-400 mt-2">
          Your dashboard is being built. Check back soon.
        </p>
      </main>
    </div>
  )
}
