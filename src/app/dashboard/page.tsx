import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bell, Plus, Sparkles } from "lucide-react";
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
import TestNotificationButton from "@/components/dashboard/TestNotificationButton";
import CollapsibleInfoCard from "@/components/dashboard/CollapsibleInfoCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardLayout fullWidth snapScroll>
      <div className="space-y-10 md:space-y-12">
        <section className="snap-start snap-always">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/70 px-6 py-8 md:px-8 md:py-9 shadow-sm max-w-6xl mx-auto">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-center">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                  Seu palco começa aqui
                </p>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
                  Tudo organizado para você fechar mais gigs
                </h1>
                <p className="text-sm text-foreground/60 max-w-2xl">
                  Veja o que precisa de atenção, responda convites rápido e
                  mantenha seu perfil forte para subir no ranking.
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
                    <Link href={"/dashboard/gigs" as any}>Ver minhas gigs</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4">
                <CollapsibleInfoCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Missões ativas"
                  description="Complete etapas e desbloqueie destaque nos resultados."
                />
                <CollapsibleInfoCard
                  icon={<Bell className="h-5 w-5" />}
                  title="Teste suas notificações"
                  description="Elas garantem resposta rápida e aumentam suas chances de fechar shows."
                  iconWrapperClassName="bg-teal-100 text-teal-700"
                >
                  <TestNotificationButton />
                </CollapsibleInfoCard>
              </div>
            </div>
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Seu perfil em destaque
              </h2>
              <p className="text-sm text-foreground/60">
                Atualize sua vitrine para receber mais convites.
              </p>
            </div>
            <ProfileHeader />
            <div className="grid gap-6 lg:grid-cols-2">
              <EnablePushNotificationsCard userId={user.id} />
              <PwaInstallGuideCard />
            </div>
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Foco de hoje
                </h2>
                <p className="text-sm text-foreground/60">
                  Próximo passo recomendado para destravar sua agenda.
                </p>
              </div>
              <PriorityActionBlock userId={user.id} />
              <MissionProgressCard />
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Boas-vindas e atalhos
                </h2>
                <p className="text-sm text-foreground/60">
                  Ajustes rápidos e novidades do seu perfil.
                </p>
              </div>
              <WelcomeCard />
            </div>
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="max-w-6xl mx-auto space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Convites pendentes
              </h2>
              <p className="text-sm text-foreground/60">
                Responda rápido para aumentar suas chances de fechar shows.
              </p>
            </div>
            <PendingInvites userId={user.id} />
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Próximas confirmações
              </h2>
              <UpcomingConfirmedGigs userId={user.id} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Avaliações pendentes
              </h2>
              <CompletedGigsToRate userId={user.id} />
            </div>
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="max-w-6xl mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Suas gigs</h2>
            <GigsTabs userId={user.id} />
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Benefícios e recompensas
              </h2>
              <ReferralSystem />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Personalize sua experiência
              </h2>
              <ThemeSelector />
            </div>
          </div>
        </section>

        <section className="snap-start snap-always">
          <div className="rounded-2xl border border-border backdrop-blur-xl bg-card/80 p-5 flex items-start gap-4 shadow-lg max-w-6xl mx-auto">
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
                Seus dados estão protegidos
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Informações de contato só são compartilhadas em gigs confirmadas.
              </p>
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
