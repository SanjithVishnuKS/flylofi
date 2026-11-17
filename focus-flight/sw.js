// Flylofi Service Worker for offline PWA support with Network-First Fresh Updates
const CACHE_NAME = 'flylofi-v4';
const CORE_ASSETS = [
  './',
  'app.html',
  'cruise.html',
  'cruise-enhancements.css',
  'cruise-enhancements.js',
  'app-controls.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass cache for large media and server APIs
  if (url.pathname.includes('/media/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response('Network offline', { status: 503 })));
    return;
  }

  // Network-first for static assets: always get latest updates from network, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
