import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Database, 
  Smartphone, 
  BookOpen, 
  Mail, 
  Scale,
  Printer,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Search,
  Check,
  Sparkles,
  Layers
} from 'lucide-react';

export function PrivacyPolicyModal({ 
  isOpen, 
  onClose, 
  onAccept,
  defaultTab = 'terms', // 'terms' | 'privacy' | 'all'
  zIndex = 'z-[70]' 
}) {
  if (!isOpen) return null;

  const [activeMainTab, setActiveMainTab] = useState(defaultTab); // 'terms' | 'privacy' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeArticle, setActiveArticle] = useState('all');

  const termsArticles = [
    { id: 't_acceptance', label: '1. Aceptación de Términos' },
    { id: 't_services', label: '2. Objeto del Software' },
    { id: 't_accounts', label: '3. Cuentas & Contraseñas' },
    { id: 't_ownership', label: '4. Propiedad de los Datos' },
    { id: 't_offline', label: '5. Modo Offline & Nube' },
    { id: 't_veterinary', label: '6. Exención Veterinaria' },
    { id: 't_backup', label: '7. Backups & Portabilidad' },
    { id: 't_ip', label: '8. Propiedad Intelectual' },
    { id: 't_law', label: '9. Ley Aplicable & Jurisdicción' }
  ];

  const privacyArticles = [
    { id: 'p_legal', label: '1. Marco Legal (Ley 1581)' },
    { id: 'p_data', label: '2. Datos Recolectados' },
    { id: 'p_purpose', label: '3. Finalidades de Uso' },
    { id: 'p_nosharing', label: '4. No Comercialización' },
    { id: 'p_security', label: '5. Seguridad & Cifrado' },
    { id: 'p_rights', label: '6. Derechos Habeas Data' },
    { id: 'p_contact', label: '7. Canales PQR & Vigencia' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in`}>
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* CABECERA DEL MODAL                                                        */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Términos y Condiciones & Política de Privacidad
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] tracking-wide uppercase border border-emerald-300 dark:border-emerald-800">
                  Marco Legal Vigente (Colombia)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Contrato de uso de software pecuario, confidencialidad de datos ganaderos y Ley 1581 de 2012
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer active:scale-95"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑAS PRINCIPALES: TÉRMINOS VS PRIVACIDAD VS TODO                      */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => {
                setActiveMainTab('terms');
                setActiveArticle('all');
              }}
              className={`px-3.5 sm:px-5 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMainTab === 'terms'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>📜 Términos y Condiciones</span>
            </button>

            <button
              onClick={() => {
                setActiveMainTab('privacy');
                setActiveArticle('all');
              }}
              className={`px-3.5 sm:px-5 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMainTab === 'privacy'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>🛡️ Política de Privacidad (Ley 1581)</span>
            </button>

            <button
              onClick={() => {
                setActiveMainTab('all');
                setActiveArticle('all');
              }}
              className={`px-3.5 sm:px-5 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeMainTab === 'all'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📋 Todo el Documento Legal</span>
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUB-BARRA DE NAVEGACIÓN RÁPIDA POR ARTÍCULO / BÚSQUEDA                    */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveArticle('all')}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              activeArticle === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Ver todos los puntos
          </button>

          {(activeMainTab === 'terms' || activeMainTab === 'all') && termsArticles.map((art) => (
            <button
              key={art.id}
              onClick={() => setActiveArticle(art.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeArticle === art.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {art.label}
            </button>
          ))}

          {(activeMainTab === 'privacy' || activeMainTab === 'all') && privacyArticles.map((art) => (
            <button
              key={art.id}
              onClick={() => setActiveArticle(art.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeArticle === art.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {art.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* CUERPO DEL DOCUMENTO CON SCROLL                                           */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">

          {/* ----------------------------------------------------------------------- */}
          {/* SECCIÓN A: TÉRMINOS Y CONDICIONES DE USO                                */}
          {/* ----------------------------------------------------------------------- */}
          {(activeMainTab === 'terms' || activeMainTab === 'all') && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 font-extrabold text-xs sm:text-sm flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>TÉRMINOS Y CONDICIONES GENERALES DE USO - SOFTWARE GANADERO</span>
              </div>

              {/* T1. Aceptación */}
              {(activeArticle === 'all' || activeArticle === 't_acceptance') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. Aceptación y Capacidad Contractual</span>
                  </div>
                  <p>
                    El ingreso, registro, instalación como Aplicación Web Progresiva (PWA) o uso continuado de <strong>INVENTARIO BOVINO APP</strong> constituye la celebración de un acuerdo legalmente vinculante entre usted (en adelante el "Usuario" o "Ganadero") y los administradores de la plataforma. Si no está de acuerdo con cualquiera de estas disposiciones, debe abstenerse de utilizar el software.
                  </p>
                </section>
              )}

              {/* T2. Objeto */}
              {(activeArticle === 'all' || activeArticle === 't_services') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <Smartphone className="w-4 h-4" />
                    <span>2. Objeto y Alcance del Software</span>
                  </div>
                  <p>
                    <strong>INVENTARIO BOVINO APP</strong> es una plataforma tecnológica diseñada para la administración, trazabilidad zootécnica, control reproductivo (palpación, preñez, días de gestación), pesajes con cálculo de GDP (Ganancia Diaria de Peso), sanidad, vacunación oficial ICA/FEDEGAN, gestión de potreros y balance contable/financiero de hatos ganaderos de carne, leche y doble propósito.
                  </p>
                </section>
              )}

              {/* T3. Cuentas y Seguridad */}
              {(activeArticle === 'all' || activeArticle === 't_accounts') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <Lock className="w-4 h-4" />
                    <span>3. Cuentas de Usuario, Roles y Seguridad</span>
                  </div>
                  <p>
                    El usuario es el único responsable de salvaguardar sus credenciales de acceso. La plataforma permite la creación de perfiles con roles diferenciados:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs pl-2">
                    <li><strong>Perfil Administrador / Propietario:</strong> Acceso ilimitado a finanzas, costos, nómina, ventas, balances, eliminación y configuración de finca.</li>
                    <li><strong>Perfil Trabajador / Vaquero / Mayordomo:</strong> Acceso restringido exclusivamente a labores de campo (pesajes rápidos, palpaciones, inventario físico de potreros y sanidad), manteniendo ocultos todos los módulos de precios, ganancias y balances.</li>
                  </ul>
                </section>
              )}

              {/* T4. Propiedad de los Datos */}
              {(activeArticle === 'all' || activeArticle === 't_ownership') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4" />
                    <span>4. Propiedad Absoluta e Inalienable de la Información Ganadera</span>
                  </div>
                  <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                    Usted como ganadero o propietario es el <strong>único y absoluto titular de todos los datos pecuarios</strong> ingresados (números de chapas, pesos, pedigrí, registros reproductivos, inventarios, compras, ventas y balances económicos).
                  </p>
                  <p className="text-xs">
                    INVENTARIO BOVINO APP no ostenta ningún derecho de propiedad sobre su ganado ni sobre su información comercial, y garantiza que jamás comercializará, venderá ni compartirá sus registros con terceros.
                  </p>
                </section>
              )}

              {/* T5. Modo Offline y Sincronización */}
              {(activeArticle === 'all' || activeArticle === 't_offline') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <Database className="w-4 h-4" />
                    <span>5. Arquitectura Offline-First & Sincronización Multi-Equipo</span>
                  </div>
                  <p>
                    La plataforma está equipada con tecnología <strong>Offline-First</strong> para operar en potreros y corrales sin internet o cobertura móvil mediante almacenamiento local en IndexedDB. Al reconectarse a una red WiFi o datos móviles, el sistema sincroniza automáticamente las novedades con la nube segura de Firebase sin sobreescrituras ni pérdidas de datos.
                  </p>
                </section>
              )}

              {/* T6. Exención Veterinaria */}
              {(activeArticle === 'all' || activeArticle === 't_veterinary') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-black text-sm uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" />
                    <span>6. Exclusión de Responsabilidad Médica Veterinaria y Zootécnica</span>
                  </div>
                  <p className="text-amber-950 dark:text-amber-200 text-xs">
                    El software proporciona cálculos matemáticos, estimaciones zootécnicas (días de gestación, fechas probables de parto, promedios de peso) y recordatorios sanitarios basados en los datos digitados por el usuario. <strong>Este sistema es una herramienta de apoyo administrativo y analítico</strong>, y en ningún caso sustituye el diagnóstico clínico, peritaje reproductivo o prescripción farmacológica de un Médico Veterinario o Zootecnista profesional matriculado.
                  </p>
                </section>
              )}

              {/* T7. Backups y Portabilidad */}
              {(activeArticle === 'all' || activeArticle === 't_backup') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <FileText className="w-4 h-4" />
                    <span>7. Copias de Seguridad (Backups) y Portabilidad Libre</span>
                  </div>
                  <p>
                    El usuario tiene el derecho incondicional de descargar y restaurar en cualquier momento copias de seguridad completas de su hato en formato estándar JSON o exportar planillas en Microsoft Excel (.xlsx), garantizando que nunca quede atado al sistema (cero vendor lock-in).
                  </p>
                </section>
              )}

              {/* T8. Propiedad Intelectual */}
              {(activeArticle === 'all' || activeArticle === 't_ip') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <BookOpen className="w-4 h-4" />
                    <span>8. Propiedad Intelectual del Software</span>
                  </div>
                  <p>
                    La marca, interfaces visuales, código de software, lógica de sincronización y algoritmos de análisis zootécnico son propiedad intelectual exclusiva de los creadores de INVENTARIO BOVINO APP, protegidos por la Decisión Andina 351 de 1993 y la Ley 23 de 1982 sobre Derechos de Autor. Se concede al usuario una licencia de uso personal, intransferible y no exclusiva.
                  </p>
                </section>
              )}

              {/* T9. Ley y Jurisdicción */}
              {(activeArticle === 'all' || activeArticle === 't_law') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <Scale className="w-4 h-4" />
                    <span>9. Ley Aplicable y Solución de Controversias</span>
                  </div>
                  <p>
                    Los presentes Términos se rigen e interpretan conforme a las leyes de la <strong>República de Colombia</strong>. Cualquier inquietud o discrepancia será resuelta en primera instancia mediante concertación directa a través del canal oficial: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">criaderosantateresa21@gmail.com</span>.
                  </p>
                </section>
              )}

            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* SECCIÓN B: POLÍTICA DE PRIVACIDAD & HABEAS DATA (LEY 1581)               */}
          {/* ----------------------------------------------------------------------- */}
          {(activeMainTab === 'privacy' || activeMainTab === 'all') && (
            <div className="space-y-4 pt-2">
              
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-950 dark:text-teal-200 font-extrabold text-xs sm:text-sm flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                <span>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (LEY 1581 DE 2012)</span>
              </div>

              {/* P1. Marco Legal */}
              {(activeArticle === 'all' || activeArticle === 'p_legal') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wide">
                    <Scale className="w-4 h-4" />
                    <span>1. Marco Legal e Identificación del Responsable</span>
                  </div>
                  <p>
                    En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto Reglamentario 1377 de 2013</strong>, la <strong>Circular Única de la Superintendencia de Industria y Comercio (SIC)</strong> y el artículo 15 de la Constitución Política de Colombia, la plataforma <strong>INVENTARIO BOVINO APP</strong> pone a disposición de todos sus usuarios la presente <em>Política de Privacidad y Tratamiento de Datos Personales</em>.
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                    <p><strong>• Denominación:</strong> INVENTARIO BOVINO APP (Plataforma de Gestión Pecuaria Integral)</p>
                    <p><strong>• Ámbito de Aplicación:</strong> Todo usuario que se registre, inicie sesión, ingrese información pecuaria, gestione inventarios o sincronice datos.</p>
                    <p><strong>• Correo Oficial de Tratamiento de Datos:</strong> <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">criaderosantateresa21@gmail.com</span></p>
                  </div>
                </section>
              )}

              {/* P2. Datos Recolectados */}
              {(activeArticle === 'all' || activeArticle === 'p_data') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wide">
                    <Database className="w-4 h-4" />
                    <span>2. Datos Recolectados y su Naturaleza</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <span>A. Datos de Identificación y Cuenta</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                        <li>Nombre del ganadero, predio o hacienda.</li>
                        <li>Correo electrónico / usuario de acceso.</li>
                        <li>Contraseña protegida mediante Hash criptográfico SHA-256 (nunca en texto plano).</li>
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                        <FileText className="w-4 h-4 text-teal-500" />
                        <span>B. Datos Zootécnicos del Hato</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                        <li>Identificación de bovinos (arete, chapa, hierro, chip).</li>
                        <li>Pesajes, chequeos reproductivos y palpaciones.</li>
                        <li>Vacunaciones oficiales FEDEGAN-ICA y RUV.</li>
                        <li>Movimientos de potreros y compras/ventas.</li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* P3. Finalidad */}
              {(activeArticle === 'all' || activeArticle === 'p_purpose') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>3. Finalidades Exclusivas del Tratamiento</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span><strong>Trazabilidad y Productividad Ganadera:</strong> Procesar registros de hato, índices de ganancia de peso (GDP), palpaciones y censo sanitario.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span><strong>Sincronización en la Nube y Modo Offline:</strong> Garantizar que los cambios hechos en el corral se resguarden en Google Cloud y se sincronicen entre dispositivos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span><strong>Exportación de Reportes Oficiales:</strong> Generar planillas Excel para el ICA, RUV y balances para uso exclusivo del ganadero.</span>
                    </li>
                  </ul>
                </section>
              )}

              {/* P4. No Comercialización */}
              {(activeArticle === 'all' || activeArticle === 'p_nosharing') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>4. Declaración de No Comercialización de Datos</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Sus datos ganaderos, económicos y personales son estrictamente confidenciales. INVENTARIO BOVINO APP JAMÁS venderá, alquilará, cederá ni comercializará su información con terceros, empresas de publicidad ni entidades comerciales bajo ninguna circunstancia.
                  </p>
                </section>
              )}

              {/* P5. Seguridad */}
              {(activeArticle === 'all' || activeArticle === 'p_security') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wide">
                    <Lock className="w-4 h-4" />
                    <span>5. Medidas de Seguridad y Cifrado</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <p className="font-bold text-slate-900 dark:text-white">🔒 Cifrado SHA-256 de Contraseñas</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Las claves se encriptan con algoritmos irreversibles antes de almacenarse.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <p className="font-bold text-slate-900 dark:text-white">☁️ Infraestructura Google Cloud & Firebase</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Conexiones cifradas HTTPS/TLS y aislamiento estricto por cuenta de usuario.</p>
                    </div>
                  </div>
                </section>
              )}

              {/* P6. Derechos Habeas Data */}
              {(activeArticle === 'all' || activeArticle === 'p_rights') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-sm uppercase tracking-wide">
                    <BookOpen className="w-4 h-4" />
                    <span>6. Derechos del Titular de la Información (Habeas Data)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <p className="font-bold text-slate-900 dark:text-white">1. Conocer y Acceder</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Consultar gratis toda su información en cualquier momento.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <p className="font-bold text-slate-900 dark:text-white">2. Actualizar y Rectificar</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Editar datos incompletos desde el perfil o fichas de animales.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <p className="font-bold text-slate-900 dark:text-white">3. Portabilidad Total</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Descargar copia de su base de datos en JSON o Excel (.xlsx).</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <p className="font-bold text-rose-600 dark:text-rose-400">4. Suprimir / Eliminar Cuenta</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Borrar de forma total e irreversible su cuenta con el botón de 'Eliminar Cuenta'.</p>
                    </div>
                  </div>
                </section>
              )}

              {/* P7. Canales PQR */}
              {(activeArticle === 'all' || activeArticle === 'p_contact') && (
                <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wide">
                    <Mail className="w-4 h-4" />
                    <span>7. Canales de Atención (PQR) y Vigencia</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                    <p><strong>• Canal Oficial de Habeas Data:</strong> <span className="font-mono font-bold text-teal-600 dark:text-teal-400">criaderosantateresa21@gmail.com</span></p>
                    <p><strong>• Tiempo de Respuesta:</strong> Conforme al artículo 14 de la Ley 1581 de 2012, las consultas serán atendidas en un término máximo de diez (10) días hábiles.</p>
                    <p><strong>• Vigencia:</strong> La presente política rige a partir de septiembre de 2026 y permanecerá vigente mientras se preste el servicio.</p>
                  </div>
                </section>
              )}

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* FOOTER DEL MODAL                                                          */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Documento Oficial: Términos, Condiciones & Tratamiento de Datos</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onAccept) onAccept();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/30 transition cursor-pointer active:scale-95"
          >
            Aceptar y Continuar
          </button>
        </div>

      </div>
    </div>
  );
}

// Alias para compatibilidad hacia atrás
export const LegalTermsModal = PrivacyPolicyModal;
