import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Crown,
  Flame,
  LineChart,
  Plus,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  Wallet,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import PendingInvites from "@/components/dashboard/PendingInvites";
import UpcomingConfirmedGigs from "@/components/dashboard/UpcomingConfirmedGigs";
import CompletedGigsToRate from "@/components/dashboard/CompletedGigsToRate";
import GigsTabs from "@/components/dashboard/GigsTabs";
import EnablePushNotificationsCard from "@/components/push-notifications/EnablePushNotificationsCard";
import PwaInstallGuideCard from "@/components/dashboard/PwaInstallGuideCard";
import ReferralSystem from "@/components/dashboard/ReferralSystem";
import ThemeSelector from "@/components/dashboard/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function Dashboard2Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const nowIso = new Date().toISOString();

  const [
    pendingInvitesResult,
    gigsResult,
    pendingRatingsResult,
    upcomingConfirmedResult,
    confirmedResult,
  ] = await Promise.all([
    supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("musician_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id),
    supabase
      .from("confirmations")
      .select("id", { count: "exact", head: true })
      .eq("musician_id", user.id)
      .is("rating_id", null),
    supabase
      .from("confirmations")
      .select("id, invites!inner(gigs!inner(start_time))", {
        count: "exact",
        head: true,
      })
      .eq("musician_id", user.id)
      .eq("confirmed", true)
      .gte("invites.gigs.start_time", nowIso),
    supabase
      .from("confirmations")
      .select("id", { count: "exact", head: true })
      .eq("musician_id", user.id)
      .eq("confirmed", true),
  ]);

  const pendingInvites = pendingInvitesResult.count ?? 0;
  const gigsCount = gigsResult.count ?? 0;
  const pendingRatings = pendingRatingsResult.count ?? 0;
  const upcomingConfirmed = upcomingConfirmedResult.count ?? 0;
  const confirmedCount = confirmedResult.count ?? 0;

  const xp = confirmedCount * 150 + pendingInvites * 20;
  const levelSize = 1200;
  const level = Math.max(1, Math.floor(xp / levelSize) + 1);
  const progress = Math.min(100, Math.round(((xp % levelSize) / levelSize) * 100));

  return (
    <DashboardLayout fullWidth snapScroll>
      <div className="space-y-10 md:space-y-14">
        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="border border-white/60 bg-white/75">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-foreground/50">
                  <Rocket className="h-4 w-4 text-amber-500" />
                  Dashboard 2.0
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
                  Sua jornada musical em modo avancado
                </h1>
                <p className="text-sm text-foreground/60 max-w-2xl">
                  Tudo o que voce precisa para fechar mais gigs, aumentar sua
                  visibilidade e ganhar mais cache.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="btn-gradient">
                    <Link href={"/dashboard/gigs/new" as any}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar nova gig
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="bg-white/80 border-white/70"
                  >
                    <Link href={"/dashboard/gigs" as any}>Explorar gigs</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/60 bg-white/80">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-foreground/60">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Nivel {level}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {xp} XP
                    </p>
                    <p className="text-xs text-foreground/50">
                      {confirmedCount} gigs confirmadas
                    </p>
                  </div>
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>
                <div className="h-2 rounded-full bg-amber-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/60">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {pendingInvites > 0
                    ? "Responda convites para acelerar seu nivel."
                    : "Seu ritmo esta em dia. Continue ativo."}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <Star className="h-4 w-4 text-amber-500" />
                Seu perfil em destaque
              </div>
              <ProfileHeader />
              <div className="grid gap-4 md:grid-cols-2">
                <EnablePushNotificationsCard userId={user.id} />
                <PwaInstallGuideCard />
              </div>
            </div>
            <Card className="border border-white/60 bg-white/80">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <LineChart className="h-4 w-4 text-emerald-500" />
                  Resumo rapido
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/90 px-4 py-3">
                    <span>Convites pendentes</span>
                    <span className="font-semibold text-foreground">
                      {pendingInvites}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/90 px-4 py-3">
                    <span>Gigs criadas</span>
                    <span className="font-semibold text-foreground">
                      {gigsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/90 px-4 py-3">
                    <span>Avaliacoes pendentes</span>
                    <span className="font-semibold text-foreground">
                      {pendingRatings}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/90 px-4 py-3">
                    <span>Proximas confirmacoes</span>
                    <span className="font-semibold text-foreground">
                      {upcomingConfirmed}
                    </span>
                  </div>
                </div>
                <Button asChild className="btn-gradient w-full">
                  <Link href={"/dashboard/gigs" as any}>Abrir painel completo</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
              <Bell className="h-4 w-4 text-[#ff6b4a]" />
              Convites pendentes
            </div>
            <PendingInvites userId={user.id} />
          </div>
        </section>

        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Proximas confirmacoes
              </div>
              <UpcomingConfirmedGigs userId={user.id} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                Avaliacoes pendentes
              </div>
              <CompletedGigsToRate userId={user.id} />
            </div>
          </div>
        </section>

        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
              <Wallet className="h-4 w-4 text-emerald-500" />
              Crescimento financeiro
            </div>
            <Card className="border border-white/60 bg-white/80">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground/70">
                    Metas, ganhos e previsoes do seu proximo ciclo.
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    Veja tendencias, caches e oportunidades para subir de nivel.
                  </p>
                </div>
                <Button asChild className="btn-gradient">
                  <Link href={"/dashboard/financeiro" as any}>
                    Ver financeiro
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Suas gigs
            </div>
            <GigsTabs userId={user.id} />
          </div>
        </section>

        <section className="snap-start snap-always w-full px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Beneficios e recompensas
              </div>
              <ReferralSystem />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Personalizacao
              </div>
              <ThemeSelector />
            </div>
          </div>
        </section>
      </div>
      <div className="fixed bottom-5 right-5 z-50">
        <Button asChild className="btn-gradient shadow-lg">
          <Link href={"/dashboard/gigs/new" as any}>
            <Plus className="mr-2 h-4 w-4" />
            Nova gig
          </Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
