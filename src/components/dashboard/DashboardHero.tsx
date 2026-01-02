"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CollapsibleInfoCard from "@/components/dashboard/CollapsibleInfoCard";
import TestNotificationButton from "@/components/dashboard/TestNotificationButton";

const STORAGE_KEY = "dashboard_hero_dismissed";

export default function DashboardHero() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setHidden(true);
    }
  }, []);

  const handleDismiss = () => {
    setHidden(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  if (hidden) return null;

  return (
    <section className="snap-start snap-always">
      <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/70 px-6 py-8 md:px-8 md:py-9 shadow-sm max-w-6xl mx-auto">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-30 h-9 w-9 rounded-full bg-white/90 border border-white/70 text-foreground flex items-center justify-center hover:bg-white shadow-sm"
          aria-label="Fechar destaque do dashboard"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
              Seu palco começa aqui
            </p>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              Tudo organizado para você fechar mais gigs
            </h1>
            <p className="text-sm text-foreground/60 max-w-2xl">
              Veja o que precisa de atenção, responda convites rápido e mantenha
              seu perfil forte para subir no ranking.
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
  );
}
