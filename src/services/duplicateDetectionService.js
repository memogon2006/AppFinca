/**
 * Servicio de Detección Inteligente de Identificaciones Duplicadas y Trazabilidad
 * Finca Ganadera - 100% Offline y Multi-Tenancy
 */

const TRACEABILITY_STORAGE_KEY = 'bovina_duplicate_traceability_logs';

/**
 * Normaliza un número de identificación / arete para comparaciones inteligentes:
 * - Convierte separadores equivalentes (/, -, –, —, \, _) a un guion estándar '-'
 * - Elimina espacios alrededor de los separadores ('1 / 6' -> '1-6')
 * - Comprime guiones consecutivos ('1--6' -> '1-6')
 * - Preserva caracteres y dígitos numéricos ('1/6' -> '1-6', '16' -> '16', '12-5' -> '12-5', '125' -> '125')
 * - Insensible a mayúsculas/minúsculas ('ep-105' -> 'EP-105')
 */
export function normalizeTagNumber(tag) {
  if (tag === null || tag === undefined) return '';
  let str = String(tag).trim();
  if (!str) return '';

  // 1. Convertir separadores equivalentes a guion '-'
  // En-dash (\u2013), Em-dash (\u2014), Horizontal bar (\u2015), Figure dash (\u2012), Minus (\u2212), Slashes (\, /), Underscore (_)
  str = str.replace(/[\/\–\—\‒\―\−\\_]/g, '-');

  // 2. Eliminar espacios alrededor de guiones (ej. '1  -  6' -> '1-6')
  str = str.replace(/\s*-\s*/g, '-');

  // 3. Comprimir guiones repetidos (ej. '1--6' -> '1-6')
  str = str.replace(/-+/g, '-');

  // 4. Colapsar espacios múltiples internos a uno solo
  str = str.replace(/\s+/g, ' ');

  // 5. Normalizar a mayúsculas y quitar espacios en extremos
  return str.toUpperCase().trim();
}

/**
 * Normaliza texto para comparación insensible a mayúsculas, tildes y espacios
 */
export function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Determina si un animal se encuentra actualmente ACTIVO en el inventario
 */
export function isAnimalActive(animal) {
  if (!animal) return false;
  const status = normalizeText(animal.status);
  
  // Si no tiene status o es 'activo' / 'en finca'
  if (status === 'activo' || status === 'en finca' || !status) {
    // Verificar que no esté vendido ni muerto
    if (animal.sold === true || animal.dead === true) return false;
    return true;
  }

  // Estados inactivos explícitos
  if (status === 'vendido' || status === 'muerto' || status === 'fallecido' || status === 'retirado' || status === 'trasladado' || status === 'baja') {
    return false;
  }

  return true;
}

/**
 * Busca animales activos duplicados según las 3 condiciones obligatorias:
 * 1. Mismo número normalizado
 * 2. Animal existente ACTIVO
 * 3. Misma marca O mismo dueño
 * 
 * @param {Object} candidateAnimal - Animal nuevo o en edición { tagNumber, ironBrand, owner, id }
 * @param {Array} cattleList - Lista de animales en el inventario actual
 * @param {string|number} excludeAnimalId - ID del animal a excluir si es edición
 * @returns {Array} Array de coincidencias con nivel de prioridad y razones
 */
export function findDuplicateCattle(candidateAnimal, cattleList = [], excludeAnimalId = null) {
  if (!candidateAnimal || !candidateAnimal.tagNumber) return [];
  const candidateTagNorm = normalizeTagNumber(candidateAnimal.tagNumber);
  if (!candidateTagNorm) return [];

  const candidateBrandNorm = normalizeText(candidateAnimal.ironBrand);
  const candidateOwnerNorm = normalizeText(candidateAnimal.owner);
  const targetExcludeId = excludeAnimalId || candidateAnimal.id;

  const matches = [];

  for (const animal of cattleList) {
    // 1. Excluir el mismo animal si es edición
    if (targetExcludeId && String(animal.id) === String(targetExcludeId)) {
      continue;
    }

    // 2. Condición 2: El animal existente debe estar ACTIVO
    if (!isAnimalActive(animal)) {
      continue;
    }

    // 3. Condición 1: El número de identificación normalizado coincide
    const existingTagNorm = normalizeTagNumber(animal.tagNumber);
    if (existingTagNorm !== candidateTagNorm) {
      continue;
    }

    // 4. Condición 3: Misma marca O mismo dueño
    const existingBrandNorm = normalizeText(animal.ironBrand);
    const existingOwnerNorm = normalizeText(animal.owner);

    const sameBrand = Boolean(
      candidateBrandNorm && existingBrandNorm && candidateBrandNorm === existingBrandNorm
    );
    const sameOwner = Boolean(
      candidateOwnerNorm && existingOwnerNorm && candidateOwnerNorm === existingOwnerNorm
    );

    // Si no coincide ni marca ni dueño, NO se genera alerta de duplicado por esta regla
    if (!sameBrand && !sameOwner) {
      continue;
    }

    // Determinar nivel de prioridad
    let priority = 'MEDIA'; // 'ALTA' | 'MEDIA'
    let matchType = '';

    if (sameBrand && sameOwner) {
      priority = 'ALTA';
      matchType = 'SAME_TAG_BRAND_OWNER';
    } else if (sameBrand) {
      priority = 'MEDIA';
      matchType = 'SAME_TAG_BRAND';
    } else if (sameOwner) {
      priority = 'MEDIA';
      matchType = 'SAME_TAG_OWNER';
    }

    matches.push({
      animal,
      priority,
      matchType,
      sameBrand,
      sameOwner,
      normalizedTag: candidateTagNorm,
      existingNormalizedTag: existingTagNorm,
    });
  }

  // Ordenar: Prioridad ALTA primero
  return matches.sort((a, b) => (a.priority === 'ALTA' ? -1 : 1));
}

/**
 * Guarda un registro de trazabilidad cuando el usuario decide continuar con el registro a pesar de la alerta
 */
export function saveTraceabilityLog(logData) {
  if (typeof window === 'undefined') return null;

  try {
    const existingLogs = getTraceabilityLogs(logData.userId);
    const newLog = {
      id: 'trace_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'POSIBLE_DUPLICADO_IDENTIFICACION',
      userId: logData.userId || 'default',
      farmName: logData.farmName || 'Mi Finca Ganadera',
      tagNumberEntered: logData.tagNumberEntered || '',
      tagNumberNormalized: normalizeTagNumber(logData.tagNumberEntered),
      ironBrand: logData.ironBrand || '',
      owner: logData.owner || '',
      matchingAnimals: (logData.matchingAnimals || []).map(m => ({
        id: m.id,
        tagNumber: m.tagNumber,
        ironBrand: m.ironBrand || '',
        owner: m.owner || '',
        status: m.status || 'Activo',
        entryBatch: m.entryBatch || m.paddock || '',
        entryDate: m.entryDate || ''
      })),
      priority: logData.priority || 'MEDIA',
      reasons: logData.reasons || [],
      actionTaken: 'USUARIO_CONTINUO_CON_REGISTRO',
      reviewStatus: 'Pendiente de revisión', // 'Pendiente de revisión' | 'Revisada' | 'Confirmada como duplicado' | 'Descartada'
      notes: logData.notes || '',
    };

    const updatedLogs = [newLog, ...existingLogs].slice(0, 100); // Guardar hasta los últimos 100 registros
    localStorage.setItem(TRACEABILITY_STORAGE_KEY, JSON.stringify(updatedLogs));
    return newLog;
  } catch (err) {
    console.warn('Error guardando registro de trazabilidad:', err);
    return null;
  }
}

/**
 * Obtiene todos los registros de trazabilidad almacenados
 */
export function getTraceabilityLogs(userId = null) {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(TRACEABILITY_STORAGE_KEY);
    if (!raw) return [];
    const logs = JSON.parse(raw);
    if (!Array.isArray(logs)) return [];

    if (userId) {
      return logs.filter(l => l.userId === userId || !l.userId);
    }
    return logs;
  } catch {
    return [];
  }
}

/**
 * Actualiza el estado de revisión de un registro de trazabilidad
 */
export function updateTraceabilityStatus(logId, reviewStatus, notes = '') {
  if (typeof window === 'undefined' || !logId) return false;

  try {
    const logs = getTraceabilityLogs();
    const updated = logs.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          reviewStatus,
          reviewedAt: new Date().toISOString(),
          notes: notes !== undefined ? notes : l.notes,
        };
      }
      return l;
    });

    localStorage.setItem(TRACEABILITY_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina un registro de trazabilidad
 */
export function deleteTraceabilityLog(logId) {
  if (typeof window === 'undefined' || !logId) return false;

  try {
    const logs = getTraceabilityLogs();
    const updated = logs.filter(l => l.id !== logId);
    localStorage.setItem(TRACEABILITY_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}
