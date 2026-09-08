import React, { useState } from 'react';
import { 
  Menu,
  X,
  LayoutDashboard, 
  Layers, 
  Scale, 
  DollarSign, 
  PlusCircle, 
  DownloadCloud, 
  Zap,
  Sun,
  Moon,
  LogOut,
  Cloud,
  RefreshCw,
  Settings,
  Boxes,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ 
  currentView, 
  setCurrentView, 
  onOpenNewAnimal, 
  onOpenExportImport, 
  onOpenWhatsAppReport,
  onOpenProfile, 
  onManualSync,
  isSyncing = false,
  activeCattleCount = 0 
}) {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tablero Principal', shortLabel: 'Tablero', icon: LayoutDashboard, desc: 'KPIs, alertas y resumen general' },
    { id: 'cattle', label: 'Inventario de Ganado', shortLabel: 'Inventario', icon: Layers, desc: 'Fichas técnicas y registro individual' },
    { id: 'batches', label: 'Lotes & Ingresos', shortLabel: 'Lotes', icon: Boxes, desc: 'Comparador y análisis por lote' },
    { id: 'weights', label: 'Control de Pesos', shortLabel: 'Pesos', icon: Scale, desc: 'Historial y evolución de pesajes' },
    { id: 'quickWeigh', label: 'Báscula Rápida', shortLabel: 'Báscula', icon: Zap, desc: 'Pesaje ágil en manga / corral', highlight: true },
    { id: 'finances', label: 'Ventas & Utilidades', shortLabel: 'Ventas', icon: DollarSign, desc: 'Liquidaciones, ganancias y compañía' },
  ];

  const currentItem = navItems.find(item => item.id === currentView) || navItems[0];

  const handleLogout = () => {
    if (window.confirm(`¿Deseas cerrar la sesión de ${currentUser?.name || 'tu cuenta'}?`)) {
      setIsSidebarOpen(false);
      logout();
    }
  };

  const handleSelectNav = (viewId) => {
    setCurrentView(viewId);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const getInitials = (name) => {
    if (!name) return '🐂';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR FIJA (HEADER)                                           */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6">
          
          <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
            
            {/* LADO IZQUIERDO: Botón Menú Lateral Desplegable + Logo & Finca */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* BOTÓN HAMBURGUESA / MENÚ LATERAL DESPLEGABLE */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="px-2.5 sm:px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-2 font-black text-xs sm:text-sm cursor-pointer transition shadow-sm active:scale-95 group"
                title="Abrir menú lateral desplegable"
              >
                <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden xs:inline">Menú</span>
              </button>

              {/* Logo e Identidad de la Finca */}
              <div 
                onClick={() => handleSelectNav('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Ir al Tablero / Inicio"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/25 flex items-center justify-center text-white shrink-0 group-hover:scale-105 active:scale-95 transition">
                  <span className="text-lg sm:text-xl select-none">🐂</span>
                </div>

                <div className="flex flex-col justify-center min-w-0">
                  <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[260px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-tight">
                    {currentUser?.farmName || 'INVENTARIO BOVINO'}
                  </h1>

                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium mt-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* CENTRO: Indicador del Módulo Activo Actual (Visible en Pantallas Medianas y Grandes) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="p-1 rounded-lg bg-emerald-600 text-white">
                <currentItem.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {currentItem.label}
              </span>
            </div>

            {/* LADO DERECHO: Accesos Rápidos Principales */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Botón Principal: + Registrar Bovino */}
              <button
                onClick={onOpenNewAnimal}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white font-black text-xs flex items-center gap-1.5 shadow-sm min-h-[36px] cursor-pointer whitespace-nowrap"
                title="Registrar un nuevo animal al inventario"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Registrar Bovino</span>
                <span className="sm:hidden">+ Bovino</span>
              </button>

              {/* Botón Excel */}
              <button
                onClick={onOpenExportImport}
                title="Exportar a Excel / Respaldo"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[36px] cursor-pointer transition whitespace-nowrap"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </button>

              {/* Botón WhatsApp */}
              <button
                onClick={onOpenWhatsAppReport}
                title="Generar y Enviar Reporte por WhatsApp"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold min-h-[36px] cursor-pointer transition whitespace-nowrap shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {/* Botón Sincronización Nube */}
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="hidden sm:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer transition"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                )}
              </button>

              {/* Toggle Modo Oscuro / Claro */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="hidden sm:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer transition"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              </button>

              {/* Botón Perfil / Ajustes */}
              <div 
                onClick={onOpenProfile}
                title="Mi Perfil, Nombre de Finca y Ajustes"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200 cursor-pointer transition group min-h-[36px] whitespace-nowrap"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight pr-0.5">
                  <span className="text-xs font-black truncate max-w-[80px] text-slate-800 dark:text-slate-100">
                    {currentUser?.name ? currentUser.name.split(' ')[0] : 'Perfil'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Settings className="w-2.5 h-2.5" /> Ajustes
                  </span>
                </div>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold items-center gap-1.5 min-h-[36px] cursor-pointer transition whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Salir</span>
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MENÚ LATERAL IZQUIERDO DESPLEGABLE (OFFCANVAS / DRAWER OVERLAY)         */}
      {/* ========================================================================= */}
      
      {/* Fondo Oscuro / Overlay con Animación */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel Desplegable Lateral Izquierdo */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-84 max-w-[88vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Menú Lateral */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/20 via-teal-950/10 to-transparent">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
              <span className="text-xl select-none">🐂</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">
                {currentUser?.farmName || 'MI FINCA GANADERA'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeCattleCount} {activeCattleCount === 1 ? 'animal activo' : 'animales activos'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition active:scale-95"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll de Opciones */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          
          {/* SECCIÓN 1: MÓDULOS DE NAVEGACIÓN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Módulos Principales
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                6 secciones
              </span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-150 cursor-pointer group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/25 ring-2 ring-emerald-500/30 font-black'
                      : item.highlight
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300/80 dark:border-amber-700/60 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white border border-transparent font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : item.highlight
                          ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm truncate">{item.label}</span>
                        {item.highlight && !isActive && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                            Chute
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive 
                      ? 'text-white translate-x-1' 
                      : 'text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* SECCIÓN 2: ACCIONES Y HERRAMIENTAS RÁPIDAS */}
          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 block mb-1">
              Acciones & Reportes
            </span>

            {/* Registrar Nuevo Bovino */}
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onOpenNewAnimal();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Registrar Nuevo Bovino</span>
            </button>

            {/* Exportar / Reporte Excel */}
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onOpenExportImport();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Reportes & Exportar Excel</span>
            </button>

            {/* Generar WhatsApp */}
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onOpenWhatsAppReport();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Generar Informe WhatsApp</span>
            </button>

            {/* Sincronización en Nube */}
            <button
              onClick={() => {
                onManualSync();
                setIsSidebarOpen(false);
              }}
              disabled={isSyncing}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 text-sky-500" />
                )}
                <span>{isSyncing ? 'Sincronizando datos...' : 'Sincronizar con la Nube'}</span>
              </div>
              <span className="text-[10px] text-slate-400">Manual</span>
            </button>
          </div>

        </div>

        {/* Pie del Menú Lateral (Perfil, Tema, Cerrar Sesión) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50 dark:bg-slate-950/60">
          
          <div className="flex items-center justify-between gap-2">
            
            {/* Botón Mi Perfil & Ajustes */}
            <div 
              onClick={() => {
                setIsSidebarOpen(false);
                onOpenProfile();
              }}
              className="flex-1 flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                {getInitials(currentUser?.name)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black truncate block">
                  {currentUser?.name || 'Mi Perfil'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <Settings className="w-2.5 h-2.5" /> Ajustes de Finca
                </span>
              </div>
            </div>

            {/* Switch de Tema Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </aside>
    </>
  );
}
