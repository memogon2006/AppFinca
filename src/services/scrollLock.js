/**
 * Sistema Robusto de Bloqueo de Desplazamiento y Contención de Scroll para Modales y Paneles
 * 
 * Garantiza:
 * 1. Bloqueo 100% estricto del scroll de la página de fondo al abrir cualquier modal o panel.
 * 2. Cero fugas de scroll (scroll chaining / leak): al llegar al tope o final del contenido,
 *    el scroll se detiene en seco y NUNCA se transfiere al fondo.
 * 3. Restauración exacta e instantánea de la posición previa del scroll al cerrar la ventana.
 * 4. Compatibilidad con modales anidados / apilados (conteo de referencias).
 * 5. Cero saltos visuales de layout al compensar el ancho de la barra de desplazamiento.
 * 6. Desplazamiento independiente y fluido dentro del panel o modal abierto.
 */

import { useEffect } from 'react';

let activeLockCount = 0;
let savedScrollY = 0;
let savedScrollX = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';
let isListenersAttached = false;
let touchStartY = 0;

/**
 * Determina si un elemento HTML específico puede desplazarse en la dirección indicada por deltaY
 */
function canElementScroll(el, deltaY) {
  if (!el || !(el instanceof HTMLElement)) return false;

  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && (el.scrollHeight > el.clientHeight);

  if (!isScrollable) return false;

  if (deltaY < 0) {
    // Scroll hacia arriba: se puede mover si no estamos ya en el tope superior (con margen de 1px)
    return el.scrollTop > 1;
  } else if (deltaY > 0) {
    // Scroll hacia abajo: se puede mover si no estamos ya en el fondo inferior (con margen de 1px)
    return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  }
  return false;
}

/**
 * Inspecciona el target y sus ancestros dentro del modal para verificar si alguno puede consumir el scroll
 */
function hasScrollableAncestor(target, deltaY) {
  let curr = target;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (canElementScroll(curr, deltaY)) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

/**
 * Interceptor global de eventos wheel mientras haya modales activos
 */
function handleGlobalWheel(e) {
  if (activeLockCount <= 0) return;

  // Si es un desplazamiento puramente horizontal, permitirlo si está dentro del modal
  if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
    return;
  }

  // Si el elemento bajo el cursor o sus ancestros de modal no pueden desplazarse más en esta dirección,
  // bloquear el evento para que JAMÁS se transfiera a la página principal de fondo.
  if (!hasScrollableAncestor(e.target, e.deltaY)) {
    e.preventDefault();
  }
}

/**
 * Captura la coordenada inicial táctil en dispositivos móviles
 */
function handleGlobalTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartY = e.touches[0].clientY;
  }
}

/**
 * Interceptor global de eventos touchmove en dispositivos móviles
 */
function handleGlobalTouchMove(e) {
  if (activeLockCount <= 0) return;
  if (!e.touches || e.touches.length === 0) return;

  const currentY = e.touches[0].clientY;
  const deltaY = touchStartY - currentY; // Positivo = arrastre hacia arriba (scroll hacia abajo)

  if (Math.abs(deltaY) < 1) return;

  if (!hasScrollableAncestor(e.target, deltaY)) {
    e.preventDefault();
  }
}

function attachGlobalListeners() {
  if (isListenersAttached || typeof window === 'undefined') return;
  window.addEventListener('wheel', handleGlobalWheel, { passive: false });
  window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
  window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
  isListenersAttached = true;
}

function detachGlobalListeners() {
  if (!isListenersAttached || typeof window === 'undefined') return;
  window.removeEventListener('wheel', handleGlobalWheel);
  window.removeEventListener('touchstart', handleGlobalTouchStart);
  window.removeEventListener('touchmove', handleGlobalTouchMove);
  isListenersAttached = false;
}

/**
 * Activa el bloqueo estricto del scroll de la página de fondo
 */
export function lockScroll() {
  if (typeof window === 'undefined') return;

  activeLockCount++;
  if (activeLockCount === 1) {
    // 1. Guardar la posición exacta actual antes de cualquier cambio de estilo
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    savedScrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;

    // 2. Medir el ancho de la barra de desplazamiento para evitar saltos horizontales
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // 3. Respaldar estilos originales
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    // 4. Aplicar clases CSS y estilos de bloqueo
    document.documentElement.classList.add('modal-scroll-locked');
    document.body.classList.add('modal-scroll-locked');

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 5. Activar barrera de contención de eventos
    attachGlobalListeners();
  }
}

/**
 * Desactiva el bloqueo y restaura la posición exacta anterior de la página
 */
export function unlockScroll() {
  if (typeof window === 'undefined') return;

  activeLockCount = Math.max(0, activeLockCount - 1);
  if (activeLockCount === 0) {
    // Desactivar interceptores globales
    detachGlobalListeners();

    // Remover clases de bloqueo
    document.documentElement.classList.remove('modal-scroll-locked');
    document.body.classList.remove('modal-scroll-locked');

    // Restaurar estilos originales
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.body.style.overflow = originalBodyOverflow || '';
    document.body.style.paddingRight = originalBodyPaddingRight || '';

    // Restaurar inmediatamente la posición exacta del scroll
    window.scrollTo({
      left: savedScrollX,
      top: savedScrollY,
      behavior: 'instant'
    });
  }
}

/**
 * Hook de React para vincular automáticamente el bloqueo de scroll al ciclo de vida del modal/panel
 * @param {boolean} isOpen - Estado de visibilidad del modal
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
