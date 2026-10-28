/**
 * sanitarySessionService.js
 * Servicio de memoria de jornada y configuración rápida de vacunas, dosis sanitarias y medicamentos en manga.
 */

const SANITARY_SESSION_KEY = 'ganado_manga_sanitary_session_draft';

export const SANITARY_CATEGORIES = [
  {
    id: 'metabolico',
    name: 'Metabólico / Reconstituyente',
    shortName: 'Metabólico',
    icon: '⚡',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    description: 'Modificadores orgánicos, Fósforo (Catosal), Vitaminas ADE, Reconstituyentes.',
    defaultDose: '10 ml',
    popularProducts: ['Catosal B12', 'Modificador Orgánico', 'Fosfosan', 'Complejo ADE', 'Vitamina B12']
  },
  {
    id: 'ivermectina',
    name: 'Ivermectina / Desparasitante',
    shortName: 'Ivermectina',
    icon: '🪱',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    description: 'Antiparasitario interno y externo (Ivermectina 1%, 3.15%, Albendazol, Levamisol).',
    defaultDose: '5 ml',
    popularProducts: ['Ivermectina 3.15%', 'Ivermectina 1%', 'Levamisol 15%', 'Albendazol Co', 'Dectomax']
  },
  {
    id: 'droga',
    name: 'Droga / Medicamento',
    shortName: 'Medicamento',
    icon: '💊',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    description: 'Antibióticos, antiinflamatorios, cicatrizantes para heridas, cojeras o bicheras.',
    defaultDose: '15 ml',
    popularProducts: ['Oxitetraciclina L.A.', 'Emicilina', 'Flunixin Meglumine', 'Penicilina', 'Curabicheras']
  },
  {
    id: 'vacuna',
    name: 'Vacuna Biológica',
    shortName: 'Vacuna',
    icon: '🛡️',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Biológicos preventivos (Fiebre Aftosa, Carbón Sintomático/Triple, Brucelosis, Rabia).',
    defaultDose: '2 ml',
    popularProducts: ['Carbón Sintomático (Triple)', 'Fiebre Aftosa (Aftogan)', 'Rabia Silvestre', 'Brucelosis C19/RB51', 'Neumoenteritis']
  }
];

export const DEFAULT_SANITARY_DRAFT = {
  enabled: false,
  category: 'ivermectina',
  productName: '',
  doseAmount: '',
  costMode: 'per_dose', // 'per_dose' | 'per_bottle' | 'zero'
  unitCost: '',        // Costo por dosis/animal
  bottleCost: '',      // Costo total del frasco
  bottleDoses: '20',   // Rendimiento en dosis estimadas del frasco
  notes: ''
};

/**
 * Obtiene el borrador persistente de la sesión de manga guardado en localStorage
 */
export function getSanitarySessionDraft() {
  try {
    const raw = localStorage.getItem(SANITARY_SESSION_KEY);
    if (!raw) return { ...DEFAULT_SANITARY_DRAFT };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SANITARY_DRAFT,
      ...parsed
    };
  } catch (err) {
    console.warn('Error leyendo borrador sanitario de manga:', err);
    return { ...DEFAULT_SANITARY_DRAFT };
  }
}

/**
 * Guarda el borrador de sesión para que el siguiente pesaje o animal recuerde los datos
 */
export function saveSanitarySessionDraft(draft) {
  try {
    if (!draft) return;
    localStorage.setItem(SANITARY_SESSION_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('Error guardando borrador sanitario de manga:', err);
  }
}

/**
 * Calcula el costo unitario por animal y el costo total de un lote
 */
export function calculateSanitaryCosts(draft, animalCount = 1) {
  if (!draft || !draft.enabled || draft.costMode === 'zero') {
    return { unitCost: 0, totalCost: 0, costPerAnimalFormatted: '$0' };
  }

  const count = Math.max(1, parseInt(animalCount, 10) || 1);

  if (draft.costMode === 'per_bottle') {
    const bottleCost = parseFloat(draft.bottleCost) || 0;
    const doses = Math.max(1, parseFloat(draft.bottleDoses) || count);
    const unitCost = Math.round(bottleCost / doses);
    const totalCost = unitCost * count;
    return {
      unitCost,
      totalCost,
      bottleCost,
      costPerAnimalFormatted: `$${unitCost.toLocaleString('es-CO')}`
    };
  }

  // Por dosis directa
  const unitCost = parseFloat(draft.unitCost) || 0;
  const totalCost = unitCost * count;
  return {
    unitCost,
    totalCost,
    costPerAnimalFormatted: `$${unitCost.toLocaleString('es-CO')}`
  };
}

/**
 * Genera el título o etiqueta legible del tratamiento sanitario
 */
export function formatSanitaryTreatmentTitle(draft) {
  if (!draft) return '';
  const cat = SANITARY_CATEGORIES.find(c => c.id === draft.category);
  const catName = cat ? cat.shortName : 'Tratamiento';
  const prod = (draft.productName || '').trim();
  const dose = (draft.doseAmount || '').trim();

  let text = `${cat?.icon || '💉'} ${catName}`;
  if (prod) text += `: ${prod}`;
  if (dose) text += ` (${dose})`;
  return text;
}
