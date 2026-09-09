/**
 * Servicio de Feedback Sonoro para Finca Ganadera
 * 100% Offline mediante Web Audio API nativo.
 */

const STORAGE_KEY_SOUND = 'bovina_feedback_sound_enabled';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY_SOUND);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY_SOUND, enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Genera el sonido "Beep" característico de indicador de báscula ganadera y confirmación
 */
export function playScaleBeep() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Tono 1: 950 Hz (35ms)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(950, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.005);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.linearRampToValueAtTime(0, now + 0.045);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.045);

    // Tono 2: 1350 Hz (70ms) - Tono alto confirmatorio nítido
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1350, now + 0.045);
    gain2.gain.setValueAtTime(0, now + 0.045);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.045);
    osc2.stop(now + 0.13);
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Genera sonido melódico para guardado en lote / masivo
 */
export function playBatchSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Acorde Mayor)

    notes.forEach((freq, idx) => {
      const start = now + (idx * 0.06);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  } catch (err) {
    console.warn('Batch audio error:', err);
  }
}

/**
 * Genera tono de advertencia o error sutil
 */
export function playWarningSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.15);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch (err) {
    console.warn('Warning audio error:', err);
  }
}

/**
 * Genera tono de campana armoniosa para actualización o novedad importante
 */
export function playUpdateChime() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

    notes.forEach((freq, idx) => {
      const start = now + (idx * 0.08);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  } catch (err) {
    console.warn('Update chime error:', err);
  }
}

/**
 * Función integral que ejecuta el sonido correspondiente según la acción realizada
 */
export function triggerFeedback(type = 'single') {
  if (type === 'batch') {
    playBatchSuccessSound();
  } else if (type === 'update') {
    playUpdateChime();
  } else if (type === 'warning') {
    playWarningSound();
  } else {
    playScaleBeep();
  }
}

export const triggerWeighingFeedback = triggerFeedback;
