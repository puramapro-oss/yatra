/**
 * Ambient — catalogue + recommendation logic.
 * Catalogue est seedé en DB (yatra.ambient_modes) ; cette lib aide à choisir
 * le mode idéal selon l'heure et le mode de transport.
 */

export type AmbientMode = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  carrier_hz: number
  beat_hz: number
  beat_band: string
  primary_color: string
  secondary_color: string
  ideal_time_of_day: string
  ideal_trip_mode: string | null
  emoji: string
  display_order: number
}

export type TimeOfDay = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'any'

export function timeOfDayNow(date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 14) return 'midday'
  if (h >= 14 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

/**
 * Recommande le mode optimal selon contexte.
 * Pondération : trip_mode match (60) + time_of_day match (40).
 */
export function recommendMode(
  modes: AmbientMode[],
  ctx: { tripMode?: string | null; tod?: TimeOfDay } = {},
): AmbientMode | null {
  if (modes.length === 0) return null
  const tod = ctx.tod ?? timeOfDayNow()
  let best: { mode: AmbientMode; score: number } | null = null
  for (const m of modes) {
    let score = 10 // baseline
    if (ctx.tripMode && m.ideal_trip_mode === ctx.tripMode) score += 60
    if (m.ideal_time_of_day === tod) score += 40
    if (m.ideal_time_of_day === 'any') score += 10
    if (!best || score > best.score) best = { mode: m, score }
  }
  return best?.mode ?? modes[0]
}
