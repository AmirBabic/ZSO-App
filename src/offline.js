export function buildPrecacheUrls({ tiles, contentRepository }) {
  const urls = new Set([
    '/',
    '/offline',
    '/assets/app.css',
    '/assets/app.js',
    '/manifest.webmanifest'
  ]);

  for (const tile of tiles.filter((candidate) => (
    candidate.offline && candidate.minimumRole === 'public'
  ))) {
    urls.add(tile.route);

    if (tile.kind === 'content') {
      for (const url of contentRepository.offlineUrls(tile)) {
        urls.add(url);
      }
    }
  }

  return [...urls];
}

export function renderServiceWorker({ cacheVersion, precacheUrls }) {
  return `
const CACHE_NAME = ${JSON.stringify(`zso-app-${cacheVersion}`)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('zso-app-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && PRECACHE_URLS.includes(url.pathname)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (
          await caches.match(request)
          || await caches.match(url.pathname)
          || await caches.match('/offline')
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
`.trimStart();
}
