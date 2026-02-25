/* service-worker.js */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `circuitjs1-app-cache-${CACHE_VERSION}`;

// Figures out the repo base path for GitHub Pages project sites.
// Examples:
// - https://user.github.io/repo/service-worker.js  -> basePath = "/repo/"
// - https://example.com/service-worker.js          -> basePath = "/"
const basePath = new URL(self.registration.scope).pathname; // always ends with "/"

// Keep paths relative to basePath (no leading slash).
const urlsToCache = [
  'about.html',
  'canvas2svg.js',
  'circuitjs.html',
  'crystal.html',
  'customfunction.html',
  'customlogic.html',
  'customtransformer.html',
  'diodecalc.html',
  'icon512.png',
  'icon128.png',
  'iframe.html',
  'lz-string.min.js',
  'manifest.json',
  // 'mexle.html', // remove unless it actually exists
  'mosfet-beta.html',
  'opampreal.html',
  'split.js',
  'subcircuits.html',
  // add more here…
].map(p => new URL(p, self.registration.scope).toString()); // absolute URLs scoped correctly

async function safeAddAll(cache, urls) {
  // cache.addAll() fails the whole install on a single 404.
  // This version tries each URL and ignores failures.
  await Promise.all(urls.map(async (url) => {
    try {
      // "cache: 'reload'" avoids getting a stale HTTP cache copy during install.
      const res = await fetch(url, { cache: 'reload' });
      if (res.ok) {
        await cache.put(url, res);
      } else {
        // Non-200 (404, 500, etc.) -> skip
        console.warn('[SW] Skip caching (bad status):', res.status, url);
      }
    } catch (err) {
      console.warn('[SW] Skip caching (fetch failed):', url, err);
    }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await safeAddAll(cache, urlsToCache);
    // Make the new SW take control sooner (optional but usually desired)
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  // Only deal with GET; leave POST/etc alone.
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    const response = await fetch(event.request);
    // Cache successful same-origin-ish GET responses.
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
