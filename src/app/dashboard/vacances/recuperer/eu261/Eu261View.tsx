'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, PlaneTakeoff, Copy, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
type Airport = { code_iata: string; nom: string; ville: string; pays: string; ue: boolean }
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
const INCIDENT_LABELS: Record<Claim['type_incident'], string> = {
  retard: 'Retard à l\'arrivée',
  annulation: 'Annulation',
  refus_embarquement: 'Refus d\'embarquement (surbooking)',
}
const STATUT_LABELS: Record<Claim['statut'], { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-white/5 text-white/55 border-white/10' },
  envoyee: { label: 'Envoyée', cls: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40' },
  obtenue: { label: 'Obtenue', cls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40' },
  refusee: { label: 'Refusée', cls: 'bg-rose-400/15 text-rose-300 border-rose-400/40' },
}
export function Eu261View({ initialReclamations, aeroports, nomComplet }: { initialReclamations: Claim[]; aeroports: Airport[]; nomComplet: string }) {
  const [claims, setClaims] = useState<Claim[]>(initialReclamations)
  const [form, setForm] = useState({
    nom_complet: nomComplet,
    compagnie: '',
    numero_vol: '',
    date_vol: '',
    aeroport_depart_code: '',
    aeroport_arrivee_code: '',
    type_incident: 'retard' as Claim['type_incident'],
    retard_heures: '3',
    jours_notice_annulation: '',
    circonstances_extraordinaires_invoquees: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.compagnie || !form.numero_vol || !form.date_vol || !form.aeroport_depart_code || !form.aeroport_arrivee_code || !form.nom_complet) {
      setError('Remplis tous les champs obligatoires.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/vacances/eu261', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_complet: form.nom_complet,
          compagnie: form.compagnie,
          numero_vol: form.numero_vol,
          date_vol: form.date_vol,
          aeroport_depart_code: form.aeroport_depart_code,
          aeroport_arrivee_code: form.aeroport_arrivee_code,
          type_incident: form.type_incident,
          retard_heures: form.type_incident === 'retard' ? Number(form.retard_heures) : null,
          jours_notice_annulation: form.type_incident === 'annulation' ? Number(form.jours_notice_annulation) : null,
          circonstances_extraordinaires_invoquees: form.circonstances_extraordinaires_invoquees,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur')
      setClaims((prev) => [data.reclamation, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatut(id: string, statut: 'envoyee' | 'obtenue' | 'refusee', montant?: number) {
    const r = await fetch(`/api/vacances/eu261/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut, montant_obtenu_eur: montant ?? null }),
    })
    if (r.ok) {
      const data = await r.json()
      setClaims((prev) => prev.map((c) => (c.id === id ? data.reclamation : c)))
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances/recuperer" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Indemnisation vol (EU261)
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <PlaneTakeoff size={18} />
              <span className="text-xs uppercase tracking-wider">0% de commission — l&apos;argent va directement sur ton compte</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              On évalue ton éligibilité et on génère la lettre. Tu l&apos;envoies toi-même à la compagnie —
              YATRA ne se substitue pas à un service juridique et ne touche jamais l&apos;argent réclamé.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-4">
            <input
              type="text"
              placeholder="Ton nom complet"
              value={form.nom_complet}
              onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Compagnie (ex : Ryanair)"
                value={form.compagnie}
                onChange={(e) => setForm({ ...form, compagnie: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
              />
              <input
                type="text"
                placeholder="N° de vol (ex : FR1234)"
                value={form.numero_vol}
                onChange={(e) => setForm({ ...form, numero_vol: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
              />
            </div>
            <input
              type="date"
              value={form.date_vol}
              onChange={(e) => setForm({ ...form, date_vol: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.aeroport_depart_code}
                onChange={(e) => setForm({ ...form, aeroport_depart_code: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
              >
                <option value="">Aéroport départ</option>
                {aeroports.map((a) => (
                  <option key={a.code_iata} value={a.code_iata}>{a.ville} ({a.code_iata})</option>
                ))}
              </select>
              <select
                value={form.aeroport_arrivee_code}
                onChange={(e) => setForm({ ...form, aeroport_arrivee_code: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
              >
                <option value="">Aéroport arrivée</option>
                {aeroports.map((a) => (
                  <option key={a.code_iata} value={a.code_iata}>{a.ville} ({a.code_iata})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              {(['retard', 'annulation', 'refus_embarquement'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type_incident: t })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition border ${
                    form.type_incident === t ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40' : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  {INCIDENT_LABELS[t]}
                </button>
              ))}
            </div>

            {form.type_incident === 'retard' && (
              <div>
                <label className="text-xs text-white/55 mb-1.5 block">Retard constaté à l&apos;arrivée (heures)</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.retard_heures}
                  onChange={(e) => setForm({ ...form, retard_heures: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                />
              </div>
            )}
            {form.type_incident === 'annulation' && (
              <div>
                <label className="text-xs text-white/55 mb-1.5 block">Préavis avant le départ (jours)</label>
                <input
                  type="number"
                  min={0}
                  value={form.jours_notice_annulation}
                  onChange={(e) => setForm({ ...form, jours_notice_annulation: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={form.circonstances_extraordinaires_invoquees}
                onChange={(e) => setForm({ ...form, circonstances_extraordinaires_invoquees: e.target.checked })}
              />
              La compagnie a déjà invoqué des « circonstances extraordinaires » (météo, grève ATC…)
            </label>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Analyse…' : 'Vérifier mon éligibilité'}
            </button>
          </form>

          <section className="space-y-4">
            {claims.map((c) => (
              <ClaimCard key={c.id} claim={c} onUpdateStatut={updateStatut} />
            ))}
          </section>
        </div>
      </main>
    </>
  )
}

function ClaimCard({ claim, onUpdateStatut }: { claim: Claim; onUpdateStatut: (id: string, statut: 'envoyee' | 'obtenue' | 'refusee', montant?: number) => void }) {
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
