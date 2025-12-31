import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, notification } = body;

    if (!userId || !notification) {
      return NextResponse.json(
        { success: false, error: "userId e notification são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar subscriptions do usuário
    const { data: subscriptions, error: subError } = await supabase.rpc("get_user_push_subscriptions", {
      p_user_id: userId,
    });

    if (subError) {
      return NextResponse.json(
        { success: false, error: `Erro ao buscar subscriptions: ${subError.message}` },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Usuário não tem subscriptions ativas",
      });
    }

    // Enviar notificação via Edge Function
    const sendResults = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          // O formato da subscription retornado pela função get_user_push_subscriptions
          // já vem no formato correto: { endpoint, p256dh, auth }
          const subscriptionData = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          const payload = {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || "/logo.png",
            badge: notification.badge || "/logo.png",
            tag: notification.tag || "default",
            requireInteraction: notification.requireInteraction || false,
            data: {
              ...notification.data,
              url: notification.data?.url || "/dashboard",
            },
            actions: notification.actions || [],
            vibrate: notification.vibrate || [200, 100, 200],
          };

             const { data, error, status, statusText } = await supabase.functions.invoke("send-push-notification", {
               body: {
                 subscription: subscriptionData,
                 payload: payload,
               },
             });

             if (error) {
               console.error(`[Send Notification] Error for endpoint ${sub.endpoint.substring(0, 50)}...:`, error);
               console.error(`[Send Notification] Status: ${status}, StatusText: ${statusText}`);
               console.error(`[Send Notification] Response data:`, data);
               throw new Error(`Edge Function error: ${error.message || error} (Status: ${status || 'unknown'})`);
             }

             if (status && status >= 400) {
               const errorMessage = data?.error || data?.message || `Edge Function returned status ${status}`;
               console.error(`[Send Notification] Non-2xx status ${status}:`, errorMessage);
               throw new Error(`Edge Function returned a non-2xx status code: ${errorMessage}`);
             }

             return data;
        } catch (err: any) {
          console.error(`[Send Notification] Failed for subscription:`, err);
          throw err;
        }
      })
    );

    const failed = sendResults.filter((r) => r.status === "rejected");
    const successful = sendResults.filter((r) => r.status === "fulfilled");

    // Log detalhado dos erros
    if (failed.length > 0) {
      console.error(`[Send Notification] ${failed.length} tentativas falharam:`, 
        failed.map((r) => r.status === "rejected" ? r.reason : null)
      );
    }

    if (failed.length === sendResults.length) {
      const errorMessages = failed
        .map((r) => {
          if (r.status === "rejected") {
            const reason = r.reason;
            if (reason?.message) return reason.message;
            if (typeof reason === "string") return reason;
            if (reason?.error) return reason.error;
            return String(reason);
          }
          return null;
        })
        .filter(Boolean);
      
      // Verificar se é erro de função não encontrada
      const firstError = errorMessages[0] || "";
      if (firstError.includes("Function not found") || firstError.includes("404")) {
        return NextResponse.json({
          success: false,
          error: "Edge Function 'send-push-notification' não está deployada. Veja DEPLOY_EDGE_FUNCTION.md para instruções.",
          details: errorMessages,
        });
      }

      return NextResponse.json({
        success: false,
        error: `Todas as tentativas de envio falharam. ${errorMessages[0] || "Verifique os logs do servidor"}`,
        details: errorMessages,
      });
    }

    return NextResponse.json({
      success: true,
      sent: successful.length,
      total: sendResults.length,
      failed: failed.length,
    });
  } catch (error: any) {
    console.error("Error in send notification API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}

