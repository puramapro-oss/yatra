'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Plane, Home, UtensilsCrossed, Ticket } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

const ENVIES = [
  { id: 'ville', label: '🏙️ Citytrip' },
  { id: 'plage', label: '🏖️ Plage' },
  { id: 'montagne', label: '⛰️ Montagne' },
  { id: 'culture', label: '🎭 Culture' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'soleil', label: '☀️ Soleil' },
  { id: 'fete', label: '🎉 Fête' },
  { id: 'histoire', label: '🏛️ Histoire' },
  { id: 'depaysement', label: '🧭 Dépaysement' },
]

type BudgetLine = { label: string; min: number; max: number }
type Proposition = {
  destination: string
  pays: string
  totalMin: number
  totalMax: number
  budgetRespecte: boolean
  ecartBudgetEur: number
  breakdown: BudgetLine[]
  tagsMatch: string[]
  description: string | null
  liens: { transport: string; logement: string; activites: string }
}

export function BudgetView() {
  const searchParams = useSearchParams()

  // Préremplir depuis query params (routeur NLU) ou défauts
  const [budget, setBudget] = useState(() => {
    const budgetParam = searchParams?.get('budget')
    if (budgetParam && !Number.isNaN(Number(budgetParam))) {
      return budgetParam
    }
    return '600'
  })

  const [jours, setJours] = useState(() => {
    const joursParam = searchParams?.get('jours')
    if (joursParam && !Number.isNaN(Number(joursParam))) {
      return joursParam
    }
    return '5'
  })

  const [depart, setDepart] = useState('Paris')
  const [avecQui, setAvecQui] = useState('')
  const [envies, setEnvies] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propositions, setPropositions] = useState<Proposition[] | null>(null)

  function toggleEnvie(id: string) {
    setEnvies((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const budgetNum = Number(budget)
    const joursNum = Number(jours)
    if (!budget || Number.isNaN(budgetNum) || budgetNum < 50) {
      setError('Indique un budget réaliste (minimum 50€).')
      return
    }
    if (!jours || Number.isNaN(joursNum) || joursNum < 1) {
      setError('Indique un nombre de jours valide.')
      return
    }
    setLoading(true)
    setPropositions(null)
    try {
      const r = await fetch('/api/vacances/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_eur: budgetNum,
          jours: joursNum,
          depart,
          avec_qui: avecQui || null,
          envies,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur de calcul')
      setPropositions(data.propositions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Budget inversé
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-violet-300">
              <Sparkles size={18} />
              <span className="text-xs uppercase tracking-wider">J&apos;ai un budget, propose-moi des voyages</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Dis-nous ton budget et tes envies, on te propose 5 destinations complètes chiffrées
              (transport + logement + repas + activités) — jamais un chiffre inventé, toujours une fourchette.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/55 mb-1.5 block">Budget total (€)</label>
                <input
                  type="number"
                  min={50}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
                />
              </div>
              <div>
                <label className="text-xs text-white/55 mb-1.5 block">Nombre de jours</label>
                <input
                  type="number"
                  min={1}
                  value={jours}
                  onChange={(e) => setJours(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/55 mb-1.5 block">Départ depuis</label>
                <input
                  type="text"
                  value={depart}
                  onChange={(e) => setDepart(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
                />
              </div>
              <div>
                <label className="text-xs text-white/55 mb-1.5 block">Avec qui ? (optionnel)</label>
                <input
                  type="text"
                  value={avecQui}
                  onChange={(e) => setAvecQui(e.target.value)}
                  placeholder="seul, couple, amis, famille…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/55 mb-2 block">Envies</label>
              <div className="flex flex-wrap gap-2">
                {ENVIES.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEnvie(e.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      envies.includes(e.id)
                        ? 'bg-violet-400/15 text-violet-300 border-violet-400/40'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/8'
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-400 to-cyan-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Recherche…' : 'Trouver 5 voyages'}
            </button>
          </form>

          {propositions && (
            <section className="space-y-4">
              {propositions.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center space-y-2">
                  <p className="text-4xl">🔍</p>
                  <p className="text-white/65 text-sm">Aucune proposition disponible pour le moment.</p>
                </div>
              ) : (
                propositions.map((p, i) => <PropositionCard key={i} p={p} rank={i + 1} />)
              )}
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function PropositionCard({ p, rank }: { p: Proposition; rank: number }) {
  const range = `${formatPrice(p.totalMin)} – ${formatPrice(p.totalMax)}`
  return (
    <article className="glass rounded-3xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-white/40">Proposition #{rank}</span>
          <h3 className="text-xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
            {p.destination}, {p.pays}
          </h3>
          {p.description && <p className="text-xs text-white/55 mt-1 leading-relaxed">{p.description}</p>}
        </div>
        {p.budgetRespecte ? (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 flex-shrink-0">
            <CheckCircle2 size={12} /> Dans le budget
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40 flex-shrink-0">
            <AlertCircle size={12} /> +{formatPrice(p.ecartBudgetEur)}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>{range}</p>

      <ul className="space-y-1.5 border-t border-white/5 pt-3">
        {p.breakdown.map((line, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-white/65">{line.label}</span>
            <span className="text-white/85 font-medium">{formatPrice(line.min)} – {formatPrice(line.max)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 pt-1">
        <a href={p.liens.transport} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/8 transition">
          <Plane size={12} /> Transport
        </a>
        <a href={p.liens.logement} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/8 transition">
          <Home size={12} /> Logement
        </a>
        <a href={p.liens.activites} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/8 transition">
          <Ticket size={12} /> Activités
        </a>
      </div>

      {p.tagsMatch.length > 0 && (
        <p className="text-[11px] text-white/40 flex items-center gap-1">
          <UtensilsCrossed size={10} /> Correspond à : {p.tagsMatch.join(', ')}
        </p>
      )}
    </article>
  )
}
