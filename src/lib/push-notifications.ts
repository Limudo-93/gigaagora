/**
 * Bibliotecas e utilitários para notificações push PWA
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  vibrate?: number[];
  url?: string;
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Converte uma PushSubscription em formato para enviar ao servidor
 */
export function subscriptionToJson(subscription: PushSubscription): PushSubscriptionData {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (!key || !auth) {
    throw new Error('Subscription keys não disponíveis');
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: base64UrlEncode(key),
      auth: base64UrlEncode(auth),
    },
  };
}

/**
 * Codifica ArrayBuffer para Base64 URL-safe
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Registra Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[Push Notifications] Service Worker registrado:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[Push Notifications] Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Cria uma PushSubscription
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // VAPID public key - deve ser configurado no ambiente
    const rawVapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!rawVapidPublicKey) {
      const error = new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurado");
      console.error("[Push Notifications] VAPID_PUBLIC_KEY não configurado");
      throw error;
    }

    const vapidPublicKey = normalizeVapidKey(rawVapidPublicKey);
    const keyArray = urlBase64ToUint8Array(vapidPublicKey);
    // Type assertion necessário devido à inferência de tipos do TypeScript
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyArray as any,
    });

    console.log('[Push Notifications] Subscription criada:', subscription.endpoint);
    return subscription;
  } catch (error) {
    console.error('[Push Notifications] Erro ao criar subscription:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao criar subscription");
  }
}

/**
 * Converte VAPID key de Base64 URL para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(base64String)) {
    throw new Error("VAPID public key contém caracteres inválidos");
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return bytes;
}

function normalizeVapidKey(key: string): string {
  const trimmed = key.trim();
  // Remover qualquer whitespace interno acidental (copiar/colar)
  return trimmed.replace(/\s+/g, "");
}

/**
 * Obtém subscription existente
 */
export async function getExistingSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Push Notifications] Erro ao obter subscription:', error);
    return null;
  }
}

/**
 * Cancela uma subscription
 */
export async function unsubscribe(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const result = await subscription.unsubscribe();
    console.log('[Push Notifications] Subscription cancelada:', result);
    return result;
  } catch (error) {
    console.error('[Push Notifications] Erro ao cancelar subscription:', error);
    return false;
  }
}

