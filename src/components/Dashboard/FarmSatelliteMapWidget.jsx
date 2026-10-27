import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, 
  Layers, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  ArrowRightLeft, 
  Leaf, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Scale, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Droplets, 
  Zap, 
  Tag, 
  Users,
  Eye,
  Sparkles
} from 'lucide-react';
import { 
  MAP_TILE_PROVIDERS, 
  getFarmBoundary,
  getLastKnownLocation,
  saveLastKnownLocation
} from '../../services/mapService';
import { 
  formatDate, 
  getLocalDateString, 
  formatNumber, 
  formatCurrency 
} from '../../services/calculations';
import { calculatePaddockCapacity } from '../../types/paddocks';
import { RotateBatchModal } from '../Paddocks/RotateBatchModal';

export function FarmSatelliteMapWidget({
  paddocks = [],
  cattle = [],
  userId = null,
  onSelectAnimal,
  onNavigate,
  onRotateBatch
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const paddocksLayerGroupRef = useRef(null);
  const boundaryLayerRef = useRef(null);

  // Estados visuales y de control
  const [activeBaseLayer, setActiveBaseLayer] = useState('googleHybrid');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPaddockId, setSelectedPaddockId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'occupied' | 'ready' | 'resting'
  const [expandedPaddockAnimals, setExpandedPaddockAnimals] = useState({});

  // Modal de rotación integrado en el widget
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [rotationOriginId, setRotationOriginId] = useState(null);

  const farmBoundary = useMemo(() => getFarmBoundary(userId), [userId]);
  const today = getLocalDateString();

  // Mapear qué animales activos están en cada potrero
  const cattleByPaddock = useMemo(() => {
    const map = {};
    paddocks.forEach(p => {
      map[p.id] = [];
    });

    const unassigned = [];

    cattle.forEach(c => {
      if (c.status !== 'Activo') return;

      // Buscar coincidencia por id, por nombre de potrero o por lote actual
      const matchedPaddock = paddocks.find(p => 
        (c.paddockId && String(p.id) === String(c.paddockId)) || 
        (c.paddock && p.name && c.paddock.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
        (p.currentBatchName && c.entryBatch && p.currentBatchName.trim().toLowerCase() === c.entryBatch.trim().toLowerCase()) ||
        (p.currentBatchName && c.paddock && p.currentBatchName.trim().toLowerCase() === c.paddock.trim().toLowerCase())
      );

      if (matchedPaddock) {
        if (!map[matchedPaddock.id]) map[matchedPaddock.id] = [];
        map[matchedPaddock.id].push(c);
      } else {
        unassigned.push(c);
      }
    });

    return { map, unassigned };
  }, [paddocks, cattle]);

  // Cálculos zootécnicos por potrero
  const paddockDetails = useMemo(() => {
    return paddocks.map(p => {
      let restDays = 0;
      let grazingDays = 0;

      if (p.lastRestStartDate) {
        const diff = Math.floor((new Date(today) - new Date(p.lastRestStartDate)) / (1000 * 60 * 60 * 24));
        restDays = Math.max(0, diff);
      }

      if (p.entryDate) {
        const diff = Math.floor((new Date(today) - new Date(p.entryDate)) / (1000 * 60 * 60 * 24));
        grazingDays = Math.max(0, diff);
      }

      const targetRest = parseInt(p.targetRestDays, 10) || 30;
      const targetGrazing = parseInt(p.targetGrazingDays, 10) || 3;
      const isRestCompleted = restDays >= targetRest;
      const isGrazingExceeded = grazingDays > targetGrazing;

      const animalsInPaddock = cattleByPaddock.map[p.id] || [];
      const animalsCount = animalsInPaddock.length > 0 ? animalsInPaddock.length : (parseInt(p.currentAnimalCount, 10) || (p.assignedTagNumbers?.length || 0));
      const totalWeight = animalsInPaddock.reduce((acc, c) => acc + (parseFloat(c.currentWeight || c.entryWeight) || 380), 0);
      const avgWeight = animalsInPaddock.length > 0 ? Math.round(totalWeight / animalsInPaddock.length) : 380;

      const isOccupied = p.status === 'ocupado' || p.status === 'Ocupado' || !!p.currentBatchName || animalsCount > 0;
      const isMaintenance = p.status === 'mantenimiento' || p.status === 'Mantenimiento';

      const capacity = calculatePaddockCapacity({
        areaHa: p.areaHa || 1,
        pastureType: p.pastureType,
        cuttingWeightKg: p.cuttingWeightKg,
        usablePercentage: p.usablePercentage || 70,
        targetRestDays: targetRest,
        targetGrazingDays: targetGrazing,
        animalCount: animalsCount > 0 ? animalsCount : 25,
        avgAnimalWeightKg: avgWeight,
        consumptionRate: 10,
        entryDate: p.entryDate || today,
        availablePaddocksCount: paddocks.length > 0 ? paddocks.length : 3,
      });

      return {
        ...p,
        restDays,
        grazingDays,
        targetRest,
        targetGrazing,
        isRestCompleted,
        isGrazingExceeded,
        animalsInPaddock,
        animalsCount,
        totalWeight,
        avgWeight,
        isOccupied,
        isMaintenance,
        capacity
      };
    });
  }, [paddocks, cattleByPaddock, today]);

  // Estadísticas globales del tablero
  const stats = useMemo(() => {
    let totalHa = 0;
    let mappedHa = 0;
    let occupiedCount = 0;
    let readyCount = 0;
    let restingCount = 0;
    let totalGrazingCattle = 0;
    let overgrazedCount = 0;

    paddockDetails.forEach(p => {
      const area = parseFloat(p.areaHa) || 0;
      totalHa += area;
      if (p.polygon && Array.isArray(p.polygon) && p.polygon.length >= 3) {
        mappedHa += area;
      }

      if (p.isOccupied) {
        occupiedCount++;
        totalGrazingCattle += p.animalsCount;
        if (p.isGrazingExceeded) overgrazedCount++;
      } else if (p.isRestCompleted) {
        readyCount++;
      } else {
        restingCount++;
      }
    });

    return {
      totalPaddocks: paddocks.length,
      totalHa: Number(totalHa.toFixed(1)),
      mappedHa: Number(mappedHa.toFixed(1)),
      occupiedCount,
      readyCount,
      restingCount,
      totalGrazingCattle,
      overgrazedCount
    };
  }, [paddockDetails, paddocks.length]);

  // Filtrado de potreros para la lista interactiva
  const filteredPaddocks = useMemo(() => {
    if (statusFilter === 'occupied') {
      return paddockDetails.filter(p => p.isOccupied);
    }
    if (statusFilter === 'ready') {
      return paddockDetails.filter(p => !p.isOccupied && p.isRestCompleted);
    }
    if (statusFilter === 'resting') {
      return paddockDetails.filter(p => !p.isOccupied && !p.isRestCompleted && !p.isMaintenance);
    }
    return paddockDetails;
  }, [paddockDetails, statusFilter]);

  // Estilo zootécnico para el mapa
  const getPaddockColor = (p) => {
    if (p.isOccupied) {
      return p.isGrazingExceeded ? '#ef4444' : '#f59e0b'; // Rojo alerta o Ámbar ganado
    }
    if (p.isMaintenance) {
      return '#64748b'; // Gris pizarra
    }
    if (p.isRestCompleted) {
      return '#10b981'; // Verde óptimo
    }
    return '#3b82f6'; // Azul reposo/creciendo
  };

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Coordenadas iniciales: centro de la finca o Puerto Berrío por defecto
      let initialCenter = [6.4913, -74.4042];
      let initialZoom = 14;

      if (farmBoundary && farmBoundary.polygon && farmBoundary.polygon.length > 0) {
        initialCenter = farmBoundary.polygon[0];
      } else {
        const firstWithCoords = paddocks.find(p => p.centerLat && p.centerLng);
        if (firstWithCoords) {
          initialCenter = [firstWithCoords.centerLat, firstWithCoords.centerLng];
        } else {
          const lastLoc = getLastKnownLocation(userId);
          if (lastLoc && typeof lastLoc.lat === 'number' && typeof lastLoc.lng === 'number') {
            initialCenter = [lastLoc.lat, lastLoc.lng];
            initialZoom = 16;
          }
        }
      }

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Capa base inicial
      const tileConfig = MAP_TILE_PROVIDERS[activeBaseLayer] || MAP_TILE_PROVIDERS.googleHybrid;
      const tile = L.tileLayer(tileConfig.url, {
        maxZoom: tileConfig.maxZoom || 20,
        subdomains: tileConfig.subdomains || ['a', 'b', 'c']
      }).addTo(map);

      tileLayerRef.current = tile;
      paddocksLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Cambiar capa base del mapa
  const handleChangeBaseLayer = (providerKey) => {
    if (!mapInstanceRef.current) return;
    const prov = MAP_TILE_PROVIDERS[providerKey];
    if (!prov) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(prov.url, {
      maxZoom: prov.maxZoom || 20,
      subdomains: prov.subdomains || ['a', 'b', 'c']
    }).addTo(mapInstanceRef.current);

    setActiveBaseLayer(providerKey);
    setShowLayerMenu(false);
  };

  // Renderizar capas de linderos y potreros
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Dibujar Lindero de la Finca (Línea dorada punteada)
    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (farmBoundary && farmBoundary.polygon && Array.isArray(farmBoundary.polygon) && farmBoundary.polygon.length >= 3) {
      const boundaryPoly = L.polygon(farmBoundary.polygon, {
        color: '#facc15',
        weight: 3.5,
        dashArray: '8, 6',
        fillColor: '#facc15',
        fillOpacity: 0.05,
        interactive: false
      }).addTo(map);

      boundaryLayerRef.current = boundaryPoly;
    }

    // 2. Dibujar Polígonos de Potreros
    if (paddocksLayerGroupRef.current) {
      paddocksLayerGroupRef.current.clearLayers();
    }

    const bounds = L.latLngBounds([]);
    let hasPolygons = false;

    paddockDetails.forEach(p => {
      if (!p.polygon || !Array.isArray(p.polygon) || p.polygon.length < 3) return;

      hasPolygons = true;
      const color = getPaddockColor(p);
      const isSelected = selectedPaddockId === p.id;

      const poly = L.polygon(p.polygon, {
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 3.5 : 2.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.55 : 0.40,
        dashArray: p.isMaintenance ? '4, 4' : null
      });

      // Tooltip con etiqueta permanente en el centro
      const labelHtml = `
        <div style="font-family: system-ui, sans-serif; text-align: center; line-height: 1.2;">
          <strong style="font-size: 11px; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.9);">${p.name}</strong>
          <div style="font-size: 10px; color: #f1f5f9; text-shadow: 0 1px 2px rgba(0,0,0,0.9); font-weight: 600;">${p.areaHa || 1} Ha</div>
          ${p.isOccupied ? `
            <div style="font-size: 9px; color: #fef08a; text-shadow: 0 1px 3px rgba(0,0,0,0.9); font-weight: 800; margin-top: 1px;">
              🐄 ${p.currentBatchName ? `${p.currentBatchName} (${p.animalsCount} cab)` : `${p.animalsCount} cabezas`}
            </div>
          ` : ''}
        </div>
      `;

      poly.bindTooltip(labelHtml, {
        permanent: true,
        direction: 'center',
        className: 'custom-paddock-map-label'
      });

      // Al hacer clic en el potrero
      poly.on('click', () => {
        setSelectedPaddockId(p.id);
        const cardElem = document.getElementById(`paddock-card-${p.id}`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      paddocksLayerGroupRef.current.addLayer(poly);
      bounds.extend(poly.getBounds());
    });

    if (boundaryLayerRef.current) {
      bounds.extend(boundaryLayerRef.current.getBounds());
    }

    if (hasPolygons && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 16 });
    }
  }, [paddockDetails, farmBoundary, selectedPaddockId]);

  // Centrar el mapa en la finca completa
  const handleFitFarm = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([]);
    if (boundaryLayerRef.current) {
      bounds.extend(boundaryLayerRef.current.getBounds());
    }
    paddocksLayerGroupRef.current.eachLayer(layer => {
      if (layer.getBounds) bounds.extend(layer.getBounds());
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 16 });
    }
  };

  // Botón GPS para ubicar posición del usuario
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        saveLastKnownLocation(userId, { lat: latitude, lng: longitude });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.5 });
          L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#0284c7',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.95
          }).addTo(mapInstanceRef.current).bindPopup(`📍 Mi ubicación en vivo (±${Math.round(accuracy || 0)}m)`).openPopup();
        }
      },
      (err) => {
        alert('No se pudo obtener la ubicación GPS: ' + (err.message || 'Permiso denegado'));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Centrar en un potrero específico desde la lista
  const handleFocusPaddock = (p) => {
    setSelectedPaddockId(p.id);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (p.polygon && Array.isArray(p.polygon) && p.polygon.length >= 3) {
      const poly = L.polygon(p.polygon);
      map.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 17 });
    } else if (p.centerLat && p.centerLng) {
      map.setView([p.centerLat, p.centerLng], 16);
    }
  };

  // Alternar desplegable de animales de un potrero
  const toggleExpandAnimals = (paddockId) => {
    setExpandedPaddockAnimals(prev => ({
      ...prev,
      [paddockId]: !prev[paddockId]
    }));
  };

  // Abrir modal de rotación
  const handleOpenRotate = (fromPaddockId = null) => {
    setRotationOriginId(fromPaddockId);
    setIsRotateModalOpen(true);
  };

  // Ir al módulo completo de potreros y mapa
  const handleGoToPaddocksMap = () => {
    if (onNavigate) {
      onNavigate('paddocks');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ganado_open_paddocks_map'));
      }, 50);
    }
  };

  return (
    <div className="custom-card p-4 sm:p-6 space-y-5 border border-emerald-500/20 shadow-md">
      
      {/* 1. CABECERA DEL WIDGET */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>🗺️ Mapa Satelital de la Finca & Rotación</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  En Vivo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Monitoreo satelital en tiempo real: lotes, animales por potrero, días de pastoreo y rotación inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenRotate(null)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            title="Mover lote de ganado a otro potrero"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Rotar Ganado</span>
          </button>

          <button
            type="button"
            onClick={handleGoToPaddocksMap}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/25 ring-2 ring-emerald-400/20 transition active:scale-95 cursor-pointer"
            title="Abrir editor completo de potreros y trazar cercas satelitales"
          >
            <Compass className="w-4 h-4" />
            <span>Trazar en Mapa HD</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* 2. CINTA DE PASTILLAS KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Potreros & Ha */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Potreros Mapeados
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">{paddocks.length}</span>
            <span className="text-xs font-bold text-slate-500">potreros</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">({stats.mappedHa} Ha)</span>
          </div>
        </div>

        {/* Ganado en Pastoreo */}
        <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            Ganado en Pastoreo
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">{stats.totalGrazingCattle}</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">cabezas</span>
            <span className="text-[11px] font-bold text-slate-500">({stats.occupiedCount} potreros)</span>
          </div>
        </div>

        {/* Listos para Rotar */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Listos para Entrar
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{stats.readyCount}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">descanso óptimo</span>
          </div>
        </div>

        {/* Alerta de Sobrepastoreo */}
        <div className={`p-3 rounded-2xl border ${
          stats.overgrazedCount > 0 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider block">
            Alerta de Rotación
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-xl font-black ${stats.overgrazedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {stats.overgrazedCount}
            </span>
            <span className="text-xs font-bold">
              {stats.overgrazedCount > 0 ? '⚠️ sobrepastoreo' : '✅ rotación al día'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONTENEDOR PRINCIPAL: MAPA (60%) + PANEL DE LOTES Y ANIMALES (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMNA MAPA SATELITAL (7 COLS) */}
        <div className={`lg:col-span-7 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : ''}`}>
          
          <div className="relative w-full h-[380px] sm:h-[480px] rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner bg-slate-900">
            
            {/* Contenedor del Mapa Leaflet */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Controles Flotantes Superior Izquierda */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-black shadow-lg border border-white/20 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Vista Satelital HD</span>
              </span>
            </div>

            {/* Controles Flotantes Superior Derecha (Capas, GPS, Centrar, Pantalla Completa) */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              
              {/* Selector de Capas */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLayerMenu(prev => !prev)}
                  className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition cursor-pointer"
                  title="Cambiar capa satelital"
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                </button>

                {showLayerMenu && (
                  <div className="absolute right-0 top-11 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2 rounded-2xl shadow-2xl z-20 text-white animate-fadeIn space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 block">
                      Capa Satélite:
                    </span>
                    {Object.values(MAP_TILE_PROVIDERS).map(prov => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => handleChangeBaseLayer(prov.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
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
                title="Ubicar mi GPS"
              >
                <MapPin className="w-4 h-4 text-blue-400" />
              </button>

              {/* Botón Centrar Finca */}
              <button
                type="button"
                onClick={handleFitFarm}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition cursor-pointer"
                title="Centrar finca y potreros"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Botón Pantalla Completa */}
              <button
                type="button"
                onClick={() => setIsFullscreen(prev => !prev)}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition cursor-pointer"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-white" />}
              </button>

            </div>

            {/* Leyenda Semáforo Inferior del Mapa */}
            <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
              <div className="pointer-events-auto max-w-fit mx-auto px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-2xl flex flex-wrap items-center gap-2.5 text-[10px] text-slate-200 font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span>Listo ({stats.readyCount})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <span>Con Ganado ({stats.occupiedCount})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <span>En Rebrote ({stats.restingCount})</span>
                </span>
                {stats.overgrazedCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400 font-black animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm shadow-rose-600/50" />
                    <span>Sobrepastoreo ({stats.overgrazedCount})</span>
                  </span>
                )}
              </div>
            </div>

          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>💡 Toca cualquier potrero en el mapa para ver sus animales y rotación.</span>
            {farmBoundary?.totalAreaHa && (
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Lindero Finca: {farmBoundary.totalAreaHa} Ha ({farmBoundary.perimeterMeters ? `${farmBoundary.perimeterMeters.toLocaleString('es-CO')}m` : ''})
              </span>
            )}
          </p>

        </div>

        {/* COLUMNA LISTA DE LOTES, ANIMALES Y ROTACIÓN (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          
          {/* Cabecera del Panel */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>Ocupación de Potreros ({filteredPaddocks.length})</span>
            </h4>

            {/* Píldoras de Filtro */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('occupied')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'occupied'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                }`}
              >
                <span>Con Ganado</span>
                <span className="font-bold">({stats.occupiedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ready')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'ready'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <span>Listos</span>
                <span className="font-bold">({stats.readyCount})</span>
              </button>
            </div>
          </div>

          {/* Lista de Tarjetas de Potreros con Scroll */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredPaddocks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                No hay potreros en esta categoría.
              </div>
            ) : (
              filteredPaddocks.map(p => {
                const isSelected = selectedPaddockId === p.id;
                const isExpanded = !!expandedPaddockAnimals[p.id];
                const hasGeometry = p.polygon && Array.isArray(p.polygon) && p.polygon.length >= 3;

                return (
                  <div
                    key={p.id}
                    id={`paddock-card-${p.id}`}
                    onClick={() => handleFocusPaddock(p)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'ring-2 ring-emerald-500 shadow-md bg-white dark:bg-slate-800 border-emerald-500' 
                        : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    
                    {/* Encabezado del Potrero */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {hasGeometry ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20" title="Geometría satelital trazada">
                                🛰️ En Mapa
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold" title="Sin trazo satelital">
                                Sin trazo
                              </span>
                            )}
                          </h5>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{p.areaHa || 1} Ha</span>
                          <span>•</span>
                          <span>{p.pastureType || 'Pasto natural'}</span>
                        </div>
                      </div>

                      {/* Badge de Estado */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 flex items-center gap-1 ${
                        p.isOccupied
                          ? p.isGrazingExceeded
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
                          : p.isRestCompleted
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {p.isOccupied ? (
                          p.isGrazingExceeded ? '⚠️ Sobrepastoreo' : '🔴 Ocupado'
                        ) : p.isRestCompleted ? (
                          '✅ Listo para Pastar'
                        ) : (
                          '🌱 En Reposo'
                        )}
                      </span>
                    </div>

                    {/* CUERPO SEGÚN ESTADO: CON GANADO O EN DESCANSO */}
                    {p.isOccupied ? (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
                        
                        {/* Lote y Conteo */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-amber-600" />
                            <span>{p.currentBatchName ? `Lote: ${p.currentBatchName}` : 'Animales en pastoreo'}</span>
                          </span>
                          <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                            🐄 {p.animalsCount} {p.animalsCount === 1 ? 'cabeza' : 'cabezas'}
                          </span>
                        </div>

                        {/* Barra de Tiempo de Pastoreo */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Tiempo de pastoreo:</span>
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              <strong>{p.grazingDays}</strong> de {p.targetGrazing} días recomendados
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.isGrazingExceeded ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, (p.grazingDays / p.targetGrazing) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Desplegable de Aretes de Animales */}
                        {(p.animalsInPaddock.length > 0 || (p.assignedTagNumbers && p.assignedTagNumbers.length > 0)) && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandAnimals(p.id);
                              }}
                              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition cursor-pointer py-1"
                            >
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-emerald-600" />
                                <span>Ver los {p.animalsInPaddock.length || p.assignedTagNumbers?.length} animales en este potrero</span>
                              </span>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                <div className="flex flex-wrap gap-1">
                                  {p.animalsInPaddock.length > 0 ? (
                                    p.animalsInPaddock.map(a => (
                                      <button
                                        key={a.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onSelectAnimal) onSelectAnimal(a);
                                        }}
                                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-800 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-400 transition cursor-pointer flex items-center gap-1"
                                        title={`Ver ficha completa de ${a.tagNumber}`}
                                      >
                                        <span>#{a.tagNumber}</span>
                                        {a.currentWeight && (
                                          <span className="text-[9px] font-normal text-slate-400">({a.currentWeight}kg)</span>
                                        )}
                                      </button>
                                    ))
                                  ) : (
                                    (p.assignedTagNumbers || []).map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1"
                                      >
                                        <span>#{tag}</span>
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botón de Acción Directa: Rotar Lote */}
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">
                            Prom: <strong>{p.avgWeight} kg</strong> ({formatNumber(p.totalWeight)} kg totales)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRotate(p.id);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Rotar Lote</span>
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
                        
                        {/* Descanso */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Descanso: <strong>{p.restDays} días</strong></span>
                          </span>
                          <span className="font-black text-emerald-700 dark:text-emerald-300">
                            Meta: {p.targetRest} días
                          </span>
                        </div>

                        {/* Barra de progreso de descanso */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              p.isRestCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (p.restDays / p.targetRest) * 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-slate-500 text-[10px]">
                            {p.isRestCompleted 
                              ? `✅ Pasto 100% listo (~${p.capacity.maxAnimalsForTargetStay} cab)` 
                              : `Faltan ${Math.max(0, p.targetRest - p.restDays)} días de descanso`}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRotate(null);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            <Boxes className="w-3 h-3" />
                            <span>Meter Ganado</span>
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* MODAL DE ROTACIÓN INTEGRADO */}
      {isRotateModalOpen && (
        <RotateBatchModal
          isOpen={isRotateModalOpen}
          onClose={() => setIsRotateModalOpen(false)}
          paddocks={paddocks}
          cattle={cattle}
          initialFromPaddockId={rotationOriginId}
          onConfirmRotation={onRotateBatch}
        />
      )}

    </div>
  );
}
