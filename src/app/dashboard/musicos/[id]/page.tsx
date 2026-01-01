import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { extractUserIdFromSlug } from "@/lib/slug";
import DashboardLayoutWithSidebar from "@/components/dashboard/DashboardLayoutWithSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AmbassadorBadge from "@/components/dashboard/AmbassadorBadge";
import BadgeDisplay from "@/components/dashboard/BadgeDisplay";
import RankingBadge from "@/components/dashboard/RankingBadge";
import {
  BadgeCheck,
  CalendarClock,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";

type MusicianProfile = {
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  city: string | null;
  state: string | null;
  bio?: string | null;
  instruments?: string[] | null;
  genres?: string[] | null;
  skills?: string[] | null;
  setup?: string[] | null;
  avg_rating?: number | null;
  rating_count?: number | null;
  is_trusted?: boolean | null;
  attendance_rate?: number | null;
  response_time_seconds_avg?: number | null;
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "CM";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatAttendance(value?: number | null) {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatResponseTime(seconds?: number | null) {
  if (!seconds) return "—";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

export default async function DashboardMusicoProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Next.js 15+ pode passar params como Promise
  const resolvedParams = params instanceof Promise ? await params : params;
  const slugId = resolvedParams.id;

  console.log("[DashboardMusicoProfile] Received slug:", slugId);

  const userId = extractUserIdFromSlug(slugId);

  if (!userId) {
    console.error(
      "[DashboardMusicoProfile] Failed to extract userId from slug:",
      slugId,
    );
    return notFound();
  }

  console.log("[DashboardMusicoProfile] Extracted userId:", userId);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, photo_url, city, state, user_type, cpf, is_ambassador",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[DashboardMusicoProfile] Error fetching profile:",
      profileError,
    );
    return notFound();
  }

  if (!profile) {
    console.error(
      "[DashboardMusicoProfile] Profile not found for userId:",
      userId,
    );
    return notFound();
  }

  if (profile.user_type !== "musician") {
    console.error("[DashboardMusicoProfile] Profile is not a musician:", {
      userId,
      user_type: profile.user_type,
    });
    return notFound();
  }

  console.log("[DashboardMusicoProfile] Profile found:", profile.display_name);

  const { data: musicianProfile } = await supabase
    .from("musician_profiles")
    .select(
      "user_id, bio, instruments, genres, skills, setup, avg_rating, rating_count, is_trusted, attendance_rate, response_time_seconds_avg",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const { data: badges } = await supabase
    .from("user_badges")
    .select("badge_type, earned_at, expires_at")
    .eq("user_id", userId)
    .or("expires_at.is.null,expires_at.gt.now()");

  const { data: ranking } = await supabase
    .from("user_rankings")
    .select("current_tier")
    .eq("user_id", userId)
    .maybeSingle();

  const isAmbassador =
    profile?.is_ambassador ||
    badges?.some((b: any) => b.badge_type === "ambassador") ||
    false;
  const isVerified = Boolean(profile?.cpf);

  const musician: MusicianProfile = {
    user_id: profile.user_id,
    display_name: profile.display_name,
    photo_url: profile.photo_url,
    city: profile.city,
    state: profile.state,
    bio: musicianProfile?.bio ?? null,
    instruments: musicianProfile?.instruments ?? null,
    genres: musicianProfile?.genres ?? null,
    skills: musicianProfile?.skills ?? null,
    setup: musicianProfile?.setup ?? null,
    avg_rating: musicianProfile?.avg_rating ?? null,
    rating_count: musicianProfile?.rating_count ?? null,
    is_trusted: musicianProfile?.is_trusted ?? null,
    attendance_rate: musicianProfile?.attendance_rate ?? null,
    response_time_seconds_avg:
      musicianProfile?.response_time_seconds_avg ?? null,
  };

  return (
    <DashboardLayoutWithSidebar>
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card className="card-glass">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-white/70">
                  <AvatarImage src={musician.photo_url || ""} />
                  <AvatarFallback className="gradient-music text-white font-semibold text-xl">
                    {getInitials(musician.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-display font-semibold text-foreground">
                      {musician.display_name || "Músico"}
                    </h1>
                    {musician.is_trusted && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        confiável
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {isAmbassador && (
                      <AmbassadorBadge size="sm" showText={true} />
                    )}
                    {isVerified && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <ShieldCheck className="h-3 w-3 mr-1" />
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
                  <div className="flex items-center gap-2 text-sm text-foreground/60 mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[musician.city, musician.state]
                        .filter(Boolean)
                        .join(", ") || "Brasil"}
                    </span>
                  </div>
                  {musician.avg_rating && (
                    <div className="flex items-center gap-2 text-sm text-foreground/70 mt-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">
                        {musician.avg_rating.toFixed(1)}
                      </span>
                      <span className="text-foreground/50">
                        ({musician.rating_count || 0} avaliações)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="btn-gradient">
                  <Link href="/dashboard/gigs/new">Convidar músico</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="bg-white/80 border-white/70"
                >
                  <Link href="/dashboard/musicos">Voltar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-glass">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <CalendarClock className="h-4 w-4 text-[#ff6b4a]" />
                Presença em gigs
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {formatAttendance(musician.attendance_rate)}
              </p>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <Clock className="h-4 w-4 text-amber-500" />
                Tempo médio de resposta
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {formatResponseTime(musician.response_time_seconds_avg)}
              </p>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                Status
              </div>
              <p className="text-lg font-semibold text-foreground">
                {musician.is_trusted
                  ? "Verificado pela plataforma"
                  : "Disponível para convites"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="card-glass">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Sobre</h2>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {musician.bio ||
                  "Este músico ainda não adicionou uma biografia pública."}
              </p>
              {musician.instruments && musician.instruments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Instrumentos
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {musician.instruments.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="bg-white/70 border-white/70"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {musician.genres && musician.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Gêneros
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {musician.genres.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="bg-amber-50 text-amber-800 border-amber-200"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {musician.skills && musician.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Habilidades
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {musician.skills.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="bg-teal-50 text-teal-800 border-teal-200"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Setup e recursos
              </h2>
              {musician.setup && musician.setup.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {musician.setup.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="bg-white/70 border-white/70"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/60">
                  Sem informações de equipamentos no momento.
                </p>
              )}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-900">
                Perfil público para facilitar a escolha de músicos. Convide
                direto pelo dashboard.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardLayoutWithSidebar>
  );
}
