import { generateInviteCode } from '@/lib/family'

/** VACANCES V2.0 §8 — Cagnotte yatrage. Réutilise le générateur de code de lib/family.ts (même charset, longueur 8). */
export function generateCagnotteCode(): string {
  return generateInviteCode(8)
}

export function isValidCagnotteCode(code: string): boolean {
  return /^[A-Z2-9]{8}$/.test(code.toUpperCase())
}

export function progressPct(montantActuel: number, objectif: number): number {
  if (objectif <= 0) return 0
  return Math.min(100, Math.round((montantActuel / objectif) * 100))
}
