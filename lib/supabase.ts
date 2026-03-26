import type { Database } from '@/types/supabase.public.types'
import { createClient } from '@supabase/supabase-js'

export const sb = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
