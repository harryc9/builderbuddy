'use client'

import { sbc } from '@/lib/supabase.client'
import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthContextType = AuthState & {
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    async function loadSession() {
      try {
        const { data, error } = await sbc.auth.getSession()
        if (error) throw error

        if (data.session) {
          setState({
            user: data.session.user,
            session: data.session,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          console.log('❌ No active session found')

          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('❗ Error loading auth session:', error)
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    // Initial session check
    loadSession()

    const {
      data: { subscription },
    } = sbc.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, {
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
            }
          : null,
      })

      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      })
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    console.log('🚪 Signing out user')
    try {
      setState((prev) => ({ ...prev, isLoading: true }))
      await sbc.auth.signOut()
      console.log('👋 User signed out successfully')
    } catch (error) {
      console.error('❗ Error signing out:', error)
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  async function refreshSession() {
    console.log('🔄 Refreshing session')
    try {
      setState((prev) => ({ ...prev, isLoading: true }))
      const { data, error } = await sbc.auth.getSession()
      if (error) throw error

      console.log('🔄 Session refreshed:', {
        isAuthenticated: !!data.session,
        user: data.session?.user
          ? {
              id: data.session.user.id,
              email: data.session.user.email,
            }
          : null,
      })

      setState({
        user: data.session?.user ?? null,
        session: data.session,
        isLoading: false,
        isAuthenticated: !!data.session,
      })
    } catch (error) {
      console.error('❗ Error refreshing session:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
