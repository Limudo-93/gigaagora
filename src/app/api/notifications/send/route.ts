import { NextRequest, NextResponse } from "next/server";
import {
  createClient as createSupabaseAdmin,
  type SupabaseClient,
} from "@supabase/supabase-js";
import webPush from "web-push";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type VapidConfig = {
  publicKey: string | null;
  privateKey: string | null;
  subject: string;
};

function normalizeEnvValue(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted
    .replace(/\\r|\\n/g, "")
    .replace(/[\u0000-\u001F\u007F\uFEFF]/g, "")
    .trim();
}

function sanitizeVapidKey(value?: string) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;
  return normalized.replace(/\\r|\\n/g, "").replace(/[^A-Za-z0-9_-]/g, "");
}

function sanitizeVapidSubject(value?: string) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;
  return normalized;
}

function isValidVapidSubject(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "mailto:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getVapidConfig(): VapidConfig {
  const publicKey = sanitizeVapidKey(
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  );
  const privateKey = sanitizeVapidKey(process.env.VAPID_PRIVATE_KEY || "");
  const subject = sanitizeVapidSubject(process.env.VAPID_SUBJECT);
  const fallbackSubject = "mailto:admin@chamaomusico.com";
  const safeSubject =
    subject && isValidVapidSubject(subject) ? subject : fallbackSubject;

  return {
    publicKey,
    privateKey,
    subject: safeSubject,
  };
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role env vars not configured");
  }

  return createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function sendWithWebPush(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payload: Record<string, unknown>,
  supabaseAdmin: SupabaseClient,
) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, via: "web-push" };
  } catch (pushError: any) {
    const statusCode = Number(pushError?.statusCode);
    if (statusCode === 404 || statusCode === 410) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);
      return { deleted: true, via: "web-push" };
    }

    const errorMessage =
      pushError?.message || "Erro desconhecido ao enviar notificação";
    throw new Error(errorMessage);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const supabaseAdmin = getSupabaseAdmin();
    const vapidConfig = getVapidConfig();
    const canUseWebPush = Boolean(
      vapidConfig.publicKey && vapidConfig.privateKey,
    );

    if (canUseWebPush) {
      webPush.setVapidDetails(
        vapidConfig.subject,
        vapidConfig.publicKey as string,
        vapidConfig.privateKey as string,
      );
    }

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { userId, notification } = body;

    if (!userId || !notification) {
      return NextResponse.json(
        { success: false, error: "userId e notification são obrigatórios" },
        { status: 400 },
      );
    }

    // Buscar subscriptions do usuário
    const { data: subscriptions, error: subError } = await supabase.rpc(
      "get_user_push_subscriptions",
      {
        p_user_id: userId,
      },
    );

    if (subError) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao buscar subscriptions: ${subError.message}`,
        },
        { status: 500 },
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

          // Invocar Edge Function com autenticação
          // O supabase client já tem o token de autenticação do usuário logado
          const { data, error } = await supabase.functions.invoke(
            "send-push-notification",
            {
              body: {
                subscription: subscriptionData,
                payload: payload,
              },
            },
          );

          if (error) {
            console.error(
              `[Send Notification] Error for endpoint ${sub.endpoint.substring(0, 50)}...:`,
              error,
            );
            console.error(`[Send Notification] Response data:`, data);
            const errorContext = (error as any).context;
            let parsedBody: any = null;
            let parsedStatus: number | null = null;

            if (errorContext?.body && typeof errorContext.body === "string") {
              try {
                parsedBody = JSON.parse(errorContext.body);
                parsedStatus = Number(parsedBody?.statusCode);
              } catch (e) {
                // ignore parse error
              }
            }

            if (
              parsedBody?.deleteSubscription ||
              parsedStatus === 404 ||
              parsedStatus === 410
            ) {
              console.warn(
                `[Send Notification] Removing invalid subscription (${parsedStatus || "unknown"})`,
              );
              await supabaseAdmin
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", sub.endpoint);
              return { deleted: true };
            }

            // Extrair mensagem de erro limpa
            if (canUseWebPush) {
              console.warn(
                "[Send Notification] Edge Function falhou, tentando fallback com web-push",
              );
              return await sendWithWebPush(
                subscriptionData,
                payload,
                supabaseAdmin,
              );
            }

            const errorMsg =
              error.message ||
              (typeof error === "string" ? error : JSON.stringify(error));
            throw new Error(
              `${errorMsg}. Edge Function falhou e não há VAPID keys no servidor para fallback.`,
            );
          }

          if (
            data &&
            typeof data === "object" &&
            (data as any).deleteSubscription
          ) {
            const statusCode = (data as any).statusCode;
            console.warn(
              `[Send Notification] Removing invalid subscription (${statusCode || "unknown"})`,
            );
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
            return { deleted: true };
          }

          // Verificar se data contém um erro (quando a função retorna erro mas invoke não marca como error)
          if (data && typeof data === "object" && "error" in data) {
            const errorMessage =
              (data as any).error ||
              (data as any).message ||
              "Erro desconhecido da Edge Function";
            console.error(
              `[Send Notification] Edge Function returned error in data:`,
              errorMessage,
            );
            if (canUseWebPush) {
              console.warn(
                "[Send Notification] Edge Function retornou erro, tentando fallback com web-push",
              );
              return await sendWithWebPush(
                subscriptionData,
                payload,
                supabaseAdmin,
              );
            }
            throw new Error(
              `${errorMessage}. Edge Function falhou e não há VAPID keys no servidor para fallback.`,
            );
          }

          return data;
        } catch (err: any) {
          console.error(`[Send Notification] Failed for subscription:`, err);
          throw err;
        }
      }),
    );

    const failed = sendResults.filter((r) => r.status === "rejected");
    const successful = sendResults.filter((r) => r.status === "fulfilled");

    // Log detalhado dos erros
    if (failed.length > 0) {
      console.error(
        `[Send Notification] ${failed.length} tentativas falharam:`,
        failed.map((r) => (r.status === "rejected" ? r.reason : null)),
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
      if (
        firstError.includes("Function not found") ||
        firstError.includes("404")
      ) {
        return NextResponse.json({
          success: false,
          error:
            "Edge Function 'send-push-notification' não está deployada. Veja DEPLOY_EDGE_FUNCTION.md para instruções.",
          details: errorMessages,
        });
      }

      // Usar apenas a primeira mensagem de erro (sem duplicação)
      const mainError =
        errorMessages[0] || "Erro desconhecido. Verifique os logs do servidor.";

      return NextResponse.json({
        success: false,
        error: mainError,
        details: errorMessages.length > 1 ? errorMessages.slice(1) : undefined, // Só incluir details se houver mais de uma mensagem
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
      { status: 500 },
    );
  }
}
