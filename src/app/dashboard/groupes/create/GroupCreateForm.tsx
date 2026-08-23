'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Train, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { Field } from '@/components/forms/Field'
import { EventGratuitFields } from './EventGratuitFields'
import { TrajetSNCFFields } from './TrajetSNCFFields'
import { ActivitePartenaireFields } from './ActivitePartenaireFields'

type PoolType = 'event_gratuit' | 'trajet_sncf' | 'activite_partenaire'

const POOL_TYPES = [
  { id: 'event_gratuit' as PoolType, label: 'Event gratuit', icon: Calendar, desc: 'Musée, concert, atelier gratuit ou peu cher' },
  { id: 'trajet_sncf' as PoolType, label: 'Trajet SNCF groupe', icon: Train, desc: 'Billet de groupe train (réservation manuelle)' },
  { id: 'activite_partenaire' as PoolType, label: 'Activité partenaire', icon: Users, desc: 'Sortie, atelier, cours avec partenaire' },
]

export function GroupCreateForm({ defaultCity }: { defaultCity: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [poolType, setPoolType] = useState<PoolType>('event_gratuit')

  // Commun
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState(defaultCity)
  const [targetCount, setTargetCount] = useState('10')
  const [deadlineDays, setDeadlineDays] = useState('14')

  // Event gratuit
  const [eventPrice, setEventPrice] = useState('0')

  // Trajet SNCF
  const [origine, setOrigine] = useState('')
  const [destination, setDestination] = useState('')
  const [dateDepart, setDateDepart] = useState('')
  const [tarifIndividuel, setTarifIndividuel] = useState('')
  const [reductionPct, setReductionPct] = useState('25')

  // Activité partenaire
  const [nomPartenaire, setNomPartenaire] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [groupPrice, setGroupPrice] = useState('')
  const [partnerUrl, setPartnerUrl] = useState('')

  const valid = (() => {
    if (title.trim().length < 5 || Number(targetCount) < 2) return false
    if (poolType === 'event_gratuit') return Number(eventPrice) >= 0
    if (poolType === 'trajet_sncf') {
      return origine.trim().length > 0 && destination.trim().length > 0 && dateDepart.length > 0 && Number(tarifIndividuel) > 0
    }
    if (poolType === 'activite_partenaire') {
      return nomPartenaire.trim().length > 0 && Number(unitPrice) > 0 && Number(groupPrice) > 0 && Number(groupPrice) < Number(unitPrice)
    }
    return false
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    try {
      let payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        target_count: Number(targetCount),
        deadline_days: Number(deadlineDays),
        pool_type: poolType,
      }

      if (poolType === 'event_gratuit') {
        payload = {
          ...payload,
          category: 'culture',
          unit_price_eur: Number(eventPrice),
          group_price_eur: 0,
          partner_url: null,
          metadata: {},
        }
      } else if (poolType === 'trajet_sncf') {
        const tarif = Number(tarifIndividuel)
        const reduc = Number(reductionPct) / 100
        const tarifGroupe = tarif * (1 - reduc)
        payload = {
          ...payload,
          category: 'transport',
          unit_price_eur: tarif,
          group_price_eur: tarifGroupe,
          partner_url: 'https://www.sncf-connect.com',
          metadata: {
            origine: origine.trim(),
            destination: destination.trim(),
            date_depart: dateDepart,
            tarif_individuel_estime: tarif,
            reduction_groupe_pct: Number(reductionPct),
          },
        }
      } else if (poolType === 'activite_partenaire') {
        payload = {
          ...payload,
          category: 'activite',
          unit_price_eur: Number(unitPrice),
          group_price_eur: Number(groupPrice),
          partner_url: partnerUrl.trim() || null,
          metadata: {
            nom_partenaire: nomPartenaire.trim(),
            lien_reservation: partnerUrl.trim() || null,
          },
        }
      }

      const r = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const savings = poolType === 'activite_partenaire' && Number(unitPrice) > 0 && Number(groupPrice) > 0
    ? Math.round(((Number(unitPrice) - Number(groupPrice)) / Number(unitPrice)) * 100)
    : poolType === 'trajet_sncf' && Number(reductionPct) > 0
    ? Number(reductionPct)
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

        <div className="px-6 pb-16 max-w-2xl mx-auto space-y-5">
          {/* Type de pool */}
          <div className="glass rounded-3xl p-5">
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-3">Type de pool</label>
            <div className="grid grid-cols-1 gap-3">
              {POOL_TYPES.map((pt) => {
                const Icon = pt.icon
                const active = poolType === pt.id
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setPoolType(pt.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition ${
                      active
                        ? 'bg-white/10 border-emerald-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/8'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-emerald-300' : 'text-white/40'} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{pt.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{pt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">
            <Field label="Titre du pool">
              <input
                type="text"
                required
                minLength={5}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  poolType === 'trajet_sncf'
                    ? 'Ex. Paris → Lyon 20 mars 2026'
                    : poolType === 'activite_partenaire'
                    ? 'Ex. Sortie kayak sur la Loire'
                    : 'Ex. Visite guidée Musée d\'Orsay'
                }
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

            {poolType === 'trajet_sncf' && (
              <TrajetSNCFFields
                origine={origine}
                setOrigine={setOrigine}
                destination={destination}
                setDestination={setDestination}
                dateDepart={dateDepart}
                setDateDepart={setDateDepart}
                tarifIndividuel={tarifIndividuel}
                setTarifIndividuel={setTarifIndividuel}
                reductionPct={reductionPct}
                setReductionPct={setReductionPct}
              />
            )}

            {poolType === 'activite_partenaire' && (
              <ActivitePartenaireFields
                nomPartenaire={nomPartenaire}
                setNomPartenaire={setNomPartenaire}
                unitPrice={unitPrice}
                setUnitPrice={setUnitPrice}
                groupPrice={groupPrice}
                setGroupPrice={setGroupPrice}
                partnerUrl={partnerUrl}
                setPartnerUrl={setPartnerUrl}
              />
            )}

            {poolType === 'event_gratuit' && (
              <EventGratuitFields eventPrice={eventPrice} setEventPrice={setEventPrice} />
            )}

            <Field label="Ville">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Participants visés">
                <input
                  type="number"
                  min={2}
                  max={1000}
                  required
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Délai (jours)">
                <input
                  type="number"
                  min={1}
                  max={180}
                  required
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            {savings > 0 && (
              <p className="text-sm text-emerald-300 text-center">
                Économie réalisée : <strong>−{savings}%</strong>
              </p>
            )}

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
      <style>{`
.input {
  width:100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  color: white;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: rgba(52,211,153,0.5); }
.glass-soft { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
`}</style>
    </>
  )
}
