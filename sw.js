const CACHE_NAME = 'totem-v1';
const ASSETS = [
    './',
    './index.html',
    './pdf1.html',
    './pdf2.html',
    './pdf3.html',
    './pdf4.html',
    './manifest.json',
    './src/img/Recurso 10.png',
    './src/img/Recurso 2.png',
    './src/img/Recurso 3.png',
    './src/img/Recurso 4.png',
    './src/img/Recurso 5.png',
    './src/img/Recurso 6.png',
    './src/img/Recurso 8.png',
    './src/img/192.png',
    './src/img/512.png',
    './src/img/pdfs/Fatiga-1.png',
    './src/img/pdfs/Interacciones-1.png',
    './src/img/pdfs/Rash-1.png',
    './src/img/pdfs/Salud-1.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error en la instalación:', error);
            })
    );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Cache actualizado y limpio');
            return self.clients.claim();
        })
    );
});

// Estrategia de cache: Cache First, fallback to Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Cache hit
                }
                return fetch(event.request)
                    .then((response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Si falla todo, intentamos servir una página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Error de red', {
                            status: 404,
                            statusText: 'Not Found'
                        });
                    });
            })
    );
}); 