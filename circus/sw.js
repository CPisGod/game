const CACHE = 'circus-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.json', 'icon-192.png', 'icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 같은 출처 GET만 네트워크 우선, 오프라인이면 캐시 사용 (Firebase 등 외부 요청은 건드리지 않음)
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(r, copy));
    return res;
  }).catch(() => caches.match(r)));
});
