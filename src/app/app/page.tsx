import { AuthGuard } from '@/components/auth/AuthGuard'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { PermitsTable } from '@/components/permits/PermitsTable'
import { PermitsTableFilters } from '@/components/permits/PermitsTableFilters'
import { PermitsTableFiltersWrapper } from '@/components/permits/PermitsTableFiltersWrapper'
import { UserAvatar } from '@/components/UserAvatar'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { DevToolsWrapper } from './DevToolsWrapper'

export default async function AppPage() {
  await connection()

  return (
    <AuthGuard>
      <main className="flex h-screen overflow-hidden relative">
        {/* Left Sidebar - Filters (Desktop only) */}
        <aside className="hidden lg:flex lg:flex-col w-80 border-r bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <Suspense
              fallback={
                <div className="p-4 text-sm text-muted-foreground">
                  Loading filters...
                </div>
              }
            >
              <PermitsTableFilters />
            </Suspense>
          </div>
        </aside>

        {/* Main Content Area - Results */}
        <div className="flex-1 bg-gray-50 w-full min-w-0 h-full">
          <Suspense
            fallback={
              <div className="p-4 text-sm text-muted-foreground">
                Loading permits...
              </div>
            }
          >
            <PermitsTable />
          </Suspense>
        </div>

        {/* Mobile Filter Button - Top Left */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Suspense>
            <PermitsTableFiltersWrapper />
          </Suspense>
        </div>

        {/* Notifications & User Avatar - Top Right */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <NotificationBell />
          <UserAvatar />
        </div>
      </main>
      <Suspense>
        <DevToolsWrapper />
      </Suspense>
    </AuthGuard>
  )
}
