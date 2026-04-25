'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { ARIA_MODES, ARIA_MODE_META, type AriaMode } from '@/lib/aria'

const MODE_LABEL: Record<string, string> = {
  coach_trajet: ARIA_MODE_META.coach_trajet.label,
  meditation: ARIA_MODE_META.meditation.label,
  journal: ARIA_MODE_META.journal.label,
  cri_du_coeur: ARIA_MODE_META.cri_du_coeur.label,
  boussole: ARIA_MODE_META.boussole.label,
  gratitude: ARIA_MODE_META.gratitude.label,
  question_profonde: ARIA_MODE_META.question_profonde.label,
}

const SENTIMENT_EMOJI: Record<string, string> = {
  apaise: '🍃',
  energise: '⚡',
  inspire: '✨',
  doute: '🌀',
  libere: '🦋',
  neutre: '·',
}

type Props = {
  firstName: string | null
  dailyQuestion: { id: string; slug: string; text: string; category: string } | null
  lastConversation: {
    id: string
    mode: string
    title: string | null
    started_at: string
    ended_at: string | null
    sentiment: string | null
    summary: string | null
  } | null
  state: {
    daily_streak: number
    total_conversations: number
    current_mood: string | null
    current_intention: string | null
  } | null
}

export function AriaHubView({ firstName, dailyQuestion, lastConversation, state }: Props) {
  const router = useRouter()
  const [openingMode, setOpeningMode] = useState<AriaMode | null>(null)

  async function startMode(mode: AriaMode) {
    if (openingMode) return
    setOpeningMode(mode)
    try {
      const r = await fetch('/api/aria/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = await r.json()
      if (!r.ok || !data.conversation?.id) throw new Error(data?.error ?? 'Impossible de démarrer')
      router.push(`/dashboard/aria/conversation/${data.conversation.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setOpeningMode(null)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Aria · ta présence YATRA
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* Hero salutation + streak */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-violet-500/10 to-emerald-500/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center text-2xl">
                ✨
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-white/45">Aria</p>
                <h2 className="text-xl font-bold mt-0.5 gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                  {firstName ? `Bonjour ${firstName}.` : 'Bonjour.'}
                </h2>
                <p className="text-sm text-white/70 mt-2">
                  Je suis là quand tu veux. Choisis un mode, ou commence simplement par la question du jour.
                </p>
                {state && state.daily_streak > 1 && (
                  <p className="text-xs text-violet-200 mt-3">
                    {state.daily_streak} jours d&apos;affilée que tu reviens · {state.total_conversations} conversations partagées
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Question du jour */}
          {dailyQuestion && (
            <section className="glass rounded-3xl p-6 border-violet-400/20">
              <p className="text-xs uppercase tracking-wider text-violet-300 mb-2">Question du jour</p>
              <p className="text-lg leading-snug text-white/90" style={{ fontFamily: 'var(--font-display)' }}>
                {dailyQuestion.text}
              </p>
              <button
                onClick={() => startMode('question_profonde')}
                disabled={openingMode === 'question_profonde'}
                className="mt-4 btn-primary disabled:opacity-50 disabled:cursor-wait"
              >
                {openingMode === 'question_profonde' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Y répondre avec Aria
              </button>
            </section>
          )}

          {/* 7 modes */}
          <section>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3 ml-1">Modes</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ARIA_MODES.map((mode) => {
                const meta = ARIA_MODE_META[mode]
                const loading = openingMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => startMode(mode)}
                    disabled={!!openingMode}
                    className="glass rounded-2xl p-4 text-left flex items-start gap-3 hover:border-violet-400/30 transition disabled:opacity-60 disabled:cursor-wait"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-2xl shrink-0">
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {meta.label}
                      </h3>
                      <p className="text-xs text-white/55 mt-0.5 leading-snug">{meta.tagline}</p>
                    </div>
                    {loading && <Loader2 size={16} className="animate-spin text-violet-300 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Dernière conversation */}
          {lastConversation && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs uppercase tracking-wider text-white/40">Dernière conversation</p>
              <Link
                href={`/dashboard/aria/conversation/${lastConversation.id}`}
                className="flex items-start gap-3 hover:opacity-90 transition"
              >
                <div className="text-2xl">{ARIA_MODE_META[lastConversation.mode as AriaMode]?.emoji ?? '✨'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {lastConversation.title ?? MODE_LABEL[lastConversation.mode] ?? 'Aria'}
                  </p>
                  <p className="text-xs text-white/55 mt-0.5">
                    {new Date(lastConversation.started_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                    {lastConversation.sentiment && (
                      <>
                        {' · '}
                        {SENTIMENT_EMOJI[lastConversation.sentiment] ?? '·'} {lastConversation.sentiment}
                      </>
                    )}
                  </p>
                  {lastConversation.summary && (
                    <p className="text-sm text-white/65 mt-1 line-clamp-2 italic">"{lastConversation.summary}"</p>
                  )}
                </div>
              </Link>
            </section>
          )}

          <p className="text-xs text-white/40 text-center">
            Aria ne remplace ni un thérapeute ni un professionnel. Si tu vis une détresse vitale, le 3114 est gratuit, anonyme et 24/7.
          </p>
        </div>
      </main>
    </>
  )
}
