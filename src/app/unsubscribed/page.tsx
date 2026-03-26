import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sb } from '@lib/supabase'
import { CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ user_id?: string; type?: string }>
}

export default async function UnsubscribedPage({ searchParams }: Props) {
  const { user_id, type } = await searchParams

  let success = false
  let message = "You've been unsubscribed successfully."

  // If user_id is provided, perform the unsubscribe
  if (user_id && type === 'daily') {
    const { data, error } = await sb
      .from('users')
      .update({
        daily_email_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)
      .select()

    if (error) {
      success = false
      message = 'Failed to unsubscribe. Please try again or contact support.'
    } else if (data && data.length > 0) {
      success = true
      message = "You've been unsubscribed from daily permit digest emails."
    } else {
      success = false
      message = 'User not found. You may already be unsubscribed.'
    }
  } else if (type === 'daily') {
    success = true
    message = "You've been unsubscribed from daily permit digest emails."
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              success ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {success ? 'Unsubscribed Successfully' : 'Unsubscribe Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">{message}</p>
          {success && (
            <p className="text-center text-sm text-gray-500">
              You can re-enable email notifications anytime from your account
              settings.
            </p>
          )}
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/app">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
