// sw-v5.js — navigation: network-first; assets: cache-first
const VER = 'v5';
const RUNTIME = `blast-runtime-${VER}`;
const ASSETS  = `blast-assets-${VER}`;
const PRECACHE = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(ASSETS).then(c => c.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k===ASSETS || k===RUNTIME) ? null : caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const isHtml = req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html');
  if (isHtml) {
    // 导航请求：优先网络，失败退缓存
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // 静态资源：cache-first
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy));
        return resp;
      }))
    );
  }
});
