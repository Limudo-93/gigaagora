import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutWithSidebar from "@/components/dashboard/DashboardLayoutWithSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Music, Globe, Edit, Eye } from "lucide-react";
import Link from "next/link";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Buscar perfil básico
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile:", profileError);
  }

  // Buscar perfil de músico (todos os usuários têm perfil de músico)
  const { data: musicianProfile } = await supabase
    .from("musician_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Se não existe perfil, criar um básico
  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        user_type: "musician",
        display_name: user.email?.split("@")[0] || "Usuário",
      })
      .select()
      .single();

    if (newProfile) {
      return redirect("/dashboard/perfil");
    }
  }

  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Usuário";
  // Calcular iniciais do nome (corrigido para TypeScript)
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute -top-24 -right-20 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-60 w-60 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              Seu perfil
            </p>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Meu Perfil
            </h1>
            <p className="text-sm text-foreground/60 mt-2">
              Gerencie suas informações pessoais e profissionais
            </p>
          </div>
          <Link
            href={"/dashboard/perfil/edit" as any}
            className="relative z-10"
          >
            <Button className="btn-gradient">
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          </Link>
        </div>

        {/* Preview Público e Badges de Confiança */}
        <Card className="card-glass border-white/70 bg-gradient-to-br from-amber-50/80 to-teal-50/80">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Público
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              É assim que os contratantes veem você quando procuram músicos para
              suas gigs.
            </p>

            <div className="space-y-4">
              {/* Badges de Confiança */}
              <div className="flex flex-wrap gap-2">
                {musicianProfile?.is_trusted && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                    ✓ Músico Confiável
                  </Badge>
                )}
                {musicianProfile?.avg_rating &&
                  Number(musicianProfile.avg_rating) >= 4.5 && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                      ⭐ Excelente Avaliação
                    </Badge>
                  )}
                {musicianProfile?.attendance_rate &&
                  Number(musicianProfile.attendance_rate) >= 0.95 && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                      📅 Alta Presença
                    </Badge>
                  )}
                {musicianProfile?.response_time_seconds_avg &&
                  Number(musicianProfile.response_time_seconds_avg) < 3600 && (
                    <Badge className="bg-teal-500 hover:bg-teal-600 text-white border-0">
                      ⚡ Resposta Rápida
                    </Badge>
                  )}
                {!musicianProfile?.is_trusted &&
                  (!musicianProfile?.avg_rating ||
                    Number(musicianProfile.avg_rating) < 4.5) &&
                  (!musicianProfile?.attendance_rate ||
                    Number(musicianProfile.attendance_rate) < 0.95) &&
                  (!musicianProfile?.response_time_seconds_avg ||
                    Number(musicianProfile.response_time_seconds_avg) >=
                      3600) && (
                    <Badge variant="outline" className="border-white/70">
                      Complete mais gigs para ganhar badges
                    </Badge>
                  )}
              </div>

              {/* Preview do perfil */}
              <div className="bg-white/60 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.photo_url || ""} />
                    <AvatarFallback className="text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">
                      {displayName}
                    </h3>
                    {profile?.city && profile?.state && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {profile.city}, {profile.state}
                      </p>
                    )}
                    {musicianProfile?.instruments &&
                      musicianProfile.instruments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {musicianProfile.instruments
                            .slice(0, 3)
                            .map((instrument: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {instrument}
                              </Badge>
                            ))}
                          {musicianProfile.instruments.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{musicianProfile.instruments.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    {musicianProfile?.avg_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {Number(musicianProfile.avg_rating).toFixed(1)}
                        </span>
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-xs text-muted-foreground">
                          ({musicianProfile.rating_count || 0}{" "}
                          {musicianProfile.rating_count === 1
                            ? "avaliação"
                            : "avaliações"}
                          )
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-foreground">
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.photo_url || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {displayName}
                  </h2>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    {profile?.city && profile?.state && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {profile.city}, {profile.state}
                        </span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {profile?.phone_e164 && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone_e164}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perfil de Músico */}
        {musicianProfile && (
          <>
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Informações Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {musicianProfile.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Biografia
                    </h3>
                    <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                      {musicianProfile.bio}
                    </p>
                  </div>
                )}

                {musicianProfile.instruments &&
                  musicianProfile.instruments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        Instrumentos
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {musicianProfile.instruments.map(
                          (instrument: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-white/70 text-foreground bg-white/70"
                            >
                              {instrument}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {musicianProfile.genres &&
                  musicianProfile.genres.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        Gêneros Musicais
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {musicianProfile.genres.map(
                          (genre: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-white/70 text-foreground bg-white/70"
                            >
                              {genre}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {musicianProfile.skills &&
                  musicianProfile.skills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        Habilidades
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {musicianProfile.skills.map(
                          (skill: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-white/70 text-foreground bg-white/70"
                            >
                              {skill}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {musicianProfile.setup && musicianProfile.setup.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Equipamentos
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {musicianProfile.setup.map(
                        (item: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-white/70 text-foreground bg-white/70"
                          >
                            {item}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {musicianProfile.portfolio_links &&
                  musicianProfile.portfolio_links.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        Portfólio
                      </h3>
                      <div className="space-y-2">
                        {musicianProfile.portfolio_links.map(
                          (link: string, idx: number) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#ff6b4a] hover:text-[#e65c3e] hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-4 w-4" />
                              {link}
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {(musicianProfile.avg_rating ||
                  musicianProfile.rating_count) && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Avaliações
                    </h3>
                    <div className="flex items-center gap-4">
                      {musicianProfile.avg_rating && (
                        <div>
                          <span className="text-lg font-semibold text-foreground">
                            {Number(musicianProfile.avg_rating).toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            / 5.0
                          </span>
                        </div>
                      )}
                      {musicianProfile.rating_count && (
                        <span className="text-sm text-muted-foreground">
                          {musicianProfile.rating_count} avaliações
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {musicianProfile.is_trusted && (
                  <div>
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                      ✓ Músico Confiável
                    </Badge>
                    {musicianProfile.trusted_since && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Desde{" "}
                        {new Date(
                          musicianProfile.trusted_since,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            {(musicianProfile.attendance_rate !== null ||
              musicianProfile.response_time_seconds_avg !== null) && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {musicianProfile.attendance_rate !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Taxa de Presença
                        </h3>
                        <p className="text-2xl font-semibold text-foreground mt-1">
                          {(
                            Number(musicianProfile.attendance_rate) * 100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    )}
                    {musicianProfile.response_time_seconds_avg !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Tempo Médio de Resposta
                        </h3>
                        <p className="text-2xl font-semibold text-foreground mt-1">
                          {Math.round(
                            Number(musicianProfile.response_time_seconds_avg) /
                              3600,
                          )}
                          h
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Mensagem se não houver perfil de músico */}
        {!musicianProfile && (
          <Card className="bg-amber-50/80 border-amber-200/70">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-900">
                Complete seu perfil para aparecer no diretório e receber mais
                convites.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutWithSidebar>
  );
}
