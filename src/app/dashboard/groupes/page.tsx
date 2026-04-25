import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice, formatRelativeDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function GroupesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: groups } = await supabase
    .from('group_purchases')
    .select('id, creator_id, title, description, category, city, target_count, current_count, unit_price_eur, group_price_eur, savings_percent, deadline, status, created_at')
    .in('status', ['open', 'reached'])
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: memberships } = await supabase
    .from('group_purchase_members')
    .select('group_id')
    .eq('user_id', user.id)
  const joinedSet = new Set((memberships ?? []).map((m) => m.group_id))

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Achats groupés
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300">
              <Users size={18} />
              <span className="text-xs uppercase tracking-wider">Plus on est nombreux, plus c&apos;est moins cher</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {(groups ?? []).filter((g) => g.status === 'open').length} pool{(groups ?? []).length > 1 ? 's' : ''} ouvert{(groups ?? []).length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-white/55 leading-relaxed">
              Rejoins un achat groupé pour débloquer un tarif réduit avec d&apos;autres voyageurs propres.
            </p>
          </section>

          {(groups ?? []).length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center space-y-3">
              <p className="text-4xl">🤝</p>
              <p className="text-white/65 text-sm">Aucun pool actif pour l&apos;instant.</p>
              <p className="text-white/40 text-xs">Sois le premier à en créer un&nbsp;: cours yoga groupé, abonnement transport partagé…</p>
            </div>
          ) : (
            <section className="grid sm:grid-cols-2 gap-3">
              {(groups ?? []).map((g) => {
                const joined = joinedSet.has(g.id)
                const reached = g.status === 'reached'
                const ratio = Number(g.current_count) / Number(g.target_count)
                return (
                  <Link
                    key={g.id}
                    href={`/dashboard/groupes/${g.id}`}
                    className={`glass rounded-2xl p-4 space-y-3 hover:border-emerald-400/30 transition ${reached ? 'border-emerald-400/30 bg-emerald-400/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-400/15 text-violet-300 border border-violet-400/30">
                            {g.category}
                          </span>
                          {reached && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                              <Sparkles size={9} /> Activé
                            </span>
                          )}
                          {joined && !reached && (
                            <span className="text-[9px] uppercase tracking-wider text-cyan-300">Tu participes</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mt-1.5 leading-tight line-clamp-2">{g.title}</h3>
                      </div>
                      <span className="text-xs text-emerald-300 font-bold">−{Number(g.savings_percent).toFixed(0)}%</span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-white/55">
                        <span>{g.current_count} / {g.target_count} participants</span>
                        <span>{Math.round(ratio * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${reached ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-cyan-400 to-violet-400'}`}
                          style={{ width: `${Math.min(100, ratio * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 line-through">{formatPrice(Number(g.unit_price_eur))}</span>
                      <span className="text-emerald-300 font-bold">→ {formatPrice(Number(g.group_price_eur))}</span>
                    </div>

                    <p className="text-[10px] text-white/35">
                      Échéance {formatRelativeDate(g.deadline)}
                      {g.city ? ` · ${g.city}` : ''}
                    </p>
                  </Link>
                )
              })}
            </section>
          )}

          <div className="text-center pt-2">
            <Link
              href="/dashboard/groupes/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400/30 hover:bg-emerald-400/5 text-emerald-300 text-sm font-semibold transition"
            >
              <Plus size={16} /> Créer un pool
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
