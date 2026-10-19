import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Building2, 
  Users, 
  Layers, 
  Scale, 
  Download, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Database,
  Activity,
  Milk,
  Zap,
  Info
} from 'lucide-react';

const SUPERADMIN_EMAIL = 'criaderosantateresa21@gmail.com';
const FIREBASE_URL = 'https://ganadera-plataforma-default-rtdb.firebaseio.com';

export function SuperAdminView({ currentUser, onNavigate, showToast }) {
  const isSuperAdmin = currentUser?.email?.toLowerCase().trim() === SUPERADMIN_EMAIL;

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreset, setFilterPreset] = useState('ALL');
  const [selectedFarmDetail, setSelectedFarmDetail] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Cargar datos de todas las fincas desde Firebase RTDB
  const fetchAllFarmsData = async () => {
    try {
      setRefreshing(true);
      // 1. Obtener todas las cuentas registradas
      const usersRes = await fetch(`${FIREBASE_URL}/users.json?_t=${Date.now()}`);
      if (!usersRes.ok) throw new Error('No se pudo consultar el listado de usuarios');
      
      const usersData = await usersRes.json();
      if (!usersData || typeof usersData !== 'object') {
        setFarms([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const usersList = Object.entries(usersData).map(([key, u]) => {
        let decodedEmail = '';
        try {
          decodedEmail = decodeURIComponent(key.replace(/_dot_/g, '.'));
        } catch (e) {
          decodedEmail = key.replace(/_dot_/g, '.');
        }
        return {
          key,
          ...u,
          email: u?.email || (decodedEmail.includes('@') ? decodedEmail : ''),
          name: u?.name || (decodedEmail.includes('@') ? decodedEmail.split('@')[0] : 'En registro'),
          farmName: u?.farmName || (decodedEmail.includes('@') ? `Finca (${decodedEmail.split('@')[0]})` : 'Sin Nombre de Finca')
        };
      });

      // 2. Para cada finca, consultar métricas de su nodo /userData/{id}
      const farmsWithData = await Promise.all(
        usersList.map(async (u) => {
          let cattleCount = 0;
          let weighingsCount = 0;
          let milkRecordsCount = 0;
          let lastSyncedAt = u.updatedAt || u.createdAt || null;
          let rawUserData = null;

          if (u.id) {
            try {
              const dataRes = await fetch(`${FIREBASE_URL}/userData/${u.id}.json?_t=${Date.now()}`);
              if (dataRes.ok) {
                const uData = await dataRes.json();
                if (uData && typeof uData === 'object') {
                  rawUserData = uData;
                  if (uData.syncedAt) lastSyncedAt = uData.syncedAt;
                  
                  if (uData.cattle) {
                    cattleCount = Array.isArray(uData.cattle) 
                      ? uData.cattle.filter(Boolean).length 
                      : Object.keys(uData.cattle).length;
                  }
                  if (uData.weighings) {
                    weighingsCount = Array.isArray(uData.weighings) 
                      ? uData.weighings.filter(Boolean).length 
                      : Object.keys(uData.weighings).length;
                  }
                  if (uData.milkRecords) {
                    milkRecordsCount = Array.isArray(uData.milkRecords) 
                      ? uData.milkRecords.filter(Boolean).length 
                      : Object.keys(uData.milkRecords).length;
                  }
                }
              }
            } catch (err) {
              console.warn(`Error al consultar datos de ${u.id}:`, err);
            }
          }

          return {
            ...u,
            cattleCount,
            weighingsCount,
            milkRecordsCount,
            lastSyncedAt,
            rawUserData
          };
        })
      );

      // Ordenar por última actividad descendente
      farmsWithData.sort((a, b) => {
        const timeA = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
        const timeB = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
        return timeB - timeA;
      });

      setFarms(farmsWithData);
    } catch (err) {
      console.error('Error cargando datos de SuperAdmin:', err);
      if (showToast) showToast('Error al conectar con Firebase: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllFarmsData();
    }
  }, [isSuperAdmin]);

  // Si no es el SuperAdmin, mostrar pantalla de bloqueo
  if (!isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 text-white text-center border border-rose-500/30 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black mb-2">Acceso Restringido</h2>
        <p className="text-slate-400 text-sm mb-6">
          Esta vista es exclusiva para la cuenta administradora de la plataforma.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs transition"
        >
          Volver al Tablero Principal
        </button>
      </div>
    );
  }

  // Métricas Globales
  const totalFarms = farms.length;
  const totalCattle = useMemo(() => farms.reduce((acc, f) => acc + (f.cattleCount || 0), 0), [farms]);
  const totalWeighings = useMemo(() => farms.reduce((acc, f) => acc + (f.weighingsCount || 0), 0), [farms]);
  
  const activeFarmsThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return farms.filter(f => f.lastSyncedAt && new Date(f.lastSyncedAt).getTime() > oneWeekAgo).length;
  }, [farms]);

  // Filtros de búsqueda
  const filteredFarms = useMemo(() => {
    return farms.filter(f => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (f.farmName && f.farmName.toLowerCase().includes(q)) ||
        (f.name && f.name.toLowerCase().includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q));

      const matchesPreset = filterPreset === 'ALL' || 
        (f.farmPreset && f.farmPreset.toUpperCase() === filterPreset.toUpperCase());

      return matchesSearch && matchesPreset;
    });
  }, [farms, searchQuery, filterPreset]);

  // Descargar Copia de Seguridad JSON de 1 Finca
  const handleDownloadBackup = async (farm) => {
    try {
      setDownloadingId(farm.id || farm.email);
      // Obtener datos más frescos si no están en memoria
      let backupData = farm.rawUserData;
      if (!backupData && farm.id) {
        const res = await fetch(`${FIREBASE_URL}/userData/${farm.id}.json?_t=${Date.now()}`);
        if (res.ok) backupData = await res.json();
      }

      const fullDump = {
        farmProfile: {
          id: farm.id,
          name: farm.name,
          farmName: farm.farmName,
          email: farm.email,
          farmPreset: farm.farmPreset,
          activeModules: farm.activeModules,
          createdAt: farm.createdAt,
          updatedAt: farm.updatedAt,
        },
        farmData: backupData || {},
        exportedAt: new Date().toISOString(),
        systemVersion: '2.24.7',
      };

      const jsonStr = JSON.stringify(fullDump, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeFarmName = (farm.farmName || 'finca').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup_${safeFarmName}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (showToast) showToast(`Copia de seguridad descargada para ${farm.farmName}`, 'success');
    } catch (e) {
      console.error('Error generando backup:', e);
      if (showToast) showToast('Error al descargar copia de seguridad', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatActivityTime = (isoString) => {
    if (!isoString) return { text: 'Sin registro', status: 'offline' };
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 24) {
        return { 
          text: diffHours <= 1 ? 'Activa hoy' : `Hace ${diffHours} horas`, 
          status: 'today' 
        };
      }
      if (diffDays <= 7) {
        return { 
          text: `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`, 
          status: 'week' 
        };
      }
      return { 
        text: date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }), 
        status: 'old' 
      };
    } catch {
      return { text: 'Fecha inválida', status: 'offline' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CABECERA SUPERADMIN */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 text-white border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition cursor-pointer border border-white/20 shrink-0"
              title="Volver al Tablero Principal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md">
                  <Crown className="w-3.5 h-3.5" />
                  SUPERADMINISTRADOR
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Control Maestro
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight">
                Centro de Monitoreo & Ganaderías en Vivo
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Supervisión global de fincas activas en Firebase y copias de seguridad de soporte técnico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={fetchAllFarmsData}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              title="Recargar datos desde Firebase"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Actualizando...' : 'Refrescar Datos'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS GLOBALES (KPIS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Fincas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fincas en la Nube
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '...' : totalFarms}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Registros activos
            </span>
          </div>
        </div>

        {/* Censo Bovino Total */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Censo Bovino Global
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '...' : totalCattle}
            </h3>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Cabezas registradas
            </span>
          </div>
        </div>

        {/* Fincas Activas Semana */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Actividad Semanal
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '...' : activeFarmsThisWeek}
            </h3>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Fincas sincronizadas
            </span>
          </div>
        </div>

        {/* Total Pesajes Registrados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pesajes en Manga
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '...' : totalWeighings}
            </h3>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              Registros históricos
            </span>
          </div>
        </div>

      </div>

      {/* 3. BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Input Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar finca, ganadero o correo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros por Tipo */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Tipo:
          </span>
          {['ALL', 'COMPLETO', 'CEBA', 'CRIA'].map((preset) => (
            <button
              key={preset}
              onClick={() => setFilterPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterPreset === preset
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {preset === 'ALL' ? 'Todas' : preset}
            </button>
          ))}
        </div>

      </div>

      {/* 4. LISTADO DE FINCAS EN VIVO */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Consultando base de datos de Firebase...
            </p>
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              No se encontraron fincas que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const activity = formatActivityTime(farm.lastSyncedAt);
            const isDownloading = downloadingId === (farm.id || farm.email);

            return (
              <div 
                key={farm.key || farm.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-amber-400/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Lado Izquierdo: Información Finca */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    {farm.farmName ? farm.farmName.charAt(0).toUpperCase() : '🐂'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {farm.farmName || 'Sin Nombre de Finca'}
                      </h4>
                      
                      {/* Badge Tipo / Preset */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        {farm.farmPreset || 'COMPLETO'}
                      </span>

                      {/* Badge Actividad */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activity.status === 'today'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                          : activity.status === 'week'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activity.status === 'today' ? 'bg-emerald-500 animate-pulse' :
                          activity.status === 'week' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}></span>
                        {activity.text}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold">{farm.name || 'Sin nombre'}</strong>
                      {farm.email ? ` • ${farm.email}` : ''}
                    </p>

                    {/* Módulos Activos */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                      {farm.activeModules?.ceba_batches && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-bold">
                          Ceba
                        </span>
                      )}
                      {farm.activeModules?.milk && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-bold">
                          Lechería
                        </span>
                      )}
                      {farm.activeModules?.reproduction && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 font-bold">
                          Reprod.
                        </span>
                      )}
                      {farm.activeModules?.weights && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 font-bold">
                          Pesajes
                        </span>
                      )}
                      {farm.activeModules?.iatf && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 font-bold">
                          IATF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Conteos y Acciones */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  
                  {/* Conteo de Ganado y Pesajes */}
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {farm.cattleCount}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {farm.cattleCount === 1 ? 'animal' : 'animales'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      {farm.weighingsCount} pesajes
                    </span>
                  </div>

                  {/* Botones de Soporte */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadBackup(farm)}
                      disabled={isDownloading}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-slate-300/60 dark:border-slate-700 active:scale-95"
                      title="Descargar copia de seguridad completa (.JSON) de esta finca"
                    >
                      <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                      <span className="hidden sm:inline">Backup JSON</span>
                    </button>

                    <button
                      onClick={() => setSelectedFarmDetail(farm)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-300/60 dark:border-slate-700"
                      title="Ver ficha técnica de la finca"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE DETALLE DE FINCA */}
      {selectedFarmDetail && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedFarmDetail(null);
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white space-y-4 cursor-default"
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-lg">
                  {selectedFarmDetail.farmName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFarmDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Propietario:</span>
                <span className="font-bold">{selectedFarmDetail.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Correo:</span>
                <span className="font-bold">{selectedFarmDetail.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">ID Interno Firebase:</span>
                <span className="font-mono text-[11px] text-slate-400">{selectedFarmDetail.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Total Bovinos:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{selectedFarmDetail.cattleCount} animales</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Total Pesajes:</span>
                <span className="font-bold">{selectedFarmDetail.weighingsCount} registros</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Fecha de Registro:</span>
                <span className="font-bold">
                  {selectedFarmDetail.createdAt ? new Date(selectedFarmDetail.createdAt).toLocaleString('es-CO') : 'No disponible'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Última Sincronización:</span>
                <span className="font-bold text-amber-500">
                  {selectedFarmDetail.lastSyncedAt ? new Date(selectedFarmDetail.lastSyncedAt).toLocaleString('es-CO') : 'Sin sincronizar'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => handleDownloadBackup(selectedFarmDetail)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Copia Completa
              </button>
              <button
                onClick={() => setSelectedFarmDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
