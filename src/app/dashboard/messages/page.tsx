"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Input component não existe, usando input HTML
import { Send, MessageSquare, Search, ArrowLeft, Menu } from "lucide-react";
// Usando formatação de data simples
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    display_name: string | null;
    photo_url: string | null;
  };
};

type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  invite_id: string | null;
  gig_id: string | null;
  last_message_at: string;
  created_at: string;
  other_user: {
    id: string;
    display_name: string | null;
    photo_url: string | null;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count?: number;
  gig?: {
    title: string | null;
  };
};

export default function MessagesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showChat, setShowChat] = useState(false); // Para mobile: controla se mostra chat ou lista
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Busca o usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Carrega conversas
  const loadConversations = async () => {
    if (!userId) return;

    try {
      // Busca conversas onde o usuário participa
      const { data: convs, error } = await supabase
        .from("conversations")
        .select(`
          *,
          gigs(title)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Para cada conversa, busca informações do outro usuário e última mensagem
      const conversationsWithDetails = await Promise.all(
        (convs || []).map(async (conv: any) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

          // Busca perfil do outro usuário
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, photo_url")
            .eq("user_id", otherUserId)
            .maybeSingle();

          // Busca última mensagem
          const { data: lastMsgData } = await supabase
            .from("messages")
            .select("content, sender_id, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          const lastMsg = lastMsgData || null;

          // Conta mensagens não lidas
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("receiver_id", userId)
            .is("read_at", null);

          return {
            ...conv,
            other_user: {
              id: otherUserId,
              display_name: profile?.display_name || "Usuário",
              photo_url: profile?.photo_url || null,
            },
            last_message: lastMsg,
            unread_count: unreadCount || 0,
            gig: Array.isArray(conv.gigs) && conv.gigs.length > 0 ? conv.gigs[0] : undefined,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega mensagens de uma conversa
  const loadMessages = async (conversationId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(msgs || []);

      // Marca mensagens como lidas
      if (userId) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("receiver_id", userId)
          .is("read_at", null);
      }

      // Scroll para o final
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  // Envia mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId || sending) return;

    const receiverId =
      selectedConversation.user1_id === userId
        ? selectedConversation.user2_id
        : selectedConversation.user1_id;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: userId,
          receiver_id: receiverId,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Scroll para o final
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Atualiza lista de conversas
      loadConversations();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  // Cria ou obtém conversa baseada em invite
  const getOrCreateConversation = async (otherUserId: string, inviteId?: string, gigId?: string) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        p_user1_id: userId,
        p_user2_id: otherUserId,
        p_invite_id: inviteId || null,
        p_gig_id: gigId || null,
      });

      if (error) throw error;

      // Recarrega conversas e seleciona a nova
      await loadConversations();
      const conv = conversations.find((c) => c.id === data);
      if (conv) {
        setSelectedConversation(conv);
        loadMessages(conv.id);
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
    }
  };

  // Carrega conversas quando userId estiver disponível
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  // Ajusta showChat quando a tela é redimensionada ou conversa muda
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Em desktop (lg), sempre mostra chat se houver conversa selecionada
        if (selectedConversation) {
          setShowChat(true);
        }
      } else {
        // Em mobile, mantém o estado atual (não força mudança)
      }
    };

    // Se é desktop e tem conversa selecionada, mostra chat
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && selectedConversation) {
      setShowChat(true);
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Executa uma vez ao montar

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedConversation]);

  // Subscribe para novas mensagens em tempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setMessages((prev) => [...prev, newMessage]);
            // Marca como lida
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }
          // Recarrega conversas para atualizar última mensagem
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedConversation]);

  // Scroll automático quando novas mensagens chegam
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Filtra conversas por busca
  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      conv.other_user.display_name?.toLowerCase().includes(term) ||
      conv.last_message?.content.toLowerCase().includes(term) ||
      conv.gig?.title?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout fullWidth>
      <div className="flex h-[calc(100vh-120px)] sm:h-[calc(100vh-200px)] gap-0 sm:gap-4 relative overflow-hidden">
        {/* Lista de Conversas - Oculto em mobile quando chat está aberto */}
        <div className={`${
          showChat ? 'hidden' : 'flex'
        } lg:flex w-full lg:w-80 flex-col border-r border-border bg-card`}>
          <div className="p-4 border-b border-border sticky top-0 bg-card z-10 backdrop-blur-sm bg-card/95">
            <h1 className="text-xl font-bold text-foreground mb-4">Mensagens</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 md:p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {searchTerm ? "Nenhuma conversa encontrada" : "Suas conversas aparecem aqui"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {searchTerm 
                      ? "Tente ajustar os termos de busca."
                      : "🎶 Assim que um contratante entrar em contato sobre uma gig, você será notificado e a conversa aparecerá aqui."}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    loadMessages(conv.id);
                    // Em mobile, mostra o chat
                    if (window.innerWidth < 1024) {
                      setShowChat(true);
                    }
                  }}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 active:bg-muted transition-all ${
                    selectedConversation?.id === conv.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={conv.other_user.photo_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conv.other_user.display_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conv.other_user.display_name}
                        </p>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {formatTimeAgo(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.gig && (
                        <p className="text-xs text-muted-foreground mb-1 truncate">{conv.gig.title}</p>
                      )}
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message.sender_id === userId ? "Você: " : ""}
                          {conv.last_message.content}
                        </p>
                      )}
                      {conv.unread_count && conv.unread_count > 0 && (
                        <div className="mt-1 flex justify-end">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">
                            {conv.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área de Chat - Oculto em mobile quando lista está visível */}
        <div className={`${
          !showChat && selectedConversation ? 'hidden lg:flex' : 'flex'
        } flex-1 flex-col bg-card min-w-0`}>
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-border bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/95">
                <div className="flex items-center gap-3">
                  {/* Botão voltar - apenas em mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowChat(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={selectedConversation.other_user.photo_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedConversation.other_user.display_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {selectedConversation.other_user.display_name}
                    </p>
                    {selectedConversation.gig && (
                      <p className="text-xs text-muted-foreground truncate">{selectedConversation.gig.title}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
              >
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTimeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-border bg-card sticky bottom-0 backdrop-blur-sm bg-card/95">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
                    disabled={sending}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="shrink-0 h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center p-6 max-w-sm mx-auto">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escolha uma conversa na lista ao lado para começar a trocar mensagens
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

