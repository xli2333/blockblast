// sw-v14.js — navigation: network-first; assets: cache-first
const VER = 'v14';
const RUNTIME = `blast-runtime-${VER}`;
const ASSETS  = `blast-assets-${VER}`;
const PRECACHE = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(ASSETS)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k =>
        (k === ASSETS || k === RUNTIME) ? null : caches.delete(k)
      ))
    ).then(() => self.clients.claim())
  );
});

// HTML/导航：network-first（确保 index.html 最新）；其他：cache-first
self.addEventListener('fetch', e => {
  const req = e.request;
  const isHtml = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy));
        return resp;
      }).catch(() =>
        caches.match(req).then(hit => hit || caches.match('./index.html'))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy));
        return resp;
      });
    })
  );
});
