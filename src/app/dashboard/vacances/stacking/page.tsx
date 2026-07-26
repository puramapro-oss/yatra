import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StackingView } from './StackingView'

export const dynamic = 'force-dynamic'

export default async function StackingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <StackingView />
}
