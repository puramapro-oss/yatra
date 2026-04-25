import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const APP_SCHEMA = process.env.NEXT_PUBLIC_APP_SCHEMA || 'yatra'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: APP_SCHEMA as 'yatra' },
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
            // server component context — middleware refreshes session, safe to ignore
          }
        },
      },
    },
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: APP_SCHEMA as 'yatra' },
      cookies: { getAll: () => [], setAll: () => {} },
    },
  )
}
