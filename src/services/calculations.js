/**
 * Cálculos matemáticos, zootécnicos y lecheros ganaderos continuos
 */

export const BOVINE_GESTATION_DAYS = 283; // Promedio de días de gestación bovina

/**
 * Formatea un número como moneda local (pesos/dólares)
 */
export function formatCurrency(amount, currency = '$') {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currency} 0`;
  return `${currency} ${Number(amount).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formatea un número decimal (ej. kg de peso o GDP o litros)
 */
export function formatNumber(num, decimals = 1) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatea una fecha a estándar Día/Mes/Año (DD/MM/YYYY)
 * Acepta string ISO (YYYY-MM-DD), Date object, timestamps o strings ya formateadas.
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === 'N/A' || trimmed === 'Todas las fechas') return trimmed || '-';
    // Si ya está en formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    // Si viene en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss...
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('T')[0].split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Parsea una fecha a objeto Date puro a medianoche local sin sesgo de zona horaria UTC
 */
export function parseDateOnly(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === 'N/A' || trimmed === 'Todas las fechas' || trimmed === '-') return null;
    // Formato YYYY-MM-DD o ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [y, m, d] = trimmed.split('T')[0].split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
      const parts = trimmed.split('/').map(Number);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return new Date(y, m - 1, d);
      }
    }
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Calcula la diferencia exacta en días entre dos fechas (YYYY-MM-DD, DD/MM/YYYY o Date)
 */
export function getDaysDifference(date1, date2 = new Date()) {
  if (!date1) return 0;
  const d1 = parseDateOnly(date1);
  const d2 = parseDateOnly(date2);
  if (!d1 || !d2) return 0;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula el historial continuo de pesajes acumulados desde el Pesaje Inicial / Entrada (Pesaje 1)
 */
export function calculateContinuousWeighings(animal, weighings = []) {
  const entryWeight = parseFloat(animal.entryWeight) || 0;
  const entryDate = animal.entryDate || new Date().toISOString().split('T')[0];

  // Ordenar pesajes cronológicamente
  const sorted = [...weighings].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Caso A: Tiene peso de entrada registrado
  if (entryWeight > 0) {
    const nonEntryWeighings = sorted.filter(w => {
      // Ignorar cualquier pesaje con fecha igual o anterior a la fecha de ingreso
      if (w.date <= entryDate) return false;
      // Si es un pesaje inicial automático generado con el mismo peso de entrada
      if ((w.notes === 'Peso inicial de registro' || w.notes === 'Peso inicial de registro por lote' || w.notes === 'Peso inicial de ingreso' || (w.notes && w.notes.toLowerCase().includes('inicial'))) && parseFloat(w.weight) === entryWeight) {
        return false;
      }
      return true;
    });

    const logs = [
      {
        id: 'entry',
        index: 1,
        name: 'Pesaje 1 (Entrada)',
        date: entryDate,
        weight: entryWeight,
        daysFromEntry: 0,
        totalGain: 0,
        gdp: 0,
        notes: 'Pesaje inicial de ingreso a la finca'
      }
    ];

    nonEntryWeighings.forEach((w, idx) => {
      const daysFromEntry = getDaysDifference(entryDate, w.date);
      const totalGain = parseFloat(w.weight) - entryWeight;
      const gdp = daysFromEntry > 0 ? totalGain / daysFromEntry : 0;

      const prevLog = logs[logs.length - 1];
      const gainFromPrev = parseFloat(w.weight) - parseFloat(prevLog.weight);
      const daysFromPrev = getDaysDifference(prevLog.date, w.date);

      logs.push({
        id: w.id || `w_${idx}`,
        weighingId: w.id,
        isEntry: false,
        index: idx + 2,
        name: `Pesaje ${idx + 2}`,
        date: w.date,
        weight: parseFloat(w.weight),
        daysFromEntry,
        totalGain: Number(totalGain.toFixed(1)),
        gdp: Number(gdp.toFixed(3)),
        gainFromPrev: Number(gainFromPrev.toFixed(1)),
        daysFromPrev,
        notes: w.notes || ''
      });
    });

    if (animal.status === 'Vendido' && animal.exitWeight) {
      const exitDate = animal.exitDate || new Date().toISOString().split('T')[0];
      if (!logs.some(l => l.date === exitDate)) {
        const daysFromEntry = getDaysDifference(entryDate, exitDate);
        const totalGain = parseFloat(animal.exitWeight) - entryWeight;
        const gdp = daysFromEntry > 0 ? totalGain / daysFromEntry : 0;

        logs.push({
          id: 'exit',
          isEntry: false,
          isExit: true,
          index: logs.length + 1,
          name: `Pesaje Final (Salida)`,
          date: exitDate,
          weight: parseFloat(animal.exitWeight),
          daysFromEntry,
          totalGain: Number(totalGain.toFixed(1)),
          gdp: Number(gdp.toFixed(3)),
          notes: `Liquidación de venta a ${animal.buyer || 'Comprador'}`
        });
      }
    }

    return logs;
  }

  // Caso B: Hembra de vientre/cría sin peso de entrada obligatorio
  if (sorted.length === 0) {
    return [];
  }

  const firstLog = sorted[0];
  const firstDate = firstLog.date;
  const firstWeight = parseFloat(firstLog.weight);

  const logs = [
    {
      id: firstLog.id || 'w_0',
      weighingId: firstLog.id,
      isEntry: true,
      index: 1,
      name: 'Pesaje 1 (Primer Control)',
      date: firstDate,
      weight: firstWeight,
      daysFromEntry: 0,
      totalGain: 0,
      gdp: 0,
      notes: firstLog.notes || 'Primer pesaje registrado en finca'
    }
  ];

  sorted.slice(1).forEach((w, idx) => {
    const daysFromFirst = getDaysDifference(firstDate, w.date);
    const totalGain = parseFloat(w.weight) - firstWeight;
    const gdp = daysFromFirst > 0 ? totalGain / daysFromFirst : 0;

    const prevLog = logs[logs.length - 1];
    const gainFromPrev = parseFloat(w.weight) - parseFloat(prevLog.weight);
    const daysFromPrev = getDaysDifference(prevLog.date, w.date);

    logs.push({
      id: w.id || `w_${idx + 1}`,
      weighingId: w.id,
      isEntry: false,
      index: idx + 2,
      name: `Pesaje ${idx + 2}`,
      date: w.date,
      weight: parseFloat(w.weight),
      daysFromEntry: daysFromFirst,
      totalGain: Number(totalGain.toFixed(1)),
      gdp: Number(gdp.toFixed(3)),
      gainFromPrev: Number(gainFromPrev.toFixed(1)),
      daysFromPrev,
      notes: w.notes || ''
    });
  });

  return logs;
}

/**
 * Calcula las métricas generales de peso y rendimiento continuo
 */
export function calculateWeightMetrics(animal, weighings = []) {
  const entryWeight = parseFloat(animal.entryWeight) || 0;
  const entryDate = animal.entryDate || new Date().toISOString().split('T')[0];

  // Filtrar pesajes que no sean posteriores a la fecha de entrada o sean iniciales duplicados
  const validWeighings = weighings.filter(w => {
    if (animal.entryDate && w.date <= animal.entryDate) {
      return false;
    }
    if (entryWeight > 0 && (w.notes === 'Peso inicial de registro' || w.notes === 'Peso inicial de registro por lote' || w.notes === 'Peso inicial de ingreso' || (w.notes && w.notes.toLowerCase().includes('inicial'))) && parseFloat(w.weight) === entryWeight) {
      return false;
    }
    return true;
  });

  const sortedWeights = [...validWeighings].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let currentWeight = entryWeight > 0 ? entryWeight : null;
  let lastWeighDate = animal.entryDate;

  if (sortedWeights.length > 0) {
    const lastLog = sortedWeights[sortedWeights.length - 1];
    currentWeight = parseFloat(lastLog.weight) || currentWeight;
    lastWeighDate = lastLog.date;
  } else if (animal.status === 'Vendido' && animal.exitWeight) {
    currentWeight = parseFloat(animal.exitWeight);
    lastWeighDate = animal.exitDate;
  }

  // Días totales en finca (hasta hoy o hasta fecha de salida)
  const totalDays = getDaysDifference(entryDate, animal.exitDate || new Date());

  // Días transcurridos desde el ingreso a la finca hasta la fecha del último pesaje registrado
  const daysToLastWeigh = lastWeighDate ? getDaysDifference(entryDate, lastWeighDate) : 0;

  let totalGain = 0;
  let overallGdp = 0;

  if (entryWeight > 0 && currentWeight !== null) {
    totalGain = currentWeight - entryWeight;
    // La GDP se calcula exactamente entre el peso inicial de ingreso y el último pesaje registrado, sobre los días transcurridos entre ambas fechas
    const effectiveDays = daysToLastWeigh > 0 ? daysToLastWeigh : totalDays;
    overallGdp = effectiveDays > 0 ? totalGain / effectiveDays : 0;
  } else if (sortedWeights.length >= 2) {
    const firstWeight = parseFloat(sortedWeights[0].weight) || 0;
    const daysBetween = getDaysDifference(sortedWeights[0].date, lastWeighDate);
    totalGain = (currentWeight || 0) - firstWeight;
    overallGdp = daysBetween > 0 ? totalGain / daysBetween : 0;
  }

  const continuousLogs = calculateContinuousWeighings(animal, weighings);
  const cebaProjection = calculateCebaProjection(currentWeight, overallGdp, lastWeighDate, TARGET_WEIGHT_DEFAULT);
  const performance = getGdpPerformance(overallGdp);

  return {
    entryWeight,
    hasEntryWeight: entryWeight > 0,
    currentWeight: currentWeight !== null ? Number(currentWeight.toFixed(1)) : 0,
    hasWeight: currentWeight !== null && currentWeight > 0,
    totalGain: Number(totalGain.toFixed(1)),
    totalDays,
    daysToLastWeigh,
    overallGdp: Number(overallGdp.toFixed(3)),
    lastWeighDate,
    sortedWeights,
    continuousLogs,
    cebaProjection,
    performance,
  };
}

export const TARGET_WEIGHT_DEFAULT = 480; // Meta estándar de ceba (kg)

/**
 * Evalúa el nivel de rendimiento de Ganancia Diaria de Peso (Semáforo Ganadero)
 */
export function getGdpPerformance(gdp) {
  const g = parseFloat(gdp) || 0;
  if (g >= 0.75) {
    return {
      level: 'excelente',
      label: 'Excelente (≥ 0.750 kg/d)',
      badgeVariant: 'emerald',
      colorText: 'text-emerald-700 dark:text-emerald-400',
      colorBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      icon: '🚀',
      shortLabel: 'Excelente'
    };
  }
  if (g >= 0.37) {
    return {
      level: 'bueno',
      label: 'Aceptable (0.370 - 0.750 kg/d)',
      badgeVariant: 'amber',
      colorText: 'text-amber-700 dark:text-amber-400',
      colorBg: 'bg-amber-100 dark:bg-amber-950/80',
      icon: '⚡',
      shortLabel: 'Aceptable'
    };
  }
  if (g > 0) {
    return {
      level: 'bajo',
      label: 'Bajo Rendimiento (< 0.370 kg/d)',
      badgeVariant: 'red',
      colorText: 'text-rose-700 dark:text-rose-400',
      colorBg: 'bg-rose-100 dark:bg-rose-950/80',
      icon: '⚠️',
      shortLabel: 'Bajo'
    };
  }
  return {
    level: 'estancado',
    label: 'Sin Ganancia / Pérdida (≤ 0 kg/d)',
    badgeVariant: 'gray',
    colorText: 'text-slate-600 dark:text-slate-400',
    colorBg: 'bg-slate-100 dark:bg-slate-800',
    icon: '🔻',
    shortLabel: 'Estancado'
  };
}

/**
 * Calcula la proyección de ceba hacia el peso meta objetivo (> 480 kg)
 */
export function calculateCebaProjection(currentWeight, gdp, lastWeighDate, targetWeight = TARGET_WEIGHT_DEFAULT) {
  const weight = parseFloat(currentWeight) || 0;
  const rate = parseFloat(gdp) || 0;
  const target = parseFloat(targetWeight) || TARGET_WEIGHT_DEFAULT;

  const isReady = weight >= target;
  const surplusKg = isReady ? Number((weight - target).toFixed(1)) : 0;
  const remainingKg = isReady ? 0 : Number((target - weight).toFixed(1));
  const progressPercentage = Math.min(100, Number(((weight / target) * 100).toFixed(1)));

  let daysToTarget = null;
  let estimatedDate = null;

  if (!isReady && rate > 0) {
    daysToTarget = Math.ceil(remainingKg / rate);
    const baseDate = parseDateOnly(lastWeighDate) || new Date();
    const est = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + daysToTarget);
    const y = est.getFullYear();
    const m = String(est.getMonth() + 1).padStart(2, '0');
    const d = String(est.getDate()).padStart(2, '0');
    estimatedDate = `${y}-${m}-${d}`;
  }

  let status = 'in_progress';
  let message = `Faltan ${remainingKg} kg`;

  if (isReady) {
    status = 'ready';
    message = surplusKg > 0 
      ? `🎯 ¡Listo para Venta! (Superó ${target} kg por +${surplusKg} kg)`
      : `🎯 ¡Listo para Venta! (Alcanzó exactamente ${target} kg)`;
  } else if (rate > 0) {
    status = 'in_progress';
    const formattedEstDate = formatDate(estimatedDate);
    message = `Faltan ${remainingKg} kg (~${daysToTarget} días • Salida estimada: ${formattedEstDate})`;
  } else {
    status = 'stalled';
    message = `Faltan ${remainingKg} kg (Requiere GDP positivo para estimar fecha)`;
  }

  return {
    targetWeight: target,
    isReady,
    surplusKg,
    remainingKg,
    progressPercentage,
    daysToTarget,
    estimatedDate,
    status,
    message,
    performance: getGdpPerformance(rate),
  };
}

/**
 * Calcula las métricas financieras y utilidades del animal
 */
export function calculateFinancials(animal, additionalExpenses = 0) {
  const entryPrice = parseFloat(animal.entryPrice) || 0;
  const exitPrice = parseFloat(animal.exitPrice) || 0;
  const expenses = (parseFloat(animal.additionalCosts) || 0) + additionalExpenses;
  const totalInvested = entryPrice + expenses;

  let isSold = animal.status === 'Vendido';
  let isDead = animal.status === 'Muerto';
  let netProfit = 0;
  let roi = 0;
  let pricePerKgSold = 0;
  let pricePerKgEntry = 0;

  const entryWeight = parseFloat(animal.entryWeight) || 0;
  const currentWeight = parseFloat(animal.currentWeight || animal.exitWeight || animal.entryWeight) || 0;

  if (entryWeight > 0 && entryPrice > 0) {
    pricePerKgEntry = entryPrice / entryWeight;
  }

  const estimatedMarketPricePerKg = 8500;
  let pricePerKgUsed = 0;

  if (isSold) {
    netProfit = exitPrice - totalInvested;
    roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    if (animal.exitWeight && parseFloat(animal.exitWeight) > 0) {
      pricePerKgSold = exitPrice / parseFloat(animal.exitWeight);
      pricePerKgUsed = pricePerKgSold;
    }
  } else if (isDead) {
    netProfit = -totalInvested;
    roi = -100;
    pricePerKgUsed = 0;
  } else {
    // Estimación proyectada basada en peso actual ($8,500/kg) o valor invertido en caso de vientres sin pesaje
    const estimatedCurrentValue = currentWeight > 0 ? currentWeight * estimatedMarketPricePerKg : totalInvested;
    const projectedProfit = estimatedCurrentValue - totalInvested;
    netProfit = projectedProfit;
    roi = totalInvested > 0 ? (projectedProfit / totalInvested) * 100 : 0;
    pricePerKgUsed = estimatedMarketPricePerKg;
  }

  return {
    entryPrice,
    exitPrice,
    expenses,
    totalInvested,
    netProfit: Number(netProfit.toFixed(0)),
    roi: Number(roi.toFixed(1)),
    pricePerKgEntry: Number(pricePerKgEntry.toFixed(0)),
    pricePerKgSold: Number(pricePerKgSold.toFixed(0)),
    pricePerKgUsed: Number(pricePerKgUsed.toFixed(0)),
    estimatedMarketPricePerKg,
    isSold,
    isDead,
  };
}

/**
 * Calcula datos de reproducción de hembras (preñez, fecha parto, días de gestación)
 */
export function calculateReproduction(animal) {
  const isGestating = (Array.isArray(animal.femaleStatuses) && animal.femaleStatuses.includes('Gestación')) ||
    (typeof animal.femaleStatus === 'string' && animal.femaleStatus.includes('Gestación')) ||
    animal.femaleStatus === 'Gestación' || 
    animal.reproductiveStatus === 'Preñada' || 
    animal.reproductiveStatus === 'Gestación';

  if (animal.sex !== 'Hembra' || !isGestating) {
    return {
      isPregnant: false,
      daysPregnant: 0,
      expectedCalvingDate: null,
      daysUntilCalving: null,
      statusLabel: animal.femaleStatus || animal.reproductiveStatus || 'No aplica',
    };
  }

  const today = parseDateOnly(new Date()) || new Date();
  let dueDate = null;
  let sDate = null;
  let serviceDateStr = animal.serviceDate || '';
  let expectedCalvingDateStr = animal.expectedCalvingDate || '';

  if (serviceDateStr) {
    sDate = parseDateOnly(serviceDateStr);
    if (sDate) {
      dueDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate() + BOVINE_GESTATION_DAYS);
    }
  }

  if (!dueDate && expectedCalvingDateStr) {
    dueDate = parseDateOnly(expectedCalvingDateStr);
    if (dueDate) {
      sDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() - BOVINE_GESTATION_DAYS);
      const sy = sDate.getFullYear();
      const sm = String(sDate.getMonth() + 1).padStart(2, '0');
      const sd = String(sDate.getDate()).padStart(2, '0');
      serviceDateStr = `${sy}-${sm}-${sd}`;
    }
  }

  if (!dueDate && animal.pregnancyDays && parseInt(animal.pregnancyDays) > 0) {
    const pDays = parseInt(animal.pregnancyDays);
    sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - pDays);
    dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (BOVINE_GESTATION_DAYS - pDays));
    const sy = sDate.getFullYear();
    const sm = String(sDate.getMonth() + 1).padStart(2, '0');
    const sd = String(sDate.getDate()).padStart(2, '0');
    serviceDateStr = `${sy}-${sm}-${sd}`;
  }

  if (!dueDate) {
    const daysPreg = parseInt(animal.pregnancyDays) || 0;
    return {
      isPregnant: true,
      daysPregnant: daysPreg,
      expectedCalvingDate: null,
      daysUntilCalving: null,
      statusLabel: daysPreg > 0 ? `Gestante (~${daysPreg} días de preñez)` : 'Gestante (Sin fecha de servicio registrada)',
    };
  }

  const diffDueTime = dueDate.getTime() - today.getTime();
  const daysUntilCalving = Math.ceil(diffDueTime / (1000 * 60 * 60 * 24));
  const daysPregnant = sDate 
    ? getDaysDifference(serviceDateStr, today)
    : Math.max(0, Math.min(BOVINE_GESTATION_DAYS, BOVINE_GESTATION_DAYS - daysUntilCalving));

  const y = dueDate.getFullYear();
  const m = String(dueDate.getMonth() + 1).padStart(2, '0');
  const d = String(dueDate.getDate()).padStart(2, '0');
  const dueDateFormatted = `${y}-${m}-${d}`;

  return {
    isPregnant: true,
    serviceDate: serviceDateStr,
    daysPregnant,
    expectedCalvingDate: dueDateFormatted,
    daysUntilCalving,
    statusLabel: daysUntilCalving <= 0 
      ? '¡Fecha de parto cumplida o inminente!' 
      : `Parto en aprox. ${daysUntilCalving} días (${daysPregnant} días de preñez)`,
    isNearCalving: daysUntilCalving <= 20 && daysUntilCalving >= -15,
  };
}

/**
 * Calcula métricas lecheras y de ciclo productivo
 */
export function calculateMilkMetrics(animal) {
  if (animal.sex !== 'Hembra') {
    return {
      isMilking: false,
      dailyLiters: 0,
      cycleDays: 0,
      cycleTotalLiters: 0,
      cycleAvgDaily: 0,
    };
  }

  const dailyLiters = parseFloat(animal.dailyMilkLiters) || 0;
  const cycleDays = parseInt(animal.lactationCycleDays) || 305;
  
  let cycleTotalLiters = parseFloat(animal.lactationCycleTotalLiters);
  if (!cycleTotalLiters || isNaN(cycleTotalLiters)) {
    cycleTotalLiters = dailyLiters * cycleDays;
  }

  let cycleAvgDaily = parseFloat(animal.lactationCycleAvgLiters);
  if (!cycleAvgDaily || isNaN(cycleAvgDaily)) {
    cycleAvgDaily = cycleDays > 0 ? cycleTotalLiters / cycleDays : dailyLiters;
  }

  const isMilking = (Array.isArray(animal.femaleStatuses) && animal.femaleStatuses.includes('Producción de leche')) ||
    (typeof animal.femaleStatus === 'string' && animal.femaleStatus.includes('Producción de leche')) ||
    animal.femaleStatus === 'Producción de leche' || 
    animal.milkingStatus === 'En ordeño' || 
    dailyLiters > 0;

  return {
    isMilking,
    dailyLiters: Number(dailyLiters.toFixed(1)),
    cycleDays,
    cycleTotalLiters: Number(cycleTotalLiters.toFixed(1)),
    cycleAvgDaily: Number(cycleAvgDaily.toFixed(1)),
  };
}

/**
 * Calcula los Días en Leche (DEL) de una vaca
 */
export function calculateDaysInMilk(cow, milkRecords = []) {
  if (!cow || cow.sex !== 'Hembra') return 0;
  
  // 1. Si tiene fecha de último parto registrada
  if (cow.lastCalvingDate) {
    const del = getDaysDifference(cow.lastCalvingDate, new Date());
    return Math.max(0, del);
  }

  // 2. Si tiene registros de pesaje de leche, tomar el primer registro del ciclo actual
  const cowRecords = milkRecords
    .filter(r => String(r.cattleId) === String(cow.id) && (parseFloat(r.totalLiters) > 0 || parseFloat(r.amLiters) > 0 || parseFloat(r.pmLiters) > 0))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (cowRecords.length > 0) {
    const firstDate = cowRecords[0].date;
    const del = getDaysDifference(firstDate, new Date());
    return Math.max(0, del);
  }

  // 3. Fallback a días de lactancia configurados o 60 días por defecto
  return parseInt(cow.lactationDays, 10) || 60;
}

/**
 * Calcula la curva de lactancia, picos y proyección a 305 días
 */
export function calculateLactationCurve(cow, milkRecords = []) {
  const cowRecords = milkRecords
    .filter(r => String(r.cattleId) === String(cow.id))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let peakLiters = 0;
  let peakDate = null;
  let peakDEL = 0;
  let totalRecordedLiters = 0;

  const dataPoints = cowRecords.map((r, idx) => {
    const total = parseFloat(r.totalLiters) || ((parseFloat(r.amLiters) || 0) + (parseFloat(r.pmLiters) || 0));
    if (total > peakLiters) {
      peakLiters = total;
      peakDate = r.date;
      peakDEL = r.daysInMilk || (idx * 15 + 10);
    }
    totalRecordedLiters += total;
    return {
      date: formatDate(r.date),
      rawDate: r.date,
      am: parseFloat(r.amLiters) || 0,
      pm: parseFloat(r.pmLiters) || 0,
      total: Number(total.toFixed(1)),
      del: r.daysInMilk || (idx * 15 + 10),
    };
  });

  const currentDEL = calculateDaysInMilk(cow, milkRecords);
  const avgDaily = dataPoints.length > 0 ? totalRecordedLiters / dataPoints.length : (parseFloat(cow.dailyMilkLiters) || 0);

  // Proyección técnica a 305 días (Standard 305-day lactation)
  const projected305 = Number((avgDaily * 305).toFixed(0));

  // Cálculo de Secado Ideal (60 días antes del parto previsto o a los 220 días de gestación)
  const pregnancyDays = parseInt(cow.pregnancyDays, 10) || 0;
  const daysToDryOff = Math.max(0, 220 - pregnancyDays);
  const isDryOffDue = pregnancyDays >= 220;

  return {
    dataPoints,
    currentDEL,
    peakLiters: Number(peakLiters.toFixed(1)),
    peakDate: peakDate ? formatDate(peakDate) : '-',
    peakDEL,
    avgDaily: Number(avgDaily.toFixed(1)),
    totalRecordedLiters: Number(totalRecordedLiters.toFixed(1)),
    projected305,
    pregnancyDays,
    daysToDryOff,
    isDryOffDue,
    recordsCount: dataPoints.length,
  };
}

/**
 * Calcula las métricas globales del hato lechero en una fecha o acumulado del mes
 */
export function calculateHerdMilkMetrics(cattle = [], milkRecords = [], milkDeliveries = [], targetDate = null) {
  const todayStr = targetDate || new Date().toISOString().split('T')[0];

  const females = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  
  // Vacas en ordeño activas
  const milkingCows = females.filter(c => 
    c.milkingStatus === 'En ordeño' || 
    (Array.isArray(c.femaleStatuses) && c.femaleStatuses.includes('Producción de leche')) ||
    c.femaleStatus === 'Producción de leche' ||
    (parseFloat(c.dailyMilkLiters) > 0)
  );

  // Vacas secas
  const dryCows = females.filter(c => 
    c.milkingStatus === 'Seca' || 
    (c.category === 'Vaca' && !milkingCows.some(m => m.id === c.id))
  );

  // Registros de la fecha seleccionada
  const todayRecords = milkRecords.filter(r => r.date === todayStr);

  let todayAmLiters = 0;
  let todayPmLiters = 0;
  let todayTotalLiters = 0;

  if (todayRecords.length > 0) {
    todayRecords.forEach(r => {
      const am = parseFloat(r.amLiters) || 0;
      const pm = parseFloat(r.pmLiters) || 0;
      const total = parseFloat(r.totalLiters) || (am + pm);
      todayAmLiters += am;
      todayPmLiters += pm;
      todayTotalLiters += total;
    });
  } else {
    // Si no hay pesaje específico para hoy, estimar con los litros diarios configurados
    milkingCows.forEach(c => {
      const daily = parseFloat(c.dailyMilkLiters) || 0;
      todayAmLiters += daily * 0.6;
      todayPmLiters += daily * 0.4;
      todayTotalLiters += daily;
    });
  }

  const activeMilkingCount = todayRecords.length > 0 ? todayRecords.length : milkingCows.length;
  const avgPerMilkingCow = activeMilkingCount > 0 ? (todayTotalLiters / activeMilkingCount) : 0;
  const avgPerTotalCow = females.length > 0 ? (todayTotalLiters / females.length) : 0;
  const milkingPercentage = females.length > 0 ? ((milkingCows.length / females.length) * 100) : 0;

  // Entregas y despachos del mes actual
  const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM
  const monthDeliveries = milkDeliveries.filter(d => d.date && d.date.startsWith(currentMonthPrefix));
  
  const monthDeliveredLiters = monthDeliveries.reduce((sum, d) => sum + (parseFloat(d.totalLiters) || 0), 0);
  const monthTotalRevenue = monthDeliveries.reduce((sum, d) => sum + (parseFloat(d.totalValue) || 0), 0);
  const avgPricePerLiter = monthDeliveredLiters > 0 ? (monthTotalRevenue / monthDeliveredLiters) : 0;

  // Vacas próximas a secado (Preñez >= 210 días)
  const dryOffAlerts = females.filter(c => {
    const pDays = parseInt(c.pregnancyDays, 10) || 0;
    return pDays >= 210 && c.milkingStatus !== 'Seca';
  }).map(c => {
    const pDays = parseInt(c.pregnancyDays, 10) || 0;
    const daysLeft = Math.max(0, 220 - pDays);
    return {
      cow: c,
      pregnancyDays: pDays,
      daysLeft,
      isOverdue: pDays >= 220,
    };
  });

  return {
    todayAmLiters: Number(todayAmLiters.toFixed(1)),
    todayPmLiters: Number(todayPmLiters.toFixed(1)),
    todayTotalLiters: Number(todayTotalLiters.toFixed(1)),
    milkingCowsCount: milkingCows.length,
    dryCowsCount: dryCows.length,
    totalFemalesCount: females.length,
    milkingPercentage: Number(milkingPercentage.toFixed(1)),
    avgPerMilkingCow: Number(avgPerMilkingCow.toFixed(1)),
    avgPerTotalCow: Number(avgPerTotalCow.toFixed(1)),
    monthDeliveredLiters: Number(monthDeliveredLiters.toFixed(1)),
    monthTotalRevenue: Number(monthTotalRevenue.toFixed(0)),
    avgPricePerLiter: Number(avgPricePerLiter.toFixed(0)),
    dryOffAlerts,
  };
}

/**
 * Genera rangos de fechas comunes para control de lechería (Quincenas, Mes, Semana)
 */
export function getMilkPeriodRange(periodType = null, refYear = null, refMonth = null) {
  const now = new Date();
  const year = refYear !== null ? refYear : now.getFullYear();
  const month = refMonth !== null ? refMonth : now.getMonth(); // 0-indexed
  
  // Si no se especifica, predeterminar a la quincena correspondiente según el día actual
  const effectivePeriod = periodType || (now.getDate() <= 15 ? 'first_fortnight' : 'second_fortnight');

  const yStr = String(year);
  const mStr = String(month + 1).padStart(2, '0');

  // Último día del mes
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  if (effectivePeriod === 'first_fortnight') {
    return {
      periodType: 'first_fortnight',
      label: `1ª Quincena (1 - 15 de ${getMonthName(month)})`,
      shortLabel: `1ª Quincena • ${getMonthName(month).slice(0, 3)} ${year}`,
      startDate: `${yStr}-${mStr}-01`,
      endDate: `${yStr}-${mStr}-15`,
      daysInPeriod: 15,
    };
  }

  if (effectivePeriod === 'second_fortnight') {
    return {
      periodType: 'second_fortnight',
      label: `2ª Quincena (16 - ${lastDayOfMonth} de ${getMonthName(month)})`,
      shortLabel: `2ª Quincena • ${getMonthName(month).slice(0, 3)} ${year}`,
      startDate: `${yStr}-${mStr}-16`,
      endDate: `${yStr}-${mStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
      daysInPeriod: lastDayOfMonth - 15,
    };
  }

  if (effectivePeriod === 'full_month') {
    return {
      periodType: 'full_month',
      label: `Mes Completo (${getMonthName(month)} ${year})`,
      shortLabel: `${getMonthName(month)} ${year}`,
      startDate: `${yStr}-${mStr}-01`,
      endDate: `${yStr}-${mStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
      daysInPeriod: lastDayOfMonth,
    };
  }

  if (effectivePeriod === 'current_week') {
    const curr = new Date(now);
    const first = curr.getDate() - (curr.getDay() === 0 ? 6 : curr.getDay() - 1); // Lunes
    const last = first + 6; // Domingo

    const firstDate = new Date(curr.setDate(first));
    const lastDate = new Date(curr.setDate(last));

    const sY = firstDate.getFullYear();
    const sM = String(firstDate.getMonth() + 1).padStart(2, '0');
    const sD = String(firstDate.getDate()).padStart(2, '0');

    const eY = lastDate.getFullYear();
    const eM = String(lastDate.getMonth() + 1).padStart(2, '0');
    const eD = String(lastDate.getDate()).padStart(2, '0');

    return {
      periodType: 'current_week',
      label: `Esta Semana (${sD}/${sM} - ${eD}/${eM})`,
      shortLabel: `Semana ${sD}/${sM} - ${eD}/${eM}`,
      startDate: `${sY}-${sM}-${sD}`,
      endDate: `${eY}-${eM}-${eD}`,
      daysInPeriod: 7,
    };
  }

  return {
    periodType: 'custom',
    label: `Rango Personalizado`,
    shortLabel: `Personalizado`,
    startDate: `${yStr}-${mStr}-01`,
    endDate: `${yStr}-${mStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
    daysInPeriod: lastDayOfMonth,
  };
}

function getMonthName(monthIndex) {
  const names = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return names[monthIndex] || 'Mes';
}

/**
 * Calcula el resumen zootécnico y económico de un período de lechería (Quincenal / Mensual / Semanal)
 */
export function calculatePeriodMilkSummary(
  dailyMilkLogs = [], 
  milkRecords = [], 
  startDate, 
  endDate, 
  pricePerLiter = 0
) {
  if (!startDate || !endDate) {
    return {
      totalLiters: 0,
      totalAmLiters: 0,
      totalPmLiters: 0,
      totalSalesLiters: 0,
      totalCalvesLiters: 0,
      totalFarmLiters: 0,
      totalRejectedLiters: 0,
      daysLogged: 0,
      avgDailyLiters: 0,
      avgCowsMilked: 0,
      avgLitersPerCow: 0,
      estimatedRevenue: 0,
      unsettledLiters: 0,
      settledLiters: 0,
      dailyBreakdown: [],
    };
  }

  // Filtrar registros del rango
  const logsInRange = dailyMilkLogs.filter(l => l.date >= startDate && l.date <= endDate);
  const recordsInRange = milkRecords.filter(r => r.date >= startDate && r.date <= endDate);

  // Mapa por fecha
  const dateMap = new Map();

  // 1. Agregar registros de Producción General Diaria
  logsInRange.forEach(l => {
    dateMap.set(l.date, {
      id: l.id,
      date: l.date,
      amLiters: parseFloat(l.amLiters) || 0,
      pmLiters: parseFloat(l.pmLiters) || 0,
      totalLiters: parseFloat(l.totalLiters) || 0,
      cowsMilked: parseInt(l.cowsMilked) || 0,
      salesLiters: l.salesLiters !== undefined ? parseFloat(l.salesLiters) : (parseFloat(l.totalLiters) || 0),
      calvesLiters: parseFloat(l.calvesLiters) || 0,
      farmLiters: parseFloat(l.farmLiters) || 0,
      rejectedLiters: parseFloat(l.rejectedLiters) || 0,
      pricePerLiter: parseFloat(l.pricePerLiter) || pricePerLiter,
      isSettled: !!l.isSettled,
      settlementId: l.settlementId || null,
      notes: l.notes || '',
      source: 'daily_log',
    });
  });

  // 2. Si hay pesajes individuales de vacas en días donde no hubo registro general, agregarlos como respaldo
  recordsInRange.forEach(r => {
    if (!dateMap.has(r.date)) {
      const existing = dateMap.get(r.date) || {
        id: 'auto_' + r.date,
        date: r.date,
        amLiters: 0,
        pmLiters: 0,
        totalLiters: 0,
        cowsMilked: 0,
        salesLiters: 0,
        calvesLiters: 0,
        farmLiters: 0,
        rejectedLiters: 0,
        pricePerLiter: pricePerLiter,
        isSettled: false,
        settlementId: null,
        notes: '',
        source: 'individual_records',
      };

      const am = parseFloat(r.amLiters) || 0;
      const pm = parseFloat(r.pmLiters) || 0;
      const tot = parseFloat(r.totalLiters) || (am + pm);

      existing.amLiters += am;
      existing.pmLiters += pm;
      existing.totalLiters += tot;
      existing.salesLiters += tot;
      existing.cowsMilked += 1;
      dateMap.set(r.date, existing);
    }
  });

  // Ordenar días cronológicamente
  const dailyBreakdown = Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

  let totalLiters = 0;
  let totalAmLiters = 0;
  let totalPmLiters = 0;
  let totalSalesLiters = 0;
  let totalCalvesLiters = 0;
  let totalFarmLiters = 0;
  let totalRejectedLiters = 0;
  let totalCowsSum = 0;
  let unsettledLiters = 0;
  let settledLiters = 0;

  dailyBreakdown.forEach(day => {
    totalLiters += day.totalLiters;
    totalAmLiters += day.amLiters;
    totalPmLiters += day.pmLiters;
    totalSalesLiters += day.salesLiters;
    totalCalvesLiters += day.calvesLiters;
    totalFarmLiters += day.farmLiters;
    totalRejectedLiters += day.rejectedLiters;
    totalCowsSum += day.cowsMilked;

    if (day.isSettled) {
      settledLiters += day.salesLiters;
    } else {
      unsettledLiters += day.salesLiters;
    }
  });

  const daysLogged = dailyBreakdown.length;
  const avgDailyLiters = daysLogged > 0 ? totalLiters / daysLogged : 0;
  const avgCowsMilked = daysLogged > 0 ? totalCowsSum / daysLogged : 0;
  const avgLitersPerCow = avgCowsMilked > 0 ? avgDailyLiters / avgCowsMilked : 0;

  const effectivePrice = pricePerLiter > 0 ? pricePerLiter : 0;
  const estimatedRevenue = totalSalesLiters * effectivePrice;

  return {
    totalLiters: Number(totalLiters.toFixed(1)),
    totalAmLiters: Number(totalAmLiters.toFixed(1)),
    totalPmLiters: Number(totalPmLiters.toFixed(1)),
    totalSalesLiters: Number(totalSalesLiters.toFixed(1)),
    totalCalvesLiters: Number(totalCalvesLiters.toFixed(1)),
    totalFarmLiters: Number(totalFarmLiters.toFixed(1)),
    totalRejectedLiters: Number(totalRejectedLiters.toFixed(1)),
    daysLogged,
    avgDailyLiters: Number(avgDailyLiters.toFixed(1)),
    avgCowsMilked: Number(avgCowsMilked.toFixed(1)),
    avgLitersPerCow: Number(avgLitersPerCow.toFixed(1)),
    estimatedRevenue: Number(estimatedRevenue.toFixed(0)),
    unsettledLiters: Number(unsettledLiters.toFixed(1)),
    settledLiters: Number(settledLiters.toFixed(1)),
    dailyBreakdown,
  };
}


