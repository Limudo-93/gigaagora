"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Flame, Sparkles, Target } from "lucide-react";
import { useState } from "react";

export default function MissionProgressCard() {
  const [open, setOpen] = useState(true);

  return (
    <Card className="border border-white/70 bg-white/80 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Sparkles className="h-4 w-4" />
            Sua jornada
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Ocultar card" : "Expandir card"}
          >
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {open ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <h3 className="text-xl font-display font-semibold text-foreground">
                Nível Explorador • progresso 62%
              </h3>
              <p className="text-sm text-foreground/60">
                Complete seu perfil e responda convites rápido para subir de
                nível e aparecer primeiro nas buscas.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                  <Target className="h-3 w-3 text-[#2aa6a1]" />
                  Missão do dia: responder 2 convites
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Sequência: 4 dias
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className="h-2 w-[62%] rounded-full bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1]" />
              </div>
            </div>
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  Próxima recompensa
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Destaque extra nas gigs por 7 dias
                </p>
                <p className="text-xs text-foreground/60 mt-1">
                  Faltam 2 ações para desbloquear.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="btn-gradient text-white" asChild>
                  <Link href="/dashboard/perfil/edit">Completar perfil</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/70 bg-white/80"
                  asChild
                >
                  <Link href="/dashboard/gigs">Ver missões</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/60 mt-3">
            Nível Explorador • progresso 62%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
