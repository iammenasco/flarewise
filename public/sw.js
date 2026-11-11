/* Flarewise offline shell + runtime asset cache */
const CACHE = 'flarewise-v6'
// Catalog/data must not be precached: cache-first left the SPA on a stale
// itemCount after ingest (main had 103, UI still showed an older filtered list).
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './favicon-dark.svg',
  './favicon.png',
  './og.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
]
const NETWORK_FIRST = new Set([
  '/catalog.json',
  '/schema.json',
  '/rubric.json',
  '/build-info.json',
  '/llms.txt',
])

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => undefined),
        ),
      ),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => cached)

      // App shell + catalog/data: network-first so ingest/deploy shows up.
      if (request.mode === 'navigate' || NETWORK_FIRST.has(url.pathname)) {
        return network.then((response) => response || cached || cache.match('./index.html'))
      }
      return cached || network
    }),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
