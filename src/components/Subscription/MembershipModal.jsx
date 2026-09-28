import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  ShieldCheck, 
  MessageCircle, 
  Sparkles, 
  Building2, 
  Calendar, 
  ArrowRight,
  HelpCircle,
  Copy,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { 
  SUBSCRIPTION_PLANS, 
  getSubscriptionStatus, 
  PAYMENT_CONTACT_INFO,
  isSuperAdmin 
} from '../../services/subscriptionService';
import { formatCurrency, formatDate } from '../../services/calculations';
import { useAuth } from '../../context/AuthContext';

export function MembershipModal({ isOpen, onClose, zIndex = 'z-[70]' }) {
  const { currentUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'semiannual' | 'yearly'
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const currentStatus = getSubscriptionStatus(currentUser);
  const isSuper = isSuperAdmin(currentUser);

  // Lista de planes a comercializar (excluyendo lifetime que es exclusivo)
  const displayPlans = [
    SUBSCRIPTION_PLANS.basic,
    SUBSCRIPTION_PLANS.pro,
    SUBSCRIPTION_PLANS.premium
  ];

  const handleCopyAccount = () => {
    const text = `Banco: ${PAYMENT_CONTACT_INFO.bankName}\nCuenta: ${PAYMENT_CONTACT_INFO.accountNumber}\nTitular: ${PAYMENT_CONTACT_INFO.accountHolder}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleContactWhatsApp = (plan) => {
    const p = plan || SUBSCRIPTION_PLANS[selectedPlanId] || SUBSCRIPTION_PLANS.pro;
    const cycleLabel = billingCycle === 'yearly' ? 'Anual' : billingCycle === 'semiannual' ? 'Semestral' : 'Mensual';
    const price = billingCycle === 'yearly' ? p.priceCopYearly : billingCycle === 'semiannual' ? p.priceCopSemiannual : p.priceCopMonthly;
    
    let msg = `🐮 *SOLICITUD DE ACTIVACIÓN DE PLAN GANADERO*\n\n`;
    msg += `👋 Hola, deseo activar/renovar mi membresía en la Plataforma Ganadera:\n`;
    msg += `• *Finca / Hacienda:* ${currentUser?.farmName || 'Mi Finca'}\n`;
    msg += `• *Ganadero:* ${currentUser?.name || 'Administrador'}\n`;
    msg += `• *Correo de Usuario:* ${currentUser?.email || 'N/A'}\n`;
    msg += `• *Plan Elegido:* ${p.name} (${cycleLabel})\n`;
    msg += `• *Valor:* ${formatCurrency(price)} COP\n\n`;
    msg += `Adjunto mi comprobante de transferencia para la activación inmediata. 📲`;

    const url = `https://wa.me/${PAYMENT_CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn`}>
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-md shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Membresías & Planes Ganaderos
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  currentStatus.isExpired 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : currentStatus.isTrial
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                }`}>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Elige el plan ideal para el tamaño de tu hato y potencia la rentabilidad de tu finca.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Selector de Ciclo de Facturación (Mensual / Semestral / Anual) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Ahorra hasta un 30% pagando de forma semestral o anual:</span>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('semiannual')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  billingCycle === 'semiannual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Semestral</span>
                <span className="text-[9px] bg-emerald-500/40 px-1 rounded-full text-emerald-100">-18%</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  billingCycle === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-full">⭐ Mejor Precio</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Planes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayPlans.map((plan) => {
              const price = billingCycle === 'yearly' 
                ? plan.priceCopYearly 
                : billingCycle === 'semiannual' 
                ? plan.priceCopSemiannual 
                : plan.priceCopMonthly;
              
              const isSelected = selectedPlanId === plan.id;
              const isCurrent = currentStatus.planId === plan.id && currentStatus.isActive;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-3xl p-5 border flex flex-col justify-between transition-all cursor-pointer ${
                    plan.highlight
                      ? 'bg-gradient-to-b from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Badge Destacado */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      plan.highlight
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {plan.badge}
                    </span>

                    {isCurrent && (
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        ✓ Tu Plan Actual
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>

                    {/* Precio */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                          {formatCurrency(price)}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          COP / {billingCycle === 'yearly' ? 'año' : billingCycle === 'semiannual' ? 'semestre' : 'mes'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          Equivale a {formatCurrency(Math.round(price / 12))}/mes
                        </p>
                      )}
                    </div>

                    {/* Características */}
                    <div className="pt-3 space-y-2 text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                        Incluye:
                      </div>
                      <ul className="space-y-1.5">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botón de Selección / Contratación */}
                  <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactWhatsApp(plan);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer ${
                        plan.highlight
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                          : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-300" />
                      <span>Activar por WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Información de Transferencia Directa & Activación */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-black flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Métodos de Pago & Transferencia Directa (Colombia)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Aceptamos transferencias desde cualquier banco: <strong>Bancolombia, Nequi, Daviplata, PSE</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyAccount}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition cursor-pointer shrink-0"
              >
                {copiedBank ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                <span>{copiedBank ? '¡Datos Copiados!' : 'Copiar Datos de Cuenta'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400 text-[10px] block">Entidad / App:</span>
                <span className="font-bold text-white">Bancolombia / Nequi / Daviplata</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400 text-[10px] block">Línea de Atención & Soporte:</span>
                <span className="font-bold text-emerald-400">{PAYMENT_CONTACT_INFO.whatsappDisplay}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400 text-[10px] block">Activación:</span>
                <span className="font-bold text-white">Inmediata tras enviar comprobante</span>
              </div>
            </div>
          </div>

          {/* Garantía de Datos Seguros */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <span className="text-base">🛡️</span>
            <div className="space-y-0.5">
              <span className="font-black">Garantía de Respaldo & Datos Siempre Tuyos:</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Toda la información histórica de tu ganado, pesajes y costos te pertenece. En cualquier momento puedes descargar un respaldo completo en Excel (.xlsx) sin perder ningún dato.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-medium">
            ¿Dudas sobre cuál plan elegir? Escríbenos al WhatsApp de soporte oficial.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
