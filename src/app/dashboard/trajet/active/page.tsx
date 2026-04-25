import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ActiveTracker } from './ActiveTracker'

export const dynamic = 'force-dynamic'

export default async function ActiveTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <Suspense fallback={null}>
      <ActiveTracker />
    </Suspense>
  )
}
