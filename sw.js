// sw.js — Network-First for navigation + Cache-First for assets
const CACHE_VERSION = 'v4';              // ← 改这个版本号即可强制刷新
const RUNTIME_CACHE = `blast-runtime-${CACHE_VERSION}`;
const ASSET_CACHE   = `blast-assets-${CACHE_VERSION}`;

// 仅把静态资源放进预缓存（不预缓存 index.html）
const ASSETS = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(ASSET_CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === ASSET_CACHE || k === RUNTIME_CACHE) ? null : caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 对“导航请求”（index.html、/、带任何 ? 的路径）使用 Network-First，避免旧 HTML 卡死
self.addEventListener('fetch', (e) => {
  const req = e.request;

  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // 其它请求（静态资源）走 Cache-First
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
        return resp;
      });
    })
  );
});
