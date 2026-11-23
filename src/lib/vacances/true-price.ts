/**
 * VACANCES V2.0 §6 — socle "Vrai Prix Total".
 * Estime le coût d'un trajet à partir du prix saisi + grille de frais annexes
 * connue du transporteur (yatra.vacances_fee_schedules) + transfert aéroport éventuel
 * (yatra.vacances_airport_transfers). Renvoie une fourchette (min/max), jamais un chiffre
 * unique inventé. Une grille ne prouve jamais le prix disponible à la réservation.
 */

export type FeeSchedule = {
  transporteur: string
  type_transport: 'avion' | 'train' | 'bus'
  bagage_cabine_min_eur: number
  bagage_cabine_max_eur: number
  bagage_soute_min_eur: number
  bagage_soute_max_eur: number
  siege_min_eur: number
  siege_max_eur: number
  frais_dossier_min_eur: number
  frais_dossier_max_eur: number
  last_verified_at: string
}

export type AirportTransfer = {
  code_aeroport: string
  nom_aeroport: string
  ville: string
  transfert_public_eur: number | null
  transfert_public_label: string | null
  transfert_taxi_min_eur: number | null
  transfert_taxi_max_eur: number | null
}

export type TruePriceOptions = {
  bagageCabine: boolean
  bagageSoute: boolean
  siege: boolean
  fraisDossier: boolean
}

export type TruePriceLine = { label: string; min: number; max: number }

export type TruePriceResult = {
  breakdown: TruePriceLine[]
  totalMin: number
  totalMax: number
  /** Conservé pour les consommateurs existants ; ce calcul ne vérifie aucun tarif live. */
  badgePrixVerifie: boolean
  feeScheduleAvailable: boolean
  feeScheduleVerifiedAt: string | null
  missingEstimates: string[]
}

function cents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  const [coefficient, exponent = '0'] = value.toString().split('e')
  const rounded = Math.round(Number(`${coefficient}e${Number(exponent) + 2}`))
  return Number.isSafeInteger(rounded) ? rounded : null
}

export function computeTruePrice(params: {
  prixAffiche: number
  fee: FeeSchedule | null
  options: TruePriceOptions
  transfer?: AirportTransfer | null
  transferMode?: 'public' | 'taxi' | null
}): TruePriceResult {
  const { prixAffiche, fee, options, transfer, transferMode } = params
  const base = cents(prixAffiche)
  if (base === null || prixAffiche > 50000) {
    throw new RangeError('Le prix affiché doit être un nombre entre 0 et 50 000 €.')
  }
  const breakdown: TruePriceLine[] = [{ label: 'Prix saisi', min: base / 100, max: base / 100 }]
  const missingEstimates: string[] = []
  let totalMinCents = base
  let totalMaxCents = base

  function addEstimate(label: string, minimum: unknown, maximum: unknown) {
    const min = cents(minimum)
    const max = cents(maximum)
    if (min === null || max === null || (minimum as number) > (maximum as number)
      || !Number.isSafeInteger(totalMinCents + min) || !Number.isSafeInteger(totalMaxCents + max)) {
      missingEstimates.push(label)
      return
    }
    breakdown.push({ label, min: min / 100, max: max / 100 })
    totalMinCents += min
    totalMaxCents += max
  }

  if (options.bagageCabine) addEstimate('Bagage cabine', fee?.bagage_cabine_min_eur, fee?.bagage_cabine_max_eur)
  if (options.bagageSoute) addEstimate('Bagage soute', fee?.bagage_soute_min_eur, fee?.bagage_soute_max_eur)
  if (options.siege) addEstimate('Sélection de siège', fee?.siege_min_eur, fee?.siege_max_eur)
  if (options.fraisDossier) addEstimate('Frais de dossier', fee?.frais_dossier_min_eur, fee?.frais_dossier_max_eur)

  if (transferMode === 'public') {
    addEstimate(`Transfert aéroport (${transfer?.transfert_public_label || 'transport public'})`,
      transfer?.transfert_public_eur, transfer?.transfert_public_eur)
  } else if (transferMode === 'taxi') {
    addEstimate('Transfert aéroport (taxi/VTC estimé)', transfer?.transfert_taxi_min_eur, transfer?.transfert_taxi_max_eur)
  } else if (transfer) {
    missingEstimates.push('Mode du transfert aéroport non précisé')
  }

  const verifiedAt = fee?.last_verified_at ? Date.parse(fee.last_verified_at) : NaN
  return {
    breakdown,
    totalMin: totalMinCents / 100,
    totalMax: totalMaxCents / 100,
    badgePrixVerifie: false,
    feeScheduleAvailable: fee !== null,
    feeScheduleVerifiedAt: Number.isFinite(verifiedAt) ? new Date(verifiedAt).toISOString() : null,
    missingEstimates,
  }
}
