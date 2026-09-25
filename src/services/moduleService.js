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
export function getEffectiveFarmId() {
  try {
    const raw = localStorage.getItem('ganado_current_user_session');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user) return null;
    return user.role === 'worker' ? (user.ownerId || user.id) : user.id;
  } catch (e) {
    return null;
  }
}

/**
 * Obtiene el mapa actual de módulos activos para la finca en sesión
 */
export function getActiveModules() {
  try {
    const farmId = getEffectiveFarmId();
    if (farmId) {
      const scopedRaw = localStorage.getItem(`${STORAGE_KEY}_${farmId}`);
      if (scopedRaw) {
        const parsedScoped = JSON.parse(scopedRaw);
        return { ...DEFAULT_MODULES, ...parsedScoped };
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MODULES };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_MODULES, ...parsed };
  } catch (e) {
    return { ...DEFAULT_MODULES };
  }
}

/**
 * Guarda y emite la actualización de módulos activos para la finca
 */
export function setActiveModules(modules, customFarmId = null) {
  try {
    const farmId = customFarmId || getEffectiveFarmId();
    const updated = { ...getActiveModules(), ...modules };
    
    // Guardar en clave global y clave con ámbito de finca
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (farmId) {
      localStorage.setItem(`${STORAGE_KEY}_${farmId}`, JSON.stringify(updated));
    }

    // Actualizar sesión en memoria local si corresponde
    try {
      const rawUser = localStorage.getItem('ganado_current_user_session');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.role !== 'worker') {
          user.activeModules = updated;
          localStorage.setItem('ganado_current_user_session', JSON.stringify(user));
        }
      }
    } catch (uErr) {}

    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error guardando módulos activos:', e);
    return DEFAULT_MODULES;
  }
}

/**
 * Conmuta un módulo específico
 */
export function toggleModule(moduleKey) {
  const current = getActiveModules();
  const next = !current[moduleKey];
  return setActiveModules({ [moduleKey]: next });
}

/**
 * Aplica un preset completo de finca
 */
export function applyFarmPreset(presetKey) {
  const preset = FARM_PRESETS[presetKey?.toUpperCase()] || FARM_PRESETS.COMPLETO;
  return setActiveModules(preset.modules);
}

/**
 * Verifica si un módulo específico está activo en la finca actual
 */
export function isModuleActive(moduleKey) {
  const modules = getActiveModules();
  return Boolean(modules[moduleKey]);
}

/**
 * Hook de React para reaccionar a cambios en los módulos activos en tiempo real
 */
export function useActiveModules() {
  const [modules, setModules] = useState(() => getActiveModules());

  useEffect(() => {
    const handleUpdate = (e) => {
      setModules(e.detail || getActiveModules());
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
  };
}
