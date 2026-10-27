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
  Calendar
} from 'lucide-react';
import { fetchAgroWeatherData, getITHLevel } from '../../services/weatherService';
import { getFarmBoundary } from '../../services/mapService';

export function AgroClimateWidget({
  userId = null,
  paddocks = [],
  onOpenNewRain = null
}) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      {/* 2. DATOS ACTUALES + SEMÁFORO ITH */}
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

      {/* 3. TIRA DE PRONÓSTICO A 7 DÍAS */}
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

    </div>
  );
}
