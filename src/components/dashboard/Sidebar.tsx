import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DownloadICSButton from "./DownloadICSButton";
import SearchRadiusSlider from "./SearchRadiusSlider";

function formatTimeBR(iso?: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month} - ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (!startTime || !endTime) return "";
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHours = String(start.getHours()).padStart(2, "0");
    const startMinutes = String(start.getMinutes()).padStart(2, "0");
    const endHours = String(end.getHours()).padStart(2, "0");
    const endMinutes = String(end.getMinutes()).padStart(2, "0");
    return `${startHours}:${startMinutes} às ${endHours}:${endMinutes}`;
  } catch {
    return "";
  }
}

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

// Função para obter iniciais (corrigido para TypeScript)
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getScoreBadge(avgRating: number | null | undefined): {
  label: string;
  color: string;
} {
  if (!avgRating)
    return { label: "Sem avaliações", color: "bg-muted text-muted-foreground" };
  if (avgRating >= 4.5)
    return { label: "Excelente", color: "bg-green-500 text-white" };
  if (avgRating >= 4.0)
    return { label: "Muito Bom", color: "bg-blue-500 text-white" };
  if (avgRating >= 3.5)
    return { label: "Bom", color: "bg-yellow-500 text-white" };
  return { label: "Regular", color: "bg-primary text-primary-foreground" };
}

export default async function Sidebar() {
  let supabase: any;
  let user: any;

  try {
    supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;
    user = authUser;
  } catch (error: any) {
    // Durante o build estático, as variáveis de ambiente podem não estar disponíveis
    // Retornar null para evitar erros durante o build
    if (error?.message?.includes("Missing Supabase environment variables")) {
      return null;
    }
    // Se for outro erro, também retornar null para não quebrar o build
    return null;
  }

  // Buscar próximo gig confirmado
  let nextGig: any = null;
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "rpc_list_upcoming_confirmed_gigs",
    );

    if (rpcError) {
      // Fallback: busca direta
      const { data: directData } = await supabase
        .from("confirmations")
        .select(
          `
          invites!inner(
            musician_id,
            gigs!inner(
              id,
              title,
              start_time,
              end_time
            )
          )
        `,
        )
        .eq("invites.musician_id", user.id)
        .gte("invites.gigs.start_time", new Date().toISOString())
        .order("invites.gigs.start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (directData) {
        // Tratar invites como array ou objeto único
        const invites = Array.isArray(directData.invites)
          ? directData.invites[0]
          : directData.invites;
        // Tratar gigs como array ou objeto único
        const gigs = invites?.gigs
          ? Array.isArray(invites.gigs)
            ? invites.gigs[0]
            : invites.gigs
          : null;

        if (gigs) {
          nextGig = {
            title: gigs.title || "Show",
            start_time: gigs.start_time,
            end_time: gigs.end_time,
          };
        }
      }
    } else if (rpcData && rpcData.length > 0) {
      const firstGig = rpcData[0];
      nextGig = {
        title: firstGig.gig_title || "Show",
        start_time: firstGig.start_time,
        end_time: firstGig.end_time,
      };
    }
  } catch (error) {
    console.error("Error fetching next gig:", error);
  }

  // Buscar conversas recentes
  let recentConversation: any = null;
  try {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, user1_id, user2_id, last_message_at")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversations) {
      const otherUserId =
        conversations.user1_id === user.id
          ? conversations.user2_id
          : conversations.user1_id;

      // Buscar perfil do outro usuário
      const { data: otherUserProfile } = await supabase
        .from("profiles")
        .select("display_name, photo_url")
        .eq("user_id", otherUserId)
        .maybeSingle();

      // Buscar última mensagem e contagem de não lidas
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("content, sender_id, created_at")
        .eq("conversation_id", conversations.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversations.id)
        .eq("receiver_id", user.id)
        .is("read_at", null);

      recentConversation = {
        id: conversations.id,
        otherUser: {
          id: otherUserId,
          display_name: otherUserProfile?.display_name || "Usuário",
          photo_url: otherUserProfile?.photo_url,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
            }
          : null,
        unreadCount: unreadCount || 0,
      };
    }
  } catch (error) {
    console.error("Error fetching recent conversation:", error);
  }

  // Buscar favorito recente (para contratantes)
  let favorite: any = null;
  try {
    // Buscar último músico favoritado (todos podem ter favoritos)
    const { data: favoriteData } = await supabase
      .from("favorites")
      .select("musician_id")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (favoriteData) {
      // Buscar perfil do músico
      const { data: musicianProfile } = await supabase
        .from("profiles")
        .select("display_name, photo_url")
        .eq("user_id", favoriteData.musician_id)
        .maybeSingle();

      // Buscar perfil de músico para instrumentos e gêneros
      const { data: musicianDetails } = await supabase
        .from("musician_profiles")
        .select("instruments, genres")
        .eq("user_id", favoriteData.musician_id)
        .maybeSingle();

      const instruments = musicianDetails?.instruments || [];
      const genres = musicianDetails?.genres || [];
      const displayText = [
        instruments.length > 0 ? instruments[0] : null,
        genres.length > 0 ? genres[0] : null,
      ]
        .filter(Boolean)
        .join(" • ");

      favorite = {
        musician_id: favoriteData.musician_id,
        display_name: musicianProfile?.display_name || "Músico",
        photo_url: musicianProfile?.photo_url,
        display_text: displayText || "Músico",
      };
    }
  } catch (error) {
    console.error("Error fetching favorite:", error);
  }

  // Calcular estatísticas de avaliações diretamente das avaliações públicas
  // Isso garante consistência com a página de avaliações
  let ratings: any = null;
  try {
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("rating, rated_type, musician_id, contractor_id")
      .eq("is_public", true)
      .or(`musician_id.eq.${user.id},contractor_id.eq.${user.id}`);

    if (ratingsData && ratingsData.length > 0) {
      // Filtrar apenas avaliações onde o usuário é o AVALIADO
      const userRatings = ratingsData.filter((r: any) => {
        if (r.rated_type === "musician" && r.musician_id === user.id)
          return true;
        if (r.rated_type === "contractor" && r.contractor_id === user.id)
          return true;
        return false;
      });

      if (userRatings.length > 0) {
        const ratingCount = userRatings.length;
        const sum = userRatings.reduce(
          (acc: number, r: any) => acc + (r.rating || 0),
          0,
        );
        const avgRating = sum / ratingCount;

        ratings = {
          avgRating: avgRating,
          ratingCount: ratingCount,
        };
      }
    }
  } catch (error) {
    console.error("Error calculating ratings:", error);
  }

  const scoreBadge = ratings ? getScoreBadge(ratings.avgRating) : null;

  return (
    <div className="space-y-6">
      {/* Minha Agenda */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Minha Agenda
          </CardTitle>
          <div className="flex items-center gap-2">
            <DownloadICSButton />
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              asChild
            >
              <Link href={"/dashboard/agenda" as any}>Ver Completa</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {nextGig ? (
            <>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>{formatTimeBR(nextGig.start_time)}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-4">
                {nextGig.title}{" "}
                {formatTimeRange(nextGig.start_time, nextGig.end_time) &&
                  `• ${formatTimeRange(nextGig.start_time, nextGig.end_time)}`}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground py-2">
              Nenhum evento próximo
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raio de Busca */}
      <SearchRadiusSlider />

      {/* Conversas Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Conversas Recentes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs"
            asChild
          >
            <Link href={"/dashboard/messages" as any}>Ver Todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentConversation ? (
            <Link
              href={
                `/dashboard/messages?conversation=${recentConversation.id}` as any
              }
            >
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={recentConversation.otherUser.photo_url || ""}
                  />
                  <AvatarFallback className="bg-green-500 text-white">
                    {getInitials(recentConversation.otherUser.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate text-foreground">
                      {recentConversation.otherUser.display_name}
                    </p>
                    {recentConversation.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(
                          recentConversation.lastMessage.created_at,
                        )}
                      </span>
                    )}
                  </div>
                  {recentConversation.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">
                      {recentConversation.lastMessage.content}
                    </p>
                  )}
                  {recentConversation.unreadCount > 0 && (
                    <div className="mt-1 flex items-center justify-end">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                        {recentConversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="text-xs text-muted-foreground py-2">
              Nenhuma conversa recente
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favoritos */}
      {favorite && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Favoritos</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              asChild
            >
              <Link href={"/dashboard/favoritos" as any}>Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={favorite.photo_url || ""} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {getInitials(favorite.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {favorite.display_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {favorite.display_text}
                </p>
              </div>
              <Button size="sm" asChild>
                <Link
                  href={
                    `/dashboard/gigs/new?favorite=${favorite.musician_id}` as any
                  }
                >
                  Convidar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avaliações Recentes */}
      {ratings && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Avaliações Recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              asChild
            >
              <Link href={"/dashboard/avaliacoes" as any}>Ver Todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1 text-foreground">
                  Score Profissional
                </p>
                {scoreBadge && (
                  <Badge className={scoreBadge.color}>{scoreBadge.label}</Badge>
                )}
              </div>
              {ratings.avgRating ? (
                <div className="text-sm text-muted-foreground">
                  Média geral: {Number(ratings.avgRating).toFixed(1)}/5.0
                  {ratings.ratingCount > 0 &&
                    ` (${ratings.ratingCount} avaliações)`}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Ainda não há avaliações
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
