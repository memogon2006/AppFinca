import React from 'react';
import { AlertCircle, Calendar, Sparkles, Scale, HeartHandshake } from 'lucide-react';
import { calculateReproduction } from '../../services/calculations';

export function AlertsList({ cattle = [], onSelectAnimal }) {
  const alerts = [];

  cattle.forEach(animal => {
    if (animal.status !== 'Activo') return;

    // Alerta de parto cercano
    if (animal.sex === 'Hembra' && animal.reproductiveStatus === 'Preñada') {
      const repro = calculateReproduction(animal);
      if (repro.daysUntilCalving !== null && repro.daysUntilCalving <= 30) {
        alerts.push({
          id: `calving-${animal.id}`,
          animal,
          type: repro.daysUntilCalving <= 10 ? 'urgent' : 'warning',
          title: `Próximo Parto: ${animal.tagNumber} ${animal.name ? `(${animal.name})` : ''}`,
          desc: repro.daysUntilCalving <= 0 
            ? '¡Fecha estimada de parto cumplida!' 
            : `Faltan aproximadamente ${repro.daysUntilCalving} días para el parto (${repro.expectedCalvingDate}).`,
          icon: HeartHandshake,
        });
      }
    }

    // Alerta de peso listo para venta en ceba (> 480kg)
    if (animal.productionType === 'Ceba' && (animal.currentWeight || animal.entryWeight) >= 480) {
      alerts.push({
        id: `sale-ready-${animal.id}`,
        animal,
        type: 'info',
        title: `Listo para Venta (Ceba): ${animal.tagNumber}`,
        desc: `Alcanzó peso óptimo de ${animal.currentWeight || animal.entryWeight} kg para beneficio/mercado.`,
        icon: Scale,
      });
    }

    // Alerta de hembra en servicio pendiente de palpación/ecografía (+45 días)
    if (animal.sex === 'Hembra' && animal.reproductiveStatus === 'En Servicio' && animal.serviceDate) {
      const serviceDays = Math.floor((new Date() - new Date(animal.serviceDate)) / (1000 * 60 * 60 * 24));
      if (serviceDays >= 45) {
        alerts.push({
          id: `check-${animal.id}`,
          animal,
          type: 'warning',
          title: `Chequeo Reproductivo: ${animal.tagNumber}`,
          desc: `Han pasado ${serviceDays} días desde el servicio (${animal.serviceDate}). Requiere palpación/ecografía.`,
          icon: AlertCircle,
        });
      }
    }
  });

  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
        <Sparkles className="w-8 h-8 text-emerald-500/60" />
        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">¡Todo al día en el hato!</p>
        <p className="text-xs text-slate-500">No hay alertas de partos urgentes ni chequeos pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.slice(0, 5).map(alert => {
        const Icon = alert.icon;
        const colorStyles = {
          urgent: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300',
          warning: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
          info: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
        };

        return (
          <div
            key={alert.id}
            onClick={() => onSelectAnimal && onSelectAnimal(alert.animal)}
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer hover:opacity-90 transition shadow-sm ${colorStyles[alert.type] || colorStyles.info}`}
          >
            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 mt-0.5">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{alert.title}</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{alert.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
