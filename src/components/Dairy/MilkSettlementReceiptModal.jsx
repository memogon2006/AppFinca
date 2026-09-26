import React from 'react';
import { Modal } from '../Common/Modal';
import { 
  Receipt, 
  Share2, 
  Printer, 
  Calendar, 
  Building2, 
  Milk, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

export function MilkSettlementReceiptModal({
  isOpen,
  onClose,
  settlement,
  farmName = 'Mi Finca Ganadera',
  zIndex = 'z-50'
}) {
  if (!settlement) return null;

  const handleShareWhatsApp = () => {
    const lines = [
      `🧾 *LIQUIDACIÓN DE VENTA DE LECHE*`,
      `🏡 *Finca:* ${farmName}`,
      `🏢 *Comprador:* ${settlement.buyer || 'Planta / Acopio'}`,
      `📅 *Período:* ${formatDate(settlement.startDate)} al ${formatDate(settlement.endDate)} (${settlement.periodType?.toUpperCase() || 'QUINCENAL'})`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🥛 *Litros Entregados:* ${formatNumber(settlement.totalLiters, 1)} Litros`,
      `💵 *Precio Base:* ${formatCurrency(settlement.pricePerLiter)} / Litro`,
      `📊 *Subtotal Bruto:* ${formatCurrency(settlement.baseAmount || (settlement.totalLiters * settlement.pricePerLiter))}`,
    ];

    if (settlement.bonuses > 0) {
      lines.push(`✨ *Bonificaciones (+):* ${formatCurrency(settlement.bonuses)}`);
    }

    const brk = settlement.deductionsBreakdown;
    if (brk) {
      if (brk.fleteAmount > 0) {
        lines.push(`🚛 *Flete / Transporte (-):* -${formatCurrency(brk.fleteAmount)}${brk.fleteMode === 'per_liter' ? ` ($${brk.fletePerLiter}/L)` : ''}`);
      }
      if (brk.fondoAmount > 0) {
        lines.push(`🏛️ *Fondo Ganadero FNG (-):* -${formatCurrency(brk.fondoAmount)}${brk.fondoMode === 'percent' ? ` (${brk.fondoPercent}%)` : ''}`);
      }
      if (brk.otherDeductions > 0) {
        lines.push(`🔻 *Otras Deducciones (-):* -${formatCurrency(brk.otherDeductions)}`);
      }
    } else if (settlement.deductions > 0) {
      lines.push(`🔻 *Deducciones Totales (-):* -${formatCurrency(settlement.deductions)}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *TOTAL NETO A COBRAR:* ${formatCurrency(settlement.totalValue)}`);
    if (settlement.totalLiters > 0) {
      lines.push(`📈 *Precio Real Neto:* ${formatCurrency(settlement.totalValue / settlement.totalLiters)} / Litro`);
    }
    lines.push(`📌 *Estado:* ${settlement.paymentStatus === 'Pagada' ? '✅ PAGADA' : '🟡 PENDIENTE DE COBRO'}`);
    if (settlement.paymentDate) {
      lines.push(`🗓️ *Fecha de Pago:* ${formatDate(settlement.paymentDate)}`);
    }
    if (settlement.notes) {
      lines.push(`📝 *Notas:* ${settlement.notes}`);
    }

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    triggerFeedback('single');
  };

  const handlePrint = () => {
    window.print();
  };

  const brk = settlement.deductionsBreakdown;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧾 Volante de Liquidación de Leche"
      zIndex={zIndex}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        
        {/* Encabezado del Recibo */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight uppercase">{farmName}</h3>
                <p className="text-xs text-emerald-100 font-medium">Comprobante de Venta & Liquidación Lechera</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              settlement.paymentStatus === 'Pagada' 
                ? 'bg-white text-emerald-800' 
                : 'bg-amber-400 text-slate-950'
            }`}>
              {settlement.paymentStatus || 'Pagada'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs text-emerald-100">
            <div>
              <span className="opacity-75 block text-[10px]">Comprador / Planta:</span>
              <strong className="text-white font-bold text-sm truncate block">{settlement.buyer || 'Planta'}</strong>
            </div>
            <div className="text-right">
              <span className="opacity-75 block text-[10px]">Período Liquidado:</span>
              <strong className="text-white font-bold text-sm block">
                {formatDate(settlement.startDate)} - {formatDate(settlement.endDate)}
              </strong>
            </div>
          </div>
        </div>

        {/* Detalle Zootécnico y Económico */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/80">
          <div className="p-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <Milk className="w-4 h-4 text-blue-500" />
              <span>Volumen Total Entregado</span>
            </span>
            <strong className="text-slate-900 dark:text-white font-black text-base tabular-nums">
              {formatNumber(settlement.totalLiters, 1)} Litros
            </strong>
          </div>

          <div className="p-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Precio Base Pactado</span>
            </span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums">
              {formatCurrency(settlement.pricePerLiter)} / Litro
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between text-sm bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal Bruto</span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums">
              {formatCurrency(settlement.baseAmount || (settlement.totalLiters * settlement.pricePerLiter))}
            </span>
          </div>

          {settlement.bonuses > 0 && (
            <div className="p-3.5 flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span className="font-medium flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>Bonificaciones (Calidad, Frío, Volumen)</span>
              </span>
              <strong className="font-black tabular-nums">
                + {formatCurrency(settlement.bonuses)}
              </strong>
            </div>
          )}

          {/* Desglose de Deducciones */}
          {brk ? (
            <>
              {brk.fleteAmount > 0 && (
                <div className="p-3.5 flex items-center justify-between text-sm text-rose-600 dark:text-rose-400">
                  <span className="font-medium flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Flete / Transporte {brk.fleteMode === 'per_liter' ? `($${brk.fletePerLiter}/L)` : ''}</span>
                  </span>
                  <strong className="font-black tabular-nums">
                    - {formatCurrency(brk.fleteAmount)}
                  </strong>
                </div>
              )}

              {brk.fondoAmount > 0 && (
                <div className="p-3.5 flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span className="font-medium flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Fondo Ganadero (FNG) {brk.fondoMode === 'percent' ? `(${brk.fondoPercent}%)` : ''}</span>
                  </span>
                  <strong className="font-black tabular-nums">
                    - {formatCurrency(brk.fondoAmount)}
                  </strong>
                </div>
              )}

              {brk.otherDeductions > 0 && (
                <div className="p-3.5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Otras Deducciones / Retenciones</span>
                  </span>
                  <strong className="font-black tabular-nums">
                    - {formatCurrency(brk.otherDeductions)}
                  </strong>
                </div>
              )}
            </>
          ) : (
            settlement.deductions > 0 && (
              <div className="p-3.5 flex items-center justify-between text-sm text-rose-600 dark:text-rose-400">
                <span className="font-medium flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deducciones Totales (Fletes, Retenciones, Pruebas)</span>
                </span>
                <strong className="font-black tabular-nums">
                  - {formatCurrency(settlement.deductions)}
                </strong>
              </div>
            )
          )}

          {/* TOTAL NETO */}
          <div className="p-4 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border-t-2 border-emerald-500">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Total Neto Liquidado
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {settlement.totalLiters > 0 ? `Promedio Real: ${formatCurrency(settlement.totalValue / settlement.totalLiters)}/L` : ''}
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(settlement.totalValue)}
            </p>
          </div>
        </div>

        {/* Notas y Enlace Contable */}
        {settlement.notes && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <strong className="font-bold text-slate-800 dark:text-slate-200">Notas: </strong>
            <span>{settlement.notes}</span>
          </div>
        )}

        {/* Botones de Compartir y Cerrar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </Modal>
  );
}
