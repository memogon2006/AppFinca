import React from 'react';
import { 
  ShieldAlert, 
  Crown, 
  MessageCircle, 
  FileSpreadsheet, 
  LogOut, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PAYMENT_CONTACT_INFO, getSubscriptionStatus } from '../../services/subscriptionService';
import { formatCurrency } from '../../services/calculations';
import { useAuth } from '../../context/AuthContext';

export function SubscriptionExpiredOverlay({ 
  onOpenMembershipModal, 
  onExportAllData 
}) {
  const { currentUser, logout } = useAuth();
  const subStatus = getSubscriptionStatus(currentUser);

  const handleContactWhatsApp = () => {
    let msg = `🐮 *RENOVACIÓN DE PLAN GANADERO*\n\n`;
    msg += `👋 Hola, mi acceso en la plataforma ganadera ha finalizado y deseo renovar mi membresía:\n`;
    msg += `• *Finca:* ${currentUser?.farmName || 'Mi Finca'}\n`;
    msg += `• *Usuario:* ${currentUser?.name || 'Ganadero'}\n`;
    msg += `• *Correo:* ${currentUser?.email || 'N/A'}\n\n`;
    msg += `Por favor envíame las opciones de pago para activar mi cuenta de inmediato. 📲`;

    const url = `https://wa.me/${PAYMENT_CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6 text-white my-auto">
        
        {/* Icono Principal */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/40 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Textos Informativos */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Período de Acceso Finalizado
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Tu Membresía Ganadera ha Expirado
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Hola <strong>{currentUser?.name || 'Ganadero'}</strong>, el tiempo de uso para tu predio <strong>{currentUser?.farmName || 'tu finca'}</strong> ha vencido. Renueva tu membresía para continuar registrando pesajes, costos e inventario en tiempo real.
          </p>
        </div>

        {/* Botones de Acción Primaria */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenMembershipModal}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-[0.98] transition cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Ver Planes & Renovar Acceso</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleContactWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Atención Directa por WhatsApp ({PAYMENT_CONTACT_INFO.whatsappDisplay})</span>
          </button>
        </div>

        {/* Garantía de Exportación de Datos */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span>🛡️</span>
            <span>Tus datos ganaderos están 100% seguros</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Tu historial de animales, pesajes y registros nunca se eliminan. Puedes descargar una copia de seguridad completa en Excel en este momento:
          </p>
          
          {onExportAllData && (
            <button
              type="button"
              onClick={onExportAllData}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Descargar mi Inventario Completo (Excel)</span>
            </button>
          )}
        </div>

        {/* Cerrar Sesión */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>¿Deseas ingresar con otra cuenta?</span>
          <button
            type="button"
            onClick={logout}
            className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </div>
  );
}
