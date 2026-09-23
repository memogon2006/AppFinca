import React from 'react';
import { AlertCircle, Sparkles, Scale, HeartHandshake, Flame, Syringe, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { calculateReproduction, formatDate, getDaysDifference } from '../../services/calculations';
import { findDuplicateCattle, normalizeTagNumber, normalizeText } from '../../services/duplicateDetectionService';

const VACCINE_STORAGE_KEY = 'ganado_colombia_vaccine_status';

export function AlertsList({ cattle = [], weighings = [], vaccinations = [], onSelectAnimal }) {
  const animalAlerts = [];
  const sanitaryAlerts = [];
  const duplicateAlerts = [];

  // 1. Alertas individuales de bovinos prioritarios (Pesos de venta, partos, chequeos)
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
        });
      }
    }

    // ALERTA 3: Chequeo reproductivo (+45 días post-servicio)
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
        // ALARMA DÍA D: ¡HOY!
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
        // ALARMA DÍA ANTES: ¡MAÑANA!
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
        // ALARMA ATRASADA / VENCIDA
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
        // PRÓXIMA (en los siguientes 2 a 7 días)
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

  // Combinar: Alarmas urgentes de Revacunación, Duplicados y animales críticos van primero
  const combinedAlerts = [...boosterAlerts, ...duplicateAlerts, ...animalAlerts, ...sanitaryAlerts];

  if (combinedAlerts.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
        <Sparkles className="w-8 h-8 text-emerald-500/60" />
        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">¡Todo al día en el hato!</p>
        <p className="text-xs text-slate-500">No hay alertas urgentes de partos, ventas ni vacunación pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {combinedAlerts.slice(0, 6).map(alert => {
        const Icon = alert.icon;
        const colorStyles = {
          fat_ready: 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-400 dark:border-amber-500/50 text-amber-950 dark:text-amber-200',
          booster_today: 'bg-gradient-to-r from-rose-500/20 via-red-500/10 to-transparent border-rose-400 dark:border-rose-500/60 text-rose-950 dark:text-rose-200 ring-1 ring-rose-500/30',
          booster_tomorrow: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-amber-400 dark:border-amber-500/60 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30',
          urgent: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300',
          warning: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
          info: 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-300',
        };

        return (
          <div
            key={alert.id}
            onClick={() => alert.animal && onSelectAnimal && onSelectAnimal(alert.animal)}
            className={`p-3.5 rounded-2xl border flex items-start gap-3 transition shadow-sm ${alert.animal ? 'cursor-pointer hover:opacity-95' : ''} ${colorStyles[alert.type] || colorStyles.info}`}
          >
            <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 mt-0.5 flex-shrink-0">
              <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{alert.title}</h5>
                {alert.badge ? (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${alert.badgeClass || 'bg-emerald-500 text-slate-950'}`}>
                    {alert.badge}
                  </span>
                ) : alert.type === 'fat_ready' ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex-shrink-0 animate-pulse">
                    ≥ 480 kg
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{alert.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
