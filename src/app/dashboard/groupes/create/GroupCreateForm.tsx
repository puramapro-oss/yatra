'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

const CATEGORIES = [
  { id: 'transport', label: 'Transport (abo Navigo, location vélo…)' },
  { id: 'activite', label: 'Activité (cours yoga, piscine…)' },
  { id: 'soins', label: 'Soins (massage, naturopathie…)' },
  { id: 'culture', label: 'Culture (visite guidée, atelier…)' },
  { id: 'autre', label: 'Autre' },
]

export function GroupCreateForm({ defaultCity }: { defaultCity: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('activite')
  const [city, setCity] = useState(defaultCity)
  const [targetCount, setTargetCount] = useState('5')
  const [unitPrice, setUnitPrice] = useState('')
  const [groupPrice, setGroupPrice] = useState('')
  const [deadlineDays, setDeadlineDays] = useState('14')
  const [partnerUrl, setPartnerUrl] = useState('')

  const valid =
    title.trim().length >= 5 &&
    Number(targetCount) >= 2 &&
    Number(unitPrice) > 0 &&
    Number(groupPrice) > 0 &&
    Number(groupPrice) < Number(unitPrice)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          city: city.trim() || null,
          target_count: Number(targetCount),
          unit_price_eur: Number(unitPrice),
          group_price_eur: Number(groupPrice),
          deadline_days: Number(deadlineDays),
          partner_url: partnerUrl.trim() || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Pool créé 🎉')
      router.push(`/dashboard/groupes/${data.group.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  const savings = Number(unitPrice) > 0 && Number(groupPrice) > 0
    ? Math.round(((Number(unitPrice) - Number(groupPrice)) / Number(unitPrice)) * 100)
    : 0

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/groupes" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Nouveau pool
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">
            <Field label="Titre du pool">
              <input
                type="text"
                required minLength={5} maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Cours de yoga groupé Studio Bercy"
                className="input"
              />
            </Field>

            <Field label="Description (facultatif)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Détails du pool, dates, contraintes…"
                className="input resize-none"
              />
            </Field>

            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Ville">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} className="input" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Participants visés">
                <input
                  type="number" min={2} max={1000} required
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Délai (jours)">
                <input
                  type="number" min={1} max={180} required
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix individuel (€)">
                <input
                  type="number" step="0.01" min={0} required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="ex 25"
                  className="input"
                />
              </Field>
              <Field label="Prix groupe (€)">
                <input
                  type="number" step="0.01" min={0} required
                  value={groupPrice}
                  onChange={(e) => setGroupPrice(e.target.value)}
                  placeholder="ex 18"
                  className="input"
                />
              </Field>
            </div>

            {savings > 0 && (
              <p className="text-sm text-emerald-300 text-center">
                Économie réalisée : <strong>−{savings}%</strong>
              </p>
            )}

            <Field label="URL partenaire (facultatif)">
              <input
                type="url"
                value={partnerUrl}
                onChange={(e) => setPartnerUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>

            <button
              type="submit"
              disabled={!valid || submitting}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Créer le pool
            </button>
          </form>
        </div>
      </main>
      <style>{`.input { width:100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 14px; font-size: 14px; color: white; outline: none; transition: border-color 0.15s; }
.input:focus { border-color: rgba(52,211,153,0.5); }
`}</style>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
