/* Service worker minimal — coquille hors-ligne pour la PWA.
 * Stratégie : network-first pour la navigation (données fraîches quand en
 * ligne, page de repli hors-ligne sinon) ; cache-first pour les assets
 * statiques. On ne met JAMAIS en cache les appels API Supabase (données
 * privées + auth) — voir CLAUDE.md §7.
 */
const CACHE = 'finances-shell-v1';
const OFFLINE_URLS = ['/offline.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ne toucher qu'aux GET same-origin.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Ne jamais mettre en cache l'auth / les routes d'API.
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) {
    return;
  }

  // Navigation : network-first avec repli hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html')),
    );
    return;
  }

  // Assets statiques : cache-first, puis réseau (et on met en cache).
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
