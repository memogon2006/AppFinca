import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

const CLOUD_API_URL = 'https://api.restful-api.dev/objects';
const REGISTRY_STORAGE_KEY = 'ganado_cloud_user_id_';
const DATA_STORAGE_KEY = 'ganado_cloud_data_id_';

/**
 * Convierte un objeto de bovino de camelCase (Dexie) a snake_case (Supabase)
 */
function mapCattleToSupabase(c, userId) {
  return {
    id: typeof c.id === 'number' ? c.id : undefined,
    user_id: userId || c.userId,
    tag_number: c.tagNumber || '',
    name: c.name || '',
    owner: c.owner || 'Dueño Principal',
    iron_brand: c.ironBrand || '',
    sex: c.sex || 'Macho',
    category: c.category || 'Torete / Novillo',
    production_type: c.productionType || 'Carne',
    status: c.status || 'Activo',
    reproductive_status: c.reproductiveStatus || 'No aplica',
    milking_status: c.milkingStatus || 'No aplica',
    is_breeding_only: Boolean(c.isBreedingOnly),
    birth_date: c.birthDate || null,
    entry_date: c.entryDate || new Date().toISOString().split('T')[0],
    entry_weight: parseFloat(c.entryWeight) || 0,
    entry_price: parseFloat(c.entryPrice) || 0,
    entry_batch: c.entryBatch || c.paddock || 'Ingreso #1',
    paddock: c.paddock || '',
    breed: c.breed || '',
    color: c.color || '',
    mother_tag: c.motherTag || '',
    father_tag: c.fatherTag || '',
    current_weight: parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0,
    exit_date: c.exitDate || null,
    exit_weight: parseFloat(c.exitWeight) || null,
    exit_price: parseFloat(c.exitPrice) || null,
    exit_type: c.exitType || null,
    sale_buyer: c.saleBuyer || null,
    sale_reason: c.saleReason || null,
    partnership_details: c.partnershipDetails || null,
    death_date: c.deathDate || null,
    death_reason: c.deathReason || null,
    death_notes: c.deathNotes || null,
    updated_at: new Date().toISOString()
  };
}

/**
 * Convierte un registro de Supabase (snake_case) a camelCase (Dexie)
 */
function mapCattleFromSupabase(row) {
  return {
    id: row.id,
    userId: row.user_id,
    tagNumber: row.tag_number,
    name: row.name,
    owner: row.owner,
    ironBrand: row.iron_brand,
    sex: row.sex,
    category: row.category,
    productionType: row.production_type,
    status: row.status,
    reproductiveStatus: row.reproductive_status,
    milkingStatus: row.milking_status,
    isBreedingOnly: row.is_breeding_only,
    birthDate: row.birth_date,
    entryDate: row.entry_date,
    entryWeight: row.entry_weight,
    entryPrice: row.entry_price,
    entryBatch: row.entry_batch,
    paddock: row.paddock,
    breed: row.breed,
    color: row.color,
    motherTag: row.mother_tag,
    fatherTag: row.father_tag,
    currentWeight: row.current_weight,
    exitDate: row.exit_date,
    exitWeight: row.exit_weight,
    exitPrice: row.exit_price,
    exitType: row.exit_type,
    saleBuyer: row.sale_buyer,
    saleReason: row.sale_reason,
    partnershipDetails: row.partnership_details,
    deathDate: row.death_date,
    deathReason: row.death_reason,
    deathNotes: row.death_notes
  };
}

/**
 * Guarda o actualiza el usuario en Supabase y Nube Global
 */
export async function cloudSaveUser(user) {
  if (!user || !user.email) return false;
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const targetName = `bovino_usr_${cleanEmail}`;

  const userPayload = {
    id: user.id,
    name: user.name,
    farmName: user.farmName,
    email: cleanEmail,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Sincronizar en Supabase si está disponible
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: user.name,
        farm_name: user.farmName,
        email: cleanEmail,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });
    } catch (err) {
      console.warn('Error en supabase profiles upsert:', err);
    }
  }

  // 2. Respaldo Nube Global
  try {
    let cloudId = localStorage.getItem(REGISTRY_STORAGE_KEY + cleanEmail);

    if (!cloudId) {
      const listRes = await fetch(CLOUD_API_URL).catch(() => null);
      if (listRes && listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list)) {
          const found = list.find(item => item.name === targetName);
          if (found && found.id) {
            cloudId = found.id;
            localStorage.setItem(REGISTRY_STORAGE_KEY + cleanEmail, cloudId);
          }
        }
      }
    }

    if (cloudId) {
      const updateRes = await fetch(`${CLOUD_API_URL}/${cloudId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetName,
          data: userPayload,
        }),
      }).catch(() => null);

      if (updateRes && updateRes.ok) return true;
    }

    const createRes = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: targetName,
        data: userPayload,
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      if (created && created.id) {
        localStorage.setItem(REGISTRY_STORAGE_KEY + cleanEmail, created.id);
        return true;
      }
    }
  } catch (err) {
    console.warn('Error en cloudSaveUser:', err);
  }

  return false;
}

/**
 * Busca un usuario en Supabase y Nube Global
 */
export async function cloudFindUser(email) {
  if (!email) return null;
  const cleanEmail = (email || '').trim().toLowerCase();
  const targetName = `bovino_usr_${cleanEmail}`;

  // 1. Consultar en Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          name: data.name,
          farmName: data.farm_name,
          email: data.email,
        };
      }
    } catch (err) {
      console.warn('Error consultando usuario en Supabase:', err);
    }
  }

  // 2. Consultar Nube Global
  try {
    const res = await fetch(`${CLOUD_API_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const found = list.find(item => item.name === targetName);
        if (found && found.data && (found.data.email || '').toLowerCase() === cleanEmail) {
          localStorage.setItem(REGISTRY_STORAGE_KEY + cleanEmail, found.id);
          return found.data;
        }
      }
    }
  } catch (e) {
    console.warn('Error en cloudFindUser:', e);
  }

  return null;
}

/**
 * Sube a Supabase y la Nube el inventario completo de ganado y pesajes del usuario
 */
export async function cloudPushData(userId) {
  if (!userId) return false;
  const targetName = `bovino_dat_${userId}`;

  try {
    const cattle = await db.cattle.filter(c => c.userId === userId || !c.userId).toArray();
    const weighings = await db.weighings.filter(w => w.userId === userId || !w.userId).toArray();
    const expenses = await db.expenses.filter(e => e.userId === userId || !e.userId).toArray();

    // 1. Sincronizar en Supabase PostgreSQL
    if (isSupabaseConfigured && supabase) {
      try {
        if (cattle.length > 0) {
          const supabaseCattle = cattle.map(c => mapCattleToSupabase(c, userId));
          await supabase.from('cattle').upsert(supabaseCattle);
        }
        if (weighings.length > 0) {
          const supabaseWeighings = weighings.map(w => ({
            id: typeof w.id === 'number' ? w.id : undefined,
            user_id: userId,
            cattle_id: w.cattleId,
            date: w.date,
            weight: parseFloat(w.weight) || 0,
            notes: w.notes || ''
          }));
          await supabase.from('weighings').upsert(supabaseWeighings);
        }
        if (expenses.length > 0) {
          const supabaseExpenses = expenses.map(e => ({
            id: typeof e.id === 'number' ? e.id : undefined,
            user_id: userId,
            cattle_id: e.cattleId || null,
            date: e.date,
            category: e.category,
            amount: parseFloat(e.amount) || 0,
            description: e.description || '',
            supplier: e.supplier || '',
            invoice_number: e.invoiceNumber || ''
          }));
          await supabase.from('expenses').upsert(supabaseExpenses);
        }
      } catch (err) {
        console.warn('Error sincronizando con Supabase en cloudPushData:', err);
      }
    }

    // 2. Respaldo Nube Global
    const payload = {
      userId,
      cattle,
      weighings,
      expenses,
      syncedAt: new Date().toISOString(),
    };

    let cloudDataId = localStorage.getItem(DATA_STORAGE_KEY + userId);

    if (!cloudDataId) {
      const listRes = await fetch(CLOUD_API_URL).catch(() => null);
      if (listRes && listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list)) {
          const found = list.find(item => item.name === targetName);
          if (found && found.id) {
            cloudDataId = found.id;
            localStorage.setItem(DATA_STORAGE_KEY + userId, cloudDataId);
          }
        }
      }
    }

    if (cloudDataId) {
      const updateRes = await fetch(`${CLOUD_API_URL}/${cloudDataId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetName,
          data: payload,
        }),
      }).catch(() => null);

      if (updateRes && updateRes.ok) return true;
    }

    const createRes = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: targetName,
        data: payload,
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      if (created && created.id) {
        localStorage.setItem(DATA_STORAGE_KEY + userId, created.id);
        return true;
      }
    }
  } catch (e) {
    console.warn('Error en cloudPushData:', e);
  }

  return false;
}

/**
 * Descarga el inventario y pesajes del usuario desde Supabase o la Nube
 */
export async function cloudPullData(userId) {
  if (!userId) return false;
  const targetName = `bovino_dat_${userId}`;

  // 1. Intentar desde Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cattleData, error: cattleErr } = await supabase
        .from('cattle')
        .select('*')
        .eq('user_id', userId);

      const { data: weighingsData } = await supabase
        .from('weighings')
        .select('*')
        .eq('user_id', userId);

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId);

      if (cattleData && cattleData.length > 0 && !cattleErr) {
        for (const row of cattleData) {
          const mapped = mapCattleFromSupabase(row);
          await db.cattle.put({ ...mapped, userId });
        }
        if (weighingsData) {
          for (const w of weighingsData) {
            await db.weighings.put({
              id: w.id,
              userId: w.user_id,
              cattleId: w.cattle_id,
              date: w.date,
              weight: w.weight,
              notes: w.notes
            });
          }
        }
        if (expensesData) {
          for (const e of expensesData) {
            await db.expenses.put({
              id: e.id,
              userId: e.user_id,
              cattleId: e.cattle_id,
              date: e.date,
              category: e.category,
              amount: e.amount,
              description: e.description,
              supplier: e.supplier,
              invoiceNumber: e.invoice_number
            });
          }
        }
        return true;
      }
    } catch (err) {
      console.warn('Error descargando de Supabase:', err);
    }
  }

  // 2. Descarga desde Nube Global
  try {
    const res = await fetch(`${CLOUD_API_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const found = list.find(item => item.name === targetName);
        if (found && found.data) {
          const remoteData = found.data;
          if (Array.isArray(remoteData.cattle)) {
            for (const item of remoteData.cattle) {
              await db.cattle.put({ ...item, userId });
            }
          }
          if (Array.isArray(remoteData.weighings)) {
            for (const item of remoteData.weighings) {
              await db.weighings.put({ ...item, userId });
            }
          }
          localStorage.setItem(DATA_STORAGE_KEY + userId, found.id);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Error en cloudPullData:', e);
  }

  return false;
}

/**
 * Elimina completamente todos los registros del usuario en la nube y Supabase
 */
export async function cloudDeleteUserData(userId, email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const userTarget = `bovino_usr_${cleanEmail}`;
    const dataTarget = `bovino_dat_${userId}`;

    // 1. Eliminar en Supabase
    if (isSupabaseConfigured && supabase && userId) {
      try {
        await supabase.from('cattle').delete().eq('user_id', userId);
        await supabase.from('weighings').delete().eq('user_id', userId);
        await supabase.from('expenses').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (err) {
        console.warn('Error eliminando en Supabase:', err);
      }
    }

    // 2. Eliminar en Nube Global
    const listRes = await fetch(`${CLOUD_API_URL}?_t=${Date.now()}`).catch(() => null);
    if (listRes && listRes.ok) {
      const list = await listRes.json();
      if (Array.isArray(list)) {
        const userObj = list.find(item => item.name === userTarget);
        if (userObj && userObj.id) {
          await fetch(`${CLOUD_API_URL}/${userObj.id}`, { method: 'DELETE' }).catch(() => null);
        }

        const dataObj = list.find(item => item.name === dataTarget);
        if (dataObj && dataObj.id) {
          await fetch(`${CLOUD_API_URL}/${dataObj.id}`, { method: 'DELETE' }).catch(() => null);
        }
      }
    }

    if (cleanEmail) localStorage.removeItem(REGISTRY_STORAGE_KEY + cleanEmail);
    if (userId) localStorage.removeItem(DATA_STORAGE_KEY + userId);

    return true;
  } catch (err) {
    console.warn('Error en cloudDeleteUserData:', err);
    return false;
  }
}

/**
 * Sincronización automática de todas las cuentas locales existentes hacia la nube
 */
export async function syncAllLocalAccountsToCloud() {
  try {
    const allUsers = await db.users.toArray();
    for (const u of allUsers) {
      await cloudSaveUser(u);
      await cloudPushData(u.id);
    }
  } catch (e) {
    console.warn('Error en auto-sync de cuentas locales:', e);
  }
}

/**
 * Sincronización bidireccional automática (Pull + Push)
 */
export async function syncCloudAndLocal(userId) {
  if (!userId) return;
  try {
    await cloudPullData(userId);
    await cloudPushData(userId);
  } catch (e) {
    console.warn('Error en syncCloudAndLocal:', e);
  }
}
