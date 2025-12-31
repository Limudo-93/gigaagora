"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Search, MessageSquare, Check, CheckCheck } from "lucide-react";
import Link from "next/link";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } else if (diffInDays === 1) {
    return "ontem";
  } else if (diffInDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
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
    id: string;
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
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const loadConversations = async () => {
    if (!userId) return;

    try {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select(`*`)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (convs || []).map(async (conv: any) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, photo_url")
            .eq("user_id", otherUserId)
            .maybeSingle();

          const { data: lastMsgData } = await supabase
            .from("messages")
            .select("content, sender_id, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          const lastMsg = lastMsgData || null;

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

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(msgs || []);

      if (userId) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("receiver_id", userId)
          .is("read_at", null);
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

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

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      loadConversations();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      if (window.innerWidth < 1024) {
        setShowChat(true);
      }
    }
  }, [selectedConversation]);

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
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedConversation]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      conv.other_user.display_name?.toLowerCase().includes(term) ||
      conv.last_message?.content.toLowerCase().includes(term)
    );
  });

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    loadMessages(conv.id);
    if (window.innerWidth < 1024) {
      setShowChat(true);
    }
  }, []);

  return (
    <DashboardLayout fullWidth>
      <div className="flex min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-160px)] flex-col lg:flex-row bg-gray-50 relative overflow-hidden">
        {/* Lista de Conversas - Mobile first */}
        <div className={`${
          showChat ? "hidden" : "flex"
        } lg:flex w-full lg:w-[380px] flex-col bg-white border-b lg:border-b-0 lg:border-r border-gray-200 transition-all duration-300`}>
          {/* Header da Lista */}
          <div className="px-4 pt-5 pb-3 bg-white sticky top-0 z-10 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Mensagens recentes e novas conexoes</p>
          </div>

          {/* Busca */}
          <div className="px-4 py-3 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Carregando conversas...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {searchTerm ? "Nenhuma conversa encontrada" : "Ainda sem conversas"}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {searchTerm 
                      ? "Tente ajustar os termos de busca."
                      : "Quando alguém entrar em contato sobre uma gig, a conversa aparecerá aqui."}
                  </p>
                  {!searchTerm && (
                    <Link href="/dashboard/gigs">
                      <Button className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white">
                        Ver gigs disponíveis
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                      selectedConversation?.id === conv.id ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 ring-2 ring-white">
                          <AvatarImage src={conv.other_user.photo_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white font-semibold text-lg">
                            {conv.other_user.display_name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            {conv.unread_count > 9 ? "9+" : conv.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {conv.other_user.display_name}
                          </p>
                          {conv.last_message && (
                            <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                              {formatTimeAgo(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600 truncate flex-1">
                              {conv.last_message.sender_id === userId ? (
                                <span className="text-gray-400 mr-1">Você: </span>
                              ) : null}
                              <span className="truncate">{conv.last_message.content}</span>
                            </p>
                            {conv.unread_count && conv.unread_count > 0 && (
                              <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat - Estilo WhatsApp */}
        <div className={`${
          !showChat && selectedConversation ? "hidden lg:flex" : "flex"
        } flex-1 flex-col bg-gray-50 min-w-0 relative`}>
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10 border-b border-gray-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-gray-700 hover:bg-gray-100 h-9 w-9"
                  onClick={() => {
                    setShowChat(false);
                    setSelectedConversation(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 ring-2 ring-white/20 shrink-0">
                  <AvatarImage src={selectedConversation.other_user.photo_url || ""} />
                  <AvatarFallback className="bg-white/20 text-white font-semibold">
                    {selectedConversation.other_user.display_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {selectedConversation.other_user.display_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedConversation.gig?.title || "Online"}
                  </p>
                </div>
              </div>

              {/* Mensagens */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-gradient-to-b from-[#f8fafc] via-[#f7f7fb] to-[#f3f4f6]"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-sm">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">
                        Comece a conversar! Envie uma mensagem para iniciar o diálogo.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender_id === userId;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showTime = !prevMsg || 
                      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000; // 5 minutos
                    
                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <div className="flex justify-center my-2">
                            <span className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
                          <div
                            className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm ${
                              isOwn
                                ? "bg-gradient-to-r from-orange-400 to-purple-400 text-white rounded-tr-sm"
                                : "bg-white rounded-tl-sm"
                            }`}
                          >
                            <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                              isOwn ? "text-white" : "text-gray-900"
                            }`}>
                              {msg.content}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className={`text-[10px] ${
                                isOwn ? "text-white/70" : "text-gray-500"
                              }`}>
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isOwn && (
                                <span className="text-[10px]">
                                  {msg.read_at ? (
                                    <CheckCheck className="h-3 w-3 text-white" />
                                  ) : (
                                    <Check className="h-3 w-3 text-white/70" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem - Estilo WhatsApp */}
              <div className="bg-white px-3 py-3 border-t border-gray-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 flex items-center min-h-[44px]">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Digite uma mensagem"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-transparent text-gray-900 text-sm focus:outline-none placeholder:text-gray-500"
                      disabled={sending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6 max-w-sm mx-auto">
                <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Escolha uma conversa na lista para começar a trocar mensagens
                </p>
                <Link href="/dashboard/gigs">
                  <Button className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white">
                    Ver gigs disponíveis
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
