import { supabase } from "@/lib/supabase/client";

/**
 * Cria ou obtém uma conversa entre dois usuários
 * Útil para iniciar conversas a partir de invites aceitos
 */
export async function startConversation(
  otherUserId: string,
  inviteId?: string,
  gigId?: string,
): Promise<string | null> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "messages.ts:7",
      message: "startConversation called",
      data: { otherUserId, inviteId, gigId },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "H3",
    }),
  }).catch(() => {});
  // #endregion
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "messages.ts:15",
        message: "User not authenticated",
        data: {},
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
    throw new Error("Usuário não autenticado");
  }

  try {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "messages.ts:19",
        message: "Calling get_or_create_conversation RPC",
        data: { userId: user.id, otherUserId, inviteId, gigId },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      p_user1_id: user.id,
      p_user2_id: otherUserId,
      p_invite_id: inviteId || null,
      p_gig_id: gigId || null,
    });
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "messages.ts:26",
        message: "RPC result",
        data: {
          conversationId: data,
          error: error?.message,
          errorCode: error?.code,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion

    if (error) throw error;

    return data;
  } catch (error: any) {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/a4f06717-19d9-4960-a0c0-0d4138121c0f", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "messages.ts:32",
        message: "Error creating conversation",
        data: { error: error?.message, stack: error?.stack },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
    console.error("Error creating conversation:", error);
    throw error;
  }
}

/**
 * Envia uma mensagem para uma conversa
 */
export async function sendMessageToConversation(
  conversationId: string,
  receiverId: string,
  content: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    receiver_id: receiverId,
    content: content.trim(),
  });

  if (error) throw error;
}
