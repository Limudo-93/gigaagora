"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Star, Medal, Gem, Crown, Zap, Flame, 
  CheckCircle2, Circle, Loader2, TrendingUp, Award
} from "lucide-react";

type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
type RankingTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  points: number;
  category: string;
  icon_name: string | null;
  requirement_type: string;
  requirement_value: number | null;
}

interface Achievement {
  id: string;
  challenge_id: string;
  progress: number;
  completed_at: string | null;
  times_completed: number;
  challenges: Challenge;
}

interface UserRanking {
  total_points: number;
  completed_challenges: number;
  current_tier: RankingTier;
  tier_points: number;
  tier_progress_percentage: number;
}

const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { label: string; color: string; icon: React.ReactNode }> = {
  easy: { 
    label: 'Fácil', 
    color: 'bg-green-500/10 text-green-700 border-green-500/20',
    icon: <Circle className="h-4 w-4" />
  },
  medium: { 
    label: 'Médio', 
    color: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    icon: <Star className="h-4 w-4" />
  },
  hard: { 
    label: 'Difícil', 
    color: 'bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/30',
    icon: <Medal className="h-4 w-4" />
  },
  expert: { 
    label: 'Expert', 
    color: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
    icon: <Crown className="h-4 w-4" />
  },
};

const TIER_CONFIG: Record<RankingTier, { label: string; color: string; gradient: string; icon: React.ReactNode; minPoints: number; maxPoints: number }> = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    gradient: 'from-amber-500 to-amber-700',
    icon: <Medal className="h-6 w-6" />,
    minPoints: 0,
    maxPoints: 1000
  },
  silver: {
    label: 'Prata',
    color: 'text-gray-400',
    gradient: 'from-gray-400 to-gray-500',
    icon: <Medal className="h-6 w-6" />,
    minPoints: 1000,
    maxPoints: 5000
  },
  gold: {
    label: 'Ouro',
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: <Trophy className="h-6 w-6" />,
    minPoints: 5000,
    maxPoints: 10000
  },
  platinum: {
    label: 'Platina',
    color: 'text-teal-500',
    gradient: 'from-teal-400 via-cyan-400 to-emerald-500',
    icon: <Gem className="h-6 w-6" />,
    minPoints: 10000,
    maxPoints: 999999
  },
};

export default function DesafiosPage() {
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [ranking, setRanking] = useState<UserRanking | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar desafios
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("difficulty", { ascending: true })
        .order("points", { ascending: false });

      // Carregar conquistas
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select(`
          *,
          challenges (*)
        `)
        .eq("user_id", user.id);

      // Carregar ranking
      const { data: rankingData } = await supabase
        .from("user_rankings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setChallenges(challengesData || []);
      setAchievements(achievementsData || []);
      setRanking(rankingData || null);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementForChallenge = (challengeId: string): Achievement | undefined => {
    return achievements.find(a => a.challenge_id === challengeId);
  };

  const getProgressPercentage = (achievement: Achievement | undefined, challenge: Challenge): number => {
    if (!achievement || !challenge.requirement_value) return 0;
    return Math.min((achievement.progress / challenge.requirement_value) * 100, 100);
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") {
      const achievement = getAchievementForChallenge(challenge.id);
      return achievement?.completed_at !== null;
    }
    if (activeTab === "in_progress") {
      const achievement = getAchievementForChallenge(challenge.id);
      return achievement && achievement.completed_at === null && achievement.progress > 0;
    }
    if (activeTab === "not_started") {
      const achievement = getAchievementForChallenge(challenge.id);
      return !achievement || achievement.progress === 0;
    }
    return challenge.difficulty === activeTab;
  });

  if (loading) {
    return (
      <DashboardLayout fullWidth>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando desafios...</span>
        </div>
      </DashboardLayout>
    );
  }

  const tierInfo = ranking ? TIER_CONFIG[ranking.current_tier] : TIER_CONFIG.bronze;

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -top-24 -right-20 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-60 w-60 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">Central de desafios</p>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">Desafios</h1>
            <p className="text-sm sm:text-base text-foreground/60 mt-2 max-w-2xl">
              Complete desafios, ganhe pontos e suba de ranking. Quem mantém sequência recebe mais convites.
            </p>
          </div>
        </div>

        {/* Card de Próximo Desafio Recomendado */}
        {(() => {
          // Encontrar o próximo desafio mais fácil de completar
          const nextEasyChallenge = challenges
            .map(challenge => {
              const achievement = getAchievementForChallenge(challenge.id);
              const isCompleted = achievement !== undefined &&
                achievement?.completed_at !== null &&
                challenge.requirement_value !== null &&
                (achievement?.progress || 0) >= (challenge.requirement_value || 0);
              
              if (isCompleted) return null;
              
              const progress = getProgressPercentage(achievement, challenge);
              const remaining = challenge.requirement_value 
                ? Math.max(0, challenge.requirement_value - (achievement?.progress || 0))
                : challenge.requirement_value || 0;
              
              return {
                challenge,
                achievement,
                progress,
                remaining,
                difficulty: challenge.difficulty === 'easy' ? 1 : challenge.difficulty === 'medium' ? 2 : challenge.difficulty === 'hard' ? 3 : 4
              };
            })
            .filter(Boolean)
            .sort((a, b) => {
              // Priorizar: fácil > progresso alto > pontos
              if (a!.difficulty !== b!.difficulty) return a!.difficulty - b!.difficulty;
              if (a!.progress !== b!.progress) return b!.progress - a!.progress;
              return b!.challenge.points - a!.challenge.points;
            })[0];

          if (!nextEasyChallenge) return null;

          const { challenge, achievement, progress, remaining } = nextEasyChallenge;
          const difficulty = DIFFICULTY_CONFIG[challenge.difficulty];

          return (
            <Card className="card-glass border border-white/70 bg-gradient-to-br from-amber-50/80 to-teal-50/80 shadow-lg">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md" />
                    <div className="relative h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                      {difficulty.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Próximo desafio recomendado
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {challenge.description}
                    </p>
                    
                    {progress > 0 && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progresso</span>
                          <span className="font-semibold text-foreground">
                            {achievement?.progress || 0} / {challenge.requirement_value}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Faltam {remaining} para completar
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {challenge.points} pontos
                        </span>
                      </div>
                      <Badge className={difficulty.color}>
                        {difficulty.label}
                      </Badge>
                    </div>

                    <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs text-foreground leading-relaxed">
                        <strong>💡 Por que completar?</strong> Músicos que completam desafios aparecem mais no topo das buscas e recebem até <strong>40% mais convites</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Card de Ranking */}
        {ranking && (
          <Card className="card-glass overflow-hidden">
            <div className={`bg-gradient-to-r ${tierInfo.gradient} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {tierInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Ranking {tierInfo.label}</h2>
                    <p className="text-sm sm:text-base opacity-90 mt-1">
                      {ranking.total_points.toLocaleString()} pontos • {ranking.completed_challenges} conquistas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-bold">{ranking.tier_progress_percentage.toFixed(0)}%</div>
                  <div className="text-xs sm:text-sm opacity-90">Progresso no tier</div>
                </div>
              </div>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>Progresso para próximo tier</span>
                  <span>{ranking.tier_points} / {tierInfo.maxPoints - tierInfo.minPoints} pontos</span>
                </div>
                <Progress value={ranking.tier_progress_percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  {Object.values(TIER_CONFIG).map((tier, idx) => (
                    <div key={tier.label} className="text-center">
                      <div className={`font-semibold ${ranking.current_tier === tier.label ? tier.color : ''}`}>
                        {tier.label}
                      </div>
                      <div className="text-[10px]">{tier.minPoints.toLocaleString()}+</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-white/80 border border-white/70 rounded-2xl p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Todos</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Completos</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Em Progresso</TabsTrigger>
            <TabsTrigger value="not_started" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Novos</TabsTrigger>
            <TabsTrigger value="easy" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Fácil</TabsTrigger>
            <TabsTrigger value="hard" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Difícil</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge) => {
                const achievement = getAchievementForChallenge(challenge.id);
                // Verificar se está completo: deve ter achievement, completed_at não nulo, e progress >= requirement
                const isCompleted = achievement !== undefined &&
                                   achievement?.completed_at !== null &&
                                   achievement?.completed_at !== undefined &&
                                   challenge.requirement_value !== null &&
                                   (achievement?.progress || 0) >= (challenge.requirement_value || 0);
                const progress = getProgressPercentage(achievement, challenge);
                const difficulty = DIFFICULTY_CONFIG[challenge.difficulty];

                return (
                  <Card 
                    key={challenge.id} 
                    className={`border-border bg-card transition-all hover:shadow-lg ${
                      isCompleted ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : (
                            <div className="h-5 w-5 shrink-0">{difficulty.icon}</div>
                          )}
                          <CardTitle className="text-sm sm:text-base font-semibold text-foreground truncate">
                            {challenge.title}
                          </CardTitle>
                        </div>
                        <Badge className={`${difficulty.color} text-xs shrink-0`}>
                          {difficulty.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {challenge.description}
                      </p>
                      
                      {!isCompleted && challenge.requirement_value && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso</span>
                            <span>
                              {achievement?.progress || 0} / {challenge.requirement_value}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}

                      {isCompleted && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completado!</span>
                          {achievement?.times_completed && achievement.times_completed > 1 && (
                            <span className="text-muted-foreground">
                              ({achievement.times_completed}x)
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary">
                          <Award className="h-4 w-4" />
                          <span>{challenge.points} pontos</span>
                        </div>
                        {challenge.category && (
                          <Badge variant="outline" className="text-xs">
                            {challenge.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredChallenges.length === 0 && (
              <Card className="card-glass">
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Nenhum desafio encontrado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tente selecionar outra categoria
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

