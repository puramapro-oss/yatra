'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ExternalLink, Banknote, MapPin, Calendar, BookmarkCheck, Bookmark,
  Loader2, ShieldCheck, X, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice, formatDate } from '@/lib/utils'

type Aide = {
  id: string
  slug: string | null
  nom: string
  category: string | null
  type_aide: string | null
  region: string | null
  montant_max: number | null
  url_officielle: string | null
  source_url: string | null
  source_type: string | null
  description: string | null
  situation_eligible: string[] | null
  transport_modes_eligible: string[] | null
  age_min: number | null
  age_max: number | null
  handicap_only: boolean | null
  last_verified_at: string | null
}

type Subscription = {
  id: string
  status: 'following' | 'dismissed' | 'applied' | 'received'
  notes: string | null
  created_at: string
  updated_at: string
} | null

export function AideDetailView({ aide, subscription }: { aide: Aide; subscription: Subscription }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [currentSub, setCurrentSub] = useState<Subscription>(subscription)
  const [confirmDismiss, setConfirmDismiss] = useState(false)

  const isFollowing = currentSub?.status === 'following'
  const hasApplied = currentSub?.status === 'applied' || currentSub?.status === 'received'

  async function follow(status: 'following' | 'applied' | 'dismissed') {
    startTransition(async () => {
      try {
        const r = await fetch(`/api/aides/${aide.id}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error ?? 'Erreur')
        setCurrentSub({ ...(data.subscription as Subscription) } as Subscription)
        if (status === 'following') toast.success('Aide ajoutée à ta liste')
        if (status === 'applied') toast.success('Marquée comme demandée 👍')
        if (status === 'dismissed') toast('Aide retirée de ta liste')
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  async function unfollow() {
    startTransition(async () => {
      try {
        const r = await fetch(`/api/aides/${aide.id}/follow`, { method: 'DELETE' })
        if (!r.ok) {
          const d = await r.json().catch(() => ({}))
          throw new Error(d?.error ?? 'Erreur')
        }
        setCurrentSub(null)
        toast('Aide retirée du suivi')
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard/aides"
            aria-label="Retour aides"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Toutes les aides</span>
          </Link>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-5">
          {/* Hero */}
          <section className="glass rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {aide.category && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">{aide.category}</span>}
              {aide.type_aide && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 text-white/55 border border-white/10">{aide.type_aide}</span>}
              {aide.region && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 text-white/55 border border-white/10 flex items-center gap-1">
                  <MapPin size={10} /> {aide.region}
                </span>
              )}
              {aide.source_type === 'official' && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                  <ShieldCheck size={10} /> Source officielle
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {aide.nom}
            </h1>

            {aide.montant_max && Number(aide.montant_max) > 0 && (
              <div className="flex items-center gap-2 text-emerald-300">
                <Banknote size={20} />
                <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  jusqu&apos;à {formatPrice(Number(aide.montant_max))}
                </span>
              </div>
            )}

            {aide.description && (
              <p className="text-sm text-white/70 leading-relaxed">{aide.description}</p>
            )}
          </section>

          {/* Actions */}
          <section className="flex flex-col sm:flex-row gap-2">
            {aide.url_officielle && (
              <a
                href={aide.url_officielle}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 justify-center"
              >
                <ExternalLink size={16} /> Faire ma demande officielle
              </a>
            )}
            {!hasApplied && (
              isFollowing ? (
                <button
                  type="button"
                  onClick={unfollow}
                  disabled={pending}
                  className="px-4 py-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/10 text-emerald-300 text-sm font-semibold flex items-center gap-2 justify-center transition flex-1 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="animate-spin" size={14} /> : <BookmarkCheck size={16} />} Suivie
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => follow('following')}
                  disabled={pending}
                  className="px-4 py-3 rounded-xl border border-white/10 hover:border-emerald-400/30 hover:bg-white/3 text-white/85 text-sm font-semibold flex items-center gap-2 justify-center transition flex-1 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="animate-spin" size={14} /> : <Bookmark size={16} />} Ajouter à ma liste
                </button>
              )
            )}
          </section>

          {hasApplied ? (
            <div className="glass rounded-2xl p-5 bg-emerald-400/5 border-emerald-400/20 text-emerald-200 flex items-center gap-3">
              <Sparkles size={18} className="text-emerald-400" />
              <div className="text-sm">
                <p className="font-semibold">Marquée comme demandée</p>
                <p className="text-xs text-emerald-300/70 mt-0.5">
                  On t&apos;envoie une notif si l&apos;aide évolue.
                </p>
              </div>
            </div>
          ) : (
            isFollowing && (
              <div className="glass rounded-2xl p-4 flex items-center gap-2 justify-between">
                <span className="text-sm text-white/60">Tu l&apos;as déjà demandée&nbsp;?</span>
                <button
                  type="button"
                  onClick={() => follow('applied')}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 text-xs font-semibold hover:bg-emerald-400/20 transition disabled:opacity-60"
                >
                  Oui, marquer demandée
                </button>
              </div>
            )
          )}

          {/* Métadonnées */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              Pour qui&nbsp;?
            </h2>
            {aide.situation_eligible && aide.situation_eligible.length > 0 && (
              <Group label="Situations éligibles">
                {aide.situation_eligible.map((s) => (
                  <Tag key={s}>{s.replace(/_/g, ' ')}</Tag>
                ))}
              </Group>
            )}
            {aide.transport_modes_eligible && aide.transport_modes_eligible.length > 0 && (
              <Group label="Modes de transport">
                {aide.transport_modes_eligible.map((m) => (
                  <Tag key={m}>{m.replace(/_/g, ' ')}</Tag>
                ))}
              </Group>
            )}
            {(aide.age_min || aide.age_max) && (
              <Group label="Âge">
                <Tag>
                  {aide.age_min ?? '—'} – {aide.age_max ?? '—'} ans
                </Tag>
              </Group>
            )}
            {aide.handicap_only && (
              <p className="text-xs text-rose-300 flex items-center gap-1.5">
                <ShieldCheck size={12} /> Réservée aux personnes en situation de handicap (CMI/AAH)
              </p>
            )}
          </section>

          {/* Source / vérification */}
          <section className="glass rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              Source
            </h2>
            {aide.source_url && (
              <a
                href={aide.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-300 hover:underline break-all flex items-center gap-1"
              >
                <ExternalLink size={11} /> {aide.source_url}
              </a>
            )}
            {aide.last_verified_at && (
              <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                <Calendar size={11} /> Vérifiée le {formatDate(aide.last_verified_at)}
              </p>
            )}
          </section>

          {!hasApplied && currentSub?.status !== 'dismissed' && (
            <button
              type="button"
              onClick={() => setConfirmDismiss(true)}
              className="w-full text-xs text-white/40 hover:text-white/65 py-3 transition"
            >
              Cette aide ne me concerne pas
            </button>
          )}

          {confirmDismiss && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDismiss(false)}>
              <div
                className="glass rounded-2xl p-5 max-w-sm w-full space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">Retirer cette aide&nbsp;?</h3>
                  <button onClick={() => setConfirmDismiss(false)} aria-label="Fermer" className="text-white/40 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-white/60">
                  Elle ne sera plus suggérée. Tu pourras toujours la retrouver via la liste complète.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmDismiss(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDismiss(false)
                      follow('dismissed')
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-400/15 text-rose-300 border border-rose-400/30 text-xs font-semibold"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/65 border border-white/10">
      {children}
    </span>
  )
}
