"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  User, 
  Send,
  AlertCircle,
  Music,
  MessageSquare,
  Calendar,
  Star,
  AlertTriangle,
  Clock,
  Check,
  Mail
} from "lucide-react";

type NotificationTemplate = {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  getData: () => any;
};

export default function NotificationsTestPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; display_name: string | null; email: string | null }>>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Array<{ type: string; success: boolean; message: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .limit(100);

      if (error) throw error;

      const usersList = (data || []).map((profile: any) => ({
        id: profile.user_id,
        display_name: profile.display_name || "Usuário sem nome",
        email: null, // Email não está disponível diretamente via RLS
      }));

      setUsers(usersList);
    } catch (error: any) {
      console.error("Error loading users:", error);
      alert(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const notificationTemplates: NotificationTemplate[] = [
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

  const sendNotification = async (template: NotificationTemplate, targetUserIds: string[]) => {
    if (targetUserIds.length === 0) {
      alert("Selecione pelo menos um usuário");
      return;
    }

    setSending(true);
    const notificationData = template.getData();
    const newResults: Array<{ type: string; success: boolean; message: string }> = [];

    try {
      for (const targetUserId of targetUserIds) {
        try {
          // Usar server action para enviar notificação
          const response = await fetch("/api/notifications/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: targetUserId,
              notification: notificationData,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            newResults.push({
              type: template.key,
              success: false,
              message: `Erro para ${users.find(u => u.id === targetUserId)?.display_name || targetUserId}: ${result.error || "Erro desconhecido"}`,
            });
          } else {
            newResults.push({
              type: template.key,
              success: true,
              message: `Enviado para ${users.find(u => u.id === targetUserId)?.display_name || targetUserId} (${result.sent || 1} subscription${(result.sent || 1) > 1 ? 's' : ''})`,
            });
          }
        } catch (err: any) {
          newResults.push({
            type: template.key,
            success: false,
            message: `Erro para ${users.find(u => u.id === targetUserId)?.display_name || targetUserId}: ${err.message}`,
          });
        }
      }

      setResults(prev => [...newResults, ...prev]);
    } catch (error: any) {
      console.error("Error sending notification:", error);
      setResults(prev => [{
        type: template.key,
        success: false,
        message: `Erro geral: ${error.message}`,
      }, ...prev]);
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUserIds(users.map(u => u.id));
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8 text-orange-500" />
            Teste de Notificações Push
          </h1>
          <p className="text-gray-600">
            Use esta página para testar o envio de notificações push para dispositivos móveis
          </p>
        </div>

        {/* Seleção de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Selecionar Usuários
                </CardTitle>
                <CardDescription className="mt-1">
                  Selecione os usuários que receberão as notificações de teste
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllUsers}
                  disabled={loadingUsers || users.length === 0}
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedUserIds.length === 0}
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-gray-500">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-500">Nenhum usuário encontrado</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsers}
                  className="mt-4"
                >
                  Recarregar
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUserIds.includes(user.id)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          selectedUserIds.includes(user.id)
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        }`}>
                          {selectedUserIds.includes(user.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.display_name}</p>
                          {user.email && (
                            <p className="text-xs text-gray-500">{user.email}</p>
                          )}
                        </div>
                      </div>
                      {selectedUserIds.includes(user.id) && (
                        <Badge className="bg-orange-500 text-white">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>{selectedUserIds.length}</strong> de <strong>{users.length}</strong> usuários selecionados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates de Notificação */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tipos de Notificações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTemplates.map((template) => (
              <Card key={template.key} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-orange-500">{template.icon}</span>
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => sendNotification(template, selectedUserIds)}
                    disabled={sending || selectedUserIds.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar para {selectedUserIds.length} usuário(s)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Resultados dos Testes
              </CardTitle>
              <CardDescription>
                Histórico de envios de notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                      result.success
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        result.success ? "text-green-900" : "text-red-900"
                      }`}>
                        {result.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tipo: {result.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResults([])}
                className="mt-4"
              >
                Limpar Resultados
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Aviso Importante */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Importante</h3>
                <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                  <li>As notificações só funcionam em dispositivos que autorizaram as notificações</li>
                  <li>Os usuários precisam ter o Service Worker registrado</li>
                  <li>Esta página é apenas para testes - não use em produção sem validação adequada</li>
                  <li>Verifique o console do navegador para logs detalhados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

