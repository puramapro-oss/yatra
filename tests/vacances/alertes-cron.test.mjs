import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTypedModule, fakeDb } from './module-harness.mjs'

const cronPath = 'src/app/api/cron/vacances-alertes/route.ts'
const request = (secret = 'fixture-cron') => new Request('http://localhost/api/cron/vacances-alertes', { headers: { authorization: `Bearer ${secret}` } })
const report = () => ({ ok: true, status: 'ok', failures: [], total_inserted: 1, total_saved: 2, total_notified: 1 })

function withEnvironment(run) {
  return async () => {
    const saved = { CRON_SECRET: process.env.CRON_SECRET, TAVILY_API_KEY: process.env.TAVILY_API_KEY }
    process.env.CRON_SECRET = 'fixture-cron'
    process.env.TAVILY_API_KEY = 'fixture-tavily'
    try { await run() } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  }
}

function load({ db, watch = async () => report(), create = () => db, search = async () => ({ results: [] }) } = {}) {
  return loadTypedModule(cronPath, {
    '@/lib/supabase/server': { createServiceClient: create },
    '@/lib/vacances/alertes-store': { createWatchStore: (value) => value },
    '@/lib/vacances/alertes-watch': { runAlertWatch: watch },
    '@/lib/tavily': { tavilySearch: search },
  })
}

test('cron : authentification stricte avant toute opération', withEnvironment(async () => {
  const api = load({ create: () => assert.fail('Service client accessed without authorization') })
  assert.equal((await api.GET(request('wrong'))).status, 401)
  delete process.env.CRON_SECRET
  assert.equal((await api.POST(request('undefined'))).status, 401)
}))

test('cron : fournisseur non configuré renvoie 503 sans succès vide', withEnvironment(async () => {
  delete process.env.TAVILY_API_KEY
  const api = load({ create: () => assert.fail('Service client accessed') })
  assert.equal((await api.GET(request())).status, 503)
}))

test('cron : options de recherche bornées et signal transmis', withEnvironment(async () => {
  const f = fakeDb(() => ({ data: null, error: null }))
  const signal = new AbortController().signal
  const api = load({ db: f.db,
    watch: async (deps) => { await deps.search({ departure: 'Paris', destination: 'Rome' }, signal); return report() },
    search: async (query, options) => {
      assert.match(query, /départ "paris" vers "rome"/)
      assert.equal(options.signal, signal)
      assert.equal(options.max_results, 5)
      assert.equal(options.days, 14)
      return { results: [] }
    },
  })
  const response = await api.GET(request())
  assert.equal(response.status, 200)
  assert.equal((await response.json()).total_notified, 1)
}))

test('cron : échec complet renvoie 503, échec de journalisation reste visible', withEnvironment(async () => {
  const f = fakeDb(() => ({ data: null, error: null }))
  const failed = load({ db: f.db, watch: async () => ({ ...report(), ok: false, status: 'error', failures: ['search'] }) })
  assert.equal((await failed.GET(request())).status, 503)
  const logging = fakeDb(() => ({ data: null, error: { message: 'log unavailable' } }))
  const response = await load({ db: logging.db }).GET(request())
  const data = await response.json()
  assert.equal(response.status, 200)
  assert.equal(data.status, 'partial')
  assert.equal(data.ok, false)
  assert.deepEqual(data.failures, ['log'])
  assert.equal(data.total_inserted, 1)
}))

test('cron : panne inattendue masquée derrière une erreur de service explicite', withEnvironment(async () => {
  const api = load({ create: () => { throw new Error('private internal credential path') } })
  const response = await api.GET(request())
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /private|credential/)
}))
