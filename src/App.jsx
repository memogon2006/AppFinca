import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  initializeDatabase, 
  deleteDemoData, 
  isDemoAnimal, 
  logActivity,
  saveMilkRecord,
  saveBatchMilkRecords,
  deleteMilkRecord,
  saveMilkDelivery,
  deleteMilkDelivery,
  saveDailyMilkLog,
  deleteDailyMilkLog,
  saveMilkSettlement,
  deleteMilkSettlement
} from './services/db';
import { useAuth } from './context/AuthContext';
import { cloudPushData, syncCloudAndLocal, markPendingSync, markPendingDelete } from './services/cloudSync';
import { AuthView } from './components/Auth/AuthView';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { CattleListView } from './components/Cattle/CattleListView';
import { WeightsView } from './components/Weights/WeightsView';
import { QuickWeighinView } from './components/Weights/QuickWeighinView';
import { FemalesView } from './components/Females/FemalesView';
import { QuickPalpationView } from './components/Females/QuickPalpationView';
import { CalvingRecordModal } from './components/Females/CalvingRecordModal';
import { DairyView } from './components/Dairy/DairyView';
import { BatchAnalyticsView } from './components/Batches/BatchAnalyticsView';
import { PaddocksView } from './components/Paddocks/PaddocksView';
import { FinancesView } from './components/Finances/FinancesView';
import { AccountingView } from './components/Accounting/AccountingView';
import { ExpenseModal } from './components/Accounting/ExpenseModal';
import { IncomeModal } from './components/Accounting/IncomeModal';
import { CattleFormModal } from './components/Cattle/CattleFormModal';
import { CattleDetailModal } from './components/Cattle/CattleDetailModal';
import { SellModal } from './components/Cattle/SellModal';
import { DeathModal } from './components/Cattle/DeathModal';
import { WeightLogModal } from './components/Weights/WeightLogModal';
import { ExportImportModal } from './components/Common/ExportImportModal';
import { ProfileModal } from './components/Auth/ProfileModal';
import { WorkersManagementModal } from './components/Auth/WorkersManagementModal';
import { GlossaryModal } from './components/Common/GlossaryModal';
import { PartnershipSettlementModal } from './components/Finances/PartnershipSettlementModal';
import { BatchEntryModal } from './components/Cattle/BatchEntryModal';
import { WhatsAppReportModal } from './components/Common/WhatsAppReportModal';
import { FarmCalendarModal } from './components/Calendar/FarmCalendarModal';
import { VaccinationRecordModal } from './components/Vaccinations/VaccinationRecordModal';
import { VaccinationCensusModal } from './components/Vaccinations/VaccinationCensusModal';
import { InventoryChecklistModal } from './components/Checklist/InventoryChecklistModal';
import { ForcePasswordChangeModal } from './components/Auth/ForcePasswordChangeModal';
import { UpdateNotificationBanner } from './components/Common/UpdateNotificationBanner';
import { MembershipModal } from './components/Subscription/MembershipModal';
import { SubscriptionExpiredOverlay } from './components/Subscription/SubscriptionExpiredOverlay';
import { MasterAdminSubscriptionsModal } from './components/Subscription/MasterAdminSubscriptionsModal';
import { getSubscriptionStatus, canAddAnimal, isSuperAdmin } from './services/subscriptionService';
import { calculateWeightMetrics, formatCurrency, formatNumber, formatDate, getLocalDateString } from './services/calculations';
import { triggerFeedback } from './services/soundService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { saveActiveUIState, loadActiveUIState, clearActiveUIModal } from './services/draftService';
import { useActiveModules, MODULE_KEYS, autoActivateModulesForAnimal, setActiveModules, getActiveModules } from './services/moduleService';
import { CheckCircle2, Sparkles, Trash2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const { currentUser, isAuthenticated, loading: authLoading, isWorker, effectiveUserId } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWorkersModalOpen, setIsWorkersModalOpen] = useState(false);

  // Monitor de conexión en tiempo real & Auto-Sync al recuperar señal
  const { isOnline } = useOnlineStatus(() => {
    const targetSyncId = effectiveUserId || currentUser?.id;
    if (targetSyncId) {
      setIsSyncing(true);
      syncCloudAndLocal(targetSyncId)
        .then(() => {
          setIsSyncing(false);
          showToast('📡 ¡Señal recuperada! Datos sincronizados con la nube ☁️', 'success');
          triggerFeedback('success');
        })
        .catch(() => {
          setIsSyncing(false);
        });
    }
  });

  // Modales
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState(false);
  const [isCensusModalOpen, setIsCensusModalOpen] = useState(false);
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
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isMasterAdminModalOpen, setIsMasterAdminModalOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const [isCalvingModalOpen, setIsCalvingModalOpen] = useState(false);
  const [calvingMotherAnimal, setCalvingMotherAnimal] = useState(null);

  const handleOpenCalving = (motherAnimal = null) => {
    setCalvingMotherAnimal(motherAnimal);
    setIsCalvingModalOpen(true);
  };

  // Mostrar notificación de confirmación de acción
  const showToast = (text, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Limpieza automática de parámetros técnicos de la barra de direcciones (?_v=...) para una URL 100% limpia
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.has('_v')) {
        params.delete('_v');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        const cleanUrl = window.location.pathname + newSearch + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Inicializar base de datos con salvaguarda de timeout para arranque offline instantáneo
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const initPromise = initializeDatabase();
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 800));
        await Promise.race([initPromise, timeoutPromise]);
      } catch (err) {
        console.warn('Nota: inicialización de almacenamiento local:', err);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Restaurar vista y modal activo al recargar la aplicación si ya hay sesión previa
  const hasRestoredUIStateRef = useRef(false);
  useEffect(() => {
    if (hasRestoredUIStateRef.current) return;
    const savedUI = loadActiveUIState();
    if (savedUI) {
      hasRestoredUIStateRef.current = true;
      if (savedUI.currentView && typeof savedUI.currentView === 'string') {
        setCurrentView(savedUI.currentView);
      }
      if (savedUI.activeModal) {
        if (savedUI.activeModal === 'batchEntry') {
          setIsBatchEntryModalOpen(true);
        } else if (savedUI.activeModal === 'cattleForm') {
          setEditingAnimal(savedUI.modalPayload?.editingAnimal || null);
          setIsFormModalOpen(true);
        } else if (savedUI.activeModal === 'expense') {
          setEditingExpense(savedUI.modalPayload?.editingExpense || null);
          setIsExpenseModalOpen(true);
        } else if (savedUI.activeModal === 'income') {
          setEditingIncome(savedUI.modalPayload?.editingIncome || null);
          setIsIncomeModalOpen(true);
        } else if (savedUI.activeModal === 'calendar') {
          setIsCalendarOpen(true);
        } else if (savedUI.activeModal === 'checklist') {
          setIsChecklistOpen(true);
        }
      }
    }
  }, []);

  // Garantizar que al iniciar sesión o ingresar a la plataforma siempre se posicione en el Tablero Principal
  const prevUserRef = useRef(null);
  useEffect(() => {
    if (currentUser) {
      if (!prevUserRef.current || prevUserRef.current.id !== currentUser.id) {
        setCurrentView('dashboard');
        clearActiveUIModal();
        try {
          const saved = loadActiveUIState() || {};
          saveActiveUIState({ ...saved, currentView: 'dashboard', activeModal: null, modalPayload: null });
        } catch (e) {}

        // Sincronizar módulos específicos de la cuenta que acaba de ingresar
        const farmId = currentUser.role === 'worker' ? (currentUser.ownerId || currentUser.id) : currentUser.id;
        const currentModules = getActiveModules(farmId);
        window.dispatchEvent(new CustomEvent('ganado_modules_changed', { detail: currentModules }));
      }
    }
    prevUserRef.current = currentUser;
  }, [currentUser]);

  // Persistir automáticamente la vista y el modal activo en tiempo real
  useEffect(() => {
    let activeModal = null;
    let modalPayload = null;

    if (isBatchEntryModalOpen) {
      activeModal = 'batchEntry';
    } else if (isFormModalOpen) {
      activeModal = 'cattleForm';
      modalPayload = { editingAnimal };
    } else if (isExpenseModalOpen) {
      activeModal = 'expense';
      modalPayload = { editingExpense };
    } else if (isIncomeModalOpen) {
      activeModal = 'income';
      modalPayload = { editingIncome };
    } else if (isDetailModalOpen && selectedAnimal) {
      activeModal = 'cattleDetail';
      modalPayload = { animalId: selectedAnimal.id };
    } else if (isWeightModalOpen && weighingAnimal) {
      activeModal = 'weight';
      modalPayload = { animalId: weighingAnimal.id };
    } else if (isSellModalOpen && sellingAnimal) {
      activeModal = 'sell';
      modalPayload = { animalId: sellingAnimal.id };
    } else if (isDeathModalOpen && deathAnimal) {
      activeModal = 'death';
      modalPayload = { animalId: deathAnimal.id };
    } else if (isCalendarOpen) {
      activeModal = 'calendar';
    } else if (isChecklistOpen) {
      activeModal = 'checklist';
    }

    saveActiveUIState({
      currentView,
      activeModal,
      modalPayload
    });
  }, [
    currentView,
    isBatchEntryModalOpen,
    isFormModalOpen,
    editingAnimal,
    isExpenseModalOpen,
    editingExpense,
    isIncomeModalOpen,
    editingIncome,
    isDetailModalOpen,
    selectedAnimal,
    isWeightModalOpen,
    weighingAnimal,
    isSellModalOpen,
    sellingAnimal,
    isDeathModalOpen,
    deathAnimal,
    isCalendarOpen,
    isChecklistOpen
  ]);

  const userId = effectiveUserId || currentUser?.id;
  const subStatus = getSubscriptionStatus(currentUser);

  const { isModuleActive } = useActiveModules();

  // Redirigir a vista permitida si un trabajador o usuario intenta acceder a un módulo inactivo
  useEffect(() => {
    if (isWorker && (currentView === 'finances' || currentView === 'accounting')) {
      setCurrentView('dashboard');
    }
    if (currentView === 'batches' && !isModuleActive(MODULE_KEYS.CEBA_BATCHES)) {
      setCurrentView('dashboard');
    }
    if ((currentView === 'weights' || currentView === 'quickWeigh') && !isModuleActive(MODULE_KEYS.WEIGHTS)) {
      setCurrentView('dashboard');
    }
    if ((currentView === 'palpation' || currentView === 'females') && !isModuleActive(MODULE_KEYS.REPRODUCTION) && !isModuleActive(MODULE_KEYS.DAIRY)) {
      setCurrentView('dashboard');
    }
    if (currentView === 'dairy' && !isModuleActive(MODULE_KEYS.MILK) && !isModuleActive(MODULE_KEYS.DAIRY)) {
      setCurrentView('dashboard');
    }
  }, [isWorker, currentView, isModuleActive]);

  // Sincronización automática con la nube multi-dispositivo en tiempo real
  useEffect(() => {
    if (!userId) return;

    let isSyncingNow = false;
    async function sync() {
      if (isSyncingNow || !navigator.onLine) return;
      isSyncingNow = true;
      setIsSyncing(true);
      try {
        await syncCloudAndLocal(userId);
      } finally {
        setIsSyncing(false);
        isSyncingNow = false;
      }
    }

    // 1. Sincronizar de inmediato al entrar
    sync();

    // 2. Sincronizar al reconectarse, volver a la ventana o enfocar la pantalla
    const handleSyncTrigger = () => sync();
    window.addEventListener('online', handleSyncTrigger);
    window.addEventListener('focus', handleSyncTrigger);
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Sondeo en vivo cada 4 segundos para descargar cambios de otros dispositivos automáticamente
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        sync();
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleSyncTrigger);
      window.removeEventListener('focus', handleSyncTrigger);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(syncInterval);
    };
  }, [userId]);

  // Scroll automático al tope superior cada vez que se cambia de pestaña / vista
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  // Identificadores autorizados para consultar datos del predio (incluye dueño y trabajador)
  const allowedUserIds = new Set([
    userId,
    currentUser?.id,
    currentUser?.ownerId,
    effectiveUserId
  ].filter(Boolean));

  // Consultas reactivas filtradas por el usuario y predio activo (Multi-Tenancy)
  const cattle = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.cattle.filter(c => !c.userId || allowedUserIds.has(c.userId)).toArray();
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  // Restaurar modales asociados a un animal específico cuando el inventario esté listo
  const hasRestoredAnimalModalRef = useRef(false);
  useEffect(() => {
    if (hasRestoredAnimalModalRef.current || !cattle || cattle.length === 0) return;
    const savedUI = loadActiveUIState();
    if (savedUI && savedUI.activeModal && savedUI.modalPayload?.animalId) {
      const match = cattle.find(c => c.id === savedUI.modalPayload.animalId);
      if (match) {
        hasRestoredAnimalModalRef.current = true;
        if (savedUI.activeModal === 'cattleDetail') {
          setSelectedAnimal(match);
          setIsDetailModalOpen(true);
        } else if (savedUI.activeModal === 'weight') {
          setWeighingAnimal(match);
          setIsWeightModalOpen(true);
        } else if (savedUI.activeModal === 'sell') {
          setSellingAnimal(match);
          setIsSellModalOpen(true);
        } else if (savedUI.activeModal === 'death') {
          setDeathAnimal(match);
          setIsDeathModalOpen(true);
        }
      }
    }
  }, [cattle]);

  const weighings = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.weighings.filter(w => !w.userId || allowedUserIds.has(w.userId)).toArray();
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const vaccinations = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.vaccinations ? db.vaccinations.filter(v => !v.userId || allowedUserIds.has(v.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const audits = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.audits ? db.audits.filter(a => !a.userId || allowedUserIds.has(a.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const palpations = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.palpations ? db.palpations.filter(p => !p.userId || allowedUserIds.has(p.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const calendarNotes = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.calendarNotes ? db.calendarNotes.filter(n => !n.userId || allowedUserIds.has(n.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const farmExpenses = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.farmExpenses ? db.farmExpenses.filter(e => !e.userId || allowedUserIds.has(e.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const farmIncomes = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.farmIncomes ? db.farmIncomes.filter(i => !i.userId || allowedUserIds.has(i.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const paddocks = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.paddocks ? db.paddocks.filter(p => !p.userId || allowedUserIds.has(p.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const milkRecords = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.milkRecords ? db.milkRecords.filter(m => !m.userId || allowedUserIds.has(m.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const milkDeliveries = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.milkDeliveries ? db.milkDeliveries.filter(d => !d.userId || allowedUserIds.has(d.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const dailyMilkLogs = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.dailyMilkLogs ? db.dailyMilkLogs.filter(l => !l.userId || allowedUserIds.has(l.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
  ) || [];

  const milkSettlements = useLiveQuery(
    () => {
      if (!userId && !currentUser?.id) return [];
      return db.milkSettlements ? db.milkSettlements.filter(s => !s.userId || allowedUserIds.has(s.userId)).toArray() : [];
    },
    [userId, currentUser?.id, currentUser?.ownerId, effectiveUserId]
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

  // Sincronización Automática de Liquidaciones de Leche existentes hacia Contabilidad (farmIncomes)
  useEffect(() => {
    if (!userId || !milkSettlements || milkSettlements.length === 0 || !db.farmIncomes) return;

    const syncMissingMilkIncomes = async () => {
      try {
        let syncedCount = 0;
        for (const st of milkSettlements) {
          if (st.registerIncome !== false && st.totalValue > 0) {
            const incId = 'inc_milk_' + st.id;
            const existingInc = await db.farmIncomes.get(incId);
            if (!existingInc) {
              const incomeRecord = {
                id: incId,
                date: st.paymentDate || st.endDate || getLocalDateString(),
                concept: `Venta de Leche - Liquidación ${st.periodType?.toUpperCase() || 'QUINCENAL'} (${formatNumber(st.totalLiters, 1)} L @ ${formatCurrency(st.pricePerLiter)}) - ${st.buyer || 'Planta'}`,
                category: 'leche',
                amount: st.totalValue,
                paymentMethod: 'Transferencia',
                notes: `Liquidación período ${formatDate(st.startDate)} al ${formatDate(st.endDate)}. Comprador: ${st.buyer || 'N/A'}. Bonificaciones: ${formatCurrency(st.bonuses || 0)}, Deducciones: ${formatCurrency(st.deductions || 0)}`,
                settlementId: st.id,
                totalLiters: st.totalLiters,
                pricePerLiter: st.pricePerLiter,
                buyer: st.buyer,
                periodType: st.periodType,
                startDate: st.startDate,
                endDate: st.endDate,
                bonuses: st.bonuses || 0,
                deductions: st.deductions || 0,
                deductionsBreakdown: st.deductionsBreakdown || null,
                isMilkSettlement: true,
                userId: st.userId || userId,
                createdAt: st.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await db.farmIncomes.put(incomeRecord);
              markPendingSync(userId, incId);
              syncedCount++;
            }
          }
        }
        if (syncedCount > 0) {
          cloudPushData(userId);
        }
      } catch (e) {
        console.warn('Error auto-syncing milk settlements to farmIncomes:', e);
      }
    };

    syncMissingMilkIncomes();
  }, [userId, milkSettlements?.length]);

  // Sincronización automática de costos de vacunaciones históricas hacia farmExpenses
  useEffect(() => {
    if (!userId || !vaccinations || vaccinations.length === 0 || !db.farmExpenses) return;

    const syncMissingVaccinationExpenses = async () => {
      try {
        let syncedCount = 0;
        for (const vac of vaccinations) {
          const costVal = parseFloat(vac.cost) || 0;
          if (costVal > 0 && vac.registerExpense !== false) {
            const expId = 'exp_vac_' + vac.id;
            const existingExp = await db.farmExpenses.get(expId);
            if (!existingExp) {
              const expenseRecord = {
                id: expId,
                date: vac.date || getLocalDateString(),
                concept: `Vacunación / Plan Sanitario: ${vac.vaccineType || 'Vacuna'} (${vac.targetLabel || 'Hato'})${vac.officialCycle ? ` - ${vac.officialCycle}` : ''}`,
                category: 'sanidad',
                type: 'Variable',
                amount: costVal,
                paymentMethod: vac.paymentMethod || 'Efectivo',
                notes: `Registro oficial sanitario. RUV: ${vac.ruvNumber || 'N/A'}. Lote: ${vac.biologicalBatch || 'N/A'}. Vacunador: ${vac.vaccinator || 'N/A'}. Cobertura: ${vac.animalCount || 0} bovinos.${vac.notes ? ` Notas: ${vac.notes}` : ''}`,
                vaccinationId: vac.id,
                isVaccinationExpense: true,
                userId: vac.userId || userId,
                createdAt: vac.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await db.farmExpenses.put(expenseRecord);
              markPendingSync(userId, expId);
              syncedCount++;
            }
          }
        }
        if (syncedCount > 0) {
          cloudPushData(userId);
        }
      } catch (e) {
        console.warn('Error auto-syncing vaccination expenses to farmExpenses:', e);
      }
    };

    syncMissingVaccinationExpenses();
  }, [userId, vaccinations?.length]);

  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden p-0.5 animate-pulse">
          <img src="/icon-512.png" alt="Logo" className="w-full h-full object-cover rounded-2xl" />
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

    // Detectar y auto-activar módulos si el animal tiene características de leche, cría, IATF, compañía, lote, peso, etc.
    const activatedModules = autoActivateModulesForAnimal(animalData);

    if (animalData.id) {
      const updated = { ...animalData, userId };
      await db.cattle.put(updated);
      markPendingSync(userId, updated.id);

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
            markPendingSync(userId, initialWeighing.id);
          }
        } catch (e) {
          console.warn('Error sincronizando pesaje inicial:', e);
        }
      }

      // Actualizar inmediatamente el animal seleccionado si está abierto en CattleDetailModal
      if (selectedAnimal && String(selectedAnimal.id) === String(animalData.id)) {
        setSelectedAnimal(updated);
      }

      // Registrar acción en bitácora de auditoría
      await logActivity({
        action: 'animal_updated',
        description: `Modificó datos del bovino Chapa #${animalData.tagNumber || 'S/N'}${animalData.color ? ` (Color: ${animalData.color})` : ''}${animalData.sex ? ` (Sexo: ${animalData.sex})` : ''}${animalData.entryBatch ? ` (Lote: ${animalData.entryBatch})` : ''}${animalData.entryWeight ? ` (Peso entrada: ${animalData.entryWeight} kg)` : ''}${animalData.category ? ` (Categoría: ${animalData.category})` : ''}`,
        tagNumber: animalData.tagNumber,
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      setIsFormModalOpen(false);
      setEditingAnimal(null);
      cloudPushData(userId);
      triggerFeedback('single');
      if (activatedModules && activatedModules.length > 0) {
        showToast(`✨ Modificado Chapa #${animalData.tagNumber}. Se activaron: ${activatedModules.join(', ')}`, 'success');
      } else {
        showToast(`Bovino ${animalData.tagNumber} actualizado y sincronizado en la nube ☁️`);
      }
    } else {
      const newId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const created = {
        ...animalData,
        id: newId,
        userId,
        createdAt: new Date().toISOString(),
      };
      await db.cattle.put(created);
      markPendingSync(userId, newId);

      if (created.entryWeight && parseFloat(created.entryWeight) > 0) {
        const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await db.weighings.put({
          id: weighId,
          cattleId: String(newId),
          userId,
          date: created.entryDate || getLocalDateString(),
          weight: parseFloat(created.entryWeight),
          conditionScore: 3.5,
          notes: 'Peso inicial de registro',
        });
        markPendingSync(userId, weighId);
      }

      // Registrar acción en bitácora de auditoría
      await logActivity({
        action: 'animal_created',
        description: `Ingresó bovino nuevo Chapa #${created.tagNumber || 'S/N'}${created.entryWeight ? ` (Peso inicial: ${created.entryWeight} kg)` : ''}${created.color ? `, Color: ${created.color}` : ''}${created.sex ? `, Sexo: ${created.sex}` : ''}${created.category ? `, Categoría: ${created.category}` : ''}${created.entryBatch ? `, Lote: ${created.entryBatch}` : ''}${created.origin ? `, Procedencia: ${created.origin}` : ''}`,
        tagNumber: created.tagNumber,
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      setIsFormModalOpen(false);
      setEditingAnimal(null);
      cloudPushData(userId);
      triggerFeedback('single');
      if (activatedModules && activatedModules.length > 0) {
        showToast(`✨ ¡Bovino #${created.tagNumber} guardado! Se activaron: ${activatedModules.join(', ')}`, 'success');
      } else {
        showToast(`¡Bovino ${created.tagNumber} registrado y sincronizado en la nube! ☁️`);
      }
    }
  };

  // Guardar Registro de Parto & Programación de Destete Automático
  const handleSaveCalving = async (calvingData) => {
    if (!userId || !calvingData) return;
    const { mother, calvingDate, calvingType, calvingEase, motherPostStatus, selectedPaddock, scheduleWeaning, weaningDate, weaningMonths, fatherType, fatherTag, fatherId, notes, calves } = calvingData;

    try {
      const createdCalvesList = [];

      // 1. Crear cría(s) en db.cattle y registrar pesaje inicial al nacer
      for (const calf of calves) {
        const calfId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const calfAnimal = {
          id: calfId,
          tagNumber: String(calf.tagNumber || '').trim(),
          name: String(calf.name || '').trim(),
          sex: calf.sex || 'Macho',
          category: calf.category || (calf.sex === 'Hembra' ? 'Ternera' : 'Ternero'),
          productionType: motherPostStatus === 'Producción de leche' ? 'Lechería' : (motherPostStatus === 'Doble Propósito' ? 'Doble Propósito' : (mother?.productionType || 'Cría')),
          status: 'Activo',
          entryType: 'Nacimiento',
          entryDate: calvingDate || getLocalDateString(),
          birthDate: calvingDate || getLocalDateString(),
          entryWeight: parseFloat(calf.birthWeight) || 35,
          currentWeight: parseFloat(calf.birthWeight) || 35,
          entryPrice: 0,
          motherId: String(mother?.id || ''),
          motherTag: String(mother?.tagNumber || ''),
          fatherId: String(fatherId || ''),
          fatherTag: String(fatherTag || ''),
          fatherType: fatherType || 'Monta Natural',
          ironBrand: mother?.ironBrand || '',
          owner: mother?.owner || 'Hacienda Principal',
          paddock: selectedPaddock || mother?.paddock || '',
          entryBatch: `Cría #${mother?.tagNumber || 'S/N'}`,
          color: calf.color || mother?.color || 'Sin color',
          breed: calf.breed || mother?.breed || 'Cebú Comercial',
          birthCalvingType: calvingType,
          birthCalvingEase: calvingEase,
          vigor: calf.vigor || 'Vigoroso',
          navelTreated: Boolean(calf.navelTreated),
          colostrumConsumed: Boolean(calf.colostrumConsumed),
          weaningPlannedDate: scheduleWeaning ? (weaningDate || null) : null,
          isWeaned: false,
          notes: notes ? `Parto ${calvingType}. ${notes}` : `Parto ${calvingType}.`,
          userId,
          createdAt: new Date().toISOString(),
        };

        await db.cattle.put(calfAnimal);
        markPendingSync(userId, calfId);
        createdCalvesList.push(calfAnimal);

        // Pesaje inicial al nacer
        if (calf.birthWeight && parseFloat(calf.birthWeight) > 0) {
          const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          await db.weighings.put({
            id: weighId,
            cattleId: String(calfId),
            userId,
            date: calvingDate || getLocalDateString(),
            weight: parseFloat(calf.birthWeight),
            conditionScore: 3.5,
            notes: `Peso al nacer (Parto ${calvingType}${calf.vigor ? ` - ${calf.vigor}` : ''})`,
          });
          markPendingSync(userId, weighId);
        }

        // Tarea / Alerta de Destete en Calendario
        if (scheduleWeaning && weaningDate && db.calendarNotes) {
          const noteId = 'cn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          await db.calendarNotes.put({
            id: noteId,
            date: weaningDate,
            title: `🍼 Destete programado: Cría #${calf.tagNumber} (Madre: #${mother?.tagNumber || 'S/N'})`,
            category: 'reproduccion',
            completed: false,
            notes: `Cría ${calf.category} #${calf.tagNumber} nacida el ${calvingDate}. Peso al nacer: ${calf.birthWeight} kg. Destete programado a los ${weaningMonths || 7} meses. Realizar pesaje de destete y separación de lote.`,
            cattleId: String(calfId),
            motherId: String(mother?.id || ''),
            userId,
            createdAt: new Date().toISOString(),
          });
          markPendingSync(userId, noteId);
        }
      }

      // 2. Actualizar estado productivo y reproductivo de la madre
      if (mother?.id) {
        let updatedFemaleStatuses = ['Levante de cría'];
        let entersMilking = false;
        if (motherPostStatus === 'Producción de leche') {
          updatedFemaleStatuses = ['Producción de leche'];
          entersMilking = true;
        } else if (motherPostStatus === 'Doble Propósito') {
          updatedFemaleStatuses = ['Producción de leche', 'Levante de cría'];
          entersMilking = true;
        }

        const updatedMother = {
          ...mother,
          femaleStatuses: updatedFemaleStatuses,
          femaleStatus: updatedFemaleStatuses.join(', '),
          reproductiveStatus: 'Parida / Lactancia',
          serviceDate: '', // Resetea gestación activa anterior
          expectedCalvingDate: '',
          pregnancyDays: '',
          lastCalvingDate: calvingDate,
          totalCalvings: (parseInt(mother.totalCalvings) || 0) + 1,
          paddock: selectedPaddock || mother.paddock,
          milkingStatus: entersMilking ? 'En ordeño' : (mother.milkingStatus === 'En ordeño' ? 'En ordeño' : 'Seca'),
          daysInMilk: entersMilking ? 0 : (mother.daysInMilk || 0),
          lactationNumber: entersMilking ? ((parseInt(mother.lactationNumber) || 0) + 1) : (mother.lactationNumber || 1),
          userId,
          updatedAt: new Date().toISOString()
        };
        await db.cattle.put(updatedMother);
        markPendingSync(userId, updatedMother.id);

        if (selectedAnimal && String(selectedAnimal.id) === String(mother.id)) {
          setSelectedAnimal(updatedMother);
        }
      }

      // 3. Registrar en Bitácora de Auditoría
      const calfTagsStr = calves.map(c => `#${c.tagNumber} (${c.sex}, ${c.birthWeight} kg)`).join(', ');
      await logActivity({
        action: 'calving_registered',
        description: `Registró parto ${calvingType} de vaca #${mother?.tagNumber || 'S/N'}. Nacimiento de cría(s): ${calfTagsStr}. Destete programado para el ${weaningDate ? formatDate(weaningDate) : 'N/A'}.`,
        tagNumber: mother?.tagNumber || calves[0]?.tagNumber || '',
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      // Auto-activación de módulos de cría / reproducción si corresponde
      autoActivateModulesForAnimal({ sex: 'Hembra', femaleStatus: 'Levante de cría' });

      // 4. Finalizar y sincronizar
      setIsCalvingModalOpen(false);
      setCalvingMotherAnimal(null);
      cloudPushData(userId);
      triggerFeedback('single');
      showToast(`🍼 ¡Parto registrado exitosamente! Cría(s) ${calves.map(c => `#${c.tagNumber}`).join(', ')} agregada(s) al hato.`);
    } catch (err) {
      console.error('Error al guardar parto:', err);
      showToast('Ocurrió un error al registrar el parto.', 'error');
    }
  };

  // Guardar Lote Completo de Bovinos
  const handleSaveBatchCattle = async (batchAnimals) => {
    if (!userId || !batchAnimals || batchAnimals.length === 0) return;

    // Auto-activación de módulos para todos los animales del lote
    const allActivated = new Set();
    for (const bAnimal of batchAnimals) {
      const newly = autoActivateModulesForAnimal(bAnimal);
      if (Array.isArray(newly)) {
        newly.forEach(m => allActivated.add(m));
      }
    }
    const activatedList = Array.from(allActivated);

    const createdIds = [];
    for (let i = 0; i < batchAnimals.length; i++) {
      const animalData = batchAnimals[i];
      const newId = 'c_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4);
      const created = {
        ...animalData,
        id: newId,
        userId,
        createdAt: new Date().toISOString(),
      };
      await db.cattle.put(created);
      createdIds.push(newId);

      if (created.entryWeight && parseFloat(created.entryWeight) > 0) {
        const weighId = 'w_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4);
        await db.weighings.put({
          id: weighId,
          cattleId: String(newId),
          userId,
          date: created.entryDate || getLocalDateString(),
          weight: parseFloat(created.entryWeight),
          conditionScore: 3.5,
          notes: 'Peso inicial de registro por lote',
        });
        createdIds.push(weighId);
      }
    }
    markPendingSync(userId, ...createdIds);

    // Registrar acción en bitácora de auditoría
    const batchTags = batchAnimals.slice(0, 5).map(a => '#' + a.tagNumber).join(', ');
    const extraCount = batchAnimals.length > 5 ? ` y ${batchAnimals.length - 5} más` : '';
    await logActivity({
      action: 'batch_created',
      description: `Ingresó lote de ${batchAnimals.length} bovinos nuevos (Chapas: ${batchTags}${extraCount})${batchAnimals[0]?.entryBatch ? ` en Lote: ${batchAnimals[0].entryBatch}` : ''}${batchAnimals[0]?.sex ? ` (Sexo: ${batchAnimals[0].sex})` : ''}${batchAnimals[0]?.entryWeight ? ` (Peso: ${batchAnimals[0].entryWeight} kg)` : ''}`,
      tagNumber: batchAnimals.length === 1 ? batchAnimals[0].tagNumber : `${batchAnimals[0]?.tagNumber || ''}-${batchAnimals[batchAnimals.length - 1]?.tagNumber || ''}`,
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    setIsBatchEntryModalOpen(false);
    cloudPushData(userId);
    triggerFeedback('batch');
    if (activatedList.length > 0) {
      showToast(`¡Lote guardado! Se activaron automáticamente: ${activatedList.join(', ')} 🚀`, 'success');
    } else {
      showToast(`¡Lote de ${batchAnimals.length} bovinos registrado y guardado exitosamente! 📦☁️`, 'success');
    }
  };

  const handleSaveWeight = async ({ cattleId, date, weight, conditionScore, notes }) => {
    if (!userId) return;
    if (!isModuleActive(MODULE_KEYS.WEIGHTS)) {
      setActiveModules({ [MODULE_KEYS.WEIGHTS]: true });
    }
    const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const animal = await db.cattle.get(cattleId) || await db.cattle.get(Number(cattleId));
    const targetId = animal ? animal.id : cattleId;

    await db.weighings.put({
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

    markPendingSync(userId, weighId, targetId);

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'weighing',
      description: `Registró pesaje de ${weight} kg para el bovino Chapa #${animal?.tagNumber || targetId}${conditionScore ? ` (Condición: ${conditionScore}/5)` : ''}${notes ? ` (Nota: "${notes}")` : ''}`,
      tagNumber: animal?.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    setIsWeightModalOpen(false);
    setWeighingAnimal(null);
    cloudPushData(userId);
    triggerFeedback('single');
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
      markPendingDelete(userId, 'weighings', targetWeighing.id);
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
      markPendingSync(userId, animal.id);

      if (selectedAnimal && String(selectedAnimal.id) === String(animal.id)) {
        setSelectedAnimal(prev => ({
          ...prev,
          currentWeight: newCurrentWeight > 0 ? newCurrentWeight : undefined,
        }));
      }
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'weight_deleted',
      description: `Eliminó registro de pesaje de ${targetWeighing?.weight || weight || ''} kg del bovino Chapa #${animal?.tagNumber || cattleId}${date ? ` (Fecha: ${date})` : ''}`,
      tagNumber: animal?.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
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
    markPendingSync(userId, targetId);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...saleUpdates }));
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'sale',
      description: `Liquidó venta de bovino Chapa #${animal?.tagNumber || targetId}${exitWeight ? ` (Peso salida: ${exitWeight} kg)` : ''}${exitPrice ? ` (Valor: $${parseFloat(exitPrice).toLocaleString('es-CO')})` : ''}${saleBuyer ? ` (Comprador: ${saleBuyer})` : ''}${exitType ? ` (Modalidad: ${exitType})` : ''}`,
      tagNumber: animal?.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    setIsSellModalOpen(false);
    setSellingAnimal(null);
    cloudPushData(userId);
    triggerFeedback('single');
    showToast(`Venta liquidada y sincronizada en la nube ☁️`);
  };

  const handleConfirmBatchSale = async (batchList) => {
    if (!userId || !batchList || batchList.length === 0) return;

    const updatedIds = [];
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
      updatedIds.push(targetId);
    }
    markPendingSync(userId, ...updatedIds);

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'sale_batch',
      description: `Liquidó venta grupal de ${batchList.length} bovinos en compañía (Comprador: ${batchList[0]?.saleBuyer || 'Venta grupal'}, Modalidad: ${batchList[0]?.exitType || 'En Compañía'})`,
      tagNumber: `${batchList.length} bovinos`,
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('batch');
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
      deathDate: deathDate || getLocalDateString(),
      deathReason: deathReason || 'Enfermedad',
      deathNotes: deathNotes || '',
    };

    await db.cattle.update(targetId, deathUpdates);
    markPendingSync(userId, targetId);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...deathUpdates }));
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'death',
      description: `Reportó baja por muerte del bovino Chapa #${animal?.tagNumber || targetId} (Causa: ${deathReason || 'Enfermedad'}${deathDate ? `, Fecha: ${deathDate}` : ''}${deathNotes ? `, Notas: "${deathNotes}"` : ''})`,
      tagNumber: animal?.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    setIsDeathModalOpen(false);
    setDeathAnimal(null);
    cloudPushData(userId);
    triggerFeedback('warning');
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
    markPendingSync(userId, targetId);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...revertUpdates }));
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'death_reverted',
      description: `Reactivó en inventario activo el bovino Chapa #${animal?.tagNumber || targetId} (Anuló reporte de muerte)`,
      tagNumber: animal?.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

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
    markPendingSync(userId, targetId);

    if (selectedAnimal && String(selectedAnimal.id) === String(targetId)) {
      setSelectedAnimal(prev => ({ ...prev, ...revertUpdates }));
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'sale_reverted',
      description: `Anuló venta y reincorporó al inventario activo el bovino Chapa #${animal?.tagNumber || targetId}`,
      tagNumber: animal?.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    showToast(`Venta anulada. El animal volvió al inventario activo ☁️`);
  };

  const handleSaveBatchWeighings = async (batch) => {
    if (!userId) return;
    if (!isModuleActive(MODULE_KEYS.WEIGHTS)) {
      setActiveModules({ [MODULE_KEYS.WEIGHTS]: true });
    }
    const syncIds = [];
    for (const item of batch) {
      const weighId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const animal = await db.cattle.get(item.cattleId) || await db.cattle.get(Number(item.cattleId));
      const targetId = animal ? animal.id : item.cattleId;

      await db.weighings.put({
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
      syncIds.push(weighId, targetId);
    }
    markPendingSync(userId, ...syncIds);

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'weighing_batch',
      description: `Registró pesajes masivos en báscula para ${batch.length} bovinos (Fecha: ${batch[0]?.date || getLocalDateString()})`,
      tagNumber: `${batch.length} bovinos`,
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    showToast(`Se guardaron y sincronizaron ${batch.length} pesajes ☁️`);
  };

  const handleDeleteAnimal = async (animalId) => {
    if (!animalId && animalId !== 0) return;

    // 1. Localizar el animal por ID numérico o string
    const animal = (await db.cattle.get(animalId)) || 
                   (!isNaN(Number(animalId)) ? await db.cattle.get(Number(animalId)) : null) ||
                   (await db.cattle.filter(c => String(c.id) === String(animalId)).first());

    const targetId = animal ? animal.id : animalId;
    const tag = animal?.tagNumber || 'Bovino';

    // 2. Marcar de inmediato en la lista de eliminaciones pendientes y tombstones
    const deleteIds = [String(targetId), String(animalId)];
    if (!isNaN(Number(targetId))) deleteIds.push(String(Number(targetId)));
    if (!isNaN(Number(animalId))) deleteIds.push(String(Number(animalId)));
    markPendingDelete(userId, 'cattle', ...deleteIds);

    // 3. Eliminar de IndexedDB con todas las variantes de ID
    await db.cattle.delete(targetId).catch(() => null);
    if (!isNaN(Number(targetId))) {
      await db.cattle.delete(Number(targetId)).catch(() => null);
    }
    await db.cattle.delete(String(targetId)).catch(() => null);
    await db.cattle.filter(c => String(c.id) === String(targetId) || String(c.id) === String(animalId)).delete().catch(() => null);

    // 4. Eliminar registros vinculados (pesajes, palpaciones)
    const idStrings = new Set(deleteIds);
    const relatedWeighings = await db.weighings.filter(w => idStrings.has(String(w.cattleId))).toArray();
    if (relatedWeighings.length > 0) {
      const wIds = relatedWeighings.map(w => String(w.id));
      await db.weighings.filter(w => idStrings.has(String(w.cattleId))).delete().catch(() => null);
      markPendingDelete(userId, 'weighings', ...wIds);
    }

    if (db.palpations) {
      const relatedPalpations = await db.palpations.filter(p => idStrings.has(String(p.cattleId))).toArray();
      if (relatedPalpations.length > 0) {
        const pIds = relatedPalpations.map(p => String(p.id));
        await db.palpations.filter(p => idStrings.has(String(p.cattleId))).delete().catch(() => null);
        markPendingDelete(userId, 'palpations', ...pIds);
      }
    }

    if (selectedAnimal && idStrings.has(String(selectedAnimal.id))) {
      setIsDetailModalOpen(false);
      setSelectedAnimal(null);
    }

    // 5. Registrar en bitácora de auditoría
    await logActivity({
      action: 'animal_deleted',
      description: `Eliminó del inventario el bovino Chapa #${animal?.tagNumber || tag}${animal?.color ? ` (Color: ${animal.color})` : ''}${animal?.sex ? ` (Sexo: ${animal.sex})` : ''}${animal?.entryBatch ? ` (Lote: ${animal.entryBatch})` : ''}${animal?.currentWeight ? ` (Peso: ${animal.currentWeight} kg)` : ''}`,
      tagNumber: animal?.tagNumber || tag,
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    // 6. Subir de inmediato y de forma segura a Firebase
    await cloudPushData(userId);
    showToast(`Bovino ${tag} eliminado del inventario 🗑️`, 'danger');
  };

  const handleSaveVaccination = async (vaccinationData) => {
    if (!userId) return;
    const vacRecord = {
      ...vaccinationData,
      userId
    };
    if (db.vaccinations) {
      await db.vaccinations.put(vacRecord);
      markPendingSync(userId, vacRecord.id);
    }

    // 1. Integración Financiera Automática: Registrar en farmExpenses si tiene costo
    const vacCost = parseFloat(vacRecord.cost) || 0;
    if (vacCost > 0 && vacRecord.registerExpense !== false && db.farmExpenses) {
      const expId = 'exp_vac_' + vacRecord.id;
      const expenseRecord = {
        id: expId,
        date: vacRecord.date || getLocalDateString(),
        concept: `Vacunación / Plan Sanitario: ${vacRecord.vaccineType || 'Vacuna'} (${vacRecord.targetLabel || 'Hato'})${vacRecord.officialCycle ? ` - ${vacRecord.officialCycle}` : ''}`,
        category: 'sanidad',
        type: 'Variable',
        amount: vacCost,
        paymentMethod: vacRecord.paymentMethod || 'Efectivo',
        notes: `Registro oficial sanitario. RUV: ${vacRecord.ruvNumber || 'N/A'}. Lote: ${vacRecord.biologicalBatch || 'N/A'}. Vacunador: ${vacRecord.vaccinator || 'N/A'}. Cobertura: ${vacRecord.animalCount || 0} bovinos.${vacRecord.notes ? ` Notas: ${vacRecord.notes}` : ''}`,
        vaccinationId: vacRecord.id,
        isVaccinationExpense: true,
        userId,
        createdAt: vacRecord.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.farmExpenses.put(expenseRecord);
      markPendingSync(userId, expId);
    }

    // 2. Si tiene revacunación/refuerzo programado, agendar automáticamente en el calendario de la finca
    if (vacRecord.requiresBooster && vacRecord.boosterDate && db.calendarNotes) {
      const noteId = 'note_booster_' + vacRecord.id;
      await db.calendarNotes.put({
        id: noteId,
        date: vacRecord.boosterDate,
        title: `💉 Revacunación: ${vacRecord.vaccineType} (${vacRecord.targetLabel || 'Hato'})`,
        category: 'sanitary',
        completed: false,
        userId,
        createdAt: new Date().toISOString()
      }).catch(() => null);
      markPendingSync(userId, noteId);
    }

    // 3. Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'vaccination',
      description: `Registró vacunación/sanidad: ${vaccinationData.vaccineType || 'Vacuna'} (${vaccinationData.batchName ? `Lote: ${vaccinationData.batchName}` : `Chapa #${vaccinationData.tagNumber || 'General'}`}${vaccinationData.officialCycle ? `, Ciclo: ${vaccinationData.officialCycle}` : ''}${vaccinationData.ruvNumber ? `, RUV: ${vaccinationData.ruvNumber}` : ''}${vacCost > 0 ? ` • Costo: ${formatCurrency(vacCost)}` : ''}${vaccinationData.requiresBooster ? ` • Refuerzo en ${vaccinationData.boosterDays}d (${vaccinationData.boosterDate})` : ''})`,
      tagNumber: vaccinationData.tagNumber || vaccinationData.batchName || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('success');
    showToast(`Registro sanitario de ${vaccinationData.vaccineType} guardado exitosamente 💉${vacCost > 0 ? ` (Gasto de ${formatCurrency(vacCost)} registrado en Finanzas 💰)` : ''}${vaccinationData.requiresBooster ? ' (Alarma de refuerzo configurada)' : ''}`);
  };

  const handleCompleteBooster = async (vacId) => {
    if (!userId || !db.vaccinations) return;
    const vac = await db.vaccinations.get(vacId);
    if (!vac) return;

    const completedAt = new Date().toISOString();
    await db.vaccinations.update(vacId, {
      boosterCompleted: true,
      boosterCompletedAt: completedAt
    });
    markPendingSync(userId, vacId);

    if (db.calendarNotes) {
      const noteId = 'note_booster_' + vacId;
      const note = await db.calendarNotes.get(noteId);
      if (note) {
        await db.calendarNotes.update(noteId, { completed: true });
        markPendingSync(userId, noteId);
      }
    }

    await logActivity({
      action: 'booster_completed',
      description: `Marcó revacunación/refuerzo como aplicada: ${vac.vaccineType || 'Vacuna'} (${vac.targetLabel || 'Hato'})`,
      tagNumber: vac.targetLabel || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('success');
    showToast(`¡Revacunación de ${vac.vaccineType} marcada como completada! 🎉`);
  };

  const handleDeleteVaccination = async (vacId) => {
    if (!userId || !db.vaccinations) return;
    await db.vaccinations.delete(vacId);
    markPendingDelete(userId, 'vaccinations', vacId);

    if (db.calendarNotes) {
      const noteId = 'note_booster_' + vacId;
      await db.calendarNotes.delete(noteId).catch(() => null);
      markPendingDelete(userId, 'calendarNotes', noteId);
    }

    if (db.farmExpenses) {
      const expId = 'exp_vac_' + vacId;
      await db.farmExpenses.delete(expId).catch(() => null);
      markPendingDelete(userId, 'farmExpenses', expId);
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'vaccination_deleted',
      description: `Eliminó registro de vacunación / plan sanitario`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Registro de vacunación y gasto sanitario eliminados 🗑️');
  };

  const handleSavePalpation = async (palpationData) => {
    if (!userId) return;
    if (!isModuleActive(MODULE_KEYS.REPRODUCTION)) {
      setActiveModules({ [MODULE_KEYS.REPRODUCTION]: true });
    }
    const { animalId, tagNumber, date, diagnosis, pregnancyDays, serviceDate, expectedCalvingDate, findings, bodyCondition, veterinarian, method, notes, recheckDays } = palpationData;

    const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
    if (!animal) return;

    let currentStatuses = Array.isArray(animal.femaleStatuses) ? [...animal.femaleStatuses] : (animal.femaleStatus ? [animal.femaleStatus] : ['Vacía']);

    if (diagnosis === 'Preñada') {
      currentStatuses = currentStatuses.filter(s => s !== 'Vacía');
      if (!currentStatuses.includes('Gestación')) {
        currentStatuses.push('Gestación');
      }
    } else if (diagnosis === 'Vacía') {
      currentStatuses = currentStatuses.filter(s => s !== 'Gestación');
      if (currentStatuses.length === 0 || (!currentStatuses.includes('Producción de leche') && !currentStatuses.includes('Levante de cría') && !currentStatuses.includes('Ceba / Levante / Engorde'))) {
        if (!currentStatuses.includes('Vacía')) currentStatuses.push('Vacía');
      }
    }

    const animalUpdates = {
      femaleStatuses: currentStatuses,
      femaleStatus: currentStatuses.join(', '),
      reproductiveStatus: diagnosis === 'Preñada' ? 'Preñada' : 'Vacía',
      pregnancyDays: diagnosis === 'Preñada' ? (parseInt(pregnancyDays) || 0) : 0,
      serviceDate: diagnosis === 'Preñada' ? (serviceDate || '') : '',
      expectedCalvingDate: diagnosis === 'Preñada' ? (expectedCalvingDate || '') : '',
      lastPalpationDate: date,
      lastPalpationDiagnosis: diagnosis,
      lastPalpationFindings: findings,
      bodyCondition: bodyCondition || animal.bodyCondition || '3.0',
      lastPalpationVet: veterinarian || '',
    };

    await db.cattle.update(animal.id, animalUpdates);
    markPendingSync(userId, animal.id);

    if (db.palpations) {
      const palpId = 'palp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      await db.palpations.put({
        id: palpId,
        cattleId: String(animal.id),
        tagNumber: tagNumber || animal.tagNumber,
        date,
        diagnosis,
        pregnancyDays: diagnosis === 'Preñada' ? (parseInt(pregnancyDays) || 0) : 0,
        serviceDate: serviceDate || '',
        expectedCalvingDate: expectedCalvingDate || '',
        findings: findings || [],
        bodyCondition: bodyCondition || '3.0',
        veterinarian: veterinarian || '',
        method: method || 'Palpación Rectal',
        notes: notes || '',
        recheckDays: recheckDays || '',
        userId,
        createdAt: new Date().toISOString()
      });
      markPendingSync(userId, palpId);
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'palpation',
      description: `Registró palpación ginecológica en hembra Chapa #${tagNumber || animal.tagNumber}: Diagnóstico "${diagnosis}"${diagnosis === 'Preñada' && pregnancyDays ? ` (~${pregnancyDays} días de gestación, FPP: ${expectedCalvingDate || 'Por calcular'})` : ''}${veterinarian ? ` (Palpador: ${veterinarian})` : ''}${findings && findings.length > 0 ? ` (Hallazgos: ${findings.join(', ')})` : ''}`,
      tagNumber: tagNumber || animal.tagNumber || '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    showToast(`Diagnóstico de ${animal.tagNumber} (${diagnosis}) guardado y sincronizado 🩺☁️`);
  };

  const handleSaveBatchPalpations = async (batchPalpations) => {
    if (!userId || !batchPalpations || batchPalpations.length === 0) return;
    if (!isModuleActive(MODULE_KEYS.REPRODUCTION)) {
      setActiveModules({ [MODULE_KEYS.REPRODUCTION]: true });
    }

    const syncIds = [];
    for (const pData of batchPalpations) {
      const { animalId, tagNumber, date, diagnosis, pregnancyDays, serviceDate, expectedCalvingDate, findings, bodyCondition, veterinarian, method, notes, recheckDays } = pData;
      const animal = await db.cattle.get(animalId) || await db.cattle.get(Number(animalId));
      if (!animal) continue;

      let currentStatuses = Array.isArray(animal.femaleStatuses) ? [...animal.femaleStatuses] : (animal.femaleStatus ? [animal.femaleStatus] : ['Vacía']);

      if (diagnosis === 'Preñada') {
        currentStatuses = currentStatuses.filter(s => s !== 'Vacía');
        if (!currentStatuses.includes('Gestación')) {
          currentStatuses.push('Gestación');
        }
      } else if (diagnosis === 'Vacía') {
        currentStatuses = currentStatuses.filter(s => s !== 'Gestación');
        if (currentStatuses.length === 0 || (!currentStatuses.includes('Producción de leche') && !currentStatuses.includes('Levante de cría') && !currentStatuses.includes('Ceba / Levante / Engorde'))) {
          if (!currentStatuses.includes('Vacía')) currentStatuses.push('Vacía');
        }
      }

      const animalUpdates = {
        femaleStatuses: currentStatuses,
        femaleStatus: currentStatuses.join(', '),
        reproductiveStatus: diagnosis === 'Preñada' ? 'Preñada' : 'Vacía',
        pregnancyDays: diagnosis === 'Preñada' ? (parseInt(pregnancyDays) || 0) : 0,
        serviceDate: diagnosis === 'Preñada' ? (serviceDate || '') : '',
        expectedCalvingDate: diagnosis === 'Preñada' ? (expectedCalvingDate || '') : '',
        lastPalpationDate: date,
        lastPalpationDiagnosis: diagnosis,
        lastPalpationFindings: findings,
        bodyCondition: bodyCondition || animal.bodyCondition || '3.0',
        lastPalpationVet: veterinarian || '',
      };

      await db.cattle.update(animal.id, animalUpdates);
      syncIds.push(animal.id);

      if (db.palpations) {
        const palpId = 'palp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await db.palpations.put({
          id: palpId,
          cattleId: String(animal.id),
          tagNumber: tagNumber || animal.tagNumber,
          date,
          diagnosis,
          pregnancyDays: diagnosis === 'Preñada' ? (parseInt(pregnancyDays) || 0) : 0,
          serviceDate: serviceDate || '',
          expectedCalvingDate: expectedCalvingDate || '',
          findings: findings || [],
          bodyCondition: bodyCondition || '3.0',
          veterinarian: veterinarian || '',
          method: method || 'Palpación Rectal',
          notes: notes || '',
          recheckDays: recheckDays || '',
          userId,
          createdAt: new Date().toISOString()
        });
        syncIds.push(palpId);
      }
    }
    markPendingSync(userId, ...syncIds);

    // Registrar acción en bitácora de auditoría
    const pregnantCount = batchPalpations.filter(p => p.diagnosis === 'Preñada').length;
    const emptyCount = batchPalpations.filter(p => p.diagnosis === 'Vacía').length;
    await logActivity({
      action: 'palpation_batch',
      description: `Registró jornada de palpación ginecológica para ${batchPalpations.length} hembras (${pregnantCount} Preñadas, ${emptyCount} Vacías)`,
      tagNumber: `${batchPalpations.length} hembras`,
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    showToast(`¡Jornada de ${batchPalpations.length} diagnósticos guardada y sincronizada en la nube! 🩺☁️`, 'success');
  };

  const handleSaveCalendarNote = async (noteData) => {
    if (!userId) return;
    const noteId = noteData.id || ('cn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
    const record = {
      ...noteData,
      id: noteId,
      userId,
      createdAt: noteData.createdAt || new Date().toISOString()
    };
    if (db.calendarNotes) {
      await db.calendarNotes.put(record);
      markPendingSync(userId, noteId);
    }

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'calendar_note_created',
      description: `Agregó recordatorio/tarea en agenda: "${noteData.title}" para el día ${noteData.date}`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('success');
    showToast(`Recordatorio "${noteData.title}" guardado y sincronizado 📅☁️`);
  };

  const handleToggleCalendarNote = async (noteId) => {
    if (!userId || !db.calendarNotes) return;
    const note = await db.calendarNotes.get(noteId) || await db.calendarNotes.get(Number(noteId));
    if (note) {
      const updated = { ...note, completed: !note.completed };
      await db.calendarNotes.put(updated);
      markPendingSync(userId, updated.id);
      cloudPushData(userId);
      triggerFeedback('click');
    }
  };

  const handleDeleteCalendarNote = async (noteId) => {
    if (!userId || !db.calendarNotes) return;
    const note = await db.calendarNotes.get(noteId) || await db.calendarNotes.get(Number(noteId));
    const targetId = note ? note.id : noteId;
    await db.calendarNotes.delete(targetId);
    markPendingDelete(userId, 'calendarNotes', targetId);

    // Registrar acción en bitácora de auditoría
    await logActivity({
      action: 'calendar_note_deleted',
      description: `Eliminó recordatorio de agenda: "${note?.title || 'Tarea'}"`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Recordatorio eliminado del calendario 🗑️');
  };

  const handleSaveFarmExpense = async (expenseData) => {
    if (!userId) return;
    const expId = expenseData.id || ('exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
    const record = {
      ...expenseData,
      id: expId,
      userId,
      createdAt: expenseData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (db.farmExpenses) {
      await db.farmExpenses.put(record);
      markPendingSync(userId, expId);
    }

    await logActivity({
      action: 'farm_expense_saved',
      description: `Registró gasto: "${expenseData.concept}" (${formatCurrency(expenseData.amount)}) - ${expenseData.category}`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('success');
    showToast(`Gasto "${expenseData.concept}" guardado exitosamente 💵☁️`);
  };

  const handleDeleteFarmExpense = async (expId) => {
    if (!userId || !db.farmExpenses) return;
    const exp = await db.farmExpenses.get(expId) || await db.farmExpenses.get(Number(expId));
    const targetId = exp ? exp.id : expId;
    await db.farmExpenses.delete(targetId);
    markPendingDelete(userId, 'farmExpenses', targetId);

    await logActivity({
      action: 'farm_expense_deleted',
      description: `Eliminó gasto: "${exp?.concept || 'Gasto'}"`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Gasto eliminado de la contabilidad 🗑️');
  };

  const handleSaveFarmIncome = async (incomeData) => {
    if (!userId) return;
    const incId = incomeData.id || ('inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
    const record = {
      ...incomeData,
      id: incId,
      userId,
      createdAt: incomeData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (db.farmIncomes) {
      await db.farmIncomes.put(record);
      markPendingSync(userId, incId);
    }

    await logActivity({
      action: 'farm_income_saved',
      description: `Registró ingreso: "${incomeData.concept}" (${formatCurrency(incomeData.amount)})`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('success');
    showToast(`Ingreso "${incomeData.concept}" guardado exitosamente 💰☁️`);
  };

  const handleDeleteFarmIncome = async (incId) => {
    if (!userId) return;
    
    // 1. Buscar el ingreso en db.farmIncomes por string, number, o formato raw
    let inc = null;
    if (db.farmIncomes) {
      inc = await db.farmIncomes.get(incId) || 
            (!isNaN(Number(incId)) ? await db.farmIncomes.get(Number(incId)) : null) || 
            await db.farmIncomes.get(String(incId));
      if (!inc) {
        inc = await db.farmIncomes.filter(i => i.id == incId || ('inc_milk_' + i.settlementId) === String(incId)).first();
      }
    }
    const targetId = inc ? inc.id : incId;

    // 2. Eliminar de farmIncomes
    if (db.farmIncomes) {
      await db.farmIncomes.delete(targetId).catch(() => null);
      if (typeof targetId === 'string' && !isNaN(targetId)) {
        await db.farmIncomes.delete(Number(targetId)).catch(() => null);
      } else if (typeof targetId === 'number') {
        await db.farmIncomes.delete(String(targetId)).catch(() => null);
      }
      markPendingDelete(userId, 'farmIncomes', targetId, String(targetId));
    }

    // 3. Si el ingreso está enlazado a una liquidación de leche (settlementId o prefijo inc_milk_):
    let settlementId = inc?.settlementId || (typeof targetId === 'string' && targetId.startsWith('inc_milk_') ? targetId.replace('inc_milk_', '') : null);

    // Si aún no se encontró settlementId, buscar en db.milkSettlements por coincidencia de incomeId, ID, o fechas
    if (!settlementId && db.milkSettlements) {
      const matchSt = await db.milkSettlements.filter(s => 
        s.id == targetId || 
        s.incomeId == targetId || 
        ('inc_milk_' + s.id) === String(targetId) ||
        (inc && s.startDate === inc.startDate && s.endDate === inc.endDate)
      ).first();
      if (matchSt) {
        settlementId = matchSt.id;
      }
    }

    if (settlementId) {
      await deleteMilkSettlement(settlementId);
      markPendingDelete(userId, 'milkSettlements', settlementId, String(settlementId), !isNaN(Number(settlementId)) ? Number(settlementId) : null);
      markPendingDelete(userId, 'farmIncomes', 'inc_milk_' + settlementId, targetId, String(targetId));
    }

    // 4. Si targetId coincide directamente con el ID de una liquidación de leche
    if (db.milkSettlements) {
      const directSettlement = await db.milkSettlements.get(targetId) || (!isNaN(Number(targetId)) ? await db.milkSettlements.get(Number(targetId)) : null);
      if (directSettlement) {
        await deleteMilkSettlement(directSettlement.id);
        markPendingDelete(userId, 'milkSettlements', directSettlement.id, String(directSettlement.id));
      }
    }

    // 5. Si el ingreso está enlazado a una entrega/despacho de leche a tanque
    let deliveryId = inc?.deliveryId || (typeof targetId === 'string' && targetId.startsWith('inc_tank_') ? targetId.replace('inc_tank_', '') : null);
    if (!deliveryId && db.milkDeliveries) {
      const matchDel = await db.milkDeliveries.filter(d => d.id == targetId || ('inc_tank_' + d.id) === String(targetId)).first();
      if (matchDel) deliveryId = matchDel.id;
    }
    if (deliveryId) {
      await deleteMilkDelivery(deliveryId);
      markPendingDelete(userId, 'milkDeliveries', deliveryId, String(deliveryId));
      markPendingDelete(userId, 'farmIncomes', 'inc_tank_' + deliveryId, targetId, String(targetId));
    }

    await logActivity({
      action: 'farm_income_deleted',
      description: `Eliminó ingreso: "${inc?.concept || 'Ingreso'}"`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Ingreso eliminado de la contabilidad y liquidación desvinculada 🗑️');
  };

  const handleSaveMilkRecord = async (recordData) => {
    if (!userId) return;
    const record = await saveMilkRecord({
      ...recordData,
      userId
    });
    if (record) {
      markPendingSync(userId, record.id);
      
      await logActivity({
        action: 'milk_record_saved',
        description: `Registró pesaje de leche para chapa ${record.tagNumber || 'Bovino'} (${record.totalLiters} L: AM ${record.amLiters || 0}L / PM ${record.pmLiters || 0}L)`,
        tagNumber: record.tagNumber || '',
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      cloudPushData(userId);
      triggerFeedback('success');
      showToast(`Pesaje de leche guardado (${record.totalLiters} L) 🥛☁️`);
    }
  };

  const handleSaveBatchMilkRecords = async (records) => {
    if (!userId || !records || records.length === 0) return;
    const saved = await saveBatchMilkRecords(records, userId);
    if (saved && saved.length > 0) {
      const ids = saved.map(s => s.id);
      markPendingSync(userId, ...ids);

      const totalLitersBatch = saved.reduce((sum, r) => sum + (parseFloat(r.totalLiters) || 0), 0);
      await logActivity({
        action: 'milk_batch_saved',
        description: `Registró jornada de ordeño para ${saved.length} vacas (Total: ${formatNumber(totalLitersBatch, 1)} Litros)`,
        tagNumber: `${saved.length} vacas`,
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      cloudPushData(userId);
      triggerFeedback('success');
      showToast(`¡${saved.length} registros de ordeño guardados y sincronizados! 🥛☁️`);
    }
  };

  const handleDeleteMilkRecord = async (recordId) => {
    if (!userId) return;
    await deleteMilkRecord(recordId);
    markPendingDelete(userId, 'milkRecords', recordId);
    
    await logActivity({
      action: 'milk_record_deleted',
      description: `Eliminó registro de pesaje de leche ID ${recordId}`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Registro de leche eliminado 🗑️');
  };

  const handleSaveMilkDelivery = async (deliveryData) => {
    if (!userId) return;
    const saved = await saveMilkDelivery({
      ...deliveryData,
      userId
    });
    if (saved) {
      markPendingSync(userId, saved.id);

      // Si se liquidó a ingreso contable, registrar automáticamente en farmIncomes
      if (saved.registerIncome && saved.totalValue > 0) {
        const incomeId = 'inc_milk_' + saved.id;
        const incomeRecord = {
          id: incomeId,
          date: saved.date,
          concept: `Venta de Leche (${saved.totalLiters} L @ ${formatCurrency(saved.pricePerLiter)}) - ${saved.buyer || 'Tanque / Planta'}`,
          category: 'leche',
          amount: saved.totalValue,
          paymentMethod: 'Transferencia',
          notes: `Generado automáticamente desde Entrega a Tanque ID: ${saved.id}. Comprador: ${saved.buyer || 'N/A'}`,
          totalLiters: saved.totalLiters,
          pricePerLiter: saved.pricePerLiter,
          buyer: saved.buyer,
          isMilkSettlement: true,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (db.farmIncomes) {
          await db.farmIncomes.put(incomeRecord);
          markPendingSync(userId, incomeId);
        }
      }

      await logActivity({
        action: 'milk_delivery_saved',
        description: `Registró despacho a tanque/venta: ${saved.totalLiters} L a ${formatCurrency(saved.pricePerLiter)}/L (${formatCurrency(saved.totalValue)}) para "${saved.buyer || 'Planta'}"`,
        tagNumber: '',
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      cloudPushData(userId);
      triggerFeedback('success');
      showToast(`Entrega de ${saved.totalLiters} L a tanque guardada con éxito 🧊☁️`);
    }
  };

  const handleDeleteMilkDelivery = async (deliveryId) => {
    if (!userId) return;
    await deleteMilkDelivery(deliveryId);
    markPendingDelete(userId, 'milkDeliveries', deliveryId);
    
    // Si tenía un ingreso contable asociado, eliminarlo también
    const linkedIncomeId = 'inc_milk_' + deliveryId;
    if (db.farmIncomes) {
      await db.farmIncomes.delete(linkedIncomeId);
      markPendingDelete(userId, 'farmIncomes', linkedIncomeId);
    }

    await logActivity({
      action: 'milk_delivery_deleted',
      description: `Eliminó despacho a tanque ID ${deliveryId}`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Despacho de leche a tanque eliminado 🗑️');
  };

  const handleSaveDailyMilkLog = async (logData) => {
    if (!userId) return;
    const saved = await saveDailyMilkLog({
      ...logData,
      userId
    });
    if (saved) {
      markPendingSync(userId, saved.id);

      await logActivity({
        action: 'daily_milk_log_saved',
        description: `Registró producción diaria general: ${saved.totalLiters} L (AM: ${saved.amLiters || 0}L, PM: ${saved.pmLiters || 0}L) para el día ${saved.date}`,
        tagNumber: '',
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      cloudPushData(userId);
      triggerFeedback('success');
      showToast(`Producción diaria de ${saved.totalLiters} L guardada y sincronizada 🥛☁️`);
    }
  };

  const handleDeleteDailyMilkLog = async (logId) => {
    if (!userId) return;
    await deleteDailyMilkLog(logId);
    markPendingDelete(userId, 'dailyMilkLogs', logId);

    await logActivity({
      action: 'daily_milk_log_deleted',
      description: `Eliminó registro de producción diaria ID ${logId}`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Registro de producción diaria eliminado 🗑️');
  };

  const handleSaveMilkSettlement = async (settlementData) => {
    if (!userId) return;
    const saved = await saveMilkSettlement({
      ...settlementData,
      userId
    });
    if (saved) {
      markPendingSync(userId, saved.id);

      const incomeId = saved.incomeId || ('inc_milk_' + saved.id);

      // Si tiene marcado registrar ingreso contable (por defecto true), crear o actualizar entrada en farmIncomes
      if (saved.registerIncome !== false && saved.totalValue > 0) {
        const incomeRecord = {
          id: incomeId,
          date: saved.paymentDate || saved.endDate || getLocalDateString(),
          concept: `Venta de Leche - Liquidación ${saved.periodType?.toUpperCase() || 'QUINCENAL'} (${formatNumber(saved.totalLiters, 1)} L @ ${formatCurrency(saved.pricePerLiter)}) - ${saved.buyer || 'Planta'}`,
          category: 'leche',
          amount: saved.totalValue,
          paymentMethod: 'Transferencia',
          notes: `Liquidación período ${formatDate(saved.startDate)} al ${formatDate(saved.endDate)}. Comprador: ${saved.buyer || 'N/A'}. Bonificaciones: ${formatCurrency(saved.bonuses || 0)}, Deducciones: ${formatCurrency(saved.deductions || 0)}`,
          settlementId: saved.id,
          totalLiters: saved.totalLiters,
          pricePerLiter: saved.pricePerLiter,
          buyer: saved.buyer,
          periodType: saved.periodType,
          startDate: saved.startDate,
          endDate: saved.endDate,
          bonuses: saved.bonuses || 0,
          deductions: saved.deductions || 0,
          deductionsBreakdown: saved.deductionsBreakdown || null,
          isMilkSettlement: true,
          userId,
          createdAt: saved.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (db.farmIncomes) {
          await db.farmIncomes.put(incomeRecord);
          markPendingSync(userId, incomeId);
        }
      } else if (db.farmIncomes) {
        // Si se desmarcó registrar ingreso, remover el ingreso asociado
        await db.farmIncomes.delete(incomeId);
        markPendingDelete(userId, 'farmIncomes', incomeId);
      }

      await logActivity({
        action: 'milk_settlement_saved',
        description: `Registró liquidación de leche: ${formatNumber(saved.totalLiters, 1)} L por ${formatCurrency(saved.totalValue)} (${saved.buyer || 'Planta'}) - Período ${saved.startDate} a ${saved.endDate}`,
        tagNumber: '',
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);

      cloudPushData(userId);
      triggerFeedback('success');
      showToast(`¡Liquidación de ${formatCurrency(saved.totalValue)} guardada y cargada en Contabilidad! 💰📊`);
    }
  };

  const handleDeleteMilkSettlement = async (settlementId) => {
    if (!userId) return;
    await deleteMilkSettlement(settlementId);
    markPendingDelete(userId, 'milkSettlements', settlementId, String(settlementId), !isNaN(Number(settlementId)) ? Number(settlementId) : null);

    // Si tenía un ingreso contable asociado, eliminarlo también
    const linkedIncomeId = 'inc_milk_' + settlementId;
    if (db.farmIncomes) {
      await db.farmIncomes.delete(linkedIncomeId).catch(() => null);
      if (!isNaN(Number(settlementId))) {
        await db.farmIncomes.delete('inc_milk_' + Number(settlementId)).catch(() => null);
      }
      markPendingDelete(userId, 'farmIncomes', linkedIncomeId, 'inc_milk_' + String(settlementId), String(settlementId));
    }

    await logActivity({
      action: 'milk_settlement_deleted',
      description: `Eliminó liquidación de leche ID ${settlementId}`,
      tagNumber: '',
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('warning');
    showToast('Liquidación de leche eliminada de Lechería y Contabilidad 🗑️');
  };

  // ==================== POTREROS & PASTOREO ROTACIONAL ====================

  const handleSavePaddock = async (paddockData) => {
    if (!userId || !db.paddocks) return;
    let targetId = paddockData.id;
    if (paddockData.id) {
      await db.paddocks.update(paddockData.id, {
        ...paddockData,
        userId,
        updatedAt: new Date().toISOString(),
      });
      markPendingSync(userId, paddockData.id);
      await logActivity({
        action: 'paddock_updated',
        description: `Actualizó datos del potrero "${paddockData.name}" (${paddockData.areaHa} ha, Pasto: ${paddockData.pastureType})`,
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);
      showToast(`Potrero "${paddockData.name}" actualizado con éxito 🌾`);
    } else {
      const newId = 'pad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      targetId = newId;
      await db.paddocks.put({
        ...paddockData,
        id: newId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      markPendingSync(userId, newId);
      await logActivity({
        action: 'paddock_created',
        description: `Registró nuevo potrero "${paddockData.name}" (${paddockData.areaHa} ha, Pasto: ${paddockData.pastureType})`,
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);
      showToast(`Potrero "${paddockData.name}" registrado en el catálogo 🌾`);
    }
    cloudPushData(userId);
    triggerFeedback('single');
  };

  const handleDeletePaddock = async (paddockId) => {
    if (!userId || !db.paddocks || !paddockId) return;
    const target = await db.paddocks.get(paddockId) || await db.paddocks.get(Number(paddockId));
    if (target) {
      await db.paddocks.delete(target.id);
      markPendingDelete(userId, 'paddocks', target.id);
      await logActivity({
        action: 'paddock_deleted',
        description: `Eliminó el potrero "${target.name}"`,
        operatorName: currentUser?.name || currentUser?.username || 'Administrador',
        operatorRole: currentUser?.role || 'admin',
        userId,
      }).catch(() => null);
      cloudPushData(userId);
      triggerFeedback('warning');
      showToast(`Potrero eliminado 🗑️`, 'warning');
    }
  };

  const handleRotateBatch = async ({ fromPaddockId, toPaddockId, batchName, date, updateCattleLocation, notes }) => {
    if (!userId || !db.paddocks) return;
    const todayStr = date || getLocalDateString();
    const changedPaddockIds = [];

    // 1. Potrero origen pasa a descanso
    if (fromPaddockId && fromPaddockId !== 'none') {
      const fromP = await db.paddocks.get(fromPaddockId) || await db.paddocks.get(Number(fromPaddockId));
      if (fromP) {
        await db.paddocks.update(fromP.id, {
          status: 'descanso',
          currentBatchId: '',
          currentBatchName: '',
          exitDate: todayStr,
          lastRestStartDate: todayStr,
          updatedAt: new Date().toISOString(),
        });
        changedPaddockIds.push(fromP.id);
      }
    }

    // 2. Potrero destino pasa a ocupado
    let destPaddockName = '';
    if (toPaddockId && toPaddockId !== 'none') {
      const toP = await db.paddocks.get(toPaddockId) || await db.paddocks.get(Number(toPaddockId));
      if (toP) {
        destPaddockName = toP.name;
        await db.paddocks.update(toP.id, {
          status: 'ocupado',
          currentBatchName: batchName || toP.currentBatchName || 'Lote Activo',
          entryDate: todayStr,
          exitDate: '',
          updatedAt: new Date().toISOString(),
        });
        changedPaddockIds.push(toP.id);
      }
    }

    // 3. Si se marcó actualizar ubicación del ganado, actualizar su potrero
    const changedCattleIds = [];
    if (updateCattleLocation && batchName && destPaddockName) {
      const matched = cattle.filter(c => c.status === 'Activo' && (c.entryBatch === batchName || c.paddock === batchName));
      for (const animal of matched) {
        await db.cattle.update(animal.id, {
          paddock: destPaddockName,
          updatedAt: new Date().toISOString(),
        });
        changedCattleIds.push(animal.id);
      }
    }

    markPendingSync(userId, ...changedPaddockIds, ...changedCattleIds);

    await logActivity({
      action: 'batch_rotated',
      description: `Rotó el lote "${batchName}" hacia el potrero "${destPaddockName || 'Destino'}"${changedCattleIds.length > 0 ? ` (${changedCattleIds.length} bovinos reubicados)` : ''}${notes ? ` - "${notes}"` : ''}`,
      operatorName: currentUser?.name || currentUser?.username || 'Administrador',
      operatorRole: currentUser?.role || 'admin',
      userId,
    }).catch(() => null);

    cloudPushData(userId);
    triggerFeedback('batch');
    showToast(`¡Lote "${batchName}" rotado exitosamente hacia ${destPaddockName}! 🌾🔄`, 'success');
  };

  const handleManualSync = async () => {
    if (!userId) return;
    setIsSyncing(true);
    await syncCloudAndLocal(userId);
    setIsSyncing(false);
    showToast(`¡Sincronización con la nube completada! ☁️`, 'success');
  };

  const handleOpenNew = (initialData = null) => {
    if (!canAddAnimal(currentUser, activeCattleCount)) {
      triggerFeedback('error');
      setIsMembershipModalOpen(true);
      return;
    }
    if (initialData && typeof initialData === 'object' && !initialData.nativeEvent) {
      setEditingAnimal({
        ...initialData,
        id: undefined
      });
    } else {
      setEditingAnimal(null);
    }
    setIsFormModalOpen(true);
  };

  const handleOpenBatchEntry = () => {
    if (!canAddAnimal(currentUser, activeCattleCount)) {
      triggerFeedback('error');
      setIsMembershipModalOpen(true);
      return;
    }
    setIsBatchEntryModalOpen(true);
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
        onOpenWhatsAppReport={() => setIsWhatsAppModalOpen(true)}
        onOpenWorkers={() => setIsWorkersModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenMembership={() => setIsMembershipModalOpen(true)}
        onOpenMasterAdmin={() => setIsMasterAdminModalOpen(true)}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        isOnline={isOnline}
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
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 mb-8 space-y-6">
        
        {currentView === 'dashboard' && (
          <DashboardView
            cattle={cattle}
            weighings={weighings}
            vaccinations={vaccinations}
            audits={audits}
            calendarNotes={calendarNotes}
            onNavigate={setCurrentView}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
            onOpenBatchEntry={handleOpenBatchEntry}
            onOpenExportImport={() => setIsExportModalOpen(true)}
            onOpenWhatsAppReport={() => setIsWhatsAppModalOpen(true)}
            onOpenChecklist={() => setIsChecklistOpen(true)}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenVaccinationModal={() => setIsVaccinationModalOpen(true)}
            onOpenCensusModal={() => setIsCensusModalOpen(true)}
            onDeleteVaccination={handleDeleteVaccination}
            onCompleteBooster={handleCompleteBooster}
            onOpenPartnershipModal={() => setIsPartnershipModalOpen(true)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
            farmExpenses={farmExpenses}
            farmIncomes={farmIncomes}
            milkRecords={milkRecords}
            milkDeliveries={milkDeliveries}
            milkSettlements={milkSettlements}
            onOpenCalving={handleOpenCalving}
          />
        )}

        {currentView === 'cattle' && (
          <CattleListView
            cattle={cattle}
            weighings={weighings}
            vaccinations={vaccinations}
            onSelectAnimal={handleSelectAnimal}
            onOpenNew={handleOpenNew}
            onOpenNewAnimal={handleOpenNew}
            onOpenBatchEntry={handleOpenBatchEntry}
            onOpenEdit={handleOpenEdit}
            onOpenSell={handleOpenSell}
            onOpenDeath={handleOpenDeath}
            onRevertDeath={handleRevertDeath}
            onDelete={handleDeleteAnimal}
            onDeleteAnimal={handleDeleteAnimal}
            onAddWeight={handleOpenAddWeight}
            onOpenAddWeight={handleOpenAddWeight}
            onOpenExportImport={() => setIsExportModalOpen(true)}
            onOpenWhatsAppReport={() => setIsWhatsAppModalOpen(true)}
            onOpenChecklist={() => setIsChecklistOpen(true)}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
            onOpenPartnershipModal={() => setIsPartnershipModalOpen(true)}
            onOpenVaccinationModal={() => setIsVaccinationModalOpen(true)}
            onOpenCensusModal={() => setIsCensusModalOpen(true)}
            onOpenCalving={handleOpenCalving}
          />
        )}

        {currentView === 'paddocks' && (
          <PaddocksView
            paddocks={paddocks}
            cattle={cattle}
            onSavePaddock={handleSavePaddock}
            onDeletePaddock={handleDeletePaddock}
            onRotateBatch={handleRotateBatch}
            isWorker={isWorker}
          />
        )}

        {currentView === 'batches' && (
          <BatchAnalyticsView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenBatchEntry={handleOpenBatchEntry}
            onOpenNewAnimal={handleOpenNew}
            onOpenExportImport={() => setIsExportModalOpen(true)}
            onOpenWhatsAppReport={() => setIsWhatsAppModalOpen(true)}
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
            currentUser={currentUser}
            onOpenChecklist={() => setIsChecklistOpen(true)}
          />
        )}

        {currentView === 'palpation' && (
          <QuickPalpationView
            cattle={cattle}
            palpations={palpations}
            onSavePalpation={handleSavePalpation}
            onSaveBatchPalpations={handleSaveBatchPalpations}
            onSelectAnimal={handleSelectAnimal}
            onNavigate={setCurrentView}
            currentUser={currentUser}
          />
        )}

        {currentView === 'females' && (
          <FemalesView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
            onNavigate={setCurrentView}
            onOpenPalpation={() => setCurrentView('palpation')}
            onOpenCalving={handleOpenCalving}
          />
        )}

        {currentView === 'finances' && (
          <FinancesView
            cattle={cattle}
            weighings={weighings}
            onSelectAnimal={handleSelectAnimal}
            onRevertSale={handleRevertSale}
            onDeleteAnimal={handleDeleteAnimal}
            onOpenPartnershipModal={() => setIsPartnershipModalOpen(true)}
          />
        )}

        {currentView === 'accounting' && (
          <AccountingView
            cattle={cattle}
            weighings={weighings}
            farmExpenses={farmExpenses}
            farmIncomes={farmIncomes}
            milkSettlements={milkSettlements}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteFarmExpense}
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
            onOpenEditIncome={(inc) => {
              setEditingIncome(inc);
              setIsIncomeModalOpen(true);
            }}
            onDeleteIncome={handleDeleteFarmIncome}
            onSelectAnimal={handleSelectAnimal}
          />
        )}

        {currentView === 'dairy' && (
          <DairyView
            cattle={cattle}
            milkRecords={milkRecords}
            milkDeliveries={milkDeliveries}
            dailyMilkLogs={dailyMilkLogs}
            milkSettlements={milkSettlements}
            onSaveMilkRecord={handleSaveMilkRecord}
            onSaveBatchMilkRecords={handleSaveBatchMilkRecords}
            onDeleteMilkRecord={handleDeleteMilkRecord}
            onSaveMilkDelivery={handleSaveMilkDelivery}
            onDeleteMilkDelivery={handleDeleteMilkDelivery}
            onSaveDailyMilkLog={handleSaveDailyMilkLog}
            onDeleteDailyMilkLog={handleDeleteDailyMilkLog}
            onSaveMilkSettlement={handleSaveMilkSettlement}
            onDeleteMilkSettlement={handleDeleteMilkSettlement}
            onSelectAnimal={handleSelectAnimal}
            onOpenNewAnimal={handleOpenNew}
            farmName={currentUser?.farmName || 'Mi Finca Ganadera'}
            currentUser={currentUser}
          />
        )}

      </main>

      {/* MODALES */}

      {/* 1. Modal Base de Ficha Técnica / Detalle del Bovino */}
      <CattleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        animal={cattle.find(c => String(c.id) === String(selectedAnimal?.id)) || selectedAnimal}
        cattleList={cattle}
        weighings={weighings}
        vaccinations={vaccinations}
        milkRecords={milkRecords}
        onOpenEdit={handleOpenEdit}
        onOpenSell={handleOpenSell}
        onOpenAddWeight={handleOpenAddWeight}
        onOpenDeath={handleOpenDeath}
        onRevertDeath={handleRevertDeath}
        onDelete={handleDeleteAnimal}
        onDeleteWeight={handleDeleteWeight}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenCalving={handleOpenCalving}
      />

      {/* 2. Modales de Acción y Formularios (Con zIndex z-[60] para superponerse con prioridad) */}
      <CalvingRecordModal
        isOpen={isCalvingModalOpen}
        onClose={() => {
          setIsCalvingModalOpen(false);
          setCalvingMotherAnimal(null);
        }}
        onSave={handleSaveCalving}
        mother={calvingMotherAnimal}
        cattleList={cattle}
        paddocks={paddocks}
        zIndex="z-[70]"
      />

      <CattleFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAnimal(null);
        }}
        onSave={handleSaveAnimal}
        animal={editingAnimal}
        cattleList={cattle}
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
        cattleList={cattle}
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
        onOpenWorkers={() => setIsWorkersModalOpen(true)}
        onOpenMembership={() => setIsMembershipModalOpen(true)}
        activeCattleCount={activeCattleCount}
        zIndex="z-[60]"
      />

      <WorkersManagementModal
        isOpen={isWorkersModalOpen}
        onClose={() => setIsWorkersModalOpen(false)}
        zIndex="z-[60]"
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDataChanged={() => {}}
        zIndex="z-[60]"
      />

      <WhatsAppReportModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        cattle={cattle}
        weighings={weighings}
        farmName={currentUser?.farmName || 'INVENTARIO BOVINO APP'}
        zIndex="z-[60]"
      />

      <FarmCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        cattle={cattle}
        weighings={weighings}
        vaccinations={vaccinations}
        notes={calendarNotes}
        onSaveNote={handleSaveCalendarNote}
        onToggleNote={handleToggleCalendarNote}
        onDeleteNote={handleDeleteCalendarNote}
        onOpenVaccinationModal={() => setIsVaccinationModalOpen(true)}
        zIndex="z-[60]"
      />

      {/* 3. Modales del Plan Sanitario y Vacunación Oficial FEDEGAN-ICA */}
      <VaccinationRecordModal
        isOpen={isVaccinationModalOpen}
        onClose={() => setIsVaccinationModalOpen(false)}
        cattle={cattle}
        onSaveVaccination={handleSaveVaccination}
        zIndex="z-[60]"
      />

      <VaccinationCensusModal
        isOpen={isCensusModalOpen}
        onClose={() => setIsCensusModalOpen(false)}
        cattle={cattle}
        vaccinations={vaccinations}
        farmName={currentUser?.farmName || 'Mi Finca Ganadera'}
        farmerName={currentUser?.name || 'Ganadero'}
        onOpenVaccinationModal={() => setIsVaccinationModalOpen(true)}
        zIndex="z-[60]"
      />

      {/* 4. Modal de Arqueo y Checklist de Inventario en Campo */}
      <InventoryChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        cattle={cattle}
        weighings={weighings}
        currentUser={currentUser}
        onDataChanged={() => {
          markPendingSync(userId, 'audit_' + Date.now());
          cloudPushData(userId);
        }}
        zIndex="z-[60]"
      />

      {/* 5. Modal de Cambio Obligatorio de Contraseña tras Restablecimiento */}
      <ForcePasswordChangeModal
        isOpen={Boolean(currentUser?.mustChangePassword)}
      />

      {/* 6. Modales de Contabilidad: Gastos e Ingresos */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveFarmExpense}
        expense={editingExpense}
        zIndex="z-[60]"
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveFarmIncome}
        income={editingIncome}
        zIndex="z-[60]"
      />

      {/* 7. Modales de Suscripción & Membresías */}
      <MembershipModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        zIndex="z-[80]"
      />

      <MasterAdminSubscriptionsModal
        isOpen={isMasterAdminModalOpen}
        onClose={() => setIsMasterAdminModalOpen(false)}
        zIndex="z-[85]"
      />

      {/* 8. Overlay de Bloqueo por Membresía Expirada (Paywall Amigable con Respaldo Excel) */}
      {subStatus.isExpired && !subStatus.isSuperAdmin && !isWorker && (
        <SubscriptionExpiredOverlay
          onOpenMembershipModal={() => setIsMembershipModalOpen(true)}
          onExportAllData={() => setIsExportModalOpen(true)}
        />
      )}

    </div>
  );
}
