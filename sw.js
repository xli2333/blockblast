// sw.js — 简易离线缓存
const CACHE_NAME='blast-cache-v1';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME&&caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  e.respondWith(
    caches.match(req).then(hit=> hit || fetch(req).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE_NAME).then(c=>c.put(req,copy));
      return resp;
    }).catch(()=>caches.match('./')))
  );
});