import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTypedModule, fakeDb, hasCall } from './module-harness.mjs'
import { alertConfigId } from '../../src/lib/vacances/alertes-identity.ts'

const user = { id: '6d621920-641a-4c24-8eb1-0d464864eb17' }
const config = { id: '9219fe35-c1ec-4ff6-9b29-dc22e97ffcf3', user_id: user.id, aeroport_depart: 'Paris', destination_souhaitee: 'Rome', budget_max_eur: 100, actif: true }
const routeFile = 'src/app/api/vacances/alertes/route.ts'
const deleteFile = 'src/app/api/vacances/alertes/[id]/route.ts'
const route = (file, db) => loadTypedModule(file, { '@/lib/supabase/server': { createClient: async () => db } })
const post = (body) => new Request('http://localhost/api/vacances/alertes', { method: 'POST', body: JSON.stringify(body) })
const deleted = () => new Request('http://localhost/api/vacances/alertes/id', { method: 'DELETE' })
const params = (id = config.id) => ({ params: Promise.resolve({ id }) })

test('GET/POST/DELETE sans session : 401 et aucune lecture de données', async () => {
  const f = fakeDb(() => assert.fail('Database accessed'), null)
  assert.equal((await route(routeFile, f.db).GET()).status, 401)
  assert.equal((await route(routeFile, f.db).POST(post(config))).status, 401)
  assert.equal((await route(deleteFile, f.db).DELETE(deleted(), params())).status, 401)
  assert.equal(f.queries.length, 0)
})

test('GET : panne DB explicitement 503, détails internes masqués', async () => {
  const f = fakeDb(() => ({ data: null, error: { message: 'secret SQL table internal' } }))
  const response = await route(routeFile, f.db).GET()
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /secret|SQL|internal/)
})

test('GET : données cloisonnées et fausses alertes historiques filtrées', async () => {
  const deal = { id: 'deal1', titre: 'Paris Rome 1 299,90 €', extrait: '', prix_detecte_eur: 90, url: 'https://example.com/deal', created_at: '2026-11-23', published_date: null, destination_matched: 'Rome' }
  const f = fakeDb((query) => ({ data: query.table === 'vacances_alert_configs' ? [config] : [{ id: 'n1', config_id: config.id, deal, created_at: '2026-11-23' }], error: null }))
  const response = await route(routeFile, f.db).GET()
  assert.equal(response.status, 200)
  assert.equal((await response.json()).notifications.length, 0)
  assert.equal(f.queries.every((query) => hasCall(query, 'eq', 'user_id', user.id)), true)
})

test('POST : valeur nettoyée et doublon existant retourné sans insertion', async () => {
  const f = fakeDb(() => ({ data: [config], error: null }))
  const response = await route(routeFile, f.db).POST(post({ ...config, aeroport_depart: ' PARIS ', destination_souhaitee: ' RôMe ' }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).existing, true)
  assert.equal(f.queries.some((query) => hasCall(query, 'insert')), false)
})

test('POST : création nouvelle 201 avec UUID déterministe et propriétaire authentifié', async () => {
  const f = fakeDb((query) => {
    const inserted = query.calls.find((call) => call.method === 'insert')
    return { data: inserted ? { ...inserted.args[0], actif: true } : [], error: null }
  })
  const response = await route(routeFile, f.db).POST(post({ ...config, user_id: 'attacker', id: 'attacker', aeroport_depart: ' Paris ' }))
  assert.equal(response.status, 201)
  const { config: created } = await response.json()
  assert.equal(created.id, alertConfigId(user.id, config))
  assert.equal(created.user_id, user.id)
  assert.equal(created.aeroport_depart, 'Paris')
})

test('POST : conflit concurrent sur la même identité retourne l’alerte existante', async () => {
  const id = alertConfigId(user.id, config)
  const f = fakeDb((query) => {
    if (hasCall(query, 'insert')) return { data: null, error: { code: '23505', message: 'duplicate key' } }
    if (hasCall(query, 'eq', 'id', id)) return { data: { ...config, id }, error: null }
    return { data: [], error: null }
  })
  const response = await route(routeFile, f.db).POST(post(config))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).existing, true)
})

test('POST : espaces seuls, budget nul et JSON invalide rejetés avant la DB', async () => {
  const f = fakeDb(() => assert.fail('Invalid body accessed DB'))
  const api = route(routeFile, f.db)
  for (const body of [{ ...config, aeroport_depart: '  ' }, { ...config, budget_max_eur: 0 }, { ...config, budget_max_eur: 1.234 }]) {
    assert.equal((await api.POST(post(body))).status, 400)
  }
  assert.equal((await api.POST(new Request('http://localhost', { method: 'POST', body: '{' }))).status, 400)
})

test('POST : panne écriture classée 503, pas une faute utilisateur 400', async () => {
  const f = fakeDb((query) => hasCall(query, 'insert') ? { data: null, error: { message: 'secret DB down' } } : { data: [], error: null })
  const response = await route(routeFile, f.db).POST(post(config))
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /secret|DB down/)
})

test('DELETE : UUID validé, filtre propriétaire, suppression répétable', async () => {
  const f = fakeDb(() => ({ data: null, error: null }))
  const api = route(deleteFile, f.db)
  assert.equal((await api.DELETE(deleted(), params('invalid'))).status, 400)
  assert.equal(f.queries.length, 0)
  for (let i = 0; i < 2; i++) assert.equal((await api.DELETE(deleted(), params())).status, 200)
  assert.ok(f.queries.every((query) => hasCall(query, 'delete') && hasCall(query, 'eq', 'id', config.id) && hasCall(query, 'eq', 'user_id', user.id)))
})

test('DELETE : panne service propagée sans exposer de message SQL', async () => {
  const f = fakeDb(() => ({ data: null, error: { message: 'private SQL failure' } }))
  const response = await route(deleteFile, f.db).DELETE(deleted(), params())
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /SQL|private/)
})

test('client partagé Tavily : signal transmis à fetch et options par défaut conservées', async () => {
  const api = loadTypedModule('src/lib/tavily.ts')
  const previousKey = process.env.TAVILY_API_KEY
  const previousFetch = globalThis.fetch
  process.env.TAVILY_API_KEY = 'fixture-key-not-a-secret'
  const controller = new AbortController()
  const signals = []
  try {
    globalThis.fetch = async (_, init) => {
      signals.push(init.signal)
      assert.equal(JSON.parse(init.body).include_answer, true)
      assert.equal(JSON.parse(init.body).max_results, 8)
      return { ok: true, json: async () => ({ results: [] }) }
    }
    await api.tavilySearch('test', { signal: controller.signal })
    await api.tavilySearch('appel existant sans option')
    assert.deepEqual(signals, [controller.signal, undefined])
  } finally {
    globalThis.fetch = previousFetch
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY
    else process.env.TAVILY_API_KEY = previousKey
  }
})

test('GET : ambiguïté mémorisée jamais recréée comme prix certain', async () => {
  const deal = { id: 'deal1', titre: 'Paris Rome 99 €', extrait: '', prix_detecte_eur: null, url: 'https://example.com/deal', created_at: '2026-11-23', published_date: null, destination_matched: 'Rome' }
  const f = fakeDb((query) => ({ data: query.table === 'vacances_alert_configs' ? [config] : [{ id: 'n1', config_id: config.id, deal, created_at: '2026-11-23' }], error: null }))
  const response = await route(routeFile, f.db).GET()
  assert.equal((await response.json()).notifications.length, 0)
})

test('POST : un ancien doublon inactif ne masque pas la configuration active', async () => {
  const f = fakeDb(() => ({ data: [{ ...config, id: 'old', actif: false }, config], error: null }))
  const response = await route(routeFile, f.db).POST(post(config))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).config.id, config.id)
  assert.equal(f.queries.some((query) => hasCall(query, 'update')), false)
})
