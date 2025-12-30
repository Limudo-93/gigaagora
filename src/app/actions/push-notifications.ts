"use server";

import { createClient } from "@/lib/supabase/server";

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  vibrate?: number[];
  url?: string;
}

/**
 * Envia notificação push para um usuário
 * Esta função deve ser chamada do servidor (Edge Functions, cron jobs, etc)
 */
export async function sendPushNotification(
  userId: string,
  notification: NotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Buscar todas as subscriptions do usuário
    const { data: subscriptions, error } = await supabase.rpc("get_user_push_subscriptions", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching push subscriptions:", error);
      return { success: false, error: error.message };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { success: false, error: "No subscriptions found" };
    }

    // Preparar payload da notificação
    const payload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/logo.png",
      badge: notification.badge || "/logo.png",
      tag: notification.tag || "default",
      requireInteraction: notification.requireInteraction || false,
      data: {
        ...notification.data,
        url: notification.url || "/dashboard",
      },
      actions: notification.actions || [],
      vibrate: notification.vibrate || [200, 100, 200],
    };

    // Enviar para cada subscription
    // NOTA: Para produção, isso deve ser feito via Edge Function ou serviço externo
    // que tenha acesso às chaves VAPID privadas
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        // Este código seria executado em uma Edge Function ou serviço externo
        // Por enquanto, apenas logamos que a notificação seria enviada
        console.log(`[Push Notification] Would send to endpoint: ${sub.endpoint.substring(0, 50)}...`);
        
        // Em produção, você chamaria uma Edge Function do Supabase ou serviço externo
        // que tenha as chaves VAPID privadas para enviar as notificações
        // Exemplo:
        // await supabase.functions.invoke('send-push-notification', {
        //   body: { subscription: sub, payload }
        // });
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error("Some notifications failed to send:", failed);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Tipos de notificações pré-configuradas
 */
export const NotificationTemplates = {
  newInvite: (gigTitle: string, contractorName: string): NotificationData => ({
    title: "🎵 Novo convite recebido!",
    body: `${contractorName} te convidou para: ${gigTitle}`,
    tag: "new_invite",
    requireInteraction: true,
    data: { type: "new_invite", url: "/dashboard" },
    vibrate: [200, 100, 200],
    actions: [
      { action: "view", title: "Ver convite", icon: "/logo.png" },
    ],
  }),

  inviteAccepted: (gigTitle: string, musicianName: string): NotificationData => ({
    title: "✅ Convite aceito!",
    body: `${musicianName} aceitou o convite para: ${gigTitle}`,
    tag: "invite_accepted",
    data: { type: "invite_accepted", url: "/dashboard/gigs" },
    vibrate: [200, 100, 200],
  }),

  inviteDeclined: (gigTitle: string, musicianName: string): NotificationData => ({
    title: "❌ Convite recusado",
    body: `${musicianName} recusou o convite para: ${gigTitle}`,
    tag: "invite_declined",
    data: { type: "invite_declined", url: "/dashboard/gigs" },
  }),

  gigConfirmed: (gigTitle: string): NotificationData => ({
    title: "🎉 Gig confirmada!",
    body: `Sua gig "${gigTitle}" foi confirmada`,
    tag: "gig_confirmed",
    requireInteraction: true,
    data: { type: "gig_confirmed", url: "/dashboard" },
    vibrate: [200, 100, 200, 100, 200],
  }),

  musicianChosen: (gigTitle: string, musicianName: string): NotificationData => ({
    title: "⭐ Músico escolhido!",
    body: `Você foi escolhido para: ${gigTitle}`,
    tag: "musician_chosen",
    requireInteraction: true,
    data: { type: "musician_chosen", url: "/dashboard" },
    vibrate: [200, 100, 200, 100, 200],
  }),

  gigCancelled: (gigTitle: string, reason?: string): NotificationData => ({
    title: "⚠️ Gig cancelada",
    body: reason 
      ? `A gig "${gigTitle}" foi cancelada: ${reason}`
      : `A gig "${gigTitle}" foi cancelada`,
    tag: "gig_cancelled",
    requireInteraction: true,
    data: { type: "gig_cancelled", url: "/dashboard" },
    vibrate: [300, 100, 300],
  }),

  newMessage: (senderName: string, messagePreview: string, conversationId: string): NotificationData => ({
    title: `💬 Nova mensagem de ${senderName}`,
    body: messagePreview.substring(0, 100),
    tag: `message_${conversationId}`,
    requireInteraction: false,
    data: { 
      type: "new_message", 
      url: `/dashboard/messages?conversation=${conversationId}`,
      conversationId 
    },
    vibrate: [100, 50, 100],
  }),

  gigReminder: (gigTitle: string, timeUntil: string): NotificationData => ({
    title: "⏰ Lembrete de gig",
    body: `"${gigTitle}" está chegando! ${timeUntil}`,
    tag: "gig_reminder",
    requireInteraction: true,
    data: { type: "gig_reminder", url: "/dashboard" },
    vibrate: [200, 100, 200],
  }),

  inviteExpiring: (gigTitle: string, hoursLeft: number): NotificationData => ({
    title: "⏱️ Convite expirando!",
    body: `Você tem apenas ${hoursLeft}h para responder ao convite de: ${gigTitle}`,
    tag: "invite_expiring",
    requireInteraction: true,
    data: { type: "invite_expiring", url: "/dashboard" },
    vibrate: [300, 100, 300, 100, 300],
  }),

  ratingPending: (gigTitle: string): NotificationData => ({
    title: "⭐ Avalie sua experiência",
    body: `Que tal avaliar a gig "${gigTitle}"?`,
    tag: "rating_pending",
    requireInteraction: false,
    data: { type: "rating_pending", url: "/dashboard/avaliacoes" },
    vibrate: [200, 100, 200],
  }),

  profileCompletion: (completionPercent: number): NotificationData => ({
    title: "📝 Complete seu perfil",
    body: `Seu perfil está ${completionPercent}% completo. Complete para receber mais convites!`,
    tag: "profile_completion",
    requireInteraction: false,
    data: { type: "profile_completion", url: "/dashboard/perfil/edit" },
  }),

  dailyReminder: (pendingInvites: number, upcomingGigs: number): NotificationData => ({
    title: "🌅 Olá! Você tem novidades",
    body: `${pendingInvites} convite${pendingInvites !== 1 ? 's' : ''} pendente${pendingInvites !== 1 ? 's' : ''} • ${upcomingGigs} gig${upcomingGigs !== 1 ? 's' : ''} confirmada${upcomingGigs !== 1 ? 's' : ''}`,
    tag: "daily_reminder",
    requireInteraction: false,
    data: { type: "daily_reminder", url: "/dashboard" },
    vibrate: [200, 100, 200],
  }),
};

