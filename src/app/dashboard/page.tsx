import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bell, Calendar, CheckCircle2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import PriorityActionBlock from "@/components/dashboard/PriorityActionBlock";
import CancellationAlertCard from "@/components/dashboard/CancellationAlertCard";
import GigsTabs from "@/components/dashboard/GigsTabs";
import PendingInvites from "@/components/dashboard/PendingInvites";
import UpcomingConfirmedGigs from "@/components/dashboard/UpcomingConfirmedGigs";
import CompletedGigsToRate from "@/components/dashboard/CompletedGigsToRate";
import ReferralSystem from "@/components/dashboard/ReferralSystem";
import ThemeSelector from "@/components/dashboard/ThemeSelector";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import { Button } from "@/components/ui/button";
import EnablePushNotificationsCard from "@/components/push-notifications/EnablePushNotificationsCard";
import PwaInstallGuideCard from "@/components/dashboard/PwaInstallGuideCard";
import MissionProgressCard from "@/components/dashboard/MissionProgressCard";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardLayout fullWidth snapScroll>
      <div className="space-y-10 md:space-y-12">
        <section className="max-w-6xl mx-auto">
          <Card className="border border-white/60 bg-white/75">
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                    Dashboard 2.0
                  </p>
                  <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
                    Tudo o que importa, organizado para voce fechar mais gigs
                  </h1>
                  <p className="text-sm text-foreground/60">
                    Acompanhe convites, gigs confirmadas e seu desempenho em um
                    so lugar.
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
                      <Link href={"/dashboard/gigs" as any}>Ver gigs</Link>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      Foco do dia
                    </p>
                    <PriorityActionBlock userId={user.id} />
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-foreground/60">
                      Progresso
                    </p>
                    <MissionProgressCard />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Perfil e destaque
          </div>
          <ProfileHeader />
          <div className="grid gap-6 lg:grid-cols-2">
            <EnablePushNotificationsCard userId={user.id} />
            <PwaInstallGuideCard />
          </div>
        </section>

        <section className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
            <Bell className="h-4 w-4 text-[#ff6b4a]" />
            Convites pendentes
          </div>
          <PendingInvites userId={user.id} />
        </section>

        <section className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-2">
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
        </section>

        <section className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Suas gigs
          </div>
          <GigsTabs userId={user.id} />
        </section>

        <section className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-2">
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
            <WelcomeCard />
          </div>
        </section>

        <section className="max-w-6xl mx-auto space-y-4">
          <CancellationAlertCard userId={user.id} />
          <Card className="border border-white/60 bg-white/75">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                <div className="relative h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                  <svg
                    className="h-4 w-4 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Seus dados estao protegidos
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Informacoes de contato so sao compartilhadas em gigs
                  confirmadas.
                </p>
              </div>
            </CardContent>
          </Card>
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
