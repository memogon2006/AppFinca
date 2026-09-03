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
  Settings
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
    { id: 'weights', label: 'Control Pesos', shortLabel: 'Pesos', icon: Scale },
    { id: 'quickWeigh', label: 'Báscula Rápida', shortLabel: 'Báscula', icon: Zap },
    { id: 'finances', label: 'Ventas & Utilidades', shortLabel: 'Ventas', icon: DollarSign },
  ];

  const handleLogout = () => {
    if (window.confirm(`¿Deseas cerrar la sesión de ${currentUser?.name || 'tu cuenta'}?`)) {
      logout();
    }
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* LADO IZQUIERDO: Logo & Identidad de la Finca */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div 
                onClick={onOpenProfile}
                title="Configuración de Finca y Perfil"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/25 flex items-center justify-center text-white flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition"
              >
                <span className="text-xl sm:text-2xl select-none">🐂</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 
                    onClick={onOpenProfile}
                    className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase truncate cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                    title={currentUser?.farmName || 'Mi Finca Ganadera'}
                  >
                    {currentUser?.farmName || 'INVENTARIO BOVINO APP'}
                  </h1>
                </div>

                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 text-[10px] sm:text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}
                  </span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                  <span className="hidden sm:inline truncate text-slate-600 dark:text-slate-300 font-medium">
                    {currentUser?.name || 'Administrador'}
                  </span>
                </div>
              </div>
            </div>

            {/* CENTRO: Navegación Principal (Pantallas Grandes >= lg) */}
            <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 min-h-[38px] cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* LADO DERECHO: Acciones, Sincronización, Perfil y Salir */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              
              {/* Botón Principal: + Registrar Bovino */}
              <button
                onClick={onOpenNewAnimal}
                className="py-2 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-700/25 transition min-h-[40px] cursor-pointer"
                title="Registrar un nuevo animal al inventario"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden md:inline">Registrar Bovino</span>
                <span className="md:hidden">Nuevo</span>
              </button>

              {/* Botón Excel / Copia */}
              <button
                onClick={onOpenExportImport}
                title="Exportar a Excel / Respaldo"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[40px] cursor-pointer transition"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </button>

              {/* Botón Sincronización Nube */}
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center min-h-[40px] min-w-[40px] cursor-pointer transition"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 text-sky-500" />
                )}
                <span className="hidden 2xl:inline ml-1.5">{isSyncing ? 'Sincronizando' : 'Nube'}</span>
              </button>

              {/* Toggle Modo Oscuro / Claro */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[40px] min-w-[40px] cursor-pointer transition"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              {/* SECCIÓN DE PERFIL */}
              <div 
                onClick={onOpenProfile}
                title="Mi Perfil, Nombre de Finca y Seguridad"
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200 cursor-pointer transition group min-h-[40px]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight pr-1">
                  <span className="text-xs font-extrabold truncate max-w-[100px] text-slate-800 dark:text-slate-100">
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
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-bold flex items-center gap-1.5 min-h-[40px] cursor-pointer transition"
              >
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">Salir</span>
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
                  onClick={() => setCurrentView(item.id)}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="grid grid-cols-6 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate max-w-[50px] mt-0.5">{item.shortLabel}</span>
              </button>
            );
          })}

          {/* Botón Móvil: Mi Perfil */}
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center h-full py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
            title="Mi Perfil y Ajustes de Finca"
          >
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <span className="truncate max-w-[50px] mt-0.5 text-emerald-700 dark:text-emerald-400 font-extrabold">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
}
