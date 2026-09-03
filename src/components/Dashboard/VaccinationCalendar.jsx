import React, { useState } from 'react';
import { 
  Syringe, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Baby, 
  Layers,
  AlertTriangle,
  Info,
  Check,
  FileText
} from 'lucide-react';

export function VaccinationCalendar({ cattle = [] }) {
  const currentMonthIdx = new Date().getMonth(); // 0 = Ene, 11 = Dic
  const monthNumber = currentMonthIdx + 1;

  const activeCattle = cattle.filter(c => c.status === 'Activo');
  const totalActive = activeCattle.length;
  
  // Hembras candidatas a Brucelosis (Terneras y Novillas jóvenes de 3 a 9 meses)
  const females = activeCattle.filter(c => c.sex === 'Hembra');
  const youngFemales = females.filter(c => 
    c.category === 'Ternera' || 
    c.category === 'Novilla' || 
    c.category === 'Novilla de vientre'
  );
  const brucellosisCount = youngFemales.length > 0 ? youngFemales.length : Math.ceil(females.length * 0.35);

  const aftosaCount = totalActive;
  const carbonCount = totalActive;

  // Estado Oficial del Ciclo en Colombia
  let cycleStatus = {
    stateTag: '⏳ SE APROXIMA EL CICLO',
    stateBadge: 'bg-amber-500 text-slate-950',
    title: 'Se acerca el Ciclo I Oficial de Vacunación (Mayo – Junio)',
    actionText: 'Prepara el censo de animales en finca, jeringas y programa la visita de la brigada de Fedegán.',
    bgColor: 'bg-amber-50/70 dark:bg-amber-950/30',
    borderColor: 'border-amber-300 dark:border-amber-500/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  };

  if (monthNumber >= 5 && monthNumber <= 7) {
    cycleStatus = {
      stateTag: '⚡ ¡ESTÁS EN EL CICLO DE VACUNACIÓN!',
      stateBadge: 'bg-emerald-600 text-white animate-pulse',
      title: 'Ciclo I Oficial ICA / Fedegán en Curso (Mayo – Julio)',
      actionText: 'Debes vacunar el 100% de bovinos contra Aftosa, terneras contra Brucelosis y exigir tu certificado RUV.',
      bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-300 dark:border-emerald-500/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    };
  } else if (monthNumber === 8) {
    cycleStatus = {
      stateTag: '🏁 FINALIZÓ EL CICLO',
      stateBadge: 'bg-blue-600 text-white',
      title: 'El Ciclo I Oficial ha cerrado',
      actionText: 'Verifica que tu RUV esté cargado en el sistema SIGMA del ICA para tramitar Guías de Movilización (GSMI).',
      bgColor: 'bg-blue-50/70 dark:bg-blue-950/30',
      borderColor: 'border-blue-300 dark:border-blue-500/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    };
  } else if (monthNumber === 9) {
    cycleStatus = {
      stateTag: '⏳ SE APROXIMA EL CICLO',
      stateBadge: 'bg-amber-500 text-slate-950',
      title: 'Se acerca el Ciclo II Oficial de Revacunación (Octubre – Noviembre)',
      actionText: 'Revisa las terneras nacidas en el año para Brucelosis y alista el censo para revacunación de Aftosa.',
      bgColor: 'bg-amber-50/70 dark:bg-amber-950/30',
      borderColor: 'border-amber-300 dark:border-amber-500/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    };
  } else if (monthNumber >= 10 && monthNumber <= 12) {
    cycleStatus = {
      stateTag: '⚡ ¡ESTÁS EN EL CICLO DE VACUNACIÓN!',
      stateBadge: 'bg-emerald-600 text-white animate-pulse',
      title: 'Ciclo II Oficial ICA / Fedegán en Curso (Octubre – Diciembre)',
      actionText: 'Revacunación obligatoria del 100% del hato contra Fiebre Aftosa. El vacunador debe expedir tu RUV.',
      bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-300 dark:border-emerald-500/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    };
  } else {
    // Enero y Febrero
    cycleStatus = {
      stateTag: '🏁 FINALIZÓ EL CICLO',
      stateBadge: 'bg-slate-700 text-white',
      title: 'Ciclo II Cerrado (RUV Activo y Vigente)',
      actionText: 'Tu certificado RUV anterior te permite expedir guías de movilización y venta. El próximo ciclo inicia en Mayo.',
      bgColor: 'bg-slate-50/70 dark:bg-slate-900/60',
      borderColor: 'border-slate-300 dark:border-slate-700',
      iconColor: 'text-slate-600 dark:text-slate-400',
    };
  }

  // Las 4 Temporadas Clave del Año Ganadero Colombiano
  const seasons = [
    {
      id: 'season-1',
      period: 'Marzo – Abril',
      name: 'Temporada 1: Entrada de Aguas',
      focus: '🔥 Carbón Sintomático (Triple / Mancha)',
      desc: 'Vacunación preventiva antes del inicio de lluvias para evitar muerte súbita por Clostridiosis.',
      target: `Todo el hato joven y adultos (${carbonCount} cabezas)`,
      isActive: monthNumber >= 3 && monthNumber <= 4,
      color: 'amber'
    },
    {
      id: 'season-2',
      period: 'Mayo – Junio',
      name: 'Temporada 2: Ciclo I Oficial ICA',
      focus: '🏛️ Fiebre Aftosa + Brucelosis',
      desc: 'Visita oficial del vacunador de Fedegán. Obligatorio para poder vender y movilizar ganado (RUV).',
      target: `100% del Hato (${aftosaCount} dosis) + Terneras (${brucellosisCount} dosis)`,
      isActive: monthNumber >= 5 && monthNumber <= 7,
      color: 'emerald'
    },
    {
      id: 'season-3',
      period: 'Septiembre – Octubre',
      name: 'Temporada 3: Transición de Lluvias',
      focus: '🔥 Refuerzo de Carbón + Vitaminas',
      desc: 'Refuerzo semestral de Clostridiosis + complejo de Vitaminas A, D, E para sostener la ganancia de peso.',
      target: `Lotes de ceba y hembras (${carbonCount} cabezas)`,
      isActive: monthNumber >= 8 && monthNumber <= 9,
      color: 'amber'
    },
    {
      id: 'season-4',
      period: 'Noviembre – Diciembre',
      name: 'Temporada 4: Ciclo II Oficial ICA',
      focus: '🏛️ Revacunación Aftosa + Brucelosis',
      desc: 'Segundo ciclo obligatorio nacional para mantener el estatus sanitario libre de aftosa.',
      target: `100% del Hato (${aftosaCount} dosis) + Terneras nuevas`,
      isActive: monthNumber >= 10 && monthNumber <= 12 || monthNumber <= 2,
      color: 'emerald'
    }
  ];

  return (
    <div className="custom-card p-5 sm:p-6 space-y-6">
      
      {/* 1. ENCABEZADO Y ALERTA DINÁMICA PRINCIPAL */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cycleStatus.bgColor} ${cycleStatus.borderColor} shadow-sm space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0 mt-0.5 shadow-sm">
              <Syringe className={`w-5 h-5 ${cycleStatus.iconColor}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] uppercase tracking-wider ${cycleStatus.stateBadge}`}>
                  {cycleStatus.stateTag}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {cycleStatus.title}
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                👉 <strong>¿Qué debes hacer en tu finca?:</strong> {cycleStatus.actionText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LAS 3 VACUNAS CLAVE: CUÁNDO, A QUIÉNES Y CUÁNTOS ANIMALES DE TU FINCA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Las 3 Vacunas Principales para tu Finca (Guía Rápida)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conoce con exactitud qué previene cada vacuna, en qué fechas se aplica y cuántas dosis necesitas.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
            Inventario Activo: {totalActive} bovinos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* TARJETA 1: FIEBRE AFTOSA */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wide">
                  Obligatoria ICA
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  Mayo y Noviembre
                </span>
              </div>

              <h5 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>1. Fiebre Aftosa</span>
              </h5>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>¿Para qué sirve?:</strong> Evita llagas en la boca y pezuñas que impiden comer y caminar al ganado.
              </p>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-500/20 text-xs space-y-1">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>¿A quién se aplica?:</strong> A <strong>todo el hato</strong> (machos y hembras de todas las edades).
                </p>
                <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                  <strong>Requisito legal:</strong> Indispensable para que Fedegán expida tu RUV y puedas vender o movilizar.
                </p>
              </div>
            </div>

            {/* Dosis de tu finca */}
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">En tu finca:</span>
              <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg">
                {aftosaCount} dosis ({aftosaCount} cabezas)
              </span>
            </div>
          </div>

          {/* TARJETA 2: BRUCELOSIS BOVINA */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wide">
                  Obligatoria ICA
                </span>
                <span className="text-xs font-black text-purple-700 dark:text-purple-400">
                  Todo el Año (Ciclos)
                </span>
              </div>

              <h5 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>2. Brucelosis Bovina</span>
              </h5>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>¿Para qué sirve?:</strong> Previene abortos en los últimos 3 meses de gestación y retención de placenta.
              </p>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-500/20 text-xs space-y-1">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>¿A quién se aplica?:</strong> Únicamente a <strong>terneras y novillas hembras de 3 a 9 meses</strong>.
                </p>
                <p className="text-purple-700 dark:text-purple-400 font-bold">
                  <strong>Dosis única:</strong> Se aplica una sola vez en la vida del animal (Cepa 19 o Cepa RB51).
                </p>
              </div>
            </div>

            {/* Dosis de tu finca */}
            <div className="pt-2 border-t border-purple-200 dark:border-purple-500/30 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">En tu finca:</span>
              <span className="font-black text-purple-700 dark:text-purple-300 text-sm bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-lg">
                ~{brucellosisCount} hembras jóvenes
              </span>
            </div>
          </div>

          {/* TARJETA 3: CARBÓN SINTOMÁTICO / MANCHA */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wide">
                  Preventiva de Finca
                </span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  Marzo y Septiembre
                </span>
              </div>

              <h5 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>3. Carbón (Triple / Mancha)</span>
              </h5>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>¿Para qué sirve?:</strong> Evita la muerte súbita por pierna negra (hinchazón muscular con gas crepitante).
              </p>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-500/20 text-xs space-y-1">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>¿A quién se aplica?:</strong> Terneros desde los <strong>3 meses</strong> (con refuerzo a los 21 días) y revacunación semestral del hato.
                </p>
                <p className="text-amber-800 dark:text-amber-300 font-bold">
                  <strong>Momento clave:</strong> Aplicar siempre antes de la entrada de lluvias (humedad).
                </p>
              </div>
            </div>

            {/* Dosis de tu finca */}
            <div className="pt-2 border-t border-amber-200 dark:border-amber-500/30 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">En tu finca:</span>
              <span className="font-black text-amber-900 dark:text-amber-300 text-sm bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-lg">
                ~{carbonCount} dosis
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. LÍNEA DE TIEMPO DEL AÑO GANADERO (4 TEMPORADAS CLARAS) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cronograma Anual por Temporadas (¿Cuándo aplicar cada una?)</span>
          </h4>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
            📍 Mes actual: {new Date().toLocaleDateString('es-CO', { month: 'long' }).toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {seasons.map((s) => (
            <div 
              key={s.id}
              className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between space-y-2.5 ${
                s.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              {s.isActive && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] shadow-sm animate-pulse">
                  📍 Temporada Actual
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400">
                    {s.period}
                  </span>
                </div>

                <h6 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white mt-1">
                  {s.focus}
                </h6>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <strong>Población:</strong> {s.target}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
