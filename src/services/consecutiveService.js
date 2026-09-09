/**
 * Servicio de Control de Numeración Consecutiva de Animales por Finca
 * Finca Ganadera - 100% Offline y Multi-Tenancy
 * 
 * REGLA FUNDAMENTAL:
 * El sistema determina el número consecutivo utilizando ÚNICAMENTE la parte numérica
 * que aparece antes del primer guion o slash ('-', '/', '–', '—', '\', '_').
 * Los números o caracteres posteriores nunca modifican ni incrementan el consecutivo principal.
 */

const CONSECUTIVE_TRACEABILITY_KEY = 'bovina_consecutive_traceability_logs';

/**
 * Extrae la parte numérica principal de una identificación / arete:
 * 1. Elimina espacios al inicio y final.
 * 2. Detecta el primer separador: '-', '/', '–' (\u2013), '—' (\u2014), '‒' (\u2012), '―' (\u2015), '−' (\u2212), '\', '_'
 * 3. Toma exclusivamente todo lo que esté antes de ese separador.
 * 4. Si no hay separador, toma todo el texto limpio.
 * 5. Extrae el número entero positivo principal.
 * 
 * Ejemplos:
 * '1-6'     -> 1
 * '1-5'     -> 1
 * '1/6'     -> 1
 * '1/5'     -> 1
 * '25-6'    -> 25
 * '25 - 6'  -> 25
 * '25–6'    -> 25
 * '25—6'    -> 25
 * '25/6'    -> 25
 * '25 / 6'  -> 25
 * '25'      -> 25
 * '100-6'   -> 100
 * '125-6'   -> 125
 * 
 * @param {string|number} tagNumber - Identificación completa del animal
 * @returns {number|null} Número entero consecutivo extraído o null si no es numérico
 */
export function extractConsecutiveNumber(tagNumber) {
  if (tagNumber === null || tagNumber === undefined) return null;
  const str = String(tagNumber).trim();
  if (!str) return null;

  // 1. Detectar el primer separador y tomar únicamente la parte anterior
  // Separadores: '-', '/', '–' (\u2013), '—' (\u2014), '‒' (\u2012), '―' (\u2015), '−' (\u2212), '\', '_'
  const separatorRegex = /[\/\–\—\‒\―\−\\_\-]/;
  const parts = str.split(separatorRegex);
  const partBefore = parts[0] ? parts[0].trim() : '';

  if (!partBefore) return null;

  // 2. Extraer los dígitos del prefijo (ej. '25', ' 025 ', '100')
  const num = parseInt(partBefore, 10);
  if (isNaN(num) || num <= 0) {
    return null;
  }

  return num;
}

/**
 * Analiza todos los registros de la finca seleccionada para determinar el estado de consecutivos.
 * IMPORTANTE: Considera TODO el historial de la finca (Activos, Vendidos, Muertos, etc.)
 * para garantizar que los números utilizados históricamente no se reutilicen automáticamente.
 * 
 * @param {Array} cattleList - Lista completa de animales de la finca
 * @returns {Object} Estadísticas de numeración consecutiva
 */
export function analyzeFarmConsecutives(cattleList = []) {
  const consecutiveSet = new Set();
  const consecutiveOccurrences = new Map(); // consecutiveNumber -> Array of animals

  cattleList.forEach(animal => {
    if (!animal || !animal.tagNumber) return;
    const num = extractConsecutiveNumber(animal.tagNumber);
    if (num !== null && num > 0) {
      consecutiveSet.add(num);
      if (!consecutiveOccurrences.has(num)) {
        consecutiveOccurrences.set(num, []);
      }
      consecutiveOccurrences.get(num).push(animal);
    }
  });

  const sortedNumbers = Array.from(consecutiveSet).sort((a, b) => a - b);
  const maxConsecutive = sortedNumbers.length > 0 ? sortedNumbers[sortedNumbers.length - 1] : 0;
  const nextSuggestedConsecutive = maxConsecutive > 0 ? maxConsecutive + 1 : 1;

  // Detectar saltos / números faltantes en la secuencia histórica
  const missingConsecutives = [];
  if (sortedNumbers.length > 0) {
    const min = sortedNumbers[0] <= 5 ? 1 : sortedNumbers[0];
    for (let i = min; i < maxConsecutive; i++) {
      if (!consecutiveSet.has(i)) {
        missingConsecutives.push(i);
      }
    }
  }

  return {
    sortedNumbers,
    maxConsecutive,
    nextSuggestedConsecutive,
    missingConsecutives,
    consecutiveOccurrences,
    totalRecordsAnalyzed: cattleList.length,
    distinctConsecutivesCount: sortedNumbers.length,
  };
}

/**
 * Evalúa en tiempo real la identificación que el usuario está escribiendo frente a la secuencia de la finca.
 * 
 * @param {string} candidateTag - Arete / identificación ingresado por el usuario
 * @param {Object} farmStats - Estadísticas retornadas por analyzeFarmConsecutives
 * @returns {Object} Resultado de la evaluación con estado, mensajes y advertencias
 */
export function evaluateCandidateConsecutive(candidateTag, farmStats) {
  if (!candidateTag || !String(candidateTag).trim()) {
    return {
      isValid: true,
      isNumeric: false,
      enteredConsecutive: null,
      status: 'empty',
      message: null,
    };
  }

  const enteredConsecutive = extractConsecutiveNumber(candidateTag);
  if (enteredConsecutive === null) {
    return {
      isValid: true,
      isNumeric: false,
      enteredConsecutive: null,
      status: 'non_numeric',
      message: 'Identificación alfanumérica o personalizada (sin consecutivo numérico inicial).',
    };
  }

  const max = farmStats?.maxConsecutive || 0;
  const nextExpected = farmStats?.nextSuggestedConsecutive || 1;

  // Caso 0: Primer animal de la finca
  if (max === 0) {
    return {
      isValid: true,
      isNumeric: true,
      enteredConsecutive,
      status: 'first_animal',
      title: '✓ Primer Consecutivo',
      message: `Primer consecutivo de la finca: ${enteredConsecutive}`,
    };
  }

  // Caso 1: Consecutivo exacto esperado
  if (enteredConsecutive === nextExpected) {
    return {
      isValid: true,
      isNumeric: true,
      enteredConsecutive,
      status: 'exact_match',
      title: '✓ Consecutivo Correcto',
      message: `Consecutivo esperado: ${enteredConsecutive}`,
    };
  }

  // Caso 2: Salto hacia adelante (ej. Último 24, esperado 25, escribe 28)
  if (enteredConsecutive > nextExpected) {
    const jump = enteredConsecutive - nextExpected;
    return {
      isValid: false,
      isNumeric: true,
      enteredConsecutive,
      status: 'jump_ahead',
      warningType: 'JUMP_AHEAD',
      title: '⚠️ NUMERACIÓN NO CONSECUTIVA',
      message: `El último consecutivo registrado es ${max}. El siguiente consecutivo esperado es ${nextExpected}. Está intentando registrar el consecutivo ${enteredConsecutive} (salto de +${jump}).`,
      details: {
        lastConsecutive: max,
        expectedConsecutive: nextExpected,
        enteredConsecutive,
        jump,
      }
    };
  }

  // Caso 3: Número menor o igual al último consecutivo histórico (ej. escribe 20-6 cuando el último es 25)
  if (enteredConsecutive <= max) {
    const matchingAnimals = farmStats?.consecutiveOccurrences?.get(enteredConsecutive) || [];
    return {
      isValid: false,
      isNumeric: true,
      enteredConsecutive,
      status: 'lower_or_reused',
      warningType: 'LOWER_OR_REUSED',
      title: '⚠️ REVISAR NUMERACIÓN',
      message: `El consecutivo ingresado (${enteredConsecutive}) es menor o igual al último consecutivo registrado (${max}) en esta finca. El siguiente consecutivo sugerido es ${nextExpected}.`,
      details: {
        lastConsecutive: max,
        expectedConsecutive: nextExpected,
        enteredConsecutive,
        matchingAnimalsCount: matchingAnimals.length,
        matchingAnimals,
      }
    };
  }

  return {
    isValid: true,
    isNumeric: true,
    enteredConsecutive,
    status: 'ok',
    message: null,
  };
}

/**
 * Guarda un registro de auditoría de trazabilidad cuando el usuario decide continuar
 * pese a una advertencia de numeración consecutiva.
 * 
 * @param {Object} logData - Datos del log de auditoría
 * @returns {Object} Log creado con ID y fecha
 */
export function saveConsecutiveTraceabilityLog(logData) {
  try {
    const existing = getConsecutiveTraceabilityLogs();
    const newLog = {
      id: `c-trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      userId: logData.userId || 'local_user',
      farmName: logData.farmName || 'Hacienda Principal',
      tagNumberEntered: logData.tagNumberEntered || '',
      consecutiveExtracted: logData.consecutiveExtracted || null,
      lastConsecutive: logData.lastConsecutive || 0,
      expectedConsecutive: logData.expectedConsecutive || 1,
      warningType: logData.warningType || 'JUMP_AHEAD',
      warningTitle: logData.warningTitle || 'Numeración No Consecutiva',
      warningMessage: logData.warningMessage || '',
      actionTaken: logData.actionTaken || 'Continuó pese a advertencia',
      notes: logData.notes || '',
      status: 'Registrado',
    };

    const updated = [newLog, ...existing].slice(0, 500);
    localStorage.setItem(CONSECUTIVE_TRACEABILITY_KEY, JSON.stringify(updated));
    return newLog;
  } catch (error) {
    console.error('Error al guardar log de trazabilidad de consecutivo:', error);
    return null;
  }
}

/**
 * Obtiene todos los registros de trazabilidad de numeración consecutiva almacenados
 * @returns {Array} Lista de logs ordenados cronológicamente
 */
export function getConsecutiveTraceabilityLogs() {
  try {
    const saved = localStorage.getItem(CONSECUTIVE_TRACEABILITY_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error al leer logs de trazabilidad de consecutivo:', error);
    return [];
  }
}

/**
 * Borra un log específico de trazabilidad
 */
export function deleteConsecutiveTraceabilityLog(logId) {
  try {
    const logs = getConsecutiveTraceabilityLogs().filter(l => l.id !== logId);
    localStorage.setItem(CONSECUTIVE_TRACEABILITY_KEY, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.error('Error al eliminar log de trazabilidad de consecutivo:', error);
    return false;
  }
}
