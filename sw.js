/* Service Worker — Recettes Checklists
 * Strategy:
 *  - Precache app shell (mini-moelleux.html, /, manifest)
 *  - cache-first for same-origin GET
 *  - stale-while-revalidate for Google Fonts (separate long-TTL cache)
 *  - bypass everything else
 */

const APP_CACHE   = 'recipes-cache-v1';
const FONTS_CACHE = 'recipes-fonts-v1';

const PRECACHE_URLS = [
  './',
  './mini-moelleux.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      // Use addAll with a fallback per-URL to avoid total failure if one 404s
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([APP_CACHE, FONTS_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

const isFontRequest = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

// stale-while-revalidate for fonts
const swrFonts = async (request) => {
  const cache = await caches.open(FONTS_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  }).catch(() => null);
  return cached || network || new Response('', { status: 504, statusText: 'Offline' });
};

// cache-first for same-origin
const cacheFirst = async (request) => {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    // Last-resort offline fallback: serve the app shell for navigations
    if (request.mode === 'navigate') {
      const shell = await cache.match('./mini-moelleux.html')
        || await cache.match('./');
      if (shell) return shell;
    }
    throw err;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (isFontRequest(url)) {
    event.respondWith(swrFonts(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Otherwise: let the browser handle it.
});
