import 'server-only'
import type { createClient } from '@/lib/supabase/server'
import type { AlertConfig, AlertNotification, AlertsData } from './alertes-types'
import { dealMatchesConfig, extractPriceEur, safeDealUrl } from './alertes'

export async function readAlerts(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<AlertsData> {
  const signal = AbortSignal.timeout(10000)
  const [configs, notifications] = await Promise.all([
    supabase.from('vacances_alert_configs')
      .select('id,aeroport_depart,destination_souhaitee,budget_max_eur,actif,created_at')
      .eq('user_id', userId).eq('actif', true).order('created_at', { ascending: false }).abortSignal(signal),
    supabase.from('vacances_alert_notifications')
      .select('id,config_id,created_at,deal:vacances_deals_found(id,titre,url,extrait,prix_detecte_eur,destination_matched,published_date,created_at)')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(100).abortSignal(signal),
  ])
  if (configs.error || notifications.error) throw new Error('Lecture des alertes indisponible')
  const activeConfigs = (configs.data ?? []) as AlertConfig[]
  const activeById = new Map(activeConfigs.map((config) => [config.id, config]))
  const items = (notifications.data ?? []) as unknown as AlertNotification[]
  const normalized = items.map((item) => ({ ...item, deal: item.deal ? {
    ...item.deal, url: safeDealUrl(item.deal.url) ?? '',
    prix_detecte_eur: item.deal.prix_detecte_eur === null ? null : extractPriceEur(`${item.deal.titre}\n${item.deal.extrait ?? ''}`),
  } : null }))
  const pricesByUrl = new Map<string, number | null>()
  for (const item of normalized) {
    if (!item.deal?.url) continue
    const { url, prix_detecte_eur: price } = item.deal
    if (pricesByUrl.has(url) && pricesByUrl.get(url) !== price) pricesByUrl.set(url, null)
    else if (!pricesByUrl.has(url)) pricesByUrl.set(url, price)
  }
  const checked = normalized.map((item) => ({ ...item, deal: item.deal ? {
    ...item.deal, prix_detecte_eur: pricesByUrl.get(item.deal.url) ?? null,
  } : null })).filter((item) => {
    const config = activeById.get(item.config_id)
    return config && item.deal && safeDealUrl(item.deal.url) && dealMatchesConfig(item.deal, config)
  })
  return { configs: activeConfigs, notifications: checked }
}
