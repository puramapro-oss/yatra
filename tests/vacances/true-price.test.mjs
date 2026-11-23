import test from 'node:test'
import assert from 'node:assert/strict'
import { computeTruePrice } from '../../src/lib/vacances/true-price.ts'

const noOptions = Object.freeze({ bagageCabine: false, bagageSoute: false, siege: false, fraisDossier: false })
const allOptions = Object.freeze({ bagageCabine: true, bagageSoute: true, siege: true, fraisDossier: true })
const fee = Object.freeze({
  transporteur: 'Compagnie de test', type_transport: 'avion',
  bagage_cabine_min_eur: 10, bagage_cabine_max_eur: 20,
  bagage_soute_min_eur: 20, bagage_soute_max_eur: 40,
  siege_min_eur: 5, siege_max_eur: 10,
  frais_dossier_min_eur: 0, frais_dossier_max_eur: 2,
  last_verified_at: '2026-01-15T10:30:00+01:00',
})
const transfer = Object.freeze({
  code_aeroport: 'TST', nom_aeroport: 'Aéroport de test', ville: 'Ville de test',
  transfert_public_eur: 12.5, transfert_public_label: 'Bus local',
  transfert_taxi_min_eur: 30.25, transfert_taxi_max_eur: 45.75,
})
const calculate = (overrides = {}) => computeTruePrice({ prixAffiche: 100, fee, options: noOptions, ...overrides })

test('le prix saisi seul reste une estimation sans grille ni vérification', () => {
  assert.deepEqual(calculate({ prixAffiche: 49.99, fee: null }), {
    breakdown: [{ label: 'Prix saisi', min: 49.99, max: 49.99 }],
    totalMin: 49.99, totalMax: 49.99, badgePrixVerifie: false,
    feeScheduleAvailable: false, feeScheduleVerifiedAt: null, missingEstimates: [],
  })
})

test('la présence d’une grille datée ne certifie jamais un tarif disponible', () => {
  const result = calculate({ options: allOptions })
  assert.equal(result.badgePrixVerifie, false)
  assert.equal(result.feeScheduleAvailable, true)
  assert.equal(result.feeScheduleVerifiedAt, '2026-01-15T09:30:00.000Z')
  assert.equal(result.totalMin, 135)
  assert.equal(result.totalMax, 172)
  assert.equal(result.breakdown.length, 5)
  assert.deepEqual(result.missingEstimates, [])
})

test('les quatre frais sélectionnés sans grille sont inconnus et non gratuits', () => {
  const result = calculate({ fee: null, options: allOptions })
  assert.deepEqual(result.missingEstimates, ['Bagage cabine', 'Bagage soute', 'Sélection de siège', 'Frais de dossier'])
  assert.deepEqual(result.breakdown, [{ label: 'Prix saisi', min: 100, max: 100 }])
  assert.equal(result.totalMin, 100)
  assert.equal(result.totalMax, 100)
  assert.equal(result.badgePrixVerifie, false)
})

test('un frais renseigné à zéro reste distinct d’un montant inconnu', () => {
  const result = calculate({
    options: { ...noOptions, fraisDossier: true },
    fee: { ...fee, frais_dossier_max_eur: 0 },
  })
  assert.deepEqual(result.breakdown[1], { label: 'Frais de dossier', min: 0, max: 0 })
  assert.deepEqual(result.missingEstimates, [])
  assert.equal(result.totalMin, 100)
  assert.equal(result.badgePrixVerifie, false)
})

test('chaque ligne est arrondie au centime avant la somme, y compris 1,005 et 10,075', () => {
  const result = calculate({
    prixAffiche: 0.105,
    fee: { ...fee, bagage_cabine_min_eur: 1.005, bagage_cabine_max_eur: 10.075 },
    options: { ...noOptions, bagageCabine: true },
    transfer: { ...transfer, transfert_public_eur: 0.105 }, transferMode: 'public',
  })
  assert.deepEqual(result.breakdown.map(({ min, max }) => [min, max]), [[0.11, 0.11], [1.01, 10.08], [0.11, 0.11]])
  assert.equal(result.totalMin, 1.23)
  assert.equal(result.totalMax, 10.3)
})

test('les erreurs binaires de 0,1 + 0,2 ne contaminent pas les totaux', () => {
  const result = calculate({
    prixAffiche: 0.1,
    fee: { ...fee, bagage_cabine_min_eur: 0.2, bagage_cabine_max_eur: 0.2 },
    options: { ...noOptions, bagageCabine: true },
  })
  assert.equal(result.totalMin, 0.3)
  assert.equal(result.totalMax, 0.3)
})

test('le transport public s’ajoute aux deux bornes, sans ajouter le taxi', () => {
  const result = calculate({ options: allOptions, transfer, transferMode: 'public' })
  assert.equal(result.totalMin, 147.5)
  assert.equal(result.totalMax, 184.5)
  assert.deepEqual(result.breakdown.at(-1), { label: 'Transfert aéroport (Bus local)', min: 12.5, max: 12.5 })
  assert.equal(result.breakdown.length, 6)
  assert.deepEqual(result.missingEstimates, [])
})

test('le taxi ajoute sa fourchette aux frais, sans ajouter le transport public', () => {
  const result = calculate({ options: allOptions, transfer, transferMode: 'taxi' })
  assert.equal(result.totalMin, 165.25)
  assert.equal(result.totalMax, 217.75)
  assert.deepEqual(result.breakdown.at(-1), { label: 'Transfert aéroport (taxi/VTC estimé)', min: 30.25, max: 45.75 })
  assert.equal(result.breakdown.length, 6)
  assert.deepEqual(result.missingEstimates, [])
})

test('un transfert public inconnu laisse le montant explicitement partiel', () => {
  const result = calculate({ transfer: { ...transfer, transfert_public_eur: null }, transferMode: 'public' })
  assert.deepEqual(result.missingEstimates, ['Transfert aéroport (Bus local)'])
  assert.equal(result.totalMin, 100)
  assert.equal(result.totalMax, 100)
  assert.equal(result.breakdown.length, 1)
})

test('un transfert gratuit connu est inclus sans certification du prix', () => {
  const result = calculate({ transfer: { ...transfer, transfert_public_eur: 0 }, transferMode: 'public' })
  assert.equal(result.breakdown.at(-1).min, 0)
  assert.equal(result.breakdown.length, 2)
  assert.deepEqual(result.missingEstimates, [])
  assert.equal(result.badgePrixVerifie, false)
})

for (const transferMode of ['public', 'taxi']) {
  test(`un transfert ${transferMode} demandé sans données est signalé`, () => {
    const result = calculate({ transfer: null, transferMode })
    assert.equal(result.missingEstimates.length, 1)
    assert.match(result.missingEstimates[0], /Transfert aéroport/)
    assert.equal(result.totalMin, 100)
    assert.equal(result.totalMax, 100)
    assert.equal(result.breakdown.length, 1)
  })
}

test('un aéroport choisi sans mode ne disparaît pas silencieusement du calcul', () => {
  const result = calculate({ transfer, transferMode: null })
  assert.deepEqual(result.missingEstimates, ['Mode du transfert aéroport non précisé'])
  assert.equal(result.breakdown.length, 1)
})

for (const [name, minimum, maximum] of [
  ['minimum absent', null, 50], ['maximum absent', 20, null],
  ['fourchette inversée', 50, 20], ['montant négatif', -1, 20], ['montant infini', 20, Infinity],
]) {
  test(`taxi : ${name} reste inconnu et ne devient pas une fourchette inventée`, () => {
    const result = calculate({
      transfer: { ...transfer, transfert_taxi_min_eur: minimum, transfert_taxi_max_eur: maximum }, transferMode: 'taxi',
    })
    assert.deepEqual(result.missingEstimates, ['Transfert aéroport (taxi/VTC estimé)'])
    assert.equal(result.totalMin, 100)
    assert.equal(result.totalMax, 100)
    assert.equal(result.breakdown.length, 1)
  })
}

for (const [name, minimum, maximum] of [
  ['NaN', NaN, 20], ['infini', 10, Infinity], ['négatif', -1, 20],
  ['absent', undefined, 20], ['null', null, 20], ['chaîne', '10', 20],
  ['inversé', 30, 20], ['inversé avant arrondi', 1.004, 1.001],
  ['dépassement numérique', Number.MAX_VALUE, Number.MAX_VALUE],
  ['somme hors entiers sûrs', 90071992547409, 90071992547409],
]) {
  test(`frais ${name} : le poste invalide est exclu et les postes valides conservés`, () => {
    const result = calculate({
      fee: { ...fee, bagage_cabine_min_eur: minimum, bagage_cabine_max_eur: maximum },
      options: { ...noOptions, bagageCabine: true, siege: true },
    })
    assert.deepEqual(result.missingEstimates, ['Bagage cabine'])
    assert.equal(result.totalMin, 105)
    assert.equal(result.totalMax, 110)
    assert.equal(result.breakdown.length, 2)
    assert.equal(result.badgePrixVerifie, false)
  })
}

test('un poste invalide non sélectionné ne rend pas les autres postes inconnus', () => {
  const result = calculate({ fee: { ...fee, bagage_cabine_min_eur: NaN }, options: { ...noOptions, siege: true } })
  assert.deepEqual(result.missingEstimates, [])
  assert.equal(result.totalMin, 105)
  assert.equal(result.totalMax, 110)
})

for (const prixAffiche of [NaN, Infinity, -Infinity, -0.01, 50000.01, null, '100']) {
  test(`le prix saisi invalide ${String(prixAffiche)} est rejeté`, () => {
    assert.throws(() => calculate({ prixAffiche }), { name: 'RangeError', message: /entre 0 et 50 000/ })
  })
}

test('les bornes autorisées du prix saisi restent acceptées', () => {
  assert.equal(calculate({ prixAffiche: 0 }).totalMin, 0)
  assert.equal(calculate({ prixAffiche: 50000 }).totalMax, 50000)
})

test('une date de grille absente ou illisible ne devient pas une fausse date de vérification', () => {
  for (const last_verified_at of ['', 'date inconnue', null]) {
    const result = calculate({ fee: { ...fee, last_verified_at } })
    assert.equal(result.feeScheduleAvailable, true)
    assert.equal(result.feeScheduleVerifiedAt, null)
    assert.equal(result.badgePrixVerifie, false)
  }
})
