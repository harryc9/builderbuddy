/**
 * Server-side Supabase client using service role key.
 * Import as: import { sb } from '@lib/supabase'
 */
import { createClient } from '@supabase/supabase-js'

export const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
