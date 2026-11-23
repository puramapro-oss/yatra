import { dealMatchesConfig, extractPriceEur, safeDealUrl } from './alertes.ts'
import { buildSearchPlan, type SearchTarget } from './alertes-plan.ts'
import type { AlertConfig, AlertDeal } from './alertes-types.ts'

export type WatchConfig = AlertConfig & { user_id: string }
export type FoundDeal = Omit<AlertDeal, 'id' | 'created_at'> & { source_score: number | null }
export type NotificationInsert = { user_id: string; config_id: string; deal_id: string }
export type WatchStore = {
  load: (signal: AbortSignal) => Promise<{ configs: WatchConfig[]; catalogue: string[] }>
  save: (deals: FoundDeal[], signal: AbortSignal) => Promise<{ deals: AlertDeal[]; inserted: number; failed?: boolean }>
  recent: (since: string, signal: AbortSignal) => Promise<{ deals: AlertDeal[]; limited: boolean }>
  notify: (rows: NotificationInsert[], signal: AbortSignal) => Promise<number>
}
export type WatchDependencies = {
  store: WatchStore
  search: (target: SearchTarget, signal: AbortSignal) => Promise<{ results: unknown }>
}
export type WatchOptions = { now?: Date; signal?: AbortSignal; searchTimeoutMs?: number; concurrency?: number }

const WINDOW_MS = 14 * 86400000

export function sourceIsRecent(deal: Pick<AlertDeal, 'published_date' | 'created_at'>, now: Date): boolean {
  const value = deal.published_date ?? deal.created_at
  const time = Date.parse(value)
  return Number.isFinite(time) && time >= now.getTime() - WINDOW_MS && time <= now.getTime() + 86400000
}

export function prepareFoundDeal(value: unknown, target: SearchTarget, now: Date): FoundDeal | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (typeof row.title !== 'string' || !row.title.trim() || typeof row.url !== 'string' || typeof row.content !== 'string') return null
  const url = safeDealUrl(row.url)
  if (!url) return null
  const published = typeof row.published_date === 'string' ? row.published_date : null
  if (published && !sourceIsRecent({ published_date: published, created_at: now.toISOString() }, now)) return null
  const titre = row.title.trim().slice(0, 300)
  const extrait = row.content.trim().slice(0, 1500)
  return {
    titre, url, extrait, published_date: published,
    prix_detecte_eur: extractPriceEur(`${titre}\n${extrait}`),
    destination_matched: target.destination,
    source_score: typeof row.score === 'number' && Number.isFinite(row.score) && row.score >= 0 && row.score <= 1 ? row.score : null,
  }
}

/** Bounded provider work; repository operations use the same cancellation signal. */
export async function runAlertWatch(deps: WatchDependencies, options: WatchOptions = {}) {
  const now = options.now ?? new Date()
  const signal = options.signal ?? AbortSignal.timeout(45000)
  signal.throwIfAborted()
  const { configs, catalogue } = await deps.store.load(signal)
  const active = configs.filter((config) => config.actif)
  const plan = buildSearchPlan(active, catalogue, now)
  const results: { destination: string; status: 'ok' | 'error'; deals_found: number }[] = []
  const offersByTarget: FoundDeal[][] = Array.from({ length: plan.targets.length }, () => [])
  const failures: string[] = []
  let next = 0
  let attempted = 0
  let rejected = 0
  const concurrency = Math.max(1, Math.min(3, Math.floor(options.concurrency ?? 3)))

  async function worker() {
    while (next < plan.targets.length && !signal.aborted) {
      const index = next++
      const target = plan.targets[index]
      attempted++
      try {
        const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(options.searchTimeoutMs ?? 8000)])
        const response = await deps.search(target, requestSignal)
        requestSignal.throwIfAborted()
        if (!Array.isArray(response.results)) throw new Error('Réponse fournisseur invalide')
        for (const value of response.results.slice(0, 5)) {
          const offer = prepareFoundDeal(value, target, now)
          if (offer) offersByTarget[index].push(offer)
          else rejected++
        }
        results.push({ destination: target.destination, status: 'ok', deals_found: offersByTarget[index].length })
      } catch {
        failures.push('search')
        results.push({ destination: target.destination, status: 'error', deals_found: 0 })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, plan.targets.length) }, () => worker()))

  // Stable target order wins over response timing when the same URL appears twice.
  const offers = new Map<string, FoundDeal>()
  for (const offer of offersByTarget.flat()) {
    const previous = offers.get(offer.url)
    if (!previous) offers.set(offer.url, offer)
    else if (previous.prix_detecte_eur !== offer.prix_detecte_eur) previous.prix_detecte_eur = null
  }
  let inserted = 0
  let saved = 0
  let notified = 0
  let cacheLimited = false
  const candidates = new Map<string, AlertDeal>()
  if (!signal.aborted) {
    try {
      const recent = await deps.store.recent(new Date(now.getTime() - WINDOW_MS).toISOString(), signal)
      cacheLimited = recent.limited
      for (const deal of recent.deals) {
        const url = safeDealUrl(deal.url)
        if (!sourceIsRecent(deal, now) || !url) continue
        const price = deal.prix_detecte_eur === null ? null : extractPriceEur(`${deal.titre}\n${deal.extrait ?? ''}`)
        const previous = candidates.get(url)
        if (!previous) candidates.set(url, { ...deal, url, prix_detecte_eur: price })
        else if (previous.prix_detecte_eur !== price) previous.prix_detecte_eur = null
      }
    } catch {
      failures.push('recent')
    }
  }
  // A fresh observation supersedes every legacy advertising variant, even if saving fails.
  for (const url of offers.keys()) candidates.delete(url)
  if (offers.size && !signal.aborted) {
    try {
      const output = await deps.store.save([...offers.values()], signal)
      inserted = output.inserted
      saved = output.deals.length
      if (output.failed) failures.push('save')
      for (const deal of output.deals) candidates.set(deal.url, deal)
    } catch {
      failures.push('save')
    }
  }
  const rows: NotificationInsert[] = []
  for (const deal of candidates.values()) {
    for (const config of active) {
      if (dealMatchesConfig(deal, config)) rows.push({ user_id: config.user_id, config_id: config.id, deal_id: deal.id })
    }
  }
  for (let start = 0; start < rows.length && !signal.aborted; start += 250) {
    try {
      notified += await deps.store.notify(rows.slice(start, start + 250), signal)
    } catch {
      failures.push('notify')
    }
  }
  if (signal.aborted) failures.push('deadline')
  const deferred = plan.deferred + plan.targets.length - attempted
  const completedSearches = results.filter((result) => result.status === 'ok').length
  const status = failures.length
    ? (completedSearches > 0 || saved > 0 || notified > 0 ? 'partial' : 'error')
    : (deferred > 0 || cacheLimited ? 'partial' : 'ok')
  return {
    ok: status === 'ok', status, started_at: now.toISOString(),
    total_inserted: inserted, total_saved: saved, total_notified: notified,
    searches_completed: completedSearches, searches_attempted: attempted,
    targets_total: plan.total, targets_deferred: deferred, cache_limited: cacheLimited,
    rejected_results: rejected, failures, by_destination: results,
  }
}
