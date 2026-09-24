/**
 * Servicio de Auto-Guardado y Persistencia de Borradores de Formularios y Estado de UI
 * Permite que al actualizar la app o recargar la página, el usuario continúe exactamente
 * donde iba sin perder animales, pesos, precios ni datos digitados.
 */

const DRAFT_PREFIX = 'ganado_draft_';
const UI_STATE_KEY = 'ganado_active_ui_state';
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días de vigencia
const MAX_UI_STATE_AGE_MS = 2 * 60 * 60 * 1000; // 2 horas para reabrir modal tras recargar

/**
 * Guarda un borrador en localStorage con metadata
 */
export function saveDraft(key, data) {
  if (typeof window === 'undefined' || !key) return;
  try {
    const fullKey = key.startsWith(DRAFT_PREFIX) ? key : `${DRAFT_PREFIX}${key}`;
    const payload = {
      data,
      timestamp: Date.now(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(fullKey, JSON.stringify(payload));
  } catch (err) {
    console.warn(`Error guardando borrador ${key}:`, err);
  }
}

/**
 * Carga un borrador de localStorage verificando vigencia
 */
export function loadDraft(key) {
  if (typeof window === 'undefined' || !key) return null;
  try {
    const fullKey = key.startsWith(DRAFT_PREFIX) ? key : `${DRAFT_PREFIX}${key}`;
    const raw = localStorage.getItem(fullKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;

    // Verificar si el borrador expiró
    if (parsed.timestamp && (Date.now() - parsed.timestamp > MAX_DRAFT_AGE_MS)) {
      localStorage.removeItem(fullKey);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.warn(`Error cargando borrador ${key}:`, err);
    return null;
  }
}

/**
 * Elimina un borrador específico
 */
export function clearDraft(key) {
  if (typeof window === 'undefined' || !key) return;
  try {
    const fullKey = key.startsWith(DRAFT_PREFIX) ? key : `${DRAFT_PREFIX}${key}`;
    localStorage.removeItem(fullKey);
  } catch (err) {
    console.warn(`Error eliminando borrador ${key}:`, err);
  }
}

/**
 * Guarda el estado activo de la interfaz (vista actual y modales abiertos)
 */
export function saveActiveUIState(uiState) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      ...uiState,
      timestamp: Date.now(),
    };
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Error guardando estado activo de UI:', err);
  }
}

/**
 * Carga el estado activo de la interfaz tras una recarga / actualización
 */
export function loadActiveUIState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed) return null;

    // Solo restaurar estado de modal si ocurrió hace menos de 2 horas (evitar reabrir modales al día siguiente)
    if (parsed.timestamp && (Date.now() - parsed.timestamp > MAX_UI_STATE_AGE_MS)) {
      localStorage.removeItem(UI_STATE_KEY);
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('Error cargando estado activo de UI:', err);
    return null;
  }
}

/**
 * Limpia el estado de modal activo (por ejemplo al guardar exitosamente o cancelar)
 */
export function clearActiveUIModal() {
  if (typeof window === 'undefined') return;
  try {
    const current = loadActiveUIState() || {};
    saveActiveUIState({
      ...current,
      activeModal: null,
      modalPayload: null,
    });
  } catch (err) {
    console.warn('Error limpiando modal activo de UI:', err);
  }
}
