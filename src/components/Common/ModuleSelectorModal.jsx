import React, { useState } from 'react';
import { Modal } from './Modal';
import { 
  MODULE_CATALOG, 
  FARM_PRESETS, 
  useActiveModules, 
  MODULE_KEYS 
} from '../../services/moduleService';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { cloudSaveUser, cloudPushData } from '../../services/cloudSync';
import { 
  Sliders, 
  CheckCircle2, 
  Sparkles, 
  Scale, 
  Boxes, 
  Stethoscope, 
  Milk, 
  Dna, 
  DollarSign, 
  ShieldCheck, 
  Layers, 
  Leaf, 
  Wallet, 
  Calendar,
  Check
} from 'lucide-react';

const ICON_MAP = {
  Scale: Scale,
  Boxes: Boxes,
  Stethoscope: Stethoscope,
  Milk: Milk,
  Dna: Dna,
  DollarSign: DollarSign,
};

export function ModuleSelectorModal({ isOpen, onClose, zIndex = 'z-[70]' }) {
  const { currentUser, isWorker } = useAuth();
  const { modules, isModuleActive, toggleModule, applyFarmPreset } = useActiveModules();
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const handleSelectPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    const updated = applyFarmPreset(presetKey);
    if (currentUser?.id && !isWorker) {
      db.users.update(currentUser.id, { activeModules: updated, farmPreset: presetKey }).catch(() => null);
      cloudSaveUser({ ...currentUser, activeModules: updated, farmPreset: presetKey }).catch(() => null);
      cloudPushData(currentUser.id).catch(() => null);
    }
    setSuccessToast(`Se aplicó la configuración: ${FARM_PRESETS[presetKey.toUpperCase()]?.shortTitle || presetKey}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggle = (moduleKey) => {
    const updated = toggleModule(moduleKey);
    setSelectedPreset(null);
    if (currentUser?.id && !isWorker) {
      db.users.update(currentUser.id, { activeModules: updated }).catch(() => null);
      cloudSaveUser({ ...currentUser, activeModules: updated }).catch(() => null);
      cloudPushData(currentUser.id).catch(() => null);
    }
    setSuccessToast('Módulos actualizados con éxito');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎛️ Personalizar Módulos de la Finca"
      subtitle="Activa o desactiva herramientas según la orientación productiva de tu predio"
      maxWidth="max-w-3xl"
      zIndex={zIndex}
    >
      <div className="space-y-5">
        
        {/* Toast de confirmación */}
        {successToast && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 1. SELECCIÓN RÁPIDA POR ENFOQUE / PRESET */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Configuración Rápida por Enfoque de Finca:</span>
            </span>
            <span className="text-[10px] text-slate-400">1 toque para configurar todo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Object.entries(FARM_PRESETS).map(([key, preset]) => {
              const isCurrentPreset = Object.entries(preset.modules).every(
                ([modKey, expected]) => Boolean(modules[modKey]) === expected
              );

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer relative overflow-hidden min-h-[90px] ${
                    isCurrentPreset
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-xs font-black leading-snug">{preset.shortTitle}</span>
                    {isCurrentPreset && (
                      <span className="w-4 h-4 rounded-full bg-white text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-1.5 line-clamp-2 leading-relaxed ${isCurrentPreset ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MÓDULOS ESENCIALES (BASE PERMANENTE) */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Módulos Base Permanentes (Siempre Activos)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Los módulos de <strong>Inventario de Ganado</strong>, <strong>Potreros & Pastoreo</strong>, <strong>Finanzas & Compras/Ventas</strong>, <strong>Sanidad Oficial</strong> y <strong>Auditoría</strong> están siempre activos para garantizar el control esencial de la finca.
          </p>
        </div>

        {/* 3. LISTADO DE MÓDULOS CONMUTABLES INDIVIDUALES */}
        <div className="space-y-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Módulos Específicos & Conmutables:</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULE_CATALOG.map((mod) => {
              const active = isModuleActive(mod.key);
              const IconComp = ICON_MAP[mod.icon] || Sliders;

              return (
                <div
                  key={mod.key}
                  className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 shadow-xs ${
                    active
                      ? 'bg-white dark:bg-slate-800/90 border-emerald-500/50 dark:border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-black transition ${
                      active 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {mod.emoji}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {mod.name}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(mod.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-center ${
                      active ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={active}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            💡 <em>Desactivar un módulo nunca borra tus datos. Al reactivarlo, tu historial se mantiene intacto.</em>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
          >
            Listo / Aplicar
          </button>
        </div>

      </div>
    </Modal>
  );
}
