import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, 
  Sparkles, 
  Scale, 
  HeartHandshake, 
  Flame, 
  Syringe, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Baby, 
  Tag, 
  Check, 
  X, 
  BellRing, 
  ClipboardList,
  RotateCcw
} from 'lucide-react';
import { calculateReproduction, formatDate, getDaysDifference } from '../../services/calculations';
import { findDuplicateCattle, normalizeTagNumber, normalizeText } from '../../services/duplicateDetectionService';
import { useAuth } from '../../context/AuthContext';
import { getAlertsData, markAlertAttended, markAlertDismissed, reopenAlert } from '../../services/alertAuditService';
import { AlertsAuditModal } from './AlertsAuditModal';

const VACCINE_STORAGE_KEY = 'ganado_colombia_vaccine_status';

export function AlertsList({ 
  cattle = [], 
  weighings = [], 
  vaccinations = [], 
  userId = null,
  currentUser = null,
  onSelectAnimal, 
  onOpenCalving, 
  onOpenBranding 
}) {
  const auth = useAuth ? useAuth() : null;
  const effectiveUser = currentUser || auth?.currentUser;
  const effectiveUserId = userId || effectiveUser?.ownerId || effectiveUser?.id || 'default';
  const operatorName = effectiveUser?.name || effectiveUser?.username || 'Administrador';
  const operatorRole = effectiveUser?.role || 'admin';

  // Estado reactivo de las alertas resueltas y trazabilidad auditada
  const [alertsData, setAlertsData] = useState(() => getAlertsData(effectiveUserId));
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Estado para el modal rápido de confirmación al hacer tap en Chulear o Cancelar
  const [quickActionAlert, setQuickActionAlert] = useState(null);
  const [quickActionType, setQuickActionType] = useState(null); // 'attend' | 'dismiss'
  const [quickActionNotes, setQuickActionNotes] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Escuchar actualizaciones de estado de alertas (deshacer, chulear, cancelar en otros componentes)
  useEffect(() => {
    setAlertsData(getAlertsData(effectiveUserId));

    const handleUpdate = (e) => {
      if (!e.detail?.userId || e.detail.userId === String(effectiveUserId)) {
        setAlertsData(getAlertsData(effectiveUserId));
      }
    };

    window.addEventListener('ganado_alerts_updated', handleUpdate);
    return () => {
      window.removeEventListener('ganado_alerts_updated', handleUpdate);
    };
  }, [effectiveUserId]);

  // 1. Alertas individuales de bovinos prioritarios (Pesos de venta, partos, destetes, chequeos)
  const animalAlerts = [];
  const sanitaryAlerts = [];
  const duplicateAlerts = [];

  cattle.forEach(animal => {
    if (animal.status !== 'Activo') return;

    const currentWeight = parseFloat(animal.currentWeight || animal.entryWeight) || 0;

    // ALERTA DESTACADA 1: Macho con peso >= 480 kg (Listo para venta gordo)
    if (animal.sex === 'Macho' && currentWeight >= 480) {
      animalAlerts.push({
        id: `fat-bull-${animal.id}`,
        animal,
        priority: 1,
        type: 'fat_ready',
        title: `🎯 ¡Macho Listo para Venta! (${animal.tagNumber})`,
        desc: `Alcanzó el peso meta de ${currentWeight} kg (≥ 480 kg) para despacho o frigorífico.`,
        icon: Flame,
      });
    }

    // ALERTA DESTACADA 2: Parto muy cercano en hembras (<= 30 días)
    if (animal.sex === 'Hembra' && (animal.femaleStatus === 'Gestación' || animal.reproductiveStatus === 'Preñada')) {
      const repro = calculateReproduction(animal);
      if (repro.daysUntilCalving !== null && repro.daysUntilCalving <= 30) {
        animalAlerts.push({
          id: `calving-${animal.id}`,
          animal,
          priority: repro.daysUntilCalving <= 10 ? 1 : 2,
          type: repro.daysUntilCalving <= 10 ? 'urgent' : 'warning',
          title: `Próximo Parto: ${animal.tagNumber} ${animal.name ? `(${animal.name})` : ''}`,
          desc: repro.daysUntilCalving <= 0 
            ? '¡Fecha estimada de parto cumplida!' 
            : `Faltan aprox. ${repro.daysUntilCalving} días para el parto (${formatDate(repro.expectedCalvingDate)}).`,
          icon: HeartHandshake,
          isCalving: true,
        });
      }
    }

    // ALERTA DESTACADA 3: Destete Programado / Pendiente en Crías
    if ((animal.category === 'Ternero' || animal.category === 'Ternera' || animal.entryType === 'Nacimiento') && !animal.isWeaned) {
      const birthDateStr = animal.birthDate || animal.entryDate;
      let isDueForWeaning = false;
      let daysUntilWeaning = null;
      let weaningDueDateStr = animal.weaningPlannedDate || '';

      if (weaningDueDateStr) {
        try {
          const todayMid = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
          const p = weaningDueDateStr.split('-');
          if (p.length === 3) {
            const wMid = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
            daysUntilWeaning = Math.round((wMid - todayMid) / 86400000);
            if (daysUntilWeaning <= 20) {
              isDueForWeaning = true;
            }
          }
        } catch (e) {}
      } else if (birthDateStr) {
        const ageDays = getDaysDifference(birthDateStr, new Date());
        if (ageDays >= 195) { // >= 6.5 meses (~195 días)
          isDueForWeaning = true;
          daysUntilWeaning = 210 - ageDays;
        }
      }

      if (isDueForWeaning) {
        const motherInfo = animal.motherTag ? `(Madre: #${animal.motherTag})` : '';
        const isOverdue = daysUntilWeaning !== null && daysUntilWeaning <= 0;
        animalAlerts.push({
          id: `weaning-${animal.id}`,
          animal,
          priority: isOverdue ? 1 : 2,
          type: isOverdue ? 'urgent' : 'info',
          title: `🍼 Destete ${isOverdue ? 'Cumplido' : 'Próximo'}: Cría #${animal.tagNumber} ${motherInfo}`,
          desc: isOverdue
            ? `Cumplió la edad de destete (${weaningDueDateStr ? formatDate(weaningDueDateStr) : '7 meses'}). Realizar pesaje de destete y separar lote.`
            : `Destete estimado en aprox. ${daysUntilWeaning} días (${weaningDueDateStr ? formatDate(weaningDueDateStr) : 'próximamente'}).`,
          icon: Baby,
        });
      }
    }

    // ALERTA 4: Chequeo reproductivo (+45 días post-servicio)
    if (animal.sex === 'Hembra' && animal.reproductiveStatus === 'En Servicio' && animal.serviceDate) {
      const serviceDays = getDaysDifference(animal.serviceDate, new Date());
      if (serviceDays >= 45) {
        animalAlerts.push({
          id: `check-${animal.id}`,
          animal,
          priority: 3,
          type: 'warning',
          title: `Chequeo Reproductivo: ${animal.tagNumber}`,
          desc: `Han pasado ${serviceDays} días desde el servicio. Requiere palpación.`,
          icon: AlertCircle,
        });
      }
    }

    // ALERTA DESTACADA 5: Cría con Número Temporal / Pendiente de Marcación y Chapeteo Oficial
    const isTemporary = animal.isTemporaryTag === true || 
      (typeof animal.tagNumber === 'string' && (
        animal.tagNumber.toUpperCase().startsWith('TEMP') ||
        animal.tagNumber.toUpperCase().startsWith('CRIA') ||
        animal.tagNumber.toUpperCase().startsWith('T-') ||
        animal.tagNumber.toUpperCase().startsWith('PROV')
      ));

    const birthDateStr = animal.birthDate || animal.entryDate;
    const ageInDays = birthDateStr ? getDaysDifference(birthDateStr, new Date()) : 0;
    const ageInMonths = Math.floor(ageInDays / 30.4);

    const needsBranding = isTemporary || (
      animal.entryType === 'Nacimiento' && 
      (!animal.ironBrand || animal.ironBrand.trim() === '' || animal.ironBrand === 'Sin marca') &&
      (animal.category === 'Ternero' || animal.category === 'Ternera') &&
      ageInMonths >= 3
    );

    if (isTemporary || needsBranding) {
      const motherInfo = animal.motherTag ? `(Madre: #${animal.motherTag})` : '';
      animalAlerts.push({
        id: `branding-${animal.id}`,
        animal,
        priority: isTemporary ? 1 : 2,
        type: 'branding_needed',
        badge: isTemporary ? '🏷️ N° TEMPORAL' : 'MARCA PENDIENTE',
        badgeClass: 'bg-amber-500 text-slate-950 font-black',
        title: `🏷️ Toca Marcar y Chapetear: #${animal.tagNumber} ${motherInfo}`,
        desc: isTemporary
          ? `Cría registrada con número provisional. Haz tap aquí para asignarle su chapa definitiva, el consecutivo del hato y el hierro de la finca.`
          : `Cría con ${ageInMonths} meses pendiente por colocarle la marca de hierro y el consecutivo de la finca. Haz tap para registrarla.`,
        icon: Tag,
        isBrandingAction: true,
      });
    }
  });

  // 2. Alertas de Identificaciones Duplicadas Activas
  const checkedTagKeys = new Set();
  const activeAnimals = cattle.filter(c => c.status === 'Activo');

  activeAnimals.forEach(animal => {
    if (!animal.tagNumber) return;
    const matches = findDuplicateCattle(
      {
        tagNumber: animal.tagNumber,
        ironBrand: animal.ironBrand,
        owner: animal.owner,
        id: animal.id,
      },
      activeAnimals,
      animal.id
    );

    if (matches.length > 0) {
      const match = matches[0];
      const otherAnimal = match.animal;
      const norm1 = normalizeTagNumber(animal.tagNumber);
      const norm2 = normalizeTagNumber(otherAnimal.tagNumber);
      const pairKey = [norm1, animal.id, otherAnimal.id].sort().join('::');

      if (!checkedTagKeys.has(pairKey)) {
        checkedTagKeys.add(pairKey);
        duplicateAlerts.push({
          id: `dup-${animal.id}-${otherAnimal.id}`,
          animal,
          priority: 1,
          type: 'urgent',
          title: `⚠️ Posible Identificación Duplicada: ${animal.tagNumber}`,
          desc: `Coincide con otro animal activo (${otherAnimal.tagNumber}) con misma ${
            match.matchType === 'tag_brand_and_owner' ? 'marca y dueño' : match.matchType === 'tag_and_brand' ? 'marca' : 'propiedad'
          }.`,
          icon: ShieldAlert,
        });
      }
    }
  });

  // 3. Alerta Sanitaria de Ciclos Oficiales ICA
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const hasAftosaRecorded = vaccinations.some(v => 
    (v.vaccineCodes?.includes('aftosa') || v.vaccineCode === 'aftosa' || (v.vaccineType && v.vaccineType.toLowerCase().includes('aftosa'))) &&
    new Date(v.date).getFullYear() === currentYear
  );

  let farmVaccineState = { isVaccinated: hasAftosaRecorded, ruvNumber: '' };
  try {
    const saved = localStorage.getItem(VACCINE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      farmVaccineState.isVaccinated = farmVaccineState.isVaccinated || parsed.isVaccinated;
      farmVaccineState.ruvNumber = parsed.ruvNumber || '';
    }
  } catch (e) {}

  if (hasAftosaRecorded) {
    const latestAftosa = vaccinations.find(v => (v.vaccineCodes?.includes('aftosa') || v.vaccineCode === 'aftosa' || v.vaccineType?.toLowerCase().includes('aftosa')));
    if (latestAftosa?.ruvNumber) {
      farmVaccineState.ruvNumber = latestAftosa.ruvNumber;
    }
  }

  if (currentMonth >= 5 && currentMonth <= 7) {
    if (!farmVaccineState.isVaccinated) {
      sanitaryAlerts.push({
        id: 'vaccine-cycle-1',
        priority: 2,
        type: 'urgent',
        title: '⚡ ¡Estás en el Ciclo I de Vacunación!',
        desc: 'Ciclo obligatorio ICA en curso. Vacuna contra Aftosa, Brucelosis y solicita tu RUV.',
        icon: Syringe,
      });
    }
  } else if (currentMonth >= 10 && currentMonth <= 12) {
    if (!farmVaccineState.isVaccinated) {
      sanitaryAlerts.push({
        id: 'vaccine-cycle-2',
        priority: 2,
        type: 'urgent',
        title: '⚡ ¡Estás en el Ciclo II de Vacunación!',
        desc: 'Revacunación obligatoria del hato en curso. Exige tu certificado RUV para movilizar.',
        icon: Syringe,
      });
    }
  } else if (currentMonth === 3 || currentMonth === 4) {
    sanitaryAlerts.push({
      id: 'vaccine-approaching-1',
      priority: 3,
      type: 'warning',
      title: '⏳ Se aproxima el Ciclo I de Vacunación',
      desc: 'El ciclo oficial ICA inicia en Mayo. Prepara censo del hato y jeringas para la brigada.',
      icon: Clock,
    });
  } else if (currentMonth === 9) {
    sanitaryAlerts.push({
      id: 'vaccine-approaching-2',
      priority: 3,
      type: 'warning',
      title: '⏳ Se aproxima el Ciclo II de Vacunación',
      desc: 'El segundo ciclo oficial inicia en Octubre/Noviembre. Revisa terneras nuevas de 3 a 9 meses.',
      icon: Clock,
    });
  } else if (currentMonth === 8 || currentMonth === 1 || currentMonth === 2) {
    sanitaryAlerts.push({
      id: 'vaccine-finished',
      priority: 4,
      type: 'info',
      title: '🏁 Finalizó el ciclo de vacunación',
      desc: farmVaccineState.ruvNumber 
        ? `RUV N° ${farmVaccineState.ruvNumber} activo para tramitar Guías de Movilización (GSMI).`
        : 'Ciclo oficial cerrado. Verifica que tu RUV esté activo en SIGMA para movilizar ganado.',
      icon: CheckCircle2,
    });
  }

  // 4. Alertas de Revacunaciones y Dosis de Refuerzo Programadas
  const boosterAlerts = [];
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  vaccinations.forEach(vac => {
    if (!vac.requiresBooster || !vac.boosterDate || vac.boosterCompleted) return;

    try {
      const parts = vac.boosterDate.split('-');
      if (parts.length !== 3) return;
      const bDateMid = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
      const diffDays = Math.round((bDateMid - todayMid) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        boosterAlerts.push({
          id: `booster-today-${vac.id}`,
          priority: 1,
          type: 'booster_today',
          badge: '🚨 ¡HOY!',
          badgeClass: 'bg-rose-600 text-white animate-pulse',
          title: `🚨 ¡HOY! Revacunación: ${vac.vaccineType}`,
          desc: `Hoy se debe aplicar el refuerzo obligatorio a: ${vac.targetLabel || 'Hato'}. Registrado el ${formatDate(vac.date)}.${vac.boosterNotes ? ` Indicación: "${vac.boosterNotes}"` : ''}`,
          icon: Syringe,
          vac
        });
      } else if (diffDays === 1) {
        boosterAlerts.push({
          id: `booster-tomorrow-${vac.id}`,
          priority: 1,
          type: 'booster_tomorrow',
          badge: '⏰ ¡MAÑANA!',
          badgeClass: 'bg-amber-500 text-slate-950 font-black',
          title: `⏰ ¡MAÑANA! Revacunación: ${vac.vaccineType}`,
          desc: `Aviso previo: Mañana se debe aplicar la dosis de refuerzo a: ${vac.targetLabel || 'Hato'}. Alistar jeringas y lote en corral.${vac.boosterNotes ? ` Indicación: "${vac.boosterNotes}"` : ''}`,
          icon: Clock,
          vac
        });
      } else if (diffDays < 0) {
        const daysLate = Math.abs(diffDays);
        boosterAlerts.push({
          id: `booster-overdue-${vac.id}`,
          priority: 1,
          type: 'urgent',
          badge: `⚠️ ATRASADA (${daysLate}d)`,
          badgeClass: 'bg-rose-700 text-white',
          title: `⚠️ Revacunación Atrasada (${daysLate} días): ${vac.vaccineType}`,
          desc: `Debió aplicarse el ${formatDate(vac.boosterDate)} para ${vac.targetLabel || 'Hato'}. Aplicar cuanto antes.${vac.boosterNotes ? ` Indicación: "${vac.boosterNotes}"` : ''}`,
          icon: AlertCircle,
          vac
        });
      } else if (diffDays >= 2 && diffDays <= 7) {
        boosterAlerts.push({
          id: `booster-upcoming-${vac.id}`,
          priority: 2,
          type: 'info',
          badge: `En ${diffDays} días`,
          badgeClass: 'bg-blue-600 text-white',
          title: `💉 Próxima Revacunación en ${diffDays} días: ${vac.vaccineType}`,
          desc: `Programada para el ${formatDate(vac.boosterDate)} (${vac.targetLabel || 'Hato'}).`,
          icon: Syringe,
          vac
        });
      }
    } catch (e) {}
  });

  // Combinar todas las alertas potenciales generadas dinámicamente
  const combinedAlerts = [...boosterAlerts, ...duplicateAlerts, ...animalAlerts, ...sanitaryAlerts];

  // FILTRAR: Excluir las alertas que ya hayan sido resueltas (chuleadas) o canceladas por el usuario
  const activeAlerts = useMemo(() => {
    const resolutions = alertsData.resolutions || {};
    return combinedAlerts.filter(alert => !resolutions[alert.id]);
  }, [combinedAlerts, alertsData]);

  const attendedCount = useMemo(() => {
    const list = Object.values(alertsData.resolutions || {});
    return list.filter(r => r.status === 'attended').length;
  }, [alertsData]);

  const dismissedCount = useMemo(() => {
    const list = Object.values(alertsData.resolutions || {});
    return list.filter(r => r.status === 'dismissed').length;
  }, [alertsData]);

  // Manejadores de acciones rápidas (Chulear ✓ / Cancelar ✕)
  const handleTriggerQuickAttend = (alert, e) => {
    if (e) e.stopPropagation();
    setQuickActionAlert(alert);
    setQuickActionType('attend');
    setQuickActionNotes('Atendida en finca');
  };

  const handleTriggerQuickDismiss = (alert, e) => {
    if (e) e.stopPropagation();
    setQuickActionAlert(alert);
    setQuickActionType('dismiss');
    setQuickActionNotes('Falsa alarma / No aplica');
  };

  const handleConfirmQuickAction = async () => {
    if (!quickActionAlert || !quickActionType) return;
    setIsSubmittingQuick(true);
    try {
      if (quickActionType === 'attend') {
        await markAlertAttended({
          alert: quickActionAlert,
          notes: quickActionNotes,
          operatorName,
          operatorRole,
          userId: effectiveUserId
        });
      } else if (quickActionType === 'dismiss') {
        await markAlertDismissed({
          alert: quickActionAlert,
          reason: quickActionNotes,
          operatorName,
          operatorRole,
          userId: effectiveUserId
        });
      }
      setQuickActionAlert(null);
      setQuickActionType(null);
      setQuickActionNotes('');
    } catch (err) {
      console.error('Error aplicando acción rápida en alerta:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Encabezado con Botón de Auditoría & Trazabilidad */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <BellRing className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Alertas del Hato
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
            {activeAlerts.length}
          </span>
        </div>

        {/* Botón de Auditoría & Trazabilidad */}
        <button
          type="button"
          onClick={() => setIsAuditModalOpen(true)}
          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700/70 shadow-xs"
          title="Ver historial de alertas atendidas, canceladas y trazabilidad auditada"
        >
          <ClipboardList className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Auditoría & Trazabilidad</span>
          <span className="sm:hidden">Auditoría</span>
          {(attendedCount + dismissedCount) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white">
              {attendedCount + dismissedCount}
            </span>
          )}
        </button>
      </div>

      {/* Si no hay alertas activas */}
      {activeAlerts.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
          <Sparkles className="w-8 h-8 text-emerald-500/60" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
            ¡Todo al día en el hato!
          </p>
          <p className="text-xs text-slate-500">
            No hay alertas zootécnicas pendientes de partos, destetes ni vacunación.
          </p>
          {(attendedCount > 0 || dismissedCount > 0) && (
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Ver {attendedCount} alertas chuleadas y {dismissedCount} canceladas</span>
            </button>
          )}
        </div>
      ) : (
        activeAlerts.slice(0, 6).map(alert => {
          const Icon = alert.icon;
          const colorStyles = {
            fat_ready: 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-400 dark:border-amber-500/50 text-amber-950 dark:text-amber-200',
            booster_today: 'bg-gradient-to-r from-rose-500/20 via-red-500/10 to-transparent border-rose-400 dark:border-rose-500/60 text-rose-950 dark:text-rose-200 ring-1 ring-rose-500/30',
            booster_tomorrow: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-amber-400 dark:border-amber-500/60 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30',
            branding_needed: 'bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-amber-400 dark:border-amber-500/60 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30',
            urgent: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300',
            warning: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
            info: 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-300',
          };

          const handleCardClick = () => {
            if (alert.isBrandingAction && onOpenBranding) {
              onOpenBranding(alert.animal);
            } else if (alert.animal && onSelectAnimal) {
              onSelectAnimal(alert.animal);
            }
          };

          return (
            <div
              key={alert.id}
              onClick={handleCardClick}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition shadow-sm ${alert.animal ? 'cursor-pointer hover:opacity-95' : ''} ${colorStyles[alert.type] || colorStyles.info}`}
            >
              <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 mt-0.5 shrink-0">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {alert.title}
                  </h5>

                  {/* Acciones de Chulear (✓) y Cancelar (✕) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {alert.badge ? (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${alert.badgeClass || 'bg-emerald-500 text-slate-950'}`}>
                        {alert.badge}
                      </span>
                    ) : alert.type === 'fat_ready' ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 animate-pulse">
                        ≥ 480 kg
                      </span>
                    ) : null}

                    {/* Botón Chulear (✓) */}
                    <button
                      type="button"
                      onClick={(e) => handleTriggerQuickAttend(alert, e)}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black transition cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      title="Chulear / Marcar como atendida"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Cancelar (✕) */}
                    <button
                      type="button"
                      onClick={(e) => handleTriggerQuickDismiss(alert, e)}
                      className="p-1 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-rose-600 dark:hover:bg-rose-600 text-slate-500 hover:text-white transition cursor-pointer border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95"
                      title="Cancelar / Descartar alerta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                  {alert.desc}
                </p>
                
                {/* Acción directa de Parto */}
                {alert.isCalving && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCalving) onOpenCalving(alert.animal);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition cursor-pointer"
                    >
                      <Baby className="w-3.5 h-3.5" />
                      <span>🍼 Registrar Parto</span>
                    </button>
                  </div>
                )}

                {/* Acción directa de Marcación / Chapeteo */}
                {alert.isBrandingAction && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenBranding) onOpenBranding(alert.animal);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>🏷️ Marcar / Chapetear</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Modal Completo de Auditoría & Trazabilidad */}
      <AlertsAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        activeAlerts={activeAlerts}
        alertsData={alertsData}
        userId={effectiveUserId}
        currentUser={effectiveUser}
        onOpenCalving={onOpenCalving}
        onOpenBranding={onOpenBranding}
        onSelectAnimal={onSelectAnimal}
      />

      {/* Popup rápido de confirmación al hacer tap en Chulear o Cancelar en el Dashboard */}
      {quickActionAlert && (
        <div 
          className="fixed inset-0 z-[95] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setQuickActionAlert(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-xl ${quickActionType === 'attend' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                  {quickActionType === 'attend' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                  {quickActionType === 'attend' ? 'Chulear / Atender Alerta' : 'Cancelar / Descartar'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionAlert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-black text-slate-900 dark:text-white">{quickActionAlert.title}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{quickActionAlert.desc}</p>
            </div>

            {/* Presets rápidos */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                {quickActionType === 'attend' ? 'Nota u observación:' : 'Motivo:'}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickActionType === 'attend' ? (
                  ['✓ Atendida en corral', '✓ Pesaje verificado', '✓ Separada'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQuickActionNotes(opt)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))
                ) : (
                  ['✕ Falsa alarma', '✕ No aplica', '✕ Postergar'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQuickActionNotes(opt)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))
                )}
              </div>
              <input
                type="text"
                value={quickActionNotes}
                onChange={(e) => setQuickActionNotes(e.target.value)}
                placeholder="Escribe un detalle opcional..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuickActionAlert(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={isSubmittingQuick}
                onClick={handleConfirmQuickAction}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  quickActionType === 'attend'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {quickActionType === 'attend' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Chulear</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>✕ Cancelar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
