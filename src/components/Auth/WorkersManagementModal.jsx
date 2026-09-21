import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Shield, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  MessageCircle, 
  Copy, 
  Check, 
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  History,
  Scale,
  Baby,
  Syringe,
  Activity,
  PlusCircle,
  FileEdit,
  FolderPlus,
  Stethoscope,
  TrendingUp,
  RotateCcw,
  Skull,
  ClipboardCheck
} from 'lucide-react';
import { getActivityLogs, deleteActivityLog, clearActivityLogs } from '../../services/db';
import { cloudPushData } from '../../services/cloudSync';

export function WorkersManagementModal({ isOpen, onClose, zIndex = 'z-[60]' }) {
  const { 
    currentUser, 
    createWorker, 
    getWorkers, 
    toggleWorker, 
    updateWorkerPassword, 
    deleteWorker 
  } = useAuth();

  const [activeTab, setActiveTab] = useState('workers'); // 'workers' | 'logs'
  const [workers, setWorkers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [searchLog, setSearchLog] = useState('');

  // Formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [creating, setCreating] = useState(false);

  // Copiado al portapapeles
  const [copiedId, setCopiedId] = useState(null);

  // Modal / Prompt de cambio de contraseña
  const [editingWorker, setEditingWorker] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editMsg, setEditMsg] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Cargar datos
  const loadWorkersData = async () => {
    try {
      setLoading(true);
      const list = await getWorkers();
      setWorkers(list || []);
    } catch (e) {
      console.warn('Error cargando trabajadores:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLogsData = async () => {
    try {
      setLogsLoading(true);
      if (currentUser?.id) {
        const list = await getActivityLogs(currentUser.id, 100);
        setLogs(list || []);
      }
    } catch (e) {
      console.warn('Error cargando bitácora:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadWorkersData();
      loadLogsData();
      setShowCreateForm(false);
      setCreateMsg(null);
      setEditingWorker(null);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogsData();
    }
  }, [activeTab]);

  // Manejar creación de trabajador
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateMsg(null);

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setCreateMsg({ type: 'error', text: 'Por favor completa todos los campos del formulario.' });
      return;
    }

    if (newPassword.trim().length < 4) {
      setCreateMsg({ type: 'error', text: 'La clave o PIN debe tener al menos 4 caracteres.' });
      return;
    }

    try {
      setCreating(true);
      const created = await createWorker({
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
      });

      setCreateMsg({
        type: 'success',
        text: `¡Cuenta para ${created.name} creada exitosamente! Puedes entregarle sus datos de acceso.`,
        data: {
          name: created.name,
          username: created.email,
          password: newPassword.trim()
        }
      });

      setNewName('');
      setNewUsername('');
      setNewPassword('');
      await loadWorkersData();
      await loadLogsData();
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  // Manejar habilitar / deshabilitar
  const handleToggleStatus = async (worker) => {
    const nextStatus = worker.isActive === false ? true : false;
    const actionWord = nextStatus ? 'habilitar' : 'deshabilitar temporalmente';
    
    if (window.confirm(`¿Deseas ${actionWord} la cuenta de ${worker.name}?`)) {
      try {
        setLoading(true);
        await toggleWorker(worker.id, worker.email, nextStatus);
        await loadWorkersData();
        await loadLogsData();
      } catch (err) {
        alert(`Error al actualizar estado: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Manejar cambio de clave/PIN
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!editingWorker || !editPassword.trim()) return;

    if (editPassword.trim().length < 4) {
      setEditMsg({ type: 'error', text: 'La clave o PIN debe tener al menos 4 caracteres.' });
      return;
    }

    try {
      setSavingEdit(true);
      await updateWorkerPassword(editingWorker.id, editingWorker.email, editPassword.trim());
      setEditMsg({ type: 'success', text: `¡Clave de ${editingWorker.name} actualizada con éxito!` });
      setTimeout(() => {
        setEditingWorker(null);
        setEditPassword('');
        setEditMsg(null);
      }, 1500);
      await loadWorkersData();
      await loadLogsData();
    } catch (err) {
      setEditMsg({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  // Manejar eliminación permanente
  const handleDeleteWorker = async (worker) => {
    if (window.confirm(`⚠️ ¿Estás completamente seguro de ELIMINAR la cuenta de "${worker.name}" (${worker.email})?\n\nEsta acción borrará su acceso de forma permanente e irreversible.`)) {
      try {
        setLoading(true);
        await deleteWorker(worker.id, worker.email);
        await loadWorkersData();
        await loadLogsData();
      } catch (err) {
        alert(`Error al eliminar trabajador: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Compartir credenciales por WhatsApp
  const handleShareWhatsApp = (name, username, password) => {
    const text = `🤠 *ACCESO A LA FINCA: ${currentUser?.farmName || 'INVENTARIO BOVINO'}*\n\nHola ${name}, aquí están tus datos para ingresar a la plataforma de trabajo en la finca:\n\n👤 *Usuario:* ${username}\n🔑 *Clave/PIN:* ${password}\n🌐 *Enlace:* ${window.location.origin}\n\n_Ingresa desde tu celular para registrar pesajes, partos y vacunas._`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copiar al portapapeles
  const handleCopyCredentials = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Icono según acción en bitácora
  const getLogIcon = (action) => {
    switch (action) {
      case 'animal_created': return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case 'animal_updated': return <FileEdit className="w-4 h-4 text-blue-500" />;
      case 'animal_deleted': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'batch_created': return <FolderPlus className="w-4 h-4 text-emerald-600" />;
      case 'weighing': return <Scale className="w-4 h-4 text-amber-500" />;
      case 'weighing_batch': return <Scale className="w-4 h-4 text-amber-600" />;
      case 'weight_deleted': return <Trash2 className="w-4 h-4 text-amber-700" />;
      case 'palpation': return <Stethoscope className="w-4 h-4 text-pink-500" />;
      case 'palpation_batch': return <Stethoscope className="w-4 h-4 text-pink-600" />;
      case 'vaccination': return <Syringe className="w-4 h-4 text-sky-500" />;
      case 'vaccination_deleted': return <Trash2 className="w-4 h-4 text-sky-700" />;
      case 'sale': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'sale_batch': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'sale_reverted': return <RotateCcw className="w-4 h-4 text-purple-400" />;
      case 'death': return <Skull className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      case 'death_reverted': return <RotateCcw className="w-4 h-4 text-emerald-500" />;
      case 'audit_checklist': return <ClipboardCheck className="w-4 h-4 text-teal-500" />;
      case 'birth': return <Baby className="w-4 h-4 text-emerald-500" />;
      case 'worker_created': return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'worker_enabled': return <UserCheck className="w-4 h-4 text-teal-500" />;
      case 'worker_disabled': return <UserX className="w-4 h-4 text-rose-500" />;
      case 'worker_password_updated': return <KeyRound className="w-4 h-4 text-indigo-500" />;
      case 'worker_deleted': return <Trash2 className="w-4 h-4 text-rose-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  // Vaciar completamente la bitácora de auditoría
  const handleClearAllLogs = async () => {
    if (logs.length === 0) {
      alert('ℹ️ La bitácora de auditoría ya se encuentra vacía.');
      return;
    }

    const confirm = window.confirm(
      `🗑️ ¿Deseas vaciar todo el historial de la bitácora (${logs.length} movimientos)?\n\nEsta acción eliminará de forma permanente los registros de auditoría en este dispositivo y en la nube.`
    );
    if (!confirm) return;

    try {
      setClearingLogs(true);
      await clearActivityLogs(currentUser?.id);
      if (currentUser?.id) {
        await cloudPushData(currentUser.id).catch(() => null);
      }
      setLogs([]);
      alert('✅ ¡Historial de la bitácora vaciado exitosamente!');
    } catch (err) {
      alert(`Error al vaciar bitácora: ${err.message}`);
    } finally {
      setClearingLogs(false);
    }
  };

  // Eliminar un registro individual de la bitácora
  const handleDeleteSingleLog = async (log) => {
    if (!log?.id) return;
    if (window.confirm(`¿Deseas eliminar este registro de la bitácora?\n\n"${log.description || 'Movimiento'}"`)) {
      try {
        await deleteActivityLog(log.id);
        setLogs(prev => prev.filter(l => l.id !== log.id));
        if (currentUser?.id) {
          await cloudPushData(currentUser.id).catch(() => null);
        }
      } catch (err) {
        alert(`Error al eliminar registro: ${err.message}`);
      }
    }
  };

  const filteredLogs = logs.filter(l => {
    if (!searchLog.trim()) return true;
    const term = searchLog.toLowerCase();
    return (
      (l.description || '').toLowerCase().includes(term) ||
      (l.operatorName || '').toLowerCase().includes(term) ||
      (l.tagNumber || '').toLowerCase().includes(term) ||
      (l.action || '').toLowerCase().includes(term)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Mayordomos y Vaqueros"
      maxWidth="max-w-3xl"
      zIndex={zIndex}
    >
      <div className="space-y-4">
        {/* Cabecera descriptiva */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-100 dark:to-slate-800/40 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              🤠
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Equipo de Trabajo en Corral
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Crea cuentas para tus vaqueros, controla su acceso y audita sus registros en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {workers.length} {workers.length === 1 ? 'Trabajador' : 'Trabajadores'}
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('workers')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'workers'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cuentas de Trabajadores ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Bitácora de Auditoría ({logs.length})</span>
          </button>
        </div>

        {/* TAB 1: CUENTAS DE TRABAJADORES */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            {/* Botón para desplegar formulario de creación */}
            {!showCreateForm ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(true);
                    setCreateMsg(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-950/20 transition cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Crear Nueva Cuenta de Trabajador</span>
                </button>
              </div>
            ) : (
              /* Formulario de Alta de Trabajador */
              <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Cuenta para Mayordomo / Vaquero</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>

                {createMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    createMsg.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' 
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                  }`}>
                    {createMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                    <div className="space-y-1.5 w-full">
                      <p className="font-bold">{createMsg.text}</p>
                      {createMsg.data && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(createMsg.data.name, createMsg.data.username, createMsg.data.password)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center gap-1.5 hover:bg-emerald-500 transition shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Enviar por WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials('created', `Usuario: ${createMsg.data.username}\nClave: ${createMsg.data.password}`)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 hover:bg-slate-300 transition"
                          >
                            {copiedId === 'created' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === 'created' ? '¡Copiado!' : 'Copiar Credenciales'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Trabajador:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Pedro Pérez"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Usuario o Correo de Acceso:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: pedro.vaquero"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PIN o Contraseña:
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Mínimo 4 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Seguridad Automática:</strong> Esta cuenta tendrá acceso exclusivo al inventario operativo (pesajes, vacunas, partos). Los precios, compras, ventas y utilidades de la finca estarán 100% ocultos.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                  >
                    {creating ? 'Creando cuenta...' : '✓ Guardar y Entregar Cuenta'}
                  </button>
                </div>
              </form>
            )}

            {/* Listado de Trabajadores */}
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Cargando trabajadores de la finca...</span>
              </div>
            ) : workers.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-3xl">🤠</div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No tienes trabajadores registrados aún
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Crea una cuenta para tu mayordomo o vaquero para que registre pesajes y partos en la manga sin exponer tus finanzas.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  + Crear Primer Trabajador
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workers.map((w) => {
                  const isActive = w.isActive !== false;
                  return (
                    <div 
                      key={w.id || w.email}
                      className={`p-4 rounded-2xl border transition shadow-sm space-y-3 ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-90'
                      }`}
                    >
                      {/* Top info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shadow-inner shrink-0 ${
                            isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            🤠
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {w.name}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {w.email}
                            </p>
                          </div>
                        </div>

                        {/* Badge de estado */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                        }`}>
                          {isActive ? '● Activo' : '✕ Deshabilitado'}
                        </span>
                      </div>

                      {/* Info de permisos */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p><strong>• Rol:</strong> Operario de Corral / Modo Campo</p>
                        <p><strong>• Privacidad:</strong> Finanzas y precios bloqueados</p>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Toggle Habilitar/Deshabilitar */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(w)}
                          className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition cursor-pointer ${
                            isActive
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                          title={isActive ? 'Deshabilitar acceso temporalmente' : 'Habilitar acceso'}
                        >
                          {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Deshabilitar' : 'Habilitar'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Cambiar PIN */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWorker(w);
                              setEditPassword('');
                              setEditMsg(null);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                            title="Cambiar PIN o Contraseña"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Enviar credenciales WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(w.name, w.email, '[Tu clave asignada]')}
                            className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 transition"
                            title="Compartir datos de acceso por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar permanentemente */}
                          <button
                            type="button"
                            onClick={() => handleDeleteWorker(w)}
                            className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 transition"
                            title="Eliminar cuenta permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal para cambiar PIN / Clave */}
            {editingWorker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    <KeyRound className="w-4 h-4" />
                    <span>Reasignar Clave para {editingWorker.name}</span>
                  </div>

                  {editMsg && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      editMsg.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-300' 
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-300'
                    }`}>
                      {editMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{editMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSavePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nueva Contraseña / PIN:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mínimo 4 caracteres"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingWorker(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingEdit}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition"
                      >
                        {savingEdit ? 'Guardando...' : 'Guardar Clave'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BITÁCORA DE AUDITORÍA */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            {/* Buscador y Controles de bitácora */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por operario, arete o acción..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={loadLogsData}
                  disabled={logsLoading}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Actualizar bitácora"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                  <span>Refrescar</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAllLogs}
                  disabled={clearingLogs || logs.length === 0}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                    logs.length > 0
                      ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 cursor-pointer active:scale-95'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                  title="Vaciar todo el historial de la bitácora"
                >
                  <Trash2 className={`w-3.5 h-3.5 text-rose-500 ${clearingLogs ? 'animate-spin' : ''}`} />
                  <span>{clearingLogs ? 'Borrando...' : 'Vaciar Bitácora'}</span>
                </button>
              </div>
            </div>

            {/* Lista de Eventos */}
            {logsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Cargando movimientos de auditoría...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                {searchLog.trim() 
                  ? 'No se encontraron movimientos que coincidan con la búsqueda.' 
                  : 'No hay movimientos registrados en la bitácora de auditoría.'}
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.map((log, idx) => (
                  <div key={log.id || idx} className="pt-2 first:pt-0 flex items-start justify-between gap-2.5 text-xs group">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {getLogIcon(log.action)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {log.operatorName || 'Administrador'}
                            {log.operatorRole === 'worker' && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Vaquero
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                          {log.description}
                        </p>

                        {log.tagNumber && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Chapa #{log.tagNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón para borrar registro individual */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSingleLog(log)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0 opacity-70 hover:opacity-100 active:scale-95"
                      title="Eliminar este movimiento de la bitácora"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer del Modal */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
