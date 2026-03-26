'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AccountSettingsTab } from './settings/AccountSettingsTab'
import { BillingTab } from './settings/BillingTab'
import { EmailsTab } from './settings/EmailsTab'

export function UserAvatar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const { data: userData } = useUser()

  // Listen for custom event to open billing tab
  useEffect(() => {
    const handleOpenSettings = (e: CustomEvent) => {
      const tab = e.detail?.tab || 'account'
      setActiveTab(tab)
      setOpen(true)
    }

    window.addEventListener(
      'openUserSettings',
      handleOpenSettings as EventListener,
    )
    return () => {
      window.removeEventListener(
        'openUserSettings',
        handleOpenSettings as EventListener,
      )
    }
  }, [])

  // Get user initials from email
  const getUserInitials = () => {
    if (!user?.email) return '?'

    const [name] = user.email.split('@')
    const initials = name
      .split(/[^a-zA-Z0-9]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

    return initials || user.email[0].toUpperCase()
  }

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  const handleManageBilling = () => {
    // Open Stripe customer portal in new tab
    const portalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL
    if (portalUrl) {
      window.open(portalUrl, '_blank')
    } else {
      toast({
        title: 'Error',
        description: 'Billing portal not configured',
        variant: 'destructive',
      })
    }
  }

  const handleAccountUpdateSuccess = () => {
    toast({
      title: 'Account updated',
      description: 'Your account settings have been saved',
    })
    setOpen(false)
  }

  // If not authenticated, don't show the avatar
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => {
          setActiveTab('account')
          setOpen(true)
        }}
        data-user-avatar-trigger
      >
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user?.user_metadata?.avatar_url}
            alt="User avatar"
          />
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">User Settings</DialogTitle>
        <DialogContent className="sm:max-w-[500px] max-w-[calc(100vw-2rem)]">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 my-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              {userData && (
                <AccountSettingsTab
                  userId={user.id}
                  initialValues={{
                    email: userData.email || '',
                    address: userData.address || '',
                    coordinates: {
                      lat: userData.address_lat || 43.6532,
                      lng: userData.address_lng || -79.3832,
                    },
                  }}
                  onSuccess={handleAccountUpdateSuccess}
                  onSignOut={handleSignOut}
                />
              )}
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              {userData && (
                <EmailsTab
                  userId={user.id}
                  initialValues={{
                    categories: userData.subscribed_categories || [],
                    dailyEmailEnabled: userData.daily_email_enabled ?? true,
                    costRange: [
                      userData.cost_min || 1000,
                      userData.cost_max || 5000000,
                    ],
                  }}
                  onSuccess={handleAccountUpdateSuccess}
                />
              )}
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <BillingTab
                userData={userData || null}
                onManageBilling={handleManageBilling}
              />
            </TabsContent>
          </Tabs>

          {/* Help Contact */}
          <div className="border-t pt-4 text-center text-sm text-muted-foreground">
            Need help?{' '}
            <a
              href="mailto:gary@416permits.com"
              target="_blank"
              className="text-primary hover:underline"
              rel="noopener"
            >
              gary@416permits.com
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
