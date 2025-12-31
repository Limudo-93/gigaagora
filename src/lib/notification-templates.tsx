import type React from "react";
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Music, 
  MessageSquare, 
  Calendar, 
  Star, 
  AlertTriangle, 
  Clock, 
} from "lucide-react";

export type NotificationTemplate = {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  getData: () => any;
};

export const notificationTemplates: NotificationTemplate[] = [
  {
    key: "newInvite",
    name: "Novo Convite",
    description: "Notificação quando um novo convite é recebido",
    icon: <Music className="h-4 w-4" />,
    getData: () => ({
      title: "🎵 Novo convite recebido!",
      body: "João Silva te convidou para: Show no Bar do Centro",
      tag: "new_invite",
      requireInteraction: true,
      data: { type: "new_invite", url: "/dashboard" },
      vibrate: [200, 100, 200],
    }),
  },
  {
    key: "inviteAccepted",
    name: "Convite Aceito",
    description: "Notificação quando um músico aceita o convite",
    icon: <CheckCircle2 className="h-4 w-4" />,
    getData: () => ({
      title: "✅ Convite aceito!",
      body: "Maria Santos aceitou o convite para: Show no Bar do Centro",
      tag: "invite_accepted",
      data: { type: "invite_accepted", url: "/dashboard/gigs" },
      vibrate: [200, 100, 200],
    }),
  },
  {
    key: "inviteDeclined",
    name: "Convite Recusado",
    description: "Notificação quando um músico recusa o convite",
    icon: <XCircle className="h-4 w-4" />,
    getData: () => ({
      title: "❌ Convite recusado",
      body: "Pedro Costa recusou o convite para: Show no Bar do Centro",
      tag: "invite_declined",
      data: { type: "invite_declined", url: "/dashboard/gigs" },
    }),
  },
  {
    key: "gigConfirmed",
    name: "Gig Confirmada",
    description: "Notificação quando uma gig é confirmada",
    icon: <Calendar className="h-4 w-4" />,
    getData: () => ({
      title: "🎉 Gig confirmada!",
      body: 'Sua gig "Show no Bar do Centro" foi confirmada',
      tag: "gig_confirmed",
      requireInteraction: true,
      data: { type: "gig_confirmed", url: "/dashboard" },
      vibrate: [200, 100, 200, 100, 200],
    }),
  },
  {
    key: "musicianChosen",
    name: "Músico Escolhido",
    description: "Notificação quando um músico é escolhido para uma gig",
    icon: <Star className="h-4 w-4" />,
    getData: () => ({
      title: "⭐ Músico escolhido!",
      body: "Você foi escolhido para: Show no Bar do Centro",
      tag: "musician_chosen",
      requireInteraction: true,
      data: { type: "musician_chosen", url: "/dashboard" },
      vibrate: [200, 100, 200, 100, 200],
    }),
  },
  {
    key: "gigCancelled",
    name: "Gig Cancelada",
    description: "Notificação quando uma gig é cancelada",
    icon: <AlertTriangle className="h-4 w-4" />,
    getData: () => ({
      title: "⚠️ Gig cancelada",
      body: 'A gig "Show no Bar do Centro" foi cancelada',
      tag: "gig_cancelled",
      requireInteraction: true,
      data: { type: "gig_cancelled", url: "/dashboard" },
      vibrate: [300, 100, 300],
    }),
  },
  {
    key: "newMessage",
    name: "Nova Mensagem",
    description: "Notificação quando uma nova mensagem é recebida",
    icon: <MessageSquare className="h-4 w-4" />,
    getData: () => ({
      title: "💬 Nova mensagem de João Silva",
      body: "Oi! Você está disponível para essa data?",
      tag: "new_message",
      requireInteraction: false,
      data: { type: "new_message", url: "/dashboard/messages" },
      vibrate: [100, 50, 100],
    }),
  },
  {
    key: "gigReminder",
    name: "Lembrete de Gig",
    description: "Notificação de lembrete de gig próxima",
    icon: <Clock className="h-4 w-4" />,
    getData: () => ({
      title: "⏰ Lembrete de gig",
      body: '"Show no Bar do Centro" está chegando! Em 2 horas',
      tag: "gig_reminder",
      requireInteraction: true,
      data: { type: "gig_reminder", url: "/dashboard" },
      vibrate: [200, 100, 200],
    }),
  },
  {
    key: "dailyReminder",
    name: "Lembrete Diário",
    description: "Notificação diária com resumo de atividades",
    icon: <Bell className="h-4 w-4" />,
    getData: () => ({
      title: "🌅 Olá! Você tem novidades",
      body: "2 convites pendentes • 1 gig confirmada",
      tag: "daily_reminder",
      requireInteraction: false,
      data: { type: "daily_reminder", url: "/dashboard" },
      vibrate: [200, 100, 200],
    }),
  },
];
