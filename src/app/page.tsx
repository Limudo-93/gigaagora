import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import HomeHeader from "@/components/HomeHeader";
import {
  Music,
  Briefcase,
  MapPin,
  DollarSign,
  CheckCircle2,
  Shield,
  Star,
  ArrowRight,
  Zap,
  MessageSquare,
  TrendingUp,
  Calendar,
} from "lucide-react";

async function getStats() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc("rpc_get_public_stats");

    if (error) {
      console.error("Error fetching stats from RPC:", error);
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
    const { data, error } = await supabase.rpc("rpc_get_recent_musicians", {
      p_limit: 8,
    });

    if (error) {
      console.error("Error fetching recent musicians from RPC:", error);
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
          .limit(8);
        return fallbackData || [];
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching recent musicians:", error);
    return [];
  }
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const stats = await getStats();
  const recentMusicians = await getRecentMusicians();
  
  // Mostrar apenas músicos reais (sem dados mockados)
  const socialProofMusicians = recentMusicians.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      {/* 1️⃣ HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-purple-600 to-purple-700">
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Elementos visuais flutuantes - Cards de gigs simulados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Card flutuante 1 - Gig */}
          <div className="absolute top-20 left-10 w-48 h-32 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 transform rotate-3 hidden lg:block animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-white" />
              <span className="text-white text-xs font-medium">Show no Bar</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
              <MapPin className="h-3 w-3" />
              <span>Zona Sul, SP</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs mb-2">
              <Calendar className="h-3 w-3" />
              <span>Sábado, 20h</span>
            </div>
            <div className="flex items-center gap-1 text-green-300 text-xs font-semibold">
              <DollarSign className="h-3 w-3" />
              <span>R$ 500</span>
            </div>
          </div>

          {/* Card flutuante 2 - Músico */}
          <div className="absolute top-40 right-16 w-40 h-28 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 transform -rotate-3 hidden lg:block animate-pulse delay-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-white/20"></div>
              <span className="text-white text-xs font-medium">Carlos</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
              <Music className="h-3 w-3" />
              <span>Guitarra</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <MapPin className="h-3 w-3" />
              <span>Rio de Janeiro</span>
            </div>
          </div>

          {/* Card flutuante 3 - Gig */}
          <div className="absolute bottom-32 left-1/4 w-44 h-28 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 transform rotate-6 hidden xl:block animate-pulse delay-300">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-white" />
              <span className="text-white text-xs font-medium">Casamento</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
              <MapPin className="h-3 w-3" />
              <span>Centro, MG</span>
            </div>
            <div className="flex items-center gap-1 text-green-300 text-xs font-semibold">
              <DollarSign className="h-3 w-3" />
              <span>R$ 800</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Headline principal */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Chame músicos prontos pra tocar{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-200 to-yellow-200">
                — hoje
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-4 font-medium">
              Ou encontre gigs sem enrolação
            </p>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              A plataforma que conecta músicos e contratantes de verdade. 
              Sem conversa fiada, só shows fechados.
            </p>

            {/* CTAs principais */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                className="text-lg px-10 py-7 shadow-2xl font-bold bg-white text-orange-600 hover:bg-orange-50 transition-all transform hover:scale-105"
                asChild
              >
                <Link href="/signup?type=musician">Sou Músico</Link>
              </Button>
              <Button
                size="lg"
                className="text-lg px-10 py-7 shadow-2xl font-bold bg-purple-900/40 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-purple-900/60 transition-all transform hover:scale-105"
                asChild
              >
                <Link href="/signup?type=contractor">Quero Contratar</Link>
              </Button>
            </div>

            {/* Badge de confiança */}
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Sem cartão de crédito</span>
            </div>
          </div>
        </div>

        {/* Onda decorativa no final do hero */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 md:h-24">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* 2️⃣ PROVA SOCIAL */}
      <section className="py-16 bg-white -mt-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">
              Músicos reais, gigs reais
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {stats.totalUsers > 0 
                ? `${stats.totalUsers}+ músicos já estão na plataforma`
                : "Músicos talentosos se cadastram todo dia"
              }
            </h2>
          </div>

          {/* Grid de avatares - apenas músicos reais */}
          {socialProofMusicians.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              {socialProofMusicians.map((musician: any, idx: number) => {
                const displayName = musician.display_name || musician.name || "Músico";
                const initials = displayName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const location = musician.city && musician.state
                  ? `${musician.city}, ${musician.state}`
                  : musician.city || musician.state || "Brasil";
                const instrument = musician.instrument || 
                  (musician.musician_profiles && 
                   Array.isArray(musician.musician_profiles) ? 
                   musician.musician_profiles[0]?.instruments?.[0] : 
                   musician.musician_profiles?.instruments?.[0]) || 
                  "Músico";

                return (
                  <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-4 ring-2 ring-purple-500/20">
                        <AvatarImage src={musician.photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white font-bold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                        {displayName}
                      </h3>
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        {instrument}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Músicos talentosos se cadastram todo dia. Seja o primeiro!
              </p>
            </div>
          )}

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalUsers > 0 ? stats.totalUsers.toLocaleString("pt-BR") : "50+"}
              </div>
              <div className="text-sm text-gray-600">Músicos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalGigs > 0 ? stats.totalGigs.toLocaleString("pt-BR") : "100+"}
              </div>
              <div className="text-sm text-gray-600">Gigs Publicadas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {stats.totalCache > 0 ? `R$ ${(stats.totalCache / 1000).toFixed(0)}k` : "R$ 50k+"}
              </div>
              <div className="text-sm text-gray-600">Cachê Pago</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ COMO FUNCIONA */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Em 3 passos simples, você já está tocando ou contratando
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Passo 1 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative h-24 w-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Briefcase className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Publique ou receba convites
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Se você é contratante, publique seu gig com todas as informações. 
                Se é músico, receba convites automáticos baseados no seu perfil.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative h-24 w-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Zap className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Match automático
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nosso sistema conecta você com as melhores opções baseado em 
                estilo, região e cache. Sem perder tempo procurando.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative h-24 w-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Show fechado sem burocracia
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Aceite o convite, confirme os detalhes e pronto. 
                Tudo claro desde o início, sem surpresas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ BENEFÍCIOS */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que músicos e contratantes escolhem a gente
            </h2>
            <p className="text-xl text-gray-600">
              Transparência, rapidez e confiança desde o primeiro clique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefício 1 */}
            <Card className="border-0 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Veja o cache antes de aceitar
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Sem pegadinha. O valor do cachê aparece logo no convite. 
                  Você decide se vale a pena ou não, sem perder tempo.
                </p>
              </CardContent>
            </Card>

            {/* Benefício 2 */}
            <Card className="border-0 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Saiba a região do show
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Você vê a região aproximada (Zona Sul, Centro, etc.) antes mesmo de aceitar. 
                  Não vai perder show por distância.
                </p>
              </CardContent>
            </Card>

            {/* Benefício 3 */}
            <Card className="border-0 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Decida rápido
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Tudo que você precisa saber está no convite. 
                  Um clique e o show está fechado. Simples assim.
                </p>
              </CardContent>
            </Card>

            {/* Benefício 4 */}
            <Card className="border-0 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Sem trocas infinitas de mensagens
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  As informações essenciais já estão lá. 
                  Só troca mensagem se realmente precisar combinar algo específico.
                </p>
              </CardContent>
            </Card>

            {/* Benefício 5 */}
            <Card className="border-0 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Perfis verificados
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Músicos com histórico real e avaliações de quem já trabalhou com eles. 
                  Confiança desde o primeiro contato.
                </p>
              </CardContent>
            </Card>

            {/* Benefício 6 */}
            <Card className="border-0 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Mais shows, menos trabalho
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  O sistema faz o match por você. 
                  Você só precisa escolher os gigs que fazem sentido pro seu perfil.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5️⃣ DIFERENCIAL FORTE - Região + Cache */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-orange-50 to-purple-50 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Star className="h-4 w-4" />
                Nosso diferencial
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Transparência desde o primeiro contato
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Ninguém mais perde tempo com informações escondidas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Diferencial 1 - Região */}
              <Card className="border-2 border-purple-200 shadow-xl bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Região transparente
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg mb-4">
                    Você vê a região aproximada do show antes de aceitar. 
                    Zona Sul, Centro, Barra... tudo claro desde o início.
                  </p>
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Sem surpresas de distância</span>
                  </div>
                </CardContent>
              </Card>

              {/* Diferencial 2 - Cache */}
              <Card className="border-2 border-orange-200 shadow-xl bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Cache no convite
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg mb-4">
                    O valor do cachê aparece direto no convite. 
                    Você decide rapidinho se aceita ou não, sem ficar perguntando.
                  </p>
                  <div className="flex items-center gap-2 text-orange-600 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Menos perda de tempo</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Box de destaque final */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 to-orange-600 text-white">
              <CardContent className="p-8 md:p-12 text-center">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Resultado: mais shows fechados
                </h3>
                <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
                  Quando tudo fica claro desde o início, as decisões são mais rápidas. 
                  Você fecha mais shows e perde menos tempo com conversas que não vão pra frente.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>Decisões mais rápidas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>Menos frustrações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>Mais gigs no bolso</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6️⃣ SEÇÃO DE AÇÃO FINAL */}
      <section className="py-24 bg-gradient-to-br from-orange-600 via-purple-600 to-purple-700 text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Pronto pra começar?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Junte-se aos músicos e contratantes que já estão fechando shows todo dia. 
            Sem burocracia, só resultado.
          </p>
          
          <Button
            size="lg"
            className="text-xl px-12 py-8 shadow-2xl font-bold bg-white text-purple-600 hover:bg-purple-50 transition-all transform hover:scale-105 mb-6"
            asChild
          >
            <Link href="/signup">
              Criar conta grátis
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <span>Cadastro em 2 minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7️⃣ FOOTER PROFISSIONAL */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Logo e descrição */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-purple-500 to-purple-600 flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Chama o Músico</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Conectando músicos e contratantes sem enrolação. 
                Shows fechados, resultados reais.
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <h3 className="font-bold text-white mb-4">Plataforma</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/como-funciona" className="hover:text-white transition-colors">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="/sobre" className="hover:text-white transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="hover:text-white transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Para Músicos */}
            <div>
              <h3 className="font-bold text-white mb-4">Para Músicos</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/signup?type=musician" className="hover:text-white transition-colors">
                    Criar Perfil
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/perfil" className="hover:text-white transition-colors">
                    Meu Perfil
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/termos" className="hover:text-white transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:text-white transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Linha divisória e copyright */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Chama o Músico. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Feito com</span>
                <Music className="h-4 w-4 text-purple-400" />
                <span>para músicos</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
