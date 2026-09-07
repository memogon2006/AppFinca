import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Undo2, 
  Trash2, 
  Eye, 
  Users, 
  PlusCircle, 
  Search, 
  Calendar, 
  X, 
  Filter 
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateFinancials } from '../../services/calculations';

export function FinancesView({ cattle = [], onSelectAnimal, onRevertSale, onDeleteAnimal, onOpenPartnershipModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');

  const allSoldCattle = useMemo(() => cattle.filter(c => c.status === 'Vendido'), [cattle]);
  const activeCattle = useMemo(() => cattle.filter(c => c.status === 'Activo'), [cattle]);

  // Filtrado de ventas
  const filteredSoldCattle = useMemo(() => {
    return allSoldCattle.filter(animal => {
      // Filtro de modalidad
      if (saleTypeFilter) {
        const isComp = animal.exitType === 'En Compañía' || !!animal.partnershipDetails;
        if (saleTypeFilter === 'Compania' && !isComp) return false;
        if (saleTypeFilter === 'Directa' && isComp) return false;
      }

      // Filtro por Fecha de Venta
      if (saleStartDate && (animal.exitDate || '') < saleStartDate) return false;
      if (saleEndDate && (animal.exitDate || '') > saleEndDate) return false;

      // Filtro de búsqueda general
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const tag = (animal.tagNumber || '').toLowerCase();
        const name = (animal.name || '').toLowerCase();
        const buyer = (animal.saleBuyer || animal.buyer || '').toLowerCase();
        const brand = (animal.ironBrand || '').toLowerCase();
        const date = (animal.exitDate || '').toLowerCase();
        const owner = (animal.owner || '').toLowerCase();
        if (
          !tag.includes(q) &&
          !name.includes(q) &&
          !buyer.includes(q) &&
          !brand.includes(q) &&
          !date.includes(q) &&
          !owner.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allSoldCattle, saleTypeFilter, saleStartDate, saleEndDate, searchQuery]);

  // Cálculos globales sobre las ventas filtradas
  let totalSalesRevenue = 0;
  let totalCostSold = 0;
  let totalRealizedProfit = 0;

  filteredSoldCattle.forEach(c => {
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

  const hasActiveFilters = searchQuery || saleStartDate || saleEndDate || saleTypeFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setSaleStartDate('');
    setSaleEndDate('');
    setSaleTypeFilter('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header con Botón de Liquidación en Compañía */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Finanzas, Ventas & Liquidación de Utilidades</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo de ingresos por ventas, fechas de salida, utilidades netas y liquidación en compañía (50/50).
          </p>
        </div>

        {onOpenPartnershipModal && (
          <button
            onClick={onOpenPartnershipModal}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer min-h-[44px] self-start sm:self-auto"
          >
            <Users className="w-4 h-4" />
            <span>🤝 Liquidar en Compañía / Lote</span>
          </button>
        )}
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-50/90 dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-500/30 shadow-sm">
          <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-400">Utilidad Neta Realizada</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{formatCurrency(totalRealizedProfit)}</p>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1 inline-block">
            ROI Promedio: {formatNumber(overallRealizedRoi, 1)}%
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/90 dark:bg-slate-900/90 border border-blue-200/90 dark:border-blue-500/30 shadow-sm">
          <span className="text-xs font-bold uppercase text-blue-800 dark:text-blue-400">Ingresos Totales por Ventas</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{formatCurrency(totalSalesRevenue)}</p>
          <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold mt-1 inline-block">
            {filteredSoldCattle.length} animales liquidados
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-purple-50/90 dark:bg-slate-900/90 border border-purple-200/90 dark:border-purple-500/30 shadow-sm">
          <span className="text-xs font-bold uppercase text-purple-800 dark:text-purple-400">Inversión en Ganado Activo</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{formatCurrency(totalActiveInvestment)}</p>
          <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold mt-1 inline-block">
            {activeCattle.length} cabezas en finca
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-slate-900/90 border border-amber-200/90 dark:border-amber-500/30 shadow-sm">
          <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400">Margen Comercial</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalSalesRevenue > 0 ? formatNumber((totalRealizedProfit / totalSalesRevenue) * 100, 1) : 0}%
          </p>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1 inline-block">
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
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    {ownerData.soldHeads} / {ownerData.totalHeads} vendidos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400">Inversión Total:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(ownerData.totalInvested)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Ventas Cobradas:</span>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(ownerData.totalSales)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Utilidad Neta:</span>
                  <span className={`text-base font-black ${ownerData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(ownerData.netProfit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">No hay propietarios registrados en el sistema.</p>
        )}
      </div>

      {/* Historial Detallado de Ventas Realizadas con Filtro por Fechas */}
      <div className="custom-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Historial de Ganado Vendido & Liquidaciones ({filteredSoldCattle.length})</span>
          </h3>

          {onOpenPartnershipModal && (
            <button
              onClick={onOpenPartnershipModal}
              className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> Nueva Liquidación en Compañía
            </button>
          )}
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS POR FECHA DE VENTA */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Buscador */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por arete, comprador, fecha (YYYY-MM), dueño..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Modalidad de Venta */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSaleTypeFilter('')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  !saleTypeFilter ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setSaleTypeFilter('Compania')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  saleTypeFilter === 'Compania' ? 'bg-teal-600 text-white' : 'text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950'
                }`}
              >
                🤝 Compañía
              </button>
              <button
                onClick={() => setSaleTypeFilter('Directa')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  saleTypeFilter === 'Directa' ? 'bg-blue-600 text-white' : 'text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950'
                }`}
              >
                💰 Directa
              </button>
            </div>
          </div>

          {/* Rango de Fechas de Venta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                📅 Fecha de Venta / Salida Desde:
              </label>
              <input
                type="date"
                value={saleStartDate}
                onChange={(e) => setSaleStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                📅 Fecha de Venta / Salida Hasta:
              </label>
              <input
                type="date"
                value={saleEndDate}
                onChange={(e) => setSaleEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {hasActiveFilters && (
              <div>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredSoldCattle.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Arete</th>
                  <th className="p-3">Tipo Venta</th>
                  <th className="p-3">Fecha Venta</th>
                  <th className="p-3">Peso Salida</th>
                  <th className="p-3">Costo Total</th>
                  <th className="p-3">Valor Venta</th>
                  <th className="p-3">Utilidad Neta</th>
                  <th className="p-3">Rentabilidad (ROI)</th>
                  <th className="p-3">Comprador</th>
                  <th className="p-3 text-right">Opciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSoldCattle.map(animal => {
                  const fin = calculateFinancials(animal);
                  const isPart = animal.exitType === 'En Compañía' || animal.partnershipDetails;

                  return (
                    <tr
                      key={animal.id}
                      onClick={() => onSelectAnimal(animal)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{animal.tagNumber}</span>
                        {animal.name && <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">({animal.name})</span>}
                      </td>
                      <td className="p-3">
                        {isPart ? (
                          <span className="inline-flex items-center gap-1 font-black text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-400 dark:border-teal-700 text-[10px]">
                            <Users className="w-2.5 h-2.5 text-teal-600" /> 🤝 En Compañía
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700 text-[10px]">
                            💰 Directa
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {animal.exitDate ? formatDate(animal.exitDate) : '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {animal.exitWeight ? `${animal.exitWeight} kg` : '-'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {formatCurrency(fin.totalInvested)}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(animal.exitPrice)}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {isPart && animal.partnershipDetails ? (
                          <div>
                            <span>Finca: {formatCurrency(animal.partnershipDetails.farmShare)}</span>
                            <div className="text-[10px] text-teal-700 dark:text-teal-300 font-bold">
                              Dueño: {formatCurrency(animal.partnershipDetails.partnerTotalReturn)}
                            </div>
                          </div>
                        ) : (
                          formatCurrency(fin.netProfit)
                        )}
                      </td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                        {fin.roi}%
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {animal.saleBuyer || animal.buyer || 'No registrado'}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleRevert(animal, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                            title="Anular venta y devolver a finca"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(animal, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
            {hasActiveFilters ? 'No se encontraron ventas que coincidan con los filtros de fecha o búsqueda.' : 'No se han registrado ventas aún.'}
          </p>
        )}
      </div>

    </div>
  );
}
