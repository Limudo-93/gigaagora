import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import HomeHeader from "@/components/HomeHeader";
import MarketingFooter from "@/components/MarketingFooter";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Flame,
  MapPin,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
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
  const socialProofMusicians = recentMusicians.slice(0, 6);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  const statsItems = [
    {
      label: "músicos ativos",
      value: formatCompact(stats.totalUsers || 0),
    },
    {
      label: "gigs disponíveis",
      value: formatCompact(stats.totalGigs || 0),
    },
    {
      label: "cache pago",
      value: stats.totalCache ? formatCurrency(stats.totalCache) : "R$ 0",
    },
  ];

  return (
    <div className="min-h-screen">
      <HomeHeader />

      <main className="relative">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fff1e7] via-white to-[#e9f7f5]" />
          <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[#ffb347]/30 blur-[120px]" />
          <div className="absolute bottom-0 left-10 h-[320px] w-[320px] rounded-full bg-[#2aa6a1]/20 blur-[120px]" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <Sparkles className="h-4 w-4" />
                Nova temporada de gigs
              </div>
              <h1 className="text-4xl font-display font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Transforme convites em{" "}
                <span className="gradient-text">palcos cheios</span> com uma jornada
                feita para músicos e contratantes.
              </h1>
              <p className="text-base text-foreground/70 sm:text-lg">
                Um hub de oportunidades com missões, níveis e recompensas reais.
                Receba convites certeiros, responda mais rápido e mantenha sua agenda
                sempre cheia.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button className="btn-gradient text-white" asChild>
                  <Link href="/signup">
                    Começar missão agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-white/70 bg-white/60" asChild>
                  <Link href="/como-funciona">Ver como funciona</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-foreground/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Match inteligente por instrumento e estilo
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  Conversas diretas com contratantes
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  Agenda integrada + exportação de calendário
                </div>
              </div>
            </div>

            <div className="relative space-y-4">
              <Card className="card-glass border border-white/70">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">
                        Seu nível
                      </p>
                      <p className="text-2xl font-semibold text-foreground">Explorador</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6b4a]/15 text-[#ff6b4a]">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-foreground/60">
                      <span>Progresso da missão</span>
                      <span>62%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/70">
                      <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1]" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
                    Complete seu perfil e desbloqueie convites premium.
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glass border border-white/70">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">
                        Missão de hoje
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        Responda 2 convites
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2aa6a1]/15 text-[#2aa6a1]">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/70">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Sequência ativa: 4 dias
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/signup">Iniciar missão</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm sm:grid-cols-3">
            {statsItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                <p className="text-sm text-foreground/60">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-3xl font-display font-semibold text-foreground">
                Uma plataforma que trabalha por você
              </h2>
              <p className="text-base text-foreground/70">
                Conectamos quem precisa de músicos com quem quer viver da música. Tudo
                em um fluxo rápido, transparente e com notificações certeiras.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "Match inteligente",
                    description: "Seu perfil vira um radar de gigs compatíveis.",
                    icon: Zap,
                  },
                  {
                    title: "Comunicação instantânea",
                    description: "Chat direto para combinar detalhes e fechar rápido.",
                    icon: MessageSquare,
                  },
                  {
                    title: "Agenda blindada",
                    description: "Sincronize com seu calendário e evite conflitos.",
                    icon: Calendar,
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <item.icon className="h-5 w-5 text-[#ff6b4a]" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-foreground/60">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  label: "Para músicos",
                  title: "Ganhe destaque com seu ranking",
                  description:
                    "Complete missões, responda rápido e suba de nível para receber convites melhores.",
                },
                {
                  label: "Para contratantes",
                  title: "Monte o line-up ideal em minutos",
                  description:
                    "Veja músicos compatíveis, envie convites em lote e acompanhe respostas em tempo real.",
                },
              ].map((card) => (
                <Card key={card.title} className="border border-white/70 bg-white/80 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      {card.label}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">{card.title}</h3>
                    <p className="text-sm text-foreground/60">{card.description}</p>
                    <Button variant="ghost" className="p-0 text-[#2aa6a1]" asChild>
                      <Link href="/signup">Começar agora</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-3xl border border-white/70 bg-white/70 p-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-display font-semibold text-foreground">
                A trilha de crescimento da plataforma
              </h2>
              <p className="text-base text-foreground/70">
                Cada ação tem um impacto direto: mais respostas, mais convites,
                mais cachê. Tudo fica claro com missões guiadas.
              </p>
              <div className="space-y-4">
                {[
                  "Complete seu perfil para liberar convites premium.",
                  "Mantenha sua sequência ativa para subir de nível.",
                  "Receba recompensas semanais ao fechar gigs.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-[#2aa6a1]" />
                    <p className="text-sm text-foreground/70">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <Card className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6b4a]/15 text-[#ff6b4a]">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Meta semanal</p>
                    <p className="text-xs text-foreground/60">
                      Envie 5 propostas e desbloqueie bônus de visibilidade.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2aa6a1]/15 text-[#2aa6a1]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Radar inteligente</p>
                    <p className="text-xs text-foreground/60">
                      Encontre gigs no seu raio ideal e receba alertas na hora.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ranking local</p>
                    <p className="text-xs text-foreground/60">
                      Suba posições ao receber avaliações e convites confirmados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-semibold text-foreground">
                Músicos em destaque
              </h2>
              <p className="text-sm text-foreground/60">
                Perfis ativos que estão fechando gigs agora.
              </p>
            </div>
            <Button variant="outline" className="border-white/70 bg-white/60" asChild>
              <Link href="/signup">Quero aparecer aqui</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {socialProofMusicians.length === 0 ? (
              <Card className="border border-white/70 bg-white/80">
                <CardContent className="p-6 text-sm text-foreground/60">
                  Em breve você verá músicos recém-chegados por aqui.
                </CardContent>
              </Card>
            ) : (
              socialProofMusicians.map((musician: any) => {
                const instruments = musician?.musician_profiles?.[0]?.instruments || [];
                const city = musician?.city ? `${musician.city}${musician.state ? `, ${musician.state}` : ""}` : "Brasil";
                return (
                  <Card key={musician.user_id} className="border border-white/70 bg-white/80 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={musician.photo_url || ""} alt={musician.display_name || "Músico"} />
                        <AvatarFallback>{musician.display_name?.slice(0, 2)?.toUpperCase() || "CM"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {musician.display_name || "Músico"}
                        </p>
                        <p className="text-xs text-foreground/60 truncate">
                          {instruments[0] || "Multi-instrumentista"} • {city}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-3xl border border-white/70 bg-white/70 p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-display font-semibold text-foreground">
                Agenda completa com exportação
              </h2>
              <p className="text-base text-foreground/70">
                Seus shows confirmados aparecem com status claros. Baixe um arquivo
                de calendário e sincronize no Google, iCloud ou Outlook.
              </p>
              <div className="space-y-3">
                {[
                  "Visão mensal e lista de eventos com status.",
                  "Alertas de pendências e conflito de datas.",
                  "Download em .ics com um clique.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-foreground/70">
                    <Calendar className="mt-0.5 h-4 w-4 text-[#ff6b4a]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button className="btn-gradient text-white" asChild>
                <Link href="/signup">
                  Quero minha agenda inteligente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              <Card className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">
                        Próximo show
                      </p>
                      <p className="text-lg font-semibold text-foreground">Sábado, 20h</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Confirmado
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Festival no Centro</p>
                  <p className="text-xs text-foreground/60">São Paulo • Palco A</p>
                </CardContent>
              </Card>
              <Card className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="space-y-2 p-5">
                  <p className="text-xs uppercase tracking-wide text-foreground/60">
                    Checklist rápido
                  </p>
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Confirmar presença
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Enviar setlist
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Sincronizar agenda
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] p-8 text-white shadow-lg lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-white/80">
                  Última chamada
                </p>
                <h2 className="text-3xl font-display font-semibold">
                  Sua próxima gig começa agora.
                </h2>
                <p className="text-sm text-white/80">
                  Entre, complete sua missão inicial e desbloqueie convites em poucas horas.
                </p>
              </div>
              <Button className="bg-white text-[#2aa6a1] hover:bg-white/90" asChild>
                <Link href="/signup">
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
