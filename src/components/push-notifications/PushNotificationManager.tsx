"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  requestNotificationPermission,
  registerServiceWorker,
  createPushSubscription,
  getExistingSubscription,
  subscriptionToJson,
  unsubscribe,
} from "@/lib/push-notifications";

interface PushNotificationManagerProps {
  userId: string | null;
}

/**
 * Componente que gerencia push notifications
 * Registra service worker, solicita permissão e salva subscription no banco
 */
export default function PushNotificationManager({ userId }: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Verificar suporte
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (!supported) {
      console.log("[Push Notifications] Não suportado neste navegador");
      return;
    }

    // Verificar permissão atual
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Inicializar notificações quando userId estiver disponível
    if (userId) {
      initializePushNotifications();
    }
  }, [userId]);

  const initializePushNotifications = async () => {
    if (!userId) return;

    try {
      // 1. Registrar Service Worker
      const registration = await registerServiceWorker();
      if (!registration) {
        console.log("[Push Notifications] Service Worker não registrado");
        return;
      }

      // 2. Solicitar permissão
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission !== "granted") {
        console.log("[Push Notifications] Permissão negada:", newPermission);
        return;
      }

      // 3. Obter ou criar subscription
      let subscription = await getExistingSubscription(registration);

      if (!subscription) {
        subscription = await createPushSubscription(registration);
      }

      if (!subscription) {
        console.log("[Push Notifications] Não foi possível criar subscription");
        return;
      }

      // 4. Salvar subscription no banco
      await saveSubscriptionToDatabase(subscription);
      setIsRegistered(true);

      console.log("[Push Notifications] Notificações configuradas com sucesso");
    } catch (error) {
      console.error("[Push Notifications] Erro ao inicializar:", error);
    }
  };

  const saveSubscriptionToDatabase = async (subscription: PushSubscription) => {
    if (!userId) return;

    try {
      const subscriptionData = subscriptionToJson(subscription);

      // Obter informações do dispositivo
      const userAgent = navigator.userAgent;
      const deviceInfo = {
        platform: navigator.platform,
        language: navigator.language,
        userAgent: userAgent.substring(0, 200), // Limitar tamanho
      };

      // Chamar RPC para salvar subscription
      const { error } = await supabase.rpc("rpc_register_push_subscription", {
        p_endpoint: subscriptionData.endpoint,
        p_p256dh: subscriptionData.keys.p256dh,
        p_auth: subscriptionData.keys.auth,
        p_user_agent: userAgent,
        p_device_info: deviceInfo,
      });

      if (error) {
        console.error("[Push Notifications] Erro ao salvar subscription:", error);
        throw error;
      }

      console.log("[Push Notifications] Subscription salva no banco");
    } catch (error) {
      console.error("[Push Notifications] Erro ao salvar subscription:", error);
      throw error;
    }
  };

  // Este componente não renderiza nada visível
  // Ele apenas gerencia o registro de notificações em background
  return null;
}

