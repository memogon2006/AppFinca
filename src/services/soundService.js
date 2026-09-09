/**
 * Servicio de Feedback Sonoro para Finca Ganadera
 * 100% Offline mediante Web Audio API nativo.
 */

const STORAGE_KEY_SOUND = 'bovina_feedback_sound_enabled';
const STORAGE_KEY_PROFILE = 'bovina_feedback_sound_profile';

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

export const SOUND_PROFILES = [
  {
    id: 'chime',
    name: 'Campana Cristalina',
    emoji: '🔔',
    tag: 'Recomendado',
    description: 'Tono armónico, suave y elegante de alta fidelidad.'
  },
  {
    id: 'digital',
    name: 'Báscula Digital (Manga)',
    emoji: '⚖️',
    tag: 'Ganadero',
    description: 'Doble beep nítido característico de indicador de pesaje.'
  },
  {
    id: 'pop',
    name: 'Burbuja / Pop Acústico',
    emoji: '🫧',
    tag: 'Minimalista',
    description: 'Sonido orgánico, redondeado y sutil estilo iOS.'
  },
  {
    id: 'marimba',
    name: 'Marimba Cálida',
    emoji: '🪵',
    tag: 'Relajante',
    description: 'Dos notas amaderadas y suaves para largas jornadas.'
  },
  {
    id: 'click',
    name: 'Clic Tecnológico',
    emoji: '🎯',
    tag: 'Discreto',
    description: 'Micro-pulsación táctil de alta precisión y rapidez.'
  },
  {
    id: 'triumph',
    name: 'Acorde Triunfal',
    emoji: '🎺',
    tag: 'Alegre',
    description: 'Arpegio brillante de logro y registro exitoso.'
  }
];

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

export function getSoundProfile() {
  if (typeof window === 'undefined') return 'chime';
  try {
    const val = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (val && SOUND_PROFILES.some(p => p.id === val)) {
      return val;
    }
    return 'chime';
  } catch {
    return 'chime';
  }
}

export function setSoundProfile(profileId) {
  try {
    if (SOUND_PROFILES.some(p => p.id === profileId)) {
      localStorage.setItem(STORAGE_KEY_PROFILE, profileId);
    }
  } catch {}
}

/**
 * Síntesis de Sonido 1: Campana Cristalina (Chime)
 */
function playChime(ctx, now) {
  const harmonics = [
    { freq: 587.33, gain: 0.20, dur: 0.35, delay: 0 },
    { freq: 880.00, gain: 0.14, dur: 0.30, delay: 0.02 },
    { freq: 1174.66, gain: 0.09, dur: 0.25, delay: 0.04 }
  ];
  harmonics.forEach(h => {
    const start = now + h.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(h.freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(h.gain, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + h.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + h.dur);
  });
}

/**
 * Síntesis de Sonido 2: Báscula Digital (Beep Ganadero)
 */
function playDigitalScale(ctx, now) {
  // Tono 1: 950 Hz (35ms)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(950, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.25, now + 0.005);
  gain1.gain.linearRampToValueAtTime(0.25, now + 0.035);
  gain1.gain.linearRampToValueAtTime(0, now + 0.04);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.04);

  // Tono 2: 1350 Hz (70ms)
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
}

/**
 * Síntesis de Sonido 3: Burbuja / Pop Acústico
 */
function playPop(ctx, now) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(920, now + 0.035);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.32, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

/**
 * Síntesis de Sonido 4: Marimba Cálida
 */
function playMarimba(ctx, now) {
  const notes = [
    { freq: 783.99, delay: 0, dur: 0.16 },
    { freq: 1046.50, delay: 0.045, dur: 0.18 }
  ];
  notes.forEach(n => {
    const start = now + n.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.26, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + n.dur);
  });
}

/**
 * Síntesis de Sonido 5: Clic Tecnológico Discreto
 */
function playTechClick(ctx, now) {
  // Micro-tick 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(1800, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.2, now + 0.002);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.015);

  // Micro-tick 2
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(2400, now + 0.018);
  gain2.gain.setValueAtTime(0, now + 0.018);
  gain2.gain.linearRampToValueAtTime(0.22, now + 0.020);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.018);
  osc2.stop(now + 0.035);
}

/**
 * Síntesis de Sonido 6: Acorde Triunfal
 */
function playTriumph(ctx, now) {
  const notes = [
    { freq: 659.25, delay: 0 },
    { freq: 830.61, delay: 0.045 },
    { freq: 987.77, delay: 0.09 }
  ];
  notes.forEach(n => {
    const start = now + n.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}

/**
 * Ejecuta el tono de confirmación según el perfil seleccionado (o forzando un perfil específico para preview)
 */
export function playConfirmationSound(specificProfileId = null, bypassEnabledCheck = false) {
  if (!bypassEnabledCheck && !isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const profile = specificProfileId || getSoundProfile();

    switch (profile) {
      case 'digital':
        playDigitalScale(ctx, now);
        break;
      case 'pop':
        playPop(ctx, now);
        break;
      case 'marimba':
        playMarimba(ctx, now);
        break;
      case 'click':
        playTechClick(ctx, now);
        break;
      case 'triumph':
        playTriumph(ctx, now);
        break;
      case 'chime':
      default:
        playChime(ctx, now);
        break;
    }
  } catch (err) {
    console.warn('Audio play confirmation error:', err);
  }
}

// Alias para compatibilidad hacia atrás
export const playScaleBeep = playConfirmationSound;

/**
 * Genera acorde armónico de bienvenida / ingreso a la finca ganadera
 */
export function playLoginSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Secuencia armónica ascendente cálida de bienvenida (C4, G4, C5, E5, G5)
    const notes = [261.63, 392.00, 523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      const start = now + (idx * 0.065);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch (err) {
    console.warn('Login sound error:', err);
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
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

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
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

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
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

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
  } else if (type === 'login') {
    playLoginSound();
  } else if (type === 'update') {
    playUpdateChime();
  } else if (type === 'warning') {
    playWarningSound();
  } else {
    playConfirmationSound();
  }
}

export const triggerWeighingFeedback = triggerFeedback;

