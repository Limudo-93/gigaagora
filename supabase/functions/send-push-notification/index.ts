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
    // Log da requisição recebida
    console.log("[Push Notification] Requisição recebida:", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Parse do body com tratamento de erro
    let body;
    try {
      const bodyText = await req.text();
      console.log("[Push Notification] Body recebido (primeiros 200 chars):", bodyText.substring(0, 200));
      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      console.error("[Push Notification] Erro ao fazer parse do JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: parseError.message 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { subscription, payload } = body;

    if (!subscription || !payload) {
      return new Response(
        JSON.stringify({ error: "subscription and payload are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log dos dados recebidos (sem informações sensíveis)
    console.log("[Push Notification] Dados recebidos:", {
      hasSubscription: !!subscription,
      hasPayload: !!payload,
      subscriptionEndpoint: subscription?.endpoint?.substring(0, 50) || "N/A",
      payloadTitle: payload?.title || "N/A",
    });

    // Validar chaves VAPID
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[Push Notification] VAPID keys não configuradas");
      console.error("[Push Notification] VAPID_PUBLIC_KEY presente:", !!VAPID_PUBLIC_KEY);
      console.error("[Push Notification] VAPID_PUBLIC_KEY length:", VAPID_PUBLIC_KEY?.length || 0);
      console.error("[Push Notification] VAPID_PRIVATE_KEY presente:", !!VAPID_PRIVATE_KEY);
      console.error("[Push Notification] VAPID_PRIVATE_KEY length:", VAPID_PRIVATE_KEY?.length || 0);
      console.error("[Push Notification] VAPID_SUBJECT:", VAPID_SUBJECT);
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

    console.log("[Push Notification] Subscription validada:", {
      hasEndpoint: !!subscription.endpoint,
      hasP256dh: !!p256dh,
      hasAuth: !!auth,
      endpointLength: subscription.endpoint?.length || 0,
      p256dhLength: p256dh?.length || 0,
      authLength: auth?.length || 0,
    });

    if (!subscription.endpoint || !p256dh || !auth) {
      console.error("[Push Notification] Subscription incompleta:", {
        endpoint: !!subscription.endpoint,
        p256dh: !!p256dh,
        auth: !!auth,
        subscriptionKeys: Object.keys(subscriptionKeys || {}),
        subscription: Object.keys(subscription || {}),
      });
      return new Response(
        JSON.stringify({ 
          error: "Subscription incompleta. Endpoint, p256dh e auth são obrigatórios",
          received: {
            hasEndpoint: !!subscription.endpoint,
            hasP256dh: !!p256dh,
            hasAuth: !!auth,
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enviar notificação
    let notificationPayload: string;
    try {
      notificationPayload = JSON.stringify(payload);
      console.log("[Push Notification] Payload serializado com sucesso");
    } catch (stringifyError: any) {
      console.error("[Push Notification] Erro ao serializar payload:", stringifyError);
      throw new Error(`Erro ao serializar payload: ${stringifyError.message}`);
    }

    console.log("[Push Notification] Enviando notificação para:", subscription.endpoint.substring(0, 50) + "...");
    console.log("[Push Notification] Payload (primeiros 200 chars):", notificationPayload.substring(0, 200) + "...");
    console.log("[Push Notification] VAPID config:", {
      hasSubject: !!VAPID_SUBJECT,
      hasPublicKey: !!VAPID_PUBLIC_KEY,
      hasPrivateKey: !!VAPID_PRIVATE_KEY,
      publicKeyLength: VAPID_PUBLIC_KEY.length,
      privateKeyLength: VAPID_PRIVATE_KEY.length,
    });

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
      console.error("[Push Notification] Erro name:", pushError.name);
      console.error("[Push Notification] Erro message:", pushError.message);
      console.error("[Push Notification] Erro statusCode:", pushError.statusCode);
      console.error("[Push Notification] Erro body:", pushError.body);
      console.error("[Push Notification] Erro stack:", pushError.stack);
      
      // Retornar erro mais específico
      const errorMessage = pushError.message || "Erro desconhecido ao enviar notificação";
      const errorDetails: any = {
        error: errorMessage,
        type: pushError.name || "PushError",
        statusCode: pushError.statusCode,
      };
      
      if (pushError.body) {
        try {
          errorDetails.body = typeof pushError.body === 'string' ? pushError.body : JSON.stringify(pushError.body);
        } catch (e) {
          errorDetails.body = "Erro ao serializar body do erro";
        }
      }
      
      return new Response(
        JSON.stringify(errorDetails),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Push Notification] ========== ERRO GERAL ==========");
    console.error("[Push Notification] Error name:", error?.name);
    console.error("[Push Notification] Error message:", error?.message);
    console.error("[Push Notification] Error stack:", error?.stack);
    console.error("[Push Notification] Error type:", typeof error);
    console.error("[Push Notification] Error keys:", Object.keys(error || {}));
    
    try {
      console.error("[Push Notification] Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (jsonError) {
      console.error("[Push Notification] Erro ao serializar error:", jsonError);
    }
    
    // Retornar erro mais detalhado
    const errorMessage = error?.message || error?.toString() || "Erro desconhecido ao enviar notificação";
    const errorDetails: any = {
      error: errorMessage,
      type: error?.name || "Error",
    };
    
    // Adicionar mais detalhes se disponíveis
    if (error?.statusCode) {
      errorDetails.statusCode = error.statusCode;
    }
    if (error?.body) {
      try {
        errorDetails.body = typeof error.body === 'string' ? error.body : JSON.stringify(error.body);
      } catch (e) {
        // Ignorar erro de serialização
      }
    }
    
    // Em desenvolvimento, adicionar stack trace
    if (Deno.env.get("DENO_ENV") === "development" || Deno.env.get("ENVIRONMENT") === "development") {
      errorDetails.stack = error?.stack;
      errorDetails.details = error?.toString();
    }

    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

