import React from 'react';
import { Modal } from '../Common/Modal';
import { AlertTriangle, Hash, ArrowRight, CornerDownRight, CheckCircle2, Info, ArrowUpRight, History } from 'lucide-react';

export function ConsecutiveWarningModal({
  isOpen,
  onClose,
  onConfirmContinue,
  warningData,
  zIndex = 'z-[70]',
}) {
  if (!isOpen || !warningData) return null;

  const {
    enteredTag = '',
    enteredConsecutive = null,
    lastConsecutive = 0,
    expectedConsecutive = 1,
    warningType = 'JUMP_AHEAD',
    warningTitle = 'Numeración No Consecutiva',
    warningMessage = '',
    jump = 0,
    matchingAnimals = [],
  } = warningData;

  const isJumpAhead = warningType === 'JUMP_AHEAD';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warningTitle}
      subtitle="Control y sugerencia de numeración consecutiva por finca"
      maxWidth="max-w-xl"
      zIndex={zIndex}
    >
      <div className="space-y-4">
        
        {/* Banner de Advertencia Principal */}
        <div className={`p-4 rounded-2xl border ${
          isJumpAhead 
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/60 text-amber-900 dark:text-amber-200' 
            : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-600/60 text-blue-900 dark:text-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isJumpAhead 
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-wide">
                {isJumpAhead ? '⚠️ Salto en la Secuencia Consecutiva' : 'ℹ️ Consecutivo Menor o Histórico'}
              </h4>
              <p className="text-xs leading-relaxed opacity-90">
                {warningMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Comparativa Numérica */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Último Registrado</span>
            <p className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
              #{lastConsecutive || '0'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/60">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Siguiente Esperado</span>
            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              #{expectedConsecutive}
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            isJumpAhead 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/60' 
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
          }`}>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Ingresado</span>
            <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              #{enteredConsecutive}
            </p>
            <span className="text-[9px] font-semibold text-slate-400 block truncate">({enteredTag})</span>
          </div>
        </div>

        {/* Nota explicativa de regla de negocio */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Regla de Consecutividad:</strong> El sistema extrae únicamente el número <strong>antes del guion o slash</strong> (ej. <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">25-6 → 25</code>). El número posterior no altera la numeración principal.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>🔍 Revisar Número</span>
          </button>

          <button
            type="button"
            onClick={onConfirmContinue}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>➡️ Continuar de Todas Formas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </Modal>
  );
}
