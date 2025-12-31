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
        const { data, error } = await supabase.functions.invoke("send-push-notification", {
          body: {
            subscription: {
              endpoint: sub.endpoint,
              p256dh: sub.keys?.p256dh || sub.p256dh,
              auth: sub.keys?.auth || sub.auth,
            },
            payload: {
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
            },
          },
        });

        if (error) throw error;
        return data;
      })
    );

    const failed = sendResults.filter((r) => r.status === "rejected");
    if (failed.length === sendResults.length) {
      return NextResponse.json({
        success: false,
        error: "Todas as tentativas de envio falharam",
      });
    }

    return NextResponse.json({
      success: true,
      sent: sendResults.length - failed.length,
      total: sendResults.length,
    });
  } catch (error: any) {
    console.error("Error in send notification API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}

