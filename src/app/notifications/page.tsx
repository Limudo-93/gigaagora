"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Check,
} from "lucide-react";
import {
  notificationTemplates,
  type NotificationTemplate,
} from "@/lib/notification-templates";

export default function NotificationsTestPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<
    Array<{
      id: string;
      display_name: string | null;
      email: string | null;
      hasSubscriptions?: boolean;
    }>
  >([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<
    Array<{ type: string; success: boolean; message: string }>
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [checkingSubscriptions, setCheckingSubscriptions] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const loadUsers = useCallback(async () => {
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
        hasSubscriptions: false, // Será verificado depois
      }));

      setUsers(usersList);

      // Verificar subscriptions para cada usuário
      await checkUserSubscriptions(usersList.map((u) => u.id));
    } catch (error: any) {
      console.error("Error loading users:", error);
      alert(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const checkUserSubscriptions = async (userIds: string[]) => {
    setCheckingSubscriptions(true);
    try {
      const subscriptionChecks = await Promise.all(
        userIds.map(async (uid) => {
          const { data, error } = await supabase.rpc(
            "get_user_push_subscriptions",
            {
              p_user_id: uid,
            },
          );
          return {
            userId: uid,
            hasSubscriptions: !error && data && data.length > 0,
            count: data?.length || 0,
          };
        }),
      );

      setUsers((prev) =>
        prev.map((user) => {
          const check = subscriptionChecks.find((c) => c.userId === user.id);
          return {
            ...user,
            hasSubscriptions: check?.hasSubscriptions || false,
          };
        }),
      );
    } catch (error: any) {
      console.error("Error checking subscriptions:", error);
    } finally {
      setCheckingSubscriptions(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const sendNotification = async (
    template: NotificationTemplate,
    targetUserIds: string[],
  ) => {
    if (targetUserIds.length === 0) {
      alert("Selecione pelo menos um usuário");
      return;
    }

    setSending(true);
    const notificationData = template.getData();
    const newResults: Array<{
      type: string;
      success: boolean;
      message: string;
    }> = [];

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
            let errorMsg = result.error || "Erro desconhecido";

            // Evitar duplicação: se details contém a mesma mensagem, não adicionar
            if (result.details && result.details.length > 0) {
              const firstDetail = result.details[0];
              // Se a mensagem de erro já contém o primeiro detail, não adicionar
              if (!errorMsg.includes(firstDetail) && firstDetail !== errorMsg) {
                errorMsg = `${errorMsg}. Detalhes: ${result.details.join(", ")}`;
              }
            }

            newResults.push({
              type: template.key,
              success: false,
              message: `Erro para ${users.find((u) => u.id === targetUserId)?.display_name || targetUserId}: ${errorMsg}`,
            });
          } else {
            newResults.push({
              type: template.key,
              success: true,
              message: `Enviado para ${users.find((u) => u.id === targetUserId)?.display_name || targetUserId} (${result.sent || 1} subscription${(result.sent || 1) > 1 ? "s" : ""} enviada${(result.sent || 1) > 1 ? "s" : ""})`,
            });
          }
        } catch (err: any) {
          newResults.push({
            type: template.key,
            success: false,
            message: `Erro para ${users.find((u) => u.id === targetUserId)?.display_name || targetUserId}: ${err.message}`,
          });
        }
      }

      setResults((prev) => [...newResults, ...prev]);
    } catch (error: any) {
      console.error("Error sending notification:", error);
      setResults((prev) => [
        {
          type: template.key,
          success: false,
          message: `Erro geral: ${error.message}`,
        },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const selectAllUsers = () => {
    setSelectedUserIds(users.map((u) => u.id));
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  const forceRegisterSubscription = (
    targetUserId: string,
    userName: string,
  ) => {
    // Abre uma nova aba com a página de forçar registro
    // O usuário precisa estar logado como targetUserId para funcionar
    const url = `/dashboard/force-push-register?userId=${targetUserId}`;
    window.open(url, "_blank");
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
            Use esta página para testar o envio de notificações push para
            dispositivos móveis
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkUserSubscriptions(users.map((u) => u.id))}
                  disabled={checkingSubscriptions || users.length === 0}
                >
                  {checkingSubscriptions ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Atualizar Status"
                  )}
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
                <p className="text-sm text-gray-500">
                  Nenhum usuário encontrado
                </p>
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
                    } ${!user.hasSubscriptions ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            selectedUserIds.includes(user.id)
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedUserIds.includes(user.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.display_name}
                          </p>
                          {!user.hasSubscriptions && (
                            <p className="text-xs text-orange-600 font-medium mt-0.5">
                              ⚠️ Sem subscriptions ativas
                            </p>
                          )}
                          {user.email && user.hasSubscriptions && (
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!user.hasSubscriptions && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              forceRegisterSubscription(
                                user.id,
                                user.display_name || "Usuário",
                              );
                            }}
                            className="text-xs h-7 px-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            🔔 Forçar
                          </Button>
                        )}
                        {user.hasSubscriptions && (
                          <Badge
                            variant="outline"
                            className="text-xs border-green-500 text-green-700 bg-green-50"
                          >
                            ✓ Ativo
                          </Badge>
                        )}
                        {selectedUserIds.includes(user.id) && (
                          <Badge className="bg-orange-500 text-white">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  <strong>{selectedUserIds.length}</strong> de{" "}
                  <strong>{users.length}</strong> usuários selecionados
                </p>
                {checkingSubscriptions && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verificando subscriptions...
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {users.filter((u) => u.hasSubscriptions).length} usuário(s) com
                subscriptions ativas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates de Notificação */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tipos de Notificações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTemplates.map((template) => (
              <Card
                key={template.key}
                className="hover:shadow-lg transition-shadow"
              >
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
                    className="w-full bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] hover:from-[#ff6b4a] hover:to-[#2aa6a1] text-white"
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
                      <p
                        className={`text-sm font-medium ${
                          result.success ? "text-green-900" : "text-red-900"
                        }`}
                      >
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
                <h3 className="font-semibold text-orange-900 mb-2">
                  Por que estou vendo &quot;Sem subscriptions ativas&quot;?
                </h3>
                <p className="text-sm text-orange-800 mb-3">
                  Para receber notificações push, os usuários precisam:
                </p>
                <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside mb-3">
                  <li>Estar logados na plataforma no navegador/dispositivo</li>
                  <li>Ter autorizado as notificações no navegador</li>
                  <li>
                    Ter visitado o dashboard (onde o PushNotificationManager
                    registra automaticamente)
                  </li>
                  <li>
                    Estar usando um navegador/dispositivo compatível com PWA
                  </li>
                </ul>
                <p className="text-sm text-orange-800 font-medium">
                  💡 <strong>Dica:</strong> Os usuários precisam acessar o
                  dashboard pelo menos uma vez para que suas subscriptions sejam
                  registradas automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
