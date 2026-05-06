// Loretto Scarpa · Service Worker
// Estratégia: cache-first para o shell do hub, network-first para tudo o resto.

const CACHE = 'loretto-central-v10';
const SHELL = [
  './',
  './index.html',
  './ASSINATURA_HORIZONTAL_10.png',
  './SI_MBOLO_10.png'
];

// Install: pré-cacheia o shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first para mesma origem; passa direto para outras origens (dashboards)
self.addEventListener('fetch', event => {
  const req = event.request;

  // Só faz cache de GET na mesma origem
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // dashboards externos passam direto

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Atualiza cache em background
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
