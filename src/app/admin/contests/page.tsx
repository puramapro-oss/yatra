import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { AdminContestsView } from './AdminContestsView'

export const dynamic = 'force-dynamic'

export default async function AdminContestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isSuperAdmin(user.email ?? null)) redirect('/dashboard')

  const svc = createServiceClient()
  const { data: results } = await svc
    .from('contests_results')
    .select('id, type, period_start, period_end, total_pool_eur, total_distributed_eur, winners, status, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-white/60 hover:text-white text-sm flex items-center gap-1.5">
            <ArrowLeft size={16} /> Admin
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Concours · Audit & Trigger
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-4">
          <AdminContestsView results={results ?? []} />
        </div>
      </main>
    </>
  )
}
