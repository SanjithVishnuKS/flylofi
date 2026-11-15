// Flylofi Service Worker for offline PWA support
const CACHE_NAME = 'flylofi-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
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

  // Cache-first for core static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
