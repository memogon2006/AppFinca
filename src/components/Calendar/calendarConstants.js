// Definición oficial de temporadas y ciclos de vacunación en Colombia
export const SANITARY_CYCLES_INFO = [
  {
    id: 'ciclo-1',
    months: [4, 5, 6], // Mayo (4), Junio (5), Julio (6)
    name: 'Ciclo I Oficial FEDEGAN / ICA',
    shortName: 'Ciclo I ICA',
    focus: 'Fiebre Aftosa + Brucelosis Bovina (Obligatoria ICA)',
    badge: '🏛️ CICLO I OFICIAL ICA',
    badgeClass: 'bg-emerald-600 text-white',
    borderClass: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/40',
    textClass: 'text-emerald-900 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    type: 'official',
    desc: 'Periodo oficial nacional de vacunación obligatoria contra Fiebre Aftosa y Brucelosis Bovina (3-9 meses). Requiere expedición del RUV para venta y movilización.',
    pillIcon: '💉',
    pillColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400'
  },
  {
    id: 'ciclo-2',
    months: [10, 11, 0, 1], // Noviembre (10), Diciembre (11), Enero (0), Febrero (1)
    name: 'Ciclo II Oficial FEDEGAN / ICA',
    shortName: 'Ciclo II ICA',
    focus: 'Revacunación Fiebre Aftosa + Brucelosis (Obligatoria ICA)',
    badge: '🏛️ CICLO II OFICIAL ICA',
    badgeClass: 'bg-emerald-600 text-white',
    borderClass: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/40',
    textClass: 'text-emerald-900 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    type: 'official',
    desc: 'Segundo ciclo obligatorio nacional para sostener el estatus sanitario libre de aftosa. Se aplica a todo el hato y terneras nuevas.',
    pillIcon: '💉',
    pillColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400'
  },
  {
    id: 'carbon',
    months: [2, 3], // Marzo (2), Abril (3)
    name: 'Temporada Preventiva: Entrada de Aguas',
    shortName: 'Carbón Triple',
    focus: 'Carbón Sintomático / Mancha / Gangrena (Triple Clostridial)',
    badge: '🔥 PREVENTIVA CLOSTRIDIOSIS',
    badgeClass: 'bg-amber-500 text-slate-950',
    borderClass: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/40',
    textClass: 'text-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
    type: 'preventive',
    desc: 'Vacunación preventiva recomendada antes de la temporada de lluvias para evitar mortandad súbita por Clostridiosis en animales jóvenes y adultos.',
    pillIcon: '🔥',
    pillColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-400'
  },
  {
    id: 'refuerzo',
    months: [7, 8, 9], // Agosto (7), Septiembre (8), Octubre (9)
    name: 'Temporada: Refuerzo Sanitario & Vitaminización',
    shortName: 'Refuerzo & Vitaminas',
    focus: 'Refuerzo Carbón Triple + Vitaminas A, D, E + Desparasitación',
    badge: '💊 REFUERZO & VITAMINAS',
    badgeClass: 'bg-teal-600 text-white',
    borderClass: 'border-teal-500/50 bg-teal-50/90 dark:bg-teal-950/40',
    textClass: 'text-teal-900 dark:text-teal-200',
    iconColor: 'text-teal-600 dark:text-teal-400',
    type: 'preventive',
    desc: 'Refuerzo inmunitario y nutricional de mitad de semestre para maximizar la ganancia diaria de peso (GDP) y sostener la fertilidad del hato.',
    pillIcon: '💊',
    pillColor: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border-teal-400'
  }
];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTH_SHORT_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const NOTE_CATEGORIES = [
  { id: 'general', label: 'General', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'vacunacion', label: 'Vacunación / Salud', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  { id: 'potrero', label: 'Potreros & Pastos', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'báscula', label: 'Pesaje / Báscula', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'insumos', label: 'Insumos / Sal / Alimento', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'reproduccion', label: 'Reproducción / Partos', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
];
