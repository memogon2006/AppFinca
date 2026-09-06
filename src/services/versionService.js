export const CURRENT_APP_VERSION = "2.8.26";
export const CURRENT_BUILD_TIME = 1789105000000;

/**
 * Historial de las últimas actualizaciones generadas en el sistema
 */
export const APP_CHANGELOG = [
  {
    version: "2.8.26",
    date: "06/09/2026",
    title: "Ajuste de Métricas de Gastos y Simplificación",
    highlights: [
      "Retirada la métrica de costo por kilo en la vista de gastos para mayor claridad y simpleza visual.",
      "Optimización de panel financiero con Total Acumulado, Promedio Mensual y Gastos Fijos Recurrentes."
    ]
  },
  {
    version: "2.8.25",
    date: "06/09/2026",
    title: "Gastos Mensuales y Opción de Repetición Recurrente",
    highlights: [
      "Visualizador de gastos mes a mes con comparativa de montos, porcentajes y promedios mensuales.",
      "Opción de 'Repetir mensualmente' para programar gastos fijos (jornales, sal, arriendos) con auto-generación.",
      "Filtros rápidos por mes específico, selector de período y columna de tipo/frecuencia en Excel."
    ]
  },
  {
    version: "2.8.24",
    date: "06/09/2026",
    title: "Módulo Opcional de Gastos Operativos de Finca",
    highlights: [
      "Control 100% opcional de gastos (sales/minerales, medicamentos, jornales, fletes, mantenimiento e insumos).",
      "Pestaña dedicada en Finanzas con KPIs de gastos totales, desglose por categorías y control presupuestal.",
      "Exportación automática de hoja 'Gastos de Finca' en Excel y sincronización segura con la nube."
    ]
  },
  {
    version: "2.8.23",
    date: "06/09/2026",
    title: "Historial de Actualizaciones en Perfil",
    highlights: [
      "Visualizador de las últimas 5 actualizaciones generadas con sus mejoras y cambios.",
      "Identificación automática de la versión instalada y estado de conexión en la nube."
    ]
  },
  {
    version: "2.8.22",
    date: "06/09/2026",
    title: "Desglose de Cabezas Activas y Vendidas en Totales",
    highlights: [
      "Fila final de totales en Excel desglosa cuántas cabezas siguen en finca y cuántas fueron vendidas.",
      "Pie de tabla (tfoot) en el inventario con resumen numérico de biomasa, activos y vendidos.",
      "Insignias superiores destacadas con contadores en tiempo real."
    ]
  }
];

/**
 * Consulta en la nube si hay una nueva versión publicada
 */
export async function checkAppUpdate() {
  try {
    const response = await fetch(`/version.json?_nocache=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    if (!response.ok) return { hasUpdate: false };

    const remote = await response.json();
    const hasNewVersion = remote.version !== CURRENT_APP_VERSION || (remote.buildTime && remote.buildTime > CURRENT_BUILD_TIME);

    return {
      hasUpdate: hasNewVersion,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: remote.version || CURRENT_APP_VERSION,
      description: remote.description || 'Mejoras de rendimiento y nuevas funciones ganaderas.',
    };
  } catch (err) {
    console.warn('Error verificando actualizaciones:', err);
    return { hasUpdate: false };
  }
}

/**
 * Aplica la actualización limpiando cachés del navegador y recargando la aplicación
 */
export async function applyAppUpdate() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
    }
  } catch (e) {
    console.warn('Error limpiando caché:', e);
  } finally {
    window.location.reload(true);
  }
}
