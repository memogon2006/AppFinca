import { db, logActivity } from './db';
import { safeFetch, toSafeEmailKey } from './cloudSync';
import { formatDate, getDaysDifference, getLocalDateString } from './calculations';

export const FIREBASE_URL = 'https://ganadera-plataforma-default-rtdb.firebaseio.com';

/**
 * Correos con privilegios de Super Administrador / Propietario de la plataforma
 */
export const SUPER_ADMIN_EMAILS = [
  'criaderosantateresa21@gmail.com',
  'memogon2006@gmail.com',
  'luisgonzalez@finca.local'
];

/**
 * Catálogo Oficial de Planes de Membresía
 */
export const SUBSCRIPTION_PLANS = {
  trial: {
    id: 'trial',
    name: 'Prueba Gratuita',
    badge: '14 Días Gratis',
    badgeColor: 'amber',
    priceCopMonthly: 0,
    priceCopYearly: 0,
    maxCattle: 30,
    maxWorkers: 1,
    description: 'Acceso inicial para conocer y probar la plataforma en tu finca.',
    features: [
      'Hasta 30 cabezas de ganado',
      'Control de inventario, pesajes y GDP',
      'Ficha técnica con genealogía y fotos',
      'Plan sanitario y calendario de vacunación',
      'Censo poblacional ICA / FEDEGAN',
      '1 usuario trabajador de campo'
    ],
    highlight: false
  },
  basic: {
    id: 'basic',
    name: 'Ganadero Básico',
    badge: 'Fincas Pequeñas',
    badgeColor: 'blue',
    priceCopMonthly: 39000,
    priceCopSemiannual: 190000,
    priceCopYearly: 350000,
    maxCattle: 100,
    maxWorkers: 1,
    description: 'Ideal para pequeños productores y hatos en crecimiento.',
    features: [
      'Hasta 100 cabezas de ganado',
      'Inventario, pesajes y curva de crecimiento',
      'Módulo de potreros y rotación de pasturas',
      'Sanidad, calendario y alertas ICA',
      'Respaldo automático en la nube',
      '1 usuario trabajador / vaquero'
    ],
    highlight: false
  },
  pro: {
    id: 'pro',
    name: 'Ganadero Pro',
    badge: '⭐ Más Popular',
    badgeColor: 'emerald',
    priceCopMonthly: 59000,
    priceCopSemiannual: 290000,
    priceCopYearly: 490000,
    maxCattle: 500,
    maxWorkers: 3,
    description: 'La solución completa para fincas comerciales de ceba, cría y doble propósito.',
    features: [
      'Hasta 500 cabezas de ganado',
      'Todos los módulos activos (Ceba, Lotes, IATF, Lechería)',
      'Finanzas, costos por kilo y utilidad neta',
      'Liquidación de ventas en compañía (Finca vs Socio)',
      'Exportación ilimitada a Excel y WhatsApp',
      'Hasta 3 usuarios de campo / vaqueros',
      'Soporte técnico prioritario'
    ],
    highlight: true
  },
  premium: {
    id: 'premium',
    name: 'Hacienda Premium',
    badge: '👑 Ilimitado',
    badgeColor: 'purple',
    priceCopMonthly: 89000,
    priceCopSemiannual: 450000,
    priceCopYearly: 790000,
    maxCattle: null, // Ilimitado
    maxWorkers: 10,
    description: 'Para ganaderías empresariales, múltiples predios y grandes hatos.',
    features: [
      '🐄 Ganado ILIMITADO (sin restricción de cabezas)',
      'Acceso total a todos los módulos actuales y futuros',
      'Liquidaciones lecheras y actas oficiales',
      'Hasta 10 cuentas de trabajadores y mayordomos',
      'Copias de seguridad de alta prioridad en la nube',
      'Soporte VIP personalizado 24/7'
    ],
    highlight: false
  },
  lifetime: {
    id: 'lifetime',
    name: 'Vitalicio Fundador',
    badge: '👑 Vitalicio',
    badgeColor: 'emerald',
    priceCopMonthly: 0,
    priceCopYearly: 0,
    maxCattle: null,
    maxWorkers: null,
    description: 'Membresía vitalicia permanente sin fecha de vencimiento.',
    features: [
      'Acceso ilimitado de por vida',
      'Sin vencimientos ni cobros recurrentes',
      'Todas las funciones y actualizaciones incluidas'
    ],
    highlight: false
  }
};

/**
 * Datos de contacto para pago y activación de membresías
 */
export const PAYMENT_CONTACT_INFO = {
  whatsappNumber: '573136504283', // Ajustable por el administrador
  whatsappDisplay: '+57 313 650 4283',
  bankName: 'Bancolombia / Nequi / Daviplata',
  accountNumber: 'Ahorros Bancolombia / Nequi',
  accountHolder: 'Ganadería La G - Administración'
};

/**
 * Verifica si un usuario es Super Administrador del sistema
 */
export function isSuperAdmin(user) {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Retorna la membresía inicial predeterminada (14 días de prueba gratuita)
 */
export function getDefaultSubscription(isFounder = false) {
  const now = new Date();
  
  if (isFounder) {
    return {
      planId: 'lifetime',
      planName: 'Vitalicio Fundador',
      status: 'active',
      startDate: now.toISOString(),
      expiresAt: null,
      maxCattle: null,
      maxWorkers: null,
      billingCycle: 'lifetime',
      isManualOverride: true,
      updatedAt: now.toISOString()
    };
  }

  // 14 días de prueba gratuita
  const expiration = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return {
    planId: 'trial',
    planName: 'Prueba Gratuita (14 Días)',
    status: 'trial',
    startDate: now.toISOString(),
    expiresAt: expiration.toISOString(),
    trialDays: 14,
    maxCattle: 30,
    maxWorkers: 1,
    billingCycle: 'trial',
    isManualOverride: false,
    updatedAt: now.toISOString()
  };
}

/**
 * Evalúa el estado en tiempo real de la membresía de un usuario
 */
export function getSubscriptionStatus(user) {
  if (!user) {
    return {
      status: 'expired',
      isTrial: false,
      isActive: false,
      isExpired: true,
      isGracePeriod: false,
      daysRemaining: 0,
      expiresAt: null,
      plan: SUBSCRIPTION_PLANS.trial,
      planId: 'trial',
      planName: 'Prueba Gratuita',
      label: 'Sin Sesión',
      color: 'rose',
      canAccess: false,
      isSuperAdmin: false
    };
  }

  // 1. Super Administradores tienen acceso total vitalicio
  if (isSuperAdmin(user)) {
    return {
      status: 'active',
      isTrial: false,
      isActive: true,
      isExpired: false,
      isGracePeriod: false,
      daysRemaining: 9999,
      expiresAt: null,
      plan: SUBSCRIPTION_PLANS.lifetime,
      planId: 'lifetime',
      planName: 'Plan Vitalicio SuperAdmin',
      label: '👑 SuperAdmin (Ilimitado)',
      color: 'emerald',
      canAccess: true,
      isSuperAdmin: true
    };
  }

  // 2. Si el usuario es un trabajador (vaquero), hereda el estado de su finca propietaria
  if (user.role === 'worker') {
    return {
      status: 'active',
      isTrial: false,
      isActive: true,
      isExpired: false,
      isGracePeriod: false,
      daysRemaining: 9999,
      expiresAt: null,
      plan: SUBSCRIPTION_PLANS.pro,
      planId: 'worker',
      planName: 'Cuenta de Campo (Trabajador)',
      label: '🤠 Modo Campo',
      color: 'amber',
      canAccess: true,
      isSuperAdmin: false
    };
  }

  const sub = user.subscription || getDefaultSubscription(false);
  const plan = SUBSCRIPTION_PLANS[sub.planId] || SUBSCRIPTION_PLANS.trial;

  // Plan Vitalicio
  if (sub.planId === 'lifetime' || !sub.expiresAt) {
    return {
      status: 'active',
      isTrial: false,
      isActive: true,
      isExpired: false,
      isGracePeriod: false,
      daysRemaining: 9999,
      expiresAt: null,
      plan: SUBSCRIPTION_PLANS.lifetime,
      planId: 'lifetime',
      planName: 'Membresía Vitalicia',
      label: '👑 Plan Vitalicio',
      color: 'emerald',
      canAccess: true,
      isSuperAdmin: false
    };
  }

  // Cálculo de fechas y días restantes
  const now = new Date();
  const expireDate = new Date(sub.expiresAt);
  const diffMs = expireDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 3. Período de Gracia (3 días después de vencer para dar margen de pago)
  const isGracePeriod = daysRemaining <= 0 && daysRemaining >= -3;
  const isExpired = daysRemaining < -3;
  const isTrial = sub.status === 'trial' || sub.planId === 'trial';
  const isActive = daysRemaining > 0 || isGracePeriod;

  let status = sub.status || (isTrial ? 'trial' : 'active');
  let label = '';
  let color = 'emerald';

  if (isExpired) {
    status = 'expired';
    label = '🔴 Membresía Vencida';
    color = 'rose';
  } else if (isGracePeriod) {
    status = 'grace_period';
    label = `⚠️ Período de Gracia (${Math.abs(daysRemaining)}d vencido)`;
    color = 'amber';
  } else if (daysRemaining <= 5) {
    label = `🟡 Vence en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}`;
    color = 'amber';
  } else if (isTrial) {
    label = `🌱 Prueba (${daysRemaining} días restantes)`;
    color = 'blue';
  } else {
    label = `🟢 ${plan.name} (${daysRemaining} días)`;
    color = 'emerald';
  }

  return {
    status,
    isTrial,
    isActive,
    isExpired,
    isGracePeriod,
    daysRemaining: Math.max(0, daysRemaining),
    rawDaysDifference: daysRemaining,
    expiresAt: sub.expiresAt,
    expiresAtFormatted: formatDate(sub.expiresAt),
    plan,
    planId: sub.planId,
    planName: plan.name,
    maxCattle: sub.maxCattle !== undefined ? sub.maxCattle : plan.maxCattle,
    maxWorkers: sub.maxWorkers !== undefined ? sub.maxWorkers : plan.maxWorkers,
    label,
    color,
    canAccess: !isExpired,
    isSuperAdmin: false
  };
}

/**
 * Valida si el usuario puede registrar más bovinos según su plan
 */
export function canAddAnimal(cattleList = [], user) {
  if (!user || isSuperAdmin(user) || user.role === 'worker') return { allowed: true };
  const subStatus = getSubscriptionStatus(user);
  
  if (subStatus.isExpired) {
    return {
      allowed: false,
      reason: 'expired',
      message: 'Tu membresía ha expirado. Por favor renueva tu plan para registrar nuevos animales.'
    };
  }

  if (subStatus.maxCattle === null) return { allowed: true };

  const activeCattleCount = cattleList.filter(c => c.status !== 'Vendido' && c.status !== 'Muerto').length;
  if (activeCattleCount >= subStatus.maxCattle) {
    return {
      allowed: false,
      reason: 'limit_reached',
      currentCount: activeCattleCount,
      maxAllowed: subStatus.maxCattle,
      message: `Has alcanzado el límite de ${subStatus.maxCattle} animales activos de tu ${subStatus.planName}. Mejora tu plan para continuar registrando ganado.`
    };
  }

  return { allowed: true };
}

/**
 * Valida si el usuario puede crear más cuentas de trabajadores
 */
export function canAddWorker(workersList = [], user) {
  if (!user || isSuperAdmin(user)) return { allowed: true };
  const subStatus = getSubscriptionStatus(user);

  if (subStatus.isExpired) {
    return {
      allowed: false,
      reason: 'expired',
      message: 'Tu membresía ha expirado. Por favor renueva tu plan para administrar trabajadores.'
    };
  }

  if (subStatus.maxWorkers === null) return { allowed: true };

  const currentCount = workersList.length;
  if (currentCount >= subStatus.maxWorkers) {
    return {
      allowed: false,
      reason: 'limit_reached',
      currentCount,
      maxAllowed: subStatus.maxWorkers,
      message: `Tu ${subStatus.planName} permite hasta ${subStatus.maxWorkers} cuenta(s) de vaquero/trabajador. Mejora a Plan Pro o Premium para agregar más colaboradores.`
    };
  }

  return { allowed: true };
}

/**
 * Otorga, extiende o actualiza la membresía de un ganadero en Local y Nube (Firebase)
 */
export async function grantSubscription({
  targetUserId,
  targetUserEmail,
  planId = 'pro',
  durationDays = 30,
  billingCycle = 'monthly',
  isLifetime = false,
  adminUser = null,
  notes = ''
}) {
  if (!targetUserEmail && !targetUserId) throw new Error('Usuario destino no especificado.');

  const cleanEmail = (targetUserEmail || '').trim().toLowerCase();
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro;
  const now = new Date();

  let expiresAt = null;
  if (!isLifetime && planId !== 'lifetime') {
    // Si ya tenía una fecha futura, sumamos los días a partir de esa fecha
    const localUser = (await db.users.toArray()).find(u => (u.email || '').toLowerCase() === cleanEmail || u.id === targetUserId);
    const currentExpire = localUser?.subscription?.expiresAt ? new Date(localUser.subscription.expiresAt) : now;
    const baseDate = currentExpire > now ? currentExpire : now;
    const newExpire = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    expiresAt = newExpire.toISOString();
  }

  const subscriptionPayload = {
    planId: isLifetime ? 'lifetime' : planId,
    planName: isLifetime ? 'Vitalicio Fundador' : plan.name,
    status: 'active',
    startDate: now.toISOString(),
    expiresAt,
    maxCattle: plan.maxCattle,
    maxWorkers: plan.maxWorkers,
    billingCycle: isLifetime ? 'lifetime' : billingCycle,
    durationDays: isLifetime ? null : durationDays,
    lastPaymentDate: getLocalDateString(now),
    isManualOverride: true,
    activatedBy: adminUser?.email || 'admin',
    notes: notes || `Activación de ${durationDays} días por SuperAdmin`,
    updatedAt: now.toISOString()
  };

  // 1. Actualizar en Dexie Local
  const allUsers = await db.users.toArray();
  for (const u of allUsers) {
    if ((u.email || '').toLowerCase() === cleanEmail || (targetUserId && u.id === targetUserId)) {
      await db.users.update(u.id, {
        subscription: subscriptionPayload,
        updatedAt: now.toISOString()
      }).catch(() => null);
    }
  }

  // 2. Actualizar en Firebase Realtime Database
  if (cleanEmail) {
    const safeEmail = toSafeEmailKey(cleanEmail);
    await safeFetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscriptionPayload,
        updatedAt: now.toISOString()
      })
    }).catch((e) => console.warn('Error sincronizando suscripción con Firebase:', e));
  }

  // 3. Registrar auditoría de la acción
  await logActivity({
    action: 'subscription_granted',
    description: `Activó plan ${subscriptionPayload.planName} (${durationDays ? durationDays + ' días' : 'Vitalicio'}) para ${cleanEmail}`,
    operatorName: adminUser?.name || 'SuperAdmin',
    operatorRole: 'superadmin',
    userId: adminUser?.id || 'admin'
  });

  return subscriptionPayload;
}
