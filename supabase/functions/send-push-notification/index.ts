// Supabase Edge Function para enviar notificações push
// Esta função deve ser deployada no Supabase
// Instruções: https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Usar npm:web-push que é mais estável e mantido
import * as webPush from "npm:web-push@^3.6.6";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@chamaomusico.com";

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { subscription, payload } = await req.json();

    if (!subscription || !payload) {
      return new Response(
        JSON.stringify({ error: "subscription and payload are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar chaves VAPID
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[Push Notification] VAPID keys não configuradas");
      console.error("[Push Notification] VAPID_PUBLIC_KEY presente:", !!VAPID_PUBLIC_KEY);
      console.error("[Push Notification] VAPID_PRIVATE_KEY presente:", !!VAPID_PRIVATE_KEY);
      return new Response(
        JSON.stringify({ 
          error: "VAPID keys não configuradas na Edge Function",
          details: "Certifique-se de configurar VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT nas Secrets do Supabase Dashboard"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Formato da subscription pode vir com keys nested ou direto
    const subscriptionKeys = subscription.keys || subscription;
    const p256dh = subscriptionKeys.p256dh || subscription.p256dh;
    const auth = subscriptionKeys.auth || subscription.auth;

    if (!subscription.endpoint || !p256dh || !auth) {
      return new Response(
        JSON.stringify({ error: "Subscription incompleta. Endpoint, p256dh e auth são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enviar notificação
    const notificationPayload = JSON.stringify(payload);

    console.log("[Push Notification] Enviando notificação para:", subscription.endpoint.substring(0, 50) + "...");
    console.log("[Push Notification] Payload:", JSON.stringify(payload).substring(0, 100) + "...");

    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: p256dh,
            auth: auth,
          },
        },
        notificationPayload,
        {
          vapidDetails: {
            subject: VAPID_SUBJECT,
            publicKey: VAPID_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY,
          },
        }
      );
      console.log("[Push Notification] Notificação enviada com sucesso");
    } catch (pushError: any) {
      console.error("[Push Notification] Erro ao chamar webPush.sendNotification:", pushError);
      console.error("[Push Notification] Erro details:", JSON.stringify(pushError, Object.getOwnPropertyNames(pushError)));
      throw pushError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Push Notification] Error sending push notification:", error);
    console.error("[Push Notification] Error stack:", error.stack);
    console.error("[Push Notification] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Retornar erro mais detalhado
    const errorMessage = error.message || "Erro desconhecido ao enviar notificação";
    const errorDetails = {
      error: errorMessage,
      type: error.name || "Error",
      ...(process.env.DENO_ENV === "development" && {
        stack: error.stack,
        details: error.toString(),
      }),
    };

    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

