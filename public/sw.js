// Service Worker Auto-generado para Modo Offline 100% Blindado
const CACHE_NAME = 'ganado-app-cache-v2.24.53';

// Recursos base de arranque rápido (sin saturar la red inicial con todos los módulos diferidos)
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-512.png",
  "/icon-384.png",
  "/icon-192.png",
  "/apple-touch-icon.png",
  "/favicon.png",
  "/favicon.ico"
];
const LAZY_ASSETS = [
  "/assets/AccountingView-C_gTKNRI.js",
  "/assets/BatchAnalyticsView-ZnpxRJVQ.js",
  "/assets/BatchEntryModal-CW4tZG2E.js",
  "/assets/BrandingRecordModal-DIr3FsPo.js",
  "/assets/CalvingRecordModal-DddNRxvD.js",
  "/assets/CattleDetailModal-B8v0y2g1.js",
  "/assets/CattleFormModal-Cg4kzRSU.js",
  "/assets/DairyLactationChart-Tr3-aEQf.js",
  "/assets/DairyView-BgAUrK8g.js",
  "/assets/DeathModal-CAAbbeSH.js",
  "/assets/DuplicateWarningModal-BFDyrOpP.js",
  "/assets/ExpenseModal-tzZy_YQJ.js",
  "/assets/ExportImportModal-Dz5Fsjx-.js",
  "/assets/FarmCalendarModal-BTmc9b6o.js",
  "/assets/FemalesView-BO1NL0uC.js",
  "/assets/FinancesView-BnI5fJMR.js",
  "/assets/ForcePasswordChangeModal-BemOs8ep.js",
  "/assets/GlossaryModal-wR4h21jv.js",
  "/assets/IncomeModal-BWiZVYro.js",
  "/assets/InventoryChecklistModal-TB-aZi2B.js",
  "/assets/PaddocksView-BM1UT54B.js",
  "/assets/PaddocksView-DH_l0rZZ.css",
  "/assets/PartnershipSettlementModal-Bw38Lx73.js",
  "/assets/ProfileModal-33IZLJRa.js",
  "/assets/QuickPalpationView-BDtGnJXj.js",
  "/assets/QuickWeighinView-CH41xrK7.js",
  "/assets/RainfallModal-B7exUXA2.js",
  "/assets/RainfallView-QszG8Iqg.js",
  "/assets/SellModal--PY6qoWN.js",
  "/assets/SettlementDetailCard-DhSwVJrQ.js",
  "/assets/SuperAdminView-BVEBOF0l.js",
  "/assets/VaccinationCensusModal-DTwelDbi.js",
  "/assets/VaccinationRecordModal-eLy05SSt.js",
  "/assets/WeightLogModal-DfMoydFk.js",
  "/assets/WeightsView-IJi6HQXW.js",
  "/assets/WhatsAppReportModal-CrjiegOw.js",
  "/assets/WorkersManagementModal-DEw1XvY0.js",
  "/assets/batchExcelService-DwXe0EyY.js",
  "/assets/confetti.module-oQXWb4Lk.js",
  "/assets/consecutiveService-BMLp-nb3.js",
  "/assets/index-ChjJbw0E.css",
  "/assets/index-D4v75XKh.js",
  "/assets/vendor-charts-BBNzn1nk.js",
  "/assets/vendor-db-DLsAzhYJ.js",
  "/assets/vendor-export-BKvfhyNn.js",
  "/assets/vendor-icons-aMN9sRwh.js",
  "/assets/vendor-maps-Cvd-AAqa.js",
  "/assets/vendor-maps-Dgihpmma.css"
];

// Instalación ligera y ultrarrápida del Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_ASSETS.map((asset) => cache.add(asset).catch(() => null))
      );
    })
  );
});

// Activación, limpieza de cachés obsoletas y precarga diferida en segundo plano sin competir con el arranque
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
    }).then(() => self.clients.claim()).then(() => {
      // Precargar módulos secundarios después de 6 segundos para garantizar offline total sin frenar el inicio
      setTimeout(() => {
        caches.open(CACHE_NAME).then( async (cache) => {
          for (const asset of LAZY_ASSETS) {
            const match = await cache.match(asset);
            if (!match) {
              await cache.add(asset).catch(() => null);
            }
          }
        }).catch(() => null);
      }, 6000);
    })
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

  // 2. Manejo de navegaciones (HTML principal / PWA app shell) - Network First con Timeout Rápido y Fallback Offline
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
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

        const cachedResponse = await caches.match(request, { ignoreSearch: true });
        if (cachedResponse) return cachedResponse;
        const indexFallback = await caches.match('/index.html', { ignoreSearch: true });
        if (indexFallback) return indexFallback;
        const rootFallback = await caches.match('/', { ignoreSearch: true });
        if (rootFallback) return rootFallback;
        return new Response('Modo Sin Conexión Ganadero', { headers: { 'Content-Type': 'text/html' } });
      })()
    );
    return;
  }

  // 3. Manejo de scripts, estilos, imágenes y fuentes - Cache First Instantáneo (sin re-descargar bundles con hash)
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request, { ignoreSearch: url.pathname.startsWith('/assets/') });
      if (cachedResponse) {
        // Los archivos en /assets/ tienen hash único por compilación (inmutables); no re-descargarlos en segundo plano
        if (!url.pathname.startsWith('/assets/') && typeof navigator !== 'undefined' && navigator.onLine) {
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
