import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { 
  Layers, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Leaf, 
  ArrowRightLeft, 
  Edit, 
  Calculator, 
  Trash2, 
  X, 
  Plus, 
  Info,
  Calendar,
  Scale,
  Sun,
  Droplets,
  Eye,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  MAP_TILE_PROVIDERS, 
  COLOMBIAN_CATTLE_REGIONS, 
  calculatePolygonMetrics, 
  saveFarmBoundary, 
  getFarmBoundary, 
  searchColombianLocation 
} from '../../services/mapService';
import { formatDate, getLocalDateString } from '../../services/calculations';

export function PaddocksMapView({
  paddocks = [],
  cattle = [],
  userId,
  onSavePaddock,
  onEditPaddock,
  onRotateToPaddock,
  onOpenForageCalc,
  onOpenNewPaddockWithGeometry,
  isWorker = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const paddocksLayerGroupRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Estados visuales y de control
  const [activeBaseLayer, setActiveBaseLayer] = useState('googleHybrid');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPaddock, setSelectedPaddock] = useState(null);
  const [farmBoundary, setFarmBoundary] = useState(() => getFarmBoundary(userId));
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  
  // Búsqueda geográfica
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // Modal para asociar polígono recién trazado
  const [pendingPolygonDraft, setPendingPolygonDraft] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedExistingPaddockId, setSelectedExistingPaddockId] = useState('');

  // Estadísticas globales de potreros y finca
  const mapStats = useMemo(() => {
    let totalDrawnHa = 0;
    let mappedPaddocksCount = 0;
    let inRestCount = 0;
    let occupiedCount = 0;

    paddocks.forEach(p => {
      const area = parseFloat(p.areaHa) || 0;
      if (p.polygon && Array.isArray(p.polygon) && p.polygon.length >= 3) {
        totalDrawnHa += area;
        mappedPaddocksCount++;
      }
      if (p.status === 'Ocupado' || p.status === 'ocupado' || p.currentBatchId || p.currentBatchName) {
        occupiedCount++;
      } else {
        inRestCount++;
      }
    });

    return {
      totalPaddocks: paddocks.length,
      mappedPaddocksCount,
      totalDrawnHa: Number(totalDrawnHa.toFixed(2)),
      farmBoundaryHa: farmBoundary?.totalAreaHa || null,
      inRestCount,
      occupiedCount
    };
  }, [paddocks, farmBoundary]);

  // Potreros que aún no tienen dibujo en el mapa
  const unmappedPaddocks = useMemo(() => {
    return paddocks.filter(p => !p.polygon || !Array.isArray(p.polygon) || p.polygon.length < 3);
  }, [paddocks]);

  // Obtener estilo y color de cada potrero según su estado zootécnico
  const getPaddockStyle = (paddock) => {
    const isOccupied = paddock.status === 'Ocupado' || paddock.status === 'ocupado' || !!paddock.currentBatchId || !!paddock.currentBatchName;
    const isMaintenance = paddock.status === 'Mantenimiento' || paddock.status === 'mantenimiento';
    
    // 🟡 Ocupado con ganado
    if (isOccupied) {
      return {
        fillColor: '#f59e0b', // Ámbar vibrante
        color: '#d97706',
        weight: 2.5,
        fillOpacity: 0.38,
        dashArray: null
      };
    }

    // 🔴 Mantenimiento
    if (isMaintenance) {
      return {
        fillColor: '#ef4444', // Rojo
        color: '#dc2626',
        weight: 2.5,
        fillOpacity: 0.38,
        dashArray: '4, 4'
      };
    }

    // 🟢 En descanso: revisar si ya cumplió días objetivo
    const restDays = paddock.lastRestStartDate 
      ? Math.max(0, Math.floor((new Date() - new Date(paddock.lastRestStartDate)) / (1000 * 60 * 60 * 24)))
      : 0;
    const targetRest = parseInt(paddock.targetRestDays, 10) || 30;
    const isReady = restDays >= targetRest;

    if (isReady) {
      return {
        fillColor: '#10b981', // Verde esmeralda óptimo
        color: '#059669',
        weight: 2.5,
        fillOpacity: 0.38,
        dashArray: null
      };
    }

    // 🔵 En descanso creciendo
    return {
      fillColor: '#3b82f6', // Azul crecimiento
      color: '#2563eb',
      weight: 2,
      fillOpacity: 0.30,
      dashArray: null
    };
  };

  // =========================================================================
  // 1. INICIALIZACIÓN DEL MAPA LEAFLET Y CONTROLES GEOMAN
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centro inicial: si hay lindero o potreros, usar sus coordenadas; si no, Puerto Berrío (Magdalena Medio)
    let initialCenter = [6.4914, -74.4047];
    let initialZoom = 14;

    if (farmBoundary?.center && Array.isArray(farmBoundary.center)) {
      initialCenter = farmBoundary.center;
      initialZoom = 15;
    } else {
      const firstWithPoly = paddocks.find(p => p.polygon && p.polygon.length > 0);
      if (firstWithPoly && firstWithPoly.polygon[0]) {
        initialCenter = [firstWithPoly.polygon[0][0], firstWithPoly.polygon[0][1]];
        initialZoom = 15;
      }
    }

    // Crear mapa
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Control de zoom en esquina inferior derecha
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Capa base inicial (Google Satélite Híbrido por defecto para alta nitidez)
    const provider = MAP_TILE_PROVIDERS.googleHybrid;
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains || [],
      attribution: provider.attribution
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Grupo de capas para potreros y lindero
    paddocksLayerGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    // =====================================================================
    // CONFIGURACIÓN DE LEAFLET-GEOMAN (HERRAMIENTAS DE DIBUJO CON IMÁN)
    // =====================================================================
    map.pm.setLang('es');
    map.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      cutPolygon: true,
      editMode: true,
      dragMode: false,
      rotateMode: false,
      removalMode: true,
    });

    // Configurar Snapping (adherencia de cercas) y restricciones
    map.pm.setGlobalOptions({
      snappable: true,
      snapDistance: 25,
      allowSelfIntersection: false,
      continueDrawing: false,
      templineStyle: { color: '#10b981', dashArray: '5, 5' },
      hintlineStyle: { color: '#34d399', dashArray: '3, 3' },
      pathOptions: {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.35,
        weight: 2.5
      }
    });

    // Evento al terminar de dibujar un polígono
    map.on('pm:create', (e) => {
      const layer = e.layer;
      const rawCoords = layer.getLatLngs();
      const flatCoords = Array.isArray(rawCoords[0]) ? rawCoords[0] : rawCoords;
      const cleanCoords = flatCoords.map(latlng => [
        parseFloat(latlng.lat.toFixed(6)),
        parseFloat(latlng.lng.toFixed(6))
      ]);

      const metrics = calculatePolygonMetrics(cleanCoords);

      // Si estaba en modo trazado de lindero perimetral de la finca
      if (isDrawingBoundary) {
        const boundaryData = {
          coordinates: cleanCoords,
          totalAreaHa: metrics.areaHa,
          perimeterMeters: metrics.perimeterM,
          center: metrics.center,
          updatedAt: new Date().toISOString()
        };
        saveFarmBoundary(userId, boundaryData);
        setFarmBoundary(boundaryData);
        setIsDrawingBoundary(false);
        map.removeLayer(layer);
        return;
      }

      // Si es un potrero: guardar borrador y abrir modal de asignación
      setPendingPolygonDraft({
        coordinates: cleanCoords,
        metrics,
        tempLayer: layer
      });
      setIsAssignModalOpen(true);
    });

    // Evento al editar vértices de un potrero existente
    map.on('pm:update', (e) => {
      const layer = e.layer;
      if (layer && layer.paddockData) {
        const rawCoords = layer.getLatLngs();
        const flatCoords = Array.isArray(rawCoords[0]) ? rawCoords[0] : rawCoords;
        const cleanCoords = flatCoords.map(latlng => [
          parseFloat(latlng.lat.toFixed(6)),
          parseFloat(latlng.lng.toFixed(6))
        ]);
        const metrics = calculatePolygonMetrics(cleanCoords);

        // Actualizar automáticamente en base de datos
        const updated = {
          ...layer.paddockData,
          polygon: cleanCoords,
          areaHa: metrics.areaHa,
          perimeterMeters: metrics.perimeterM,
          centerLat: metrics.center[0],
          centerLng: metrics.center[1]
        };
        onSavePaddock(updated);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // =========================================================================
  // 2. CAMBIO DE CAPA BASE (SATÉLITE, HÍBRIDO, VÍAS, RELIEVE)
  // =========================================================================
  const handleChangeBaseLayer = (providerKey) => {
    const map = mapInstanceRef.current;
    if (!map || !MAP_TILE_PROVIDERS[providerKey]) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = MAP_TILE_PROVIDERS[providerKey];
    const newLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains || [],
      attribution: provider.attribution
    }).addTo(map);

    tileLayerRef.current = newLayer;
    setActiveBaseLayer(providerKey);
    setShowLayerMenu(false);
  };

  // =========================================================================
  // 3. RENDERIZADO REACTIVO DE POTREROS Y LINDERO GENERAL EN EL MAPA
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = paddocksLayerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Dibujar Lindero General de la Finca si existe
    if (farmBoundary?.coordinates && farmBoundary.coordinates.length >= 3) {
      const latlngs = farmBoundary.coordinates.map(pt => [pt[0], pt[1]]);
      const boundaryPoly = L.polygon(latlngs, {
        color: '#fbbf24', // Dorado
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: '#fbbf24',
        fillOpacity: 0.04,
        interactive: false
      });
      boundaryPoly.addTo(group);
    }

    // 2. Dibujar Polígonos de Potreros
    paddocks.forEach(p => {
      if (!p.polygon || !Array.isArray(p.polygon) || p.polygon.length < 3) return;

      const latlngs = p.polygon.map(pt => [pt[0], pt[1]]);
      const style = getPaddockStyle(p);

      const poly = L.polygon(latlngs, style);
      poly.paddockData = p;

      // Tooltip flotante al pasar el ratón
      const isOccupied = p.status === 'Ocupado' || p.currentBatchId;
      const badgeText = isOccupied 
        ? `🐄 ${p.currentBatchName || 'Lote Activo'}` 
        : `🌿 Descanso (${p.lastRestStartDate ? formatDate(p.lastRestStartDate) : 'Sin fecha'})`;

      poly.bindTooltip(
        `<div class="text-xs font-bold leading-tight">
          <div class="text-slate-900 font-extrabold uppercase">${p.name}</div>
          <div class="text-emerald-700">${p.areaHa} Ha • ${badgeText}</div>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      // Etiqueta permanente en el centro del potrero
      const metrics = calculatePolygonMetrics(p.polygon);
      if (metrics.center) {
        const labelIcon = L.divIcon({
          className: 'custom-paddock-center-label pointer-events-none',
          html: `<div class="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white border border-white/30 text-[10px] font-black shadow-md whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center">
            <span>${p.name}</span>
            <span class="text-[9px] text-emerald-300 font-mono">${p.areaHa} Ha</span>
          </div>`,
          iconSize: [0, 0]
        });
        L.marker(metrics.center, { icon: labelIcon, interactive: false }).addTo(group);
      }

      // Al hacer clic: seleccionar potrero para desplegar tarjeta informativa
      poly.on('click', () => {
        setSelectedPaddock(p);
      });

      poly.addTo(group);
    });

  }, [paddocks, farmBoundary]);

  // =========================================================================
  // 4. ACCIONES DEL MAPA: CENTRAR, GEOLOCALIZAR, PANTALLA COMPLETA
  // =========================================================================

  // Ajustar la vista para encuadrar todos los potreros y la finca
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    const group = paddocksLayerGroupRef.current;
    if (!map || !group) return;

    const layers = group.getLayers();
    if (layers.length > 0) {
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 17 });
    } else if (farmBoundary?.center) {
      map.setView(farmBoundary.center, 15);
    }
  };

  // Geolocalización GPS del dispositivo
  const handleGPSLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          map.flyTo([lat, lng], 17, { duration: 1.5 });
          L.circle([lat, lng], { radius: pos.coords.accuracy || 20, color: '#3b82f6', fillOpacity: 0.2 }).addTo(map);
        },
        (err) => {
          alert('No se pudo obtener la señal GPS del dispositivo. Por favor verifica los permisos de ubicación.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Saltar a una región ganadera colombiana
  const handleJumpToRegion = (reg) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([reg.lat, reg.lng], reg.zoom || 14, { duration: 1.5 });
    setShowLocationSearch(false);
  };

  // Buscar municipio o vereda en Colombia
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setIsSearchingLocation(true);
    const results = await searchColombianLocation(locationQuery);
    setSearchResults(results);
    setIsSearchingLocation(false);
  };

  // Iniciar trazado de lindero general
  const handleStartDrawBoundary = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setIsDrawingBoundary(true);
    map.pm.enableDraw('Polygon', {
      snappable: false,
      templineStyle: { color: '#fbbf24', dashArray: '6, 6' },
      hintlineStyle: { color: '#fde68a', dashArray: '4, 4' },
      pathOptions: {
        color: '#fbbf24',
        fillColor: '#fbbf24',
        fillOpacity: 0.1,
        weight: 3,
        dashArray: '6, 6'
      }
    });
  };

  // Eliminar lindero general de la finca
  const handleDeleteBoundary = () => {
    if (confirm('¿Deseas eliminar el lindero exterior trazado de la finca?')) {
      saveFarmBoundary(userId, null);
      setFarmBoundary(null);
    }
  };

  // =========================================================================
  // 5. ASIGNACIÓN DEL POLÍGONO DIBUJADO A UN POTRERO
  // =========================================================================

  // Guardar como NUEVO Potrero
  const handleConfirmNewPaddock = () => {
    if (!pendingPolygonDraft) return;
    const { coordinates, metrics, tempLayer } = pendingPolygonDraft;

    // Remover la capa temporal de Geoman (la re-dibujará el efecto de potreros)
    if (mapInstanceRef.current && tempLayer) {
      mapInstanceRef.current.removeLayer(tempLayer);
    }

    setIsAssignModalOpen(false);
    setPendingPolygonDraft(null);

    // Disparar modal de nuevo potrero con los datos geodésicos pre-cargados
    onOpenNewPaddockWithGeometry({
      polygon: coordinates,
      areaHa: metrics.areaHa,
      perimeterMeters: metrics.perimeterM,
      centerLat: metrics.center[0],
      centerLng: metrics.center[1]
    });
  };

  // Vincular polígono a un POTRERO EXISTENTE
  const handleConfirmAssignExisting = () => {
    if (!pendingPolygonDraft || !selectedExistingPaddockId) return;
    const { coordinates, metrics, tempLayer } = pendingPolygonDraft;

    const existing = paddocks.find(p => String(p.id) === String(selectedExistingPaddockId));
    if (existing) {
      const updated = {
        ...existing,
        polygon: coordinates,
        areaHa: metrics.areaHa,
        perimeterMeters: metrics.perimeterM,
        centerLat: metrics.center[0],
        centerLng: metrics.center[1]
      };
      onSavePaddock(updated);
    }

    if (mapInstanceRef.current && tempLayer) {
      mapInstanceRef.current.removeLayer(tempLayer);
    }

    setIsAssignModalOpen(false);
    setPendingPolygonDraft(null);
    setSelectedExistingPaddockId('');
  };

  // Cancelar dibujo pendiente
  const handleCancelDraft = () => {
    if (mapInstanceRef.current && pendingPolygonDraft?.tempLayer) {
      mapInstanceRef.current.removeLayer(pendingPolygonDraft.tempLayer);
    }
    setIsAssignModalOpen(false);
    setPendingPolygonDraft(null);
  };

  return (
    <div className={`relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[620px] sm:h-[720px] w-full'
    }`}>

      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: KPI RÁPIDOS Y BOTONES DE CONTROL                          */}
      {/* ========================================================================= */}
      <div className="absolute top-3 left-14 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none flex-wrap">
        {/* Pastillas de Métricas de Potreros Mapeados */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg text-xs text-white">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 font-black">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mapStats.mappedPaddocksCount} / {mapStats.totalPaddocks} potreros trazados</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold font-mono">
            <span>{mapStats.totalDrawnHa} Ha mapeadas</span>
          </div>

          {mapStats.farmBoundaryHa && (
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-[11px]">
              <span>Lindero total: {mapStats.farmBoundaryHa} Ha</span>
            </div>
          )}
        </div>

        {/* Botones de Acción Rápida (Centrar, GPS, Capas, Pantalla Completa) */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Buscador de Región / Municipio */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLocationSearch(prev => !prev)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Buscar municipio o saltar a región ganadera"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Ubicación</span>
            </button>

            {/* Menú Flotante de Búsqueda Geográfica */}
            {showLocationSearch && (
              <div className="absolute right-0 top-11 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-2xl z-20 text-white animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Centrar en Colombia</span>
                  </span>
                  <button onClick={() => setShowLocationSearch(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSearchLocation} className="flex items-center gap-1.5 mb-3">
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Escribe municipio o vereda..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingLocation}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    {isSearchingLocation ? '...' : 'Ir'}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-36 overflow-y-auto custom-scrollbar">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const map = mapInstanceRef.current;
                          if (map) map.flyTo([res.lat, res.lng], 15, { duration: 1.5 });
                          setShowLocationSearch(false);
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800 text-[11px] text-slate-200 transition truncate block"
                      >
                        📍 {res.name}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Zonas Ganaderas Predeterminadas:
                </span>
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {COLOMBIAN_CATTLE_REGIONS.map((reg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpToRegion(reg)}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-emerald-600/30 hover:border-emerald-500 border border-transparent text-[11px] font-medium text-slate-300 transition flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{reg.name}</span>
                      <span className="text-emerald-400 text-[10px] font-mono">Ir →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector de Capas de Mapa */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(prev => !prev)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Cambiar capa de satélite o vías"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Capas</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 top-11 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2 rounded-2xl shadow-2xl z-20 text-white animate-fadeIn space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                  Capa Cartográfica:
                </span>
                {Object.values(MAP_TILE_PROVIDERS).map(prov => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleChangeBaseLayer(prov.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      activeBaseLayer === prov.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{prov.name}</span>
                    {activeBaseLayer === prov.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón GPS */}
          <button
            type="button"
            onClick={handleGPSLocation}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition cursor-pointer"
            title="Ubicar mi posición GPS actual"
          >
            <Compass className="w-4 h-4 text-blue-400" />
          </button>

          {/* Botón Centrar Finca / Potreros */}
          <button
            type="button"
            onClick={handleFitBounds}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition cursor-pointer"
            title="Encuadrar todos los potreros en pantalla"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          {/* Pantalla Completa */}
          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition cursor-pointer"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTÓN INFERIOR IZQUIERDA: GESTIÓN DE LINDERO GENERAL DE LA FINCA           */}
      {/* ========================================================================= */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        {farmBoundary ? (
          <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-amber-500/50 shadow-xl text-white text-xs flex items-center gap-2">
            <div>
              <span className="font-extrabold text-amber-400 block text-[11px] uppercase">Lindero Exterior Finca</span>
              <span className="font-mono text-xs">{farmBoundary.totalAreaHa} Ha • {farmBoundary.perimeterMeters} m cerca</span>
            </div>
            <button
              type="button"
              onClick={handleDeleteBoundary}
              className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition cursor-pointer"
              title="Borrar lindero perimetral"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartDrawBoundary}
            className={`px-3 py-2 rounded-2xl font-black text-xs transition shadow-xl border flex items-center gap-2 cursor-pointer ${
              isDrawingBoundary
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/40'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{isDrawingBoundary ? 'Dibujando Lindero Exterior...' : '+ Trazar Lindero Finca'}</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TARJETA DETALLE FLOTANTE: POTRERO SELECCIONADO AL HACER CLIC              */}
      {/* ========================================================================= */}
      {selectedPaddock && (
        <div className="absolute bottom-4 right-4 z-20 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 border-2 border-emerald-500 shadow-2xl text-slate-800 dark:text-slate-100 animate-fadeIn">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${
                  selectedPaddock.status === 'Ocupado' || selectedPaddock.currentBatchId ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <h4 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
                  {selectedPaddock.name}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Pasto: {selectedPaddock.pastureType || 'Natural'} • Agua: {selectedPaddock.waterSource || 'Caño'}
              </p>
            </div>

            <button
              onClick={() => setSelectedPaddock(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grilla de Métricas Zootécnicas */}
          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Área Satelital</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {selectedPaddock.areaHa || 0} Ha
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Estado Actual</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">
                {selectedPaddock.status === 'Ocupado' || selectedPaddock.currentBatchId ? '🟡 Ocupado' : '🟢 En descanso'}
              </span>
            </div>

            {(selectedPaddock.currentBatchName || selectedPaddock.currentAnimalCount > 0) && (
              <div className="col-span-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Animales en Pastoreo:</span>
                <span className="font-extrabold text-xs">
                  🐄 {selectedPaddock.currentBatchName ? `${selectedPaddock.currentBatchName}` : 'Pastoreo'}
                  {selectedPaddock.currentAnimalCount > 0 ? ` (${selectedPaddock.currentAnimalCount} ${selectedPaddock.currentAnimalCount === 1 ? 'cabeza' : 'cabezas'})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Botones de Acción Directa en el Mapa */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onRotateToPaddock(selectedPaddock);
                setSelectedPaddock(null);
              }}
              className="py-2 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              title="Mover lote a este potrero"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Rotar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenForageCalc(selectedPaddock);
                setSelectedPaddock(null);
              }}
              className="py-2 px-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              title="Calcular aforo de pasto y capacidad animal"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Aforo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEditPaddock(selectedPaddock);
                setSelectedPaddock(null);
              }}
              className="py-2 px-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
              title="Editar ficha del potrero"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Ficha</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASIGNAR POLÍGONO TRAZADO (CREAR NUEVO O VINCULAR EXISTENTE)        */}
      {/* ========================================================================= */}
      {isAssignModalOpen && pendingPolygonDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-emerald-500 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Potrero Trazado con Éxito
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Área calculada por satélite: <strong className="text-emerald-600 dark:text-emerald-400">{pendingPolygonDraft.metrics.areaHa} Hectáreas</strong> ({pendingPolygonDraft.metrics.perimeterM} m de cerca)
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Opción 1: Crear Nuevo Potrero */}
              <button
                type="button"
                onClick={handleConfirmNewPaddock}
                className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Crear como Nuevo Potrero</span>
                </div>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-md font-mono">{pendingPolygonDraft.metrics.areaHa} Ha</span>
              </button>

              {/* Opción 2: Vincular a un Potrero Existente */}
              {unmappedPaddocks.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    O vincular a un potrero ya registrado en tu catálogo:
                  </label>
                  <select
                    value={selectedExistingPaddockId}
                    onChange={(e) => setSelectedExistingPaddockId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecciona un potrero sin mapa...</option>
                    {unmappedPaddocks.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Registrado: {p.areaHa || 0} Ha)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedExistingPaddockId}
                    onClick={handleConfirmAssignExisting}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Asignar dibujo a este potrero
                  </button>
                </div>
              )}

              {/* Botón Cancelar */}
              <button
                type="button"
                onClick={handleCancelDraft}
                className="w-full py-2 text-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold transition text-xs cursor-pointer"
              >
                Descartar trazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
