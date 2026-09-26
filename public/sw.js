// Service Worker Auto-generado para Modo Offline 100% Blindado
const CACHE_NAME = 'ganado-app-cache-v2.14.80';

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
  "/assets/index-CB_4pbSX.js",
  "/assets/index-knGW2AzL.css",
  "/assets/vendor-charts-CEkTc3XU.js",
  "/assets/vendor-db-DLsAzhYJ.js",
  "/assets/vendor-export-BKvfhyNn.js",
  "/assets/vendor-icons-hja__HlR.js"
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

  // 2. Manejo de navegaciones (HTML principal / PWA app shell) - Network First con Fallback Offline a Caché
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              cache.put('/index.html', response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;
          return new Response('Modo Sin Conexión Ganadero', { headers: { 'Content-Type': 'text/html' } });
        })
    );
    return;
  }

  // 3. Manejo de scripts, estilos, imágenes y fuentes - Cache First con Network Fallback y Revalidación
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalidar si hay conexión
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

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Si la red falla (offline), buscar en caché por URL limpia o fallback de tipo
          const fallback = await caches.match(request);
          if (fallback) return fallback;

          const cleanUrl = request.url.split('?')[0];
          const cleanMatch = await caches.match(cleanUrl);
          if (cleanMatch) return cleanMatch;

          // Si es JS del bundle y cambió el hash
          if (request.url.includes('/assets/index-') && request.url.endsWith('.js')) {
            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            const jsKey = keys.find(k => k.url.includes('/assets/index-') && k.url.endsWith('.js'));
            if (jsKey) {
              const jsResp = await cache.match(jsKey);
              if (jsResp) return jsResp;
            }
          }

          // Si es CSS del bundle
          if (request.url.includes('/assets/index-') && request.url.endsWith('.css')) {
            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            const cssKey = keys.find(k => k.url.includes('/assets/index-') && k.url.endsWith('.css'));
            if (cssKey) {
              const cssResp = await cache.match(cssKey);
              if (cssResp) return cssResp;
            }
          }

          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
