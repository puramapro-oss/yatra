'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, AlertTriangle, Plane, Luggage, Armchair, FileText, Car } from 'lucide-react'
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

  const selectedFee = useMemo(() => transporteurs.find((t) => t.transporteur === transporteur) ?? null, [transporteurs, transporteur])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const prix = Number(prixAffiche)
    if (!prixAffiche || Number.isNaN(prix) || prix < 0) {
      setError('Indique le prix affiché (nombre positif).')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/vacances/true-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          transfert_mode: transfertMode || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur de calcul')
      setResult(data)
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
            Vrai prix total
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <Plane size={18} />
              <span className="text-xs uppercase tracking-wider">Le prix affiché n&apos;est jamais le prix final</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Bagages, siège, frais de dossier, transfert aéroport : ajoute ce que tu comptes prendre,
              on calcule le vrai total. Fourchette indicative — vérifie le montant exact au moment de la réservation.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">
            <div>
              <label className="text-xs text-white/55 mb-1.5 block">Prix affiché sur le site (€)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={prixAffiche}
                onChange={(e) => setPrixAffiche(e.target.value)}
                placeholder="ex : 49.99"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
              />
            </div>

            <div>
              <label className="text-xs text-white/55 mb-1.5 block">Transporteur</label>
              <select
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
                  <AlertTriangle size={11} /> Sans transporteur reconnu, on ne peut pas estimer les frais annexes.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CheckOption icon={<Luggage size={14} />} label="Bagage cabine" checked={bagageCabine} onChange={setBagageCabine} />
              <CheckOption icon={<Luggage size={14} />} label="Bagage soute" checked={bagageSoute} onChange={setBagageSoute} />
              <CheckOption icon={<Armchair size={14} />} label="Sélection siège" checked={siege} onChange={setSiege} />
              <CheckOption icon={<FileText size={14} />} label="Frais de dossier CB" checked={fraisDossier} onChange={setFraisDossier} />
            </div>

            <div>
              <label className="text-xs text-white/55 mb-1.5 block flex items-center gap-1.5">
                <Car size={13} /> Transfert aéroport (optionnel)
              </label>
              <div className="flex gap-2">
                <select
                  value={aeroportCode}
                  onChange={(e) => setAeroportCode(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                >
                  <option value="">Aucun</option>
                  {aeroports.map((a) => (
                    <option key={a.code_aeroport} value={a.code_aeroport}>{a.nom_aeroport} ({a.code_aeroport})</option>
                  ))}
                </select>
                {aeroportCode && (
                  <select
                    value={transfertMode}
                    onChange={(e) => setTransfertMode(e.target.value as 'public' | 'taxi' | '')}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                  >
                    <option value="">Mode</option>
                    <option value="public">Transport public</option>
                    <option value="taxi">Taxi/VTC</option>
                  </select>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Calcul…' : 'Calculer le vrai prix total'}
            </button>
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
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition border ${
        checked ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/8'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ResultCard({ result }: { result: TruePriceResult }) {
  const range = result.totalMin === result.totalMax
    ? formatPrice(result.totalMin)
    : `${formatPrice(result.totalMin)} – ${formatPrice(result.totalMax)}`

  return (
    <section className="glass rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/50">Vrai prix total estimé</span>
        {result.badgePrixVerifie ? (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/40">
            <BadgeCheck size={12} /> Frais annexes vérifiés
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40">
            <AlertTriangle size={12} /> Transporteur non reconnu
          </span>
        )}
      </div>

      <p className="text-3xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>{range}</p>

      <ul className="space-y-1.5 border-t border-white/5 pt-3">
        {result.breakdown.map((line, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-white/65">{line.label}</span>
            <span className="text-white/85 font-medium">
              {line.min === line.max ? formatPrice(line.min) : `${formatPrice(line.min)} – ${formatPrice(line.max)}`}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-white/35 pt-2">
        Fourchette indicative basée sur les grilles tarifaires connues du transporteur — les frais annexes
        varient selon route, saison et moment de réservation. Vérifie le montant exact avant de payer.
      </p>
    </section>
  )
}
