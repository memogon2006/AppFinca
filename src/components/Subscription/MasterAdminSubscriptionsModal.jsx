import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Crown, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Clock, 
  UserCheck, 
  Trash2,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';
import { 
  SUBSCRIPTION_PLANS, 
  grantSubscription, 
  FIREBASE_URL, 
  SUPER_ADMIN_EMAILS,
  isSuperAdmin
} from '../../services/subscriptionService';
import { formatCurrency, formatDate } from '../../services/calculations';
import { safeFetch, toSafeEmailKey } from '../../services/cloudSync';
import { useAuth } from '../../context/AuthContext';

export function MasterAdminSubscriptionsModal({ isOpen, onClose, zIndex = 'z-[70]' }) {
  const { currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);

  // Cargar lista de todos los usuarios registrados desde Firebase
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await safeFetch(`${FIREBASE_URL}/users.json`);
      if (res && typeof res === 'object') {
        const list = Object.entries(res).map(([key, data]) => ({
          firebaseKey: key,
          ...data,
          email: data.email || key.replace('@gmail_dot_com', '@gmail.com').replace('_dot_', '.')
        })).filter(u => u.role !== 'worker'); // Solo cuentas principales
        setUsersList(list);
      }
    } catch (e) {
      console.warn('Error cargando usuarios para panel máster:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen]);

  if (!isOpen || !isSuperAdmin(currentUser)) return null;

  // Filtrado de usuarios
  const filteredUsers = usersList.filter(u => {
    if (statusFilter !== 'all') {
      const sub = u.subscription;
      if (statusFilter === 'active' && (!sub || sub.status === 'expired')) return false;
      if (statusFilter === 'expired' && sub && sub.status !== 'expired') return false;
      if (statusFilter === 'trial' && (!sub || sub.status !== 'trial')) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const name = (u.name || '').toLowerCase();
      const farm = (u.farmName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || farm.includes(q) || email.includes(q);
    }
    return true;
  });

  const handleQuickGrant = async (targetUser, days, planId = 'pro', isLifetime = false) => {
    try {
      await grantSubscription({
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        planId: isLifetime ? 'lifetime' : planId,
        durationDays: days,
        isLifetime,
        adminUser: currentUser,
        notes: isLifetime ? 'Activación Vitalicia SuperAdmin' : `Extensión de ${days} días (${planId})`
      });

      setActionSuccessMsg(`✅ Membresía actualizada exitosamente para ${targetUser.farmName || targetUser.name}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchAllUsers();
    } catch (e) {
      alert('Error al actualizar membresía: ' + (e.message || String(e)));
    }
  };

  const handleSuspend = async (targetUser) => {
    if (!window.confirm(`¿Deseas suspender el acceso a la finca "${targetUser.farmName || targetUser.name}"?`)) return;
    try {
      await grantSubscription({
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        planId: 'trial',
        durationDays: -10, // Vence inmediatamente
        isLifetime: false,
        adminUser: currentUser,
        notes: 'Acceso suspendido por SuperAdmin'
      });

      setActionSuccessMsg(`⛔ Cuenta suspendida para ${targetUser.farmName || targetUser.name}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchAllUsers();
    } catch (e) {
      alert('Error al suspender cuenta: ' + (e.message || String(e)));
    }
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn`}>
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-md shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Panel Máster de Membresías & Fincas
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Control SuperAdmin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Gestiona y activa suscripciones en 1 clic para todos los clientes de la plataforma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchAllUsers}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Recargar usuarios"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificación Flotante de Éxito */}
        {actionSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Contenido & Tabla */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por finca, ganadero o correo..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-700 dark:text-slate-300"
              >
                <option value="all">Todas las cuentas ({usersList.length})</option>
                <option value="active">🟢 Suscripciones Activas</option>
                <option value="trial">🟡 En Prueba (Trial)</option>
                <option value="expired">🔴 Vencidas</option>
              </select>
            </div>
          </div>

          {/* Tabla de Fincas y Membresías */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                <tr>
                  <th className="p-3">Finca / Ganadero</th>
                  <th className="p-3">Contacto / Correo</th>
                  <th className="p-3">Plan Actual</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3 text-center">Acciones de Activación Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isUserSuper = SUPER_ADMIN_EMAILS.includes((u.email || '').toLowerCase());
                    const sub = u.subscription;
                    const plan = SUBSCRIPTION_PLANS[sub?.planId] || SUBSCRIPTION_PLANS.trial;
                    
                    const isLifetime = sub?.planId === 'lifetime' || isUserSuper;
                    const expireDate = sub?.expiresAt ? new Date(sub.expiresAt) : null;
                    const now = new Date();
                    const daysRemaining = expireDate ? Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24)) : 9999;
                    const isExpired = !isLifetime && daysRemaining <= 0;

                    return (
                      <tr key={u.id || u.firebaseKey} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        {/* Finca & Nombre */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{u.farmName || 'Sin Nombre'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {u.name || 'Ganadero'}
                          </div>
                        </td>

                        {/* Correo */}
                        <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {u.email}
                        </td>

                        {/* Plan Actual */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isLifetime || isUserSuper
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                              : isExpired
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : sub?.status === 'trial'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          }`}>
                            <span>{isLifetime ? '👑 Vitalicio' : plan.name}</span>
                          </span>
                        </td>

                        {/* Días restantes / Vencimiento */}
                        <td className="p-3 whitespace-nowrap">
                          {isLifetime ? (
                            <span className="font-bold text-purple-600 dark:text-purple-400 text-xs">Sin Vencimiento</span>
                          ) : (
                            <div>
                              <span className={`font-black text-xs ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                {isExpired ? 'Vencida' : `${daysRemaining} días`}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {formatDate(sub?.expiresAt)}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Acciones Rápidas */}
                        <td className="p-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleQuickGrant(u, 30, 'pro')}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800 transition cursor-pointer"
                              title="Activar o extender 30 días Plan Pro"
                            >
                              +30 Días (Pro)
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickGrant(u, 365, 'pro')}
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-300 dark:border-indigo-800 transition cursor-pointer"
                              title="Activar o extender 1 Año Plan Pro"
                            >
                              +1 Año
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickGrant(u, 0, 'lifetime', true)}
                              className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-black text-[10px] border border-purple-300 dark:border-purple-800 transition cursor-pointer"
                              title="Hacer membresía Vitalicia permanente"
                            >
                              👑 Vitalicio
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSuspend(u)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Suspender acceso de esta finca"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      {loading ? 'Cargando clientes ganaderos...' : 'No se encontraron fincas registradas.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-bold">
            Total Fincas Registradas: {usersList.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cerrar Panel Máster
          </button>
        </div>

      </div>
    </div>
  );
}
