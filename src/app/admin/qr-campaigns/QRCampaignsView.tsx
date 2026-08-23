'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, QrCode, Download, ExternalLink } from 'lucide-react'
import QRCodeLib from 'qrcode'
import { CreateCampaignForm } from '@/components/qr/CreateCampaignForm'

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

export function QRCampaignsView({ campaigns: initialCampaigns }: QRCampaignsViewProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [showForm, setShowForm] = useState(false)

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

      {showForm && (
        <CreateCampaignForm
          onSuccess={(campaign) => {
            setCampaigns([campaign, ...campaigns])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

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

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {campaign.partner_name}
          </h3>
          <p className="text-sm text-white/55 mt-1">
            {campaign.location_name} · {campaign.city}
          </p>
          <p className="text-xs text-white/40 font-mono mt-2">
            yatra.purama.dev/scan/{campaign.campaign_slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 rounded-lg border border-white/10" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass-soft rounded-xl p-3">
          <p className="text-2xl font-bold">{campaign.scans_total}</p>
          <p className="text-xs text-white/50">Scans</p>
        </div>
        <div className="glass-soft rounded-xl p-3">
          <p className="text-2xl font-bold">{campaign.conversions_total}</p>
          <p className="text-xs text-white/50">Conversions</p>
        </div>
        <div className="glass-soft rounded-xl p-3">
          <p className="text-2xl font-bold">{conversionRate}%</p>
          <p className="text-xs text-white/50">Taux</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {qrDataUrl && (
          <button
            onClick={handleDownloadQR}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} /> Télécharger QR
          </button>
        )}
        <a
          href={`https://yatra.purama.dev/scan/${campaign.campaign_slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
        >
          <ExternalLink size={16} /> Tester
        </a>
        <button
          onClick={onToggleActive}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            campaign.active
              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              : 'bg-white/5 text-white/55 hover:bg-white/10'
          }`}
        >
          {campaign.active ? 'Actif' : 'Inactif'}
        </button>
      </div>
    </div>
  )
}
