"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  requestNotificationPermission,
  registerServiceWorker,
  createPushSubscription,
  getExistingSubscription,
  subscriptionToJson,
} from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase/client";

interface EnablePushNotificationsCardProps {
  userId: string;
}

export default function EnablePushNotificationsCard({
  userId,
}: EnablePushNotificationsCardProps) {
  const [status, setStatus] = useState<
    "idle" | "registering" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [isSupported, setIsSupported] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS standalone flag
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const checkExisting = async () => {
      if (!supported || Notification.permission !== "granted") return;
      const registration = await registerServiceWorker();
      if (!registration) return;
      const existing = await getExistingSubscription(registration);
      if (existing) {
        setIsVisible(false);
      }
    };

    checkExisting();
  }, []);

  const handleEnable = async () => {
    if (!isSupported) return;

    setStatus("registering");
    setMessage("Ativando notificações...");

    try {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        setStatus("error");
        setMessage("Permissão de notificações não concedida.");
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        setStatus("error");
        setMessage("Erro ao registrar Service Worker.");
        return;
      }

      let subscription = await getExistingSubscription(registration);
      if (!subscription) {
        subscription = await createPushSubscription(registration);
      }

      if (!subscription) {
        setStatus("error");
        setMessage("Não foi possível criar a subscription.");
        return;
      }

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
      setMessage("Notificações ativadas com sucesso!");
      setTimeout(() => setIsVisible(false), 2000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Erro ao ativar notificações.");
    }
  };

  if (!isSupported || !isVisible) {
    return null;
  }

  const showPwaHint =
    !isStandalone && /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#ff6b4a]" />
          Ative as notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700">
          Receba alertas de convites, mensagens e atualizações importantes em
          tempo real.
        </p>

        {showPwaHint && (
          <div className="text-xs text-amber-900 bg-white/80 border border-amber-200 rounded-lg p-3">
            No iOS, instale o app na Tela de Início para receber notificações.
          </div>
        )}

        {status === "idle" && (
          <Button
            onClick={handleEnable}
            className="w-full btn-gradient text-white"
          >
            <Bell className="mr-2 h-4 w-4" />
            Ativar notificações
          </Button>
        )}

        {status === "registering" && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff6b4a]" />
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-900">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-900">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
