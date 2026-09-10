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
  { value: 'Producción de leche', label: '🥛 Producción de leche (En ordeño activo)', color: 'blue', short: 'Ordeño' },
  { value: 'Levante de cría', label: '👶 Levante de cría (Amamantando / Cría al pie)', color: 'purple', short: 'Con ternero' },
  { value: 'Gestación', label: '🤰 Gestación (Preñada)', color: 'emerald', short: 'Preñez' },
  { value: 'Vacía', label: '⭕ Vacía (Abierta / Seca / Lista para servicio)', color: 'gray', short: 'Abierta' },
  { value: 'Ceba / Levante / Engorde', label: '🥩 Ceba, Levante o Engorde (Hembra de carne)', color: 'amber', short: 'Ceba / Engorde' },
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

export const BASE_COMMON_COLORS = [
  'Blanco',
  'Negro',
  'Hosco',
  'Castaño',
  'Sardo',
  'Colorado',
  'Bayo',
  'Gris',
  'Barcino',
  'Careto',
  'Pardo',
  'Roano'
];

/**
 * Obtiene la lista dinámica de colores basada en el historial del inventario de la finca
 * y colores base estándar, ordenada por frecuencia y orden alfabético.
 */
export function getDynamicFarmColors(cattleList = [], extraColor = '') {
  const colorCounts = {};

  // 1. Contabilizar colores ya registrados en los animales de la finca
  (cattleList || []).forEach(c => {
    const col = (c.color || '').trim();
    if (col) {
      const formatted = col.charAt(0).toUpperCase() + col.slice(1);
      colorCounts[formatted] = (colorCounts[formatted] || 0) + 1;
    }
  });

  // 2. Si hay un color extra en edición/escritura, incluirlo
  if (extraColor && extraColor.trim()) {
    const curCol = extraColor.trim();
    const formattedCur = curCol.charAt(0).toUpperCase() + curCol.slice(1);
    if (!colorCounts[formattedCur]) {
      colorCounts[formattedCur] = 0.5;
    }
  }

  // 3. Asegurar presencia de colores base ganaderos
  BASE_COMMON_COLORS.forEach(b => {
    if (colorCounts[b] === undefined) {
      colorCounts[b] = 0;
    }
  });

  // 4. Ordenar: los más frecuentes primero, luego alfabéticamente
  return Object.keys(colorCounts).sort((a, b) => {
    const countA = colorCounts[a] || 0;
    const countB = colorCounts[b] || 0;
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });
}

