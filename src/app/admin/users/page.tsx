import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isSuperAdmin(user.email ?? null)) redirect('/dashboard')

  const svc = createServiceClient()
  const { data: recent } = await svc
    .from('profiles')
    .select('id, email, full_name, role, plan, anciennete_months, score_humanite, rang, onboarding_completed, created_at')
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
            Users · 50 derniers
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-4">
          <section className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.04] text-white/55 text-xs uppercase tracking-wider">
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-right p-3">Score</th>
                  <th className="text-right p-3">Mois</th>
                  <th className="text-left p-3">Rang</th>
                  <th className="text-right p-3">Inscrit</th>
                </tr>
              </thead>
              <tbody>
                {(recent ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-xs">{p.email ?? '—'}</td>
                    <td className="p-3">{p.full_name ?? '—'}</td>
                    <td className="p-3"><span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5">{p.plan ?? 'free'}</span></td>
                    <td className="p-3 text-right tabular-nums">{Number(p.score_humanite ?? 0).toFixed(1)}</td>
                    <td className="p-3 text-right tabular-nums">{p.anciennete_months ?? 0}</td>
                    <td className="p-3 text-xs">{p.rang ?? 'explorateur'}</td>
                    <td className="p-3 text-right text-xs text-white/45">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </>
  )
}
