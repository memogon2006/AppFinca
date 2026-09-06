import React from 'react';
import { 
  X, 
  HelpCircle, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Flame, 
  Baby, 
  Layers, 
  Lightbulb,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export function GlossaryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const glossaryItems = [
    {
      id: 'gdp',
      title: 'GDP (Ganancia Diaria de Peso)',
      icon: TrendingUp,
      badge: 'Zootecnia',
      color: 'blue',
      formula: 'GDP = (Peso Actual - Peso Entrada) / Días en Finca',
      summary: 'Mide cuántos kilogramos de carne viva está engordando en promedio el animal cada día que pasa en tu finca.',
      example: 'Si un novillo entró pesando 240 kg y tras 245 días pesa 485 kg, ganó 245 kg en 245 días → GDP = 1.000 kg/día (1 kg de carne diario).',
      benchmark: [
        { label: 'Bajo', value: '< 0.370 kg/d (requiere sal o rotación)', color: 'text-amber-600 dark:text-amber-400' },
        { label: 'Aceptable / Normal', value: '0.370 - 0.750 kg/d (pastoreo estándar)', color: 'text-slate-600 dark:text-slate-300' },
        { label: 'Excelente', value: '≥ 0.750 kg/d (ceba intensiva)', color: 'text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      id: 'roi',
      title: 'ROI (Retorno sobre la Inversión)',
      icon: DollarSign,
      badge: 'Finanzas',
      color: 'emerald',
      formula: 'ROI = (Utilidad Neta / Inversión Total) × 100',
      summary: 'Indica qué porcentaje de ganancia limpia te deja el dinero que invertiste en ese animal (compra + fletes + vacunas + insumos).',
      example: 'Si compraste un ternero e invertiste $2.000.000 COP en total y se vende en $4.638.000 COP, tu ganancia neta es de $2.638.000 COP → Tu ROI es 131.9% (recuperaste tu capital y ganaste un 131.9% extra).',
      benchmark: [
        { label: 'Regla de Oro', value: 'Entre mayor sea el % de ROI, más rentable fue tu inversión ganadera.', color: 'text-emerald-600 dark:text-emerald-400' }
      ]
    },
    {
      id: 'biomass',
      title: 'Biomasa Total',
      icon: Layers,
      badge: 'Inventario',
      color: 'purple',
      formula: 'Biomasa = Sumatoria del peso actual de todos los bovinos activos',
      summary: 'Es el peso total acumulado en kilogramos de carne en pie que tienes actualmente pastando en tu finca o lote.',
      example: 'Si tienes 10 novillos de 450 kg cada uno, tu biomasa total es de 4.500 kg (4.5 toneladas de carne en pie).',
      benchmark: [
        { label: 'Utilidad', value: 'Sirve para calcular la carga animal por hectárea y liquidar ventas de lotes completos en camión.', color: 'text-purple-600 dark:text-purple-400' }
      ]
    },
    {
      id: 'fatMale',
      title: 'Gordo Listo (≥ 475 kg)',
      icon: Flame,
      badge: 'Comercialización',
      color: 'amber',
      formula: 'Peso Actual ≥ 475 kg (Machos de Ceba)',
      summary: 'Alerta automática del sistema que indica que un macho alcanzó el peso óptimo de frigorífico o subasta en Colombia.',
      example: 'A partir de 475 - 500 kg, el macho tiene excelente rendimiento en canal y es momento ideal de venta antes de que su conversión alimenticia baje.',
      benchmark: [
        { label: 'Estado', value: 'Aparece resaltado en color naranja/dorado en el tablero y en el inventario.', color: 'text-amber-600 dark:text-amber-400' }
      ]
    },
    {
      id: 'profitType',
      title: 'Utilidad Proyectada vs. Utilidad Real',
      icon: Scale,
      badge: 'Rentabilidad',
      color: 'teal',
      formula: 'Utilidad = Valor de Venta (o Mercado) - Inversión Total',
      summary: 'Diferencia entre estimación y dinero liquidado de bolsillo.',
      example: '• Utilidad Proyectada: Si el animal está activo en el potrero, simula cuánto ganarías si lo vendieras hoy al precio de mercado.\n• Utilidad Real: Es la ganancia cerrada y definitiva una vez el animal fue vendido y pagado por el comprador.',
      benchmark: []
    },
    {
      id: 'gestation',
      title: 'Ciclo Reproductivo y Días a Parto (283 Días)',
      icon: Baby,
      badge: 'Reproducción',
      color: 'rose',
      formula: 'Fecha Estimada Parto = Fecha Servicio + 283 Días',
      summary: 'El promedio de gestación en la vaca es de 283 días (9 meses y 10 días). El sistema alerta cuando faltan menos de 30 y 10 días para el parto.',
      example: 'Una vaca servida el 1 de Enero tendrá su parto estimado alrededor del 11 de Octubre.',
      benchmark: []
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">Guía & Glosario de Métricas</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                  Conceptos Ganaderos
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Explicación detallada, fórmulas y ejemplos de los términos utilizados en la plataforma.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Conceptos Explicados */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>
              Todos los cálculos matemáticos de tu hato se actualizan automáticamente en tiempo real cada vez que registras un nuevo pesaje o compra en la aplicación.
            </p>
          </div>

          <div className="space-y-4">
            {glossaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {item.summary}
                  </p>

                  {/* Fórmula */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Fórmula:</span>
                    <span>{item.formula}</span>
                  </div>

                  {/* Ejemplo */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ejemplo Práctico:
                    </span>
                    <p className="whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.example}
                    </p>
                  </div>

                  {/* Referencias o Rangos */}
                  {item.benchmark && item.benchmark.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                      {item.benchmark.map((b, idx) => (
                        <span key={idx} className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <strong>{b.label}:</strong> <span className={b.color}>{b.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Entendido, Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
}
