import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(path.join(root, 'package.json'))

/** Execute actual route/helper source with isolated boundary adapters; no live services. */
export function loadTypedModule(relative, overrides = {}) {
  const cache = new Map()
  function load(filename) {
    const resolved = [filename, `${filename}.ts`, `${filename}.tsx`, path.join(filename, 'index.ts')].find((name) => fs.existsSync(name) && fs.statSync(name).isFile())
    if (!resolved) throw new Error(`Missing module: ${filename}`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const module = { exports: {} }
    cache.set(resolved, module)
    const output = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      fileName: resolved, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    function scopedRequire(specifier) {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier]
      if (specifier === 'server-only') return {}
      if (specifier.startsWith('@/')) return load(path.join(root, 'src', specifier.slice(2)))
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    new Function('require', 'module', 'exports', output)(scopedRequire, module, module.exports)
    return module.exports
  }
  return load(path.join(root, relative))
}

export function fakeDb(respond, user = { id: '6d621920-641a-4c24-8eb1-0d464864eb17' }) {
  const queries = []
  const db = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const query = { table, calls: [] }
      const builder = { then(resolve, reject) { queries.push(query); return Promise.resolve().then(() => respond(query)).then(resolve, reject) } }
      for (const method of ['select', 'eq', 'gte', 'order', 'limit', 'range', 'abortSignal', 'single', 'maybeSingle', 'insert', 'upsert', 'update', 'delete']) {
        builder[method] = (...args) => { query.calls.push({ method, args }); return builder }
      }
      return builder
    },
  }
  return { db, queries }
}
export const hasCall = (query, method, ...args) => query.calls.some((call) => call.method === method && args.every((arg, index) => call.args[index] === arg))
