import { useState, useEffect } from 'react';

/**
 * Servicio de Feedback Sonoro para Finca Ganadera
 * 100% Offline mediante Web Audio API nativo con aislamiento estricto por finca/usuario.
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

// Desbloqueo proactivo de AudioContext para iOS Safari / Android en el primer toque
function unlockMobileAudio() {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {}
  }
}

if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
  const handleFirstGesture = () => {
    unlockMobileAudio();
    unlockEvents.forEach(ev => {
      window.removeEventListener(ev, handleFirstGesture, { capture: true });
    });
  };
  unlockEvents.forEach(ev => {
    window.addEventListener(ev, handleFirstGesture, { capture: true, passive: true });
  });
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
    name: 'Báscula Digital',
    emoji: '⚖️',
    tag: 'Ganadero',
    description: 'Doble beep nítido característico de indicador de pesaje en manga.'
  },
  {
    id: 'pop',
    name: 'Burbuja Pop',
    emoji: '🫧',
    tag: 'Minimalista',
    description: 'Sonido orgánico, redondeado y sutil estilo Apple iOS.'
  },
  {
    id: 'marimba',
    name: 'Marimba Cálida',
    emoji: '🪵',
    tag: 'Relajante',
    description: 'Dos notas amaderadas y suaves ideales para largas jornadas de trabajo.'
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
    description: 'Arpegio brillante de logro y registro exitoso en finca.'
  }
];

/**
 * Obtiene el ID de finca efectivo para aislar configuraciones
 */
export function getEffectiveFarmId(sessionUser = null) {
  try {
    const user = sessionUser || (() => {
      const raw = localStorage.getItem('ganado_current_user_session');
      return raw ? JSON.parse(raw) : null;
    })();
    if (!user) return null;
    return user.role === 'worker' ? (user.ownerId || user.id) : user.id;
  } catch (e) {
    return null;
  }
}

/**
 * Consulta si el sonido está habilitado para la finca actual
 */
export function isSoundEnabled(targetFarmId = null) {
  if (typeof window === 'undefined') return true;
  try {
    const farmId = targetFarmId || getEffectiveFarmId();
    if (farmId) {
      const scoped = localStorage.getItem(`${STORAGE_KEY_SOUND}_${farmId}`);
      if (scoped !== null) return scoped === 'true';

      const rawUser = localStorage.getItem('ganado_current_user_session');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const userFarmId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
        if (userFarmId === farmId && user.soundEnabled !== undefined) {
          localStorage.setItem(`${STORAGE_KEY_SOUND}_${farmId}`, user.soundEnabled ? 'true' : 'false');
          return !!user.soundEnabled;
        }
      }
    }
    const val = localStorage.getItem(STORAGE_KEY_SOUND);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Activa o desactiva el sonido guardándolo de forma aislada para esta finca
 */
export function setSoundEnabled(enabled, targetFarmId = null, syncToCloud = true) {
  try {
    const farmId = targetFarmId || getEffectiveFarmId();
    const strVal = enabled ? 'true' : 'false';
    if (farmId) {
      localStorage.setItem(`${STORAGE_KEY_SOUND}_${farmId}`, strVal);
    }
    localStorage.setItem(STORAGE_KEY_SOUND, strVal);

    // Actualizar sesión activa si corresponde
    const rawUser = localStorage.getItem('ganado_current_user_session');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const userFarmId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
      if (!farmId || userFarmId === farmId) {
        user.soundEnabled = !!enabled;
        localStorage.setItem('ganado_current_user_session', JSON.stringify(user));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ganado_sound_changed', {
        detail: {
          enabled: !!enabled,
          profile: getSoundProfile(farmId),
          farmId,
          syncToCloud
        }
      }));
    }
  } catch {}
}

/**
 * Obtiene el perfil de tono de confirmación configurado para la finca
 */
export function getSoundProfile(targetFarmId = null) {
  if (typeof window === 'undefined') return 'chime';
  try {
    const farmId = targetFarmId || getEffectiveFarmId();
    if (farmId) {
      const scoped = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${farmId}`);
      if (scoped && SOUND_PROFILES.some(p => p.id === scoped)) {
        return scoped;
      }

      const rawUser = localStorage.getItem('ganado_current_user_session');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const userFarmId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
        if (userFarmId === farmId && user.soundProfile && SOUND_PROFILES.some(p => p.id === user.soundProfile)) {
          localStorage.setItem(`${STORAGE_KEY_PROFILE}_${farmId}`, user.soundProfile);
          return user.soundProfile;
        }
      }
    }
    const val = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (val && SOUND_PROFILES.some(p => p.id === val)) {
      return val;
    }
    return 'chime';
  } catch {
    return 'chime';
  }
}

/**
 * Establece el perfil de tono guardándolo de forma 100% aislada para la finca
 */
export function setSoundProfile(profileId, targetFarmId = null, syncToCloud = true) {
  try {
    if (!SOUND_PROFILES.some(p => p.id === profileId)) return;
    const farmId = targetFarmId || getEffectiveFarmId();
    if (farmId) {
      localStorage.setItem(`${STORAGE_KEY_PROFILE}_${farmId}`, profileId);
    }
    localStorage.setItem(STORAGE_KEY_PROFILE, profileId);

    // Actualizar sesión activa
    const rawUser = localStorage.getItem('ganado_current_user_session');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const userFarmId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
      if (!farmId || userFarmId === farmId) {
        user.soundProfile = profileId;
        localStorage.setItem('ganado_current_user_session', JSON.stringify(user));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ganado_sound_changed', {
        detail: {
          profile: profileId,
          enabled: isSoundEnabled(farmId),
          farmId,
          syncToCloud
        }
      }));
    }
  } catch {}
}

/**
 * Hook reactivo para usar y sincronizar ajustes de sonido por finca
 */
export function useSoundSettings(customFarmId = null) {
  const [farmId, setFarmId] = useState(() => customFarmId || getEffectiveFarmId());
  const [enabled, setEnabled] = useState(() => isSoundEnabled(customFarmId || getEffectiveFarmId()));
  const [profile, setProfile] = useState(() => getSoundProfile(customFarmId || getEffectiveFarmId()));

  useEffect(() => {
    const currentId = customFarmId || getEffectiveFarmId();
    setFarmId(currentId);
    setEnabled(isSoundEnabled(currentId));
    setProfile(getSoundProfile(currentId));

    const handleSoundChange = (e) => {
      const detail = e.detail;
      const effectiveId = customFarmId || getEffectiveFarmId();
      if (!detail?.farmId || detail.farmId === effectiveId) {
        if (detail?.enabled !== undefined) setEnabled(detail.enabled);
        if (detail?.profile) setProfile(detail.profile);
      }
    };

    window.addEventListener('ganado_sound_changed', handleSoundChange);
    return () => window.removeEventListener('ganado_sound_changed', handleSoundChange);
  }, [customFarmId]);

  return {
    soundEnabled: enabled,
    soundProfile: profile,
    toggleSound: (val) => setSoundEnabled(val !== undefined ? val : !enabled, farmId),
    selectSoundProfile: (newProfile) => setSoundProfile(newProfile, farmId),
  };
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
export function playConfirmationSound(specificProfileId = null, bypassEnabledCheck = false, customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  if (!bypassEnabledCheck && !isSoundEnabled(farmId)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const profile = specificProfileId || getSoundProfile(farmId);

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
export function playLoginSound(customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  if (!isSoundEnabled(farmId)) return;
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
export function playBatchSuccessSound(customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  if (!isSoundEnabled(farmId)) return;
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
export function playWarningSound(customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  if (!isSoundEnabled(farmId)) return;
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
export function playUpdateChime(customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  if (!isSoundEnabled(farmId)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const playChimeInternal = () => {
    try {
      const now = ctx.currentTime;
      // Secuencia armónica de 4 campanas en La Mayor (A4, C#5, E5, A5) nítida y audible
      const notes = [440, 554.37, 659.25, 880];

      notes.forEach((freq, idx) => {
        const start = now + (idx * 0.08);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (err) {
      console.warn('Update chime error:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(playChimeInternal).catch(playChimeInternal);
  } else {
    playChimeInternal();
  }
}

/**
 * Función integral que ejecuta el sonido correspondiente según la acción realizada
 */
export function triggerFeedback(type = 'single', customFarmId = null) {
  const farmId = customFarmId || getEffectiveFarmId();
  if (type === 'batch') {
    playBatchSuccessSound(farmId);
  } else if (type === 'login') {
    playLoginSound(farmId);
  } else if (type === 'update') {
    playUpdateChime(farmId);
  } else if (type === 'warning') {
    playWarningSound(farmId);
  } else {
    playConfirmationSound(null, false, farmId);
  }
}

export const triggerWeighingFeedback = triggerFeedback;

