'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Sparkles, Loader2, ExternalLink, Calendar, Copy, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice, formatRelativeDate, copyToClipboard } from '@/lib/utils'

type Group = {
  id: string
  creator_id: string
  title: string
  description: string | null
  category: string
  city: string | null
  target_count: number
  current_count: number
  unit_price_eur: number
  group_price_eur: number
  savings_percent: number
  deadline: string
  status: 'open' | 'reached' | 'expired' | 'cancelled'
  unlock_code: string | null
  partner_url: string | null
  created_at: string
}

type Membership = { id: string; joined_at: string } | null

export function GroupDetailView({
  group: initialGroup,
  userId,
  membership: initialMembership,
}: {
  group: Group
  userId: string
  membership: Membership
}) {
  const router = useRouter()
  const [group, setGroup] = useState(initialGroup)
  const [membership, setMembership] = useState(initialMembership)
  const [joining, setJoining] = useState(false)

  const isCreator = group.creator_id === userId
  const isMember = !!membership
  const reached = group.status === 'reached'
  const ratio = group.current_count / group.target_count
  const savings = Number(group.unit_price_eur) - Number(group.group_price_eur)

  async function handleJoin() {
    setJoining(true)
    try {
      const r = await fetch(`/api/groups/${group.id}/join`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      if (data.joined) {
        toast.success(data.status === 'reached' ? '🎉 Pool activé ! Tarif débloqué.' : 'Tu as rejoint le pool')
        setGroup({
          ...group,
          current_count: data.new_count,
          status: data.status,
          unlock_code: data.unlock_code,
        })
        setMembership({ id: 'tmp', joined_at: new Date().toISOString() })
        router.refresh()
      } else {
        toast('Tu participes déjà à ce pool')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setJoining(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/groupes" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Pools</span>
          </Link>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-5">
          <section className="glass rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-violet-400/15 text-violet-300 border border-violet-400/30">{group.category}</span>
              {group.city && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 text-white/55 border border-white/10">{group.city}</span>}
              {reached && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1"><Sparkles size={10} /> Activé</span>}
              {isCreator && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">Tu as créé ce pool</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{group.title}</h1>

            {group.description && <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{group.description}</p>}

            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Prix individuel</p>
                  <p className="text-lg text-white/55 line-through">{formatPrice(Number(group.unit_price_eur))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400">Prix groupé</p>
                  <p className="text-2xl font-bold text-emerald-300" style={{ fontFamily: 'var(--font-display)' }}>{formatPrice(Number(group.group_price_eur))}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/55">Économie</span>
                <span className="text-emerald-300 font-bold">−{formatPrice(savings)} (−{Number(group.savings_percent).toFixed(0)}%)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white/65"><Users size={12} /> {group.current_count} / {group.target_count} participants</span>
                <span className="text-white/40">{Math.round(ratio * 100)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${reached ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-cyan-400 to-violet-400'}`}
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-white/45 flex items-center gap-1.5">
              <Calendar size={11} /> Échéance {formatRelativeDate(group.deadline)}
            </p>
          </section>

          {/* Action */}
          {reached ? (
            <UnlockBanner code={group.unlock_code} partnerUrl={group.partner_url} />
          ) : isMember ? (
            <div className="glass rounded-2xl p-5 bg-cyan-400/5 border-cyan-400/20 flex items-center gap-3">
              <ShieldCheck size={18} className="text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-cyan-200">Tu participes au pool</p>
                <p className="text-xs text-cyan-300/70 mt-0.5">
                  Encore {group.target_count - group.current_count} participant{group.target_count - group.current_count > 1 ? 's' : ''} pour activer le tarif.
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || group.status !== 'open'}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? <Loader2 className="animate-spin" size={18} /> : <Users size={18} />}
              Rejoindre le pool · économise {formatPrice(savings)}
            </button>
          )}
        </div>
      </main>
    </>
  )
}

function UnlockBanner({ code, partnerUrl }: { code: string | null; partnerUrl: string | null }) {
  async function handleCopy() {
    if (!code) return
    if (await copyToClipboard(code)) toast.success('Code copié')
  }
  return (
    <div className="glass rounded-2xl p-5 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 border-emerald-400/30 space-y-3">
      <div className="flex items-center gap-2 text-emerald-300 font-semibold">
        <Sparkles size={18} /> Pool activé !
      </div>
      <p className="text-sm text-white/70">Utilise le code suivant pour bénéficier du tarif groupé&nbsp;:</p>
      {code && (
        <div className="bg-black/30 border border-emerald-400/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <code className="text-base font-mono font-bold text-emerald-300 tracking-wider">{code}</code>
          <button type="button" onClick={handleCopy} aria-label="Copier" className="text-emerald-400 hover:text-emerald-300 transition p-1">
            <Copy size={16} />
          </button>
        </div>
      )}
      {partnerUrl && (
        <a
          href={partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary justify-center"
        >
          <ExternalLink size={16} /> Aller chez le partenaire
        </a>
      )}
    </div>
  )
}
