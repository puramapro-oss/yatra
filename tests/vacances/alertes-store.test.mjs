import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTypedModule, fakeDb, hasCall } from './module-harness.mjs'

const { createWatchStore } = loadTypedModule('src/lib/vacances/alertes-store.ts')
const signal = new AbortController().signal
const offer = { titre: 'Paris Rome 99 €', extrait: '99 €', url: 'https://example.com/rome', prix_detecte_eur: 99, destination_matched: 'Rome', published_date: '2026-11-23', source_score: 0.9 }
const existing = { ...offer, url: 'https://example.com/known' }

test('enregistrement : doublon URL actualisé et seuls nouveaux retours comptés comme insertions', async () => {
  let calls = 0
  const f = fakeDb((query) => {
    const upsert = query.calls.find((call) => call.method === 'upsert')
    assert.equal(upsert.args[1].onConflict, 'url')
    assert.ok(hasCall(query, 'abortSignal', signal))
    calls++
    if (calls === 1) {
      assert.equal(upsert.args[1].ignoreDuplicates, true)
      return { data: [{ ...offer, id: 'new', created_at: '2026-11-23' }], error: null }
    }
    assert.deepEqual(upsert.args[0], [existing])
    return { data: [{ ...existing, id: 'known', created_at: '2026-11-22' }], error: null }
  })
  const output = await createWatchStore(f.db).save([offer, existing], signal)
  assert.equal(output.inserted, 1)
  assert.equal(output.deals.length, 2)
})

test('écriture partielle : insertions réussies conservées dans le bilan si l’actualisation échoue', async () => {
  let calls = 0
  const f = fakeDb(() => ++calls === 1
    ? { data: [{ ...offer, id: 'new', created_at: '2026-11-23' }], error: null }
    : { data: null, error: { message: 'write failed' } })
  const output = await createWatchStore(f.db).save([offer, existing], signal)
  assert.equal(output.inserted, 1)
  assert.equal(output.deals.length, 1)
  assert.equal(output.failed, true)
})

test('notifications : contrainte existante utilisée et retours réellement insérés comptés', async () => {
  const row = { user_id: 'u1', config_id: 'c1', deal_id: 'd1' }
  const f = fakeDb((query) => {
    assert.equal(query.table, 'vacances_alert_notifications')
    const upsert = query.calls.find((call) => call.method === 'upsert')
    assert.deepEqual(upsert.args, [[row], { onConflict: 'config_id,deal_id', ignoreDuplicates: true }])
    return { data: [], error: null }
  })
  assert.equal(await createWatchStore(f.db).notify([row, row], signal), 0)
})

test('chargement paginé : les configurations au-delà de 1000 ne sont pas silencieusement perdues', async () => {
  const f = fakeDb((query) => {
    if (query.table === 'vacances_destinations') return { data: [{ nom: 'Rome' }], error: null }
    const range = query.calls.find((call) => call.method === 'range').args
    return { data: range[0] === 0 ? Array.from({ length: 1000 }, (_, i) => ({ id: String(i), actif: true })) : [{ id: '1000', actif: true }], error: null }
  })
  const output = await createWatchStore(f.db).load(signal)
  assert.equal(output.configs.length, 1001)
  assert.deepEqual(output.catalogue, ['Rome'])
})
