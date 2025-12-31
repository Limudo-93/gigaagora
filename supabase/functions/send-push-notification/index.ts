// Supabase Edge Function para enviar notificações push
// Esta função deve ser deployada no Supabase
// Instruções: https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Usar npm:web-push que é mais estável e mantido
import * as webPush from "npm:web-push@^3.6.6";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@chamaomusico.com";

// Log das variáveis de ambiente no início (sem valores sensíveis)
console.log("[Push Notification] Variáveis VAPID carregadas:", {
  hasPublicKey: !!VAPID_PUBLIC_KEY,
  publicKeyLength: VAPID_PUBLIC_KEY.length,
  hasPrivateKey: !!VAPID_PRIVATE_KEY,
  privateKeyLength: VAPID_PRIVATE_KEY.length,
  hasSubject: !!VAPID_SUBJECT,
  subject: VAPID_SUBJECT,
});

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Wrapper try-catch mais externo para capturar qualquer erro
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Log da requisição recebida
    console.log("[Push Notification] ========== INÍCIO DA REQUISIÇÃO ==========");
    console.log("[Push Notification] Method:", req.method);
    console.log("[Push Notification] URL:", req.url);

    // Parse do body com tratamento de erro
    let body: any;
    try {
      // Tentar usar req.json() diretamente primeiro
      body = await req.json();
      console.log("[Push Notification] Body parseado com sucesso");
      console.log("[Push Notification] Body keys:", Object.keys(body || {}));
    } catch (parseError: any) {
      console.error("[Push Notification] Erro ao fazer parse do JSON:", parseError);
      console.error("[Push Notification] Parse error name:", parseError?.name);
      console.error("[Push Notification] Parse error message:", parseError?.message);
      console.error("[Push Notification] Parse error stack:", parseError?.stack);
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: parseError?.message || String(parseError),
          type: parseError?.name || "ParseError"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { subscription, payload } = body || {};

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
      
      const statusCode = Number(pushError?.statusCode);
      if (statusCode === 404 || statusCode === 410) {
        console.warn("[Push Notification] Subscription inválida/expirada, sinalizando para remoção");
        return new Response(
          JSON.stringify({
            success: false,
            deleteSubscription: true,
            statusCode,
            error: "Subscription inválida ou expirada",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

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
    console.error("[Push Notification] ========== ERRO GERAL CAPTURADO ==========");
    console.error("[Push Notification] Error name:", error?.name);
    console.error("[Push Notification] Error message:", error?.message);
    console.error("[Push Notification] Error stack:", error?.stack);
    console.error("[Push Notification] Error type:", typeof error);
    console.error("[Push Notification] Error constructor:", error?.constructor?.name);
    
    if (error) {
      try {
        const errorKeys = Object.keys(error);
        console.error("[Push Notification] Error keys:", errorKeys);
        for (const key of errorKeys) {
          try {
            console.error(`[Push Notification] Error.${key}:`, error[key]);
          } catch (e) {
            console.error(`[Push Notification] Error.${key}: [não pode ser serializado]`);
          }
        }
      } catch (e) {
        console.error("[Push Notification] Não foi possível listar keys do erro");
      }
    }
    
    try {
      console.error("[Push Notification] Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (jsonError) {
      console.error("[Push Notification] Erro ao serializar error:", jsonError);
      console.error("[Push Notification] Error toString:", String(error));
    }
    
    // Retornar erro mais detalhado
    const errorMessage = error?.message || error?.toString() || "Erro desconhecido ao enviar notificação";
    const errorDetails: any = {
      error: errorMessage,
      type: error?.name || error?.constructor?.name || "Error",
    };
    
    // Adicionar mais detalhes se disponíveis
    if (error?.statusCode) {
      errorDetails.statusCode = error.statusCode;
    }
    if (error?.body) {
      try {
        errorDetails.body = typeof error.body === 'string' ? error.body : JSON.stringify(error.body);
      } catch (e) {
        errorDetails.body = "[não pode ser serializado]";
      }
    }
    
    // Sempre adicionar stack trace para debug
    if (error?.stack) {
      errorDetails.stack = error.stack;
    }
    if (error?.toString) {
      try {
        errorDetails.details = error.toString();
      } catch (e) {
        errorDetails.details = "[não pode converter para string]";
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
});

