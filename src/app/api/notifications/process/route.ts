import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BATCH_LIMIT = 50;
const RETRY_MINUTES = 5;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role env vars not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function processQueue() {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  console.log("[Notifications Process] Starting queue processing at", nowIso);

  // Enfileirar notificações agendadas
  await supabase.rpc("rpc_enqueue_profile_completion");
  await supabase.rpc("rpc_enqueue_daily_reminder");
  await supabase.rpc("rpc_enqueue_invite_expiring");
  await supabase.rpc("rpc_enqueue_gig_reminder");
  await supabase.rpc("rpc_enqueue_rating_pending");

  const { data: queue, error } = await supabase
    .from("push_notification_queue")
    .select("id,user_id,notification_type,payload,attempt_count")
    .in("status", ["pending", "retry"])
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[Notifications Process] Error fetching queue:", error);
    throw error;
  }

  console.log("[Notifications Process] Found", queue?.length || 0, "notifications to process");

  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of queue || []) {
    processed += 1;
    console.log(`[Notifications Process] Processing notification ${item.id} for user ${item.user_id}, type: ${item.notification_type}`);
    
    const { data: subscriptions, error: subError } = await supabase.rpc(
      "get_user_push_subscriptions",
      { p_user_id: item.user_id }
    );

    if (subError) {
      console.error(`[Notifications Process] Error fetching subscriptions for user ${item.user_id}:`, subError);
    }

    // Se não houver subscriptions, marcar como "sent" (ignorada) para não ficar tentando
    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log(`[Notifications Process] No subscriptions found for user ${item.user_id}, skipping (user hasn't enabled push notifications)`);
      await supabase
        .from("push_notification_queue")
        .update({
          status: "sent", // Marcar como "sent" para não ficar tentando
          attempt_count: (item.attempt_count || 0) + 1,
          last_attempt_at: nowIso,
          sent_at: nowIso,
          last_error: subError?.message || "Skipped: User has no active push subscriptions",
        })
        .eq("id", item.id);
      skipped += 1;
      continue;
    }

    console.log(`[Notifications Process] Found ${subscriptions.length} subscription(s) for user ${item.user_id}`);

    let successCount = 0;
    let lastError: string | null = null;

    for (const sub of subscriptions) {
      const subscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        console.log(`[Notifications Process] Sending notification to subscription ${sub.endpoint.substring(0, 50)}...`);
        const { data, error: sendError } = await supabase.functions.invoke("send-push-notification", {
          body: {
            subscription: subscriptionData,
            payload: item.payload,
          },
        });

        if (sendError) {
          console.error(`[Notifications Process] Error sending to subscription:`, sendError);
          console.error(`[Notifications Process] Error type:`, typeof sendError);
          console.error(`[Notifications Process] Error keys:`, Object.keys(sendError || {}));
          
          // Tentar extrair mais detalhes do erro
          const errorDetails: any = {
            message: sendError.message || String(sendError),
            name: sendError.name,
          };
          
          // Tentar extrair body do contexto do erro
          const errorContext = (sendError as any).context;
          if (errorContext) {
            console.error(`[Notifications Process] Error context:`, JSON.stringify(errorContext, null, 2));
            
            // Tentar ler o body da resposta se disponível
            if (errorContext.body !== undefined) {
              try {
                if (typeof errorContext.body === 'string') {
                  errorDetails.body = errorContext.body;
                  // Tentar parsear se for JSON
                  try {
                    const parsed = JSON.parse(errorContext.body);
                    errorDetails.parsedBody = parsed;
                  } catch (e) {
                    // Não é JSON, manter como string
                  }
                } else {
                  errorDetails.body = JSON.stringify(errorContext.body);
                }
              } catch (e) {
                console.error(`[Notifications Process] Error parsing body:`, e);
              }
            }
            
            // Extrair status code se disponível
            if (errorContext.status) {
              errorDetails.statusCode = errorContext.status;
            }
          }

          const parsedBody = errorDetails.parsedBody;
          const parsedStatus = Number(parsedBody?.statusCode ?? errorDetails.statusCode);
          if (parsedBody?.deleteSubscription || parsedStatus === 404 || parsedStatus === 410) {
            console.warn(
              `[Notifications Process] Removing invalid subscription after error (${parsedStatus || "unknown"})`
            );
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
            successCount += 1;
            lastError = `Subscription removida (${parsedStatus || "unknown"})`;
            continue;
          }
          
          // Log completo do erro
          console.error(`[Notifications Process] Full error details:`, JSON.stringify(errorDetails, null, 2));
          
          // Construir mensagem de erro mais informativa
          let errorMessage = errorDetails.message;
          if (errorDetails.parsedBody?.error) {
            errorMessage = errorDetails.parsedBody.error;
            if (errorDetails.parsedBody.details) {
              errorMessage += `: ${errorDetails.parsedBody.details}`;
            }
          } else if (errorDetails.body) {
            errorMessage = errorDetails.body;
          }
          
          throw new Error(errorMessage || "Edge function error");
        }
        
        if (data && typeof data === "object" && (data as any).deleteSubscription) {
          const statusCode = (data as any).statusCode;
          console.warn(
            `[Notifications Process] Deleting invalid subscription for user ${item.user_id} (${statusCode})`
          );
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
          successCount += 1;
          lastError = `Subscription removida (${statusCode || "unknown"})`;
          continue;
        }

        if (data && typeof data === "object" && "error" in data) {
          const errorMsg = (data as any).error || "Edge function error";
          const errorDetails = (data as any).details || (data as any).body || "";
          console.error(`[Notifications Process] Edge function returned error:`, errorMsg);
          console.error(`[Notifications Process] Error details:`, errorDetails);
          throw new Error(errorDetails ? `${errorMsg}: ${errorDetails}` : errorMsg);
        }

        console.log(`[Notifications Process] Successfully sent notification to subscription`);
        successCount += 1;
      } catch (err: any) {
        // Capturar mais detalhes do erro
        let errorMsg = err?.message || String(err);
        
        // Log completo do erro para debug
        console.error(`[Notifications Process] Catch block - Error type:`, typeof err);
        console.error(`[Notifications Process] Catch block - Error keys:`, Object.keys(err || {}));
        
        // Tentar serializar o erro completo
        try {
          const errorString = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
          console.error(`[Notifications Process] Catch block - Full error:`, errorString);
        } catch (e) {
          console.error(`[Notifications Process] Catch block - Error (string):`, String(err));
        }
        
        // Se o erro tiver response, tentar extrair o body
        if (err?.response) {
          try {
            const responseText = await err.response.text();
            if (responseText) {
              console.error(`[Notifications Process] Response text:`, responseText);
              try {
                const errorJson = JSON.parse(responseText);
                errorMsg = errorJson.error || errorJson.message || errorMsg;
                if (errorJson.details) {
                  errorMsg += `: ${errorJson.details}`;
                }
                console.error(`[Notifications Process] Parsed error JSON:`, JSON.stringify(errorJson, null, 2));
              } catch (e) {
                errorMsg += ` (Response: ${responseText.substring(0, 200)})`;
              }
            }
          } catch (e) {
            console.error(`[Notifications Process] Error reading response:`, e);
          }
        }
        
        console.error(`[Notifications Process] Failed to send notification:`, errorMsg);
        console.error(`[Notifications Process] Error stack:`, err?.stack);
        lastError = errorMsg;
      }
    }

    if (successCount > 0) {
      await supabase
        .from("push_notification_queue")
        .update({
          status: "sent",
          attempt_count: (item.attempt_count || 0) + 1,
          last_attempt_at: nowIso,
          sent_at: nowIso,
          last_error: lastError,
        })
        .eq("id", item.id);
      sent += 1;
    } else {
      await supabase
        .from("push_notification_queue")
        .update({
          status: "retry",
          attempt_count: (item.attempt_count || 0) + 1,
          last_attempt_at: nowIso,
          next_attempt_at: new Date(Date.now() + RETRY_MINUTES * 60 * 1000).toISOString(),
          last_error: lastError || "Unknown error",
        })
        .eq("id", item.id);
      failed += 1;
    }
  }

  return { processed, sent, failed, skipped };
}

async function handler(request: Request) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  const secret = process.env.NOTIFICATIONS_CRON_SECRET;
  const auth = request.headers.get("authorization");

  // Permitir acesso se:
  // 1. É uma chamada de cron da Vercel (x-vercel-cron header)
  // 2. Tem o secret correto no Authorization header
  // 3. Não tem secret configurado (modo desenvolvimento)
  const isAuthorized = 
    isCron || 
    (secret && auth === `Bearer ${secret}`) ||
    !secret;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processQueue();
    console.log("[Notifications Process] Result:", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("[Notifications Process] Error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Process failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
