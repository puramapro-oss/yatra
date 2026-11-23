import type { AlertConfig, AlertDeal } from './alertes-types.ts'

const NUMBER = String.raw`(?:\d[\d., \u00a0\u202f]*\d|\d)`
const CURRENCY = String.raw`(?:€|euros?\b|eur\b)`
const AMOUNT = new RegExp(`(?<before>${NUMBER})\\s*${CURRENCY}|${CURRENCY}\\s*(?<after>${NUMBER})`, 'gi')

/** Parse a complete amount; never accept trailing digits of a malformed price. */
function parseAmount(value: string): number | null {
  const compact = value.trim().replace(/[\u00a0\u202f]/g, ' ')
  let canonical: string
  if (/^\d+(?:[.,]\d{1,2})?$/.test(compact)) {
    canonical = compact.replace(',', '.')
  } else if (/^\d{1,3}(?: \d{3})+(?:[.,]\d{1,2})?$/.test(compact)) {
    canonical = compact.replace(/ /g, '').replace(',', '.')
  } else if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(compact)) {
    canonical = compact.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(compact)) {
    canonical = compact.replace(/,/g, '')
  } else {
    return null
  }
  const amount = Number(canonical)
  return Number.isFinite(amount) && amount > 0 && amount <= 20000 ? amount : null
}

/** A web mention is not a bookable fare. Conflicting amounts remain unknown. */
export function extractPriceEur(text: string): number | null {
  const amounts = new Set<number>()
  for (const match of text.matchAll(AMOUNT)) {
    const before = text.slice(0, match.index).trimEnd()
    const after = text.slice((match.index ?? 0) + match[0].length)
    if (/[\d.,+\-−–]$/.test(before) || /^(?:\d|[.,]\d)/.test(after)) return null
    const context = normalize(before.split(/[.!?;:]/).at(-1) ?? '').slice(-100)
    // A rebate, deposit, instalment or ancillary fee must not become the trip price.
    if (/(?:economisez|economie de|reduction de|remise de|save|discount of)$/.test(context)) return null
    if (/\b(?:acompte|arrhes|mensualites?|echeances?|deposit|bagages?|baggage|luggage|siege|taxes?|fees?|frais)\b/.test(context)) return null
    if (/\d\s*[x×*]\s*$/i.test(before) || /\b\d+\s+(?:fois|payments?)$/.test(context)) return null
    if (/\b(?:en|in)\s+\d+\s+(?:paiements?|payments?|fois)\b/.test(context)) return null
    if (/^(?:(?:de|d) )?(?:reduction|remise|economie|cashback)\b|^(?:par |per )?(?:mois|month|mensualite)\b/.test(normalize(after))) return null
    const amount = parseAmount(match.groups?.before ?? match.groups?.after ?? '')
    if (amount === null) return null
    amounts.add(amount)
  }
  return amounts.size === 1 ? [...amounts][0] : null
}

export function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')
}

export function dealMatchesConfig(
  deal: Pick<AlertDeal, 'titre' | 'extrait' | 'prix_detecte_eur'>,
  config: Pick<AlertConfig, 'aeroport_depart' | 'destination_souhaitee' | 'budget_max_eur'>,
): boolean {
  const haystack = ` ${normalize(`${deal.titre} ${deal.extrait ?? ''}`)} `
  const destination = normalize(config.destination_souhaitee)
  const departure = normalize(config.aeroport_depart)
  if (!destination || !departure) return false
  if (!haystack.includes(` ${destination} `) || !haystack.includes(` ${departure} `)) return false
  const route = ` ${normalize(`${deal.titre} ${deal.extrait ?? ''}`.replace(/(?:→|->|⟶|⇒|–)/g, ' vers '))} `
  const forward = new RegExp(` ${departure} (?:vers|a|to) ${destination} `)
  const reverse = new RegExp(` ${destination} (?:vers|a|to) ${departure} `)
  if (reverse.test(route) && !forward.test(route)) return false
  if (config.budget_max_eur !== null) {
    if (!Number.isFinite(config.budget_max_eur) || config.budget_max_eur <= 0) return false
    const price = deal.prix_detecte_eur
    if (price === null || !Number.isFinite(price) || price <= 0 || price > config.budget_max_eur) return false
  }
  return true
}

/** Preserve meaningful query parameters; strip common advertising identifiers only. */
export function safeDealUrl(value: string): string | null {
  if (value.length > 4096) return null
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(fbclid|gclid|msclkid)$/i.test(key)) url.searchParams.delete(key)
    }
    url.searchParams.sort()
    return url.toString()
  } catch {
    return null
  }
}
