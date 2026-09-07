import React from 'react';
import { 
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
  Boxes
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ 
  currentView, 
  setCurrentView, 
  onOpenNewAnimal, 
  onOpenExportImport, 
  onOpenProfile, 
  onManualSync,
  isSyncing = false,
  activeCattleCount = 0 
}) {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Tablero', shortLabel: 'Tablero', icon: LayoutDashboard },
    { id: 'cattle', label: 'Inventario', shortLabel: 'Ganado', icon: Layers },
    { id: 'batches', label: 'Lotes & Ingresos', shortLabel: 'Lotes', icon: Boxes },
    { id: 'weights', label: 'Control Pesos', shortLabel: 'Pesos', icon: Scale },
    { id: 'quickWeigh', label: 'Báscula Rápida', shortLabel: 'Báscula', icon: Zap },
    { id: 'finances', label: 'Ventas & Utilidades', shortLabel: 'Ventas', icon: DollarSign },
  ];

  const handleLogout = () => {
    if (window.confirm(`¿Deseas cerrar la sesión de ${currentUser?.name || 'tu cuenta'}?`)) {
      logout();
    }
  };

  const handleNavigate = (viewId) => {
    setCurrentView(viewId);
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
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6">
          
          {/* VISTA ESCRITORIO / TABLET (sm: y superior) -> Todo en una fila elegante */}
          <div className="hidden sm:flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
            
            {/* LADO IZQUIERDO: Logo & Identidad de la Finca */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div 
                onClick={() => handleNavigate('dashboard')}
                title="Ir al Tablero / Panel Principal"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/25 flex items-center justify-center text-white shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition"
              >
                <span className="text-lg sm:text-xl select-none">🐂</span>
              </div>

              <div 
                onClick={() => handleNavigate('dashboard')}
                className="flex flex-col justify-center cursor-pointer group"
                title="Ir al Tablero / Panel Principal"
              >
                <h1 
                  className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[130px] sm:max-w-[170px] 2xl:max-w-[220px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-tight"
                >
                  {currentUser?.farmName || 'INVENTARIO BOVINO APP'}
                </h1>

                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium mt-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}
                  </span>
                </div>
              </div>
            </div>

            {/* CENTRO: Navegación Principal (Pantallas Grandes >= lg) */}
            <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 2xl:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 min-h-[36px] cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span className="hidden 2xl:inline">{item.label}</span>
                    <span className="2xl:hidden">{item.shortLabel || item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* LADO DERECHO: Acciones, Sincronización, Perfil y Salir */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Botón Principal: + Registrar Bovino */}
              <button
                onClick={onOpenNewAnimal}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white font-black text-xs flex items-center gap-1.5 shadow-sm min-h-[36px] cursor-pointer whitespace-nowrap"
                title="Registrar un nuevo animal al inventario"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Bovino</span>
              </button>

              {/* Botón Excel / Copia */}
              <button
                onClick={onOpenExportImport}
                title="Exportar a Excel / Respaldo"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[36px] cursor-pointer transition whitespace-nowrap"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </button>

              {/* Botón Sincronización Nube */}
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer transition"
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
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer transition"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              </button>

              {/* SECCIÓN DE PERFIL */}
              <div 
                onClick={onOpenProfile}
                title="Mi Perfil, Nombre de Finca y Seguridad"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200 cursor-pointer transition group min-h-[36px] whitespace-nowrap"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight pr-0.5">
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
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 min-h-[36px] cursor-pointer transition whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Salir</span>
              </button>

            </div>

          </div>

          {/* VISTA MÓVIL (< sm) -> Estructura Compacta de 2 Filas con Todas las Acciones */}
          <div className="flex sm:hidden flex-col gap-2 py-2">
            
            {/* Fila 1 Móvil: Logo, Nombre de Finca, Tema, Perfil y Salir */}
            <div className="flex items-center justify-between gap-2">
              <div 
                className="flex items-center gap-2 min-w-0 cursor-pointer" 
                onClick={() => handleNavigate('dashboard')}
                title="Ir al Tablero / Panel Principal"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/25 flex items-center justify-center text-white shrink-0">
                  <span className="text-base select-none">🐂</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[125px] leading-tight">
                    {currentUser?.farmName || 'INVENTARIO BOVINO'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}
                  </span>
                </div>
              </div>

              {/* Botones rápidos de control */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Tema */}
                <button
                  onClick={toggleTheme}
                  title="Cambiar tema"
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[32px] min-w-[32px] cursor-pointer"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                </button>

                {/* Perfil LG Ajustes */}
                <div 
                  onClick={onOpenProfile}
                  title="Mi Perfil y Ajustes"
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200 cursor-pointer min-h-[32px]"
                >
                  <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shadow-sm shrink-0">
                    {getInitials(currentUser?.name)}
                  </div>
                  <span className="text-[11px] font-black truncate max-w-[55px]">
                    {currentUser?.name ? currentUser.name.split(' ')[0] : 'Perfil'}
                  </span>
                </div>

                {/* Salir */}
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1 min-h-[32px] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            {/* Fila 2 Móvil: + Registrar Bovino, Excel, Nube */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/70">
              <button
                onClick={onOpenNewAnimal}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm min-h-[34px] cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Bovino</span>
              </button>

              <button
                onClick={onOpenExportImport}
                title="Exportar a Excel / Respaldo"
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1 min-h-[34px] cursor-pointer whitespace-nowrap"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </button>

              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1 min-h-[34px] cursor-pointer whitespace-nowrap"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                )}
                <span>{isSyncing ? 'Sync...' : 'Nube'}</span>
              </button>
            </div>

          </div>

          {/* Sub-bar Navigation for Medium Screens (md -> xl) */}
          <div className="hidden md:flex xl:hidden items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar border-t border-slate-200 dark:border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,6px)] shadow-lg">
        <div className="grid grid-cols-6 h-15 sm:h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 shadow-sm' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate max-w-[52px] text-[10px] mt-0.5 leading-tight">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
