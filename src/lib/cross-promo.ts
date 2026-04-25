/**
 * Cross-promo — bannières natives entre apps Purama.
 * Sélection : 1) priorité descendante, 2) random parmi top 6, 3) max 2/page.
 * Stats : views (côté serveur impression) + clicks (côté serveur via /api/cross-promo/click).
 */

export type CrossPromo = {
  id: string
  source_app: string
  target_app: string
  headline: string
  body: string
  emoji: string | null
  cta_label: string
  deeplink: string
  category: string
  active: boolean
  priority: number
  views: number
  clicks: number
}

export function pickPromos(promos: CrossPromo[], count: number = 2): CrossPromo[] {
  const active = promos.filter((p) => p.active).sort((a, b) => b.priority - a.priority)
  const top = active.slice(0, Math.min(active.length, 6))
  const shuffled = [...top].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function trackImpression(promoId: string): void {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return
  try {
    navigator.sendBeacon('/api/cross-promo/track', JSON.stringify({ promo_id: promoId, type: 'view' }))
  } catch {
    // ignore
  }
}
