import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { runAlertWatch, prepareFoundDeal } from '../../src/lib/vacances/alertes-watch.ts'

const now = new Date('2026-11-23T08:00:00Z')
const config = { id: 'c1', user_id: 'u1', aeroport_depart: 'Paris', destination_souhaitee: 'Rome', budget_max_eur: 100, actif: true }
const result = { title: 'Paris vers Rome 99 €', content: 'Vol Paris Rome à 99 €', url: 'https://example.com/rome?utm_source=test', score: 0.9, published_date: '2026-11-22' }

function fixture(initial = []) {
  const configs = [config]
  const deals = new Map(initial.map((deal) => [deal.url, deal]))
  const notifications = new Set()
  const store = {
    async load() { return { configs, catalogue: [] } },
    async recent() { return { deals: [...deals.values()], limited: false } },
    async save(offers) {
      let inserted = 0
      const saved = offers.map((offer) => {
        const old = deals.get(offer.url)
        if (!old) inserted++
        const deal = { ...offer, id: old?.id ?? `d${deals.size + 1}`, created_at: old?.created_at ?? now.toISOString() }
        deals.set(deal.url, deal)
        return deal
      })
      return { deals: saved, inserted }
    },
    async notify(rows) {
      const before = notifications.size
      for (const row of rows) notifications.add(`${row.config_id}:${row.deal_id}`)
      return notifications.size - before
    },
  }
  return { configs, deals, notifications, store, deps: { store, search: async () => ({ results: [result] }) } }
}

test('offre connue : nouvelle configuration notifiée, répétition et concurrence sans doublon', async () => {
  const f = fixture()
  const first = await runAlertWatch(f.deps, { now })
  assert.equal(first.status, 'ok')
  assert.equal(first.total_inserted, 1)
  assert.equal(first.total_notified, 1)
  f.configs.push({ ...config, id: 'c2', user_id: 'u2' })
  const second = await runAlertWatch(f.deps, { now })
  assert.equal(second.total_inserted, 0)
  assert.equal(second.total_saved, 1)
  assert.equal(second.total_notified, 1)
  const concurrent = await Promise.all([runAlertWatch(f.deps, { now }), runAlertWatch(f.deps, { now })])
  assert.equal(concurrent.reduce((sum, report) => sum + report.total_notified, 0), 0)
  assert.equal(f.notifications.size, 2)
})

test('une hausse de prix remplace la valeur connue avant le rapprochement', async () => {
  const f = fixture()
  await runAlertWatch(f.deps, { now })
  f.configs.push({ ...config, id: 'c2' })
  f.deps.search = async () => ({ results: [{ ...result, title: 'Paris Rome 150 €', content: 'Paris Rome à 150 €' }] })
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.total_notified, 0)
  assert.equal([...f.deals.values()][0].prix_detecte_eur, 150)
})

test('cache existant : prix historique erroné recalculé avant tout budget', async () => {
  const f = fixture([{ id: 'legacy', url: 'https://example.com/legacy', titre: 'Paris Rome 1 299,90 €', extrait: '', prix_detecte_eur: 90, published_date: '2026-11-22', created_at: now.toISOString() }])
  f.deps.search = async () => ({ results: [] })
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.total_notified, 0)
})

test('offre récente en cache rapprochée même si le fournisseur ne la renvoie plus', async () => {
  const f = fixture([{ id: 'known', url: 'https://example.com/known', titre: 'Paris Rome 99 €', extrait: '', prix_detecte_eur: 99, published_date: '2026-11-22', created_at: now.toISOString() }])
  f.deps.search = async () => ({ results: [] })
  assert.equal((await runAlertWatch(f.deps, { now })).total_notified, 1)
})

test('panne lecture : aucun succès vide', async () => {
  const f = fixture()
  f.store.load = async () => { throw new Error('DB unavailable') }
  await assert.rejects(runAlertWatch(f.deps, { now }), /DB unavailable/)
})

test('panne écriture : échec partiel déclaré et ancienne valeur non notifiée', async () => {
  const f = fixture([{ id: 'known', url: 'https://example.com/rome', titre: 'Paris Rome 99 €', extrait: '', prix_detecte_eur: 99, published_date: '2026-11-22', created_at: now.toISOString() }])
  f.store.save = async () => { throw new Error('write failed') }
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.status, 'partial')
  assert.equal(report.ok, false)
  assert.deepEqual(report.failures, ['save'])
  assert.equal(report.total_notified, 0)
})

test('panne notification explicitement comptée', async () => {
  const f = fixture()
  f.store.notify = async () => { throw new Error('write failed') }
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.status, 'partial')
  assert.deepEqual(report.failures, ['notify'])
  assert.equal(report.total_notified, 0)
})

test('timeout réellement transmis au fournisseur et réponse en échec', async () => {
  const f = fixture()
  f.deps.search = async (_, signal) => { await delay(1000, null, { signal }); return { results: [] } }
  const started = performance.now()
  const report = await runAlertWatch(f.deps, { now, searchTimeoutMs: 10 })
  assert.equal(report.status, 'error')
  assert.deepEqual(report.failures, ['search'])
  assert.ok(performance.now() - started < 500)
})

test('concurrence bornée à trois recherches même si une valeur excessive est demandée', async () => {
  const f = fixture()
  f.store.load = async () => ({ configs: [], catalogue: Array.from({ length: 9 }, (_, i) => `Ville ${i}`) })
  let pending = 0
  let maximum = 0
  f.deps.search = async () => {
    pending++; maximum = Math.max(maximum, pending)
    await delay(5)
    pending--
    return { results: [] }
  }
  const report = await runAlertWatch(f.deps, { now, concurrency: 99 })
  assert.equal(report.searches_completed, 9)
  assert.equal(maximum, 3)
})

test('réponse fournisseur invalide signalée sans faux résultat', async () => {
  const f = fixture()
  f.deps.search = async () => ({ results: 'malformed' })
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.status, 'error')
  assert.equal(report.total_inserted, 0)
})

test('URL identique, prix contradictoires : aucun plafond réputé satisfait', async () => {
  const f = fixture()
  f.deps.search = async () => ({ results: [result, { ...result, title: 'Paris Rome 150 €', content: '150 €' }] })
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.total_inserted, 1)
  assert.equal(report.total_notified, 0)
  assert.equal([...f.deals.values()][0].prix_detecte_eur, null)
})

test('sources périmées, futures, malformées et protocoles dangereux rejetés', () => {
  const target = { departure: 'Paris', destination: 'Rome' }
  for (const row of [null, {}, { ...result, url: 'javascript:alert(1)' },
    { ...result, published_date: '2020-01-01' }, { ...result, published_date: '2030-01-01' },
    { ...result, published_date: 'not a date' }]) assert.equal(prepareFoundDeal(row, target, now), null)
  assert.equal(prepareFoundDeal({ ...result, published_date: null }, target, now).published_date, null)
})

test('limite de couverture et cache tronqué visibles dans le bilan', async () => {
  const f = fixture()
  f.store.load = async () => ({ configs: [], catalogue: Array.from({ length: 16 }, (_, i) => `Ville ${i}`) })
  f.store.recent = async () => ({ deals: [], limited: true })
  f.deps.search = async () => ({ results: [] })
  const report = await runAlertWatch(f.deps, { now })
  assert.equal(report.status, 'partial')
  assert.equal(report.targets_deferred, 1)
  assert.equal(report.cache_limited, true)
  assert.equal(report.searches_attempted, 15)
})

test('annulation préalable : aucun appel fournisseur ou DB', async () => {
  const f = fixture()
  f.store.load = async () => { assert.fail('DB called after cancellation') }
  await assert.rejects(runAlertWatch(f.deps, { now, signal: AbortSignal.abort() }), { name: 'AbortError' })
})

test('ambiguïté persistée : aucun faux budget au passage suivant sans résultat fournisseur', async () => {
  const f = fixture()
  f.deps.search = async () => ({ results: [result, { ...result, title: 'Paris Rome 150 €', content: '150 €' }] })
  assert.equal((await runAlertWatch(f.deps, { now })).total_notified, 0)
  f.deps.search = async () => ({ results: [] })
  assert.equal((await runAlertWatch(f.deps, { now })).total_notified, 0)
})

test('variante publicitaire ancienne remplacée par le nouveau prix avant toute notification', async () => {
  const f = fixture([{ id: 'legacy', url: 'https://example.com/rome?utm_source=ig', titre: 'Paris Rome 99 €', extrait: '', prix_detecte_eur: 99, published_date: '2026-11-22', created_at: now.toISOString() }])
  f.deps.search = async () => ({ results: [{ ...result, title: 'Paris Rome 150 €', content: '150 €' }] })
  assert.equal((await runAlertWatch(f.deps, { now })).total_notified, 0)
})
