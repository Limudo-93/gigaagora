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
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    icon: <Star className="h-4 w-4" />
  },
  hard: { 
    label: 'Difícil', 
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    icon: <Medal className="h-4 w-4" />
  },
  expert: { 
    label: 'Expert', 
    color: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
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
    color: 'text-purple-500',
    gradient: 'from-purple-400 via-pink-400 to-purple-600',
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando desafios...</span>
        </div>
      </DashboardLayout>
    );
  }

  const tierInfo = ranking ? TIER_CONFIG[ranking.current_tier] : TIER_CONFIG.bronze;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Desafios</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Complete desafios, ganhe pontos e suba de ranking!
          </p>
        </div>

        {/* Card de Ranking */}
        {ranking && (
          <Card className="border-border bg-card overflow-hidden">
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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">Completos</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs sm:text-sm">Em Progresso</TabsTrigger>
            <TabsTrigger value="not_started" className="text-xs sm:text-sm">Novos</TabsTrigger>
            <TabsTrigger value="easy" className="text-xs sm:text-sm">Fácil</TabsTrigger>
            <TabsTrigger value="hard" className="text-xs sm:text-sm">Difícil</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge) => {
                const achievement = getAchievementForChallenge(challenge.id);
                // Verificar se está completo: deve ter achievement, completed_at não nulo, e progress >= requirement
                const isCompleted = achievement?.completed_at !== null && 
                                   achievement.completed_at !== undefined &&
                                   challenge.requirement_value !== null &&
                                   achievement.progress >= (challenge.requirement_value || 0);
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
              <Card className="border-border bg-card">
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

