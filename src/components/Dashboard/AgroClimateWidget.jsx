import React, { useState, useEffect, useMemo } from 'react';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  Droplets, 
  Wind, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  ArrowUpRight,
  ChevronRight,
  Thermometer,
  Calendar,
  MapPin,
  Mountain,
  Home,
  Edit3,
  X,
  Save,
  Navigation,
  Check
} from 'lucide-react';
import { fetchAgroWeatherData, getITHLevel, getThermalFloor } from '../../services/weatherService';
import { 
  getFarmBoundary, 
  getFarmLocationProfile, 
  saveFarmLocationProfile, 
  COLOMBIAN_CATTLE_REGIONS,
  DEFAULT_FARM_LOCATION 
} from '../../services/mapService';

export function AgroClimateWidget({
  userId = null,
  paddocks = [],
  onOpenNewRain = null
}) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Perfil geográfico y de altitud de la finca
  const [locationProfile, setLocationProfile] = useState(() => getFarmLocationProfile(userId));
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editForm, setEditForm] = useState({
    farmName: locationProfile?.farmName || DEFAULT_FARM_LOCATION.farmName,
    vereda: locationProfile?.vereda || DEFAULT_FARM_LOCATION.vereda,
    municipality: locationProfile?.municipality || DEFAULT_FARM_LOCATION.municipality,
    department: locationProfile?.department || DEFAULT_FARM_LOCATION.department,
    region: locationProfile?.region || DEFAULT_FARM_LOCATION.region,
    altitudeMeters: locationProfile?.altitudeMeters ?? DEFAULT_FARM_LOCATION.altitudeMeters,
  });

  // Escuchar cambios de ubicación
  useEffect(() => {
    setLocationProfile(getFarmLocationProfile(userId));
    const handleLocationChange = (e) => {
      if (e.detail) {
        setLocationProfile(e.detail);
      }
    };
    window.addEventListener('ganado_farm_location_changed', handleLocationChange);
    return () => window.removeEventListener('ganado_farm_location_changed', handleLocationChange);
  }, [userId]);

  // Obtener coordenadas de la finca o del primer potrero
  const farmCoords = useMemo(() => {
    const boundary = getFarmBoundary(userId);
    if (boundary && boundary.polygon && boundary.polygon.length > 0) {
      return { lat: boundary.polygon[0][0], lng: boundary.polygon[0][1] };
    }
    const withCoords = paddocks.find(p => p.centerLat && p.centerLng);
    if (withCoords) {
      return { lat: withCoords.centerLat, lng: withCoords.centerLng };
    }
    // Puerto Berrío, Magdalena Medio por defecto
    return { lat: 6.4913, lng: -74.4042 };
  }, [userId, paddocks]);

  const loadWeather = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAgroWeatherData(farmCoords.lat, farmCoords.lng, force);
      setWeatherData(data);
    } catch (e) {
      console.warn('Error cargando clima:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather(false);
  }, [farmCoords.lat, farmCoords.lng]);

  const current = weatherData?.current;
  const ithLevel = current?.ithLevel || getITHLevel(70);
  const forecast = weatherData?.forecastDays || [];

  // Altitud efectiva (prioriza la editada por el usuario o la arrojada por el modelo satelital DEM de Open-Meteo)
  const effectiveAltitude = locationProfile?.altitudeMeters ?? weatherData?.elevation ?? 125;
  const thermalFloor = getThermalFloor(effectiveAltitude);

  const handleSaveLocation = (e) => {
    e?.preventDefault();
    const cleanProfile = {
      farmName: editForm.farmName.trim() || 'Finca Ganadera',
      vereda: editForm.vereda.trim() || 'Vereda Central',
      municipality: editForm.municipality.trim() || 'Puerto Berrío',
      department: editForm.department.trim() || 'Antioquia',
      region: editForm.region.trim() || 'Magdalena Medio',
      altitudeMeters: Math.max(0, parseInt(editForm.altitudeMeters, 10) || 125),
    };
    saveFarmLocationProfile(userId, cleanProfile);
    setLocationProfile(cleanProfile);
    setIsEditingLocation(false);
  };

  const handleSelectRegionPreset = (regionPreset) => {
    setEditForm(prev => ({
      ...prev,
      region: regionPreset.region || regionPreset.name,
      municipality: regionPreset.municipality || prev.municipality,
      department: regionPreset.department || prev.department,
      altitudeMeters: regionPreset.altitude ?? prev.altitudeMeters
    }));
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-700/80 shadow-xl relative overflow-hidden space-y-4">
      
      {/* Luz ambiental decorativa */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
        ithLevel.color === 'emerald' ? 'bg-emerald-500' :
        ithLevel.color === 'amber' ? 'bg-amber-500' :
        ithLevel.color === 'orange' ? 'bg-orange-500' : 'bg-rose-500'
      }`} />

      {/* 1. CABECERA DEL WIDGET */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-md shadow-sky-600/30">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <span>Pronóstico Agroclimático & Estrés Térmico (ITH)</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Satelital
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Monitoreo en vivo de confort bovino, lluvias y calor para pastoreo
            </p>
          </div>
        </div>

        {/* Botón Refrescar Clima */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => loadWeather(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Actualizar datos meteorológicos satelitales"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. ESPACIO EXCLUSIVO: UBICACIÓN GEOGRÁFICA, ZONA, DEPARTAMENTO, VEREDA Y ALTURA DE LA FINCA (m.s.n.m.) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 backdrop-blur-sm relative overflow-hidden">
        {/* Cabecera del espacio de ubicación */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <span>Ubicación Geográfica & Altura de la Finca</span>
              </span>
              <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>{locationProfile?.farmName || 'Finca Principal'}</span>
                <span className="text-slate-400 font-normal">• Vereda {locationProfile?.vereda || 'Las Delicias'}</span>
              </h5>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditForm({
                farmName: locationProfile?.farmName || DEFAULT_FARM_LOCATION.farmName,
                vereda: locationProfile?.vereda || DEFAULT_FARM_LOCATION.vereda,
                municipality: locationProfile?.municipality || DEFAULT_FARM_LOCATION.municipality,
                department: locationProfile?.department || DEFAULT_FARM_LOCATION.department,
                region: locationProfile?.region || DEFAULT_FARM_LOCATION.region,
                altitudeMeters: effectiveAltitude,
              });
              setIsEditingLocation(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white border border-slate-600 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Editar Ubicación</span>
          </button>
        </div>

        {/* Cuadrícula de 4 Parámetros Clave: Municipio/Depto, Región/Zona, Altitud m.s.n.m. y Piso Térmico */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
          
          {/* A. Municipio y Departamento */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span>Municipio & Depto</span>
            </span>
            <div className="mt-1">
              <p className="text-xs font-black text-white leading-tight">
                {locationProfile?.municipality || 'Puerto Berrío'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {locationProfile?.department || 'Antioquia'}, Colombia
              </p>
            </div>
          </div>

          {/* B. Zona / Región Ganadera */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Zona / Región</span>
            </span>
            <div className="mt-1">
              <p className="text-xs font-black text-amber-300 leading-tight">
                {locationProfile?.region || 'Magdalena Medio'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Cuenca Ganadera
              </p>
            </div>
          </div>

          {/* C. Altura sobre el Nivel del Mar (m.s.n.m.) */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Mountain className="w-3 h-3 text-emerald-400" />
              <span>Altura de la Finca</span>
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <p className="text-sm font-black text-emerald-400 tracking-tight">
                {effectiveAltitude}
              </p>
              <span className="text-[10px] font-bold text-slate-300 uppercase">m.s.n.m.</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">
              Metros sobre el nivel del mar
            </p>
          </div>

          {/* D. Piso Térmico Zootécnico */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-rose-400" />
                <span>Piso Térmico</span>
              </span>
              <span className="text-sm">{thermalFloor.emoji}</span>
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${thermalFloor.badgeClass}`}>
                {thermalFloor.floor} ({thermalFloor.elevationRange})
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 line-clamp-1" title={thermalFloor.description}>
              {thermalFloor.name}
            </p>
          </div>

        </div>

        {/* Fila inferior complementaria: Vereda + Coordenadas GPS */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Home className="w-3 h-3 text-slate-500" />
            <span>Vereda: <strong className="text-slate-200">{locationProfile?.vereda || 'Las Delicias'}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px]">
            <Navigation className="w-2.5 h-2.5 text-sky-400" />
            <span>GPS: {farmCoords.lat.toFixed(4)}°, {farmCoords.lng.toFixed(4)}°</span>
          </div>
        </div>
      </div>

      {/* 3. DATOS ACTUALES + SEMÁFORO ITH */}
      {loading && !weatherData ? (
        <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
          Consultando satélite meteorológico y calculando ITH de la finca...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
          
          {/* Bloque Temperatura y Condiciones Actuales (4 cols) */}
          <div className="md:col-span-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Tiempo Actual en la Finca
              </span>
              <span className="text-xl">{current?.weatherInfo?.emoji || '🌤️'}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {current?.temp ?? 29}°C
              </span>
              <span className="text-xs font-bold text-slate-300">
                {current?.weatherInfo?.label || 'Parcialmente despejado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Humedad: <strong>{current?.humidity ?? 75}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Viento: <strong>{current?.wind ?? 8} km/h</strong></span>
              </div>
            </div>
          </div>

          {/* Bloque Medidor de Estrés Térmico ITH (5 cols) */}
          <div className={`md:col-span-5 p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 ${
            ithLevel.color === 'emerald' ? 'bg-emerald-950/30 border-emerald-500/40' :
            ithLevel.color === 'amber' ? 'bg-amber-950/30 border-amber-500/40' :
            ithLevel.color === 'orange' ? 'bg-orange-950/30 border-orange-500/40' :
            'bg-rose-950/40 border-rose-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Índice ITH Bovino</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ithLevel.badgeClass}`}>
                {ithLevel.shortLabel} ({current?.ith ?? 74})
              </span>
            </div>

            {/* Barra Visual de Rangos ITH */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>&lt;72 Confort</span>
                <span>72-78 Leve</span>
                <span>79-88 Peligro</span>
                <span>&gt;88 Emergencia</span>
              </div>
              
              <div className="w-full h-3 bg-slate-950/80 rounded-full overflow-hidden p-0.5 flex gap-1 border border-slate-700">
                <div className={`h-full rounded-full transition-all duration-500 ${ithLevel.color === 'emerald' ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-emerald-900/40'}`} style={{ width: '25%' }} title="Confort (&lt;72)" />
                <div className={`h-full rounded-full transition-all duration-500 ${ithLevel.color === 'amber' ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-amber-900/40'}`} style={{ width: '25%' }} title="Alerta Leve (72-78)" />
                <div className={`h-full rounded-full transition-all duration-500 ${ithLevel.color === 'orange' ? 'bg-orange-500 shadow-sm shadow-orange-500' : 'bg-orange-900/40'}`} style={{ width: '25%' }} title="Peligro Moderado (79-88)" />
                <div className={`h-full rounded-full transition-all duration-500 ${ithLevel.color === 'rose' ? 'bg-rose-600 shadow-sm shadow-rose-600 animate-pulse' : 'bg-rose-950/40'}`} style={{ width: '25%' }} title="Emergencia (&gt;88)" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-medium leading-tight">
              {ithLevel.description}
            </p>
          </div>

          {/* Bloque Recomendación Zootécnica de Manejo (3 cols) */}
          <div className="md:col-span-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manejo en Campo</span>
            </span>

            <p className="text-xs text-slate-200 font-bold leading-snug">
              {ithLevel.actionAdvice}
            </p>

            {onOpenNewRain && (
              <button
                type="button"
                onClick={onOpenNewRain}
                className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <CloudRain className="w-3 h-3" />
                <span>+ Medir Pluviómetro</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* 4. TIRA DE PRONÓSTICO A 7 DÍAS */}
      {forecast.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>Pronóstico Satelital a 7 Días</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Probabilidad de Lluvia y Temperatura Máx / Mín
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto pb-1">
            {forecast.map((day, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-between ${
                  i === 0 
                    ? 'bg-slate-800/90 border-sky-500/50 ring-1 ring-sky-500/30' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                }`}
              >
                <span className="text-[10px] font-black text-slate-300 uppercase">
                  {i === 0 ? 'Hoy' : day.dayName}
                </span>

                <span className="text-lg my-0.5">{day.weatherInfo?.emoji || '⛅'}</span>

                <div className="text-[11px] font-black text-white">
                  <span>{day.maxTemp}°</span>
                  <span className="text-slate-400 text-[9px] font-normal ml-0.5">/{day.minTemp}°</span>
                </div>

                {/* Lluvia esperada */}
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-sky-400 mt-1">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{day.rainMm > 0 ? `${day.rainMm}mm` : `${day.rainProb}%`}</span>
                </div>

                {/* Pastilla mini de ITH estimado */}
                <span className={`mt-1 px-1.5 py-0.2 rounded-md text-[8px] font-black uppercase ${day.ithLevel.badgeClass}`}>
                  ITH {day.ith}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MODAL DE EDICIÓN DE UBICACIÓN Y ALTURA DE LA FINCA */}
      {isEditingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Cabecera del modal */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ubicación y Altitud de la Finca
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configura vereda, departamento, zona y altura sobre el nivel del mar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingLocation(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveLocation} className="p-5 space-y-4 overflow-y-auto">
              
              {/* Selector Rápido de Zona Ganadera en Colombia */}
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Plantilla Rápida de Región Ganadera (Opcional)</span>
                </label>
                <select
                  onChange={(e) => {
                    const found = COLOMBIAN_CATTLE_REGIONS.find(r => r.name === e.target.value);
                    if (found) handleSelectRegionPreset(found);
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>Selecciona una región para auto-rellenar...</option>
                  {COLOMBIAN_CATTLE_REGIONS.map((r, idx) => (
                    <option key={idx} value={r.name}>
                      {r.name} ({r.altitude} m.s.n.m.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de la Finca */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre del Predio / Finca
                </label>
                <input
                  type="text"
                  value={editForm.farmName}
                  onChange={(e) => setEditForm({ ...editForm, farmName: e.target.value })}
                  placeholder="Ej: Hacienda Santa Teresa, El Porvenir"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Vereda / Corregimiento */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Vereda o Corregimiento
                </label>
                <input
                  type="text"
                  value={editForm.vereda}
                  onChange={(e) => setEditForm({ ...editForm, vereda: e.target.value })}
                  placeholder="Ej: Vereda Las Delicias, Corregimiento La Cabaña"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Municipio & Departamento en 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    value={editForm.municipality}
                    onChange={(e) => setEditForm({ ...editForm, municipality: e.target.value })}
                    placeholder="Ej: Puerto Berrío, Montería"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="Ej: Antioquia, Córdoba, Cesar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Zona / Región Ganadera */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Zona / Subregión Ganadera
                </label>
                <input
                  type="text"
                  value={editForm.region}
                  onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                  placeholder="Ej: Magdalena Medio, Sabana de Córdoba, Llanos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Altura sobre el nivel del mar (m.s.n.m.) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Altura de la Finca (m.s.n.m.)</span>
                  </label>
                  {weatherData?.elevation && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, altitudeMeters: weatherData.elevation })}
                      className="text-[10px] text-sky-400 hover:text-sky-300 underline font-bold cursor-pointer"
                    >
                      Usar Satélite ({weatherData.elevation} m)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={editForm.altitudeMeters}
                    onChange={(e) => setEditForm({ ...editForm, altitudeMeters: e.target.value })}
                    placeholder="Ej: 125"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 pr-20"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    m.s.n.m.
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Piso térmico calculado: <strong className="text-emerald-400">{getThermalFloor(editForm.altitudeMeters).name}</strong> ({getThermalFloor(editForm.altitudeMeters).elevationRange})
                </p>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingLocation(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-700/30 transition active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Ubicación</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
