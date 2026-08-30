// Loretto Scarpa · Service Worker
// Estratégia: cache-first para o shell do hub, network-first para tudo o resto.

const CACHE = 'loretto-central-v12';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// Install: pré-cacheia o shell
//
// Duas coisas estavam erradas aqui. A lista pedia ASSINATURA_HORIZONTAL_10.png e
// SI_MBOLO_10.png, que não existem no repositório — e addAll é tudo-ou-nada: um 404
// derruba a gravação inteira. Com o .catch(() => {}) em volta, isso falhava calado, e
// o shell offline nunca chegou a ser cacheado uma vez sequer.
//
// Agora cada arquivo é gravado por conta própria: o que faltar não leva os outros
// junto, e o que faltou aparece no console em vez de sumir.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url =>
        cache.add(url).catch(err => console.warn('[sw] não cacheou', url, err))
      )))
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
