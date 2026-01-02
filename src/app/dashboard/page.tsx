import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import EnablePushNotificationsCard from "@/components/push-notifications/EnablePushNotificationsCard";
import PwaInstallGuideCard from "@/components/dashboard/PwaInstallGuideCard";
import MissionProgressCard from "@/components/dashboard/MissionProgressCard";
import GamificationStats from "@/components/dashboard/GamificationStats";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardLayout fullWidth>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Hero Section com Stats Gamificados - Mobile: Stack, Desktop: Side by side */}
        <section className="px-4 md:px-0">
          <div className="space-y-4 md:space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Bem-vindo de volta! 🎵
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Acompanhe seu progresso e continue crescendo na plataforma
              </p>
            </div>
            <GamificationStats userId={user.id} />
          </div>
        </section>

        {/* Ação Prioritária - Full width no mobile, destaque no desktop */}
        <section className="px-4 md:px-0">
          <PriorityActionBlock userId={user.id} />
        </section>

        {/* Alertas e Notificações - Grid responsivo */}
        <section className="px-4 md:px-0">
          <CancellationAlertCard userId={user.id} />
        </section>

        {/* Convites Pendentes - Destaque */}
        <section className="px-4 md:px-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Convites pendentes
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Responda rápido para aumentar suas chances de fechar shows
              </p>
            </div>
            <PendingInvites userId={user.id} />
          </div>
        </section>

        {/* Grid Principal - Desktop: 2 colunas, Mobile: Stack */}
        <div className="px-4 md:px-0 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Próximas Confirmações */}
          <section className="md:col-span-1 lg:col-span-1">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Próximas confirmações
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Shows confirmados nos próximos dias
                </p>
              </div>
              <UpcomingConfirmedGigs userId={user.id} />
            </div>
          </section>

          {/* Avaliações Pendentes */}
          <section className="md:col-span-1 lg:col-span-1">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Avaliações pendentes
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Avalie gigs concluídas e ajude a comunidade
                </p>
              </div>
              <CompletedGigsToRate userId={user.id} />
            </div>
          </section>

          {/* Missões e Progresso - Full width no mobile, 1 coluna no desktop */}
          <section className="md:col-span-2 lg:col-span-1">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Sua jornada
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete desafios e suba de nível
                </p>
              </div>
              <MissionProgressCard />
            </div>
          </section>
        </div>

        {/* Perfil e Configurações - Grid responsivo */}
        <div className="px-4 md:px-0 grid gap-6 md:grid-cols-2">
          {/* Perfil */}
          <section>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Seu perfil
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Mantenha seu perfil atualizado para receber mais convites
                </p>
              </div>
              <ProfileHeader />
            </div>
          </section>

          {/* Configurações */}
          <section>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Configurações
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Personalize sua experiência na plataforma
                </p>
              </div>
              <div className="space-y-4">
                <EnablePushNotificationsCard userId={user.id} />
                <PwaInstallGuideCard />
                <ThemeSelector />
              </div>
            </div>
          </section>
        </div>

        {/* Gigs - Full width */}
        <section className="px-4 md:px-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Suas gigs
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie todas as suas oportunidades e shows
              </p>
            </div>
            <GigsTabs userId={user.id} />
          </div>
        </section>

        {/* Recompensas e Referências - Grid responsivo */}
        <section className="px-4 md:px-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Benefícios e recompensas
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Convide amigos e ganhe recompensas
              </p>
            </div>
            <ReferralSystem />
          </div>
        </section>

        {/* Footer Info */}
        <section className="px-4 md:px-0 pb-8">
          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
              <div className="relative h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <svg
                  className="h-3 w-3 text-primary-foreground"
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

      {/* Botão Flutuante Nova Gig - Mobile: Bottom Center, Desktop: Bottom Right */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <Button
          asChild
          size="lg"
          className="btn-gradient shadow-lg hover:shadow-xl transition-all rounded-full h-12 w-12 md:h-auto md:w-auto md:rounded-lg"
        >
          <Link href={"/dashboard/gigs/new" as any}>
            <Plus className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Nova gig</span>
          </Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}