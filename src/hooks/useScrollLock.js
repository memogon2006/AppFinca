import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '../services/scrollLock';

/**
 * Hook de React para bloquear el scroll del fondo cuando un modal, panel o ventana secundaria está abierta.
 * Al cerrarse la ventana, restaura automáticamente la posición del scroll de la página exactamente donde estaba.
 * 
 * @param {boolean} isOpen - Booleano que indica si el modal o panel está abierto
 */
export function useScrollLock(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [isOpen]);
}

export { lockScroll, unlockScroll };
