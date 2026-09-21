import Dexie from 'dexie';
import { 
  INITIAL_CATTLE, 
  INITIAL_WEIGHINGS, 
  INITIAL_EXPENSES, 
  isDemoAnimal,
  DEMO_WEIGHING_IDS,
  DEMO_EXPENSE_IDS 
} from './sampleData';

export { isDemoAnimal };

export const db = new Dexie('GanadoProDB');

db.version(3).stores({
  users: 'id, email, username, farmName, name, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  settings: 'key, userId'
}).upgrade(tx => {
  return tx.table('cattle').toCollection().modify(cattle => {
    if (!cattle.entryBatch && cattle.paddock) {
      cattle.entryBatch = cattle.paddock;
    }
  });
});

db.version(4).stores({
  users: 'id, email, username, farmName, name, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, color, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  vaccinations: '++id, date, vaccineType, batchName, ruvNumber, officialCycle, userId',
  settings: 'key, userId'
});

db.version(5).stores({
  users: 'id, email, username, farmName, name, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, color, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  vaccinations: '++id, date, vaccineType, batchName, ruvNumber, officialCycle, userId',
  audits: '++id, date, inspectorName, scopeType, totalExpected, totalVerified, totalMissing, userId, createdAt',
  settings: 'key, userId'
});

db.version(6).stores({
  users: 'id, email, username, farmName, name, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, color, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  vaccinations: '++id, date, vaccineType, batchName, ruvNumber, officialCycle, userId',
  audits: '++id, date, inspectorName, scopeType, totalExpected, totalVerified, totalMissing, userId, createdAt',
  palpations: '++id, cattleId, tagNumber, date, diagnosis, pregnancyDays, expectedCalvingDate, veterinarian, userId, createdAt',
  settings: 'key, userId'
});

db.version(7).stores({
  users: 'id, email, username, farmName, name, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, color, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  vaccinations: '++id, date, vaccineType, batchName, ruvNumber, officialCycle, userId',
  audits: '++id, date, inspectorName, scopeType, totalExpected, totalVerified, totalMissing, userId, createdAt',
  palpations: '++id, cattleId, tagNumber, date, diagnosis, pregnancyDays, expectedCalvingDate, veterinarian, userId, createdAt',
  settings: 'key, userId'
});

db.version(8).stores({
  users: 'id, email, username, farmName, name, role, ownerId, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, color, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  vaccinations: '++id, date, vaccineType, batchName, ruvNumber, officialCycle, userId',
  audits: '++id, date, inspectorName, scopeType, totalExpected, totalVerified, totalMissing, userId, createdAt',
  palpations: '++id, cattleId, tagNumber, date, diagnosis, pregnancyDays, expectedCalvingDate, veterinarian, userId, createdAt',
  activityLogs: '++id, action, description, tagNumber, operatorName, operatorRole, timestamp, userId',
  settings: 'key, userId'
});

db.version(9).stores({
  users: 'id, email, username, farmName, name, role, ownerId, createdAt',
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock, color, userId',
  weighings: '++id, cattleId, date, weight, userId',
  expenses: '++id, cattleId, date, category, userId',
  vaccinations: '++id, date, vaccineType, batchName, ruvNumber, officialCycle, userId',
  audits: '++id, date, inspectorName, scopeType, totalExpected, totalVerified, totalMissing, userId, createdAt',
  palpations: '++id, cattleId, tagNumber, date, diagnosis, pregnancyDays, expectedCalvingDate, veterinarian, userId, createdAt',
  activityLogs: 'id, action, description, tagNumber, operatorName, operatorRole, timestamp, userId',
  settings: 'key, userId'
});

// Registrar una acción en la bitácora de auditoría
export async function logActivity({ action, description, tagNumber = '', operatorName = 'Sistema', operatorRole = 'admin', userId = 'default' }) {
  try {
    if (!db.activityLogs) return null;
    const logId = 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const entry = {
      id: logId,
      action,
      description,
      tagNumber: String(tagNumber || ''),
      operatorName: String(operatorName || 'Administrador'),
      operatorRole: String(operatorRole || 'admin'),
      timestamp: new Date().toISOString(),
      userId: String(userId || 'default'),
    };
    await db.activityLogs.put(entry);
    return entry;
  } catch (err) {
    console.warn('Error registrando actividad en bitácora:', err);
    return null;
  }
}

// Obtener registros de la bitácora de auditoría
export async function getActivityLogs(userId, limit = 100) {
  try {
    if (!db.activityLogs) return [];
    const logs = await db.activityLogs
      .filter(l => l.userId === userId || !l.userId)
      .toArray();
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  } catch (err) {
    console.warn('Error obteniendo bitácora:', err);
    return [];
  }
}

// Eliminar un registro individual de la bitácora
export async function deleteActivityLog(logId) {
  try {
    if (!db.activityLogs || !logId) return false;
    await db.activityLogs.delete(logId);
    return true;
  } catch (err) {
    console.warn('Error eliminando registro de bitácora:', err);
    return false;
  }
}

// Vaciar / Limpiar todos los registros de la bitácora del usuario activo
export async function clearActivityLogs(userId) {
  try {
    if (!db.activityLogs) return false;
    if (userId) {
      const userLogs = await db.activityLogs.filter(l => l.userId === userId || !l.userId).toArray();
      for (const log of userLogs) {
        if (log.id) await db.activityLogs.delete(log.id);
      }
    } else {
      await db.activityLogs.clear();
    }
    return true;
  } catch (err) {
    console.warn('Error limpiando bitácora:', err);
    return false;
  }
}

// Solicitar al navegador almacenamiento permanente protegido
export async function requestPersistentStorage() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    } catch (e) {
      console.warn('Almacenamiento persistente:', e);
    }
  }
}

// Inicialización de la base de datos segura
export async function initializeDatabase() {
  await requestPersistentStorage();
}

// Limpiar todos los inventarios del usuario activo
export async function clearAllData(userId) {
  if (!userId) return;
  const tables = [db.cattle, db.weighings, db.expenses];
  if (db.vaccinations) tables.push(db.vaccinations);
  if (db.audits) tables.push(db.audits);
  if (db.palpations) tables.push(db.palpations);
  if (db.activityLogs) tables.push(db.activityLogs);
  await db.transaction('rw', tables, async () => {
    await db.cattle.where('userId').equals(userId).delete();
    await db.weighings.where('userId').equals(userId).delete();
    await db.expenses.where('userId').equals(userId).delete();
    if (db.vaccinations) {
      await db.vaccinations.where('userId').equals(userId).delete();
    }
    if (db.audits) {
      await db.audits.where('userId').equals(userId).delete();
    }
    if (db.palpations) {
      await db.palpations.where('userId').equals(userId).delete();
    }
    if (db.activityLogs) {
      await db.activityLogs.where('userId').equals(userId).delete();
    }
  });
}

// Cargar datos de prueba para el usuario activo preservando sus datos reales
export async function loadSampleData(userId) {
  if (!userId) return;
  await db.transaction('rw', db.cattle, db.weighings, db.expenses, async () => {
    // 1. Eliminar datos de prueba previos si ya existían para no duplicar
    const userCattle = await db.cattle.where('userId').equals(userId).toArray();
    const existingDemoCattle = userCattle.filter(isDemoAnimal);
    const existingDemoIds = new Set(existingDemoCattle.map(c => String(c.id)));

    for (const c of existingDemoCattle) {
      if (c.id) await db.cattle.delete(c.id);
    }

    const userWeighings = await db.weighings.where('userId').equals(userId).toArray();
    const existingDemoWeighings = userWeighings.filter(w => 
      w.isDemo === true || 
      existingDemoIds.has(String(w.cattleId)) || 
      DEMO_WEIGHING_IDS.includes(String(w.id))
    );
    for (const w of existingDemoWeighings) {
      if (w.id) await db.weighings.delete(w.id);
    }

    const userExpenses = await db.expenses.where('userId').equals(userId).toArray();
    const existingDemoExpenses = userExpenses.filter(e => 
      e.isDemo === true || 
      existingDemoIds.has(String(e.cattleId)) || 
      DEMO_EXPENSE_IDS.includes(String(e.id))
    );
    for (const e of existingDemoExpenses) {
      if (e.id) await db.expenses.delete(e.id);
    }

    // 2. Insertar el lote de animales y pesajes demo adaptados
    const adaptedCattle = INITIAL_CATTLE.map(c => ({
      ...c,
      userId,
      isDemo: true,
      entryBatch: c.entryBatch || c.paddock || 'Ingreso #1'
    }));

    const adaptedWeighings = INITIAL_WEIGHINGS.map(w => ({
      ...w,
      userId,
      isDemo: true,
    }));

    const adaptedExpenses = INITIAL_EXPENSES.map(e => ({
      ...e,
      userId,
      isDemo: true,
    }));

    await db.cattle.bulkPut(adaptedCattle);
    await db.weighings.bulkPut(adaptedWeighings);
    await db.expenses.bulkPut(adaptedExpenses);
  });
}

// Eliminar ÚNICAMENTE los datos cargados de demostración
export async function deleteDemoData(userId) {
  if (!userId) return { success: false, count: 0, message: 'Usuario no identificado' };
  
  let deletedCattleCount = 0;
  let deletedWeighingsCount = 0;
  let deletedExpensesCount = 0;

  await db.transaction('rw', db.cattle, db.weighings, db.expenses, async () => {
    // 1. Encontrar todos los animales de demostración del usuario
    const userCattle = await db.cattle.where('userId').equals(userId).toArray();
    const demoCattle = userCattle.filter(isDemoAnimal);

    if (demoCattle.length === 0) {
      return;
    }

    deletedCattleCount = demoCattle.length;
    const demoCattleIds = new Set(demoCattle.map(c => String(c.id)));

    // 2. Eliminar animales demo
    for (const c of demoCattle) {
      if (c.id) await db.cattle.delete(c.id);
    }

    // 3. Eliminar pesajes de animales demo
    const userWeighings = await db.weighings.where('userId').equals(userId).toArray();
    const demoWeighings = userWeighings.filter(w => 
      w.isDemo === true || 
      demoCattleIds.has(String(w.cattleId)) || 
      DEMO_WEIGHING_IDS.includes(String(w.id))
    );
    deletedWeighingsCount = demoWeighings.length;
    for (const w of demoWeighings) {
      if (w.id) await db.weighings.delete(w.id);
    }

    // 4. Eliminar gastos de animales demo
    const userExpenses = await db.expenses.where('userId').equals(userId).toArray();
    const demoExpenses = userExpenses.filter(e => 
      e.isDemo === true || 
      demoCattleIds.has(String(e.cattleId)) || 
      DEMO_EXPENSE_IDS.includes(String(e.id))
    );
    deletedExpensesCount = demoExpenses.length;
    for (const e of demoExpenses) {
      if (e.id) await db.expenses.delete(e.id);
    }
  });

  return {
    success: true,
    count: deletedCattleCount,
    weighingsCount: deletedWeighingsCount,
    expensesCount: deletedExpensesCount,
    message: deletedCattleCount > 0
      ? `Se eliminaron exitosamente ${deletedCattleCount} animales de demostración (${deletedWeighingsCount} pesajes y ${deletedExpensesCount} gastos). Tu inventario real está intacto.`
      : 'No hay datos de demostración para eliminar en el sistema.'
  };
}

// Consultar si el usuario tiene datos de demostración activos
export async function hasDemoData(userId) {
  if (!userId) return false;
  const userCattle = await db.cattle.where('userId').equals(userId).toArray();
  return userCattle.some(isDemoAnimal);
}

// Exportar respaldo de datos del usuario activo a JSON
export async function exportBackupData(userId, userDetails = {}) {
  let cattle = [];
  let weighings = [];
  let expenses = [];
  let vaccinations = [];

  if (userId) {
    cattle = await db.cattle.where('userId').equals(userId).toArray();
    weighings = await db.weighings.where('userId').equals(userId).toArray();
    expenses = await db.expenses.where('userId').equals(userId).toArray();
    if (db.vaccinations) {
      vaccinations = await db.vaccinations.where('userId').equals(userId).toArray();
    }
  } else {
    cattle = await db.cattle.toArray();
    weighings = await db.weighings.toArray();
    expenses = await db.expenses.toArray();
    if (db.vaccinations) {
      vaccinations = await db.vaccinations.toArray();
    }
  }

  const backup = {
    version: 4,
    appName: "INVENTARIO BOVINO APP",
    exportDate: new Date().toISOString(),
    farmName: userDetails.farmName || "Mi Finca Ganadera",
    farmerName: userDetails.name || "Ganadero",
    userEmail: userDetails.email || "",
    cattle,
    weighings,
    expenses,
    vaccinations,
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const cleanFarm = (userDetails.farmName || "finca").toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadAnchor.setAttribute("download", `respaldo_${cleanFarm}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Importar datos desde un archivo JSON para el usuario activo
export async function importBackupData(jsonData, userId) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (!data.cattle || !Array.isArray(data.cattle)) {
      throw new Error('Formato de respaldo no válido.');
    }

    await db.transaction('rw', db.cattle, db.weighings, db.expenses, db.vaccinations, async () => {
      if (userId) {
        await db.cattle.where('userId').equals(userId).delete();
        await db.weighings.where('userId').equals(userId).delete();
        await db.expenses.where('userId').equals(userId).delete();
        if (db.vaccinations) {
          await db.vaccinations.where('userId').equals(userId).delete();
        }
      } else {
        await db.cattle.clear();
        await db.weighings.clear();
        await db.expenses.clear();
        if (db.vaccinations) {
          await db.vaccinations.clear();
        }
      }

      if (data.cattle?.length) {
        const cleaned = data.cattle.map(c => ({
          ...c,
          userId: userId || c.userId || 'default',
          entryBatch: c.entryBatch || c.paddock || 'Ingreso #1'
        }));
        await db.cattle.bulkPut(cleaned);
      }
      if (data.weighings?.length) {
        const cleanedW = data.weighings.map(w => ({
          ...w,
          userId: userId || w.userId || 'default',
        }));
        await db.weighings.bulkPut(cleanedW);
      }
      if (data.expenses?.length) {
        const cleanedE = data.expenses.map(e => ({
          ...e,
          userId: userId || e.userId || 'default',
        }));
        await db.expenses.bulkPut(cleanedE);
      }
      if (data.vaccinations?.length && db.vaccinations) {
        const cleanedV = data.vaccinations.map(v => ({
          ...v,
          userId: userId || v.userId || 'default',
        }));
        await db.vaccinations.bulkPut(cleanedV);
      }
    });

    return { success: true, message: `Importados ${data.cattle.length} bovinos exitosamente.` };
  } catch (error) {
    console.error('Error importando backup:', error);
    return { success: false, message: error.message };
  }
}
