"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trophy, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Challenge {
  id: string;
  name: string;
  description: string;
  points: number;
  difficulty: string;
  requirement_value: number | null;
}

interface Achievement {
  id: string;
  challenge_id: string;
  progress: number;
  completed_at: string | null;
  challenges: Challenge;
}

export default function ProgressSection({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_achievements")
        .select(
          `
          *,
          challenges (*)
        `
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(6);

      setAchievements(data || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (achievement: Achievement): number => {
    if (!achievement.challenges.requirement_value) return 0;
    return Math.min(
      (achievement.progress / achievement.challenges.requirement_value) * 100,
      100
    );
  };

  const completedCount = achievements.filter((a) => a.completed_at).length;
  const inProgress = achievements.filter(
    (a) => !a.completed_at && a.progress > 0
  );

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start snap-always">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-4 snap-start snap-always py-12">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Seu Progresso
          </h2>
          <p className="text-muted-foreground">
            Acompanhe suas conquistas e desafios em andamento
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 text-white">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-3xl font-bold text-yellow-700">
                    {completedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Progresso</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {inProgress.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {achievements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Desafios Recentes</h3>
            <Button asChild variant="outline" size="sm">
              <Link href={"/dashboard/desafios" as any}>
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {achievements.slice(0, 3).map((achievement) => {
              const progress = getProgressPercentage(achievement);
              const isCompleted = !!achievement.completed_at;

              return (
                <Card
                  key={achievement.id}
                  className={`border-2 ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      : "bg-background border-border"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Target className="h-5 w-5 text-blue-600" />
                          )}
                          <div>
                            <h4 className="font-bold text-lg">
                              {achievement.challenges.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {achievement.challenges.description}
                            </p>
                          </div>
                        </div>

                        {!isCompleted && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Progresso
                              </span>
                              <span className="font-semibold">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-green-700">
                              ✓ Concluído
                            </span>
                            <span className="text-sm text-muted-foreground">
                              • {achievement.challenges.points} pontos
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {achievements.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum desafio iniciado ainda
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={"/dashboard/desafios" as any}>
                      Ver Desafios Disponíveis
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
