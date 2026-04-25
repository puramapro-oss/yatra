/**
 * Sécurité Vivante — signalements communautaires zones dangereuses GPS.
 * Carte user-fed. Signaler = +2 trust si jugé crédible (P12+ : vote communauté).
 * Nettoyage auto via expires_at (30j par défaut).
 */

export const SAFETY_CATEGORIES = [
  'travaux',
  'eclairage',
  'voirie_degradee',
  'agression',
  'vol',
  'circulation_dangereuse',
  'autre',
] as const

export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number]

export const SAFETY_CATEGORY_LABELS: Record<SafetyCategory, string> = {
  travaux: 'Travaux / chantier',
  eclairage: 'Éclairage défaillant',
  voirie_degradee: 'Voirie dégradée',
  agression: 'Agression / harcèlement',
  vol: 'Vol / arnaque',
  circulation_dangereuse: 'Circulation dangereuse',
  autre: 'Autre',
}

export const SAFETY_CATEGORY_EMOJI: Record<SafetyCategory, string> = {
  travaux: '🚧',
  eclairage: '💡',
  voirie_degradee: '🕳️',
  agression: '⚠️',
  vol: '🚨',
  circulation_dangereuse: '🚦',
  autre: '📍',
}

export const SAFETY_SEVERITIES = ['info', 'warning', 'danger'] as const
export type SafetySeverity = (typeof SAFETY_SEVERITIES)[number]

export const SAFETY_SEVERITY_LABELS: Record<SafetySeverity, string> = {
  info: 'Information',
  warning: 'Attention',
  danger: 'Danger',
}

export const SAFETY_SEVERITY_COLORS: Record<SafetySeverity, string> = {
  info: 'cyan',
  warning: 'amber',
  danger: 'red',
}

/**
 * Cluster signalements proches (<50m) pour éviter affichage 30 pins au même endroit.
 * Renvoie un signal "hub" avec count + pire severity.
 */
export type SafetyReport = {
  id: string
  user_id: string
  category: SafetyCategory
  severity: SafetySeverity
  lat: number
  lon: number
  description: string
  status: 'active' | 'resolved' | 'dismissed'
  upvotes: number
  downvotes: number
  expires_at: string
  created_at: string
}

export type SafetyCluster = {
  id: string
  lat: number
  lon: number
  count: number
  severity: SafetySeverity
  categories: SafetyCategory[]
  reports: SafetyReport[]
}

const CLUSTER_RADIUS_M = 50

function distM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lon - a.lon) * Math.PI) / 180
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

const SEVERITY_RANK: Record<SafetySeverity, number> = { info: 1, warning: 2, danger: 3 }

export function clusterReports(reports: SafetyReport[]): SafetyCluster[] {
  const clusters: SafetyCluster[] = []
  for (const r of reports) {
    let placed = false
    for (const c of clusters) {
      if (distM({ lat: r.lat, lon: r.lon }, { lat: c.lat, lon: c.lon }) <= CLUSTER_RADIUS_M) {
        c.reports.push(r)
        c.count = c.reports.length
        if (!c.categories.includes(r.category)) c.categories.push(r.category)
        if (SEVERITY_RANK[r.severity] > SEVERITY_RANK[c.severity]) c.severity = r.severity
        // Re-centre cluster sur barycentre
        c.lat = c.reports.reduce((s, x) => s + x.lat, 0) / c.reports.length
        c.lon = c.reports.reduce((s, x) => s + x.lon, 0) / c.reports.length
        placed = true
        break
      }
    }
    if (!placed) {
      clusters.push({
        id: r.id,
        lat: r.lat,
        lon: r.lon,
        count: 1,
        severity: r.severity,
        categories: [r.category],
        reports: [r],
      })
    }
  }
  return clusters
}
