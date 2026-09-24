import React, { useState, useEffect } from 'react';
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
  User,
  MapPin,
  Cloud,
  RefreshCw,
  Settings,
  Boxes,
  MessageCircle,
  Wifi,
  WifiOff,
  Stethoscope,
  Users,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CURRENT_APP_VERSION } from '../services/versionService';

export function Navbar({ 
  currentView, 
  setCurrentView, 
  onOpenNewAnimal, 
  onOpenExportImport, 
  onOpenWhatsAppReport,
  onOpenWorkers,
  onOpenProfile, 
  onManualSync,
  isSyncing = false,
  isOnline = true,
  activeCattleCount = 0 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout, isWorker } = useAuth();

  // Cerrar sidebar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Bloquear scroll de fondo cuando el sidebar esté abierto en móvil
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Tablero Principal', shortLabel: 'Tablero', icon: LayoutDashboard, desc: 'Métricas, resumen y alertas' },
    { id: 'cattle', label: 'Inventario de Ganado', shortLabel: 'Ganado', icon: Layers, desc: 'Listado completo, filtros y fichas' },
    { id: 'batches', label: 'Lotes, Ingresos & Comparaciones', shortLabel: 'Lotes & Comparar', icon: Boxes, desc: 'Agrupación y control de potreros' },
    { id: 'palpation', label: 'Palpación & Reprod.', shortLabel: 'Palpación', icon: Stethoscope, desc: 'Preñeces, tactos y estados' },
    { id: 'weights', label: 'Control de Pesos', shortLabel: 'Pesos', icon: Scale, desc: 'Ganancia diaria e historial' },
    { id: 'quickWeigh', label: 'Báscula Rápida', shortLabel: 'Báscula', icon: Zap, desc: 'Pesaje ágil en manga' },
    { id: 'finances', label: 'Ventas & Liquidación', shortLabel: 'Ventas', icon: DollarSign, desc: 'Ingresos, compras y ventas' },
    { id: 'accounting', label: 'Contabilidad & Gastos', shortLabel: 'Contabilidad', icon: Wallet, desc: 'Costos fijos, insumos y balance real' },
  ];

  const displayedNavItems = isWorker ? navItems.filter(item => item.id !== 'finances' && item.id !== 'accounting') : navItems;

  // Agrupación estructurada de módulos por categoría y función
  const navigationGroups = [
    {
      id: 'general',
      title: 'Panel de Control',
      badge: 'Principal',
      badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/40',
      items: [
        { id: 'dashboard', label: 'Tablero Principal', icon: LayoutDashboard, desc: 'Métricas, resumen y alertas' },
      ]
    },
    {
      id: 'herd',
      title: 'Ganadería & Inventario',
      badge: 'Hato',
      badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 border border-teal-300/40',
      items: [
        { id: 'cattle', label: 'Inventario de Ganado', icon: Layers, desc: 'Listado completo, filtros y fichas' },
        { id: 'batches', label: 'Lotes, Ingresos & Comparaciones', icon: Boxes, desc: 'Agrupación y control de potreros' },
        { id: 'weights', label: 'Control de Pesos', icon: Scale, desc: 'Ganancia diaria e historial' },
      ]
    },
    {
      id: 'field_ops',
      title: 'Trabajo en Corral & Manga',
      badge: 'Campo',
      badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-300/40',
      items: [
        { id: 'palpation', label: 'Palpación & Reprod.', icon: Stethoscope, desc: 'Preñeces, tactos y estados' },
        { id: 'quickWeigh', label: 'Báscula Rápida', icon: Zap, desc: 'Pesaje ágil en manga' },
      ]
    },
    ...(!isWorker ? [
      {
        id: 'finances',
        title: 'Finanzas & Contabilidad',
        badge: 'Finanzas',
        badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300/40',
        items: [
          { id: 'accounting', label: 'Contabilidad & Gastos', icon: Wallet, desc: 'Costos fijos, insumos y balance real' },
          { id: 'finances', label: 'Ventas & Liquidación', icon: DollarSign, desc: 'Ingresos, compras y ventas' },
        ]
      }
    ] : [])
  ];

  const handleLogout = () => {
    setIsSidebarOpen(false);
    if (window.confirm(`¿Deseas cerrar la sesión de ${currentUser?.name || 'tu cuenta'}?`)) {
      logout();
    }
  };

  const handleNavigate = (viewId) => {
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
      {/* 1. TOP HEADER (Limpio, elegante, con botón hamburguesa siempre accesible)  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 max-w-[1700px]">
          <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
            
            {/* LADO IZQUIERDO: Botón Menú Hamburguesa Destacado, Más Largo y Grande */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Abrir Menú Principal"
                aria-label="Abrir Menú Principal"
                className="flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white border-2 border-emerald-500 shadow-md shadow-emerald-950/20 cursor-pointer transition-all duration-150 active:scale-95 group shrink-0 min-w-[105px] sm:min-w-[130px]"
              >
                <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-400 dark:text-white stroke-[2.5] group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 dark:text-white select-none">
                  Menú
                </span>
              </button>
            </div>

            {/* CENTRO: Logo, Nombre de Finca y Métricas Rápidas Centrados */}
            <div 
              onClick={() => handleNavigate('dashboard')}
              className="flex-1 flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0 px-2"
              title="Ir al Tablero Principal"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-emerald-500/30 p-0.5 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition overflow-hidden">
                <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover rounded-lg" />
              </div>

              <div className="flex flex-col items-start sm:items-center justify-center min-w-0">
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[120px] sm:max-w-[260px] md:max-w-[380px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-tight">
                  {currentUser?.farmName || 'INVENTARIO BOVINO'}
                </h1>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium mt-0.5">
                  {/* Contador Activo */}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 text-[10px] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}</span>
                  </span>

                  {/* Estado de Conexión */}
                  <span 
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md font-bold text-[10px] border transition-colors whitespace-nowrap ${
                      isOnline
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                    }`}
                    title={isOnline ? '🟢 Conectado a la nube.' : '📡 Modo Campo Offline.'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Modo Campo'}</span>
                  </span>
                </div>
              </div>
            </div>



            {/* LADO DERECHO: Acciones Directas y Perfil */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              
              {/* Botón Principal: + Registrar Bovino */}
              <button
                onClick={onOpenNewAnimal}
                className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white font-black text-xs flex items-center gap-1.5 shadow-sm min-h-[34px] cursor-pointer whitespace-nowrap transition"
                title="Registrar un nuevo animal al inventario"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Registrar Bovino</span>
                <span className="sm:hidden font-bold">+ Bovino</span>
              </button>



              {/* Botón Sincronización Nube */}
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[34px] min-w-[34px] cursor-pointer transition shrink-0"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 text-sky-500" />
                )}
              </button>

              {/* Toggle Tema Oscuro/Claro */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="hidden sm:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 items-center justify-center min-h-[34px] min-w-[34px] cursor-pointer transition shrink-0"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              {/* Avatar / Perfil Rápido */}
              <div 
                onClick={onOpenProfile}
                title="Mi Perfil y Ajustes de Finca"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border cursor-pointer transition group min-h-[34px] whitespace-nowrap shrink-0 ${
                  isWorker
                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg text-white font-black text-[11px] flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition ${
                  isWorker ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {isWorker ? '🤠' : getInitials(currentUser?.name)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight pr-0.5">
                  <span className="text-[11px] font-black truncate max-w-[70px] text-slate-800 dark:text-slate-100">
                    {currentUser?.name ? currentUser.name.split(' ')[0] : 'Perfil'}
                  </span>
                  <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${
                    isWorker ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isWorker ? 'Vaquero' : <><Settings className="w-2.5 h-2.5" /> Ajustes</>}
                  </span>
                </div>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1 min-h-[34px] cursor-pointer transition whitespace-nowrap shrink-0 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="hidden sm:inline">Salir</span>
              </button>

            </div>

          </div>
        </div>
      </header>


      {/* ========================================================================= */}
      {/* 2. PANEL LATERAL DESPLEGABLE (SIDEBAR DRAWER)                             */}
      {/* ========================================================================= */}
      
      {/* Telón de fondo (Backdrop Overlay) */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Cajón Lateral Deslizante */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 sm:w-88 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40">
          <div 
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            onClick={() => handleNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-emerald-500/30 p-1 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                {currentUser?.farmName || 'INVENTARIO BOVINO'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isOnline 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Botón Cerrar Panel */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer shrink-0"
            title="Cerrar panel"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Sidebar con Scroll */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          
          {/* BOTÓN DE ACCIÓN DESTACADA: REGISTRAR BOVINO */}
          <div>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onOpenNewAnimal();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm flex items-center justify-between shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-5 h-5" />
                <span>Registrar Bovino</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>

          {/* SECCIONES CATEGORIZADAS DE MÓDULOS */}
          <div className="space-y-4">
            {navigationGroups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                {/* Cabecera de Categoría */}
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 flex items-center justify-between">
                  <span>{group.title}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${group.badgeClass}`}>
                    {group.badge}
                  </span>
                </div>

                {/* Lista de Módulos de la Categoría */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg transition-colors ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50'
                          }`}>
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="text-left min-w-0">
                            <div className="truncate font-black text-xs">{item.label}</div>
                            <div className={`text-[10px] truncate font-normal ${isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* SECCIÓN FINAL: HERRAMIENTAS DE CAMPO & GESTIÓN */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center justify-between">
              <span>Herramientas de Campo</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300/40">
                Acciones
              </span>
            </div>
            <div className="space-y-1">
              
              {/* Vaqueros y Mayordomos (Admin) */}
              {!isWorker && (
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onOpenWorkers();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs">Vaqueros & Mayordomos</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Gestionar permisos y equipo</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Exportar a Excel / Respaldo (Admin) */}
              {!isWorker && (
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onOpenExportImport();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
                      <DownloadCloud className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs">Exportar a Excel / Respaldo</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Descargar inventario completo</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Reporte WhatsApp */}
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  onOpenWhatsAppReport();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-200 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-xs">Reporte por WhatsApp</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Enviar resumen rápido</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Sincronización Nube Manual */}
              <button
                onClick={() => {
                  onManualSync();
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-900 dark:hover:text-sky-200 transition cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition">
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : (
                      <Cloud className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-black text-xs">Sincronizar con la Nube</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      {isSyncing ? 'Sincronizando ahora...' : 'Actualizar base de datos remota'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                  {isSyncing ? 'Procesando' : 'Sincronizar'}
                </span>
              </button>

            </div>
          </div>

        </div>

        {/* Pie del Sidebar: Perfil, Tema y Salir */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-2">
          
          {/* Perfil & Ajustes */}
          <div 
            onClick={() => {
              setIsSidebarOpen(false);
              onOpenProfile();
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
              isWorker
                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700'
                : 'bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0 ${
                isWorker ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {isWorker ? '🤠' : getInitials(currentUser?.name)}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-black truncate text-slate-900 dark:text-white">
                  {currentUser?.name || 'Mi Perfil'}
                </div>
                <div className={`text-[10px] font-semibold flex items-center gap-1 ${
                  isWorker ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isWorker ? 'Modo Vaquero Campo' : <><Settings className="w-2.5 h-2.5" /> Ajustes de Finca</>}
                </div>
              </div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Fila de Controles Inferiores: Tema y Cerrar Sesión */}
          <div className="flex items-center gap-2 pt-1">
            {/* Toggle Tema */}
            <button
              onClick={toggleTheme}
              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>

            {/* Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Versión y Términos */}
          <div className="text-center pt-1 text-[9px] text-slate-400 dark:text-slate-500 font-medium space-y-0.5">
            <div>Software Ganadero • v{CURRENT_APP_VERSION} • Modo Campo Offline</div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                📜 Términos, Condiciones & Privacidad
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. BARRA INFERIOR MÓVIL (< md) PARA ACCESOS RÁPIDOS CON EL PULGAR          */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,6px)] shadow-lg">
        <div 
          className="grid h-14 items-center px-1"
          style={{ gridTemplateColumns: `repeat(${displayedNavItems.length > 5 ? 5 : displayedNavItems.length}, minmax(0, 1fr))` }}
        >
          {displayedNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 text-[9px] font-bold transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 shadow-sm' : ''}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate max-w-[48px] text-[9px] mt-0.5 leading-tight">{item.shortLabel}</span>
              </button>
            );
          })}

          {/* Botón "Más" para abrir el panel lateral */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center h-full py-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer"
          >
            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Menu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="truncate max-w-[48px] text-[9px] mt-0.5 leading-tight">Menú</span>
          </button>
        </div>
      </nav>
    </>
  );
}
