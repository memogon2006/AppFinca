export const SEX_OPTIONS = [
  { value: 'Macho', label: 'Macho 🐂' },
  { value: 'Hembra', label: 'Hembra 🐄' },
];

export const PRODUCTION_TYPES = [
  { value: 'Ceba', label: 'Ceba / Engorde', color: 'emerald', desc: 'Producción de carne' },
  { value: 'Lechería', label: 'Lechería Especializada', color: 'blue', desc: 'Producción láctea' },
  { value: 'Cría', label: 'Cría / Vientres', color: 'purple', desc: 'Multiplicación y terneros' },
  { value: 'Doble Propósito', label: 'Doble Propósito (Carne y Leche)', color: 'amber', desc: 'Carne y leche combinados' },
];

export const CATEGORIES = [
  { value: 'Ternero', label: 'Ternero / Ternera (< 12 meses)', sex: 'Ambos' },
  { value: 'Novillo', label: 'Novillo (Levante/Ceba 12-30m)', sex: 'Macho' },
  { value: 'Novilla', label: 'Novilla de Vientre / Levante', sex: 'Hembra' },
  { value: 'Vaca', label: 'Vaca Adulta', sex: 'Hembra' },
  { value: 'Toro', label: 'Toro Reproductor', sex: 'Macho' },
  { value: 'Torete', label: 'Torete', sex: 'Macho' },
  { value: 'Buey', label: 'Buey / Ceba Pesada', sex: 'Macho' },
];

export const FEMALE_STATUSES = [
  { value: 'Producción de leche', label: '🥛 Producción de leche (En ordeño activo)', color: 'blue' },
  { value: 'Levante de cría', label: '👶 Levante de cría (Amamantando / Cría al pie)', color: 'purple' },
  { value: 'Gestación', label: '🤰 Gestación (Preñada)', color: 'emerald' },
  { value: 'Vacía', label: '⭕ Vacía (Abierta / Seca / Lista para servicio)', color: 'gray' },
];

export const REPRODUCTIVE_STATUSES = [
  { value: 'Vacía', label: 'Vacía / Abierta', color: 'gray' },
  { value: 'En Servicio', label: 'En Servicio / Inseminada', color: 'amber' },
  { value: 'Preñada', label: 'Preñada (Gestante)', color: 'emerald' },
  { value: 'No aplica', label: 'No aplica (Joven / Macho)', color: 'slate' },
];

export const MILKING_STATUSES = [
  { value: 'En ordeño', label: 'En Producción de Leche (Ordeño activo)', color: 'blue' },
  { value: 'Seca', label: 'Seca (Periodo de descanso)', color: 'amber' },
  { value: 'No aplica', label: 'No aplica', color: 'slate' },
];

export const ANIMAL_STATUSES = [
  { value: 'Activo', label: 'Activo en Finca', color: 'emerald' },
  { value: 'Vendido', label: 'Vendido / Liquidado', color: 'blue' },
  { value: 'Muerto', label: 'Muerte / Baja', color: 'red' },
  { value: 'Trasladado', label: 'Trasladado a otra finca', color: 'purple' },
];

export const ENTRY_TYPES = [
  { value: 'Compra', label: 'Compra comercial' },
  { value: 'Nacimiento', label: 'Nacimiento en la finca' },
  { value: 'Compañía', label: 'Ganado en Compañía / Medianería' },
  { value: 'Traslado', label: 'Traslado interno' },
];

export const COMMON_BREEDS = [
  'Brahman Blanco',
  'Brahman Rojo',
  'Cebú Comercial',
  'Gyr Lechero',
  'Girolando',
  'Holstein',
  'Jersey',
  'Simmental / Simbrah',
  'Angus / Brangus',
  'Normando',
  'Nelore',
  'Senepol',
  'Criollo / BON',
  'Mestizo / Cruce',
];
