export const PASTURE_TYPES = [
  'Brachiaria Decumbens',
  'Brachiaria Brizantha (Marandú / Toledo)',
  'Brachiaria Humidicola',
  'Brachiaria Ruziziensis',
  'Guinea Mombaza (Megathyrsus)',
  'Guinea Tanzania / Zuri',
  'Pasto Estrella (Cynodon)',
  'Pasto Mulato II / Caimán',
  'Pasto Puntero / Yaraguá',
  'Pasto Kikuyo',
  'Pasto Cuba 22 / Maralfalfa (Corte)',
  'Pasto King Grass / Elefante',
  'Pasto Pangola',
  'Pasto Natural / Sabana',
  'Leguminosa / Silvopastoril (Matarratón / Leucaena)',
];

export const WATER_SOURCES = [
  'Acueducto / Tubería con Flotador',
  'Bebedero Móvil',
  'Quebrada / Arroyo Natural',
  'Jagüey / Reservorio',
  'Pozo Profundo / Molino',
  'Tanque Australiano / Distribución',
  'Río',
];

export const PADDOCK_STATUSES = [
  { value: 'descanso', label: 'En Descanso / Recuperación', color: 'emerald', icon: 'Leaf' },
  { value: 'ocupado', label: 'Ocupado (Pastoreo Activo)', color: 'rose', icon: 'ShieldAlert' },
  { value: 'mantenimiento', label: 'En Mantenimiento / Cuidado', color: 'amber', icon: 'Wrench' },
];

/**
 * Calcula el aforo de forraje disponible y los días proyectados de pastoreo
 * @param {Object} params
 * @param {number} params.areaHa Área del potrero en hectáreas
 * @param {number} params.cuttingWeightKg Peso cortado en marco de 1m2 (kg/m2)
 * @param {number} params.usablePercentage Porcentaje de forraje aprovechable (default 70%)
 * @param {number} params.animalCount Número de cabezas
 * @param {number} params.avgAnimalWeightKg Peso promedio por cabeza (kg)
 * @param {number} params.consumptionRate Tasa de consumo diario (% peso vivo, default 10%)
 */
export function calculateForageCapacity({
  areaHa = 1,
  cuttingWeightKg = 1.5,
  usablePercentage = 70,
  animalCount = 20,
  avgAnimalWeightKg = 350,
  consumptionRate = 10,
}) {
  const areaM2 = (parseFloat(areaHa) || 0) * 10000;
  const cutKg = parseFloat(cuttingWeightKg) || 0;
  const usableFraction = (parseFloat(usablePercentage) || 70) / 100;
  
  // Forraje Verde Total (kg)
  const totalForageKg = areaM2 * cutKg;
  // Forraje Verde Aprovechable (kg)
  const usableForageKg = totalForageKg * usableFraction;

  const count = parseInt(animalCount) || 1;
  const avgWeight = parseFloat(avgAnimalWeightKg) || 350;
  const rate = (parseFloat(consumptionRate) || 10) / 100;

  // Consumo diario por animal y del lote completo (kg/día)
  const dailyPerAnimalKg = avgWeight * rate;
  const dailyTotalBatchKg = count * dailyPerAnimalKg;

  // Días de pastoreo que rinde el potrero
  const grazingDays = dailyTotalBatchKg > 0 ? (usableForageKg / dailyTotalBatchKg) : 0;

  return {
    areaM2,
    totalForageKg: Math.round(totalForageKg),
    usableForageKg: Math.round(usableForageKg),
    dailyTotalBatchKg: Math.round(dailyTotalBatchKg),
    dailyPerAnimalKg: Math.round(dailyPerAnimalKg * 10) / 10,
    grazingDays: Math.round(grazingDays * 10) / 10,
    exactGrazingDays: grazingDays,
  };
}
