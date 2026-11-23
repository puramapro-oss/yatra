import test from 'node:test'
import assert from 'node:assert/strict'
import { extractPriceEur, dealMatchesConfig, safeDealUrl } from '../../src/lib/vacances/alertes.ts'
import { buildSearchPlan, targetQuery } from '../../src/lib/vacances/alertes-plan.ts'
import { alertConfigSchema } from '../../src/lib/vacances/alertes-input.ts'
import { alertConfigId } from '../../src/lib/vacances/alertes-identity.ts'

for (const [input, expected] of [
  ['Paris Rome : 49 €.', 49], ['299.99 EUR', 299.99], ['299,99 euros', 299.99],
  ['1 299,90 €', 1299.9], ['1\u202f299 €', 1299], ['1\u00a0299,90 EUR', 1299.9],
  ['1.299,90 €', 1299.9], ['EUR 1,299.90', 1299.9], ['20 000 €', 20000],
  ['Paris Rome 99 € ; encore 99 euros dans le titre', 99],
  ['-50 €', null], ['−50 €', null], ['€ -50', null], ['0 €', null], ['20001 €', null],
  ['1,2,3 €', null], ['1 29 €', null], ['20.0000 €', null], ['1234.567 €', null],
  ['Économisez 500 € sur un séjour à 1 500 €', null], ['Économisez 50 €', null],
  ['Paris 99 € ou 150 €', null], ['99 dollars', null], ['Sans prix', null],
]) test(`prix : ${JSON.stringify(input)}`, () => assert.equal(extractPriceEur(input), expected))

const config = { id: 'c1', user_id: 'u1', aeroport_depart: 'Paris', destination_souhaitee: 'Rome', budget_max_eur: 100, actif: true }
const deal = { titre: 'Paris → Rome : 99 €', extrait: null, prix_detecte_eur: 99 }
test('rapprochement : départ, destination, accents et plafond inclusif', () => {
  assert.equal(dealMatchesConfig(deal, config), true)
  assert.equal(dealMatchesConfig({ ...deal, prix_detecte_eur: 100 }, config), true)
  assert.equal(dealMatchesConfig({ ...deal, titre: 'PARIS vers RôMe' }, config), true)
  assert.equal(dealMatchesConfig({ ...deal, titre: 'Une promenade à Paris' }, config), false)
  assert.equal(dealMatchesConfig({ ...deal, titre: 'Lyon vers Rome' }, config), false)
  assert.equal(dealMatchesConfig({ ...deal, titre: 'Rome à petit prix' }, config), false)
  assert.equal(dealMatchesConfig({ ...deal, prix_detecte_eur: null }, config), false)
  assert.equal(dealMatchesConfig({ ...deal, prix_detecte_eur: 100.01 }, config), false)
  assert.equal(dealMatchesConfig({ ...deal, prix_detecte_eur: NaN }, config), false)
  assert.equal(dealMatchesConfig({ ...deal, prix_detecte_eur: null }, { ...config, budget_max_eur: null }), true)
})

test('URL : protocole sûr, déduplication publicitaire, paramètres métier conservés', () => {
  assert.equal(safeDealUrl('javascript:alert(1)'), null)
  assert.equal(safeDealUrl('data:text/html,hello'), null)
  assert.equal(safeDealUrl('https://user:secret@example.com/'), null)
  assert.equal(safeDealUrl('invalid'), null)
  assert.equal(safeDealUrl('https://example.com/deal?utm_source=ig&date=2026-12-01&fbclid=123&adults=2#details'),
    'https://example.com/deal?adults=2&date=2026-12-01')
})

test('la préférence utilisateur ne disparaît pas derrière quinze destinations du catalogue', () => {
  const plan = buildSearchPlan([config], Array.from({ length: 15 }, (_, i) => `Lieu ${i}`), new Date('2026-11-23T08:00:00Z'))
  assert.deepEqual(plan.targets[0], { departure: 'Paris', destination: 'Rome' })
  assert.equal(plan.targets.length, 15)
  assert.equal(plan.deferred, 1)
  assert.match(targetQuery(plan.targets[0]), /départ "paris" vers "rome"/)
})

test('rotation quotidienne : chaque itinéraire apparaît et les doublons normalisés sont fusionnés', () => {
  const configs = Array.from({ length: 31 }, (_, i) => ({ ...config, id: `c${i}`, destination_souhaitee: `Ville ${i}` }))
  const seen = new Set()
  for (let day = 1; day <= 3; day++) {
    const plan = buildSearchPlan(configs, [], new Date(`2026-11-0${day}T08:00:00Z`))
    for (const target of plan.targets) seen.add(target.destination)
  }
  assert.equal(seen.size, 31)
  const plan = buildSearchPlan([config, { ...config, destination_souhaitee: '  RÔME  ' }], ['ROME', 'Rome'], new Date())
  assert.equal(plan.total, 1)
})

test('validation : espaces, centimes, absence de budget et bornes', () => {
  assert.deepEqual(alertConfigSchema.parse({ aeroport_depart: '  Paris   CDG ', destination_souhaitee: ' Rome ', budget_max_eur: 100.01 }), {
    aeroport_depart: 'Paris CDG', destination_souhaitee: 'Rome', budget_max_eur: 100.01,
  })
  for (const input of [0, -1, 20000.01, 12.345, Infinity, NaN, '100']) {
    assert.equal(alertConfigSchema.safeParse({ ...config, budget_max_eur: input }).success, false)
  }
  assert.equal(alertConfigSchema.safeParse({ ...config, destination_souhaitee: '   ' }).success, false)
  assert.equal(alertConfigSchema.safeParse({ ...config, budget_max_eur: null }).success, true)
})

test('identité : création concurrente stable, isolée par utilisateur et budget', () => {
  const user = '6d621920-641a-4c24-8eb1-0d464864eb17'
  const id = alertConfigId(user, config)
  assert.match(id, /^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/)
  assert.equal(id, alertConfigId(user, { ...config, aeroport_depart: ' PARIS ', destination_souhaitee: 'RôME' }))
  assert.notEqual(id, alertConfigId('7d621920-641a-4c24-8eb1-0d464864eb17', config))
  assert.notEqual(id, alertConfigId(user, { ...config, budget_max_eur: 99 }))
})

for (const text of [
  'Paris Rome : paiement en 4 x 49 €', 'Paris Rome : paiement en 4×49 €',
  'Paris Rome : en 4 paiements de 49 €',
  'Paris Rome : acompte de réservation 49 €', 'Paris Rome : bagage cabine à 20 €',
  'Paris Rome : 50 € de réduction', 'Paris Rome : 50 € par mois',
]) test(`montant partiel jamais traité comme prix du trajet : ${text}`, () => assert.equal(extractPriceEur(text), null))

test('trajet inverse explicite rejeté, sens demandé conservé', () => {
  for (const titre of ['Vol direct de Rome à Paris : 99 €', 'Rome → Paris 99 €', 'Rome to Paris 99 €']) {
    assert.equal(dealMatchesConfig({ ...deal, titre }, config), false)
  }
  assert.equal(dealMatchesConfig({ ...deal, titre: 'Paris → Rome 99 €' }, config), true)
})
