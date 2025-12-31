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

  await supabase.rpc("rpc_enqueue_profile_completion");
  await supabase.rpc("rpc_enqueue_daily_reminder");

  const { data: queue, error } = await supabase
    .from("push_notification_queue")
    .select("id,user_id,notification_type,payload,attempt_count")
    .in("status", ["pending", "retry"])
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    throw error;
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const item of queue || []) {
    processed += 1;
    const { data: subscriptions, error: subError } = await supabase.rpc(
      "get_user_push_subscriptions",
      { p_user_id: item.user_id }
    );

    if (subError || !subscriptions || subscriptions.length === 0) {
      await supabase
        .from("push_notification_queue")
        .update({
          status: "retry",
          attempt_count: (item.attempt_count || 0) + 1,
          last_attempt_at: nowIso,
          next_attempt_at: new Date(Date.now() + RETRY_MINUTES * 60 * 1000).toISOString(),
          last_error: subError?.message || "No subscriptions",
        })
        .eq("id", item.id);
      failed += 1;
      continue;
    }

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
        const { data, error: sendError } = await supabase.functions.invoke("send-push-notification", {
          body: {
            subscription: subscriptionData,
            payload: item.payload,
          },
        });

        if (sendError) {
          throw sendError;
        }
        if (data && typeof data === "object" && "error" in data) {
          throw new Error((data as any).error || "Edge function error");
        }

        successCount += 1;
      } catch (err: any) {
        lastError = err?.message || String(err);
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

  return { processed, sent, failed };
}

async function handler(request: Request) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  const secret = process.env.NOTIFICATIONS_CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && !isCron && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processQueue();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
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
