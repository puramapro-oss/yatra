'use client'
import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Campaign = {
  id: string
  partner_name: string
  location_name: string
  location_type: string
  city: string
  campaign_slug: string
  commission_pct: number | null
  created_at: string
  active: boolean
  scans_total: number
  conversions_total: number
}

const LOCATION_TYPES = [
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'gare', label: 'Gare' },
  { value: 'aeroport', label: 'Aéroport' },
  { value: 'autre', label: 'Autre' },
]

export function CreateCampaignForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (campaign: Campaign) => void
  onCancel: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationType, setLocationType] = useState<string>('bus')
  const [city, setCity] = useState('')
  const [commissionPct, setCommissionPct] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const slug = `${locationType}-${city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
      .slice(0, 50)

    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/qr-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_name: partnerName.trim(),
          location_name: locationName.trim(),
          location_type: locationType,
          city: city.trim(),
          campaign_slug: slug,
          commission_pct: commissionPct ? parseFloat(commissionPct) : null,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Erreur lors de la création')
        setSubmitting(false)
        return
      }

      const { campaign } = await res.json()
      onSuccess({ ...campaign, scans_total: 0, conversions_total: 0 })
      toast.success('Campagne créée')
      setPartnerName('')
      setLocationName('')
      setCity('')
      setCommissionPct('')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-6 space-y-4 animate-in fade-in duration-200"
    >
      <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
        Nouvelle campagne QR
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-white/65 mb-1.5 block">
            Nom du partenaire
          </span>
          <input
            type="text"
            required
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="RATP, SNCF, G7..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-white/65 mb-1.5 block">
            Nom du lieu
          </span>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Gare de Lyon, Bus 38..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-white/65 mb-1.5 block">
            Type de lieu
          </span>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-white/65 mb-1.5 block">Ville</span>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, Lyon, Marseille..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-white/65 mb-1.5 block">
            Commission % <span className="text-white/35">(optionnel)</span>
          </span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
            placeholder="10"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
          />
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Création...
            </>
          ) : (
            <>
              <Plus size={16} /> Créer la campagne
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-white/55 hover:text-white transition"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
