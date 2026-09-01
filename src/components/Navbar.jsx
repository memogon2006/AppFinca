import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Scale, 
  HeartHandshake, 
  DollarSign, 
  PlusCircle, 
  DownloadCloud, 
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Navbar({ currentView, setCurrentView, onOpenNewAnimal, onOpenExportImport, activeCattleCount = 0 }) {
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Tablero', shortLabel: 'Tablero', icon: LayoutDashboard },
    { id: 'cattle', label: 'Inventario', shortLabel: 'Ganado', icon: Layers },
    { id: 'weights', label: 'Control de Pesos', shortLabel: 'Pesos', icon: Scale },
    { id: 'females', label: 'Hembras & Cría', shortLabel: 'Hembras', icon: HeartHandshake },
    { id: 'finances', label: 'Ventas & Utilidades', shortLabel: 'Ventas', icon: DollarSign },
    { id: 'quickWeigh', label: 'Pesaje Rápido', shortLabel: 'Báscula', icon: Zap },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo & Título */}
            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shadow-emerald-600/20 flex items-center justify-center text-white flex-shrink-0">
                <span className="text-xl sm:text-2xl select-none">🐂</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-lg font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 dark:from-emerald-400 dark:via-teal-300 dark:to-white bg-clip-text text-transparent uppercase truncate">
                    INVENTARIO BOVINO APP
                  </span>
                  <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    Finca Ganadera
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium truncate">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeCattleCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>{activeCattleCount} {activeCattleCount === 1 ? 'cabeza activa' : 'cabezas activas'}</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation (>= lg) */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 min-h-[40px] ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm dark:shadow-md dark:shadow-emerald-900/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Toggle Modo Claro / Oscuro */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition min-h-[40px] min-w-[40px] justify-center"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden xl:inline">Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="hidden xl:inline">Oscuro</span>
                  </>
                )}
              </button>

              {/* Exportar / Respaldo */}
              <button
                onClick={onOpenExportImport}
                title="Exportar a Excel / Respaldo"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition min-h-[40px]"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Excel/Copia</span>
              </button>

              {/* Nuevo Bovino */}
              <button
                onClick={onOpenNewAnimal}
                className="py-2 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-700/20 dark:shadow-emerald-900/40 transition transform active:scale-95 min-h-[40px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Bovino</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>

          </div>

          {/* Sub-bar Navigation for Tablets (md -> lg) */}
          <div className="hidden md:flex lg:hidden items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar border-t border-slate-200 dark:border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition min-h-[38px] ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                <span className="truncate max-w-[52px] mt-0.5">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
