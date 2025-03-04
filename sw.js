const CACHE_NAME = 'totem-interactivo-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/pdf1.html',
    '/pdf2.html',
    '/pdf3.html',
    '/pdf4.html',
    '/manifest.json',
    '/src/img/Recurso 2.png',
    '/src/img/Recurso 3.png',
    '/src/img/Recurso 4.png',
    '/src/img/Recurso 5.png',
    '/src/img/Recurso 6.png',
    '/src/img/Recurso 8.png',
    '/src/img/Recurso 10.png',
    '/src/img/pdfs/Fatiga.pdf',
    '/src/img/pdfs/rash.pdf',
    '/src/img/pdfs/interacciones.pdf',
    '/src/img/pdfs/salud.pdf',
    'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
}); 