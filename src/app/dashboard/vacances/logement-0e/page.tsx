import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogementZeroView } from './LogementZeroView'

export const dynamic = 'force-dynamic'

export default async function LogementZeroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <LogementZeroView />
}
