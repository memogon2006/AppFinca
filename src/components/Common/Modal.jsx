import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl', zIndex = 'z-50' }) {
  // Bloqueo y restauración limpia de scroll de la página de fondo
  useScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={`modal-backdrop-root fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto`}
      style={{
        overscrollBehavior: 'contain',
        overscrollBehaviorY: 'contain'
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/70 dark:bg-slate-950/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] sm:max-h-[90vh] flex flex-col transition-all pb-[env(safe-area-inset-bottom)]`}
        style={{
          overscrollBehavior: 'contain',
          overscrollBehaviorY: 'contain'
        }}
        data-modal-container="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 sticky top-0 z-20">
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300 font-bold mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div 
          className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 sm:space-y-6 text-slate-800 dark:text-slate-200"
          style={{
            overscrollBehavior: 'contain',
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
          data-modal-scrollable="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
