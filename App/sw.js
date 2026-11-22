const VERSION = 'veyno-v7';
const PRECACHE = ['./', 'manifest.json', 'favicon.png', 'icon-192.png', 'icon-512.png'];
const HEAVY = /\/(models|vendor\/ort)\//;
const HEAVY_CACHE = 'veyno-heavy-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== HEAVY_CACHE).map(k => caches.delete(k))))
      .then(() => caches.open(HEAVY_CACHE)).then(c => c.keys().then(reqs => Promise.all(reqs.filter(r => !HEAVY.test(new URL(r.url).pathname)).map(r => c.delete(r)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (HEAVY.test(url.pathname)) {
    e.respondWith(
      caches.open(HEAVY_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) c.put(req, res.clone()).catch(()=>{});
        return res;
      })))
    );
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone())).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./')))
  );
});
