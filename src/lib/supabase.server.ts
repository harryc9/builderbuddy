/**
 * Server-side Supabase client using @supabase/ssr for cookie-based auth.
 * Used only for OAuth callback code exchange and middleware session checks.
 * All other server-side auth uses Bearer tokens via api-auth.ts.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from Server Component — ignore.
          }
        },
      },
    },
  )
}
