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

export const PASTURE_DEFAULTS = {
  'Brachiaria Decumbens': { avgCuttingKg: 1.5, restDays: 30, desc: 'Pasto rústico de buena cobertura y rusticidad' },
  'Brachiaria Brizantha (Marandú / Toledo)': { avgCuttingKg: 1.9, restDays: 32, desc: 'Alto volumen forrajero y macollamiento' },
  'Brachiaria Humidicola': { avgCuttingKg: 1.2, restDays: 35, desc: 'Excelente encharcamiento y suelos ácidos' },
  'Brachiaria Ruziziensis': { avgCuttingKg: 1.4, restDays: 28, desc: 'Gran palatabilidad y digestibilidad tierna' },
  'Guinea Mombaza (Megathyrsus)': { avgCuttingKg: 2.3, restDays: 35, desc: 'Alta producción de biomasa y proteína' },
  'Guinea Tanzania / Zuri': { avgCuttingKg: 2.0, restDays: 32, desc: 'Excelente relación hoja/tallo y digestibilidad' },
  'Pasto Estrella (Cynodon)': { avgCuttingKg: 1.6, restDays: 25, desc: 'Rápido rebrote rastrero y estolonífero' },
  'Pasto Mulato II / Caimán': { avgCuttingKg: 2.1, restDays: 30, desc: 'Híbrido vigoroso con alto tenor de proteína' },
  'Pasto Puntero / Yaraguá': { avgCuttingKg: 1.3, restDays: 35, desc: 'Tradicional de clima cálido y secano' },
  'Pasto Kikuyo': { avgCuttingKg: 1.8, restDays: 35, desc: 'Excelente para trópico alto y lechería especializada' },
  'Pasto Cuba 22 / Maralfalfa (Corte)': { avgCuttingKg: 4.5, restDays: 50, desc: 'Pasto de corte intensivo de alto tonelaje' },
  'Pasto King Grass / Elefante': { avgCuttingKg: 4.0, restDays: 45, desc: 'Pasto de corte y ensilaje volumétrico' },
  'Pasto Pangola': { avgCuttingKg: 1.4, restDays: 28, desc: 'Fino y muy palatable para ceba y engorde' },
  'Pasto Natural / Sabana': { avgCuttingKg: 0.9, restDays: 40, desc: 'Pastura nativa de baja densidad forrajera' },
  'Leguminosa / Silvopastoril (Matarratón / Leucaena)': { avgCuttingKg: 2.5, restDays: 40, desc: 'Arbustos de alta proteína y sombra' },
};

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
 * Obtiene los valores zootécnicos por defecto según la especie de pasto
 */
export function getPastureDefaultAforo(pastureType) {
  if (pastureType && PASTURE_DEFAULTS[pastureType]) {
    return PASTURE_DEFAULTS[pastureType];
  }
  return { avgCuttingKg: 1.6, restDays: 30, desc: 'Pastura estándar' };
}

/**
 * Calcula el aforo de forraje disponible y los días proyectados de pastoreo (Función básica)
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

/**
 * Motor zootécnico integral de cálculo de capacidad y rotación de potreros:
 * 1. ¿Cuántos animales podemos meter para X días de ocupación?
 * 2. Si metemos N animales, ¿cuántos días de ocupación ideales rinde?
 * 3. Basado en el tiempo de descanso deseado, ¿cuántos potreros requiere el circuito rotacional?
 * 4. Si el ganadero tiene P potreros disponibles en su rotación (ej. 3 potreros), ¿cómo se comporta el circuito?
 */
export function calculatePaddockCapacity({
  areaHa = 1,
  pastureType = 'Brachiaria Brizantha (Marandú / Toledo)',
  cuttingWeightKg = null,
  usablePercentage = 70,
  targetRestDays = 30,
  targetGrazingDays = 3,
  animalCount = 25,
  avgAnimalWeightKg = 380,
  consumptionRate = 10,
  entryDate = null,
  availablePaddocksCount = 3,
}) {
  const parsedAreaHa = parseFloat(areaHa) || 0;
  const areaM2 = parsedAreaHa * 10000;

  // Si no se suministra peso de corte, tomar el por defecto de la especie
  const defaultPastureInfo = getPastureDefaultAforo(pastureType);
  const effectiveCuttingWeightKg = (cuttingWeightKg !== null && !isNaN(parseFloat(cuttingWeightKg)) && parseFloat(cuttingWeightKg) > 0)
    ? parseFloat(cuttingWeightKg)
    : defaultPastureInfo.avgCuttingKg;

  const usableFraction = (parseFloat(usablePercentage) || 70) / 100;

  // Forraje Verde Total y Aprovechable
  const totalForageKg = areaM2 * effectiveCuttingWeightKg;
  const usableForageKg = totalForageKg * usableFraction;

  const count = Math.max(1, parseInt(animalCount) || 1);
  const avgWeight = Math.max(50, parseFloat(avgAnimalWeightKg) || 380);
  const intakePct = (parseFloat(consumptionRate) || 10) / 100;

  // Consumo de Forraje Verde por animal y lote (10% a 12% peso vivo)
  const dailyPerAnimalKg = avgWeight * intakePct;
  const dailyTotalBatchKg = count * dailyPerAnimalKg;

  const restDays = Math.max(5, parseInt(targetRestDays) || defaultPastureInfo.restDays || 30);
  const targetStayDays = Math.max(1, parseFloat(targetGrazingDays) || 3);
  const userPaddocksCount = Math.max(1, parseInt(availablePaddocksCount) || 3);

  // 1. ¿CUÁNTOS ANIMALES PODEMOS METER para pastorear targetStayDays (ej. 3 días)?
  const maxAnimalsForTargetStay = dailyPerAnimalKg > 0 && targetStayDays > 0
    ? Math.floor(usableForageKg / (targetStayDays * dailyPerAnimalKg))
    : 0;

  const maxUGMForTargetStay = Math.round(((maxAnimalsForTargetStay * avgWeight) / 450) * 10) / 10;

  // 2. DÍAS DE OCUPACIÓN IDEALES si metemos exactamente 'count' animales
  const exactIdealGrazingDays = dailyTotalBatchKg > 0 ? (usableForageKg / dailyTotalBatchKg) : 0;
  const idealGrazingDays = Math.round(exactIdealGrazingDays * 10) / 10;

  // 3. NÚMERO DE POTREROS TEÓRICOS NECESARIOS PARA EL CIRCUITO ROTACIONAL CONTINUO
  // Fórmula: N° Potreros = (Días de Descanso / Días de Ocupación) + 1
  const effectiveGrazingDaysForCircuit = Math.max(0.5, exactIdealGrazingDays);
  const paddocksNeededInCircuit = Math.ceil(restDays / effectiveGrazingDaysForCircuit) + 1;

  // 4. SIMULACIÓN DEL CIRCUITO CON 'userPaddocksCount' POTREROS (ej. 3 potreros)
  // En P potreros, mientras 1 está ocupado, (P - 1) descansan.
  const actualRestDaysAchieved = userPaddocksCount > 1
    ? Math.round(((userPaddocksCount - 1) * exactIdealGrazingDays) * 10) / 10
    : 0;

  const cycleTotalDays = Math.round((userPaddocksCount * exactIdealGrazingDays) * 10) / 10;
  const restDaysBalance = Math.round((actualRestDaysAchieved - restDays) * 10) / 10;
  const paddocksDeficit = Math.max(0, paddocksNeededInCircuit - userPaddocksCount);

  // Días que debería durar el pastoreo en cada potrero si quisiéramos cumplir exactamente el descanso con estos P potreros
  const requiredStayPerPaddockForTargetRest = userPaddocksCount > 1
    ? Math.round((restDays / (userPaddocksCount - 1)) * 10) / 10
    : restDays;

  // Tamaño de lote sostenible en equilibrio para estos P potreros y descanso meta
  const sustainableHerdSizeForCircuit = (dailyPerAnimalKg > 0 && requiredStayPerPaddockForTargetRest > 0)
    ? Math.floor(usableForageKg / (requiredStayPerPaddockForTargetRest * dailyPerAnimalKg))
    : 0;

  // Estado del circuito con los P potreros definidos
  let circuitEvaluation = {
    status: 'sostenible',
    badgeVariant: 'emerald',
    label: `Circuito Sostenible (${userPaddocksCount} potreros)`,
    summary: `Con tus ${userPaddocksCount} potreros y ${count} animales, cada potrero descansará ${actualRestDaysAchieved} días (meta: ${restDays}d). La rotación completa durará ${cycleTotalDays} días.`,
  };

  if (userPaddocksCount === 1) {
    circuitEvaluation = {
      status: 'continuo',
      badgeVariant: 'rose',
      label: 'Pastoreo Continuo (1 Potrero)',
      summary: `Con 1 solo potrero no hay descanso para la pastura. El ganado comerá el rebrote tierno continuamente. Se recomienda subdividir en al menos ${paddocksNeededInCircuit} potreros.`,
    };
  } else if (actualRestDaysAchieved < restDays * 0.75) {
    circuitEvaluation = {
      status: 'deficit_descanso',
      badgeVariant: 'rose',
      label: `¡Déficit de Descanso (${userPaddocksCount} potreros)!`,
      summary: `Con ${userPaddocksCount} potreros y ${count} animales, los potreros solo descansarán ${actualRestDaysAchieved} días antes del regreso (faltan ${Math.abs(restDaysBalance)} días para la meta de ${restDays}d). Necesitas subdividir a ${paddocksNeededInCircuit} potreros o ajustar el lote a ${sustainableHerdSizeForCircuit} cabezas.`,
    };
  } else if (actualRestDaysAchieved < restDays) {
    circuitEvaluation = {
      status: 'ajustado',
      badgeVariant: 'amber',
      label: `Rotación Ajustada (${userPaddocksCount} potreros)`,
      summary: `Tus ${userPaddocksCount} potreros acumulan ${actualRestDaysAchieved} días de descanso (meta: ${restDays}d, faltan ${Math.abs(restDaysBalance)}d). El pasto rebrotará pero estará algo tierno. Se sugiere sumar ${paddocksDeficit} potrero(s) más.`,
    };
  }

  // 5. CRONOGRAMA SIMULADO DE ROTACIÓN DEL CIRCUITO (Fechas)
  const rotationSteps = [];
  const baseDateStr = entryDate || getLocalDateString();
  try {
    const parts = baseDateStr.split('-');
    if (parts.length === 3) {
      let currentD = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const daysPerPaddock = Math.max(1, Math.round(exactIdealGrazingDays));

      for (let i = 1; i <= userPaddocksCount; i++) {
        const startD = new Date(currentD);
        const endD = new Date(currentD);
        endD.setDate(endD.getDate() + daysPerPaddock);

        const fmt = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        rotationSteps.push({
          paddockIndex: i,
          name: i === 1 ? 'Potrero 1 (Actual)' : `Potrero ${i}`,
          entryDate: fmt(startD),
          exitDate: fmt(endD),
          grazingDays: daysPerPaddock,
        });

        currentD = new Date(endD);
      }
    }
  } catch (e) {}

  // 6. CARGA INSTANTÁNEA (UGM = 450 kg)
  const totalLiveWeightKg = count * avgWeight;
  const totalUGM = Math.round((totalLiveWeightKg / 450) * 10) / 10;
  const ugmPerHa = parsedAreaHa > 0 ? Math.round((totalUGM / parsedAreaHa) * 10) / 10 : 0;
  const kgPerHa = parsedAreaHa > 0 ? Math.round(totalLiveWeightKg / parsedAreaHa) : 0;

  // 7. FECHA SUGERIDA DE SALIDA DEL POTRERO ACTUAL
  let suggestedExitDate = '';
  if (entryDate) {
    try {
      const parts = entryDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const daysToAdd = Math.max(1, Math.round(exactIdealGrazingDays));
        d.setDate(d.getDate() + daysToAdd);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        suggestedExitDate = `${y}-${m}-${day}`;
      }
    } catch (e) {}
  }

  // 8. EVALUACIÓN ZOOTÉCNICA GENERAL
  let evaluation = {
    status: 'optimo',
    badgeVariant: 'emerald',
    label: 'Carga & Rotación Óptima',
    summary: `Con ${count} animales de ${avgWeight} kg, el potrero rinde exactamente ${idealGrazingDays} días de pastoreo con excelente rebrote.`,
  };

  if (idealGrazingDays < 1) {
    evaluation = {
      status: 'sobrepastoreo',
      badgeVariant: 'rose',
      label: '¡Carga Excesiva / Riesgo de Sobrepastoreo!',
      summary: `El forraje disponible rinde menos de 1 día (${idealGrazingDays}d) para ${count} animales. Se recomienda reducir el lote o complementar con forraje externo.`,
    };
  } else if (idealGrazingDays > 5) {
    evaluation = {
      status: 'subpastoreo',
      badgeVariant: 'amber',
      label: 'Periodo de Ocupación Prolongado',
      summary: `Rinde ${idealGrazingDays} días. Al superar los 4 días, los animales comenzarán a comerse el rebrote nuevo. Se sugiere dividir el potrero con cerca eléctrica o aumentar el lote.`,
    };
  } else if (ugmPerHa > 4.5) {
    evaluation = {
      status: 'alta_presion',
      badgeVariant: 'amber',
      label: 'Alta Presión Instantánea',
      summary: `Carga alta (${ugmPerHa} UGM/ha). Excelente para pastoreo intensivo Voissin, asegurando rotar el lote en ${idealGrazingDays} días.`,
    };
  }

  return {
    areaHa: parsedAreaHa,
    areaM2,
    pastureType,
    cuttingWeightKg: effectiveCuttingWeightKg,
    usablePercentage: Math.round(usableFraction * 100),
    totalForageKg: Math.round(totalForageKg),
    usableForageKg: Math.round(usableForageKg),
    animalCount: count,
    avgAnimalWeightKg: avgWeight,
    dailyPerAnimalKg: Math.round(dailyPerAnimalKg * 10) / 10,
    dailyTotalBatchKg: Math.round(dailyTotalBatchKg),
    targetRestDays: restDays,
    targetGrazingDays: targetStayDays,
    maxAnimalsForTargetStay,
    maxUGMForTargetStay,
    idealGrazingDays,
    exactIdealGrazingDays,
    paddocksNeededInCircuit,
    // Circuito personalizado del usuario
    availablePaddocksCount: userPaddocksCount,
    actualRestDaysAchieved,
    cycleTotalDays,
    restDaysBalance,
    requiredStayPerPaddockForTargetRest,
    sustainableHerdSizeForCircuit,
    paddocksDeficit,
    circuitEvaluation,
    rotationSteps,
    // Carga y fechas
    totalLiveWeightKg,
    totalUGM,
    ugmPerHa,
    kgPerHa,
    suggestedExitDate,
    evaluation,
  };
}
