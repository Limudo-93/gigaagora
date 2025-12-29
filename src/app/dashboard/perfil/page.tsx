import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutWithSidebar from "@/components/dashboard/DashboardLayoutWithSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Music, Globe, Edit } from "lucide-react";
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

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas informações pessoais e profissionais
            </p>
          </div>
          <Link href="/dashboard/perfil/edit">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          </Link>
        </div>

        {/* Informações Básicas */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.photo_url || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
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
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Informações Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {musicianProfile.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Biografia</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{musicianProfile.bio}</p>
                  </div>
                )}

                {musicianProfile.instruments && musicianProfile.instruments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Instrumentos</h3>
                    <div className="flex flex-wrap gap-2">
                      {musicianProfile.instruments.map((instrument: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                          {instrument}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {musicianProfile.genres && musicianProfile.genres.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Gêneros Musicais</h3>
                    <div className="flex flex-wrap gap-2">
                      {musicianProfile.genres.map((genre: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {musicianProfile.skills && musicianProfile.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Habilidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {musicianProfile.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {musicianProfile.setup && musicianProfile.setup.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Equipamentos</h3>
                    <div className="flex flex-wrap gap-2">
                      {musicianProfile.setup.map((item: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {musicianProfile.portfolio_links && musicianProfile.portfolio_links.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Portfólio</h3>
                    <div className="space-y-2">
                      {musicianProfile.portfolio_links.map((link: string, idx: number) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-4 w-4" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(musicianProfile.avg_rating || musicianProfile.rating_count) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Avaliações</h3>
                    <div className="flex items-center gap-4">
                      {musicianProfile.avg_rating && (
                        <div>
                          <span className="text-lg font-semibold text-gray-900">
                            {Number(musicianProfile.avg_rating).toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">/ 5.0</span>
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
                        Desde {new Date(musicianProfile.trusted_since).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            {(musicianProfile.attendance_rate !== null ||
              musicianProfile.response_time_seconds_avg !== null) && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {musicianProfile.attendance_rate !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Taxa de Presença</h3>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          {(Number(musicianProfile.attendance_rate) * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {musicianProfile.response_time_seconds_avg !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Tempo Médio de Resposta
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          {Math.round(Number(musicianProfile.response_time_seconds_avg) / 3600)}h
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
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <p className="text-sm text-orange-900">
                Complete seu perfil para aparecer no diretório e receber mais convites.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutWithSidebar>
  );
}

