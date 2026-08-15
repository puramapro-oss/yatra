'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, QrCode, Download, ExternalLink, Loader2 } from 'lucide-react'
import QRCodeLib from 'qrcode'

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

type QRCampaignsViewProps = {
  campaigns: Campaign[]
}

const LOCATION_TYPES = [
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'gare', label: 'Gare' },
  { value: 'aeroport', label: 'Aéroport' },
  { value: 'autre', label: 'Autre' },
]

export function QRCampaignsView({ campaigns: initialCampaigns }: QRCampaignsViewProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [partnerName, setPartnerName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationType, setLocationType] = useState<string>('bus')
  const [city, setCity] = useState('')
  const [commissionPct, setCommissionPct] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    // Générer un slug unique depuis les données
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
      setCampaigns([{ ...campaign, scans_total: 0, conversions_total: 0 }, ...campaigns])
      toast.success('Campagne créée')
      setShowForm(false)
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

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/qr-campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!res.ok) {
        toast.error('Erreur lors de la mise à jour')
        return
      }

      setCampaigns(
        campaigns.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
      )
      toast.success(currentActive ? 'Campagne désactivée' : 'Campagne activée')
    } catch {
      toast.error('Erreur réseau')
    }
  }

  return (
    <div className="space-y-6">
      {/* Bouton créer */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/55">
          {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle campagne
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form
          onSubmit={handleCreate}
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
              onClick={() => setShowForm(false)}
              className="text-sm text-white/55 hover:text-white transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste campagnes */}
      <div className="space-y-4">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            onToggleActive={() => handleToggleActive(c.id, c.active)}
          />
        ))}

        {campaigns.length === 0 && !showForm && (
          <div className="glass rounded-2xl p-12 text-center">
            <QrCode size={48} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/55">Aucune campagne QR pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignCard({
  campaign,
  onToggleActive,
}: {
  campaign: Campaign
  onToggleActive: () => void
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = `https://yatra.purama.dev/scan/${campaign.campaign_slug}`
    QRCodeLib.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0A0A0F',
        light: '#FFFFFF',
      },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [campaign.campaign_slug])

  const conversionRate =
    campaign.scans_total > 0
      ? ((campaign.conversions_total / campaign.scans_total) * 100).toFixed(1)
      : '0'

  function handleDownloadQR() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `yatra-qr-${campaign.campaign_slug}.png`
    a.click()
  }

  async function handleDownloadPDF() {
    toast.info('Téléchargement du kit print...')
    try {
      const res = await fetch(`/api/admin/qr-campaigns/${campaign.id}/pdf`)
      if (!res.ok) {
        toast.error('Erreur lors de la génération du PDF')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yatra-kit-print-${campaign.campaign_slug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Kit print téléchargé')
    } catch {
      toast.error('Erreur réseau')
    }
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold text-base truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {campaign.partner_name}
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${
                campaign.active
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {campaign.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-white/55">
            {campaign.location_name} · {campaign.city} ·{' '}
            {LOCATION_TYPES.find((t) => t.value === campaign.location_type)?.label}
          </p>
          <p className="text-xs text-white/40 mt-1 font-mono">/scan/{campaign.campaign_slug}</p>
          {campaign.commission_pct !== null && (
            <p className="text-xs text-amber-300 mt-1">Commission: {campaign.commission_pct}%</p>
          )}
        </div>

        {qrDataUrl && (
          <div className="flex-shrink-0">
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-24 h-24 rounded-lg bg-white p-1"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Scans</p>
          <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {campaign.scans_total}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Conversions</p>
          <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {campaign.conversions_total}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Taux</p>
          <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {conversionRate}%
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleDownloadQR}
          disabled={!qrDataUrl}
          className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} /> QR PNG
        </button>
        <button
          onClick={handleDownloadPDF}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <Download size={14} /> Kit print PDF
        </button>
        <a
          href={`https://yatra.purama.dev/scan/${campaign.campaign_slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <ExternalLink size={14} /> Tester
        </a>
        <button
          onClick={onToggleActive}
          className="ml-auto text-xs text-white/55 hover:text-white transition"
        >
          {campaign.active ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </div>
  )
}
