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
  Printer
} from 'lucide-react';

export function PrivacyPolicyModal({ isOpen, onClose, zIndex = 'z-[70]' }) {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState('all');

  const sections = [
    { id: 'all', label: 'Todo el Documento' },
    { id: 'legal', label: '1. Marco Legal & Responsable' },
    { id: 'data', label: '2. Datos Recolectados' },
    { id: 'purpose', label: '3. Finalidad del Tratamiento' },
    { id: 'security', label: '4. Seguridad & Nube' },
    { id: 'rights', label: '5. Derechos Habeas Data' },
    { id: 'contact', label: '6. Canales de Atención' }
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
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Política de Privacidad y Tratamiento de Datos
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] tracking-wide uppercase border border-emerald-300 dark:border-emerald-800">
                  Ley 1581 de 2012 (Colombia)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Protección de datos personales, confidencialidad pecuaria y derechos de Habeas Data
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

        {/* Barra de Filtro / Navegación rápida por sección */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeSection === sec.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Cuerpo del Documento con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">

          {/* 1. MARCO LEGAL & IDENTIFICACIÓN */}
          {(activeSection === 'all' || activeSection === 'legal') && (
            <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                <Scale className="w-4 h-4" />
                <span>1. Marco Legal e Identificación del Responsable</span>
              </div>
              <p>
                En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto Reglamentario 1377 de 2013</strong>, la <strong>Circular Única de la Superintendencia de Industria y Comercio (SIC)</strong> y el artículo 15 de la Constitución Política de Colombia, la plataforma <strong>INVENTARIO BOVINO APP</strong> pone a disposición de todos sus usuarios, productores ganaderos, médicos veterinarios, administradores y titulares de información la presente <em>Política de Privacidad y Tratamiento de Datos Personales</em>.
              </p>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                <p><strong>• Denominación:</strong> INVENTARIO BOVINO APP (Plataforma de Gestión Pecuaria Integral)</p>
                <p><strong>• Ámbito de Aplicación:</strong> Todo usuario que se registre, inicie sesión, ingrese información pecuaria, gestione inventarios o sincronice datos a través de la plataforma web, PWA o aplicación móvil.</p>
                <p><strong>• Correo Oficial de Tratamiento de Datos:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-mono">criaderosantateresa21@gmail.com</span></p>
              </div>
            </section>
          )}

          {/* 2. DATOS RECOLECTADOS */}
          {(activeSection === 'all' || activeSection === 'data') && (
            <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-wide">
                <Database className="w-4 h-4" />
                <span>2. Naturaleza y Tipología de los Datos Recolectados</span>
              </div>
              <p>
                La plataforma recolecta exclusivamente la información estrictamente necesaria para la prestación del servicio de software de administración ganadera, distinguiendo dos categorías:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>A. Datos de Identificación y Acceso del Titular</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                    <li>Nombre completo del ganadero, propietario o administrador.</li>
                    <li>Nombre del predio, finca o hacienda ganadera.</li>
                    <li>Correo electrónico o identificador de usuario.</li>
                    <li>Contraseña de acceso protegida mediante cifrado criptográfico unidireccional (Hash SHA-256). <em>El sistema nunca guarda contraseñas en texto plano.</em></li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>B. Datos Zootécnicos, Sanitarios y Económicos del Hato</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                    <li>Identificación individual de bovinos (arete, chapa, tatuaje, hierro, chip).</li>
                    <li>Historial de pesajes y ganancias diarias de peso (GDP).</li>
                    <li>Eventos reproductivos, chequeos ginecológicos y palpación rectal.</li>
                    <li>Registros de vacunación oficial FEDEGAN-ICA, ciclos y RUV.</li>
                    <li>Movimientos de potreros, compras, ventas, costos y liquidaciones.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* 3. FINALIDAD DEL TRATAMIENTO */}
          {(activeSection === 'all' || activeSection === 'purpose') && (
            <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. Finalidad Exclusiva del Tratamiento</span>
              </div>
              <p>
                Los datos personales y zootécnicos suministrados por el usuario serán tratados con las siguientes finalidades técnicas y operativas:
              </p>
              
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Administración y Trazabilidad del Hato:</strong> Permitir el registro, cálculo de índices productivos (GDP, días de preñez, conversiones) y generación de reportes pecuarios.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Sincronización Multi-Dispositivo:</strong> Habilitar la consulta y edición fluida de la finca desde cualquier dispositivo autorizado mediante almacenamiento seguro en la nube (Google Firebase) y respaldo local (IndexedDB).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Generación de Documentos y Reportes Oficiales:</strong> Facilitar la exportación del Censo Sanitario ICA, RUV, planillas de campo y balances financieros para uso exclusivo del propietario.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Soporte Técnico y Notificaciones:</strong> Brindar asistencia, confirmaciones de respaldo y avisos de actualización del sistema.</span>
                </li>
              </ul>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>DECLARACIÓN DE NO COMERCIALIZACIÓN: Sus datos ganaderos, económicos y personales son estrictamente confidenciales y de su exclusiva propiedad. INVENTARIO BOVINO APP JAMÁS venderá, alquilará, cederá ni compartirá su información con terceros, empresas de publicidad ni entidades comerciales.</span>
              </div>
            </section>
          )}

          {/* 4. SEGURIDAD & ALMACENAMIENTO */}
          {(activeSection === 'all' || activeSection === 'security') && (
            <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-wide">
                <Lock className="w-4 h-4" />
                <span>4. Medidas de Seguridad, Cifrado y Almacenamiento</span>
              </div>
              <p>
                La plataforma implementa estándares de seguridad técnicos, físicos y administrativos orientados a evitar la adulteración, pérdida, consulta, uso o acceso no autorizado de la información:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">🔒 Cifrado Criptográfico de Credenciales</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">
                    Las contraseñas de acceso son transformadas mediante el algoritmo criptográfico SHA-256 antes de almacenarse, haciendo matemáticamente imposible su lectura o reversión incluso por los administradores de la plataforma.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">☁️ Infraestructura en la Nube con Google Cloud & Firebase</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">
                    Los datos sincronizados se alojan en servidores de alta disponibilidad con protocolos de seguridad HTTPS/TLS y aislamiento por cuenta de usuario mediante identificadores únicos.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">📱 Aislamiento Local Offline-First (IndexedDB)</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">
                    Cuando trabajas en potreros sin cobertura celular, la información se almacena localmente en la memoria segura del navegador o dispositivo mediante IndexedDB y se sincroniza en cuanto recuperas señal.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 5. DERECHOS DE HABEAS DATA */}
          {(activeSection === 'all' || activeSection === 'rights') && (
            <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-sm uppercase tracking-wide">
                <BookOpen className="w-4 h-4" />
                <span>5. Derechos del Titular de la Información (Habeas Data)</span>
              </div>
              <p>
                De conformidad con el artículo 8 de la Ley 1581 de 2012, usted como titular de sus datos personales tiene los siguientes derechos inalienables:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">1. Conocer y Acceder</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Consultar de forma gratuita todos sus datos almacenados en el sistema en cualquier momento.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">2. Actualizar y Rectificar</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Modificar datos inexactos, incompletos o desactualizados directamente desde la ventana de Perfil o edición de animales.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">3. Portabilidad y Copia</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Descargar en cualquier momento una copia íntegra de toda su base de datos en formato JSON o Excel (.xlsx).</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                  <p className="font-bold text-rose-600 dark:text-rose-400">4. Suprimir y Eliminar Cuenta</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Solicitar o ejecutar la eliminación total e irreversible de su cuenta y de todos sus registros locales y en la nube mediante el botón 'Eliminar Cuenta' en la app.</p>
                </div>
              </div>
            </section>
          )}

          {/* 6. CANALES DE ATENCIÓN Y VIGENCIA */}
          {(activeSection === 'all' || activeSection === 'contact') && (
            <section className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                <Mail className="w-4 h-4" />
                <span>6. Canales de Atención, Consultas y Vigencia</span>
              </div>
              <p>
                Para ejercer sus derechos de Habeas Data, formular consultas, peticiones, quejas o reclamos (PQR) relativos al tratamiento de sus datos personales, puede comunicarse a través del canal oficial:
              </p>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                <p><strong>• Canal Oficial de Habeas Data:</strong> <span className="font-mono text-emerald-600 dark:text-emerald-400">criaderosantateresa21@gmail.com</span></p>
                <p><strong>• Tiempo de Respuesta:</strong> Conforme al artículo 14 de la Ley 1581 de 2012, las consultas serán atendidas en un término máximo de diez (10) días hábiles.</p>
                <p><strong>• Vigencia:</strong> La presente política rige a partir del 20 de septiembre de 2026 y permanecerá vigente mientras se preste el servicio de software pecuario.</p>
              </div>
            </section>
          )}

        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Documento Oficial de Tratamiento de Datos Pecuarios</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/30 transition cursor-pointer active:scale-95"
          >
            Entendido y Aceptar
          </button>
        </div>

      </div>
    </div>
  );
}
