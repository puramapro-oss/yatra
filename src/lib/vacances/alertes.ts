/**
 * VACANCES V2.0 §1 — Alertes erreurs de tarif & bons plans.
 * Veille réelle (Tavily) : jamais un prix inventé, toujours une source (URL + extrait).
 * Le matching config↔deal est un simple filtre texte + budget, pas une IA de scoring.
 */

export function extractPriceEur(text: string): number | null {
  const m = text.match(/(\d{1,3}(?:[\s.]\d{3})*|\d+)\s*(?:€|eur\b)/i)
  if (!m) return null
  const num = Number(m[1].replace(/[\s.]/g, ''))
  if (Number.isFinite(num) && num > 0 && num < 20000) return num
  return null
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function dealMatchesConfig(
  deal: { titre: string; extrait: string | null; prix_detecte_eur: number | null },
  config: { destination_souhaitee: string; budget_max_eur: number | null },
): boolean {
  const haystack = normalize(`${deal.titre} ${deal.extrait ?? ''}`)
  const destination = normalize(config.destination_souhaitee)
  if (!destination || !haystack.includes(destination)) return false
  if (config.budget_max_eur != null && deal.prix_detecte_eur != null && deal.prix_detecte_eur > config.budget_max_eur) {
    return false
  }
  return true
}
