import { normalize } from './alertes.ts'
import type { AlertConfig } from './alertes-types.ts'

export type SearchTarget = { departure: string | null; destination: string }

function targetKey(target: SearchTarget): string {
  return `${normalize(target.departure ?? '')}|${normalize(target.destination)}`
}

function rotate<T>(values: T[], day: number, limit: number): T[] {
  if (values.length === 0 || limit <= 0) return []
  const start = (Math.max(0, Math.floor(day)) * limit) % values.length
  return Array.from({ length: Math.min(limit, values.length) }, (_, i) => values[(start + i) % values.length])
}

/** User routes take priority. Rotation prevents a fixed first-page monopoly. */
export function buildSearchPlan(configs: AlertConfig[], catalogue: string[], now: Date, limit = 15) {
  if (!Number.isInteger(limit) || limit <= 0 || !Number.isFinite(now.getTime())) throw new Error('Plan de recherche invalide')
  const day = Math.floor(now.getTime() / 86400000)
  const routes = new Map<string, SearchTarget>()
  for (const config of configs) {
    if (!config.actif || !normalize(config.aeroport_depart) || !normalize(config.destination_souhaitee)) continue
    const target = { departure: config.aeroport_depart.trim(), destination: config.destination_souhaitee.trim() }
    routes.set(targetKey(target), target)
  }
  const active = [...routes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, target]) => target)
  const configuredDestinations = new Set(active.map((target) => normalize(target.destination)))
  const generic = [...new Set(catalogue.filter((value) => normalize(value)).map((value) => value.trim()))]
    .map((destination) => ({ departure: null, destination }))
    .filter((target) => !configuredDestinations.has(normalize(target.destination)))
  const uniqueGeneric = [...new Map(generic.map((target) => [targetKey(target), target])).entries()]
    .sort(([a], [b]) => a.localeCompare(b)).map(([, target]) => target)
  const targets = rotate(active, day, limit)
  targets.push(...rotate(uniqueGeneric, day, limit - targets.length))
  const total = active.length + uniqueGeneric.length
  return { targets, total, deferred: total - targets.length }
}

export function targetQuery(target: SearchTarget): string {
  const destination = normalize(target.destination)
  const departure = normalize(target.departure ?? '')
  return `bon plan vol promotion ${departure ? `départ "${departure}" vers` : ''} "${destination}"`
}
