/**
 * moduleService.js
 * Servicio de gestión y personalización de módulos activos por finca.
 * Permite que cada ganadero configure su plataforma según su orientación
 * productiva (Cebador, Lechero, Criador o Ciclo Completo).
 */

import { useState, useEffect } from 'react';

// Identificadores de módulos conmutables
export const MODULE_KEYS = {
  WEIGHTS: 'weights',             // ⚖️ Control de Pesos & Báscula Rápida (GDP)
  CEBA_BATCHES: 'ceba_batches',   // 🥩 Lotes de Ceba & Comparativas de Engorde
  REPRODUCTION: 'reproduction',   // 🤰 Reproducción, Palpaciones & Diagnóstico Gestacional
  MILK: 'milk',                   // 🥛 Lechería, Control de Ordeño & Tanque
  DAIRY: 'milk',                  // 🥛 Alias para compatibilidad
  IATF: 'iatf',                   // 🧬 Biotecnología: Receptoras IATF & Transferencia de Embriones
  PARTNERSHIPS: 'partnerships',   // 🤝 Ganado en Compañía / Inversión Compartida
};

// Catálogo descriptivo de módulos conmutables
export const MODULE_CATALOG = [
  {
    key: MODULE_KEYS.WEIGHTS,
    name: 'Control de Pesos & Báscula Rápida',
    shortName: 'Pesajes & GDP',
    icon: 'Scale',
    emoji: '⚖️',
    description: 'Historial de pesajes periódicos, Ganancia Diaria de Peso (GDP) y captura ágil en manga.',
    category: 'Engorde & Rendimiento',
    recommendedFor: ['Ceba / Engorde', 'Levante', 'Doble Propósito', 'Cría'],
  },
  {
    key: MODULE_KEYS.CEBA_BATCHES,
    name: 'Lotes de Ceba & Comparativas de Engorde',
    shortName: 'Lotes de Ceba',
    icon: 'Boxes',
    emoji: '🥩',
    description: 'Monitoreo de ingresos por lote, dispersión de pesos, días en finca y rentabilidad por kilo producido.',
    category: 'Engorde & Rendimiento',
    recommendedFor: ['Ceba / Engorde', 'Levante'],
  },
  {
    key: MODULE_KEYS.REPRODUCTION,
    name: 'Reproducción, Palpaciones & Gestación',
    shortName: 'Palpación & Reprod.',
    icon: 'Stethoscope',
    emoji: '🤰',
    description: 'Diagnóstico de preñez, conteo de 283 días, semáforo preparto y alertas de secado.',
    category: 'Reproducción & Cría',
    recommendedFor: ['Cría / Vientres', 'Lechería', 'Doble Propósito'],
  },
  {
    key: MODULE_KEYS.MILK,
    name: 'Lechería, Control Lechero & Tanque',
    shortName: 'Control Lechero',
    icon: 'Milk',
    emoji: '🥛',
    description: 'Planilla de pesajes AM/PM, ranking de vacas más productoras, tanque frío, curvas DEL y liquidaciones.',
    category: 'Producción Lechera',
    recommendedFor: ['Lechería Especializada', 'Doble Propósito'],
  },
  {
    key: MODULE_KEYS.IATF,
    name: 'Biotecnología: Receptoras & IATF',
    shortName: 'Receptoras & IATF',
    icon: 'Dna',
    emoji: '🧬',
    description: 'Protocolos hormonales IATF, transferencias de embriones (TE), vacas donantes y receptoras.',
    category: 'Reproducción & Cría',
    recommendedFor: ['Cría & Genética', 'Cabañas / Puros'],
  },
  {
    key: MODULE_KEYS.PARTNERSHIPS,
    name: 'Ganado en Compañía / Inversión Compartida',
    shortName: 'En Compañía',
    icon: 'DollarSign',
    emoji: '🤝',
    description: 'Liquidación de aumentos de peso, utilidades y acuerdos con inversionistas o socios.',
    category: 'Finanzas & Acuerdos',
    recommendedFor: ['Inversionistas', 'Medianería', 'Ceba Compartida'],
  },
];

// Presets de Orientación Productiva
export const FARM_PRESETS = {
  CEBA: {
    key: 'ceba',
    title: '🥩 Finca de Ceba / Engorde / Levante',
    shortTitle: 'Ceba / Engorde',
    description: 'Optimizado para ganancia de peso, rotación de potreros y venta por kilo. Oculta módulos de lechería y palpaciones.',
    modules: {
      [MODULE_KEYS.WEIGHTS]: true,
      [MODULE_KEYS.CEBA_BATCHES]: true,
      [MODULE_KEYS.REPRODUCTION]: false,
      [MODULE_KEYS.MILK]: false,
      [MODULE_KEYS.IATF]: false,
      [MODULE_KEYS.PARTNERSHIPS]: true,
    }
  },
  LECHERIA: {
    key: 'lecheria',
    title: '🥛 Finca Lechera / Doble Propósito',
    shortTitle: 'Lechería / Doble Propósito',
    description: 'Enfocado en producción diaria de leche, curvas de lactancia, secado, reproducción y tanque frío.',
    modules: {
      [MODULE_KEYS.WEIGHTS]: true,
      [MODULE_KEYS.CEBA_BATCHES]: false,
      [MODULE_KEYS.REPRODUCTION]: true,
      [MODULE_KEYS.MILK]: true,
      [MODULE_KEYS.IATF]: false,
      [MODULE_KEYS.PARTNERSHIPS]: false,
    }
  },
  CRIA: {
    key: 'cria',
    title: '🌱 Finca de Cría, Vientres & Genética',
    shortTitle: 'Cría & Genética',
    description: 'Control reproductivo estricto, habilidad materna, destetes, palpaciones y biotecnología IATF/TE.',
    modules: {
      [MODULE_KEYS.WEIGHTS]: true,
      [MODULE_KEYS.CEBA_BATCHES]: false,
      [MODULE_KEYS.REPRODUCTION]: true,
      [MODULE_KEYS.MILK]: false,
      [MODULE_KEYS.IATF]: true,
      [MODULE_KEYS.PARTNERSHIPS]: false,
    }
  },
  COMPLETO: {
    key: 'completo',
    title: '⚡ Finca Integral / Todos los Módulos Activos',
    shortTitle: 'Modo Completo',
    description: 'Acceso total a todas las herramientas: ceba, lechería, reproducción, biotecnología y finanzas.',
    modules: {
      [MODULE_KEYS.WEIGHTS]: true,
      [MODULE_KEYS.CEBA_BATCHES]: true,
      [MODULE_KEYS.REPRODUCTION]: true,
      [MODULE_KEYS.MILK]: true,
      [MODULE_KEYS.IATF]: true,
      [MODULE_KEYS.PARTNERSHIPS]: true,
    }
  }
};

const STORAGE_KEY = 'ganado_active_modules';
const STORAGE_TS_KEY = 'ganado_active_modules_ts';
const EVENT_NAME = 'ganado_modules_changed';

// Configuración por defecto (Todos activos para garantizar retrocompatibilidad)
export const DEFAULT_MODULES = {
  [MODULE_KEYS.WEIGHTS]: true,
  [MODULE_KEYS.CEBA_BATCHES]: true,
  [MODULE_KEYS.REPRODUCTION]: true,
  [MODULE_KEYS.MILK]: true,
  [MODULE_KEYS.IATF]: true,
  [MODULE_KEYS.PARTNERSHIPS]: true,
};

/**
 * Obtiene el ID efectivo de la finca (el ID del dueño si es trabajador, o el ID propio si es admin)
 */
export function getEffectiveFarmId(sessionUser = null) {
  try {
    const user = sessionUser || (() => {
      const raw = localStorage.getItem('ganado_current_user_session');
      return raw ? JSON.parse(raw) : null;
    })();
    if (!user) return null;
    return user.role === 'worker' ? (user.ownerId || user.id) : user.id;
  } catch (e) {
    return null;
  }
}

/**
 * Obtiene la marca de tiempo de la última modificación local de módulos
 */
export function getModulesUpdatedAt(targetFarmId = null) {
  try {
    const farmId = targetFarmId || getEffectiveFarmId();
    if (!farmId) return 0;
    const raw = localStorage.getItem(`${STORAGE_TS_KEY}_${farmId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Obtiene el mapa actual de módulos activos para la finca en sesión o para un farmId específico
 */
export function getActiveModules(targetFarmId = null) {
  try {
    const farmId = targetFarmId || getEffectiveFarmId();
    if (farmId) {
      const scopedRaw = localStorage.getItem(`${STORAGE_KEY}_${farmId}`);
      if (scopedRaw) {
        const parsedScoped = JSON.parse(scopedRaw);
        return { ...DEFAULT_MODULES, ...parsedScoped };
      }

      // Si no está en scoped storage pero hay sesión activa para este farmId
      const rawUser = localStorage.getItem('ganado_current_user_session');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const userFarmId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
        if (userFarmId === farmId) {
          if (user.activeModules && typeof user.activeModules === 'object') {
            try {
              localStorage.setItem(`${STORAGE_KEY}_${farmId}`, JSON.stringify(user.activeModules));
            } catch (e) {}
            return { ...DEFAULT_MODULES, ...user.activeModules };
          }
          if (user.farmPreset) {
            const preset = FARM_PRESETS[user.farmPreset.toUpperCase()] || FARM_PRESETS.COMPLETO;
            try {
              localStorage.setItem(`${STORAGE_KEY}_${farmId}`, JSON.stringify(preset.modules));
            } catch (e) {}
            return { ...DEFAULT_MODULES, ...preset.modules };
          }
        }
      }
    }

    // Si no hay sesión o no hay configuración específica, retornar DEFAULT_MODULES
    return { ...DEFAULT_MODULES };
  } catch (e) {
    return { ...DEFAULT_MODULES };
  }
}

/**
 * Guarda y emite la actualización de módulos activos para una finca específica
 */
export function setActiveModules(modules, customFarmId = null, syncToCloud = true) {
  try {
    const farmId = customFarmId || getEffectiveFarmId();
    const current = getActiveModules(farmId);
    const updated = { ...current, ...modules };
    const now = Date.now();
    
    // Guardar exclusivamente bajo la clave con ámbito de finca y actualizar marca de tiempo
    if (farmId) {
      localStorage.setItem(`${STORAGE_KEY}_${farmId}`, JSON.stringify(updated));
      localStorage.setItem(`${STORAGE_TS_KEY}_${farmId}`, String(now));
    }

    // Actualizar sesión en memoria si corresponde a la cuenta actual
    try {
      const rawUser = localStorage.getItem('ganado_current_user_session');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const currentSessionFarmId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
        if (currentSessionFarmId === farmId || !customFarmId) {
          user.activeModules = updated;
          user.activeModulesUpdatedAt = now;
          localStorage.setItem('ganado_current_user_session', JSON.stringify(user));
        }
      }
    } catch (uErr) {}

    // Notificar a componentes UI y servicios
    const activeFarmId = getEffectiveFarmId();
    if (!farmId || farmId === activeFarmId) {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { modules: updated, farmId, syncToCloud } }));
    }

    return updated;
  } catch (e) {
    console.error('Error guardando módulos activos:', e);
    return DEFAULT_MODULES;
  }
}

/**
 * Conmuta un módulo específico
 */
export function toggleModule(moduleKey, customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  const current = getActiveModules(farmId);
  const next = !current[moduleKey];
  return setActiveModules({ [moduleKey]: next }, farmId, true);
}

/**
 * Aplica un preset completo de finca
 */
export function applyFarmPreset(presetKey, customFarmId = null) {
  const preset = FARM_PRESETS[presetKey?.toUpperCase()] || FARM_PRESETS.COMPLETO;
  const farmId = customFarmId || getEffectiveFarmId();
  if (farmId) {
    localStorage.setItem(`${STORAGE_KEY}_${farmId}`, JSON.stringify(preset.modules));
  }
  return setActiveModules(preset.modules, farmId);
}

/**
 * Verifica si un módulo específico está activo en la finca actual
 */
export function isModuleActive(moduleKey, customFarmId = null) {
  const modules = getActiveModules(customFarmId);
  return Boolean(modules[moduleKey]);
}

/**
 * Detecta y activa automáticamente los módulos necesarios según los datos de un animal registrado o editado.
 * Si el usuario tenía configurada solo Ceba y registra una vaca lechera, activa Lechería; si registra hembra gestante o parto, activa Reproducción, etc.
 * Retorna la lista de nombres de módulos recién activados para notificación al usuario.
 */
export function autoActivateModulesForAnimal(animal) {
  if (!animal) return [];
  const farmId = animal.userId || getEffectiveFarmId();
  const current = getActiveModules(farmId);
  const toActivate = {};
  const newlyActivated = [];

  const prodType = (animal.productionType || '').toLowerCase().trim();
  const reproStatus = (animal.reproductiveStatus || '').toLowerCase().trim();
  const milkStatus = (animal.milkingStatus || '').toLowerCase().trim();
  const femaleStat = (animal.femaleStatus || '').toLowerCase().trim();
  const femaleStatuses = Array.isArray(animal.femaleStatuses) ? animal.femaleStatuses.map(s => String(s).toLowerCase()) : [];
  const entryType = (animal.entryType || '').toLowerCase().trim();
  const origin = (animal.origin || '').toLowerCase().trim();
  const owner = (animal.owner || '').toLowerCase().trim();

  // 1. Lechería (MILK)
  const isMilkRelated = 
    prodType === 'leche' || 
    prodType === 'doble propósito' || 
    prodType === 'doble proposito' ||
    milkStatus === 'en ordeño' || 
    milkStatus === 'en ordeno' || 
    milkStatus === 'seca' ||
    femaleStat.includes('leche') ||
    femaleStatuses.some(s => s.includes('leche') || s.includes('ordeño')) ||
    (parseFloat(animal.dailyMilkLiters) > 0) ||
    (parseFloat(animal.lactationCycleTotalLiters) > 0);

  if (isMilkRelated && !current[MODULE_KEYS.MILK]) {
    toActivate[MODULE_KEYS.MILK] = true;
    newlyActivated.push('🥛 Lechería & Control Lechero');
  }

  // 2. Reproducción y Palpaciones (REPRODUCTION)
  const isReproRelated = 
    prodType === 'cría' || 
    prodType === 'cria' || 
    prodType === 'doble propósito' || 
    prodType === 'doble proposito' ||
    animal.isBreedingOnly ||
    reproStatus === 'preñada' || 
    reproStatus === 'prenada' || 
    reproStatus === 'en servicio' || 
    reproStatus === 'inseminada' ||
    reproStatus === 'receptora' ||
    femaleStat.includes('gestación') ||
    femaleStat.includes('gestacion') ||
    femaleStat.includes('preñada') ||
    femaleStat.includes('cría') ||
    femaleStat.includes('cria') ||
    femaleStatuses.some(s => s.includes('gestación') || s.includes('preñada') || s.includes('cría')) ||
    entryType === 'nacimiento' || 
    origin === 'nacido en finca' ||
    Boolean(animal.motherTag) || 
    Boolean(animal.motherId) ||
    Boolean(animal.fatherTag) || 
    Boolean(animal.fatherId) ||
    Boolean(animal.serviceDate) ||
    Boolean(animal.expectedCalvingDate) ||
    (parseInt(animal.pregnancyDays, 10) > 0);

  if (isReproRelated && !current[MODULE_KEYS.REPRODUCTION]) {
    toActivate[MODULE_KEYS.REPRODUCTION] = true;
    newlyActivated.push('🤰 Reproducción & Palpaciones');
  }

  // 3. Biotecnología / Receptoras IATF (IATF)
  const isIatfRelated = 
    animal.isReceptora || 
    reproStatus === 'receptora' ||
    Boolean(animal.iatfProtocol) || 
    Boolean(animal.embryoTransferDate) ||
    Boolean(animal.donorTag) || 
    Boolean(animal.donorId);

  if (isIatfRelated) {
    if (!current[MODULE_KEYS.IATF]) {
      toActivate[MODULE_KEYS.IATF] = true;
      newlyActivated.push('🧬 Biotecnología (Receptoras & IATF)');
    }
    if (!current[MODULE_KEYS.REPRODUCTION]) {
      toActivate[MODULE_KEYS.REPRODUCTION] = true;
      if (!newlyActivated.includes('🤰 Reproducción & Palpaciones')) {
        newlyActivated.push('🤰 Reproducción & Palpaciones');
      }
    }
  }

  // 4. Ganado en Compañía (PARTNERSHIPS)
  const isCompanyRelated = 
    entryType === 'compañía' || 
    entryType === 'compania' || 
    origin === 'en compañía' || 
    origin === 'en compania' ||
    animal.isCompany || 
    Boolean(animal.partnershipPercentage) ||
    owner.includes('compañía') || 
    owner.includes('compania') || 
    owner.includes('socio') || 
    owner.includes('inversionista');

  if (isCompanyRelated && !current[MODULE_KEYS.PARTNERSHIPS]) {
    toActivate[MODULE_KEYS.PARTNERSHIPS] = true;
    newlyActivated.push('🤝 Ganado en Compañía');
  }

  // 5. Lotes de Ceba (CEBA_BATCHES)
  const isBatchCebaRelated = 
    entryType === 'lote' || 
    Boolean(animal.entryBatch) || 
    prodType === 'ceba' || 
    prodType === 'levante';

  if (isBatchCebaRelated && (entryType === 'lote' || animal.entryBatch) && !current[MODULE_KEYS.CEBA_BATCHES]) {
    toActivate[MODULE_KEYS.CEBA_BATCHES] = true;
    newlyActivated.push('🥩 Lotes de Ceba');
  }

  // 6. Control de Pesos / Báscula (WEIGHTS)
  const isWeightRelated = 
    (parseFloat(animal.entryWeight) > 0) || 
    (parseFloat(animal.currentWeight) > 0) || 
    (parseFloat(animal.weight) > 0);

  if (isWeightRelated && !current[MODULE_KEYS.WEIGHTS]) {
    toActivate[MODULE_KEYS.WEIGHTS] = true;
    newlyActivated.push('⚖️ Control de Pesos & Báscula');
  }

  // Si hubo módulos para activar, aplicarlos inmediatamente a esta finca
  if (Object.keys(toActivate).length > 0) {
    setActiveModules(toActivate, farmId);
  }

  return newlyActivated;
}

/**
 * Hook de React para reaccionar a cambios en los módulos activos en tiempo real
 */
export function useActiveModules() {
  const [modules, setModules] = useState(() => getActiveModules());

  useEffect(() => {
    const handleUpdate = (e) => {
      const updated = e.detail?.modules || e.detail || getActiveModules();
      setModules(updated);
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY || (e.key && e.key.startsWith(STORAGE_KEY))) {
        setModules(getActiveModules());
      }
    });

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
    };
  }, []);

  return {
    modules,
    isModuleActive: (key) => Boolean(modules[key]),
    toggleModule,
    setActiveModules,
    applyFarmPreset,
    autoActivateModulesForAnimal,
  };
}
