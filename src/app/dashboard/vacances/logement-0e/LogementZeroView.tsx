'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Home, ShieldCheck, ExternalLink, Sparkles, Calculator } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import { CANAUX_LOGEMENT_ZERO, calculerEconomieLogement, type CanalLogementZero } from '@/lib/vacances/logement-zero'

export function LogementZeroView() {
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
            Logement à 0€
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300">
              <Home size={18} />
              <span className="text-xs uppercase tracking-wider">3 façons réelles de dormir gratuitement</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              On te redirige vers des plateformes existantes et fiables — pas de marketplace YATRA en V1.
              Checklist sécurité incluse à chaque fois : ne saute jamais ces étapes.
            </p>
          </section>

          {CANAUX_LOGEMENT_ZERO.map((canal) => (
            <CanalCard key={canal.id} canal={canal} />
          ))}
        </div>
      </main>
    </>
  )
}

function CanalCard({ canal }: { canal: CanalLogementZero }) {
  const [showCalc, setShowCalc] = useState(false)
  const [nuits, setNuits] = useState('7')
  const [coutMin, setCoutMin] = useState('30')
  const [coutMax, setCoutMax] = useState('70')
  const [saved, setSaved] = useState(false)

  const economie = calculerEconomieLogement(Number(nuits) || 0, Number(coutMin) || 0, Number(coutMax) || 0)

  async function handleSave() {
    const r = await fetch('/api/vacances/logement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canal: canal.id,
        nuits: Number(nuits),
        cout_nuit_min_eur: Number(coutMin),
        cout_nuit_max_eur: Number(coutMax),
      }),
    })
    if (r.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <article className="glass rounded-3xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{canal.titre}</h2>
          <p className="text-sm text-white/60 mt-1 leading-relaxed">{canal.description}</p>
        </div>
        {canal.synergiePashu && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-violet-400/10 text-violet-300 border border-violet-400/30 flex-shrink-0">
            Bientôt : PASHU
          </span>
        )}
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
          <a
            key={p.nom}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/8 transition"
          >
            {p.nom} <ExternalLink size={11} />
          </a>
        ))}
      </div>

      <div className="border-t border-white/5 pt-3">
        <button type="button" onClick={() => setShowCalc((v) => !v)} className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white/80 transition">
          <Calculator size={13} /> {showCalc ? 'Masquer le calculateur' : "Calculer l'économie réalisée"}
        </button>
        {showCalc && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min={1} value={nuits} onChange={(e) => setNuits(e.target.value)} placeholder="Nuits" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
              <input type="number" min={0} value={coutMin} onChange={(e) => setCoutMin(e.target.value)} placeholder="Coût min/nuit" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
              <input type="number" min={0} value={coutMax} onChange={(e) => setCoutMax(e.target.value)} placeholder="Coût max/nuit" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
            </div>
            <p className="text-sm text-emerald-300 font-semibold">
              Économie estimée : {formatPrice(economie.economieMinEur)} – {formatPrice(economie.economieMaxEur)}
            </p>
            <button type="button" onClick={handleSave} className="text-xs px-3 py-1.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-400/25 transition">
              {saved ? 'Enregistré !' : "J'ai utilisé cette option"}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
