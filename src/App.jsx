import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, deleteDemoData, isDemoAnimal } from './services/db';
import { useAuth } from './context/AuthContext';
import { cloudPushData, syncCloudAndLocal, syncAllLocalAccountsToCloud } from './services/cloudSync';
import { AuthView } from './components/Auth/AuthView';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { CattleListView } from './components/Cattle/CattleListView';
import { WeightsView } from './components/Weights/WeightsView';
import { QuickWeighinView } from './components/Weights/QuickWeighinView';
import { FemalesView } from './components/Females/FemalesView';
import { BatchAnalyticsView } from './components/Batches/BatchAnalyticsView';
import { FinancesView } from './components/Finances/FinancesView';
import { CattleFormModal } from './components/Cattle/CattleFormModal';
import { CattleDetailModal } from './components/Cattle/CattleDetailModal';
import { SellModal } from './components/Cattle/SellModal';
import { DeathModal } from './components/Cattle/DeathModal';
import { WeightLogModal } from './components/Weights/WeightLogModal';
import { ExportImportModal } from './components/Common/ExportImportModal';
import { ProfileModal } from './components/Auth/ProfileModal';
import { GlossaryModal } from './components/Common/GlossaryModal';
import { PartnershipSettlementModal } from './components/Finances/PartnershipSettlementModal';
import { BatchEntryModal } from './components/Cattle/BatchEntryModal';
import { UpdateNotificationBanner } from './components/Common/UpdateNotificationBanner';
import { calculateWeightMetrics } from './services/calculations';
import { CheckCircle2, Sparkles, Trash2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);

  const [isBatchEntryModalOpen, setIsBatchEntryModalOpen] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingAnimal, setSellingAnimal] = useState(null);

  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [deathAnimal, setDeathAnimal] = useState(null);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weighingAnimal, setWeighingAnimal] = useState(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false);

  // Mostrar notificación de confirmación de acción
  const showToast = (text, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Inicializar base de datos y auto-sincronizar cuentas existentes
  useEffect(() => {
    async function init() {
      await initializeDatabase();
      setIsInitialized(true);
      // Auto-sincronizar todas las cuentas locales existentes a la nube
      syncAllLocalAccountsToCloud().catch(() => null);
    }
    init();
  }, []);

  const userId = currentUser?.id;

  // Sincronización automática con la nube al entrar o reconectarse
  useEffect(() => {
    if (!userId) return;

    async function sync() {
      setIsSyncing(true);
      await syncCloudAndLocal(userId);
      setIsSyncing(false);
    }

    sync();

    window.addEventListener('online', sync);
    window.addEventListener('focus', sync);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('focus', sync);
    };
  }, [userId]);

  // Scroll automático al tope superior cada vez que se cambia de pestaña / vista
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  // Consultas reactivas filtradas exclusivamente por el usuario activo (Multi-Tenancy)
  const cattle = useLiveQuery(
    () => {
      if (!userId) return [];
      return db.cattle.filter(c => c.userId === userId || !c.userId).toArray();
    },
    [userId]
  ) || [];

  const weighings = useLiveQuery(
    () => {
      if (!userId) return [];
      return db.weighings.filter(w => w.userId === userId || !w.userId).toArray();
    },
    [userId]
  ) || [];

  // Auto-reparación y optimización de datos de pesajes al cargar
  useEffect(() => {
    if (!userId || cattle.length === 0 || weighings.length === 0) return;

    let changed = false;

    async function cleanupDuplicateWeighings() {
      for (const animal of cattle) {
        const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
        const entryWeight = parseFloat(animal.entryWeight) || 0;

        // 1. Detectar pesajes iniciales duplicados generados con fecha posterior
        const duplicateInitialWeighs = animalWeighs.filter(w => {
          if (entryWeight > 0 && 
              (w.notes === 'Peso inicial de registro' || 
               w.notes === 'Peso inicial de registro por lote' || 
               w.notes === 'Peso inicial de ingreso' || 
               (w.notes && w.notes.toLowerCase().includes('inicial'))) && 
              parseFloat(w.weight) === entryWeight &&
              w.date !== animal.entryDate) {
            return true;
          }
          return false;
        });

        for (const dup of duplicateInitialWeighs) {
          await db.weighings.delete(dup.id);
          changed = true;
        }

        // 2. Recalcular y corregir currentWeight del animal si difiere del último pesaje real
        const remainingWeighs = animalWeighs.filter(w => !duplicateInitialWeighs.some(d => d.id === w.id));
        const metrics = calculateWeightMetrics(animal, remainingWeighs);
        
        if (metrics.currentWeight > 0 && animal.currentWeight !== metrics.currentWeight) {
          await db.cattle.update(animal.id, {
            currentWeight: metrics.currentWeight,
          });
          changed = true;
        }
      }

      if (changed) {
        cloudPushData(userId);
      }
    }

    cleanupDuplicateWeighings().catch(err => console.warn('Error en auto-reparación de pesajes:', err));
  }, [userId, cattle.length, weighings.length]);

  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/30 animate-pulse">
          🐂
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black tracking-tight uppercase">Inventario Ganadero</h2>
          <p className="text-xs text-slate-400">Cargando base de datos segura y sincronización...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const activeCattleCount = cattle.filter(c => c.status === 'Activo').length;

  const handleSaveAnimal = async (animalData) => {
    if (!userId) return;

    if (animalData.id) {
      const updated = { ...animalData, userId };
      await db.cattle.put(updated);

      // Si el peso de entrada cambió, actualizar pesaje inicial si existe
      if (updated.entryWeight !== undefined && updated.entryWeight !== null) {
        try {
          const allAnimalWeighings = await db.weighings.where('cattleId').equals(String(updated.id)).toArray();
          const initialWeighing = allAnimalWeighings.find(w => w.notes && w.notes.includes('inicial'));
          if (initialWeighing) {
            await db.weighings.update(initialWeighing.id, {
              weight: parseFloat(updated.entryWeight) || 0,
              date: updated.entryDate || initialWeighing.date
            });
          }
        } catch (e) {
          console.warn('Error sincronizando pesaje inicial:', e);
        }
      }

      // Actualizar inmediatamente el animal seleccionado si está abierto en CattleDetailModal
      if (selectedAnimal && String(selectedAnimal.id) === String(animalData.id)) {
        setSelectedAnimal(updated);
      }

      setIsFormModalOpen(false);
      setEditingAnimal(null);
      cloudPushData(userId);
      showToast(`Bovino ${animalData.tagNumber} actualizado y sincronizado en la nube ☁️`);
    } else {
      const newId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const created = {
        ...animalData,
        id: newId,
        userId,
        createdAt: new Date().toISOString(),
      };
      await db.cattle.add(created);

      if (created.entryWeight && parseFloat(created.entryWeight) > 0) {
        const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await db.weighings.add({
          id: weighId,
          cattleId: String(newId),
          userId,
          date: created.entryDate || new Date().toISOString().split('T')[0],
          weight: parseFloat(created.entryWeight),
          conditionScore: 3.5,
          notes: 'Peso inicial de registro',
        });
      }

      setIsFormModalOpen(false);
      setEditingAnimal(null);
      cloudPushData(userId);
      showToast(`¡Bovino ${created.tagNumber} registrado y sincronizado en la nube! ☁️`);
    }
  };

  // Guardar Lote Completo de Bovinos
  const handleSaveBatchCattle = async (batchAnimals) => {
    if (!userId || !batchAnimals || batchAnimals.length === 0) return;

    for (let i = 0; i < batchAnimals.length; i++) {
      const animalData = batchAnimals[i];
      const newId = 'c_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4);
      const created = {
        ...animalData,
        id: newId,
        userId,
        createdAt: new Date().toISOString(),
      };
      await db.cattle.add(created);

      if (created.entryWeight && parseFloat(created.entryWeight) > 0) {
        const weighId = 'w_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4);
        await db.weighings.add({
          id: weighId,
          cattleId: String(newId),
          userId,
          date: created.entryDate || new Date().toISOString().split('T')[0],
          weight: parseFloat(created.entryWeight),
          conditionScore: 3.5,
          notes: 'Peso inicial de registro por lote',
        });
      }
    }

    setIsBatchEntryModalOpen(false);
    cloudPushData(userId);
    showToast(`¡Lote de ${batchAnimals.length} bovinos registrado y guardado exitosamente! 📦☁️`, 'success');
  };

  const handleSaveWeight = async ({ cattleId, date, weight, conditionScore, notes }) => {
    if (!userId) return;
    const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const animal = await db.cattle.get(cattleId) || await db.cattle.get(Number(cattleId));
    const targetId = animal ? animal.id : cattleId;

    await db.weighings.add({
      id: weighId,
      cattleId: String(targetId),
      userId,
      date,
      weight: parseFloat(weight),
      conditionScore: parseFloat(conditionScore),
      notes: notes || '',
    });

    const allWeighs = await db.weighings.where('cattleId').equals(String(targetId)).toArray();
    const metrics = calculateWeightMetrics(animal || { id: targetId }, allWeighs);
    const newWeight = metrics.currentWeight > 0 ? metrics.currentWeight : parseFloat(weight);

    await db.cattle.update(targetId, {
      currentWeight: newWeight,
    });

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, currentWeight: newWeight }));
    }

    setIsWeightModalOpen(false);
    setWeighingAnimal(null);
    cloudPushData(userId);
    showToast(`Pesaje de ${weight} kg registrado y sincronizado en la nube ☁️`);
  };

  const handleDeleteWeight = async (weighingId, cattleId, date, weight) => {
    if (!userId) return;

    let targetWeighing = null;
    if (weighingId && weighingId !== 'entry' && weighingId !== 'exit') {
      targetWeighing = await db.weighings.get(weighingId) || await db.weighings.get(Number(weighingId));
    }

    if (!targetWeighing && cattleId) {
      const matches = await db.weighings.where('cattleId').equals(String(cattleId)).toArray();
      targetWeighing = matches.find(w => w.date === date && (weight ? Math.abs(parseFloat(w.weight) - parseFloat(weight)) < 0.01 : true)) || matches[matches.length - 1];
    }

    if (targetWeighing) {
      await db.weighings.delete(targetWeighing.id);
    }

    const animal = await db.cattle.get(cattleId) || await db.cattle.get(Number(cattleId));
    if (animal) {
      const remaining = await db.weighings.where('cattleId').equals(String(animal.id)).toArray();
      remaining.sort((a, b) => new Date(a.date) - new Date(b.date));

      let newCurrentWeight = parseFloat(animal.entryWeight) || 0;
      if (remaining.length > 0) {
        newCurrentWeight = parseFloat(remaining[remaining.length - 1].weight) || newCurrentWeight;
      }

      await db.cattle.update(animal.id, {
        currentWeight: newCurrentWeight > 0 ? newCurrentWeight : undefined,
      });

      if (selectedAnimal && String(selectedAnimal.id) === String(animal.id)) {
        setSelectedAnimal(prev => ({
          ...prev,
          currentWeight: newCurrentWeight > 0 ? newCurrentWeight : undefined,
        }));
      }
    }

    cloudPushData(userId);
    showToast('Registro de pesaje eliminado y peso actual recalculado ⚖️');
  };

  const handleConfirmSale = async ({ id, exitDate, exitWeight, exitPrice, saleBuyer, saleReason, exitType, partnershipDetails }) => {
    const animal = await db.cattle.get(id) || await db.cattle.get(Number(id));
    const targetId = animal ? animal.id : id;

    const saleUpdates = {
      status: 'Vendido',
      exitDate,
      exitWeight: parseFloat(exitWeight),
      exitPrice: parseFloat(exitPrice),
      saleBuyer: saleBuyer || '',
      saleReason: saleReason || '',
      exitType: exitType || 'En Pie',
      currentWeight: parseFloat(exitWeight),
      partnershipDetails: partnershipDetails || null,
    };

    await db.cattle.update(targetId, saleUpdates);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...saleUpdates }));
    }

    setIsSellModalOpen(false);
    setSellingAnimal(null);
    cloudPushData(userId);
    showToast(`Venta liquidada y sincronizada en la nube ☁️`);
  };

  const handleConfirmBatchSale = async (batchList) => {
    if (!userId || !batchList || batchList.length === 0) return;

    for (const item of batchList) {
      const animal = await db.cattle.get(item.id) || await db.cattle.get(Number(item.id));
      const targetId = animal ? animal.id : item.id;

      await db.cattle.update(targetId, {
        status: 'Vendido',
        exitDate: item.exitDate,
        exitWeight: parseFloat(item.exitWeight),
        exitPrice: parseFloat(item.exitPrice),
        saleBuyer: item.saleBuyer || '',
        saleReason: item.saleReason || 'Venta en Compañía',
        exitType: item.exitType || 'En Compañía',
        currentWeight: parseFloat(item.exitWeight),
        partnershipDetails: item.partnershipDetails || null,
      });
    }

    cloudPushData(userId);
    showToast(`¡Liquidación de ${batchList.length} bovinos asentada y sincronizada en la nube! ☁️`);
  };

  const handleConfirmDeath = async (arg1, arg2) => {
    let id, deathDate, deathReason, deathNotes;
    if (typeof arg1 === 'object' && arg1 !== null) {
      ({ id, deathDate, deathReason, deathNotes } = arg1);
    } else {
      id = arg1;
      if (arg2) {
        ({ deathDate, deathReason, deathNotes } = arg2);
      }
    }

    if (!id) {
      console.error('handleConfirmDeath: No id provided');
      return;
    }

    const numId = Number(id);
    const animal = (await db.cattle.get(id)) || (!isNaN(numId) ? await db.cattle.get(numId) : null);
    const targetId = animal ? animal.id : (isNaN(numId) ? id : numId);

    const deathUpdates = {
      status: 'Muerto',
      deathDate: deathDate || new Date().toISOString().split('T')[0],
      deathReason: deathReason || 'Enfermedad',
      deathNotes: deathNotes || '',
    };

    await db.cattle.update(targetId, deathUpdates);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...deathUpdates }));
    }

    setIsDeathModalOpen(false);
    setDeathAnimal(null);
    cloudPushData(userId);
    showToast(`Bovino dado de baja por muerte y sincronizado ☁️`);
  };

  const handleRevertDeath = async (animalId) => {
    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    const targetId = animal ? animal.id : animalId;

    const revertUpdates = {
      status: 'Activo',
      deathDate: null,
      deathReason: null,
      deathNotes: null,
    };

    await db.cattle.update(targetId, revertUpdates);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...revertUpdates }));
    }

    cloudPushData(userId);
    showToast(`Bovino reactivado en el inventario ☁️`);
  };

  const handleRevertSale = async (animalId) => {
    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    const targetId = animal ? animal.id : animalId;

    const revertUpdates = {
      status: 'Activo',
      exitDate: null,
      exitWeight: null,
      exitPrice: null,
      saleBuyer: null,
      saleReason: null,
      exitType: null,
      partnershipDetails: null,
    };

    await db.cattle.update(targetId, revertUpdates);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...revertUpdates }));
    }

    cloudPushData(userId);
    showToast(`Venta anulada. El animal volvió al inventario activo ☁️`);
  };

  const handleSaveBatchWeighings = async (batch) => {
    if (!userId) return;
    for (const item of batch) {
      const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const animal = await db.cattle.get(item.cattleId) || await db.cattle.get(Number(item.cattleId));
      const targetId = animal ? animal.id : item.cattleId;

      await db.weighings.add({
        id: weighId,
        cattleId: String(targetId),
        userId,
        date: item.date,
        weight: parseFloat(item.weight),
        conditionScore: item.conditionScore || 3.5,
        notes: item.notes || 'Pesaje rápido de báscula',
      });

      const allWeighs = await db.weighings.where('cattleId').equals(String(targetId)).toArray();
      const metrics = calculateWeightMetrics(animal || { id: targetId }, allWeighs);

      await db.cattle.update(targetId, {
        currentWeight: metrics.currentWeight > 0 ? metrics.currentWeight : parseFloat(item.weight),
      });
    }

    cloudPushData(userId);
    showToast(`Se guardaron y sincronizaron ${batch.length} pesajes ☁️`);
  };

  const handleDeleteAnimal = async (animalId) => {
    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    const targetId = animal ? animal.id : animalId;
    const tag = animal?.tagNumber || 'Bovino';

    await db.cattle.delete(targetId);
    await db.weighings.where('cattleId').equals(String(targetId)).delete();

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setIsDetailModalOpen(false);
      setSelectedAnimal(null);
    }

    cloudPushData(userId);
    showToast(`Bovino ${tag} eliminado del inventario 🗑️`, 'danger');
  };

  const handleManualSync = async () => {
    if (!userId) return;
    setIsSyncing(true);
    await syncCloudAndLocal(userId);
    setIsSyncing(false);
    showToast(`¡Sincronización con la nube completada! ☁️`, 'success');
  };

  const handleOpenNew = () => {
    setEditingAnimal(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (animal) => {
    setEditingAnimal(animal);
    setIsFormModalOpen(true);
  };

  const handleSelectAnimal = (animal) => {
    const fresh = cattle.find(c => c.id === animal.id) || animal;
    setSelectedAnimal(fresh);
    setIsDetailModalOpen(true);
  };

  const handleOpenSell = (animal) => {
    setSellingAnimal(animal);
    setIsSellModalOpen(true);
  };

  const handleOpenDeath = (animal) => {
    setDeathAnimal(animal);
    setIsDeathModalOpen(true);
  };

  const handleOpenAddWeight = (animal) => {
    setWeighingAnimal(animal);
    setIsWeightModalOpen(true);
  };

  // Detección de animales demo cargados
  const demoAnimals = cattle.filter(isDemoAnimal);
  const demoCount = demoAnimals.length;

  const handleDeleteDemoDirect = async () => {
    if (demoCount === 0) return;
    if (window.confirm(`¿Estás seguro de que deseas eliminar los ${demoCount} animales de demostración/ejemplo?\n\nTus animales reales registrados permanecerán 100% seguros e intactos.`)) {
      try {
        const result = await deleteDemoData(userId);
        await cloudPushData(userId).catch(() => null);
        showToast(result.message, 'warning');
      } catch (err) {
        alert('Error al eliminar demo: ' + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Notificación de Actualización PWA / Versión */}
      <UpdateNotificationBanner />

      {/* Toast Notification Flotante de Máxima Prioridad */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92%] sm:w-auto animate-fade-in shadow-2xl pointer-events-auto">
          <div className={`px-4 py-3 rounded-2xl text-white flex items-center gap-3 text-xs sm:text-sm font-black border backdrop-blur-md shadow-2xl ${
            (typeof toastMessage === 'object' && (toastMessage.type === 'danger' || toastMessage.type === 'error'))
              ? 'bg-rose-600/95 border-rose-400 text-white shadow-rose-950/40'
              : (typeof toastMessage === 'object' && toastMessage.type === 'warning')
                ? 'bg-amber-600/95 border-amber-400 text-white shadow-amber-950/40'
                : 'bg-emerald-600/95 border-emerald-400 text-white shadow-emerald-950/40'
          }`}>
            {(typeof toastMessage === 'object' && (toastMessage.type === 'danger' || toastMessage.type === 'error')) ? (
              <Trash2 className="w-5 h-5 flex-shrink-0" />
            ) : (typeof toastMessage === 'object' && toastMessage.type === 'warning') ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-100" />
            )}
            <span className="flex-1 font-bold leading-tight">
              {typeof toastMessage === 'string' ? toastMessage : toastMessage.text}
            </span>
            <button 
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition shrink-0 cursor-pointer ml-1"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navegación Superior y Móvil */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenNewAnimal={handleOpenNew}
        onOpenExportImport={() => setIsExportModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        activeCattleCount={activeCattleCount}
      />

      {/* Banner Informativo de Modo Demostración Activo */}
      {demoCount > 0 && (
        <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 pt-3">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 dark:from-amber-950/70 dark:via-amber-900/50 dark:to-orange-950/50 border border-amber-300 dark:border-amber-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                    Modo Demostración Activo
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-400/50">
                    {demoCount} {demoCount === 1 ? 'animal de prueba' : 'animales de prueba'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 truncate">
                  Tienes datos de ejemplo cargados para probar el sistema. Puedes borrarlos en cualquier momento sin afectar tus datos reales.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleDeleteDemoDirect}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Eliminar únicamente los animales y pesajes de demostración"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Datos Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 mb-20 md:mb-8 space-y-6">
        
        {currentView === 'dashboard' && (
          <DashboardView
            cattle={cattle}
            weighings={weighings}
            onNavigate={setCurrentView}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
            onOpenBatchEntry={() => setIsBatchEntryModalOpen(true)}
            onOpenExportImport={() => setIsExportModalOpen(true)}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
          />
        )}

        {currentView === 'cattle' && (
          <CattleListView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenNew={handleOpenNew}
            onOpenNewAnimal={handleOpenNew}
            onOpenBatchEntry={() => setIsBatchEntryModalOpen(true)}
            onOpenEdit={handleOpenEdit}
            onOpenSell={handleOpenSell}
            onOpenDeath={handleOpenDeath}
            onRevertDeath={handleRevertDeath}
            onDelete={handleDeleteAnimal}
            onDeleteAnimal={handleDeleteAnimal}
            onAddWeight={handleOpenAddWeight}
            onOpenAddWeight={handleOpenAddWeight}
            onOpenExportImport={() => setIsExportModalOpen(true)}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
            onOpenPartnershipModal={() => setIsPartnershipModalOpen(true)}
          />
        )}

        {currentView === 'batches' && (
          <BatchAnalyticsView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenBatchEntry={() => setIsBatchEntryModalOpen(true)}
            onOpenNewAnimal={handleOpenNew}
            onOpenExportImport={() => setIsExportModalOpen(true)}
          />
        )}

        {currentView === 'weights' && (
          <WeightsView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onAddWeight={handleOpenAddWeight}
            onDeleteWeight={handleDeleteWeight}
            onNavigate={setCurrentView}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
          />
        )}

        {currentView === 'quickWeigh' && (
          <QuickWeighinView
            cattle={cattle}
            weighings={weighings}
            onSaveBatchWeighings={handleSaveBatchWeighings}
            onSaveBatch={handleSaveBatchWeighings}
            onSelectAnimal={handleSelectAnimal}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'females' && (
          <FemalesView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
          />
        )}

        {currentView === 'finances' && (
          <FinancesView
            cattle={cattle}
            onSelectAnimal={handleSelectAnimal}
            onRevertSale={handleRevertSale}
            onDeleteAnimal={handleDeleteAnimal}
            onOpenPartnershipModal={() => setIsPartnershipModalOpen(true)}
          />
        )}

      </main>

      {/* MODALES */}

      {/* 1. Modal Base de Ficha Técnica / Detalle del Bovino */}
      <CattleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        animal={cattle.find(c => String(c.id) === String(selectedAnimal?.id)) || selectedAnimal}
        weighings={weighings}
        onOpenEdit={handleOpenEdit}
        onOpenSell={handleOpenSell}
        onOpenAddWeight={handleOpenAddWeight}
        onOpenDeath={handleOpenDeath}
        onRevertDeath={handleRevertDeath}
        onDelete={handleDeleteAnimal}
        onDeleteWeight={handleDeleteWeight}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
      />

      {/* 2. Modales de Acción y Formularios (Con zIndex z-[60] para superponerse con prioridad) */}
      <CattleFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAnimal(null);
        }}
        onSave={handleSaveAnimal}
        animal={editingAnimal}
        zIndex="z-[60]"
      />

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => {
          setIsSellModalOpen(false);
          setSellingAnimal(null);
        }}
        animal={sellingAnimal}
        onConfirmSale={handleConfirmSale}
        zIndex="z-[60]"
      />

      <DeathModal
        isOpen={isDeathModalOpen}
        onClose={() => {
          setIsDeathModalOpen(false);
          setDeathAnimal(null);
        }}
        animal={deathAnimal}
        onConfirmDeath={handleConfirmDeath}
        zIndex="z-[60]"
      />

      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => {
          setIsWeightModalOpen(false);
          setWeighingAnimal(null);
        }}
        animal={weighingAnimal}
        weighings={weighings}
        onSaveWeight={handleSaveWeight}
        zIndex="z-[60]"
      />

      <BatchEntryModal
        isOpen={isBatchEntryModalOpen}
        onClose={() => setIsBatchEntryModalOpen(false)}
        onSaveBatch={handleSaveBatchCattle}
        zIndex="z-[60]"
      />

      <PartnershipSettlementModal
        isOpen={isPartnershipModalOpen}
        onClose={() => setIsPartnershipModalOpen(false)}
        cattle={cattle}
        weighings={weighings}
        onConfirmBatchSale={handleConfirmBatchSale}
        zIndex="z-[60]"
      />

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        zIndex="z-[60]"
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        zIndex="z-[60]"
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDataChanged={() => {}}
        zIndex="z-[60]"
      />

    </div>
  );
}
