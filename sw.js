const CACHE_NAME = 'suivi-conso-ev-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

// Installe un service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to open cache', err);
      })
  );
});

// Met en cache et retourne les requêtes
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Cache hit - retourne la réponse
            if (response) {
                return response;
            }

            return fetch(event.request).then(
                networkResponse => {
                    // Vérifie si nous avons reçu une réponse valide
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }

                    // IMPORTANT : Clone la réponse. Une réponse est un flux
                    // et parce que nous voulons que le navigateur consomme la réponse
                    // ainsi que le cache consommant la réponse, nous devons
                    // la cloner pour avoir deux flux.
                    const responseToCache = networkResponse.clone();
                    
                    // Ne met en cache que les requêtes GET.
                    if(event.request.method !== 'GET') {
                        return networkResponse;
                    }

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }
            );
        })
    );
});

// Met à jour un service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});