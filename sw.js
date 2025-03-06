const CACHE_NAME = 'totem-v3';
const BASE_URL = 'https://jeanb1992.github.io/Totem2';

// Lista de todos los recursos que necesitamos cachear
const ASSETS = [
    '/',
    '/index.html',
    '/pdf1.html',
    '/pdf2.html',
    '/pdf3.html',
    '/pdf4.html',
    '/manifest.json',
    '/sw.js',
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

// Instalación: Precarga todos los recursos
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                console.log('Precacheando recursos...');
                
                // Primero, cachear los recursos base
                await cache.addAll(ASSETS.map(asset => 
                    asset.startsWith('/') ? BASE_URL + asset : asset
                ));
                
                // Forzar la activación inmediata
                await self.skipWaiting();
                console.log('Precarga completada exitosamente');
            } catch (error) {
                console.error('Error durante la precarga:', error);
            }
        })()
    );
});

// Activación: Limpia caches antiguos y toma control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            try {
                // Limpiar caches antiguos
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );

                // Tomar control de todos los clientes
                await self.clients.claim();
                console.log('Service Worker activado y controlando todos los clientes');
            } catch (error) {
                console.error('Error durante la activación:', error);
            }
        })()
    );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    // No interceptar solicitudes a otros dominios
    if (!event.request.url.startsWith(BASE_URL)) {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);

                // Intentar obtener del cache primero
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en cache, intentar red
                try {
                    const networkResponse = await fetch(event.request);
                    
                    // Verificar respuesta válida
                    if (!networkResponse || networkResponse.status !== 200) {
                        throw new Error('Respuesta de red no válida');
                    }

                    // Guardar en cache y devolver
                    await cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (fetchError) {
                    console.warn('Error de fetch:', fetchError);

                    // Si es navegación, devolver index.html
                    if (event.request.mode === 'navigate') {
                        const indexResponse = await cache.match(BASE_URL + '/index.html');
                        if (indexResponse) return indexResponse;
                    }

                    // Devolver respuesta offline personalizada
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
                }
            } catch (error) {
                console.error('Error en el Service Worker:', error);
                throw error;
            }
        })()
    );
}); 