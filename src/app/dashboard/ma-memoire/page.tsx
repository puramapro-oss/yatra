import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import MaMemoirePage from '@/lib/legal/components/MaMemoirePage'
import type { LegalAcceptanceRow } from '@/lib/legal/components/MaMemoirePage'

export const dynamic = 'force-dynamic'

export default async function DashboardMaMemoirePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/ma-memoire')

  const [{ data: acceptations }, { data: deletionRequest }] = await Promise.all([
    supabase
      .from('legal_acceptances')
      .select('doc_type, version, accepted_at')
      .eq('user_id', user.id),
    supabase
      .from('account_deletion_requests')
      .select('scheduled_for, status')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .maybeSingle(),
  ])

  const acceptationsRows: LegalAcceptanceRow[] = (acceptations ?? []).map((a) => ({
    docType: a.doc_type,
    version: a.version,
    acceptedAt: a.accepted_at,
  }))

  return (
    <main className="min-h-dvh max-w-2xl mx-auto px-6 py-8">
      <Link href="/dashboard/profile" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-4">
        <ArrowLeft size={16} /> Mon profil
      </Link>
      <MaMemoirePage
        appName="YATRA"
        acceptations={acceptationsRows}
        deletionScheduledFor={deletionRequest?.scheduled_for ?? null}
      />
    </main>
  )
}
