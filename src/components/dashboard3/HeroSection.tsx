"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trophy, Medal, Gem, Star, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProfileCard from "./ProfileCard";
import SearchRadiusCard from "./SearchRadiusCard";

interface UserRanking {
  total_points: number;
  completed_challenges: number;
  current_tier: "bronze" | "silver" | "gold" | "platinum";
  tier_progress_percentage: number;
}

const TIER_CONFIG = {
  bronze: {
    label: "Bronze",
    icon: <Medal className="h-6 w-6" />,
    gradient: "from-amber-500 via-orange-500 to-amber-600",
  },
  silver: {
    label: "Prata",
    icon: <Medal className="h-6 w-6" />,
    gradient: "from-gray-400 via-gray-500 to-gray-600",
  },
  gold: {
    label: "Ouro",
    icon: <Trophy className="h-6 w-6" />,
    gradient: "from-yellow-400 via-yellow-500 to-yellow-600",
  },
  platinum: {
    label: "Platina",
    icon: <Gem className="h-6 w-6" />,
    gradient: "from-teal-400 via-cyan-500 to-emerald-500",
  },
};

export default function HeroSection({ userId }: { userId: string }) {
  const [ranking, setRanking] = useState<UserRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState(0);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: rankingData } = await supabase
        .from("user_rankings")
        .select("*")
        .eq("user_id", userId)
        .single();

      setRanking(rankingData || null);

      const { count } = await supabase
        .from("invites")
        .select("*", { count: "exact", head: true })
        .eq("musician_id", userId)
        .eq("status", "pending");

      setPendingInvites(count || 0);
    } catch (error) {
      console.error("Error loading hero data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start snap-always pt-20">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </section>
    );
  }

  const tierInfo = ranking
    ? TIER_CONFIG[ranking.current_tier]
    : TIER_CONFIG.bronze;

  const HeroContent = () => (
    <Card className="border-2 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl shadow-2xl overflow-hidden h-full">
      <CardContent className="p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Tier & Stats */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Seu Nível
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`relative p-4 rounded-2xl bg-gradient-to-br ${tierInfo.gradient} text-white shadow-lg`}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl" />
                  <div className="relative">{tierInfo.icon}</div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    {tierInfo.label}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {ranking?.total_points || 0} pontos
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Progresso para próximo nível
                </span>
                <span className="font-semibold">
                  {ranking?.tier_progress_percentage.toFixed(0) || 0}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${tierInfo.gradient} transition-all duration-1000 ease-out`}
                  style={{
                    width: `${Math.min(ranking?.tier_progress_percentage || 0, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    Desafios
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {ranking?.completed_challenges || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">
                    Pendentes
                  </span>
                </div>
                <p className="text-2xl font-bold">{pendingInvites}</p>
              </div>
            </div>
          </div>

          {/* Right: Visual Element & CTA */}
          <div className="space-y-6 text-center md:text-right">
            <div className="relative">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tierInfo.gradient} opacity-20 blur-3xl rounded-full`}
              />
              <div className="relative p-12">
                <div className="text-8xl opacity-20">{tierInfo.icon}</div>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                asChild
                size="lg"
                className={`bg-gradient-to-r ${tierInfo.gradient} text-white hover:opacity-90 shadow-lg`}
              >
                <Link href={"/dashboard/desafios" as any}>
                  Ver Desafios
                  <TrendingUp className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {pendingInvites > 0 && (
                <Button asChild variant="outline" size="lg">
                  <Link href={"/dashboard/gigs" as any}>
                    Responder Convites ({pendingInvites})
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="min-h-screen flex items-center justify-center px-4 snap-start snap-always pt-20">
      <div className="max-w-7xl w-full space-y-8">
        {/* Desktop: Grid com ProfileCard e SearchRadius no lado direito */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Left: Main Hero (2 columns) */}
          <div className="lg:col-span-2">
            <HeroContent />
          </div>
          {/* Right: ProfileCard and SearchRadius (1 column) */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileCard userId={userId} />
            <SearchRadiusCard userId={userId} />
          </div>
        </div>

        {/* Mobile: Stack vertical */}
        <div className="lg:hidden space-y-6">
          <HeroContent />
          <ProfileCard userId={userId} />
          <SearchRadiusCard userId={userId} />
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center animate-bounce">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs">Role para mais</span>
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}