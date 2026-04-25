// YATRA service worker v2 — Network First (pages) + Stale-While-Revalidate (API GET safe) + offline fallback.
const VERSION = 'yatra-v2'
const PAGE_CACHE = `${VERSION}-pages`
const API_CACHE = `${VERSION}-api`
const STATIC_CACHE = `${VERSION}-static`
const OFFLINE = '/offline'

const PRECACHE = ['/', '/offline', '/manifest.webmanifest', '/icon.svg']

// API GET endpoints SAFE à cacher (idempotents, pas mutateurs, pas auth-state-changing)
const API_CACHEABLE_PATHS = [
  '/api/aides',
  '/api/cashback',
  '/api/humanitarian',
  '/api/gratuit',
  '/api/groups',
  '/api/ambient',
  '/api/family',
]

const API_TTL_MS = 60 * 60 * 1000 // 1h

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

function isApiCacheable(url) {
  if (!url.pathname.startsWith('/api/')) return false
  return API_CACHEABLE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + '?') || url.pathname.startsWith(p + '/'))
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone()
        cache.put(request, clone)
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    const cachedDateHeader = cached.headers.get('sw-cached-at')
    const cachedAt = cachedDateHeader ? Number(cachedDateHeader) : 0
    const isFresh = Date.now() - cachedAt < API_TTL_MS
    if (isFresh) {
      // background revalidation
      fresh.catch(() => {})
      return cached
    }
  }

  const networkResponse = await fresh
  if (networkResponse) return networkResponse
  if (cached) return cached
  return new Response(JSON.stringify({ error: 'Hors ligne et pas de cache' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      const cache = await caches.open(PAGE_CACHE)
      cache.put(request, clone)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return caches.match(OFFLINE)
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, clone)
    }
    return response
  } catch {
    return cached || new Response('', { status: 504 })
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Auth flows : pas de cache
  if (url.pathname.startsWith('/auth/') || url.pathname === '/callback') return

  // API : seules les routes "safe" sont cachées (autres bypassées)
  if (url.pathname.startsWith('/api/')) {
    if (isApiCacheable(url)) {
      event.respondWith(staleWhileRevalidate(request))
    }
    return
  }

  // Static assets (Next.js _next/static, images, fonts)
  if (
    url.pathname.startsWith('/_next/static') ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|ico|css|js|json|txt|webmanifest)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirstStatic(request))
    return
  }

  // Page navigation
  event.respondWith(networkFirstHtml(request))
})
