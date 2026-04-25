/**
 * Concours YATRA — 3 types :
 *  - weekly_performance : top 10 score parrainages × 10 + abos × 50 + actifs × 5/jour. 6% CA.
 *      1er=2% | 2ème=1% | 3ème=0.7% | 4ème=0.5% | 5ème=0.4% | 6ème=0.3% | 7-10ème=1.1%
 *  - monthly_lottery : 10 random parmi actifs. 4% CA.
 *      1er=1.2% | 2ème=0.8% | 3ème=0.6% | 4ème=0.4% | 5-10ème=1%
 *  - quarterly_special : 10 gagnants thème app. Jury vote IA.
 */

export type ContestType = 'weekly_performance' | 'monthly_lottery' | 'quarterly_special'

export const CONTEST_LABELS: Record<ContestType, string> = {
  weekly_performance: 'Classement hebdo',
  monthly_lottery: 'Tirage mensuel',
  quarterly_special: 'Concours spécial',
}

export const CONTEST_EMOJI: Record<ContestType, string> = {
  weekly_performance: '🏆',
  monthly_lottery: '🎰',
  quarterly_special: '✨',
}

/**
 * Distribution % du pool selon rang.
 * Sum = 6% du CA pour weekly, 4% pour monthly.
 * Les 7-10ème reçoivent chacun 1.1%/4 = 0.275% pour weekly et 1%/6 = 0.166% pour monthly.
 */
export function weeklyDistribution(rank: number, totalPoolEur: number): number {
  const pcts = [
    0.02 / 0.06, // 1er = 2%/6% du pool
    0.01 / 0.06, // 2ème
    0.007 / 0.06, // 3ème
    0.005 / 0.06, // 4ème
    0.004 / 0.06, // 5ème
    0.003 / 0.06, // 6ème
    (0.011 / 0.06) / 4, // 7-10ème (chacun)
    (0.011 / 0.06) / 4,
    (0.011 / 0.06) / 4,
    (0.011 / 0.06) / 4,
  ]
  const idx = rank - 1
  if (idx < 0 || idx >= pcts.length) return 0
  return Math.round(totalPoolEur * pcts[idx] * 100) / 100
}

export function monthlyDistribution(rank: number, totalPoolEur: number): number {
  const pcts = [
    0.012 / 0.04, // 1er = 1.2%/4%
    0.008 / 0.04, // 2ème
    0.006 / 0.04, // 3ème
    0.004 / 0.04, // 4ème
    (0.01 / 0.04) / 6, // 5-10ème (chacun = 1%/4% / 6)
    (0.01 / 0.04) / 6,
    (0.01 / 0.04) / 6,
    (0.01 / 0.04) / 6,
    (0.01 / 0.04) / 6,
    (0.01 / 0.04) / 6,
  ]
  const idx = rank - 1
  if (idx < 0 || idx >= pcts.length) return 0
  return Math.round(totalPoolEur * pcts[idx] * 100) / 100
}

/**
 * Lottery picker — sélectionne N gagnants pondérés par tickets.
 * Algorithme : alias method approximé via cumulatif.
 */
export function pickLotteryWinners(
  candidates: { user_id: string; tickets: number }[],
  count: number,
  rng: () => number = Math.random,
): string[] {
  if (candidates.length === 0 || count <= 0) return []
  const eligible = candidates.filter((c) => c.tickets > 0)
  if (eligible.length === 0) return []

  const N = Math.min(count, eligible.length)
  const winners = new Set<string>()
  const pool = [...eligible]

  while (winners.size < N && pool.length > 0) {
    const total = pool.reduce((s, c) => s + c.tickets, 0)
    if (total <= 0) break
    const r = rng() * total
    let cum = 0
    let pickedIdx = 0
    for (let i = 0; i < pool.length; i++) {
      cum += pool[i].tickets
      if (r <= cum) {
        pickedIdx = i
        break
      }
    }
    winners.add(pool[pickedIdx].user_id)
    pool.splice(pickedIdx, 1)
  }

  return Array.from(winners)
}

/**
 * Renvoie le début (lundi 00:00 UTC) et fin (dimanche 23:59 UTC) de la semaine en cours.
 */
export function currentWeekRange(now: Date = new Date()): { start: string; end: string } {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  // 0=Sun, 1=Mon ... 6=Sat
  const dow = d.getUTCDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setUTCDate(d.getUTCDate() + diff)
  const start = d.toISOString().slice(0, 10)
  d.setUTCDate(d.getUTCDate() + 6)
  const end = d.toISOString().slice(0, 10)
  return { start, end }
}

export function previousWeekRange(now: Date = new Date()): { start: string; end: string } {
  const ref = new Date(now)
  ref.setUTCDate(ref.getUTCDate() - 7)
  return currentWeekRange(ref)
}

/**
 * Renvoie début (1er du mois) et fin (dernier jour) du mois en cours UTC.
 */
export function currentMonthRange(now: Date = new Date()): { start: string; end: string } {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const start = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10)
  return { start, end }
}

export function previousMonthRange(now: Date = new Date()): { start: string; end: string } {
  const ref = new Date(now)
  ref.setUTCMonth(ref.getUTCMonth() - 1)
  return currentMonthRange(ref)
}
