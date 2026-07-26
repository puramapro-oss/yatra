/**
 * VACANCES V2.0 §6 — socle "Vrai Prix Total".
 * Calcule le coût réel d'un trajet à partir du prix affiché + grille de frais annexes
 * connue du transporteur (yatra.vacances_fee_schedules) + transfert aéroport éventuel
 * (yatra.vacances_airport_transfers). Renvoie une fourchette (min/max), jamais un chiffre
 * unique inventé — les frais annexes varient selon route/saison/moment de réservation.
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
  badgePrixVerifie: boolean
}

export function computeTruePrice(params: {
  prixAffiche: number
  fee: FeeSchedule | null
  options: TruePriceOptions
  transfer?: AirportTransfer | null
  transferMode?: 'public' | 'taxi' | null
}): TruePriceResult {
  const { prixAffiche, fee, options, transfer, transferMode } = params
  const breakdown: TruePriceLine[] = [{ label: 'Prix affiché', min: prixAffiche, max: prixAffiche }]

  if (fee) {
    if (options.bagageCabine && (fee.bagage_cabine_min_eur > 0 || fee.bagage_cabine_max_eur > 0)) {
      breakdown.push({ label: 'Bagage cabine', min: fee.bagage_cabine_min_eur, max: fee.bagage_cabine_max_eur })
    }
    if (options.bagageSoute && (fee.bagage_soute_min_eur > 0 || fee.bagage_soute_max_eur > 0)) {
      breakdown.push({ label: 'Bagage soute', min: fee.bagage_soute_min_eur, max: fee.bagage_soute_max_eur })
    }
    if (options.siege && (fee.siege_min_eur > 0 || fee.siege_max_eur > 0)) {
      breakdown.push({ label: 'Sélection de siège', min: fee.siege_min_eur, max: fee.siege_max_eur })
    }
    if (options.fraisDossier && (fee.frais_dossier_min_eur > 0 || fee.frais_dossier_max_eur > 0)) {
      breakdown.push({ label: 'Frais de dossier CB', min: fee.frais_dossier_min_eur, max: fee.frais_dossier_max_eur })
    }
  }

  if (transfer && transferMode === 'public' && transfer.transfert_public_eur != null) {
    breakdown.push({
      label: `Transfert aéroport (${transfer.transfert_public_label ?? 'transport public'})`,
      min: transfer.transfert_public_eur,
      max: transfer.transfert_public_eur,
    })
  } else if (transfer && transferMode === 'taxi' && transfer.transfert_taxi_min_eur != null && transfer.transfert_taxi_max_eur != null) {
    breakdown.push({ label: 'Transfert aéroport (taxi/VTC estimé)', min: transfer.transfert_taxi_min_eur, max: transfer.transfert_taxi_max_eur })
  }

  const totalMin = breakdown.reduce((s, l) => s + l.min, 0)
  const totalMax = breakdown.reduce((s, l) => s + l.max, 0)

  return {
    breakdown,
    totalMin: Math.round(totalMin * 100) / 100,
    totalMax: Math.round(totalMax * 100) / 100,
    badgePrixVerifie: fee !== null,
  }
}
