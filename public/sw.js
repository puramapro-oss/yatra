// YATRA service worker — Network First + cache fallback + offline page.
const CACHE = 'yatra-v1'
const OFFLINE = '/offline'
const PRECACHE = ['/', '/offline', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Bypass non-GET, API, auth callback
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/auth/')) return
  if (url.pathname === '/callback') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE).then((c) => c.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((c) => c || caches.match(OFFLINE)))
  )
})
