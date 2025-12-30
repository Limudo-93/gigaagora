"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  UserCircle, 
  Mail, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PriorityAction = 
  | { type: "complete_profile"; progress: number }
  | { type: "respond_invites"; count: number }
  | { type: "view_gigs"; count: number }
  | { type: "rate_gigs"; count: number }
  | null;

export default function PriorityActionBlock({ userId }: { userId: string }) {
  const router = useRouter();
  const [action, setAction] = useState<PriorityAction>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determinePriorityAction = async () => {
      try {
        // 1. Verificar completude do perfil
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, phone_e164, city, state, photo_url")
          .eq("user_id", userId)
          .single();

        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("bio, instruments, genres")
          .eq("user_id", userId)
          .single();

        let profileProgress = 0;
        if (profile) {
          if (profile.display_name) profileProgress += 20;
          if (profile.phone_e164) profileProgress += 20;
          if (profile.city && profile.state) profileProgress += 20;
          if (profile.photo_url) profileProgress += 20;
          if (musicianProfile?.bio) profileProgress += 10;
          if (musicianProfile?.instruments?.length > 0) profileProgress += 10;
        }

        if (profileProgress < 100) {
          setAction({ type: "complete_profile", progress: profileProgress });
          setLoading(false);
          return;
        }

        // 2. Verificar convites pendentes
        const { count: pendingCount } = await supabase
          .from("invites")
          .select("*", { count: "exact", head: true })
          .eq("musician_id", userId)
          .eq("status", "pending");

        if (pendingCount && pendingCount > 0) {
          setAction({ type: "respond_invites", count: pendingCount });
          setLoading(false);
          return;
        }

        // 3. Verificar gigs para avaliar
        const { count: rateCount } = await supabase
          .from("confirmations")
          .select("*", { count: "exact", head: true })
          .eq("musician_id", userId)
          .is("rating_id", null);

        if (rateCount && rateCount > 0) {
          setAction({ type: "rate_gigs", count: rateCount });
          setLoading(false);
          return;
        }

        // 4. Verificar gigs disponíveis (simplificado - apenas contar)
        const { count: gigsCount } = await supabase
          .from("gigs")
          .select("*", { count: "exact", head: true })
          .eq("status", "published");

        if (gigsCount && gigsCount > 0) {
          setAction({ type: "view_gigs", count: gigsCount });
          setLoading(false);
          return;
        }

        setAction(null);
      } catch (error) {
        console.error("Error determining priority action:", error);
        setAction(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      determinePriorityAction();
    }
  }, [userId]);

  if (loading || !action) {
    return null;
  }

  const getActionConfig = () => {
    switch (action.type) {
      case "complete_profile":
        return {
          icon: <UserCircle className="h-6 w-6" />,
          title: "Complete seu perfil",
          description: `Seu perfil está ${action.progress}% completo. Perfis completos recebem até 3x mais convites.`,
          cta: "Completar agora",
          href: "/dashboard/perfil/edit",
          color: "from-orange-500 to-amber-500",
          bgColor: "bg-orange-50 border-orange-200",
        };
      case "respond_invites":
        return {
          icon: <Mail className="h-6 w-6" />,
          title: `${action.count} ${action.count === 1 ? "convite aguardando" : "convites aguardando"}`,
          description: "Responda rapidamente para não perder oportunidades. Músicos que respondem rápido recebem mais convites.",
          cta: "Ver convites",
          href: "/dashboard/gigs",
          color: "from-blue-500 to-cyan-500",
          bgColor: "bg-blue-50 border-blue-200",
        };
      case "rate_gigs":
        return {
          icon: <CheckCircle2 className="h-6 w-6" />,
          title: `Avalie ${action.count} ${action.count === 1 ? "gig concluída" : "gigs concluídas"}`,
          description: "Suas avaliações ajudam outros músicos e melhoram a qualidade da plataforma.",
          cta: "Avaliar agora",
          href: "/dashboard",
          color: "from-green-500 to-emerald-500",
          bgColor: "bg-green-50 border-green-200",
        };
      case "view_gigs":
        return {
          icon: <Sparkles className="h-6 w-6" />,
          title: `${action.count} ${action.count === 1 ? "gig disponível" : "gigs disponíveis"}`,
          description: "Novas oportunidades esperando por você. Explore e encontre o trabalho ideal.",
          cta: "Ver gigs",
          href: "/dashboard/gigs",
          color: "from-purple-500 to-pink-500",
          bgColor: "bg-purple-50 border-purple-200",
        };
    }
  };

  const config = getActionConfig();

  return (
    <Card className={`${config.bgColor} border-2 shadow-lg hover:shadow-xl transition-shadow`}>
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          {/* Ícone com gradiente */}
          <div className={`relative shrink-0`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${config.color} rounded-xl blur-md opacity-30`} />
            <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg`}>
              {config.icon}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Próxima ação recomendada
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {config.description}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              asChild
              className={`bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-semibold shadow-md hover:shadow-lg transition-all`}
              size="lg"
            >
              <Link href={config.href as any}>
                {config.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

