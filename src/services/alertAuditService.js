import { logActivity } from './db';

const STORAGE_PREFIX = 'ganado_alerts_state_';

/**
 * Obtener el estado de alertas y trazabilidad auditada para un usuario/finca
 */
export function getAlertsData(userId) {
  const safeId = String(userId || 'default');
  const key = `${STORAGE_PREFIX}${safeId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { resolutions: {}, auditLog: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      resolutions: parsed.resolutions && typeof parsed.resolutions === 'object' ? parsed.resolutions : {},
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : []
    };
  } catch (err) {
    console.warn('Error leyendo estado de alertas:', err);
    return { resolutions: {}, auditLog: [] };
  }
}

/**
 * Guardar estado de alertas en localStorage y emitir evento reactivo
 */
export function saveAlertsData(userId, data) {
  const safeId = String(userId || 'default');
  const key = `${STORAGE_PREFIX}${safeId}`;
  try {
    const payload = {
      resolutions: data.resolutions || {},
      auditLog: data.auditLog || [],
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ganado_alerts_updated', {
        detail: { userId: safeId }
      }));
    }
  } catch (err) {
    console.error('Error guardando estado de alertas:', err);
  }
}

/**
 * Marcar una alerta como "Chuleada / Atendida" (✓)
 */
export async function markAlertAttended({
  alert,
  notes = '',
  operatorName = 'Administrador',
  operatorRole = 'admin',
  userId = 'default'
}) {
  if (!alert || !alert.id) return null;

  const currentData = getAlertsData(userId);
  const tagNumber = alert.animal?.tagNumber || alert.tagNumber || '';
  const now = new Date().toISOString();

  const resolution = {
    id: alert.id,
    status: 'attended',
    title: alert.title || 'Alerta atendida',
    desc: alert.desc || '',
    badge: alert.badge || '',
    type: alert.type || 'info',
    tagNumber: String(tagNumber),
    animalId: alert.animal?.id || null,
    operatorName: String(operatorName || 'Administrador'),
    operatorRole: String(operatorRole || 'admin'),
    notes: String(notes || 'Alerta chuleada y atendida en finca'),
    resolvedAt: now,
  };

  const auditEntry = {
    id: `al_aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    alertId: alert.id,
    action: 'attended',
    actionLabel: 'Chuleada / Atendida',
    title: alert.title || 'Alerta',
    desc: alert.desc || '',
    tagNumber: String(tagNumber),
    operatorName: String(operatorName || 'Administrador'),
    operatorRole: String(operatorRole || 'admin'),
    notes: String(notes || 'Marcada como atendida'),
    timestamp: now,
    userId: String(userId || 'default'),
  };

  const newResolutions = {
    ...currentData.resolutions,
    [alert.id]: resolution
  };

  const newAuditLog = [auditEntry, ...currentData.auditLog].slice(0, 500); // Guardar hasta 500 eventos de auditoría

  const updatedData = {
    resolutions: newResolutions,
    auditLog: newAuditLog
  };

  saveAlertsData(userId, updatedData);

  // Registrar también en bitácora general de la finca (Dexie)
  try {
    await logActivity({
      action: 'Alerta Atendida (✓)',
      description: `${alert.title}. ${notes ? `Detalle: "${notes}"` : 'Marcada como resuelta en campo.'}`,
      tagNumber: String(tagNumber),
      operatorName: String(operatorName || 'Administrador'),
      operatorRole: String(operatorRole || 'admin'),
      userId: String(userId || 'default')
    });
  } catch (e) {
    console.warn('Error en logActivity para alerta atendida:', e);
  }

  return updatedData;
}

/**
 * Cancelar / Descartar una alerta (✕)
 */
export async function markAlertDismissed({
  alert,
  reason = '',
  operatorName = 'Administrador',
  operatorRole = 'admin',
  userId = 'default'
}) {
  if (!alert || !alert.id) return null;

  const currentData = getAlertsData(userId);
  const tagNumber = alert.animal?.tagNumber || alert.tagNumber || '';
  const now = new Date().toISOString();

  const resolution = {
    id: alert.id,
    status: 'dismissed',
    title: alert.title || 'Alerta cancelada',
    desc: alert.desc || '',
    badge: alert.badge || '',
    type: alert.type || 'info',
    tagNumber: String(tagNumber),
    animalId: alert.animal?.id || null,
    operatorName: String(operatorName || 'Administrador'),
    operatorRole: String(operatorRole || 'admin'),
    notes: String(reason || 'Cancelada / Descartada por el usuario'),
    resolvedAt: now,
  };

  const auditEntry = {
    id: `al_aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    alertId: alert.id,
    action: 'dismissed',
    actionLabel: 'Cancelada / Descartada',
    title: alert.title || 'Alerta',
    desc: alert.desc || '',
    tagNumber: String(tagNumber),
    operatorName: String(operatorName || 'Administrador'),
    operatorRole: String(operatorRole || 'admin'),
    notes: String(reason || 'Cancelada por el operario'),
    timestamp: now,
    userId: String(userId || 'default'),
  };

  const newResolutions = {
    ...currentData.resolutions,
    [alert.id]: resolution
  };

  const newAuditLog = [auditEntry, ...currentData.auditLog].slice(0, 500);

  const updatedData = {
    resolutions: newResolutions,
    auditLog: newAuditLog
  };

  saveAlertsData(userId, updatedData);

  // Registrar en Dexie
  try {
    await logActivity({
      action: 'Alerta Cancelada (✕)',
      description: `${alert.title}. Motivo: ${reason || 'Descartada por el usuario.'}`,
      tagNumber: String(tagNumber),
      operatorName: String(operatorName || 'Administrador'),
      operatorRole: String(operatorRole || 'admin'),
      userId: String(userId || 'default')
    });
  } catch (e) {
    console.warn('Error en logActivity para alerta cancelada:', e);
  }

  return updatedData;
}

/**
 * Deshacer / Reactivar una alerta para devolverla al tablero de activas
 */
export async function reopenAlert({
  alertId,
  alertTitle = '',
  tagNumber = '',
  operatorName = 'Administrador',
  operatorRole = 'admin',
  userId = 'default'
}) {
  if (!alertId) return null;

  const currentData = getAlertsData(userId);
  const now = new Date().toISOString();

  const newResolutions = { ...currentData.resolutions };
  const prevResolution = newResolutions[alertId];
  delete newResolutions[alertId];

  const titleToUse = alertTitle || prevResolution?.title || alertId;
  const tagToUse = tagNumber || prevResolution?.tagNumber || '';

  const auditEntry = {
    id: `al_aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    alertId,
    action: 'reopened',
    actionLabel: 'Reactivada / Reabierta',
    title: titleToUse,
    desc: 'Alerta reabierta y devuelta a la lista de pendientes',
    tagNumber: String(tagToUse),
    operatorName: String(operatorName || 'Administrador'),
    operatorRole: String(operatorRole || 'admin'),
    notes: 'Reactivada manualmente por el usuario',
    timestamp: now,
    userId: String(userId || 'default'),
  };

  const newAuditLog = [auditEntry, ...currentData.auditLog].slice(0, 500);

  const updatedData = {
    resolutions: newResolutions,
    auditLog: newAuditLog
  };

  saveAlertsData(userId, updatedData);

  // Registrar en Dexie
  try {
    await logActivity({
      action: 'Alerta Reactivada (↩)',
      description: `Se reactivó la alerta: ${titleToUse}`,
      tagNumber: String(tagToUse),
      operatorName: String(operatorName || 'Administrador'),
      operatorRole: String(operatorRole || 'admin'),
      userId: String(userId || 'default')
    });
  } catch (e) {
    console.warn('Error en logActivity para reactivación de alerta:', e);
  }

  return updatedData;
}
