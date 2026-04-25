import { createBrowserClient } from '@supabase/ssr'

const APP_SCHEMA = process.env.NEXT_PUBLIC_APP_SCHEMA || 'yatra'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: APP_SCHEMA as 'yatra' } },
  )
}
