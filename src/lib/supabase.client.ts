/**
 * Browser-side Supabase client using anon key.
 * Import as: import { sbc } from '@/lib/supabase.client'
 */
import { createClient } from '@supabase/supabase-js'

export const sbc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
