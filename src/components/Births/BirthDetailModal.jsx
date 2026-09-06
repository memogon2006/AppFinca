import React from 'react';
import { 
  X, 
  Baby, 
  Calendar, 
  Tag, 
  MapPin, 
  Scale, 
  DollarSign, 
  Info, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  HeartCrack,
  Dna
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../services/calculations';

export function BirthDetailModal({ 
  isOpen, 
  onClose, 
  birth, 
  onNavigateToAnimal, 
  onDeleteBirth 
}) {
  if (!isOpen || !birth) return null;

  const isAlive = birth.status === 'Vivo';
  const birthWeight = parseFloat(birth.birthWeight) || 0;
  const estimatedVal = parseFloat(birth.estimatedValue) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera */}
        <div className={`px-5 sm:px-6 py-4 text-white flex items-center justify-between shadow-md flex-shrink-0 ${
          isAlive 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
            : 'bg-gradient-to-r from-rose-600 to-red-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner border border-white/20">
              {isAlive ? <Baby className="w-5 h-5 text-white" /> : <HeartCrack className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Arete: {birth.tagNumber}
                </h3>
                <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  isAlive 
                    ? 'bg-emerald-500/30 border-emerald-300 text-white' 
                    : 'bg-rose-500/30 border-rose-300 text-white'
                }`}>
                  {isAlive ? '🟢 Vivo / Incorporado' : '🔴 Muerto al Nacer'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/80 font-medium">
                Evento: Nacimiento Registrado ({birth.birthDate})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Banner Valor Incorporado */}
          <div className={`p-4 rounded-2xl border ${
            isAlive
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
              Valor Incorporado al Inventario:
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-xl sm:text-2xl font-black ${
                isAlive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
              }`}>
                {isAlive ? formatCurrency(estimatedVal) : '$0'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                {isAlive ? 'Valor Patrimonial Estimado' : 'Sin valor comercial'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              * Registrado exclusivamente como activo biológico incorporado a la finca. No cuenta como ingreso ni venta.
            </p>
          </div>

          {/* Cuadrícula de Datos Zootécnicos */}
          <div className="grid grid-cols-2 gap-3">
            
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fecha Nacimiento</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{birth.birthDate}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Sexo & Raza</span>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                <span>{birth.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</span>
                <span className="text-[11px] text-slate-500 block truncate">{birth.breed || 'Sin raza'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Peso al Nacer</span>
              <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                <Scale className="w-3.5 h-3.5" />
                <span>{birthWeight > 0 ? `${formatNumber(birthWeight, 1)} kg` : 'Sin registrar'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Finca & Potrero</span>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                <span className="truncate block">{birth.farmName || 'Finca Principal'}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block truncate">{birth.paddock || 'Maternidad'}</span>
              </div>
            </div>

          </div>

          {/* Genealogía */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5" /> Genealogía
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Madre:</span>
                <span className="font-bold text-purple-950 dark:text-purple-100 text-sm">
                  {birth.motherTag || 'Sin especificar'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Padre / Toro:</span>
                <span className="font-bold text-purple-950 dark:text-purple-100 text-sm">
                  {birth.fatherTag || 'Sin registrar'}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {birth.notes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observaciones</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{birth.notes}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Deseas eliminar el registro de nacimiento del arete ${birth.tagNumber}?`)) {
                onDeleteBirth(birth.id, birth.tagNumber);
                onClose();
              }
            }}
            className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Eliminar registro de nacimiento"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cerrar
            </button>

            {isAlive && onNavigateToAnimal && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToAnimal(birth.tagNumber);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition cursor-pointer"
              >
                <span>Ver en Inventario</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
