import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/Logo";
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Star,
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  Calendar,
  Music,
} from "lucide-react";

async function getStats() {
  const supabase = await createClient();
  
  try {
    // Usar função RPC pública para obter estatísticas
    const { data, error } = await supabase.rpc("rpc_get_public_stats");

    if (error) {
      console.error("Error fetching stats from RPC:", error);
      // Fallback: tentar queries diretas (pode falhar por RLS)
      try {
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const { count: totalGigs } = await supabase
          .from("gigs")
          .select("*", { count: "exact", head: true })
          .eq("status", "published");

        return {
          totalUsers: totalUsers ?? 0,
          totalGigs: totalGigs ?? 0,
          totalCache: 0,
        };
      } catch (fallbackError) {
        console.error("Fallback queries also failed:", fallbackError);
        return {
          totalUsers: 0,
          totalGigs: 0,
          totalCache: 0,
        };
      }
    }

    // Retornar dados da RPC
    return {
      totalUsers: data?.totalUsers ?? 0,
      totalGigs: data?.totalGigs ?? 0,
      totalCache: data?.totalCache ?? 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalUsers: 0,
      totalGigs: 0,
      totalCache: 0,
    };
  }
}

async function getRecentMusicians() {
  const supabase = await createClient();
  
  try {
    // Usar função RPC pública
    const { data, error } = await supabase.rpc("rpc_get_recent_musicians", {
      p_limit: 6,
    });

    if (error) {
      console.error("Error fetching recent musicians from RPC:", error);
      // Fallback: tentar query direta
      try {
        const { data: fallbackData } = await supabase
          .from("profiles")
          .select(`
            user_id,
            display_name,
            photo_url,
            city,
            state,
            musician_profiles(
              instruments,
              genres,
              avg_rating
            )
          `)
          .order("created_at", { ascending: false })
          .limit(6);
        return fallbackData || [];
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }
    }

    // Converter JSON para array de objetos
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching recent musicians:", error);
    return [];
  }
}

async function getRecentConfirmedGigs() {
  const supabase = await createClient();
  
  try {
    // Usar função RPC pública
    const { data, error } = await supabase.rpc("rpc_get_recent_confirmed_gigs", {
      p_limit: 6,
    });

    if (error) {
      console.error("Error fetching recent gigs from RPC:", error);
      // Fallback: tentar queries diretas
      try {
        const { data: confirmations } = await supabase
          .from("confirmations")
          .select(`
            id,
            created_at,
            invite_id
          `)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!confirmations || confirmations.length === 0) {
          return [];
        }

        const inviteIds = confirmations.map((c: any) => c.invite_id).filter(Boolean);
        
        if (inviteIds.length === 0) {
          return [];
        }

        const { data: invites } = await supabase
          .from("invites")
          .select(`
            id,
            gig_id,
            gig_role_id,
            gigs(
              id,
              title,
              start_time,
              location_name,
              city,
              state,
              flyer_url
            ),
            gig_roles(
              instrument,
              cache
            )
          `)
          .in("id", inviteIds);

        const result = confirmations.map((conf: any) => {
          const invite = invites?.find((inv: any) => inv.id === conf.invite_id);
          return {
            ...conf,
            invite,
          };
        }).filter((item: any) => item.invite);

        return result;
      } catch (fallbackError) {
        console.error("Fallback queries also failed:", fallbackError);
        return [];
      }
    }

    // Converter JSON para array de objetos
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching recent gigs:", error);
    return [];
  }
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se o usuário estiver logado, redireciona para o dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Buscar dados para a homepage
  const stats = await getStats();
  const recentMusicians = await getRecentMusicians();
  const recentGigs = await getRecentConfirmedGigs();

  return (
    <div className="min-h-screen">
      {/* Header simples para homepage */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" as any>
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-foreground hover:bg-muted/50" asChild>
                <Link href="/login" as any>Entrar</Link>
              </Button>
              <Button 
                className="text-white shadow-md transition-all duration-200" 
                asChild
                style={{
                  background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
                  color: "white"
                }}
              >
                <Link href="/signup" as any>Criar Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        ></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl"></div>
                <div className="relative h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Music className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-100">
              Chama o Músico
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-white/90 max-w-3xl mx-auto">
              A plataforma que conecta músicos talentosos com oportunidades de trabalho
            </p>
            <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
              Encontre os melhores músicos para seu evento ou descubra gigs incríveis para mostrar seu talento
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-white text-lg px-8 py-6 shadow-xl font-semibold"
                style={{
                  background: "var(--theme-gradient, linear-gradient(135deg, #f97316 0%, #a855f7 50%, #3b82f6 100%))",
                  color: "white",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)"
                }}
                asChild
              >
                <Link href="/login" as any>Efetuar Login</Link>
              </Button>
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-xl font-semibold"
                style={{
                  background: "white",
                  color: "#ea580c"
                }}
                asChild
              >
                <Link href="/signup" as any>Criar Conta Grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stats.totalUsers.toLocaleString("pt-BR")}
                </div>
                <div className="text-lg text-gray-700">Músicos Cadastrados</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-purple-500 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stats.totalGigs.toLocaleString("pt-BR")}
                </div>
                <div className="text-lg text-gray-700">Trabalhos Publicados</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  R$ {stats.totalCache.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-lg text-gray-700">Cachê Total Pago</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features/Novidades */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que escolher o Chama o Músico?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A plataforma mais completa para conectar músicos e contratantes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Match Perfeito
                </h3>
                <p className="text-gray-600">
                  Sistema inteligente que conecta músicos com as oportunidades ideais baseado em instrumento, gênero e habilidades
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Segurança Total
                </h3>
                <p className="text-gray-600">
                  Dados protegidos e sistema de avaliações para garantir transparência e confiança em todas as transações
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processo Rápido
                </h3>
                <p className="text-gray-600">
                  Publique trabalhos ou encontre oportunidades em minutos. Sistema intuitivo e eficiente
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Músicos Verificados
                </h3>
                <p className="text-gray-600">
                  Perfis completos com avaliações, histórico e habilidades detalhadas para você escolher com confiança
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Crescimento Constante
                </h3>
                <p className="text-gray-600">
                  Plataforma em expansão com novos músicos e oportunidades sendo adicionados diariamente
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Todos os Gêneros
                </h3>
                <p className="text-gray-600">
                  Do sertanejo ao jazz, do pagode ao rock. Encontre músicos para qualquer estilo musical
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Últimos Músicos */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Músicos Recentes
            </h2>
            <p className="text-xl text-gray-600">
              Conheça os talentos que acabaram de se cadastrar
            </p>
          </div>

          {recentMusicians.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMusicians.map((musician: any) => {
                const profile = musician;
                const mp = Array.isArray(musician.musician_profiles) 
                  ? musician.musician_profiles[0] 
                  : musician.musician_profiles;
                const displayName = profile.display_name || "Músico";
                const initials = displayName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const location = profile.city && profile.state
                  ? `${profile.city}, ${profile.state}`
                  : profile.city || profile.state || "Brasil";
                const instruments = mp?.instruments || [];
                const genres = mp?.genres || [];

                return (
                  <Card key={profile.user_id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 ring-2 ring-orange-500">
                          <AvatarImage src={profile.photo_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{location}</span>
                          </div>
                          {mp?.avg_rating && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {Number(mp.avg_rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                          {instruments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {instruments.slice(0, 2).map((inst: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {inst}
                                </Badge>
                              ))}
                              {instruments.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{instruments.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum músico cadastrado ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Trabalhos Contratados Recentes */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trabalhos Recentes
            </h2>
            <p className="text-xl text-gray-600">
              Veja os shows que foram confirmados recentemente
            </p>
          </div>

          {recentGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentGigs.map((confirmation: any, idx: number) => {
                const invite = confirmation.invite;
                const gig = Array.isArray(invite?.gigs) ? invite.gigs[0] : invite?.gigs;
                const role = Array.isArray(invite?.gig_roles) ? invite.gig_roles[0] : invite?.gig_roles;
                if (!gig) return null;

                const startDate = gig.start_time
                  ? new Date(gig.start_time)
                  : null;
                const dateStr = startDate
                  ? startDate.toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "";
                const location = gig.location_name || gig.city || "Local a definir";

                return (
                  <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 overflow-hidden flex items-center justify-center">
                      {gig.flyer_url ? (
                        <img
                          src={gig.flyer_url}
                          alt={gig.title || "Flyer do evento"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-32 h-32">
                          <Image
                            src="/logo.png"
                            alt="Logo Chama o Músico"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {gig.title || "Show"}
                        </h3>
                        <Badge className="bg-green-500 text-white">Confirmado</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        {dateStr && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{dateStr}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{location}</span>
                        </div>
                        {role?.instrument && (
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            <span>{role.instrument}</span>
                          </div>
                        )}
                        {role?.cache && (
                          <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>R$ {Number(role.cache).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum trabalho confirmado ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Junte-se a centenas de músicos e contratantes que já estão usando o Chama o Músico
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-white text-lg px-8 py-6 shadow-xl"
              style={{
                background: "white",
                color: "hsl(var(--primary))"
              }}
              asChild
            >
              <Link href="/signup" as any>Criar Conta Grátis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Chama o Músico</span>
              </div>
              <p className="text-gray-300 text-sm">
                Conectando talentos musicais com oportunidades de trabalho
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Plataforma</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/dashboard/gigs" as any className="hover:text-white transition-colors">Trabalhos</Link></li>
                <li><Link href="/dashboard" as any className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/perfil" as any className="hover:text-white transition-colors">Perfil</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Sobre</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/como-funciona" as any className="hover:text-white transition-colors">Como Funciona</Link></li>
                <li><Link href="/sobre" as any className="hover:text-white transition-colors">Sobre Nós</Link></li>
                <li><Link href="/contato" as any className="hover:text-white transition-colors">Contato</Link></li>
                <li><Link href="/faq" as any className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/termos" as any className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" as any className="hover:text-white transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
            <p>&copy; {new Date().getFullYear()} Chama o Músico. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
