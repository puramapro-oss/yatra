/**
 * Validation IBAN — algorithme mod-97 ISO 13616.
 * Supporte tous formats internationaux (FR, DE, ES, BE, etc.).
 * Pas d'API externe : 100% local.
 */

const COUNTRY_LENGTH: Record<string, number> = {
  FR: 27, DE: 22, ES: 24, BE: 16, IT: 27, NL: 18, LU: 20, PT: 25, AT: 20,
  CH: 21, GB: 22, IE: 22, FI: 18, SE: 24, DK: 18, NO: 15, PL: 28, CZ: 24,
  HU: 28, MC: 27, SM: 27, AD: 24, MT: 31, CY: 28, EE: 20, LT: 20, LV: 21,
  GR: 27, IS: 26, LI: 21, RO: 24, SI: 19, SK: 24, BG: 22, HR: 21,
}

export type IbanValidation = {
  valid: boolean
  formatted?: string
  country?: string
  last4?: string
  error?: string
}

/** Normalise (espaces retirés + uppercase). */
function normalize(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}

/** Convertit chaque lettre A-Z en nombre 10-35 (A=10, B=11, …, Z=35). */
function letterToDigits(s: string): string {
  let out = ''
  for (const c of s) {
    if (/[0-9]/.test(c)) {
      out += c
    } else if (/[A-Z]/.test(c)) {
      out += String(c.charCodeAt(0) - 55)
    } else {
      return '' // invalid char
    }
  }
  return out
}

/** Calcule mod 97 sur une chaîne de chiffres très longue (sans BigInt). */
function mod97(numStr: string): number {
  let rem = 0
  for (const c of numStr) {
    rem = (rem * 10 + Number(c)) % 97
  }
  return rem
}

/** Valide un IBAN. Retourne objet structuré pour UI (formatted = format display). */
export function validateIban(input: string): IbanValidation {
  const iban = normalize(input)
  if (!iban) return { valid: false, error: 'IBAN vide' }
  if (iban.length < 15 || iban.length > 34) {
    return { valid: false, error: 'Longueur IBAN invalide' }
  }
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
    return { valid: false, error: 'Format IBAN invalide' }
  }

  const country = iban.slice(0, 2)
  const expected = COUNTRY_LENGTH[country]
  if (expected && iban.length !== expected) {
    return { valid: false, error: `IBAN ${country} doit faire ${expected} caractères` }
  }

  // Permutation ISO 13616 : déplacer les 4 premiers chars à la fin
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const digits = letterToDigits(rearranged)
  if (!digits) return { valid: false, error: 'Caractères invalides' }
  const remainder = mod97(digits)
  if (remainder !== 1) {
    return { valid: false, error: 'Numéro de contrôle invalide' }
  }

  // Format affichage : groupes de 4
  const formatted = iban.match(/.{1,4}/g)?.join(' ') ?? iban
  return {
    valid: true,
    formatted,
    country,
    last4: iban.slice(-4),
  }
}
