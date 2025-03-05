const CACHE_NAME = 'totem-v2';
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

// Pre-caché de recursos durante la instalación
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            // Forzar la activación inmediata
            self.skipWaiting(),
            // Abrir y cachear todos los recursos
            caches.open(CACHE_NAME).then((cache) => {
                console.log('Pre-cacheando recursos...');
                return cache.addAll(ASSETS).then(() => {
                    console.log('Todos los recursos han sido cacheados');
                }).catch((error) => {
                    console.error('Error cacheando recursos:', error);
                });
            })
        ])
    );
});

// Limpiar caches antiguos durante la activación
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Tomar control inmediatamente
            self.clients.claim(),
            // Limpiar caches antiguos
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ]).then(() => {
            console.log('Service Worker activo y controlando la aplicación');
        })
    );
});

// Estrategia de cache: Cache First con fallback a Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si encontramos una coincidencia en el cache, la devolvemos
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en cache, intentamos obtenerlo de la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Si la respuesta de red no es válida, devolvemos un error
                        if (!networkResponse || networkResponse.status !== 200) {
                            throw new Error('Respuesta de red no válida');
                        }

                        // Guardamos una copia de la respuesta en el cache
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                console.log('Recurso cacheado:', event.request.url);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Error de fetch:', error);
                        
                        // Si es una navegación, devolvemos index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }

                        // Para otros recursos, devolvemos un error personalizado
                        return new Response(
                            'Aplicación en modo offline - Recurso no disponible',
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'text/plain'
                                })
                            }
                        );
                    });
            })
    );
}); 