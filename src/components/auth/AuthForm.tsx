'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { sbc } from '@/lib/supabase.client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type AuthFormProps = {
  mode?: 'inline' | 'standalone'
  defaultTab?: 'login' | 'signup'
}

export function AuthForm({
  mode = 'standalone',
  defaultTab = 'login',
}: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Error handling helper function
  const handleAuthError = (
    error: { message?: string; code?: string },
    authMode: 'login' | 'signup' = activeTab,
  ) => {
    const errorMessage = error.message
    const errorCode = error.code

    // Check if email is not confirmed - redirect instead of showing toast
    if (errorCode === 'email_not_confirmed') {
      router.push('/verify-email')
      return
    }

    const errorMessages = {
      user_already_exists: {
        title: 'Account Exists',
        message: 'An account with this email already exists',
      },
      email_exists: {
        title: 'Account Exists',
        message: 'An account with this email already exists',
      },
      weak_password: {
        title: 'Password Too Weak',
        message: 'Password does not meet security requirements',
      },
      invalid_credentials: {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect',
      },
    }

    let toastContent = {
      title: authMode === 'login' ? 'Login Failed' : 'Sign Up Failed',
      message:
        errorMessage ||
        (authMode === 'login'
          ? 'Invalid login credentials'
          : 'Failed to create account'),
    }

    if (errorMessages[errorCode as keyof typeof errorMessages]) {
      toastContent = errorMessages[errorCode as keyof typeof errorMessages]
    } else if (
      errorMessage?.includes('already registered') ||
      errorMessage?.includes('already exists')
    ) {
      toastContent = errorMessages.user_already_exists
    } else if (errorMessage?.toLowerCase().includes('password')) {
      toastContent = {
        title: 'Password Error',
        message: 'Password does not meet requirements',
      }
    }

    toast({
      title: toastContent.title,
      description: toastContent.message,
      variant: 'destructive',
    })
  }

  const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  })

  const signupSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onLogin(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    try {
      const { data, error } = await sbc.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        handleAuthError(error, 'login')
        return
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        router.push('/verify-email')
        return
      }

      router.push('/app')
      router.refresh()
    } catch (error) {
      handleAuthError(error as { message?: string; code?: string }, 'login')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignup(values: z.infer<typeof signupSchema>) {
    setIsLoading(true)
    try {
      const { data, error } = await sbc.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        handleAuthError(error, 'signup')
        return
      }

      // If user already exists (identities.length === 0), try to sign them in
      if (data.user && data.user.identities?.length === 0) {
        const { data: signInData, error: signInError } =
          await sbc.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          })

        if (signInError) {
          handleAuthError(signInError, 'login')
          return
        }

        // Check if email is verified
        if (signInData.user && !signInData.user.email_confirmed_at) {
          router.push('/verify-email')
          return
        }

        router.push('/app')
        router.refresh()
        return
      }

      // If they have a session (instant confirmation or Google), redirect to callback
      if (data.session) {
        router.push('/auth/callback')
        router.refresh()
        return
      }

      // Otherwise, redirect to verify email page
      router.push('/verify-email')
    } catch (error) {
      handleAuthError(error as { message?: string; code?: string }, 'signup')
    } finally {
      setIsLoading(false)
    }
  }

  async function signInWithGoogle() {
    setGoogleLoading(true)
    try {
      const { error } = await sbc.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        handleAuthError(error, 'login')
      }
    } catch (error) {
      handleAuthError(error as { message?: string; code?: string }, 'login')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div
      className={
        mode === 'standalone'
          ? 'flex flex-col items-center justify-center min-h-screen'
          : ''
      }
    >
      <div
        className={
          mode === 'standalone' ? 'container max-w-md py-16 px-4' : 'w-full'
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Welcome back</h2>
              <p className="text-muted-foreground mt-1">
                Sign in to your account
              </p>
            </div>

            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="yourname@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Create your account</h2>
              <p className="text-muted-foreground mt-1">
                Start your 7-day free trial
              </p>
            </div>

            <Form {...signupForm}>
              <form
                onSubmit={signupForm.handleSubmit(onSignup)}
                className="space-y-4"
              >
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="yourname@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="flex items-center my-6">
          <Separator className="flex-1" />
          <span className="mx-4 text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <Button
          variant="outline"
          className="w-full flex gap-2 items-center"
          onClick={signInWithGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              aria-label="Google"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
          )}
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
