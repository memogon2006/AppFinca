/**
 * Servicio Zootécnico y Económico de Sal Mineralizada y Suplementación Bovina
 */

export const SALT_TYPES = [
  { id: 'mineralizada', label: 'Sal Mineralizada (6% a 10% Fósforo)', defaultMin: 60, defaultMax: 100, defaultBagKg: 40 },
  { id: 'proteinada', label: 'Sal Proteinada (Ceba / Verano)', defaultMin: 150, defaultMax: 300, defaultBagKg: 40 },
  { id: 'sal_blanca', label: 'Sal Blanca / Sal Marina con Azufre', defaultMin: 35, defaultMax: 60, defaultBagKg: 50 },
  { id: 'concentrado', label: 'Concentrado / Balanceado Comercial', defaultMin: 500, defaultMax: 2000, defaultBagKg: 40 },
  { id: 'melaza_urea', label: 'Melaza con Úrea / Bloque Nutricional', defaultMin: 200, defaultMax: 500, defaultBagKg: 25 },
];

export const POPULAR_SALT_BRANDS = [
  'Somex 8% Fósforo Ceba',
  'Somex 10% Cría y Reproducción',
  'Colanta Sal Mineralizada 8%',
  'Veacol Bovina 8% Cría',
  'Agrogán Sal 7%',
  'Contegral Sal Mineral 8%',
  'Italcol Sal Bovina 8%',
  'Finca Sal Mineralizada 6%',
  'Sal Marina Blanca con Azufre',
  'Sal Proteinada Somex Ganancia',
];

/**
 * Calcula el consumo zootécnico en gramos por cabeza al día y genera el semáforo
 * @param {Object} params
 * @param {number} params.totalKg - Kilos totales suministrados
 * @param {number} params.animalCount - Número de animales que consumieron
 * @param {number} params.durationDays - Días que duró el salero
 * @param {string} params.saltType - Tipo de sal
 */
export function calculateSaltConsumption({ totalKg, animalCount, durationDays, saltType = 'mineralizada' }) {
  const kg = parseFloat(totalKg) || 0;
  const animals = parseInt(animalCount, 10) || 1;
  const days = Math.max(1, parseInt(durationDays, 10) || 1);

  const typeConfig = SALT_TYPES.find(t => t.id === saltType) || SALT_TYPES[0];
  const minTarget = typeConfig.defaultMin;
  const maxTarget = typeConfig.defaultMax;

  if (kg <= 0 || animals <= 0) {
    return {
      dailyGramsPerHead: 0,
      status: 'optimo',
      statusLabel: 'Sin datos',
      badgeClass: 'bg-slate-100 text-slate-700',
      advice: 'Registra los bultos suministrados para evaluar el consumo.'
    };
  }

  // Gramos consumidos por animal al día
  const dailyGramsPerHead = Math.round((kg * 1000) / (animals * days));

  if (dailyGramsPerHead < minTarget) {
    return {
      dailyGramsPerHead,
      status: 'subconsumo',
      statusLabel: 'Subconsumo (Bajo)',
      badgeClass: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700',
      textClass: 'text-blue-600 dark:text-blue-400',
      color: 'blue',
      advice: 'Alerta: los animales están comiendo menos sal de la requerida. Revisa si el salero está sucio, mojado con lluvia o si el bebedero está muy retirado.'
    };
  }

  if (dailyGramsPerHead <= maxTarget) {
    return {
      dailyGramsPerHead,
      status: 'optimo',
      statusLabel: 'Consumo Óptimo',
      badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      color: 'emerald',
      advice: 'Excelente: el lote está consumiendo el nivel nutricional ideal para mantener buena digestión ruminal y ganancia de peso.'
    };
  }

  if (dailyGramsPerHead <= maxTarget * 1.35) {
    return {
      dailyGramsPerHead,
      status: 'elevado',
      statusLabel: 'Consumo Elevado',
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
      textClass: 'text-amber-600 dark:text-amber-400',
      color: 'amber',
      advice: 'El consumo está por encima del rango. Puede deberse a pasturas tiernas con baja materia seca o deficiencia mineral previa.'
    };
  }

  return {
    dailyGramsPerHead,
    status: 'desperdicio',
    statusLabel: 'Sobreconsumo / Desperdicio',
    badgeClass: 'bg-rose-100 text-rose-950 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700',
    textClass: 'text-rose-600 dark:text-rose-400',
    color: 'rose',
    advice: 'Alerta de desperdicio: los animales comen en exceso o el salero no tiene techo y el aluvión de lluvia está lavando la sal al suelo.'
  };
}

/**
 * Calcula los indicadores económicos del consumo de sal
 */
export function calculateSaltEconomics({ costPerBag, bagWeightKg = 40, dailyGramsPerHead = 80 }) {
  const bagCost = parseFloat(costPerBag) || 0;
  const bagKg = parseFloat(bagWeightKg) || 40;
  const costPerKg = bagCost > 0 && bagKg > 0 ? bagCost / bagKg : 0;

  const costPerHeadPerDay = (dailyGramsPerHead / 1000) * costPerKg;
  const costPerHeadPerMonth = costPerHeadPerDay * 30;

  return {
    costPerKg: Math.round(costPerKg),
    costPerHeadPerDay: Math.round(costPerHeadPerDay),
    costPerHeadPerMonth: Math.round(costPerHeadPerMonth)
  };
}
