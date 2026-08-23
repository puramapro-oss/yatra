import { useState } from 'react'
import { CheckCircle2, HelpCircle, AlertTriangle, Copy } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type Claim = {
  id: string
  compagnie: string
  numero_vol: string
  date_vol: string
  type_incident: 'retard' | 'annulation' | 'refus_embarquement'
  eligibilite: 'oui' | 'non' | 'incertain'
  motif_eligibilite: string
  montant_estime_eur: number
  montant_obtenu_eur: number | null
  lettre_texte: string
  statut: 'brouillon' | 'envoyee' | 'obtenue' | 'refusee'
}

const STATUT_LABELS: Record<Claim['statut'], { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-white/5 text-white/55 border-white/10' },
  envoyee: { label: 'Envoyée', cls: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40' },
  obtenue: { label: 'Obtenue', cls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40' },
  refusee: { label: 'Refusée', cls: 'bg-rose-400/15 text-rose-300 border-rose-400/40' },
}

export function ClaimCard({ claim, onUpdateStatut }: { claim: Claim; onUpdateStatut: (id: string, statut: 'envoyee' | 'obtenue' | 'refusee', montant?: number) => void }) {
  const [copied, setCopied] = useState(false)
  const [showLettre, setShowLettre] = useState(false)
  const [montantObtenu, setMontantObtenu] = useState(String(claim.montant_estime_eur))

  async function copyLettre() {
    await navigator.clipboard.writeText(claim.lettre_texte)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const eligBadge =
    claim.eligibilite === 'oui'
      ? { icon: <CheckCircle2 size={12} />, label: 'Éligible', cls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40' }
      : claim.eligibilite === 'incertain'
        ? { icon: <HelpCircle size={12} />, label: 'Incertain', cls: 'bg-amber-400/15 text-amber-300 border-amber-400/40' }
        : { icon: <AlertTriangle size={12} />, label: 'Non éligible', cls: 'bg-rose-400/15 text-rose-300 border-rose-400/40' }

  return (
    <article className="glass rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">{claim.compagnie} {claim.numero_vol} — {claim.date_vol}</h3>
          <p className="text-xs text-white/55 mt-1">{claim.motif_eligibilite}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${eligBadge.cls}`}>
            {eligBadge.icon} {eligBadge.label}
          </span>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${STATUT_LABELS[claim.statut].cls}`}>
            {STATUT_LABELS[claim.statut].label}
          </span>
        </div>
      </div>

      {claim.montant_estime_eur > 0 && (
        <p className="text-lg font-bold text-emerald-300">{formatPrice(claim.montant_obtenu_eur ?? claim.montant_estime_eur)}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowLettre((v) => !v)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 transition">
          {showLettre ? 'Masquer la lettre' : 'Voir la lettre'}
        </button>
        {claim.statut === 'brouillon' && (
          <button type="button" onClick={() => onUpdateStatut(claim.id, 'envoyee')} className="text-xs px-3 py-1.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-400/25 transition">
            Marquer envoyée
          </button>
        )}
        {claim.statut === 'envoyee' && (
          <>
            <input
              type="number"
              min={0}
              value={montantObtenu}
              onChange={(e) => setMontantObtenu(e.target.value)}
              className="w-24 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs"
            />
            <button type="button" onClick={() => onUpdateStatut(claim.id, 'obtenue', Number(montantObtenu))} className="text-xs px-3 py-1.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-400/25 transition">
              Marquer obtenue
            </button>
            <button type="button" onClick={() => onUpdateStatut(claim.id, 'refusee')} className="text-xs px-3 py-1.5 rounded-full bg-rose-400/15 text-rose-300 border border-rose-400/40 hover:bg-rose-400/25 transition">
              Marquer refusée
            </button>
          </>
        )}
      </div>

      {showLettre && (
        <div className="border-t border-white/5 pt-3 space-y-2">
          <pre className="text-[11px] text-white/70 whitespace-pre-wrap leading-relaxed bg-black/20 rounded-xl p-4 max-h-96 overflow-y-auto">{claim.lettre_texte}</pre>
          <button type="button" onClick={copyLettre} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 transition">
            <Copy size={12} /> {copied ? 'Copié !' : 'Copier la lettre'}
          </button>
        </div>
      )}
    </article>
  )
}
