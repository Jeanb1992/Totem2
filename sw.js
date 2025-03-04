const CACHE_NAME = 'totem-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/pdf1.html',
    '/pdf2.html',
    '/pdf3.html',
    '/pdf4.html',
    '/manifest.json',
    '/src/img/Recurso 10.png',
    '/src/img/Recurso 2.png',
    '/src/img/Recurso 3.png',
    '/src/img/Recurso 4.png',
    '/src/img/Recurso 5.png',
    '/src/img/Recurso 6.png',
    '/src/img/192.png',
    '/src/img/512.png',
    '/src/img/pdfs/Fatiga-1.png',
    '/src/img/pdfs/Interacciones-1.png',
    '/src/img/pdfs/Rash-1.png',
    '/src/img/pdfs/Salud-1.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
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
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Estrategia de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, la guardamos en cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentamos recuperar de cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // Si no está en cache y no hay red, mostramos una página de fallback
                        if (event.request.mode === 'navigate') {
                            return new Response('¡Ups! Parece que no hay conexión.', {
                                headers: { 'Content-Type': 'text/html' }
                            });
                        }
                        return new Response('Error de red');
                    });
            })
    );
}); 