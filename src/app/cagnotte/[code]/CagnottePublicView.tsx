'use client'

import { useState } from 'react'
import { PartyPopper, Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { progressPct } from '@/lib/vacances/cagnotte'

type Cagnotte = { titre: string; destination: string | null; objectif_eur: number; montant_actuel_eur: number; statut: 'active' | 'cloturee' }

export function CagnottePublicView({ code, cagnotte }: { code: string; cagnotte: Cagnotte }) {
  const [montant, setMontant] = useState(cagnotte.montant_actuel_eur)
  const [nom, setNom] = useState('')
  const [somme, setSomme] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const cloturee = cagnotte.statut !== 'active'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nom.trim()) return setError('Indique ton prénom.')
    const eur = Number(somme)
    if (!eur || eur <= 0) return setError('Indique un montant valide.')
    if (eur > 500) return setError('Montant maximum : 500€ par contribution.')

    setLoading(true)
    try {
      const r = await fetch(`/api/vacances/cagnotte/public/${code}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributeur_nom: nom.trim(), montant_eur: eur, message: message.trim() || null }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur')
      setMontant(data.nouveau_montant_actuel_eur)
      setSuccess(true)
      setNom(''); setSomme(''); setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-12 bg-[#0A0A0F]" style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, rgba(124,58,237,0.12), transparent 45%), radial-gradient(circle at 85% 90%, rgba(6,182,212,0.10), transparent 45%)' }}>
      <div className="w-full max-w-md glass rounded-3xl p-7 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-3xl">🐷</p>
          <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {cagnotte.titre}
          </h1>
          {cagnotte.destination && <p className="text-sm text-white/50">{cagnotte.destination}</p>}
        </div>

        <div className="space-y-2">
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all" style={{ width: `${progressPct(montant, cagnotte.objectif_eur)}%` }} />
          </div>
          <p className="text-center text-lg font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
            {formatPrice(montant)} <span className="text-white/40 text-sm font-normal">/ {formatPrice(cagnotte.objectif_eur)}</span>
          </p>
        </div>

        {cloturee ? (
          <p className="text-center text-sm text-white/50">Cette cagnotte est clôturée — merci pour votre soutien !</p>
        ) : success ? (
          <div className="text-center space-y-2 py-4">
            <PartyPopper className="mx-auto text-amber-300" size={28} />
            <p className="text-sm text-white/80">Merci pour ta contribution !</p>
            <button type="button" onClick={() => setSuccess(false)} className="text-xs text-white/50 underline">
              Contribuer à nouveau
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Ton prénom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
            <input type="number" min={1} max={500} placeholder="Montant (€)" value={somme} onChange={(e) => setSomme(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
            <textarea placeholder="Un petit mot (optionnel)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm resize-none" />
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
              <Heart size={15} /> {loading ? 'Envoi…' : 'Contribuer'}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-white/30">Propulsé par YATRA — l&apos;écosystème PURAMA</p>
      </div>
    </main>
  )
}
