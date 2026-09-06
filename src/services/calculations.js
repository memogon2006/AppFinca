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
 * Calcula la diferencia en días entre dos fechas (YYYY-MM-DD o Date)
 */
export function getDaysDifference(date1, date2 = new Date()) {
  if (!date1) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
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
  const entryDate = animal.entryDate ? new Date(animal.entryDate) : new Date();

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
  const totalDays = getDaysDifference(entryDate, animal.exitDate ? new Date(animal.exitDate) : new Date());

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
  const isGestating = animal.femaleStatus === 'Gestación' || animal.reproductiveStatus === 'Preñada' || animal.reproductiveStatus === 'Gestación';

  if (animal.sex !== 'Hembra' || !isGestating) {
    return {
      isPregnant: false,
      daysPregnant: 0,
      expectedCalvingDate: null,
      daysUntilCalving: null,
      statusLabel: animal.femaleStatus || animal.reproductiveStatus || 'No aplica',
    };
  }

  if (!animal.serviceDate) {
    return {
      isPregnant: true,
      daysPregnant: 0,
      expectedCalvingDate: null,
      daysUntilCalving: null,
      statusLabel: 'Gestante (Sin fecha de servicio registrada)',
    };
  }

  const sDate = new Date(animal.serviceDate);
  const today = new Date();
  
  // Gestación bovina: servicio + 283 días
  const dueDate = new Date(sDate);
  dueDate.setDate(dueDate.getDate() + BOVINE_GESTATION_DAYS);

  const daysPregnant = getDaysDifference(sDate, today);
  const diffDueTime = dueDate.getTime() - today.getTime();
  const daysUntilCalving = Math.ceil(diffDueTime / (1000 * 60 * 60 * 24));

  const dueDateFormatted = dueDate.toISOString().split('T')[0];

  return {
    isPregnant: true,
    serviceDate: animal.serviceDate,
    daysPregnant,
    expectedCalvingDate: dueDateFormatted,
    daysUntilCalving,
    statusLabel: daysUntilCalving <= 0 
      ? '¡Fecha de parto cumplida!' 
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

  const isMilking = animal.femaleStatus === 'Producción de leche' || animal.milkingStatus === 'En ordeño' || dailyLiters > 0;

  return {
    isMilking,
    dailyLiters: Number(dailyLiters.toFixed(1)),
    cycleDays,
    cycleTotalLiters: Number(cycleTotalLiters.toFixed(1)),
    cycleAvgDaily: Number(cycleAvgDaily.toFixed(1)),
  };
}
