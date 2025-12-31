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
  Compass,
  Crown,
  Flame,
  Globe2,
  HeartHandshake,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
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
      label: "músicos prontos pra tocar",
      value: formatCompact(stats.totalUsers || 0),
    },
    {
      label: "shows rolando agora",
      value: formatCompact(stats.totalGigs || 0),
    },
    {
      label: "grana já girada na plataforma",
      value: stats.totalCache ? formatCurrency(stats.totalCache) : "R$ 0",
    },
  ];

  const journeySteps = [
    {
      title: "Monte seu perfil com capricho",
      description: "O perfil bem feito aparece mais e chama convite melhor.",
      icon: Crown,
    },
    {
      title: "Faz as missões da semana",
      description: "Missão feita = mais gente te vê e chama mais rápido.",
      icon: Target,
    },
    {
      title: "Feche show sem perder tempo",
      description: "Alerta, chat e agenda pra não deixar convite passar.",
      icon: Zap,
    },
  ];

  const features = [
    {
      title: "Radar certeiro",
      description: "Notificações com show do seu estilo e perto de você.",
      icon: Compass,
    },
    {
      title: "Chat direto",
      description: "Alinha tudo e fecha no mesmo lugar.",
      icon: MessageCircle,
    },
    {
      title: "Reputação que chama",
      description: "Avaliações e ranking colocam seu nome no topo.",
      icon: Star,
    },
    {
      title: "Agenda na mão",
      description: "Vê seus shows e joga no calendário com 1 clique.",
      icon: Calendar,
    },
    {
      title: "Contratante de confiança",
      description: "Contato com quem fecha certo e paga direitinho.",
      icon: ShieldCheck,
    },
    {
      title: "Força na sua cidade",
      description: "Mostra que você tá ativo e disponível por perto.",
      icon: Globe2,
    },
  ];

  return (
    <div className="min-h-screen">
      <HomeHeader />

      <main className="relative">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,179,71,0.35),_transparent_45%),radial-gradient(circle_at_70%_20%,_rgba(42,166,161,0.25),_transparent_40%),linear-gradient(180deg,_#fff7f0_0%,_#f8fbff_60%,_#ffffff_100%)]" />
          <div className="absolute -top-24 right-0 h-[320px] w-[320px] rounded-full bg-[#ff6b4a]/20 blur-[120px]" />
          <div className="absolute bottom-0 left-6 h-[280px] w-[280px] rounded-full bg-[#2aa6a1]/20 blur-[120px]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
                <Sparkles className="h-4 w-4" />
                Bora lotar a agenda em 2025
              </div>
              <h1 className="text-4xl font-display font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                O lugar onde músico fecha show e contratante acha o
                <span className="gradient-text"> line-up perfeito</span>.
              </h1>
              <p className="text-lg text-foreground/80 sm:text-xl">
                Tudo no esquema: convites certeiros, ranking que te dá moral e gigs\r\n                chegando mais rápido. Entrou, já começa a pingar proposta boa.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button className="btn-gradient text-white" asChild>
                  <Link href="/signup">
                    Quero fechar show
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-white/70 bg-white/70" asChild>
                  <Link href="/como-funciona">Ver como funciona</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Convite na veia por instrumento e estilo
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Missões simples pra te deixar em evidência
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2aa6a1]" />
                  Agenda organizada \+ baixa pro seu calendário
                </div>
              </div>
              {socialProofMusicians.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                  <div className="flex -space-x-3">
                    {socialProofMusicians.slice(0, 4).map((musician: any) => (
                      <Avatar key={musician.user_id} className="h-10 w-10 border-2 border-white">
                        <AvatarImage src={musician.photo_url || ""} alt={musician.display_name || "Músico"} />
                        <AvatarFallback>
                          {musician.display_name?.slice(0, 2)?.toUpperCase() || "CM"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span>
                    +{formatCompact(stats.totalUsers || 0)} músicos já fechando show agora
                  </span>
                </div>
              )}
            </div>

            <div className="relative space-y-4">
              <Card className="card-glass border border-white/70">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">Seu nível</p>
                      <p className="text-2xl font-semibold text-foreground">Headliner</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6b4a]/15 text-[#ff6b4a]">
                      <Crown className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-foreground/60">
                      <span>Progresso do ranking</span>
                      <span>78%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/70">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1]" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
                    Sobe mais um nível e pinta convite top.
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glass border border-white/70">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">Tarefa de hoje</p>
                      <p className="text-lg font-semibold text-foreground">Responder 3 convites</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2aa6a1]/15 text-[#2aa6a1]">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/70">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Sequência ativa: 4 dias direto
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/signup">Bora começar</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-white/70 bg-white/80 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Radar ligado</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Online agora
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <MapPin className="h-4 w-4 text-[#2aa6a1]" />
                    Shows pertinho de você
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm sm:grid-cols-3">
            {statsItems.map((item) => (
              <div key={item.label} className="space-y-2">
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                <p className="text-sm text-foreground/70">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-6">
              <h2 className="text-3xl font-display font-semibold text-foreground sm:text-4xl">
                Plataforma que põe show na sua agenda
              </h2>
              <p className="text-lg text-foreground/75">
                Você abre o app e já vê convite, meta do dia e o que fazer agora.\r\n                Resultado: mais show fechado e menos enrolação.
              </p>
              <div className="space-y-4">
                {journeySteps.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                      <item.icon className="h-5 w-5 text-[#ff6b4a]" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-foreground/70">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="btn-gradient text-white" asChild>
                <Link href="/signup">
                  Quero subir de nível
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="border border-white/70 bg-white/90 shadow-sm">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b4a]/15 text-[#ff6b4a]">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-foreground/70">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-3xl border border-white/70 bg-white/80 p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-display font-semibold text-foreground">
                Agenda de shows do jeitinho certo
              </h2>
              <p className="text-base text-foreground/70">
                Tudo organizado por status. Baixa o calendário e joga no Google,\r\n                iCloud ou Outlook em segundos.
              </p>
              <div className="space-y-3">
                {[
                  "Visão mensal, semanal e lista de eventos.",
                  "Alertas pra não esquecer nada.",
                  "Baixa rapidinho pro seu calendário.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-foreground/70">
                    <Calendar className="mt-0.5 h-4 w-4 text-[#ff6b4a]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button className="btn-gradient text-white" asChild>
                <Link href="/signup">
                  Quero minha agenda pronta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              <Card className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">Próximo som</p>
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
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs uppercase tracking-wide text-foreground/60">Checklist rapidinho</p>
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

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              {
                label: "Para músicos",
                title: "Seu nome no topo da cena da sua cidade",
                description:
                  "Ganhe pontos, selos e destaque. Receba convite certeiro e feche rápido.",
                icon: TrendingUp,
              },
              {
                label: "Para contratantes",
                title: "Line-up pronto com músico confiável",
                description:
                  "Manda vários convites, acompanha resposta na hora e fecha rapidinho.",
                icon: HeartHandshake,
              },
            ].map((card) => (
              <Card key={card.title} className="border border-white/70 bg-white/90 shadow-sm">
                <CardContent className="space-y-3 p-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    {card.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2aa6a1]/15 text-[#2aa6a1]">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{card.title}</h3>
                  </div>
                  <p className="text-sm text-foreground/70">{card.description}</p>
                  <Button variant="ghost" className="p-0 text-[#2aa6a1]" asChild>
                    <Link href="/signup">Começar agora</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-foreground/60">Comunidade na ativa</p>
              <h2 className="text-2xl font-display font-semibold text-foreground">
                Músicos em alta agora
              </h2>
              <p className="text-sm text-foreground/70">
                Perfis que respondem rápido e fecham show direto.
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
                  Logo mais vai aparecer músico novo aqui.
                </CardContent>
              </Card>
            ) : (
              socialProofMusicians.map((musician: any) => {
                const instruments = musician?.musician_profiles?.[0]?.instruments || [];
                const city = musician?.city
                  ? `${musician.city}${musician.state ? `, ${musician.state}` : ""}`
                  : "Brasil";
                return (
                  <Card key={musician.user_id} className="border border-white/70 bg-white/90 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={musician.photo_url || ""} alt={musician.display_name || "Músico"} />
                        <AvatarFallback>
                          {musician.display_name?.slice(0, 2)?.toUpperCase() || "CM"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {musician.display_name || "Músico"}
                        </p>
                        <p className="text-xs text-foreground/70 truncate">
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

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] p-8 text-white shadow-lg lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-white/80">Partiu fechar mais?</p>
                <h2 className="text-3xl font-display font-semibold">
                  Seu próximo show começa agora.
                </h2>
                <p className="text-sm text-white/80">
                  Cria a conta, completa o perfil e já começa a pingar convite.
                </p>
              </div>
              <Button className="bg-white text-[#2aa6a1] hover:bg-white/90" asChild>
                <Link href="/signup">
                  Quero entrar agora
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

