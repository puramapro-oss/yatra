import 'server-only'
import type { createServiceClient } from '@/lib/supabase/server'
import type { AlertDeal } from './alertes-types'
import type { FoundDeal, WatchConfig, WatchStore } from './alertes-watch'

const DEAL_COLUMNS = 'id,titre,url,extrait,prix_detecte_eur,destination_matched,published_date,created_at'

export function createWatchStore(db: ReturnType<typeof createServiceClient>): WatchStore {
  async function loadConfigs(signal: AbortSignal) {
    const rows: WatchConfig[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from('vacances_alert_configs')
        .select('id,user_id,aeroport_depart,destination_souhaitee,budget_max_eur,actif')
        .eq('actif', true).order('id').range(offset, offset + 999).abortSignal(signal)
      if (error) throw new Error('Lecture des configurations impossible')
      rows.push(...((data ?? []) as WatchConfig[]))
      if (!data || data.length < 1000) return rows
    }
  }
  async function loadCatalogue(signal: AbortSignal) {
    const rows: string[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from('vacances_destinations').select('nom')
        .eq('active', true).order('id').range(offset, offset + 999).abortSignal(signal)
      if (error) throw new Error('Lecture du catalogue impossible')
      rows.push(...(data ?? []).map((row) => String(row.nom)))
      if (!data || data.length < 1000) return rows
    }
  }
  return {
    async load(signal) {
      const [configs, catalogue] = await Promise.all([loadConfigs(signal), loadCatalogue(signal)])
      return { configs, catalogue }
    },
    async recent(since, signal) {
      const { data, error } = await db.from('vacances_deals_found').select(DEAL_COLUMNS)
        .gte('created_at', since).order('created_at', { ascending: false }).limit(501).abortSignal(signal)
      if (error) throw new Error('Lecture des sources impossible')
      return { deals: (data ?? []).slice(0, 500) as AlertDeal[], limited: (data?.length ?? 0) > 500 }
    },
    async save(offers: FoundDeal[], signal) {
      if (offers.length === 0) return { deals: [], inserted: 0 }
      // UNIQUE(url) handles overlapping runs. Only returned rows count as inserted.
      const fresh = await db.from('vacances_deals_found').upsert(offers, { onConflict: 'url', ignoreDuplicates: true })
        .select(DEAL_COLUMNS).abortSignal(signal)
      if (fresh.error) throw new Error('Enregistrement des sources impossible')
      const inserted = (fresh.data ?? []) as AlertDeal[]
      const newUrls = new Set(inserted.map((deal) => deal.url))
      const existing = offers.filter((deal) => !newUrls.has(deal.url))
      if (existing.length === 0) return { deals: inserted, inserted: inserted.length }
      const refreshed = await db.from('vacances_deals_found').upsert(existing, { onConflict: 'url' })
        .select(DEAL_COLUMNS).abortSignal(signal)
      if (refreshed.error) return { deals: inserted, inserted: inserted.length, failed: true }
      return { deals: [...inserted, ...((refreshed.data ?? []) as AlertDeal[])], inserted: inserted.length }
    },
    async notify(rows, signal) {
      const unique = [...new Map(rows.map((row) => [`${row.config_id}:${row.deal_id}`, row])).values()]
      if (unique.length === 0) return 0
      const { data, error } = await db.from('vacances_alert_notifications')
        .upsert(unique, { onConflict: 'config_id,deal_id', ignoreDuplicates: true }).select('id').abortSignal(signal)
      if (error) throw new Error('Enregistrement des notifications impossible')
      return data?.length ?? 0
    },
  }
}
