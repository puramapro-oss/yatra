'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Plane, Luggage, Armchair, FileText, Car } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import type { FeeSchedule, AirportTransfer, TruePriceResult } from '@/lib/vacances/true-price'

export function ScannerView({
  transporteurs,
  aeroports,
}: {
  transporteurs: FeeSchedule[]
  aeroports: AirportTransfer[]
}) {
  const [prixAffiche, setPrixAffiche] = useState('')
  const [transporteur, setTransporteur] = useState<string>('')
  const [bagageCabine, setBagageCabine] = useState(false)
  const [bagageSoute, setBagageSoute] = useState(false)
  const [siege, setSiege] = useState(false)
  const [fraisDossier, setFraisDossier] = useState(true)
  const [aeroportCode, setAeroportCode] = useState<string>('')
  const [transfertMode, setTransfertMode] = useState<'public' | 'taxi' | ''>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TruePriceResult | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  const selectedFee = useMemo(() => transporteurs.find((t) => t.transporteur === transporteur) ?? null, [transporteurs, transporteur])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (requestRef.current) return
    setError(null)
    const prix = Number(prixAffiche)
    if (!prixAffiche.trim() || !Number.isFinite(prix) || prix < 0 || prix > 50000) {
      setError('Indique un prix entre 0 et 50 000 €.')
      return
    }
    if (aeroportCode && !transfertMode) {
      setError('Choisis le mode du transfert aéroport pour l’inclure dans l’estimation.')
      return
    }
    const request = new AbortController()
    requestRef.current = request
    const timeout = window.setTimeout(() => request.abort(), 15000)
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/vacances/true-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: request.signal,
        body: JSON.stringify({
          prix_affiche_eur: prix,
          transporteur: transporteur || null,
          options: {
            bagage_cabine: bagageCabine,
            bagage_soute: bagageSoute,
            siege,
            frais_dossier: fraisDossier,
          },
          transfert_aeroport_code: aeroportCode || null,
          transfert_mode: aeroportCode ? transfertMode || null : null,
        }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) throw new Error(r.status === 401 ? 'Ta session a expiré. Reconnecte-toi pour relancer le calcul.' : data?.error ?? 'Le calcul est indisponible. Réessaie dans un instant.')
      if (!data || !Array.isArray(data.breakdown) || !Array.isArray(data.missingEstimates)
        || !Number.isFinite(data.totalMin) || !Number.isFinite(data.totalMax)
        || data.totalMin < 0 || data.totalMax < data.totalMin) throw new Error('La réponse du calcul est incomplète. Réessaie dans un instant.')
      if (requestRef.current === request) setResult(data)
    } catch (err) {
      if (requestRef.current === request) setError(request.signal.aborted
        ? 'Le calcul a pris trop de temps. Réessaie dans un instant.'
        : err instanceof TypeError ? 'Connexion interrompue. Vérifie ta connexion puis réessaie.'
          : err instanceof Error ? err.message : 'Le calcul a échoué. Réessaie dans un instant.')
    } finally {
      window.clearTimeout(timeout)
      if (requestRef.current === request) {
        requestRef.current = null
        setLoading(false)
      }
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances" aria-label="Retour" className="shrink-0 text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Estimer le coût du trajet
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <Plane size={18} />
              <span className="text-xs uppercase tracking-wider">Anticiper les frais du voyage</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Bagages, siège, frais de dossier, transfert aéroport : sélectionne les suppléments à prévoir.
              L’estimation utilise les grilles disponibles, sans vérifier le prix ni la disponibilité en temps réel.
            </p>
          </section>

          <form onSubmit={handleSubmit} onChange={() => { setResult(null); setError(null) }} aria-busy={loading} className="glass rounded-3xl p-6">
            <fieldset disabled={loading} className="min-w-0 space-y-5">
              <legend className="sr-only">Éléments à inclure dans l’estimation</legend>
              <div>
                <label htmlFor="scanner-price" className="text-xs text-white/55 mb-1.5 block">Prix affiché sur le site (€)</label>
                <input
                  id="scanner-price"
                  type="number"
                  min={0}
                  max={50000}
                  step="0.01"
                  required
                  inputMode="decimal"
                  value={prixAffiche}
                  onChange={(e) => setPrixAffiche(e.target.value)}
                  placeholder="ex : 49.99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label htmlFor="scanner-carrier" className="text-xs text-white/55 mb-1.5 block">Transporteur</label>
                <select
                  id="scanner-carrier"
                  value={transporteur}
                  onChange={(e) => setTransporteur(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                >
                  <option value="">Autre / non listé</option>
                  {transporteurs.map((t) => (
                    <option key={t.transporteur} value={t.transporteur}>{t.transporteur}</option>
                  ))}
                </select>
                {!selectedFee && transporteur === '' && (
                  <p className="text-[11px] text-amber-300/80 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={11} className="shrink-0" /> Sans grille disponible, les frais sélectionnés resteront non chiffrés.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CheckOption icon={<Luggage size={14} />} label="Bagage cabine" checked={bagageCabine} onChange={(v) => { setBagageCabine(v); setResult(null) }} />
                <CheckOption icon={<Luggage size={14} />} label="Bagage soute" checked={bagageSoute} onChange={(v) => { setBagageSoute(v); setResult(null) }} />
                <CheckOption icon={<Armchair size={14} />} label="Sélection siège" checked={siege} onChange={(v) => { setSiege(v); setResult(null) }} />
                <CheckOption icon={<FileText size={14} />} label="Frais de dossier" checked={fraisDossier} onChange={(v) => { setFraisDossier(v); setResult(null) }} />
              </div>

              <div>
                <label htmlFor="scanner-airport" className="text-xs text-white/55 mb-1.5 flex items-center gap-1.5">
                  <Car size={13} /> Transfert aéroport (optionnel)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="scanner-airport"
                    value={aeroportCode}
                    onChange={(e) => { setAeroportCode(e.target.value); if (!e.target.value) setTransfertMode('') }}
                    className="w-full min-w-0 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                  >
                    <option value="">Aucun</option>
                    {aeroports.map((a) => (
                      <option key={a.code_aeroport} value={a.code_aeroport}>{a.nom_aeroport} ({a.code_aeroport})</option>
                    ))}
                  </select>
                  {aeroportCode && (
                    <select
                      aria-label="Mode du transfert aéroport"
                      required
                      value={transfertMode}
                      onChange={(e) => setTransfertMode(e.target.value as 'public' | 'taxi' | '')}
                      className="w-full sm:w-auto min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                    >
                      <option value="">Mode</option>
                      <option value="public">Transport public</option>
                      <option value="taxi">Taxi/VTC</option>
                    </select>
                  )}
                </div>
              </div>

              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-400 to-violet-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
              >
                {loading ? 'Estimation en cours…' : 'Estimer le coût du trajet'}
              </button>
            </fieldset>
          </form>

          {result && <ResultCard result={result} />}
        </div>
      </main>
    </>
  )
}

function CheckOption({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left font-medium transition border ${
        checked ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/8'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="break-words">{label}</span>
    </button>
  )
}

function ResultCard({ result }: { result: TruePriceResult }) {
  const range = result.totalMin === result.totalMax
    ? formatPrice(result.totalMin)
    : `${formatPrice(result.totalMin)} – ${formatPrice(result.totalMax)}`
  const incomplete = result.missingEstimates.length > 0
  const gridDate = result.feeScheduleVerifiedAt
    ? new Date(result.feeScheduleVerifiedAt).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : null

  return (
    <section aria-live="polite" aria-label="Résultat de l’estimation" className="glass rounded-3xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-white/60">{incomplete ? 'Montant partiel estimé' : 'Total estimé'}</span>
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40">
          {result.feeScheduleAvailable ? 'Estimation à partir d’une grille' : 'Grille du transporteur indisponible'}
        </span>
      </div>

      <p className="text-2xl sm:text-3xl break-words font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>{range}</p>
      {result.feeScheduleAvailable && <p className="text-xs text-white/60">{gridDate ? `Date de référence de la grille : ${gridDate}.` : 'Date de référence de la grille indisponible.'}</p>}
      {incomplete && <p className="text-xs text-amber-200 leading-relaxed">Non inclus faute de données exploitables : {result.missingEstimates.join(', ')}. Le coût final peut dépasser le montant ci-dessus.</p>}

      <ul className="space-y-1.5 border-t border-white/5 pt-3">
        {result.breakdown.map((line) => (
          <li key={line.label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="text-white/65 break-words">{line.label}</span>
            <span className="text-white/85 font-medium break-words">
              {line.min === line.max ? formatPrice(line.min) : `${formatPrice(line.min)} – ${formatPrice(line.max)}`}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-white/60 pt-2">
        Estimation des éléments chiffrés : les frais varient selon le trajet, les voyageurs et la réservation.
        Le tarif et la disponibilité restent à confirmer auprès du vendeur avant de payer.
      </p>
    </section>
  )
}
