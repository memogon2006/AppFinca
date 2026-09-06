import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase } from './services/db';
import { useAuth } from './context/AuthContext';
import { cloudPushData, syncCloudAndLocal, syncAllLocalAccountsToCloud } from './services/cloudSync';
import { AuthView } from './components/Auth/AuthView';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { CattleListView } from './components/Cattle/CattleListView';
import { WeightsView } from './components/Weights/WeightsView';
import { QuickWeighinView } from './components/Weights/QuickWeighinView';
import { FemalesView } from './components/Females/FemalesView';
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
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
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

  // Mostrar notificación de guardado automático
  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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
      await db.cattle.put({ ...animalData, userId });
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

    cloudPushData(userId);
    showToast(`¡Lote de ${batchAnimals.length} bovinos registrado y sincronizado en la nube! ☁️`);
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

    await db.cattle.update(targetId, {
      currentWeight: parseFloat(weight),
    });

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

      if (selectedAnimal && selectedAnimal.id === animal.id) {
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

    await db.cattle.update(targetId, {
      status: 'Vendido',
      exitDate,
      exitWeight: parseFloat(exitWeight),
      exitPrice: parseFloat(exitPrice),
      saleBuyer: saleBuyer || '',
      saleReason: saleReason || '',
      exitType: exitType || 'En Pie',
      currentWeight: parseFloat(exitWeight),
      partnershipDetails: partnershipDetails || null,
    });

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

  const handleConfirmDeath = async ({ id, deathDate, deathReason, deathNotes }) => {
    const animal = await db.cattle.get(id) || await db.cattle.get(Number(id));
    const targetId = animal ? animal.id : id;

    await db.cattle.update(targetId, {
      status: 'Muerto',
      deathDate: deathDate || new Date().toISOString().split('T')[0],
      deathReason: deathReason || 'Enfermedad',
      deathNotes: deathNotes || '',
    });

    cloudPushData(userId);
    showToast(`Bovino dado de baja por muerte y sincronizado ☁️`);
  };

  const handleRevertDeath = async (animalId) => {
    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    const targetId = animal ? animal.id : animalId;

    await db.cattle.update(targetId, {
      status: 'Activo',
      deathDate: null,
      deathReason: null,
      deathNotes: null,
    });

    cloudPushData(userId);
    showToast(`Bovino reactivado en el inventario ☁️`);
  };

  const handleRevertSale = async (animalId) => {
    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    const targetId = animal ? animal.id : animalId;

    await db.cattle.update(targetId, {
      status: 'Activo',
      exitDate: null,
      exitWeight: null,
      exitPrice: null,
      saleBuyer: null,
      saleReason: null,
      exitType: null,
      partnershipDetails: null,
    });

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

      await db.cattle.update(targetId, {
        currentWeight: parseFloat(item.weight),
      });
    }

    cloudPushData(userId);
    showToast(`Se guardaron y sincronizaron ${batch.length} pesajes ☁️`);
  };

  const handleDeleteAnimal = async (animalId) => {
    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    const targetId = animal ? animal.id : animalId;
    await db.cattle.delete(targetId);
    await db.weighings.where('cattleId').equals(String(targetId)).delete();
    cloudPushData(userId);
    showToast(`Animal eliminado y sincronizado en la nube ☁️`);
  };

  const handleManualSync = async () => {
    if (!userId) return;
    setIsSyncing(true);
    await syncCloudAndLocal(userId);
    setIsSyncing(false);
    showToast(`¡Sincronización con la nube completada! ☁️`);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Notificación de Actualización PWA / Versión */}
      <UpdateNotificationBanner />

      {/* Toast Notification Flotante */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-bounce bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400/40">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
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

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 mb-20 md:mb-8 space-y-6">
        
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

      <BatchEntryModal
        isOpen={isBatchEntryModalOpen}
        onClose={() => setIsBatchEntryModalOpen(false)}
        onSaveBatch={handleSaveBatchCattle}
      />

      <PartnershipSettlementModal
        isOpen={isPartnershipModalOpen}
        onClose={() => setIsPartnershipModalOpen(false)}
        cattle={cattle}
        weighings={weighings}
        onConfirmBatchSale={handleConfirmBatchSale}
      />

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <CattleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveAnimal}
        animal={editingAnimal}
      />

      <CattleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        animal={cattle.find(c => c.id === selectedAnimal?.id) || selectedAnimal}
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

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        animal={sellingAnimal}
        onConfirmSale={handleConfirmSale}
      />

      <DeathModal
        isOpen={isDeathModalOpen}
        onClose={() => setIsDeathModalOpen(false)}
        animal={deathAnimal}
        onConfirmDeath={handleConfirmDeath}
      />

      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        animal={weighingAnimal}
        onSaveWeight={handleSaveWeight}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDataChanged={() => {}}
      />

    </div>
  );
}
