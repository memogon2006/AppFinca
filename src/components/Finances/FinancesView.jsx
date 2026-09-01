import React from 'react';
import { DollarSign, TrendingUp, ShieldCheck, Undo2, Trash2, Eye } from 'lucide-react';
import { formatCurrency, formatNumber, calculateFinancials } from '../../services/calculations';

export function FinancesView({ cattle = [], onSelectAnimal, onRevertSale, onDeleteAnimal }) {
  const soldCattle = cattle.filter(c => c.status === 'Vendido');
  const activeCattle = cattle.filter(c => c.status === 'Activo');

  let totalSalesRevenue = 0;
  let totalCostSold = 0;
  let totalRealizedProfit = 0;

  soldCattle.forEach(c => {
    const fin = calculateFinancials(c);
    totalSalesRevenue += parseFloat(c.exitPrice) || 0;
    totalCostSold += fin.totalInvested;
    totalRealizedProfit += fin.netProfit;
  });

  const overallRealizedRoi = totalCostSold > 0 ? (totalRealizedProfit / totalCostSold) * 100 : 0;

  const totalActiveInvestment = activeCattle.reduce((sum, c) => {
    const fin = calculateFinancials(c);
    return sum + fin.totalInvested;
  }, 0);

  const profitByOwner = {};
  cattle.forEach(c => {
    const owner = c.owner || 'Hacienda Principal';
    if (!profitByOwner[owner]) {
      profitByOwner[owner] = {
        owner,
        brand: c.ironBrand || 'N/A',
        totalHeads: 0,
        soldHeads: 0,
        totalInvested: 0,
        totalSales: 0,
        netProfit: 0,
      };
    }
    const fin = calculateFinancials(c);
    profitByOwner[owner].totalHeads++;
    profitByOwner[owner].totalInvested += fin.totalInvested;
    if (c.status === 'Vendido') {
      profitByOwner[owner].soldHeads++;
      profitByOwner[owner].totalSales += parseFloat(c.exitPrice) || 0;
      profitByOwner[owner].netProfit += fin.netProfit;
    }
  });

  const handleRevert = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`↩️ ¿Deseas anular la venta y devolver al animal ${animal.tagNumber} como ACTIVO en la finca?`)) {
      if (onRevertSale) onRevertSale(animal.id);
    }
  };

  const handleDelete = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`🗑️ ¿Deseas eliminar permanentemente el registro de este animal vendido (${animal.tagNumber})?`)) {
      if (onDeleteAnimal) onDeleteAnimal(animal.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span>Finanzas, Ventas & Liquidación de Utilidades</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Monitoreo de ingresos por ventas, costos acumulados, utilidades netas por lote y liquidación por dueño/compañía.
        </p>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
          <span className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">Utilidad Neta Realizada</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalRealizedProfit)}</p>
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1 inline-block">
            ROI Promedio: {formatNumber(overallRealizedRoi, 1)}%
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-cyan-500/5 border border-blue-200 dark:border-blue-500/30 shadow-sm">
          <span className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-400">Ingresos Totales por Ventas</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalSalesRevenue)}</p>
          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1 inline-block">
            {soldCattle.length} animales liquidados
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-pink-500/5 border border-purple-200 dark:border-purple-500/30 shadow-sm">
          <span className="text-xs font-semibold uppercase text-purple-800 dark:text-purple-400">Inversión en Ganado Activo</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalActiveInvestment)}</p>
          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1 inline-block">
            {activeCattle.length} cabezas en finca
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm">
          <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">Margen Comercial</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalSalesRevenue > 0 ? formatNumber((totalRealizedProfit / totalSalesRevenue) * 100, 1) : 0}%
          </p>
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1 inline-block">
            Margen sobre ventas
          </span>
        </div>
      </div>

      {/* Liquidación por Dueño / Marca */}
      <div className="custom-card p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Resumen de Liquidación y Rentabilidad por Propietario / Marca</span>
        </h3>

        {Object.keys(profitByOwner).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(profitByOwner).map(ownerData => (
              <div key={ownerData.owner} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{ownerData.owner}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Marca: <strong>{ownerData.brand}</strong></p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    {ownerData.totalHeads} cabezas
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Inversión Total:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(ownerData.totalInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ventas Realizadas ({ownerData.soldHeads}):</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(ownerData.totalSales)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Utilidad Neta:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(ownerData.netProfit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No hay propietarios registrados todavía.</p>
        )}
      </div>

      {/* Historial Detallado de Ventas y Liquidaciones con Opciones de Eliminar / Revertir */}
      <div className="custom-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>Historial de Animales Vendidos & Liquidaciones</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {soldCattle.length} {soldCattle.length === 1 ? 'venta registrada' : 'ventas registradas'}
          </span>
        </div>

        {soldCattle.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Arete / Animal</th>
                  <th className="p-3">Fecha Venta</th>
                  <th className="p-3">Peso Salida</th>
                  <th className="p-3">Costo Entrada</th>
                  <th className="p-3">Valor Venta</th>
                  <th className="p-3">Utilidad Neta</th>
                  <th className="p-3">Rentabilidad (ROI)</th>
                  <th className="p-3">Comprador</th>
                  <th className="p-3 text-right">Opciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {soldCattle.map(animal => {
                  const fin = calculateFinancials(animal);
                  return (
                    <tr
                      key={animal.id}
                      onClick={() => onSelectAnimal(animal)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {animal.tagNumber} {animal.name && <span className="text-slate-500 dark:text-slate-400 font-normal">({animal.name})</span>}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{animal.exitDate}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{animal.exitWeight} kg</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{formatCurrency(fin.totalInvested)}</td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(animal.exitPrice)}</td>
                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(fin.netProfit)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                          +{fin.roi}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{animal.buyer || 'Frigorífico'}</td>
                      
                      {/* Acciones para Ventas */}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleRevert(animal, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-600 transition"
                            title="Revertir / Deshacer venta (Devolver a activo en finca)"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectAnimal(animal)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition"
                            title="Ver Ficha"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(animal, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-400 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 transition"
                            title="Eliminar registro permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            No se han registrado ventas cerradas aún. Cuando liquides animales desde el inventario, sus utilidades aparecerán aquí.
          </div>
        )}
      </div>

    </div>
  );
}
