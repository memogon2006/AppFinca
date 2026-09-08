import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Send, 
  Copy, 
  Check, 
  Phone, 
  Users, 
  Scale, 
  DollarSign, 
  Layers, 
  Boxes, 
  FileText, 
  Sparkles, 
  Tag, 
  Bookmark, 
  Calendar,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateWeightMetrics, calculateFinancials } from '../../services/calculations';

const STORAGE_PHONE_KEY = 'finca_whatsapp_default_phone';
const STORAGE_CONTACTS_KEY = 'finca_whatsapp_quick_contacts';

export function WhatsAppReportModal({ 
  isOpen, 
  onClose, 
  cattle = [], 
  weighings = [], 
  farmName = 'Hacienda Ganadera',
  zIndex = 'z-[70]'
}) {
  if (!isOpen) return null;

  // Estado del tipo de reporte
  const [reportType, setReportType] = useState('inventory'); // 'inventory' | 'readyToSell' | 'weighing' | 'owners'
  
  // Filtros de Dueño / Marca y Lote
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Configuración de Teléfono
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [quickContacts, setQuickContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  // Cargar teléfono y contactos guardados
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem(STORAGE_PHONE_KEY) || '';
      const savedContacts = JSON.parse(localStorage.getItem(STORAGE_CONTACTS_KEY) || '[]');
      setPhoneNumber(savedPhone);
      setQuickContacts(savedContacts);
    } catch (e) {
      console.warn('Error loading whatsapp config:', e);
    }
  }, [isOpen]);

  // Lista única de Dueños y Marcas
  const ownersList = useMemo(() => {
    const map = new Map();
    cattle.forEach(c => {
      const owner = (c.owner || 'Hacienda Principal').trim();
      const brand = (c.ironBrand || '').trim();
      if (!map.has(owner)) {
        map.set(owner, {
          name: owner,
          brands: new Set(),
          count: 0
        });
      }
      const data = map.get(owner);
      data.count++;
      if (brand) data.brands.add(brand);
    });

    return Array.from(map.values()).map(o => ({
      name: o.name,
      brands: Array.from(o.brands).join(', ') || 'Sin marca',
      count: o.count
    })).sort((a, b) => b.count - a.count);
  }, [cattle]);

  // Lista única de Lotes
  const batchesList = useMemo(() => {
    const set = new Set();
    cattle.forEach(c => {
      if (c.entryBatch && c.entryBatch.trim()) {
        set.add(c.entryBatch.trim());
      }
    });
    return Array.from(set).sort();
  }, [cattle]);

  // Filtrado de Animales según Dueño y Lote seleccionados
  const filteredCattle = useMemo(() => {
    return cattle.filter(c => {
      const owner = (c.owner || 'Hacienda Principal').trim();
      if (selectedOwner !== 'all' && owner !== selectedOwner) {
        return false;
      }
      if (selectedBatch !== 'all' && (c.entryBatch || '').trim() !== selectedBatch) {
        return false;
      }
      return true;
    });
  }, [cattle, selectedOwner, selectedBatch]);

  // Función para obtener desglose completo por Dueño / Marca
  const getOwnerBreakdown = (ownerName, ownerBrand) => {
    const ownerCattle = cattle.filter(c => (c.owner || 'Hacienda Principal').trim() === ownerName);
    const active = ownerCattle.filter(c => c.status === 'Activo');
    const sold = ownerCattle.filter(c => c.status === 'Vendido');
    const dead = ownerCattle.filter(c => c.status === 'Muerto');

    const males = active.filter(c => c.sex === 'Macho');
    const females = active.filter(c => c.sex === 'Hembra');

    let totalWeight = 0;
    let totalInvestedActive = 0;
    let totalMaleInvested = 0;
    let totalFemaleInvested = 0;
    let readyToSell = [];
    let fatteningCount = 0;
    let pregnantCount = 0;
    let milkingCount = 0;

    let gdpSum = 0;
    let gdpCount = 0;
    let totalGainKg = 0;
    const animals = [];

    active.forEach(c => {
      const animalWeighings = (weighings || []).filter(w => w.cattleId === c.id);
      const fin = calculateFinancials(c);
      const wm = calculateWeightMetrics(c, animalWeighings);
      const currentWeight = wm.currentWeight || parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0;

      totalWeight += currentWeight;
      totalInvestedActive += fin.totalInvested;

      if (c.sex === 'Macho') totalMaleInvested += fin.totalInvested;
      if (c.sex === 'Hembra') totalFemaleInvested += fin.totalInvested;

      if (wm.overallGdp > 0) {
        gdpSum += wm.overallGdp;
        gdpCount++;
      }
      if (wm.totalGain > 0) totalGainKg += wm.totalGain;

      const isReady = currentWeight >= 480;
      if (isReady) {
        readyToSell.push({
          tag: c.tagNumber,
          name: c.name,
          weight: currentWeight,
          sex: c.sex,
          gdp: wm.overallGdp
        });
      } else {
        fatteningCount++;
      }

      if (c.reproductiveStatus === 'Gestando' || c.reproductiveStatus === 'Preñada') pregnantCount++;
      if (c.milkingStatus === 'En Ordeño') milkingCount++;

      animals.push({
        tag: c.tagNumber,
        name: c.name,
        weight: currentWeight,
        sex: c.sex,
        gdp: wm.overallGdp,
        batch: c.entryBatch,
        isReady,
        invested: fin.totalInvested
      });
    });

    const avgWeight = active.length > 0 ? totalWeight / active.length : 0;
    const avgGdp = gdpCount > 0 ? gdpSum / gdpCount : 0;
    const avgCostPerHead = active.length > 0 ? totalInvestedActive / active.length : 0;

    // Ventas y Utilidades
    let totalSalesRevenue = 0;
    let totalRealizedProfit = 0;
    sold.forEach(c => {
      const fin = calculateFinancials(c);
      totalSalesRevenue += parseFloat(c.exitPrice) || 0;
      totalRealizedProfit += fin.netProfit;
    });

    return {
      name: ownerName,
      brand: ownerBrand || 'Sin marca',
      totalCount: ownerCattle.length,
      activeCount: active.length,
      soldCount: sold.length,
      deadCount: dead.length,
      maleCount: males.length,
      femaleCount: females.length,
      totalWeight,
      avgWeight,
      avgGdp,
      totalGainKg,
      totalInvestedActive,
      totalMaleInvested,
      totalFemaleInvested,
      avgCostPerHead,
      readyToSell,
      fatteningCount,
      pregnantCount,
      milkingCount,
      animals: animals.sort((a, b) => b.weight - a.weight),
      totalSalesRevenue,
      totalRealizedProfit
    };
  };

  // Métricas calculadas para el reporte según filtros
  const metrics = useMemo(() => {
    const active = filteredCattle.filter(c => c.status === 'Activo');
    const sold = filteredCattle.filter(c => c.status === 'Vendido');
    const dead = filteredCattle.filter(c => c.status === 'Muerto');

    const males = active.filter(c => c.sex === 'Macho');
    const females = active.filter(c => c.sex === 'Hembra');

    let totalWeight = 0;
    let totalInvestedActive = 0;
    let totalMaleInvested = 0;
    let totalFemaleInvested = 0;
    let readyToSell = [];
    let fatteningCount = 0;
    let pregnantCount = 0;
    let milkingCount = 0;

    active.forEach(c => {
      const animalWeighings = (weighings || []).filter(w => w.cattleId === c.id);
      const fin = calculateFinancials(c);
      const wm = calculateWeightMetrics(c, animalWeighings);
      const currentWeight = wm.currentWeight || parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0;
      
      totalWeight += currentWeight;
      totalInvestedActive += fin.totalInvested;

      if (c.sex === 'Macho') totalMaleInvested += fin.totalInvested;
      if (c.sex === 'Hembra') totalFemaleInvested += fin.totalInvested;

      if (currentWeight >= 480) {
        readyToSell.push({
          tag: c.tagNumber,
          name: c.name,
          weight: currentWeight,
          gdp: wm.overallGdp,
          owner: c.owner,
          brand: c.ironBrand,
          estimatedValue: currentWeight * (parseFloat(c.targetPricePerKg) || 8400)
        });
      } else {
        fatteningCount++;
      }

      if (c.reproductiveStatus === 'Gestando' || c.reproductiveStatus === 'Preñada') pregnantCount++;
      if (c.milkingStatus === 'En Ordeño') milkingCount++;
    });

    // Pesajes & GDP
    let gdpSum = 0;
    let gdpCount = 0;
    let totalGainKg = 0;
    const weighingDetails = [];

    active.forEach(c => {
      const animalWeighings = (weighings || []).filter(w => w.cattleId === c.id);
      const wm = calculateWeightMetrics(c, animalWeighings);
      if (wm.overallGdp > 0) {
        gdpSum += wm.overallGdp;
        gdpCount++;
      }
      if (wm.totalGain > 0) totalGainKg += wm.totalGain;

      weighingDetails.push({
        tag: c.tagNumber,
        name: c.name,
        currentWeight: wm.currentWeight,
        gain: wm.totalGain,
        gdp: wm.overallGdp,
        days: wm.totalDays,
        brand: c.ironBrand
      });
    });

    const avgWeight = active.length > 0 ? (totalWeight / active.length) : 0;
    const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
    const avgCostPerHead = active.length > 0 ? (totalInvestedActive / active.length) : 0;

    // Métricas de ventas
    let totalSalesRevenue = 0;
    let totalRealizedProfit = 0;
    sold.forEach(c => {
      const fin = calculateFinancials(c);
      totalSalesRevenue += parseFloat(c.exitPrice) || 0;
      totalRealizedProfit += fin.netProfit;
    });

    return {
      activeCount: active.length,
      soldCount: sold.length,
      deadCount: dead.length,
      maleCount: males.length,
      femaleCount: females.length,
      totalWeight,
      avgWeight,
      totalInvestedActive,
      totalMaleInvested,
      totalFemaleInvested,
      avgCostPerHead,
      avgGdp,
      totalGainKg,
      readyToSell,
      fatteningCount,
      pregnantCount,
      milkingCount,
      weighingDetails: weighingDetails.sort((a, b) => b.gdp - a.gdp),
      totalSalesRevenue,
      totalRealizedProfit
    };
  }, [filteredCattle, weighings]);

  // Generación dinámica del texto del mensaje
  const generatedMessage = useMemo(() => {
    const today = formatDate(new Date());
    const ownerObj = ownersList.find(o => o.name === selectedOwner);
    const ownerLabel = selectedOwner === 'all' 
      ? 'Finca Completa (Todos los Dueños)' 
      : `${selectedOwner} ${ownerObj?.brands ? `(Hierro: ${ownerObj.brands})` : ''}`;
    const batchLabel = selectedBatch === 'all' ? 'Todos los lotes' : `Lote ${selectedBatch}`;

    let text = '';

    if (reportType === 'inventory') {
      text += `📊 *INFORME DE INVENTARIO Y PATRIMONIO*\n`;
      text += `🏡 *Finca:* ${farmName}\n`;
      text += `👤 *Dueño / Marca:* ${ownerLabel}\n`;
      if (selectedBatch !== 'all') text += `🏷️ *Lote:* ${batchLabel}\n`;
      text += `📅 *Fecha:* ${today}\n\n`;

      text += `🐂 *RESUMEN DEL HATO ACTIVO:*\n`;
      text += `• Cabezas Activas: *${metrics.activeCount} animales* (${metrics.maleCount} machos • ${metrics.femaleCount} hembras)\n`;
      text += `• Biomasa Total en Finca: *${formatNumber(metrics.totalWeight, 0)} kg*\n`;
      text += `• Peso Promedio: *${formatNumber(metrics.avgWeight, 1)} kg / animal*\n`;
      if (metrics.avgGdp > 0) {
        text += `• Ganancia Diaria Promedio (GDP): *+${formatNumber(metrics.avgGdp, 3)} kg/día* (+${formatNumber(metrics.totalGainKg, 0)} kg ganados)\n`;
      }
      text += `\n`;

      text += `💰 *VALORIZACIÓN DEL GANADO:*\n`;
      text += `• Inversión Activa Total: *${formatCurrency(metrics.totalInvestedActive)}*\n`;
      if (metrics.maleCount > 0) text += `• Valor Machos (${metrics.maleCount}): *${formatCurrency(metrics.totalMaleInvested)}*\n`;
      if (metrics.femaleCount > 0) text += `• Valor Hembras (${metrics.femaleCount}): *${formatCurrency(metrics.totalFemaleInvested)}*\n`;
      text += `• Promedio Inversión / Cabeza: *${formatCurrency(metrics.avgCostPerHead)}*\n\n`;

      text += `🎯 *ESTADO PRODUCTIVO:*\n`;
      text += `• Listos para Venta (≥ 480 kg): *${metrics.readyToSell.length} novillos*\n`;
      text += `• En Engorde / Ceba: *${metrics.fatteningCount} novillos*\n`;
      if (metrics.pregnantCount > 0) text += `• Vacas en Gestación: *${metrics.pregnantCount} hembras*\n`;
      if (metrics.milkingCount > 0) text += `• Hembras en Ordeño: *${metrics.milkingCount} vacas*\n`;
      if (metrics.deadCount > 0) text += `• Bajas Históricas: *${metrics.deadCount} bajas*\n`;

      if (metrics.soldCount > 0) {
        text += `\n💵 *HISTORIAL DE VENTAS:*\n`;
        text += `• Animales Liquidados: *${metrics.soldCount} cabezas*\n`;
        text += `• Ingresos Totales por Ventas: *${formatCurrency(metrics.totalSalesRevenue)}*\n`;
        text += `• Utilidad Neta Realizada: *${formatCurrency(metrics.totalRealizedProfit)}*\n`;
      }
    } 
    else if (reportType === 'readyToSell') {
      text += `🎯 *REPORTE DE GANADO LISTO PARA VENTA (≥ 480 KG)*\n`;
      text += `🏡 *Finca:* ${farmName}\n`;
      text += `👤 *Dueño / Marca:* ${ownerLabel}\n`;
      if (selectedBatch !== 'all') text += `🏷️ *Lote:* ${batchLabel}\n`;
      text += `📅 *Fecha:* ${today}\n\n`;

      text += `🐂 *TOTAL LISTOS PARA DESPACHO: ${metrics.readyToSell.length} CABEZAS*\n`;
      const totalReadyKg = metrics.readyToSell.reduce((sum, a) => sum + a.weight, 0);
      const avgReadyKg = metrics.readyToSell.length > 0 ? (totalReadyKg / metrics.readyToSell.length) : 0;
      text += `• Kilos Totales en Báscula: *${formatNumber(totalReadyKg, 0)} kg*\n`;
      text += `• Peso Promedio: *${formatNumber(avgReadyKg, 1)} kg / animal*\n\n`;

      if (metrics.readyToSell.length > 0) {
        text += `📋 *LISTADO DETALLADO POR CHAPETA:*\n`;
        metrics.readyToSell.forEach((item, idx) => {
          text += `${idx + 1}. *#${item.tag}*${item.name ? ` (${item.name})` : ''} - *${formatNumber(item.weight, 1)} kg*`;
          if (item.gdp > 0) text += ` (GDP: +${formatNumber(item.gdp, 3)} kg/d)`;
          if (item.brand && selectedOwner === 'all') text += ` [Hierro: ${item.brand}]`;
          text += `\n`;
        });
      } else {
        text += `ℹ️ *No hay animales con peso igual o superior a 480 kg actualmente.*\n`;
      }
    }
    else if (reportType === 'weighing') {
      text += `⚖️ *REPORTE DE JORNADA DE PESAJE Y RENDIMIENTO*\n`;
      text += `🏡 *Finca:* ${farmName}\n`;
      text += `👤 *Dueño / Marca:* ${ownerLabel}\n`;
      if (selectedBatch !== 'all') text += `🏷️ *Lote:* ${batchLabel}\n`;
      text += `📅 *Fecha:* ${today}\n\n`;

      text += `📈 *RESUMEN DE RENDIMIENTO:*\n`;
      text += `• Animales Evaluados: *${metrics.activeCount} cabezas*\n`;
      text += `• Ganancia Diaria Promedio (GDP): *+${formatNumber(metrics.avgGdp, 3)} kg/día*\n`;
      text += `• Carne Total Ganada en Finca: *+${formatNumber(metrics.totalGainKg, 0)} kg*\n`;
      text += `• Peso Promedio Actual: *${formatNumber(metrics.avgWeight, 1)} kg*\n\n`;

      if (metrics.weighingDetails.length > 0) {
        text += `🏆 *TOP RENDIMIENTO:*\n`;
        const top5 = metrics.weighingDetails.slice(0, 5);
        top5.forEach((item, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
          text += `${medal} *#${item.tag}* - *${formatNumber(item.currentWeight, 1)} kg* (+${formatNumber(item.gdp, 3)} kg/d • +${formatNumber(item.gain, 1)} kg)\n`;
        });

        const delayed = metrics.weighingDetails.filter(item => item.gdp <= 0.1 && item.days > 15);
        if (delayed.length > 0) {
          text += `\n⚠️ *ATENCIÓN / ANIMALES ATRASADOS (${delayed.length}):*\n`;
          delayed.slice(0, 5).forEach(item => {
            text += `• *#${item.tag}*: ${formatNumber(item.currentWeight, 1)} kg (GDP: ${formatNumber(item.gdp, 3)} kg/d - Revisar sanidad)\n`;
          });
        }
      }
    }
    else if (reportType === 'owners') {
      if (selectedOwner !== 'all') {
        // DUEÑO ESPECÍFICO SELECCIONADO
        const data = getOwnerBreakdown(selectedOwner, ownerObj?.brands);

        text += `👥 *INFORME CONSOLIDADO POR DUEÑO / MARCA*\n`;
        text += `🏡 *Finca:* ${farmName}\n`;
        text += `👤 *Dueño:* ${data.name}\n`;
        text += `🏷️ *Hierro / Marca:* ${data.brand}\n`;
        text += `📅 *Fecha:* ${today}\n\n`;

        text += `🐂 *RESUMEN DEL HATO ACTIVO:*\n`;
        text += `• Cabezas Activas: *${data.activeCount} animales* (${data.maleCount} machos • ${data.femaleCount} hembras)\n`;
        text += `• Biomasa Total en Finca: *${formatNumber(data.totalWeight, 0)} kg*\n`;
        text += `• Peso Promedio: *${formatNumber(data.avgWeight, 1)} kg / animal*\n`;
        if (data.avgGdp > 0) {
          text += `• Ganancia Diaria Promedio (GDP): *+${formatNumber(data.avgGdp, 3)} kg/día* (+${formatNumber(data.totalGainKg, 0)} kg carne)\n`;
        }
        text += `\n`;

        text += `💰 *INVERSIÓN Y VALORIZACIÓN:*\n`;
        text += `• Inversión Activa Total: *${formatCurrency(data.totalInvestedActive)}*\n`;
        if (data.maleCount > 0) text += `• Inversión Machos (${data.maleCount}): *${formatCurrency(data.totalMaleInvested)}*\n`;
        if (data.femaleCount > 0) text += `• Inversión Hembras (${data.femaleCount}): *${formatCurrency(data.totalFemaleInvested)}*\n`;
        text += `• Promedio Inversión / Cabeza: *${formatCurrency(data.avgCostPerHead)}*\n\n`;

        text += `🎯 *ESTADO PRODUCTIVO:*\n`;
        text += `• Listos para Venta (≥ 480 kg): *${data.readyToSell.length} novillos*\n`;
        text += `• En Engorde / Ceba: *${data.fatteningCount} animales*\n`;
        if (data.pregnantCount > 0) text += `• Vacas en Gestación: *${data.pregnantCount} hembras*\n`;
        if (data.milkingCount > 0) text += `• Vacas en Ordeño: *${data.milkingCount} hembras*\n`;
        if (data.deadCount > 0) text += `• Bajas / Muertes: *${data.deadCount} cabezas*\n`;

        if (data.animals.length > 0) {
          text += `\n📋 *DETALLE POR ANIMAL / CHAPETA (${data.animals.length}):*\n`;
          data.animals.forEach((a, idx) => {
            text += `${idx + 1}. *#${a.tag}*${a.name ? ` (${a.name})` : ''} - *${formatNumber(a.weight, 1)} kg* • ${a.sex}${a.gdp > 0 ? ` • GDP: +${formatNumber(a.gdp, 3)} kg/d` : ''}${a.isReady ? ' 🎯' : ''}\n`;
          });
        }

        if (data.soldCount > 0) {
          text += `\n💵 *HISTORIAL DE VENTAS Y UTILIDADES:*\n`;
          text += `• Animales Liquidados: *${data.soldCount} cabezas*\n`;
          text += `• Ingresos Totales por Ventas: *${formatCurrency(data.totalSalesRevenue)}*\n`;
          text += `• Utilidad Neta Realizada: *${formatCurrency(data.totalRealizedProfit)}*\n`;
        }
      } else {
        // TODOS LOS DUEÑOS Y MARCAS (DESGLOSE COMPLETO POR CADA DUEÑO)
        text += `👥 *BALANCE CONSOLIDADO POR CADA DUEÑO / MARCA*\n`;
        text += `🏡 *Finca:* ${farmName}\n`;
        text += `📅 *Fecha:* ${today}\n`;
        text += `📊 *Total Registrados:* ${ownersList.length} Dueños/Marcas • *Hato Total:* ${metrics.activeCount} activos\n\n`;

        ownersList.forEach((o) => {
          const data = getOwnerBreakdown(o.name, o.brands);
          text += `━━━━━━━━━━━━━━━━━━━━\n`;
          text += `👤 *DUEÑO: ${data.name.toUpperCase()}*\n`;
          text += `🏷️ *Hierro / Marca:* ${data.brand}\n`;
          text += `• Activos en Finca: *${data.activeCount} cabezas* (${data.maleCount} machos • ${data.femaleCount} hembras)\n`;
          text += `• Biomasa Total: *${formatNumber(data.totalWeight, 0)} kg* (Promedio: *${formatNumber(data.avgWeight, 1)} kg*)\n`;
          if (data.avgGdp > 0) {
            text += `• GDP Promedio: *+${formatNumber(data.avgGdp, 3)} kg/día* (+${formatNumber(data.totalGainKg, 0)} kg carne)\n`;
          }
          text += `• Inversión Activa: *${formatCurrency(data.totalInvestedActive)}* (Prom: *${formatCurrency(data.avgCostPerHead)}/cab*)\n`;
          text += `• Listos para Venta (≥ 480 kg): *${data.readyToSell.length} novillos*\n`;
          if (data.soldCount > 0) {
            text += `• Ventas Realizadas: *${data.soldCount} cabezas* (Ingresos: *${formatCurrency(data.totalSalesRevenue)}* • Utilidad: *${formatCurrency(data.totalRealizedProfit)}*)\n`;
          }
          if (data.animals.length > 0) {
            const tagsSummary = data.animals.map(a => `#${a.tag} (${formatNumber(a.weight, 0)}kg)`).join(', ');
            text += `• Chapetas: ${tagsSummary}\n`;
          }
          text += `\n`;
        });
      }
    }

    if (customNote.trim()) {
      text += `\n📝 *NOTAS ADICIONALES:*\n${customNote.trim()}\n`;
    }

    text += `\n_Reporte generado automáticamente desde App Inventario Bovino_`;
    return text;
  }, [reportType, selectedOwner, selectedBatch, farmName, metrics, ownersList, cattle, customNote, weighings]);

  // Manejo de guardado de número y envío
  const handleSendWhatsApp = () => {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si el número tiene 10 dígitos y empieza por 3 (celular Colombia), agregar 57
    if (/^3\d{9}$/.test(cleanNumber)) {
      cleanNumber = '57' + cleanNumber;
    }

    if (saveAsDefault && cleanNumber) {
      try {
        localStorage.setItem(STORAGE_PHONE_KEY, cleanNumber);
      } catch (e) {
        console.warn('Error saving phone:', e);
      }
    }

    const encodedText = encodeURIComponent(generatedMessage);
    let url = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (cleanNumber) {
      url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`;
    }

    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      alert('No se pudo copiar automáticamente. Puedes seleccionar el texto y copiarlo.');
    }
  };

  const handleSaveContact = () => {
    if (!newContactName.trim() || !phoneNumber.trim()) return;
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const updated = [...quickContacts.filter(c => c.name !== newContactName.trim()), {
      name: newContactName.trim(),
      phone: cleanNumber
    }];
    setQuickContacts(updated);
    try {
      localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving contacts:', e);
    }
    setNewContactName('');
    setShowAddContact(false);
  };

  const handleDeleteContact = (e, nameToDelete) => {
    e.stopPropagation();
    if (window.confirm(`¿Deseas eliminar a "${nameToDelete}" de la agenda de contactos de WhatsApp?`)) {
      const updated = quickContacts.filter(c => c.name !== nameToDelete);
      setQuickContacts(updated);
      try {
        localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving contacts:', err);
      }
    }
  };

  const handleSelectQuickContact = (contact) => {
    setPhoneNumber(contact.phone);
  };

  return (
    <div className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm ${zIndex} flex items-center justify-center p-3 sm:p-5 overflow-y-auto`}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in my-auto">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-xl">
              📲
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Enviar Reporte por WhatsApp</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                  Automático
                </span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Genera mensajes ejecutivos con cifras de inventario, pesaje y rentabilidad por dueño
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con 2 Columnas (Opciones & Vista Previa) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* COLUMNA IZQUIERDA: Configuración y Filtros (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. Tipo de Reporte */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tipo de Reporte:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('inventory')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex flex-col gap-1 cursor-pointer ${
                    reportType === 'inventory'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">📊 Inventario & Valor</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Total hato, machos/hembras y valor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('readyToSell')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex flex-col gap-1 cursor-pointer ${
                    reportType === 'readyToSell'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">🎯 Listos Venta</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Novillos en meta (≥ 480 kg)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('weighing')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex flex-col gap-1 cursor-pointer ${
                    reportType === 'weighing'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">⚖️ Jornada Pesaje</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">GDP, kilos ganados y top</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('owners')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex flex-col gap-1 cursor-pointer ${
                    reportType === 'owners'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">👥 Por Dueño / Marca</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Resumen y reparto a socios</span>
                </button>
              </div>
            </div>

            {/* 2. Selector de Dueño / Marca (SOLICITADO) */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50">
              <label className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Seleccionar Dueño o Marca:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200">
                  {ownersList.length} registrados
                </span>
              </label>

              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="all">🌐 Todos los Dueños y Marcas (Finca Completa)</option>
                {ownersList.map((o) => (
                  <option key={o.name} value={o.name}>
                    👤 {o.name} • Hierro: {o.brands} ({o.count} cabezas)
                  </option>
                ))}
              </select>

              {selectedOwner !== 'all' && (
                <div className="text-[11px] text-amber-900 dark:text-amber-300 font-medium flex items-center justify-between pt-1">
                  <span>Filtrando solo ganado de <strong>{selectedOwner}</strong></span>
                  <button
                    onClick={() => setSelectedOwner('all')}
                    className="text-[10px] text-amber-700 dark:text-amber-400 underline font-bold hover:text-amber-900"
                  >
                    Ver todos
                  </button>
                </div>
              )}
            </div>

            {/* 3. Selector de Lote (Opcional) */}
            {batchesList.length > 0 && reportType !== 'owners' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Filtrar por Lote (Opcional):</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="all">🌐 Todos los Lotes</option>
                  {batchesList.map((b) => (
                    <option key={b} value={b}>
                      🏷️ Lote {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Teléfono de WhatsApp de Destino */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Número de WhatsApp:</span>
                </label>
                {quickContacts.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    Agenda rápida
                  </span>
                )}
              </div>

              {/* Botones de Contactos Rápidos */}
              {quickContacts.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickContacts.map((c, i) => {
                    const isSelected = phoneNumber.includes(c.phone);
                    return (
                      <div
                        key={i}
                        className={`group inline-flex items-center rounded-lg border transition text-[11px] font-bold overflow-hidden shadow-sm ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectQuickContact(c)}
                          className="px-2 py-1 flex items-center gap-1 cursor-pointer"
                          title={`Usar teléfono de ${c.name} (${c.phone})`}
                        >
                          <span>👤 {c.name}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => handleDeleteContact(e, c.name)}
                          className={`px-1.5 py-1 transition cursor-pointer flex items-center justify-center border-l ${
                            isSelected
                              ? 'border-emerald-500 hover:bg-emerald-700 text-emerald-100 hover:text-white'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600'
                          }`}
                          title={`Eliminar ${c.name} de la agenda`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <input
                  type="tel"
                  placeholder="Ej: 3101234567 o +573101234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm tabular-nums"
                />
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-2.5" />
                {phoneNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneNumber('');
                      try { localStorage.removeItem(STORAGE_PHONE_KEY); } catch (e) {}
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 absolute right-2.5 top-2 transition cursor-pointer"
                    title="Limpiar número"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Guardar como predeterminado</span>
                </label>

                {!showAddContact ? (
                  <button
                    type="button"
                    onClick={() => setShowAddContact(true)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer text-[10px]"
                  >
                    + Guardar contacto
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Nombre (ej. Socio)"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white w-24"
                    />
                    <button
                      type="button"
                      onClick={handleSaveContact}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Nota Adicional Opcional */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Nota o Mensaje Adicional (Opcional):
              </label>
              <textarea
                rows="2"
                placeholder="Ej: Quedan pendientes 3 novillos por vacunar..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none shadow-sm"
              />
            </div>

          </div>

          {/* COLUMNA DERECHA: Vista Previa en Vivo del Mensaje de WhatsApp (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Vista Previa del Mensaje para WhatsApp:</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Formato listo con emojis y negritas
              </span>
            </div>

            {/* Contenedor estilo Chat de WhatsApp */}
            <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] p-3.5 sm:p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner overflow-y-auto max-h-[380px] sm:max-h-[460px] relative">
              <div className="bg-white dark:bg-[#202c33] text-slate-900 dark:text-[#e9edef] p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/50 text-xs sm:text-sm whitespace-pre-wrap font-sans leading-relaxed selection:bg-emerald-500 selection:text-white">
                {generatedMessage}
              </div>
            </div>

            {/* Botones Rápidos de Envío y Copia */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCopyText}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600 font-black">¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>📲 Abrir y Enviar por WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
