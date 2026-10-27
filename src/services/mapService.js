import area from '@turf/area';
import length from '@turf/length';

/**
 * Proveedores de capas de mapas satelitales y topográficos de alta resolución sin costo de API
 */
export const MAP_TILE_PROVIDERS = {
  googleHybrid: {
    id: 'googleHybrid',
    name: 'Satélite HD Híbrido (Google)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  esriSatellite: {
    id: 'esriSatellite',
    name: 'Satélite Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  osm: {
    id: 'osm',
    name: 'Mapa de Vías (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  topo: {
    id: 'topo',
    name: 'Relieve Topográfico (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  }
};

/**
 * Centros geográficos predeterminados de zonas ganaderas clave de Colombia
 */
export const COLOMBIAN_CATTLE_REGIONS = [
  { name: 'Magdalena Medio (Puerto Berrío, Ant)', lat: 6.4914, lng: -74.4047, zoom: 14 },
  { name: 'Córdoba (Montería / Cereté)', lat: 8.7559, lng: -75.8814, zoom: 14 },
  { name: 'Cesar (Valledupar / Aguachica)', lat: 10.4631, lng: -73.2532, zoom: 14 },
  { name: 'Llanos Orientales (Villavicencio / San Martín)', lat: 4.1420, lng: -73.6266, zoom: 14 },
  { name: 'Casanare (Yopal / Paz de Ariporo)', lat: 5.3378, lng: -72.3959, zoom: 14 },
  { name: 'Bajo Cauca Antioqueño (Caucasia)', lat: 7.9866, lng: -75.1936, zoom: 14 },
  { name: 'Sabana de Torres / Cimitarra (Santander)', lat: 7.3917, lng: -73.4981, zoom: 14 },
  { name: 'Sucre / San Jorge (San Marcos)', lat: 8.6606, lng: -75.1328, zoom: 14 },
  { name: 'Altiplano Cundiboyacense (Ubaté / Chiquinquirá)', lat: 5.3092, lng: -73.8181, zoom: 14 },
  { name: 'Eje Cafetero (La Dorada / Caldas)', lat: 5.4539, lng: -74.6644, zoom: 14 },
];

/**
 * Convierte un arreglo de coordenadas Leaflet [[lat, lng], ...] a GeoJSON Polygon
 */
export function leafletCoordsToGeoJSON(coords) {
  if (!coords || !Array.isArray(coords) || coords.length < 3) return null;
  
  // GeoJSON requiere formato [lng, lat]
  const ring = coords.map(pt => {
    if (Array.isArray(pt)) {
      return [pt[1], pt[0]]; // [lng, lat]
    }
    if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
      return [pt.lng, pt.lat];
    }
    return null;
  }).filter(Boolean);

  if (ring.length < 3) return null;

  // Cerrar el polígono si no está cerrado
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ring]
    }
  };
}

/**
 * Calcula métricas geodésicas de alta precisión (Hectáreas, m2, Perímetro y Centroide)
 * @param {Array} coords - Arreglo de coordenadas [[lat, lng], ...]
 */
export function calculatePolygonMetrics(coords) {
  const defaultRes = { areaHa: 0, areaM2: 0, perimeterM: 0, center: [6.4914, -74.4047] };
  if (!coords || !Array.isArray(coords) || coords.length < 3) return defaultRes;

  const geoJson = leafletCoordsToGeoJSON(coords);
  if (!geoJson) return defaultRes;

  try {
    // 1. Área geodésica en m2 y hectáreas
    const areaM2 = area(geoJson);
    const areaHa = Number((areaM2 / 10000).toFixed(2));

    // 2. Perímetro en metros
    const perimeterM = Number(length(geoJson, { units: 'meters' }).toFixed(1));

    // 3. Centroide aproximado
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;
    coords.forEach(pt => {
      const lat = Array.isArray(pt) ? pt[0] : pt.lat;
      const lng = Array.isArray(pt) ? pt[1] : pt.lng;
      if (lat !== undefined && lng !== undefined) {
        sumLat += Number(lat);
        sumLng += Number(lng);
        count++;
      }
    });

    const center = count > 0 ? [sumLat / count, sumLng / count] : defaultRes.center;

    return {
      areaHa,
      areaM2: Number(areaM2.toFixed(1)),
      perimeterM,
      center,
      geoJson
    };
  } catch (err) {
    console.warn('Error calculando métricas geodésicas:', err);
    return defaultRes;
  }
}

/**
 * Guarda el lindero perimetral de la finca en almacenamiento persistente
 */
const FARM_BOUNDARY_PREFIX = 'ganadera_farm_boundary_';

export function saveFarmBoundary(userId, boundaryData) {
  if (!userId || !boundaryData) return;
  try {
    const key = `${FARM_BOUNDARY_PREFIX}${userId}`;
    const payload = {
      ...boundaryData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ganado_farm_boundary_changed', { detail: payload }));
    }
  } catch (e) {
    console.warn('Error guardando lindero de finca:', e);
  }
}

/**
 * Obtiene el lindero perimetral guardado de la finca
 */
export function getFarmBoundary(userId) {
  if (!userId) return null;
  try {
    const key = `${FARM_BOUNDARY_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Búsqueda de ubicaciones geográficas en Colombia mediante OpenStreetMap Nominatim
 */
export async function searchColombianLocation(query) {
  if (!query || !query.trim()) return [];
  const cleanQuery = encodeURIComponent(`${query.trim()}, Colombia`);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cleanQuery}&limit=5&addressdetails=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FincaGanaderaApp/2.25 (contacto@criaderosantateresa.com)'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(item => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      class: item.class
    }));
  } catch (err) {
    console.warn('Error buscando ubicación en Nominatim:', err);
    return [];
  }
}

const LAST_GPS_LOCATION_KEY = 'ganado_last_gps_location_';

/**
 * Obtiene la última ubicación GPS conocida del dispositivo guardada localmente
 */
export function getLastKnownLocation(userId = 'default') {
  try {
    const raw = localStorage.getItem(`${LAST_GPS_LOCATION_KEY}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda la última ubicación GPS conocida
 */
export function saveLastKnownLocation(userId = 'default', coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
  try {
    localStorage.setItem(`${LAST_GPS_LOCATION_KEY}${userId}`, JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      timestamp: Date.now()
    }));
  } catch {}
}

/**
 * Solicita la ubicación actual del dispositivo usando la API de Geolocalización de HTML5
 * con alta precisión (GPS) y tiempo de espera controlado.
 */
export function getDeviceCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      reject(new Error('Tu navegador o dispositivo no soporta geolocalización GPS.'));
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        resolve({
          lat: parseFloat(latitude.toFixed(6)),
          lng: parseFloat(longitude.toFixed(6)),
          accuracy: Math.round(accuracy || 0),
          altitude: altitude ? Math.round(altitude) : null
        });
      },
      (error) => {
        let msg = 'No se pudo obtener la ubicación del dispositivo.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso denegado: Por favor habilita el permiso de ubicación en los ajustes de tu navegador o celular para encontrar tu predio.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'La señal de GPS o ubicación no está disponible en este momento.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Se agotó el tiempo esperando la señal de GPS.';
        }
        const err = new Error(msg);
        err.code = error.code;
        reject(err);
      },
      geoOptions
    );
  });
}
