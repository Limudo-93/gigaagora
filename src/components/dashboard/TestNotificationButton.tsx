"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type StatusState = {
  type: "success" | "error";
  message: string;
} | null;

export default function TestNotificationButton() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const sendTestNotification = async () => {
    setSending(true);
    setStatus(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus({
          type: "error",
          message: "Voce precisa estar logado para testar.",
        });
        return;
      }

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          notification: {
            title: "Teste de notificacao",
            body: "Se voce recebeu isto, suas notificacoes estao ativas.",
            tag: "test-notification",
            requireInteraction: false,
            data: { url: "/dashboard" },
          },
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Falha ao enviar notificacao.");
      }

      setStatus({
        type: "success",
        message: "Notificacao enviada! Verifique seu dispositivo.",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Erro ao enviar notificacao.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        className="btn-gradient"
        onClick={sendTestNotification}
        disabled={sending}
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Testar agora"
        )}
      </Button>
      {status && (
        <p
          className={`text-xs ${
            status.type === "success" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
