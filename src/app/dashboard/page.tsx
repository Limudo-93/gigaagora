import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";

import DashboardLayoutWithSidebar from "@/components/dashboard/DashboardLayoutWithSidebar";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileCompletion from "@/components/dashboard/ProfileCompletion";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardLayoutWithSidebar>
      {/* Card de Boas-vindas - Primeira vez */}
      <WelcomeCard />

      {/* 🎯 Bloco de Ação Prioritária - Topo do dashboard */}
      <PriorityActionBlock userId={user.id} />

      {/* Mobile: Header compacto primeiro */}
      <div className="md:hidden">
        <ProfileHeader />
      </div>

      {/* Desktop: Header normal */}
      <div className="hidden md:block">
        <ProfileHeader />
      </div>

      {/* Profile Completion - sempre visível mas mais compacto em mobile */}
      <div className="md:hidden -mt-4 mb-4">
        <ProfileCompletion />
      </div>
      <div className="hidden md:block">
        <ProfileCompletion />
      </div>

      {/* ✅ PRIORIDADE 1: Alertas de Cancelamento (urgente) */}
      <CancellationAlertCard userId={user.id} />

      {/* ✅ PRIORIDADE 2: Convites Pendentes (ação necessária) */}
      <PendingInvites userId={user.id} />

      {/* ✅ PRIORIDADE 3: Próximas Gigs Confirmadas (informação importante) */}
      <UpcomingConfirmedGigs userId={user.id} />

      {/* ✅ PRIORIDADE 4: Gigs Concluídas - Avaliar (ação necessária) */}
      <CompletedGigsToRate userId={user.id} />

      {/* ✅ PRIORIDADE 5: "Meus Gigs" (menos urgente) */}
      <GigsTabs userId={user.id} />

      {/* ✅ PRIORIDADE 6: Sistema de Indicação (secundário) */}
      <div className="hidden md:block">
        <ReferralSystem />
      </div>

      {/* ✅ PRIORIDADE 7: Seletor de Tema (secundário) */}
      <div className="hidden md:block">
        <ThemeSelector />
      </div>

      {/* Mobile: Sistema de Indicação e Tema em seção colapsável */}
      <div className="md:hidden space-y-4">
        <ReferralSystem />
        <ThemeSelector />
      </div>

      {/* Banner de Proteção de Dados - apenas desktop */}
      <div className="hidden md:block mt-6 rounded-2xl border border-border backdrop-blur-xl bg-card/80 p-5 flex items-start gap-4 shadow-lg">
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
    </DashboardLayoutWithSidebar>
  );
}
