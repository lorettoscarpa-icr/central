// Loretto Scarpa · Service Worker
// Estratégia: cache-first para o shell do hub, network-first para tudo o resto.

const CACHE = 'loretto-central-v11';
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

// Fetch: REDE-PRIMEIRO para páginas, cache-first para o resto.
// Antes era cache-first pra tudo, inclusive o index.html: o hub e os painéis abertos dentro
// dele ficavam presos na versão em cache pra sempre — só trocando o nome do CACHE aqui é que
// atualizavam. Rede-primeiro com revalidação custa ~300 bytes (304) quando nada mudou, e
// garante que uma versão nova chegue sozinha. Sem internet, continua servindo do cache.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // dashboards externos passam direto

  const ehPagina = req.mode === 'navigate' ||
                   (req.headers.get('accept') || '').includes('text/html');

  if (ehPagina) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
