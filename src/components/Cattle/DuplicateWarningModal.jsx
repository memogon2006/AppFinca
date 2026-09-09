import React from 'react';
import { Modal } from '../Common/Modal';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  User, 
  Layers, 
  Calendar, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Search
} from 'lucide-react';
import { formatDate } from '../../services/calculations';

export function DuplicateWarningModal({ 
  isOpen, 
  onClose, 
  onConfirmContinue, 
  duplicates = [], 
  candidateData = {},
  zIndex = 'z-[75]' 
}) {
  if (!isOpen || !duplicates || duplicates.length === 0) return null;

  const isHighPriority = duplicates.some(d => d.priority === 'ALTA');
  const count = duplicates.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHighPriority ? "🚨 POSIBLE DUPLICADO DE ALTA PRIORIDAD" : "⚠️ POSIBLE REGISTRO DUPLICADO"}
      subtitle="Revisa la información del animal activo encontrado antes de continuar"
      maxWidth="max-w-2xl"
      zIndex={zIndex}
    >
      <div className="space-y-4">

        {/* Encabezado de Advertencia */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
          isHighPriority
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
        }`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${
            isHighPriority 
              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300' 
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300'
          }`}>
            {isHighPriority ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black tracking-tight flex items-center gap-2 flex-wrap">
              <span>
                {count > 1
                  ? `Se encontraron ${count} animales activos con identificación equivalente`
                  : `Se encontró 1 animal activo con identificación equivalente`}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isHighPriority
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-amber-500 text-slate-950 shadow-sm'
              }`}>
                Prioridad {isHighPriority ? 'Alta' : 'Media'}
              </span>
            </h4>

            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {isHighPriority
                ? 'El número ingresado coincide en formato normalizado y comparte la misma marca y el mismo dueño con ganado activo en finca.'
                : 'El número ingresado coincide con un animal activo y comparte la misma marca o el mismo dueño/propietario.'}
            </p>
          </div>
        </div>

        {/* Comparativa: Lo que estás intentando registrar */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Animal que intentas registrar:</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Formato normalizado: <strong className="font-mono">{duplicates[0]?.normalizedTag || candidateData.tagNumber}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Arete Ingresado</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{candidateData.tagNumber || '—'}</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Marca de Hierro</span>
              <span className="font-bold text-slate-900 dark:text-white">{candidateData.ironBrand || 'Sin marca'}</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Dueño / Propietario</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">{candidateData.owner || 'Hacienda Principal'}</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Sexo / Categoría</span>
              <span className="font-bold text-slate-900 dark:text-white">{candidateData.sex || 'Macho'} • {candidateData.category || 'Novillo'}</span>
            </div>
          </div>
        </div>

        {/* Lista de Animales Existentes Coincidentes */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              <span>Ganado Activo Coincidente ({duplicates.length})</span>
            </h5>
            <span className="text-[11px] text-slate-400 font-medium">Estado: Activo en Finca</span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {duplicates.map((item, idx) => {
              const animal = item.animal;
              return (
                <div
                  key={animal.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.priority === 'ALTA'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm font-mono border border-slate-200 dark:border-slate-700 shadow-sm">
                        {animal.tagNumber}
                      </span>
                      {animal.name && (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          ({animal.name})
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-700/60">
                        🟢 {animal.status || 'Activo'}
                      </span>
                    </div>

                    {/* Desglose de coincidencias */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        ✓ N° Normalizado
                      </span>
                      {item.sameBrand && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
                          ✓ Misma Marca ({animal.ironBrand})
                        </span>
                      )}
                      {item.sameOwner && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
                          ✓ Mismo Dueño
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ficha técnica del animal existente */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Marca Registrada</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{animal.ironBrand || 'Sin marca'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Dueño / Propietario</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{animal.owner || 'Hacienda Principal'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lote / Potrero</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{animal.entryBatch || animal.paddock || 'Ingreso #1'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fecha Ingreso</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(animal.entryDate) || '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nota informativa de trazabilidad */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          💡 <strong>Nota:</strong> Si decides continuar con el registro, el nuevo bovino se guardará normalmente y la acción quedará registrada en el sistema de trazabilidad para futura auditoría.
        </p>

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            <span>Revisar Registro</span>
          </button>

          <button
            type="button"
            onClick={onConfirmContinue}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px] shadow-md ${
              isHighPriority
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <span>Continuar de Todas Formas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </Modal>
  );
}
