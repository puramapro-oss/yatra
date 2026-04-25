/**
 * Family — helpers pour codes d'invitation et formatage.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans I, O, 0, 1 (ambiguïté visuelle)

/**
 * Génère un code d'invitation famille de 6 caractères.
 * Pas cryptographique : juste mémorisable + suffisamment unique pour MVP (~10^9 combos).
 * Pour collision, l'API retry à l'INSERT en cas de conflict.
 */
export function generateInviteCode(length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function formatFamilyName(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

export function isValidInviteCode(code: string): boolean {
  return /^[A-Z2-9]{6}$/.test(code.toUpperCase())
}
