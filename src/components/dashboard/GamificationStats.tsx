"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trophy, Medal, Gem, Star, Target, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface UserRanking {
  total_points: number;
  completed_challenges: number;
  current_tier: "bronze" | "silver" | "gold" | "platinum";
  tier_points: number;
  tier_progress_percentage: number;
}

const TIER_CONFIG: Record<
  "bronze" | "silver" | "gold" | "platinum",
  {
    label: string;
    icon: React.ReactNode;
    gradient: string;
    bgGradient: string;
    color: string;
  }
> = {
  bronze: {
    label: "Bronze",
    icon: <Medal className="h-5 w-5" />,
    gradient: "from-amber-600 to-amber-800",
    bgGradient: "from-amber-50 to-amber-100",
    color: "text-amber-700",
  },
  silver: {
    label: "Prata",
    icon: <Medal className="h-5 w-5" />,
    gradient: "from-gray-400 to-gray-600",
    bgGradient: "from-gray-50 to-gray-100",
    color: "text-gray-700",
  },
  gold: {
    label: "Ouro",
    icon: <Trophy className="h-5 w-5" />,
    gradient: "from-yellow-500 to-yellow-700",
    bgGradient: "from-yellow-50 to-yellow-100",
    color: "text-yellow-700",
  },
  platinum: {
    label: "Platina",
    icon: <Gem className="h-5 w-5" />,
    gradient: "from-teal-500 via-cyan-500 to-emerald-500",
    bgGradient: "from-teal-50 via-cyan-50 to-emerald-50",
    color: "text-teal-700",
  },
};

export default function GamificationStats({ userId }: { userId: string }) {
  const [ranking, setRanking] = useState<UserRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState(0);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Carregar ranking
      const { data: rankingData } = await supabase
        .from("user_rankings")
        .select("*")
        .eq("user_id", userId)
        .single();

      setRanking(rankingData || null);

      // Carregar convites pendentes
      const { count: invitesCount } = await supabase
        .from("invites")
        .select("*", { count: "exact", head: true })
        .eq("musician_id", userId)
        .eq("status", "pending");

      setPendingInvites(invitesCount || 0);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const tierInfo = ranking
    ? TIER_CONFIG[ranking.current_tier]
    : TIER_CONFIG.bronze;

  const stats = [
    {
      label: "Tier",
      value: tierInfo.label,
      icon: tierInfo.icon,
      gradient: tierInfo.gradient,
      bgGradient: tierInfo.bgGradient,
      color: tierInfo.color,
      href: "/dashboard/desafios",
    },
    {
      label: "Pontos",
      value: ranking?.total_points || 0,
      icon: <Star className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      color: "text-purple-700",
      href: "/dashboard/desafios",
    },
    {
      label: "Desafios",
      value: `${ranking?.completed_challenges || 0} completos`,
      icon: <Target className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      color: "text-blue-700",
      href: "/dashboard/desafios",
    },
  ];

  // Mobile: stack vertical, Desktop: grid horizontal
  return (
    <div className="space-y-4">
      {/* Stats principais - grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <Link
            key={index}
            href={stat.href as any}
            className="block group"
          >
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`relative shrink-0 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 text-white shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {stat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-lg md:text-xl font-bold ${stat.color} truncate`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Progresso do tier - apenas desktop */}
      {ranking && (
        <Card className="hidden md:block border-2 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-lg bg-gradient-to-br ${tierInfo.gradient} p-1.5 text-white`}
                >
                  {tierInfo.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Progresso para próximo tier
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tierInfo.label} • {ranking.tier_progress_percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
              <Link
                href={"/dashboard/desafios" as any}
                className="text-xs font-medium text-primary hover:underline"
              >
                Ver detalhes
              </Link>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${tierInfo.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(ranking.tier_progress_percentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ação rápida - mobile friendly */}
      {pendingInvites > 0 && (
        <div className="md:hidden">
          <Link href={"/dashboard/gigs" as any}>
            <Card className="border-2 border-orange-200 bg-orange-50/80 backdrop-blur-sm hover:border-orange-300 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 text-white">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-orange-700">
                      {pendingInvites} {pendingInvites === 1 ? "convite pendente" : "convites pendentes"}
                    </p>
                    <p className="text-xs text-orange-600/80 mt-0.5">
                      Toque para responder agora
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
