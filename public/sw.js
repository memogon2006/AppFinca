// Service Worker Auto-generado para Modo Offline 100% Blindado
const CACHE_NAME = 'ganado-app-cache-v2.21.1';

// Todos los recursos estáticos y paquetes JS/CSS compilados precacheados
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-512.png",
  "/icon-384.png",
  "/icon-192.png",
  "/apple-touch-icon.png",
  "/favicon.png",
  "/favicon.ico",
  "/assets/index-Bfs7Z9_0.js",
  "/assets/index-D0dYjlED.css",
  "/assets/vendor-charts-DljG-sht.js",
  "/assets/vendor-db-DLsAzhYJ.js",
  "/assets/vendor-export-BKvfhyNn.js",
  "/assets/vendor-icons-BRN_HLgH.js"
];

// Instalación del Service Worker con precaching total
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ Precarga individual de respaldo:', err);
        return Promise.all(
          STATIC_ASSETS.map((asset) => cache.add(asset).catch(() => null))
        );
      });
    })
  );
});

// Activación y limpieza inmediata de cachés anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('ganado-app-cache-')) {
            console.log('🧹 Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Escuchar mensaje para forzar activación inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estrategia de respuesta a peticiones
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Ignorar APIs de base de datos en la nube y llamadas de sincronización externa
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('api.restful-api.dev') ||
    url.hostname.includes('api.whatsapp.com') ||
    url.pathname.includes('/version.json')
  ) {
    return;
  }

  // 2. Manejo de navegaciones (HTML principal / PWA app shell) - Network First con Timeout y Fallback Offline
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const response = await fetch(request, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              cache.put('/index.html', response.clone());
            });
            return response;
          }
        } catch (e) {}

        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        const indexFallback = await caches.match('/index.html');
        if (indexFallback) return indexFallback;
        const rootFallback = await caches.match('/');
        if (rootFallback) return rootFallback;
        return new Response('Modo Sin Conexión Ganadero', { headers: { 'Content-Type': 'text/html' } });
      })()
    );
    return;
  }

  // 3. Manejo de scripts, estilos, imágenes y fuentes - Cache First con Network Fallback y Revalidación
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              }
            })
            .catch(() => null);
        }
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        }
      } catch (err) {}

      // Si la red falla (offline), buscar en cualquier caché activa
      const fallback = await caches.match(request);
      if (fallback) return fallback;

      const cleanUrl = request.url.split('?')[0];
      const cleanMatch = await caches.match(cleanUrl);
      if (cleanMatch) return cleanMatch;

      // Coincidencias de chunks dinámicos
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const reqUrl = request.url;
      const matchedKey = keys.find(k => {
        const kUrl = k.url;
        if (reqUrl.includes('/assets/index-') && kUrl.includes('/assets/index-') && reqUrl.endsWith('.js') && kUrl.endsWith('.js')) return true;
        if (reqUrl.includes('/assets/index-') && kUrl.includes('/assets/index-') && reqUrl.endsWith('.css') && kUrl.endsWith('.css')) return true;
        if (reqUrl.includes('/assets/vendor-icons-') && kUrl.includes('/assets/vendor-icons-')) return true;
        if (reqUrl.includes('/assets/vendor-db-') && kUrl.includes('/assets/vendor-db-')) return true;
        if (reqUrl.includes('/assets/vendor-charts-') && kUrl.includes('/assets/vendor-charts-')) return true;
        if (reqUrl.includes('/assets/vendor-export-') && kUrl.includes('/assets/vendor-export-')) return true;
        return false;
      });

      if (matchedKey) {
        const matchedResp = await cache.match(matchedKey);
        if (matchedResp) return matchedResp;
      }

      return new Response('', { status: 503, statusText: 'Offline' });
    })()
  );
});
