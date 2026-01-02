import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import LogoutButton from "@/app/dashboard/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BadgeDisplay from "./BadgeDisplay";
import AmbassadorBadge from "./AmbassadorBadge";
import RankingBadge from "./RankingBadge";

export default async function ProfileHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Buscar perfil básico
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Calcular estatísticas de avaliações diretamente das avaliações públicas
  // Isso garante consistência com a página de avaliações
  let avgRating: number | null = null;
  let ratingCount = 0;

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
        ratingCount = userRatings.length;
        const sum = userRatings.reduce(
          (acc: number, r: any) => acc + (r.rating || 0),
          0,
        );
        avgRating = sum / ratingCount;
      }
    }
  } catch (error) {
    console.error("Error calculating ratings:", error);
  }

  // Buscar badges do usuário
  const { data: badges } = await supabase
    .from("user_badges")
    .select("badge_type, earned_at, expires_at")
    .eq("user_id", user.id)
    .or("expires_at.is.null,expires_at.gt.now()");

  // Verificar se é embaixador
  const isAmbassador =
    profile?.is_ambassador ||
    badges?.some((b: any) => b.badge_type === "ambassador") ||
    false;
  const isVerified = Boolean(profile?.cpf);

  // Buscar ranking do usuário
  const { data: ranking } = await supabase
    .from("user_rankings")
    .select("current_tier")
    .eq("user_id", user.id)
    .single();

  // Calcular iniciais do nome (corrigido para TypeScript)
  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Formatar localização
  const location =
    profile?.city && profile?.state
      ? `${profile.city}, ${profile.state}`
      : profile?.city || profile?.state || null;

  return (
    <div className="relative overflow-hidden flex flex-col gap-3 md:gap-4 rounded-xl border border-border bg-card p-3 md:p-4 md:flex-row md:items-center md:justify-between shadow-md">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="flex items-center gap-3 md:gap-4 relative z-10 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-md" />
          <Avatar className="relative h-11 w-11 md:h-14 md:w-14 ring-2 ring-border shadow-md">
            <AvatarImage src={profile?.photo_url || ""} />
            <AvatarFallback className="text-base md:text-lg bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Badge de Embaixador */}
          {isAmbassador && (
            <div className="absolute -bottom-1 -right-1 z-20">
              <AmbassadorBadge size="sm" showText={false} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-foreground truncate">
            {displayName}
          </h2>

          {/* Avaliação e Badges - mais compacto em mobile */}
          <div className="mt-1.5 md:mt-2 flex items-center gap-2 md:gap-3 flex-wrap">
            {avgRating !== null && avgRating > 0 && (
              <div className="flex items-center gap-1 md:gap-1.5">
                <Star className="h-3.5 w-3.5 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {avgRating.toFixed(1)}
                </span>
                {ratingCount > 0 && (
                  <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">
                    ({ratingCount}{" "}
                    {ratingCount === 1 ? "avaliação" : "avaliações"})
                  </span>
                )}
              </div>
            )}

            {isAmbassador && <AmbassadorBadge size="sm" showText={true} />}
            {isVerified && (
              <Badge className="gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verificado
              </Badge>
            )}
            {ranking?.current_tier && (
              <RankingBadge
                tier={ranking.current_tier as any}
                size="sm"
                showText={true}
              />
            )}
            {badges && badges.length > 0 && (
              <BadgeDisplay
                badges={badges.filter((b: any) => {
                  // Se já estamos mostrando o badge "Verificado" baseado em isVerified,
                  // não mostrar o badge "verified" do sistema de badges para evitar duplicação
                  if (isVerified && b.badge_type === "verified") {
                    return false;
                  }
                  return true;
                })}
                size="sm"
              />
            )}
          </div>

          {location && (
            <div className="mt-1.5 md:mt-2 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botões - empilhados em mobile, lado a lado em desktop */}
      <div className="flex flex-col sm:flex-row gap-2 relative z-10 shrink-0 w-full sm:w-auto">
        <Button
          asChild
          size="sm"
          className="w-full sm:w-auto text-xs md:text-sm"
        >
          <Link href={"/dashboard/perfil/edit" as any}>Editar Perfil</Link>
        </Button>
        <div className="hidden md:block">
          <LogoutButton />
        </div>
        <div className="md:hidden">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
