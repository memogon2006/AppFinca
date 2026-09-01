import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase } from './services/db';
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
import { WeightLogModal } from './components/Weights/WeightLogModal';
import { ExportImportModal } from './components/Common/ExportImportModal';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingAnimal, setSellingAnimal] = useState(null);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weighingAnimal, setWeighingAnimal] = useState(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Inicializar base de datos
  useEffect(() => {
    async function init() {
      await initializeDatabase();
      setIsInitialized(true);
    }
    init();
  }, []);

  // Consultas reactivas a IndexedDB con Dexie
  const cattle = useLiveQuery(() => db.cattle.toArray(), []) || [];
  const weighings = useLiveQuery(() => db.weighings.toArray(), []) || [];

  // Conteo de animales activos
  const activeCount = cattle.filter(c => c.status === 'Activo').length;

  // Acciones CRUD
  const handleSaveAnimal = async (animalData) => {
    if (animalData.id) {
      await db.cattle.update(animalData.id, animalData);
    } else {
      const newId = String(Date.now());
      const newAnimal = { ...animalData, id: newId };
      await db.cattle.add(newAnimal);

      // Si tiene peso inicial, registrar también como primer pesaje en historial
      if (newAnimal.entryWeight) {
        await db.weighings.add({
          id: 'w_' + newId,
          cattleId: newId,
          date: newAnimal.entryDate,
          weight: parseFloat(newAnimal.entryWeight),
          conditionScore: 3.5,
          notes: 'Pesaje inicial de ingreso'
        });
      }
    }
    setIsFormModalOpen(false);
    setEditingAnimal(null);
  };

  const handleConfirmSale = async (animalId, saleUpdates) => {
    await db.cattle.update(animalId, saleUpdates);
    
    if (selectedAnimal && selectedAnimal.id === animalId) {
      setSelectedAnimal(prev => ({ ...prev, ...saleUpdates }));
    }
  };

  const handleRevertSale = async (animalId) => {
    await db.cattle.update(animalId, {
      status: 'Activo',
      exitDate: '',
      exitPrice: '',
      exitWeight: '',
      buyer: '',
      exitReason: '',
    });

    if (selectedAnimal && selectedAnimal.id === animalId) {
      setSelectedAnimal(prev => ({
        ...prev,
        status: 'Activo',
        exitDate: '',
        exitPrice: '',
        exitWeight: '',
        buyer: '',
        exitReason: '',
      }));
    }
  };

  const handleSaveWeight = async (animalId, weightData) => {
    const weighId = 'w_' + Date.now();
    await db.weighings.add({
      id: weighId,
      cattleId: animalId,
      date: weightData.date,
      weight: parseFloat(weightData.weight),
      conditionScore: parseFloat(weightData.conditionScore),
      notes: weightData.notes,
    });

    await db.cattle.update(animalId, {
      currentWeight: parseFloat(weightData.weight),
    });

    if (selectedAnimal && selectedAnimal.id === animalId) {
      setSelectedAnimal(prev => ({ ...prev, currentWeight: parseFloat(weightData.weight) }));
    }
  };

  const handleSaveBatchWeighings = async (batch) => {
    for (const item of batch) {
      const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      await db.weighings.add({
        id: weighId,
        cattleId: item.cattleId,
        date: item.date,
        weight: parseFloat(item.weight),
        conditionScore: item.conditionScore || 3.5,
        notes: item.notes || 'Pesaje masivo de báscula',
      });

      await db.cattle.update(item.cattleId, {
        currentWeight: parseFloat(item.weight),
      });
    }
  };

  const handleDeleteAnimal = async (animalId) => {
    await db.cattle.delete(animalId);
    await db.weighings.where('cattleId').equals(animalId).delete();
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

  const handleOpenAddWeight = (animal) => {
    setWeighingAnimal(animal);
    setIsWeightModalOpen(true);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <span className="text-4xl animate-bounce">🐂</span>
        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-base">Cargando INVENTARIO BOVINO APP...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Barra de Navegación */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenNewAnimal={handleOpenNew}
        onOpenExportImport={() => setIsExportModalOpen(true)}
        activeCattleCount={activeCount}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {currentView === 'dashboard' && (
          <DashboardView
            cattle={cattle}
            weighings={weighings}
            onNavigate={setCurrentView}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
          />
        )}

        {currentView === 'cattle' && (
          <CattleListView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
            onOpenSell={handleOpenSell}
            onOpenAddWeight={handleOpenAddWeight}
            onDeleteAnimal={handleDeleteAnimal}
          />
        )}

        {currentView === 'weights' && (
          <WeightsView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenAddWeight={handleOpenAddWeight}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'quickWeigh' && (
          <QuickWeighinView
            cattle={cattle}
            weighings={weighings}
            onSaveBatchWeighings={handleSaveBatchWeighings}
            onSelectAnimal={handleSelectAnimal}
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
          />
        )}

      </main>

      {/* MODALES */}

      <CattleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveAnimal}
        animal={editingAnimal}
      />

      <CattleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        animal={selectedAnimal}
        weighings={weighings}
        onOpenEdit={handleOpenEdit}
        onOpenSell={handleOpenSell}
        onOpenAddWeight={handleOpenAddWeight}
        onDelete={handleDeleteAnimal}
      />

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        animal={sellingAnimal}
        onConfirmSale={handleConfirmSale}
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
