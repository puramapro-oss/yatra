import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QrCode, ArrowLeft } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { QRCampaignsView } from './QRCampaignsView'

export const dynamic = 'force-dynamic'

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

export default async function AdminQRCampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isSuperAdmin(user.email ?? null)) redirect('/dashboard')

  const svc = createServiceClient()

  // Récupérer toutes les campagnes avec leurs stats
  const { data: campaigns } = await svc
    .from('qr_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  // Pour chaque campagne, compter scans et conversions
  const campaignsWithStats: Campaign[] = await Promise.all(
    (campaigns ?? []).map(async (c) => {
      const [{ count: scansTotal }, { count: conversionsTotal }] = await Promise.all([
        svc.from('qr_scans').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id),
        svc
          .from('qr_scans')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', c.id)
          .eq('converted_to_signup', true),
      ])

      return {
        ...c,
        scans_total: scansTotal ?? 0,
        conversions_total: conversionsTotal ?? 0,
      }
    })
  )

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-white/60 hover:text-white transition text-sm">
            <ArrowLeft size={18} />
          </Link>
          <QrCode size={20} className="text-emerald-300" />
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            QR Codes Pub Transports
          </h1>
          <span className="ml-auto text-[10px] text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 uppercase tracking-wider">
            Super-admin
          </span>
        </header>

        <div className="px-6 pb-16 max-w-6xl mx-auto">
          <QRCampaignsView campaigns={campaignsWithStats} />
        </div>
      </main>
    </>
  )
}
