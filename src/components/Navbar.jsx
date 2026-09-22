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
  Boxes,
  MessageCircle,
  Wifi,
  WifiOff,
  Stethoscope,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout, isWorker } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Tablero', shortLabel: 'Tablero', icon: LayoutDashboard },
    { id: 'cattle', label: 'Inventario', shortLabel: 'Ganado', icon: Layers },
    { id: 'batches', label: 'Lotes', shortLabel: 'Lotes', icon: Boxes },
    { id: 'palpation', label: 'Palpación', shortLabel: 'Palpación', icon: Stethoscope },
    { id: 'weights', label: 'Pesos', shortLabel: 'Pesos', icon: Scale },
    { id: 'quickWeigh', label: 'Báscula', shortLabel: 'Báscula', icon: Zap },
    { id: 'finances', label: 'Ventas', shortLabel: 'Ventas', icon: DollarSign },
  ];

  const displayedNavItems = isWorker ? navItems.filter(item => item.id !== 'finances') : navItems;

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
      {/* Top Header - Arva Forest Ink (#07503f) */}
      <header className="sticky top-0 z-40 bg-[#07503f] text-white border-b border-[#053d30] shadow-md transition-colors duration-200">
        <div className="w-full mx-auto px-2 sm:px-3 lg:px-4 max-w-[1700px]">
          
          {/* VISTA ESCRITORIO / TABLET (sm: y superior) */}
          <div className="hidden sm:flex items-center justify-between h-15 sm:h-16 gap-1 lg:gap-1.5 2xl:gap-3">
            
            {/* LADO IZQUIERDO: Logo & Identidad de la Finca */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <div 
                onClick={() => handleNavigate('dashboard')}
                title="Ir al Tablero / Panel Principal"
                className="w-9 h-9 rounded-full bg-[#043328] border border-[#e8fe85]/40 p-0.5 shadow-sm flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition overflow-hidden"
              >
                <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>

              <div 
                onClick={() => handleNavigate('dashboard')}
                className="flex flex-col justify-center cursor-pointer group min-w-0"
                title="Ir al Tablero / Panel Principal"
              >
                <h1 
                  className="arva-serif font-serif text-sm sm:text-base font-bold tracking-wide text-white truncate max-w-[110px] sm:max-w-[140px] 2xl:max-w-[190px] group-hover:text-[#e8fe85] transition leading-tight"
                >
                  {currentUser?.farmName || 'INVENTARIO BOVINO'}
                </h1>

                <div className="text-[10px] text-white/80 flex items-center gap-1 font-medium mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-[#e8fe85] text-[#07503f] font-extrabold text-[10px] whitespace-nowrap shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#07503f] animate-pulse"></span>
                    <span>{activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}</span>
                  </span>

                  {/* Indicador de Conexión en Tiempo Real */}
                  <span 
                    className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full font-bold text-[10px] border transition-colors whitespace-nowrap ${
                      isOnline
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold animate-pulse'
                    }`}
                    title={isOnline ? '🟢 Conectado a la nube. Sincronización activa.' : '📡 Modo Campo Offline: Guardado en dispositivo.'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#e8fe85]' : 'bg-amber-900'}`}></span>
                    <span>{isOnline ? 'En línea' : 'Modo Campo'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CENTRO: Navegación Principal en Píldora Arva */}
            <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 bg-[#043328] p-1 rounded-full border border-[#0d4f40] shadow-inner shrink-0">
              {displayedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 min-h-[32px] cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#e8fe85] text-[#07503f] font-extrabold shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#07503f]' : 'text-white/70'}`} />
                    <span className="hidden 2xl:inline">{item.label}</span>
                    <span className="2xl:hidden">{item.shortLabel || item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* LADO DERECHO: Acciones con Píldoras Arva */}
            <div className="flex items-center gap-1.5 2xl:gap-2 shrink-0">
              
              {/* Botón Principal: + Registrar Bovino (Arva Vivid Lime CTA) */}
              <button
                onClick={onOpenNewAnimal}
                className="py-1.5 px-3 2xl:px-4 rounded-full bg-[#e8fe85] hover:bg-[#f1ff9e] active:scale-[0.97] text-[#07503f] font-extrabold text-xs flex items-center gap-1.5 shadow-sm min-h-[34px] cursor-pointer whitespace-nowrap transition"
                title="Registrar un nuevo animal al inventario"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden 2xl:inline">Registrar Bovino</span>
                <span className="2xl:hidden">+ Bovino</span>
              </button>

              {/* Botón Equipo de Trabajo / Vaqueros (Solo Administrador) */}
              {!isWorker && (
                <button
                  onClick={onOpenWorkers}
                  title="Gestión de Mayordomos y Vaqueros"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold min-h-[34px] cursor-pointer transition whitespace-nowrap shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#e8fe85] shrink-0" />
                  <span className="hidden 2xl:inline">Vaqueros</span>
                </button>
              )}

              {/* Botón Excel / Copia (Solo Administrador) */}
              {!isWorker && (
                <button
                  onClick={onOpenExportImport}
                  title="Exportar a Excel / Respaldo"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold min-h-[34px] cursor-pointer transition whitespace-nowrap"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-white/90 shrink-0" />
                  <span>Excel</span>
                </button>
              )}

              {/* Botón WhatsApp Reportes */}
              <button
                onClick={onOpenWhatsAppReport}
                title="Generar y Enviar Reporte por WhatsApp"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold min-h-[34px] cursor-pointer transition whitespace-nowrap shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#e8fe85] shrink-0" />
                <span>WhatsApp</span>
              </button>

              {/* Botón Sincronización Nube */}
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center min-h-[34px] min-w-[34px] cursor-pointer transition shrink-0"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-[#e8fe85] animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#b2cee7]" />
                )}
              </button>

              {/* Toggle Modo Oscuro / Claro */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center min-h-[34px] min-w-[34px] cursor-pointer transition shrink-0"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-[#e8fe85]" /> : <Moon className="w-3.5 h-3.5 text-[#b2cee7]" />}
              </button>

              {/* SECCIÓN DE PERFIL */}
              <div 
                onClick={onOpenProfile}
                title="Mi Perfil, Nombre de Finca y Seguridad"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer transition group min-h-[34px] whitespace-nowrap shrink-0 text-white"
              >
                <div className={`w-5 h-5 rounded-full text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition ${
                  isWorker ? 'bg-amber-300' : 'bg-[#e8fe85]'
                }`}>
                  {isWorker ? '🤠' : getInitials(currentUser?.name)}
                </div>
                <div className="flex flex-col text-left leading-tight pr-0.5">
                  <span className="text-[11px] font-bold truncate max-w-[60px] 2xl:max-w-[80px] text-white">
                    {currentUser?.name ? currentUser.name.split(' ')[0] : 'Perfil'}
                  </span>
                  <span className="text-[9px] text-[#e8fe85] font-medium flex items-center gap-0.5">
                    {isWorker ? 'Modo Campo' : <><Settings className="w-2 h-2" /> Ajustes</>}
                  </span>
                </div>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 text-xs font-semibold flex items-center gap-1 min-h-[34px] cursor-pointer transition whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span>Salir</span>
              </button>

            </div>

          </div>

          {/* VISTA MÓVIL (< sm) */}
          <div className="flex sm:hidden flex-col gap-2 py-2.5">
            
            {/* Fila 1 Móvil: Logo, Nombre de Finca, Tema, Perfil y Salir */}
            <div className="flex items-center justify-between gap-2">
              <div 
                className="flex items-center gap-2 min-w-0 cursor-pointer" 
                onClick={() => handleNavigate('dashboard')}
                title="Ir al Tablero / Panel Principal"
              >
                <div className="w-8 h-8 rounded-full bg-[#043328] border border-[#e8fe85]/40 p-0.5 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.2 rounded-full bg-[#e8fe85] text-[#07503f]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#07503f] animate-pulse"></span>
                      {activeCattleCount} {activeCattleCount === 1 ? 'cab' : 'cabezas'}
                    </span>
                    <span className="text-white/40">•</span>
                    <span 
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                        isOnline
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold animate-pulse'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-[#e8fe85]' : 'bg-amber-900'}`}></span>
                      <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones rápidos de control */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Tema */}
                <button
                  onClick={toggleTheme}
                  title="Cambiar tema"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center min-h-[32px] min-w-[32px] cursor-pointer"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5 text-[#e8fe85]" /> : <Moon className="w-3.5 h-3.5 text-[#b2cee7]" />}
                </button>

                {/* Perfil Ajustes */}
                <div 
                  onClick={onOpenProfile}
                  title="Mi Perfil y Ajustes"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 cursor-pointer min-h-[32px] text-white"
                >
                  <div className={`w-5 h-5 rounded-full text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs shrink-0 ${
                    isWorker ? 'bg-amber-300' : 'bg-[#e8fe85]'
                  }`}>
                    {isWorker ? '🤠' : getInitials(currentUser?.name)}
                  </div>
                  <span className="text-[11px] font-bold truncate max-w-[55px]">
                    {currentUser?.name ? currentUser.name.split(' ')[0] : (isWorker ? 'Vaquero' : 'Perfil')}
                  </span>
                </div>

                {/* Salir */}
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-1.5 px-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[11px] font-bold flex items-center gap-1 min-h-[32px] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-300" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            {/* Fila 2 Móvil: + Registrar Bovino, Vaqueros, Excel, WhatsApp, Nube */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10 overflow-x-auto no-scrollbar">
              <button
                onClick={onOpenNewAnimal}
                className="flex-1 py-1.5 px-3 rounded-full bg-[#e8fe85] hover:bg-[#f1ff9e] active:scale-[0.98] text-[#07503f] font-black text-xs flex items-center justify-center gap-1 shadow-sm min-h-[34px] cursor-pointer whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Bovino</span>
              </button>

              {/* Botón Vaqueros (Solo Administrador) */}
              {!isWorker && (
                <button
                  onClick={onOpenWorkers}
                  title="Gestión de Mayordomos y Vaqueros"
                  className="py-1.5 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-semibold flex items-center justify-center gap-1 min-h-[34px] cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#e8fe85]" />
                  <span>Vaqueros</span>
                </button>
              )}

              {/* Botón Excel (Solo Administrador) */}
              {!isWorker && (
                <button
                  onClick={onOpenExportImport}
                  title="Exportar a Excel / Respaldo"
                  className="py-1.5 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-semibold flex items-center justify-center gap-1 min-h-[34px] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-white/90" />
                  <span>Excel</span>
                </button>
              )}

              <button
                onClick={onOpenWhatsAppReport}
                title="Enviar Reporte por WhatsApp"
                className="py-1.5 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-semibold flex items-center justify-center gap-1 min-h-[34px] cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#e8fe85]" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={isSyncing ? 'Sincronizando con la nube...' : 'Sincronizar datos con la nube'}
                className="py-1.5 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-semibold flex items-center justify-center gap-1 min-h-[34px] cursor-pointer whitespace-nowrap shrink-0"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-[#e8fe85] animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#b2cee7]" />
                )}
                <span>Nube</span>
              </button>
            </div>

          </div>

          {/* Sub-bar Navigation for Medium Screens (md -> xl) */}
          <div className="hidden md:flex xl:hidden items-center gap-1.5 py-2 overflow-x-auto no-scrollbar border-t border-white/10">
            {displayedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition min-h-[34px] cursor-pointer ${
                    isActive
                      ? 'bg-[#e8fe85] text-[#07503f] font-extrabold shadow-sm'
                      : 'text-white/80 bg-white/10 hover:bg-white/20'
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07503f] text-white border-t border-[#043328] pb-[env(safe-area-inset-bottom,6px)] shadow-lg">
        <div 
          className="grid h-15 sm:h-16 items-center px-0.5"
          style={{ gridTemplateColumns: `repeat(${displayedNavItems.length}, minmax(0, 1fr))` }}
        >
          {displayedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 text-[9px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#e8fe85] font-black'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-white/15 shadow-sm' : ''}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate max-w-[46px] text-[9px] mt-0.5 leading-tight">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
