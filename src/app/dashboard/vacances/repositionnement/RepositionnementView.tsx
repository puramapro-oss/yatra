'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Car, ShieldCheck, ExternalLink, Sparkles, Calculator, Ship, PlaneTakeoff } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import type { CanalRepositionnement } from '@/lib/vacances/repositionnement'

type Usage = { id: string; canal: string; description: string | null; prix_normal_estime_eur: number; prix_paye_eur: number; economie_eur: number; created_at: string }
type Croisieres = { description: string; conseils: string[]; plateformes: { nom: string; url: string }[] }
type VolsRepositionnement = { description: string; commentReperer: string[] }

export function RepositionnementView({
  initialUsages,
  canaux,
  croisieres,
  volsRepositionnement,
}: {
  initialUsages: Usage[]
  canaux: CanalRepositionnement[]
  croisieres: Croisieres
  volsRepositionnement: VolsRepositionnement
}) {
  const [usages, setUsages] = useState<Usage[]>(initialUsages)
  const totalEconomise = usages.reduce((s, u) => s + Number(u.economie_eur), 0)

  function onLogged(usage: Usage) {
    setUsages((prev) => [usage, ...prev])
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
            Repositionnement & dernière minute
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <Car size={18} />
              <span className="text-xs uppercase tracking-wider">Trajets quasi gratuits & cabines bradées</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Convoyage, location aller simple, croisières et vols en dernière minute : des vraies opportunités,
              disponibilité variable — on te redirige vers des plateformes existantes, jamais de fausse annonce.
            </p>
            {totalEconomise > 0 && (
              <p className="text-sm text-emerald-300 font-semibold pt-1">
                Économisé via ce module : {formatPrice(totalEconomise)}
              </p>
            )}
          </section>

          {canaux.map((canal) => (
            <CanalCard key={canal.id} canal={canal} onLogged={onLogged} />
          ))}

          <article className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-start gap-2">
              <Ship size={18} className="text-cyan-300 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Croisières dernière minute</h2>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">{croisieres.description}</p>
              </div>
            </div>
            <ul className="space-y-1">
              {croisieres.conseils.map((c, i) => (
                <li key={i} className="text-sm text-white/70 flex gap-2">
                  <span className="text-white/30">·</span> {c}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {croisieres.plateformes.map((p) => (
                <a key={p.nom} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/8 transition">
                  {p.nom} <ExternalLink size={11} />
                </a>
              ))}
            </div>
            <UsageLogger canal="croisiere_derniere_minute" onLogged={onLogged} />
          </article>

          <article className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-start gap-2">
              <PlaneTakeoff size={18} className="text-cyan-300 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Vols de repositionnement</h2>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">{volsRepositionnement.description}</p>
              </div>
            </div>
            <p className="text-[11px] text-white/40">Aucune plateforme dédiée fiable identifiée en V1 — voici comment les repérer toi-même :</p>
            <ol className="space-y-1">
              {volsRepositionnement.commentReperer.map((step, i) => (
                <li key={i} className="text-sm text-white/70 flex gap-2">
                  <span className="text-white/30">{i + 1}.</span> {step}
                </li>
              ))}
            </ol>
            <UsageLogger canal="vol_repositionnement" onLogged={onLogged} />
          </article>

          {usages.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs uppercase tracking-wider text-white/50">Historique ({usages.length})</h2>
              {usages.map((u) => (
                <div key={u.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-white/70 truncate">{u.description || u.canal.replace(/_/g, ' ')}</span>
                  <span className="text-emerald-300 font-semibold text-sm flex-shrink-0">+{formatPrice(u.economie_eur)}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function CanalCard({ canal, onLogged }: { canal: CanalRepositionnement; onLogged: (u: Usage) => void }) {
  return (
    <article className="glass rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{canal.titre}</h2>
        <p className="text-sm text-white/60 mt-1 leading-relaxed">{canal.description}</p>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-white/45 mb-2 flex items-center gap-1.5">
          <Sparkles size={12} /> Comment ça marche
        </h3>
        <ol className="space-y-1">
          {canal.commentCaMarche.map((step, i) => (
            <li key={i} className="text-sm text-white/70 flex gap-2">
              <span className="text-white/30">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-amber-300/80 mb-2 flex items-center gap-1.5">
          <ShieldCheck size={12} /> Checklist sécurité
        </h3>
        <ul className="space-y-1">
          {canal.checklistSecurite.map((item, i) => (
            <li key={i} className="text-sm text-white/70 flex gap-2">
              <span className="text-amber-400/60">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {canal.plateformes.map((p) => (
          <a key={p.nom} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/8 transition">
            {p.nom} <ExternalLink size={11} />
          </a>
        ))}
      </div>

      <UsageLogger canal={canal.id} onLogged={onLogged} />
    </article>
  )
}

function UsageLogger({ canal, onLogged }: { canal: string; onLogged: (u: Usage) => void }) {
  const [show, setShow] = useState(false)
  const [description, setDescription] = useState('')
  const [prixNormal, setPrixNormal] = useState('')
  const [prixPaye, setPrixPaye] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    const normal = Number(prixNormal)
    const paye = Number(prixPaye)
    if (!normal || normal <= 0) { setError('Indique le prix normal estimé.'); return }
    if (paye < 0) { setError('Prix payé invalide.'); return }

    setSaving(true)
    try {
      const r = await fetch('/api/vacances/repositionnement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal, description: description || null, prix_normal_estime_eur: normal, prix_paye_eur: paye }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur')
      onLogged(data.usage)
      setSaved(true)
      setDescription(''); setPrixNormal(''); setPrixPaye('')
      setTimeout(() => { setSaved(false); setShow(false) }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-white/5 pt-3">
      <button type="button" onClick={() => setShow((v) => !v)} className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white/80 transition">
        <Calculator size={13} /> {show ? 'Masquer' : "J'ai utilisé cette option"}
      </button>
      {show && (
        <div className="mt-3 space-y-2">
          <input type="text" placeholder="Trajet ou détail (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min={0} value={prixNormal} onChange={(e) => setPrixNormal(e.target.value)} placeholder="Prix normal estimé (€)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
            <input type="number" min={0} value={prixPaye} onChange={(e) => setPrixPaye(e.target.value)} placeholder="Prix payé (€)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
          </div>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button type="button" onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-400/25 transition disabled:opacity-50">
            {saved ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}
