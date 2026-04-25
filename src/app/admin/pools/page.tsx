import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin, formatPrice } from '@/lib/utils'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

export const dynamic = 'force-dynamic'

export default async function AdminPoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isSuperAdmin(user.email ?? null)) redirect('/dashboard')

  const svc = createServiceClient()
  const [{ data: pools }, { data: lastTx }] = await Promise.all([
    svc.from('pool_balances').select('id, pool_type, balance_eur, total_in_eur, total_out_eur, last_in_at, last_out_at, updated_at').order('pool_type'),
    svc.from('pool_transactions').select('id, pool_id, amount_eur, direction, reason, created_at').order('created_at', { ascending: false }).limit(30),
  ])

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-white/60 hover:text-white text-sm flex items-center gap-1.5">
            <ArrowLeft size={16} /> Admin
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Pools & Ledger
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-4">
          <section className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.04] text-white/55 text-xs uppercase tracking-wider">
                  <th className="text-left p-3">Pool</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-right p-3">Total IN</th>
                  <th className="text-right p-3">Total OUT</th>
                  <th className="text-right p-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(pools ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="p-3">{p.pool_type}</td>
                    <td className="p-3 text-right tabular-nums font-bold">{formatPrice(Number(p.balance_eur))}</td>
                    <td className="p-3 text-right tabular-nums text-emerald-300">{formatPrice(Number(p.total_in_eur))}</td>
                    <td className="p-3 text-right tabular-nums text-red-300">{formatPrice(Number(p.total_out_eur))}</td>
                    <td className="p-3 text-right text-xs text-white/45">{new Date(p.updated_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="glass rounded-2xl overflow-hidden">
            <h2 className="text-sm font-semibold p-4 border-b border-white/5" style={{ fontFamily: 'var(--font-display)' }}>30 dernières transactions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.04] text-white/55 text-xs uppercase tracking-wider">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Pool</th>
                  <th className="text-left p-3">Direction</th>
                  <th className="text-right p-3">Montant</th>
                  <th className="text-left p-3">Raison</th>
                </tr>
              </thead>
              <tbody>
                {(lastTx ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-white/45 text-sm">Aucune transaction.</td></tr>
                ) : (
                  (lastTx ?? []).map((t) => (
                    <tr key={t.id} className="border-t border-white/5">
                      <td className="p-3 text-xs text-white/55">{new Date(t.created_at).toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-xs font-mono">{t.pool_id.slice(0, 8)}</td>
                      <td className="p-3"><span className={t.direction === 'in' ? 'text-emerald-300' : 'text-red-300'}>{t.direction.toUpperCase()}</span></td>
                      <td className="p-3 text-right tabular-nums">{formatPrice(Number(t.amount_eur))}</td>
                      <td className="p-3 text-xs">{t.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </>
  )
}
