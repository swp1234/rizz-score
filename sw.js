const CACHE_NAME = 'rizz-score-v1';
const ASSETS = [
  '/rizz-score/',
  '/rizz-score/index.html',
  '/rizz-score/css/style.css',
  '/rizz-score/js/app.js',
  '/rizz-score/js/i18n.js',
  '/rizz-score/js/locales/ko.json',
  '/rizz-score/js/locales/en.json',
  '/rizz-score/js/locales/ja.json',
  '/rizz-score/js/locales/zh.json',
  '/rizz-score/js/locales/hi.json',
  '/rizz-score/js/locales/ru.json',
  '/rizz-score/js/locales/es.json',
  '/rizz-score/js/locales/pt.json',
  '/rizz-score/js/locales/id.json',
  '/rizz-score/js/locales/tr.json',
  '/rizz-score/js/locales/de.json',
  '/rizz-score/js/locales/fr.json',
  '/rizz-score/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
