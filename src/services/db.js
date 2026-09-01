import Dexie from 'dexie';
import { INITIAL_CATTLE, INITIAL_WEIGHINGS, INITIAL_EXPENSES } from './sampleData';

export const db = new Dexie('GanadoProDB');

db.version(2).stores({
  cattle: '++id, tagNumber, name, owner, ironBrand, sex, category, productionType, status, reproductiveStatus, milkingStatus, isBreedingOnly, entryDate, exitDate, entryBatch, paddock',
  weighings: '++id, cattleId, date, weight',
  expenses: '++id, cattleId, date, category',
  settings: 'key'
}).upgrade(tx => {
  return tx.table('cattle').toCollection().modify(cattle => {
    if (!cattle.entryBatch && cattle.paddock) {
      cattle.entryBatch = cattle.paddock;
    }
  });
});

// Inicialización de la base de datos limpia (en ceros)
export async function initializeDatabase() {
  const cleanFlag = await db.settings.get('initial_zero_cleanup_done_v3');
  if (!cleanFlag) {
    await db.cattle.clear();
    await db.weighings.clear();
    await db.expenses.clear();
    await db.settings.put({ key: 'initial_zero_cleanup_done_v3', value: true });
    await db.settings.put({ key: 'farmName', value: 'Mi Finca Ganadera' });
    await db.settings.put({ key: 'currency', value: '$' });
    await db.settings.put({ key: 'weightUnit', value: 'kg' });
  }
}

// Limpiar todos los inventarios y dejar la base de datos en ceros
export async function clearAllData() {
  await db.transaction('rw', db.cattle, db.weighings, db.expenses, async () => {
    await db.cattle.clear();
    await db.weighings.clear();
    await db.expenses.clear();
  });
}

// Cargar datos de prueba / demostración bajo demanda
export async function loadSampleData() {
  await db.transaction('rw', db.cattle, db.weighings, db.expenses, async () => {
    await db.cattle.clear();
    await db.weighings.clear();
    await db.expenses.clear();
    const adaptedCattle = INITIAL_CATTLE.map(c => ({
      ...c,
      entryBatch: c.entryBatch || c.paddock || 'Ingreso #1'
    }));
    await db.cattle.bulkAdd(adaptedCattle);
    await db.weighings.bulkAdd(INITIAL_WEIGHINGS);
    await db.expenses.bulkAdd(INITIAL_EXPENSES);
  });
}

// Exportar todos los datos a un archivo JSON de respaldo
export async function exportBackupData() {
  const cattle = await db.cattle.toArray();
  const weighings = await db.weighings.toArray();
  const expenses = await db.expenses.toArray();
  const settings = await db.settings.toArray();

  const backup = {
    version: 2,
    appName: "INVENTARIO BOVINO APP",
    exportDate: new Date().toISOString(),
    cattle,
    weighings,
    expenses,
    settings,
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `respaldo_inventario_bovino_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Importar datos desde un archivo JSON
export async function importBackupData(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (!data.cattle || !Array.isArray(data.cattle)) {
      throw new Error('Formato de respaldo no válido.');
    }

    await db.transaction('rw', db.cattle, db.weighings, db.expenses, db.settings, async () => {
      await db.cattle.clear();
      await db.weighings.clear();
      await db.expenses.clear();

      if (data.cattle?.length) {
        const cleaned = data.cattle.map(c => ({
          ...c,
          entryBatch: c.entryBatch || c.paddock || 'Ingreso #1'
        }));
        await db.cattle.bulkAdd(cleaned);
      }
      if (data.weighings?.length) await db.weighings.bulkAdd(data.weighings);
      if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
      if (data.settings?.length) {
        await db.settings.clear();
        await db.settings.bulkAdd(data.settings);
      }
    });

    return { success: true, message: `Importados ${data.cattle.length} bovinos exitosamente.` };
  } catch (error) {
    console.error('Error importando backup:', error);
    return { success: false, message: error.message };
  }
}
