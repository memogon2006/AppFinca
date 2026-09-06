import React, { useState, useMemo } from 'react';
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
  BookOpen,
  Target,
  Activity,
  Search,
  Percent,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react';

export function GlossaryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = ['Todos', 'Zootecnia & Pesos', 'Ceba & Venta', 'Finanzas & Negocios', 'Reproducción'];

  const glossaryItems = [
    {
      id: 'gdp',
      title: 'GDP (Ganancia Diaria de Peso Total)',
      icon: TrendingUp,
      badge: 'Zootecnia & Pesos',
      color: 'blue',
      formula: 'GDP = (Último Peso Registrado - Peso Entrada Finca) / Días Totales en Finca',
      summary: 'Mide cuántos kilogramos de carne viva ha engordado en promedio el animal cada día desde su ingreso a la finca hasta la fecha de su pesaje más reciente.',
      example: '• Entrada: 1-Ene-2026 con 240 kg\n• Último Pesaje: 1-Sep-2026 con 485 kg (243 días)\n• Ganancia total: 245 kg en 243 días → GDP = 1.008 kg/día.',
      benchmark: [
        { label: '⚠️ Bajo Rendimiento', value: '< 0.370 kg/d (requiere revisión o rotación)', color: 'text-rose-600 dark:text-rose-400' },
        { label: '⚡ Aceptable / Normal', value: '0.370 - 0.750 kg/d (pastoreo estándar)', color: 'text-amber-600 dark:text-amber-400' },
        { label: '🚀 Excelente / Óptimo', value: '≥ 0.750 kg/d (ceba intensiva / pasto óptimo)', color: 'text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      id: 'target480',
      title: 'Proyección de Ceba a Peso Meta (≥ 480 kg)',
      icon: Target,
      badge: 'Ceba & Venta',
      color: 'emerald',
      formula: 'Kilos Faltantes = 480 kg - Peso Actual | Días Estimados = Kilos Faltantes / GDP',
      summary: 'Calculadora predictiva y alerta zootécnica que proyecta con exactitud cuántos días faltan para que el novillo alcance el peso estándar de frigorífico o subasta (≥ 480 kg) y calcula la fecha estimada de salida en el calendario.',
      example: '• Animal con peso actual de 455 kg y GDP de 0.737 kg/día:\n• Faltan: 25.0 kg para 480 kg (94.8% de avance).\n• Días estimados: 25 / 0.737 = ~34 días.\n• Fecha proyectada de salida: 34 días después del último pesaje.',
      benchmark: [
        { label: '🎯 ¡Listo para Venta!', value: 'Peso Actual ≥ 480 kg (Activa botón de liquidación)', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: '📈 En Proceso de Ceba', value: 'Peso Actual < 480 kg (Muestra barra de progreso y fecha)', color: 'text-blue-600 dark:text-blue-400' },
      ]
    },
    {
      id: 'semaforo',
      title: 'Semáforo Inteligente de Rendimiento',
      icon: Activity,
      badge: 'Zootecnia & Pesos',
      color: 'purple',
      formula: 'Clasificación automática por rango de GDP zootécnico',
      summary: 'Identifica visualmente de forma instantánea qué animales están convirtiendo eficientemente el pasto en carne y cuáles están rezagados o perdiendo peso.',
      example: '🚀 Excelente (≥ 0.750 kg/d): Alto rendimiento genético y nutricional.\n⚡ Aceptable (0.370 - 0.750 kg/d): Rendimiento comercial estándar.\n⚠️ Bajo Rendimiento (< 0.370 kg/d): Requiere sal mineralizada, desparasitación o cambio de lote.\n🔻 Estancado / Pérdida (≤ 0 kg/d): Alerta crítica de pérdida de peso.',
      benchmark: [
        { label: '🚀 Excelente', value: '≥ 0.750 kg/d', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: '⚡ Aceptable', value: '0.370 - 0.750 kg/d', color: 'text-amber-600 dark:text-amber-400' },
        { label: '⚠️ Bajo Rendimiento', value: '< 0.370 kg/d', color: 'text-rose-600 dark:text-rose-400' },
        { label: '🔻 Estancado', value: '≤ 0 kg/d', color: 'text-slate-600 dark:text-slate-400' },
      ]
    },
    {
      id: 'continuousWeighing',
      title: 'Pesaje Continuo & Ganancia por Tramo',
      icon: Scale,
      badge: 'Zootecnia & Pesos',
      color: 'teal',
      formula: 'GDP Tramo = (Peso Actual - Peso Anterior) / (Fecha Actual - Fecha Anterior)',
      summary: 'Permite registrar múltiples pesajes a lo largo de la vida del animal (Pesaje 1 ➔ Pesaje 2 ➔ Pesaje 3 ➔ ...), calculando la ganancia entre pesajes consecutivos para evaluar el impacto de cada rotación de potrero.',
      example: '• Entrada (1-Ene): 250 kg\n• Pesaje 1 (1-Feb / 31 días): 275 kg → Ganó 25 kg (+0.806 kg/d en potrero A)\n• Pesaje 2 (1-Mar / 28 días): 298 kg → Ganó 23 kg (+0.821 kg/d en potrero B)',
      benchmark: [
        { label: 'Regla de Orden', value: 'Los pesajes deben registrarse con fecha posterior a la fecha de entrada.', color: 'text-teal-600 dark:text-teal-400' }
      ]
    },
    {
      id: 'roi',
      title: 'ROI (Retorno sobre la Inversión)',
      icon: DollarSign,
      badge: 'Finanzas & Negocios',
      color: 'emerald',
      formula: 'ROI = (Utilidad Neta / Inversión Total Acumulada) × 100',
      summary: 'Indica el porcentaje de rentabilidad limpia que genera cada peso invertido en el animal (compra del ternero + fletes + vacunas + sal + suplementos + manejo).',
      example: '• Compra + Gastos Totales: $2.000.000 COP\n• Venta al Frigorífico: $3.200.000 COP\n• Utilidad Neta: $1.200.000 COP\n• ROI = ($1.200.000 / $2.000.000) × 100 = 60.0% de rentabilidad.',
      benchmark: [
        { label: 'Excelente', value: 'ROI > 50% en ciclos de ceba', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Regla Financiera', value: 'A mayor GDP en menos días, mayor es el ROI anualizado.', color: 'text-blue-600 dark:text-blue-400' }
      ]
    },
    {
      id: 'costPerKg',
      title: 'Costo por Kilo Producido & Costo por Día',
      icon: Percent,
      badge: 'Finanzas & Negocios',
      color: 'amber',
      formula: 'Costo/Kg = Total Inversión / Kilos Ganados | Costo/Día = Total Inversión / Días en Finca',
      summary: 'Métricas financieras esenciales para saber exactamente cuánto te cuesta engordar 1 kilogramo de carne en tu finca y cuánto cuesta sostener cada cabeza por día.',
      example: 'Si un novillo acumuló $600.000 COP en gastos operativos y ganó 200 kg en 250 días:\n• Costo por Kilo Ganado = $3.000 COP/kg\n• Costo Diario de Sostenimiento = $2.400 COP/día.',
      benchmark: [
        { label: 'Objetivo de Eficiencia', value: 'Mantener el costo de producir 1 kg de carne por debajo del precio de venta del kg en pie.', color: 'text-emerald-600 dark:text-emerald-400' }
      ]
    },
    {
      id: 'companyCattle',
      title: 'Ganado en Compañía / Al Aumento (Partición 50/50)',
      icon: Users,
      badge: 'Finanzas & Negocios',
      color: 'indigo',
      formula: 'Liquidación = (Kilos Ganados × Precio Venta) ÷ 2 (o según porcentaje pactado)',
      summary: 'Modelo ganadero asociativo donde una de las partes aporta el capital de compra de los animales y la otra aporta la finca, pastos y administración, repartiendo equitativamente la ganancia de kilos en pie al momento de la venta.',
      example: '• Novillo ingresa en 250 kg y se vende en 490 kg (ganó 240 kg a $9.000/kg = $2.160.000 en carne)\n• Finquero (Pasto/Manejo): $1.080.000 COP (50%)\n• Inversionista (Capital): $1.080.000 COP (50%) + recuperación de su compra inicial.',
      benchmark: [
        { label: 'Soporte en App', value: 'Permite filtrar en Ventas: Directas vs En Compañía con liquidación automática.', color: 'text-indigo-600 dark:text-indigo-400' }
      ]
    },
    {
      id: 'biomass',
      title: 'Biomasa Total del Hato',
      icon: Layers,
      badge: 'Zootecnia & Pesos',
      color: 'purple',
      formula: 'Biomasa Total = Sumatoria del peso actual de todos los bovinos activos',
      summary: 'Es el volumen total en kilogramos de carne viva que se encuentra pastando en los potreros de tu finca en este instante.',
      example: 'Si tienes 40 novillos con un peso promedio de 420 kg cada uno, la biomasa total de tu finca es de 16.800 kg (16.8 toneladas de carne en pie).',
      benchmark: [
        { label: 'Utilidad Práctica', value: 'Fundamental para calcular la Carga Animal (Unidades Gran Ganado UGG por hectárea) y cubicaje de camiones.', color: 'text-purple-600 dark:text-purple-400' }
      ]
    },
    {
      id: 'profitType',
      title: 'Utilidad Proyectada vs. Utilidad Real',
      icon: Scale,
      badge: 'Finanzas & Negocios',
      color: 'teal',
      formula: 'Utilidad = Valor de Venta (o Valor Mercado) - Inversión Total',
      summary: 'Distingue entre el valor patrimonial estimado del hato en pastoreo y el dinero líquido real cobrado tras la venta.',
      example: '• Utilidad Proyectada: Simulación matemática de ganancia si vendieras hoy todos los animales a precio de mercado actual.\n• Utilidad Real: Ganancia neta y definitiva tras cerrar la venta formal en báscula y recibir el pago.',
      benchmark: []
    },
    {
      id: 'gestation',
      title: 'Ciclo Reproductivo y Días a Parto (283 Días)',
      icon: Baby,
      badge: 'Reproducción',
      color: 'rose',
      formula: 'Fecha Estimada Parto = Fecha de Servicio / Monta + 283 Días',
      summary: 'La duración promedio de gestación en bovinos es de 283 días (9 meses y 10 días). El sistema emite alertas preventivas cuando faltan menos de 30 y 10 días para el parto.',
      example: 'Una vaca inseminada o montada el 1 de Enero tendrá su fecha estimada de parto alrededor del 11 de Octubre.',
      benchmark: [
        { label: 'Alerta Preparto', value: 'Permite trasladar la vaca a potrero de maternidad 20-30 días antes del parto.', color: 'text-rose-600 dark:text-rose-400' }
      ]
    }
  ];

  const filteredItems = useMemo(() => {
    return glossaryItems.filter(item => {
      const matchCategory = selectedCategory === 'Todos' || item.badge === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        item.title.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

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
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Fórmulas zootécnicas, metas de ceba, semáforo GDP, finanzas y ejemplos prácticos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Cerrar Glosario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Búsqueda y Filtro de Categorías */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 space-y-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto, fórmula (ej. GDP, 480 kg, ROI, Parto, Compañía)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-black text-[11px] whitespace-nowrap transition cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Conceptos Explicados */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="font-bold">
              Todos los cálculos matemáticos de tu hato se actualizan automáticamente en tiempo real cada vez que registras un nuevo pesaje, compra o gasto en la aplicación.
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-bold">No se encontraron conceptos para "{searchTerm}"</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                className="mt-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black border border-slate-300 dark:border-slate-600">
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                      {item.summary}
                    </p>

                    {/* Fórmula */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Fórmula:</span>
                      <span>{item.formula}</span>
                    </div>

                    {/* Ejemplo */}
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ejemplo Práctico:
                      </span>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {item.example}
                      </p>
                    </div>

                    {/* Referencias o Rangos */}
                    {item.benchmark && item.benchmark.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                        {item.benchmark.map((b, idx) => (
                          <span key={idx} className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <strong className="font-black text-slate-900 dark:text-white">{b.label}:</strong> <span className={`font-black ${b.color}`}>{b.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            Mostrando {filteredItems.length} de {glossaryItems.length} conceptos
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer"
          >
            Entendido, Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
}

