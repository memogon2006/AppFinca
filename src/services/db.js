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
  await db.transaction('rw', db.cattle, db.weighings, db.expenses, async () => {
    await db.cattle.where('userId').equals(userId).delete();
    await db.weighings.where('userId').equals(userId).delete();
    await db.expenses.where('userId').equals(userId).delete();
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

    await db.cattle.bulkAdd(adaptedCattle);
    await db.weighings.bulkAdd(adaptedWeighings);
    await db.expenses.bulkAdd(adaptedExpenses);
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

  if (userId) {
    cattle = await db.cattle.where('userId').equals(userId).toArray();
    weighings = await db.weighings.where('userId').equals(userId).toArray();
    expenses = await db.expenses.where('userId').equals(userId).toArray();
  } else {
    cattle = await db.cattle.toArray();
    weighings = await db.weighings.toArray();
    expenses = await db.expenses.toArray();
  }

  const backup = {
    version: 3,
    appName: "INVENTARIO BOVINO APP",
    exportDate: new Date().toISOString(),
    farmName: userDetails.farmName || "Mi Finca Ganadera",
    farmerName: userDetails.name || "Ganadero",
    userEmail: userDetails.email || "",
    cattle,
    weighings,
    expenses,
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

    await db.transaction('rw', db.cattle, db.weighings, db.expenses, async () => {
      if (userId) {
        await db.cattle.where('userId').equals(userId).delete();
        await db.weighings.where('userId').equals(userId).delete();
        await db.expenses.where('userId').equals(userId).delete();
      } else {
        await db.cattle.clear();
        await db.weighings.clear();
        await db.expenses.clear();
      }

      if (data.cattle?.length) {
        const cleaned = data.cattle.map(c => ({
          ...c,
          userId: userId || c.userId || 'default',
          entryBatch: c.entryBatch || c.paddock || 'Ingreso #1'
        }));
        await db.cattle.bulkAdd(cleaned);
      }
      if (data.weighings?.length) {
        const cleanedW = data.weighings.map(w => ({
          ...w,
          userId: userId || w.userId || 'default',
        }));
        await db.weighings.bulkAdd(cleanedW);
      }
      if (data.expenses?.length) {
        const cleanedE = data.expenses.map(e => ({
          ...e,
          userId: userId || e.userId || 'default',
        }));
        await db.expenses.bulkAdd(cleanedE);
      }
    });

    return { success: true, message: `Importados ${data.cattle.length} bovinos exitosamente.` };
  } catch (error) {
    console.error('Error importando backup:', error);
    return { success: false, message: error.message };
  }
}
