/**
 * Cálculos matemáticos y zootécnicos ganaderos
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
 * Formatea un número decimal (ej. kg de peso o GDP)
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
 * Calcula la ganancia total de peso y GDP (Ganancia Diaria de Peso en kg/día)
 * @param {Object} animal - Datos del animal
 * @param {Array} weighings - Historial de pesajes ordenado cronológicamente
 */
export function calculateWeightMetrics(animal, weighings = []) {
  const entryWeight = parseFloat(animal.entryWeight) || 0;
  const entryDate = animal.entryDate ? new Date(animal.entryDate) : new Date();

  // Si hay pesajes registrados en la báscula, tomamos el último
  const sortedWeights = [...weighings].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let currentWeight = entryWeight;
  let lastWeighDate = animal.entryDate;
  let recentGdp = 0; // GDP del último periodo entre pesajes
  let totalDays = getDaysDifference(entryDate, animal.exitDate ? new Date(animal.exitDate) : new Date());
  
  if (sortedWeights.length > 0) {
    const lastLog = sortedWeights[sortedWeights.length - 1];
    currentWeight = parseFloat(lastLog.weight) || currentWeight;
    lastWeighDate = lastLog.date;

    // Si hay al menos 2 pesajes, calcular GDP reciente
    if (sortedWeights.length >= 2) {
      const prevLog = sortedWeights[sortedWeights.length - 2];
      const daysBetween = getDaysDifference(prevLog.date, lastLog.date);
      if (daysBetween > 0) {
        recentGdp = (parseFloat(lastLog.weight) - parseFloat(prevLog.weight)) / daysBetween;
      }
    } else {
      // Comparar con el peso de entrada
      const daysSinceEntry = getDaysDifference(entryDate, lastLog.date);
      if (daysSinceEntry > 0) {
        recentGdp = (currentWeight - entryWeight) / daysSinceEntry;
      }
    }
  } else if (animal.status === 'Vendido' && animal.exitWeight) {
    currentWeight = parseFloat(animal.exitWeight);
  }

  const totalGain = currentWeight - entryWeight;
  const overallGdp = totalDays > 0 ? totalGain / totalDays : 0;

  return {
    entryWeight,
    currentWeight: Number(currentWeight.toFixed(1)),
    totalGain: Number(totalGain.toFixed(1)),
    totalDays,
    overallGdp: Number(overallGdp.toFixed(3)), // kg/día general
    recentGdp: Number(recentGdp.toFixed(3)),   // kg/día último pesaje
    lastWeighDate,
    sortedWeights,
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
  let netProfit = 0;
  let roi = 0;
  let pricePerKgSold = 0;
  let pricePerKgEntry = 0;

  const entryWeight = parseFloat(animal.entryWeight) || 1;
  const currentWeight = parseFloat(animal.currentWeight || animal.exitWeight || animal.entryWeight) || 1;

  if (entryWeight > 0 && entryPrice > 0) {
    pricePerKgEntry = entryPrice / entryWeight;
  }

  if (isSold) {
    netProfit = exitPrice - totalInvested;
    roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    if (animal.exitWeight && parseFloat(animal.exitWeight) > 0) {
      pricePerKgSold = exitPrice / parseFloat(animal.exitWeight);
    }
  } else {
    // Estimación proyectada basada en peso actual y precio de mercado referencial ($8,500/kg)
    const estimatedMarketPricePerKg = 8500;
    const estimatedCurrentValue = currentWeight * estimatedMarketPricePerKg;
    const projectedProfit = estimatedCurrentValue - totalInvested;
    netProfit = projectedProfit;
    roi = totalInvested > 0 ? (projectedProfit / totalInvested) * 100 : 0;
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
    isSold,
  };
}

/**
 * Calcula datos de reproducción de hembras (preñez, fecha parto, días de gestación)
 */
export function calculateReproduction(animal) {
  if (animal.sex !== 'Hembra' || animal.reproductiveStatus !== 'Preñada') {
    return {
      isPregnant: false,
      daysPregnant: 0,
      expectedCalvingDate: null,
      daysUntilCalving: null,
      statusLabel: animal.reproductiveStatus || 'No aplica',
    };
  }

  if (!animal.serviceDate) {
    return {
      isPregnant: true,
      daysPregnant: 0,
      expectedCalvingDate: null,
      daysUntilCalving: null,
      statusLabel: 'Preñada (Sin fecha de servicio registrada)',
    };
  }

  const sDate = new Date(animal.serviceDate);
  const today = new Date();
  
  // Gestación: servicio + 283 días
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
