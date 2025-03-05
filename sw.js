const CACHE_NAME = 'totem-v2';
const BASE_URL = 'https://jeanb1992.github.io/Totem2';
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
    '/src/img/Recurso 8.png',
    '/src/img/192.png',
    '/src/img/512.png',
    '/src/img/pdfs/Fatiga-1.png',
    '/src/img/pdfs/Interacciones-1.png',
    '/src/img/pdfs/Rash-1.png',
    '/src/img/pdfs/Salud-1.png'
];

// Pre-caché de recursos durante la instalación
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            self.skipWaiting(),
            caches.open(CACHE_NAME).then((cache) => {
                console.log('Pre-cacheando recursos...');
                return cache.addAll(ASSETS.map(asset => BASE_URL + asset));
            })
        ])
    );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Estrategia de cache: Cache First, luego Network
self.addEventListener('fetch', (event) => {
    // No interceptar solicitudes a otros dominios
    if (!event.request.url.startsWith(BASE_URL)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Si está en caché, lo devolvemos inmediatamente
                    return cachedResponse;
                }

                // Si no está en caché, intentamos obtenerlo de la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Verificar si la respuesta es válida
                        if (!networkResponse || networkResponse.status !== 200) {
                            throw new Error('Respuesta de red no válida');
                        }

                        // Guardar una copia en caché
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Error de fetch:', error);
                        
                        // Para navegación, devolver index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match(BASE_URL + '/index.html');
                        }

                        // Para otros recursos, mostrar mensaje de error
                        return new Response(
                            'Aplicación en modo offline - Recurso no disponible',
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'text/plain',
                                    'Cache-Control': 'no-cache'
                                })
                            }
                        );
                    });
            })
    );
}); 