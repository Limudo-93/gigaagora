"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Search, MessageSquare, Calendar, MapPin, Music, DollarSign, Sparkles } from "lucide-react";
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
    start_time: string | null;
    location_name: string | null;
    city: string | null;
    cache?: number | null;
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
        .select(`
          *,
          gigs(id, title, start_time, location_name, city)
        `)
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

          // Buscar cache da gig se existir
          let gigCache = null;
          if (conv.gig_id) {
            const { data: gigRoles } = await supabase
              .from("gig_roles")
              .select("cache")
              .eq("gig_id", conv.gig_id)
              .not("cache", "is", null)
              .limit(1)
              .maybeSingle();
            gigCache = gigRoles?.cache || null;
          }

          return {
            ...conv,
            other_user: {
              id: otherUserId,
              display_name: profile?.display_name || "Usuário",
              photo_url: profile?.photo_url || null,
            },
            last_message: lastMsg,
            unread_count: unreadCount || 0,
            gig: conv.gigs ? {
              id: conv.gigs.id,
              title: conv.gigs.title,
              start_time: conv.gigs.start_time,
              location_name: conv.gigs.location_name,
              city: conv.gigs.city,
              cache: gigCache,
            } : undefined,
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
    const handleResize = () => {
      if (window.innerWidth >= 1024 && selectedConversation) {
        setShowChat(true);
      }
    };

    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && selectedConversation) {
      setShowChat(true);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      conv.last_message?.content.toLowerCase().includes(term) ||
      conv.gig?.title?.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <DashboardLayout fullWidth>
      <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] gap-0 lg:gap-4 relative overflow-hidden bg-gray-50">
        {/* Lista de Conversas */}
        <div className={`${
          showChat ? 'hidden' : 'flex'
        } lg:flex w-full lg:w-96 flex-col bg-white border-r border-gray-200`}>
          {/* Header com busca */}
          <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
              {selectedConversation && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => {
                    setShowChat(false);
                    setSelectedConversation(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
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
                      : "Quando um contratante entrar em contato sobre uma gig, você será notificado e a conversa aparecerá aqui."}
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
                    onClick={() => {
                      setSelectedConversation(conv);
                      loadMessages(conv.id);
                      if (window.innerWidth < 1024) {
                        setShowChat(true);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 active:bg-gray-100 ${
                      selectedConversation?.id === conv.id ? "bg-orange-50 border-l-4 border-l-orange-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-white">
                          <AvatarImage src={conv.other_user.photo_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white font-semibold">
                            {conv.other_user.display_name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {conv.other_user.display_name}
                          </p>
                          {conv.last_message && (
                            <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                              {formatTimeAgo(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.gig && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Music className="h-3 w-3 text-purple-500 shrink-0" />
                            <p className="text-xs font-medium text-purple-600 truncate">{conv.gig.title}</p>
                          </div>
                        )}
                        {conv.last_message && (
                          <p className="text-sm text-gray-600 truncate">
                            {conv.last_message.sender_id === userId ? (
                              <span className="text-gray-400">Você: </span>
                            ) : null}
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        <div className={`${
          !showChat && selectedConversation ? 'hidden lg:flex' : 'flex'
        } flex-1 flex-col bg-white min-w-0`}>
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowChat(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarImage src={selectedConversation.other_user.photo_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white font-semibold">
                      {selectedConversation.other_user.display_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {selectedConversation.other_user.display_name}
                    </p>
                    {selectedConversation.gig && (
                      <p className="text-xs text-purple-600 font-medium truncate flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {selectedConversation.gig.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card da Gig (se houver) */}
                {selectedConversation.gig && (
                  <Card className="mt-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            <h3 className="text-sm font-bold text-gray-900">Gig em destaque</h3>
                          </div>
                          <p className="text-base font-semibold text-gray-900 mb-3">
                            {selectedConversation.gig.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            {selectedConversation.gig.start_time && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(selectedConversation.gig.start_time)}</span>
                              </div>
                            )}
                            {(selectedConversation.gig.location_name || selectedConversation.gig.city) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{selectedConversation.gig.location_name || selectedConversation.gig.city}</span>
                              </div>
                            )}
                            {selectedConversation.gig.cache && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="font-bold text-green-600">{formatCurrency(selectedConversation.gig.cache)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedConversation.gig.id && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/gigs/${selectedConversation.gig.id}`)}
                            className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shrink-0"
                          >
                            Ver gig
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Mensagens */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-sm">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">
                        Comece a conversar! Envie uma mensagem para iniciar o diálogo.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isOwn
                              ? "bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-md"
                              : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          <p
                            className={`text-xs mt-1.5 ${
                              isOwn ? "text-white/70" : "text-gray-500"
                            }`}
                          >
                            {formatTimeAgo(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 transition-all"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-11 w-11 shrink-0 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shadow-md disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6 max-w-sm mx-auto">
                <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Escolha uma conversa na lista ao lado para começar a trocar mensagens
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
