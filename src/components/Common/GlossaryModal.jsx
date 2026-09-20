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
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  FileText,
  Tag,
  Sparkles,
  ClipboardCheck,
  HeartPulse
} from 'lucide-react';

export function GlossaryModal({ isOpen, onClose, zIndex = 'z-[60]' }) {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = [
    'Todos', 
    'Zootecnia & Pesos', 
    'Ceba & Venta', 
    'Reproducción & Palpación', 
    'Sanidad & Censo ICA', 
    'Manejo & Trazabilidad', 
    'Finanzas & Negocios'
  ];

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
      id: 'palpationFast',
      title: 'Palpación Rápida & Diagnóstico Reproductivo',
      icon: Stethoscope,
      badge: 'Reproducción & Palpación',
      color: 'purple',
      formula: 'Tasa de Preñez = (Hembras Preñadas / Total Hembras Evaluadas en Jornada) × 100',
      summary: 'Módulo ultrarrápido de manga y corral para registrar en un toque el diagnóstico ginecológico de hembras (Preñada, Vacía, Dudosa), registrar hallazgos clínicos de ovarios/útero (Cuerpo Lúteo, Feto Viable, Anestro, Quistes), condición corporal y evaluar la aptitud para I.A. o monta.',
      example: '• Jornada de 30 vacas en manga: 24 preñadas, 5 vacías y 1 dudosa.\n• Tasa de preñez de la jornada: (24/30) × 100 = 80.0%.\n• Guarda borrador seguro en memoria local contra pérdidas de señal.',
      benchmark: [
        { label: '🤰 Preñada', value: 'Ingreso rápido de días/meses y cálculo en vivo de parto', color: 'text-amber-600 dark:text-amber-400' },
        { label: '⚪ Vacía', value: 'Hallazgos de ovarios estáticos, folículos o aptitud IATF', color: 'text-slate-600 dark:text-slate-400' },
        { label: '❓ Dudosa', value: 'Programación para rechequeo ginecológico en 30-45 días', color: 'text-sky-600 dark:text-sky-400' },
      ]
    },
    {
      id: 'gestationDays',
      title: 'Días de Gestación Diagnosticados & Cálculo de Parto',
      icon: Clock,
      badge: 'Reproducción & Palpación',
      color: 'amber',
      formula: 'Fecha de Parto = Fecha de Jornada + (283 - Días de Preñez) | Días Faltantes = 283 - Días de Preñez',
      summary: 'Sincroniza en tiempo real los días de preñez diagnosticados (1 a 8+ meses) con el período de gestación bovina (283 días), calculando la fecha exacta en que parirá la vaca y clasificando el nivel de alerta.',
      example: '• Palpación el 20-Sep-2026: Vaca diagnosticada con 180 días de preñez (~6 meses).\n• Días faltantes: 283 - 180 = 103 días.\n• Fecha estimada de parto: 1-Ene-2027.',
      benchmark: [
        { label: '🚨 Parto Inminente', value: '≤ 10 días restantes (traslado a maternidad)', color: 'text-rose-600 dark:text-rose-400' },
        { label: '⚠️ Próximo Parto', value: '≤ 30 días restantes (monitoreo preparto)', color: 'text-amber-600 dark:text-amber-400' },
        { label: '🥛 Secado Requerido', value: '≤ 60 días restantes (suspender ordeño en lechería)', color: 'text-purple-600 dark:text-purple-400' },
        { label: '🌱 Gestación Normal', value: '> 60 días restantes (pastoreo regular)', color: 'text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      id: 'checkupHistory',
      title: 'Intervalo Entre Chequeos & Proyección de Días',
      icon: Sparkles,
      badge: 'Reproducción & Palpación',
      color: 'indigo',
      formula: 'Días Transcurridos = Fecha Sesión - Fecha Chequeo Previo | Proyección = Días Previos + Días Transcurridos',
      summary: 'Compara automáticamente el chequeo ginecológico actual con el histórico anterior de la vaca, mostrando cuántos días transcurrieron entre revisiones y permitiendo proyectar en 1 clic los días de gestación acumulados.',
      example: '• Chequeo previo (1-Ago): Diagnosticada con 60 días de preñez.\n• Chequeo actual (15-Sep): Han transcurrido 45 días.\n• Botón inteligente: Proyecta automáticamente a ~105 días de preñez (60 + 45).',
      benchmark: [
        { label: 'Trazabilidad Ginecológica', value: 'Muestra CC anterior, evaluador y hallazgos previos en la tarjeta.', color: 'text-indigo-600 dark:text-indigo-400' }
      ]
    },
    {
      id: 'multiStatusFemales',
      title: 'Multiselección de Estados Productivos en Hembras',
      icon: Layers,
      badge: 'Reproducción & Palpación',
      color: 'teal',
      formula: 'Coexistencia = [Producción de Leche] + [Gestación] o [Levante] + [Gestación]',
      summary: 'Permite que una hembra tenga simultáneamente más de un estado productivo activo (por ejemplo, estar en ordeño diario y preñada al mismo tiempo, o novilla de levante preñada), abriendo los formularios de control pertinentes en una sola pantalla.',
      example: '• Vaca #105: Seleccionada con "Producción de leche" + "Gestación (Preñada)".\n• El sistema despliega tanto el control de lactancia/leche como el módulo de gestación, parto estimado y alertas sin exclusiones artificiales.',
      benchmark: [
        { label: 'Regla Lógica', value: 'Alternancia automática entre Preñada y Vacía para evitar contradicciones clínicas.', color: 'text-teal-600 dark:text-teal-400' }
      ]
    },
    {
      id: 'sanitaryPlanICA',
      title: 'Plan Sanitario FEDEGAN-ICA & Censo RUV',
      icon: ShieldCheck,
      badge: 'Sanidad & Censo ICA',
      color: 'emerald',
      formula: 'Censo ICA = Desglose de Hato en Categorías FEDEGAN (Vacas, Novillas, Terneras, Toros, Novillos, Terneros)',
      summary: 'Módulo sanitario oficial adaptado a la normatividad colombiana del ICA. Permite programar ciclos de vacunación nacional (Fiebre Aftosa, Brucelosis Bovina C19 en terneras 3-9m y RB51 en adultas, Carbón, Rabia, Vitaminas y Antiparasitarios) y generar la planilla oficial para el RUV (Registro Único de Vacunación).',
      example: '• Ciclos oficiales nacionales: Ciclo I (Mayo-Junio) y Ciclo II (Noviembre-Diciembre).\n• Alerta en tiempo real en el Calendario Ganadero con biológicos exigidos y estado de vacunación del predio.',
      benchmark: [
        { label: '📋 Censo Poblacional', value: 'Exporta reporte listo para brigadista y oficina local del ICA.', color: 'text-emerald-600 dark:text-emerald-400' }
      ]
    },
    {
      id: 'fieldAuditChecklist',
      title: 'Arqueo de Inventario en Corral & Checklist de Manga',
      icon: ClipboardCheck,
      badge: 'Manejo & Trazabilidad',
      color: 'blue',
      formula: 'Balance = Cabezas Esperadas - Verificadas = Faltantes (+ Animales Extras No Registrados)',
      summary: 'Herramienta de auditoría física para dedos en manga. Permite verificar la presencia física de cada bovino en el corral, registrar novedades clínicas rápidas (cojera, bichera, ojo malo, pérdida de arete, cría al pie), detectar animales de otros lotes y registrar animales extra.',
      example: '• Lote de 50 novillos en manga: 48 verificados, 2 faltantes y 1 animal extra no registrado.\n• Genera balance instantáneo con botón directo para compartir alerta a vaqueros.',
      benchmark: [
        { label: 'Conexión con Báscula', value: 'Permite conectar el checklist con la Báscula Rápida para pesar y contar simultáneamente.', color: 'text-blue-600 dark:text-blue-400' }
      ]
    },
    {
      id: 'originTraceability',
      title: 'Trazabilidad de Procedencia: Nacidos vs Comprados',
      icon: Baby,
      badge: 'Manejo & Trazabilidad',
      color: 'emerald',
      formula: 'Costo Entrada Cría Nacida = $0 COP | Genealogía = Madre (Vaca) + Padre (Toro / Pajilla IA)',
      summary: 'Diferencia el ganado nacido en el predio (🌱 Nacido en Finca) del ganado comprado (🛒 Comprado), en compañía (🤝) o traslados (🔄). Asigna costo inicial de $0 a los nacimientos para calcular la rentabilidad real con base exclusiva en gastos operativos posteriores.',
      example: '• Ternero nacido en la finca: Arete #25-6, Madre: Vaca #105, Padre: Toro Reproductor #12.\n• Costo inicial de compra: $0. Gastos de levante acumulados: $450.000 COP.\n• Rentabilidad calculada sobre los $450.000 invertidos.',
      benchmark: [
        { label: 'Flexibilidad de Lote', value: 'El número de lote no es obligatorio para nacimientos ni ganado de cría.', color: 'text-emerald-600 dark:text-emerald-400' }
      ]
    },
    {
      id: 'consecutiveControl',
      title: 'Control de Consecutivos y Numeración de Predio',
      icon: Tag,
      badge: 'Manejo & Trazabilidad',
      color: 'purple',
      formula: 'Consecutivo Base = Número antes del separador (ej. "25-6" o "25/5" ➔ Consecutivo Principal = 25)',
      summary: 'Audita la numeración de los aretes y marcas de la finca, sugiere automáticamente el siguiente número consecutivo y alerta preventivamente si se intenta registrar un número de arete duplicado en un animal activo del mismo hierro o dueño.',
      example: '• Último consecutivo registrado: #48-6.\n• Siguiente sugerido por el sistema: #49-6.\n• Alerta inmediata si el arete #48-6 ya existe activo en la finca.',
      benchmark: [
        { label: 'Detección de Duplicados', value: 'Previene confusiones en manga entre animales activos con la misma chapa.', color: 'text-purple-600 dark:text-purple-400' }
      ]
    },
    {
      id: 'batchExpenseProration',
      title: 'Prorrateo de Gastos Globales en Lotes de Ganado',
      icon: DollarSign,
      badge: 'Finanzas & Negocios',
      color: 'amber',
      formula: 'Gasto por Cabeza = Total Gastos Globales (Flete + Guías + Báscula + Comisión) ÷ Total Cabezas',
      summary: 'Al ingresar un lote de ganado comprado, permite digitar los gastos globales del negocio (camión de transporte, pesaje en báscula pública, comisiones, vacunas de entrada y guías de movilización ICA) y los reparte automáticamente a partes iguales entre todos los animales.',
      example: '• Compra de 20 novillos por $40.000.000 COP.\n• Flete de camión ($1.200.000) + Guía ICA y báscula ($200.000) = $1.400.000 en gastos globales.\n• Gasto prorrateado: $70.000 COP por novillo.\n• Costo real unitario de entrada: $2.070.000 COP por cabeza.',
      benchmark: [
        { label: 'Costo Real de Compra', value: 'Garantiza que la inversión inicial refleje todos los costos indirectos reales.', color: 'text-amber-600 dark:text-amber-400' }
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
      title: 'ROI (Retorno sobre la Inversión & Costo/Kg)',
      icon: DollarSign,
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
      title: 'Biomasa Total del Hato & Carga Animal',
      icon: Layers,
      badge: 'Zootecnia & Pesos',
      color: 'purple',
      formula: 'Biomasa Total = Sumatoria del peso actual de todos los bovinos activos',
      summary: 'Es el volumen total en kilogramos de carne viva que se encuentra pastando en los potreros de tu finca en este instante.',
      example: 'Si tienes 40 novillos con un peso promedio de 420 kg cada uno, la biomasa total de tu finca es de 16.800 kg (16.8 toneladas de carne en pie).',
      benchmark: [
        { label: 'Capacidad de Carga', value: 'Se usa para calcular la carga animal por hectárea (UGM/Ha).', color: 'text-purple-600 dark:text-purple-400' }
      ]
    },
    {
      id: 'projectedProfit',
      title: 'Valoración Patrimonial & Utilidad Real Liquidada',
      icon: Percent,
      badge: 'Finanzas & Negocios',
      color: 'blue',
      formula: 'Patrimonio Ganadero = Suma Costos de Compra | Utilidad Real = Valor Venta - Inversión Total',
      summary: 'Distingue entre el valor patrimonial de los animales presentes en la finca (calculado de forma conservadora sobre su costo inicial de compra) y la ganancia líquida real obtenida tras liquidar un lote en báscula.',
      example: '• Valor Total de Ganado: Capital real invertido en animales que pastan en el predio.\n• Utilidad de Venta: Dinero neto recibido tras descontar costos de compra, fletes y gastos operativos.',
      benchmark: []
    },
    {
      id: 'gestation',
      title: 'Gestación Bovina Estándar (283 Días)',
      icon: Baby,
      badge: 'Reproducción & Palpación',
      color: 'rose',
      formula: 'Fecha Estimada Parto = Fecha de Servicio / Monta + 283 Días',
      summary: 'La duración promedio de gestación en vacas y novillas es de 283 días (9 meses y 10 días). El sistema monitorea el avance y emite alertas automáticas para secado y traslado a maternidad.',
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
    <div className={`modal-backdrop-root fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto`}>
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

