"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Bell } from "lucide-react";
import {
  requestNotificationPermission,
  registerServiceWorker,
  createPushSubscription,
  getExistingSubscription,
  subscriptionToJson,
} from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ForcePushRegisterButtonProps {
  userId: string;
  onSuccess?: () => void;
}

export default function ForcePushRegisterButton({ userId, onSuccess }: ForcePushRegisterButtonProps) {
  const [status, setStatus] = useState<"idle" | "registering" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [isSupported, setIsSupported] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    hasServiceWorker: boolean;
    hasPushManager: boolean;
    permission: NotificationPermission;
    vapidPublicKeyPresent: boolean;
    vapidPublicKeyLength: number;
    vapidPublicKeyPrefix: string;
    registrationScope: string;
  } | null>(null);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
  }, []);

  const handleForceRegister = async () => {
    if (!isSupported) {
      setStatus("error");
      setMessage("Seu navegador não suporta notificações push. Use Chrome, Firefox, Edge ou Safari no iOS 16.4+");
      return;
    }

    setStatus("registering");
    setMessage("Registrando notificação push...");
    setDebugInfo(null);

    let registration: ServiceWorkerRegistration | null = null;
    let currentPermission: NotificationPermission = Notification.permission;

    try {
      // 1. Verificar permissão
      if (currentPermission === "default") {
        setMessage("Solicitando permissão de notificações...");
        currentPermission = await requestNotificationPermission();
      }

      if (currentPermission !== "granted") {
        setStatus("error");
        setMessage("Permissão de notificações negada. Por favor, permita notificações nas configurações do navegador.");
        setDebugInfo({
          hasServiceWorker: "serviceWorker" in navigator,
          hasPushManager: "PushManager" in window,
          permission: currentPermission,
          vapidPublicKeyPresent: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          vapidPublicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
          vapidPublicKeyPrefix: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 10) || "",
          registrationScope: registration?.scope || "",
        });
        return;
      }

      // 2. Registrar Service Worker
      setMessage("Registrando Service Worker...");
      registration = await registerServiceWorker();
      if (!registration) {
        setStatus("error");
        setMessage("Erro ao registrar Service Worker. Verifique se o arquivo sw.js existe.");
        setDebugInfo({
          hasServiceWorker: "serviceWorker" in navigator,
          hasPushManager: "PushManager" in window,
          permission: currentPermission,
          vapidPublicKeyPresent: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          vapidPublicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
          vapidPublicKeyPrefix: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 10) || "",
          registrationScope: "",
        });
        return;
      }

      // 3. Verificar se VAPID key está configurado
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setStatus("error");
        setMessage("Erro: NEXT_PUBLIC_VAPID_PUBLIC_KEY não está configurado. Por favor, configure a chave VAPID pública nas variáveis de ambiente.");
        setDebugInfo({
          hasServiceWorker: "serviceWorker" in navigator,
          hasPushManager: "PushManager" in window,
          permission: currentPermission,
          vapidPublicKeyPresent: false,
          vapidPublicKeyLength: 0,
          vapidPublicKeyPrefix: "",
          registrationScope: registration.scope || "",
        });
        return;
      }

      // 4. Obter ou criar subscription
      setMessage("Criando subscription...");
      let subscription = await getExistingSubscription(registration);

      if (!subscription) {
        subscription = await createPushSubscription(registration);
      }

      if (!subscription) {
        setStatus("error");
        setMessage("Erro ao criar subscription. Verifique se NEXT_PUBLIC_VAPID_PUBLIC_KEY está configurado corretamente e se o Service Worker está registrado.");
        setDebugInfo({
          hasServiceWorker: "serviceWorker" in navigator,
          hasPushManager: "PushManager" in window,
          permission: currentPermission,
          vapidPublicKeyPresent: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          vapidPublicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
          vapidPublicKeyPrefix: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 10) || "",
          registrationScope: registration.scope || "",
        });
        return;
      }

      // 5. Salvar no banco
      setMessage("Salvando subscription no banco de dados...");
      const subscriptionData = subscriptionToJson(subscription);

      const userAgent = navigator.userAgent;
      const deviceInfo = {
        platform: navigator.platform,
        language: navigator.language,
        userAgent: userAgent.substring(0, 200),
      };

      const { error } = await supabase.rpc("rpc_register_push_subscription", {
        p_endpoint: subscriptionData.endpoint,
        p_p256dh: subscriptionData.keys.p256dh,
        p_auth: subscriptionData.keys.auth,
        p_user_agent: userAgent,
        p_device_info: deviceInfo,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("Subscription registrada com sucesso! Agora você pode receber notificações push.");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error forcing push register:", error);
      setStatus("error");
      setMessage(error.message || "Erro ao registrar subscription. Tente novamente.");
      setDebugInfo({
        hasServiceWorker: "serviceWorker" in navigator,
        hasPushManager: "PushManager" in window,
        permission: currentPermission,
        vapidPublicKeyPresent: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        vapidPublicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
        vapidPublicKeyPrefix: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 10) || "",
        registrationScope: registration?.scope || "",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-800">
                Seu navegador não suporta notificações push. Use Chrome, Firefox, Edge ou Safari no iOS 16.4+.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Forçar Registro de Notificações Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          Use este botão para forçar o registro de notificações push. Isso é útil especialmente em dispositivos iOS.
        </p>

        {status === "idle" && (
          <Button
            onClick={handleForceRegister}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <Bell className="mr-2 h-4 w-4" />
            Forçar Registro Agora
          </Button>
        )}

        {status === "registering" && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-blue-200">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{message}</p>
              {debugInfo && (
                <div className="mt-2 text-xs text-red-800 space-y-1">
                  <p>Permissão: {debugInfo.permission}</p>
                  <p>Service Worker: {debugInfo.hasServiceWorker ? "sim" : "não"}</p>
                  <p>PushManager: {debugInfo.hasPushManager ? "sim" : "não"}</p>
                  <p>VAPID public: {debugInfo.vapidPublicKeyPresent ? "sim" : "não"}</p>
                  <p>VAPID length: {debugInfo.vapidPublicKeyLength}</p>
                  <p>VAPID prefix: {debugInfo.vapidPublicKeyPrefix || "-"}</p>
                  <p>SW scope: {debugInfo.registrationScope || "-"}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceRegister}
                className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-600">
            <strong>Nota para iOS:</strong> No Safari iOS 16.4+, certifique-se de que:
            <br />• Você adicionou o site à tela inicial (Add to Home Screen)
            <br />• As notificações estão habilitadas nas configurações do Safari
            <br />• Você está usando HTTPS
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

