"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, User, Loader2 } from "lucide-react";
import RatingDialog from "@/components/dashboard/RatingDialog";

type RatingRow = {
  id: string;
  invite_id: string;
  gig_id: string;
  rater_type: "musician" | "contractor";
  rated_type: "musician" | "contractor";
  rating: number | null;
  comment: string | null;
  predefined_comments: string[] | null;
  is_public: boolean;
};


export default function AvaliacoesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<{
    inviteId: string;
    gigId: string;
    contractorId: string;
    musicianId: string;
    raterType: "musician" | "contractor";
    ratedType: "musician" | "contractor";
    ratedUserId: string;
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const loadRatings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar apenas avaliações PÚBLICAS onde o usuário é o AVALIADO
      // Isso garante consistência com as estatísticas do dashboard
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select(`
          id,
          invite_id,
          gig_id,
          rater_type,
          rated_type,
          rating,
          custom_comment,
          predefined_comments,
          created_at,
          is_public,
          musician_id,
          contractor_id,
          invites!inner(
            id,
            gig_id,
            musician_id,
            contractor_id,
            gigs!inner(
              id,
              title,
              start_time,
              location_name,
              city,
              state,
              gig_roles!inner(
                instrument
              )
            ),
            profiles_musician:profiles!invites_musician_id_fkey(
              display_name,
              photo_url
            ),
            profiles_contractor:profiles!invites_contractor_id_fkey(
              display_name,
              photo_url
            )
          )
        `)
        .eq("is_public", true)
        .or(`musician_id.eq.${userId},contractor_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (ratingsError) throw ratingsError;

      // Filtrar apenas avaliações onde o usuário é o AVALIADO (não o avaliador)
      // Para manter privacidade, só mostramos avaliações recebidas
      const userRatings = (ratingsData || []).filter((r: any) => {
        // Se o usuário é músico e foi avaliado como músico
        if (r.rated_type === 'musician' && r.musician_id === userId) return true;
        // Se o usuário é contratante e foi avaliado como contratante
        if (r.rated_type === 'contractor' && r.contractor_id === userId) return true;
        return false;
      });

      // Transformar os dados (sem informações identificadoras)
      const transformed: RatingRow[] = userRatings.map((r: any) => {
        return {
          id: r.id,
          invite_id: r.invite_id,
          gig_id: r.gig_id || "",
          rater_type: r.rater_type,
          rated_type: r.rated_type,
          rating: r.rating,
          comment: r.custom_comment,
          predefined_comments: Array.isArray(r.predefined_comments) ? r.predefined_comments : null,
          is_public: r.is_public ?? true,
        };
      });

      setRatings(transformed);
    } catch (e: any) {
      console.error("Error loading ratings:", e);
      setError(e?.message ?? "Erro ao carregar avaliações.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadRatings();
    }
  }, [userId, loadRatings]);

  // Função para traduzir comentários pré-fixados
  const translatePredefinedComment = (comment: string): string => {
    const translations: Record<string, string> = {
      'canta_bem': 'Canta bem',
      'toca_bem': 'Toca bem',
      'pontual': 'Pontual',
      'roupas_adequadas': 'Roupas adequadas',
      'profissional': 'Profissional',
      'comunicativo': 'Comunicativo',
      'flexivel': 'Flexível',
      'criativo': 'Criativo',
      'energico': 'Enérgico',
      'organizado': 'Organizado',
      'atrasado': 'Atrasado',
      'desorganizado': 'Desorganizado',
      'nao_comunicativo': 'Não comunicativo',
      'roupas_inadequadas': 'Roupas inadequadas',
      'pouco_profissional': 'Pouco profissional',
      'inflexivel': 'Inflexível',
      'pouca_energia': 'Pouca energia',
      'nao_pontual': 'Não pontual',
    };
    return translations[comment] || comment;
  };

  // Calcular estatísticas diretamente das avaliações exibidas
  // Isso garante que o resumo sempre corresponda à lista de avaliações
  const stats = ratings.length > 0 ? {
    total: ratings.length,
    average: ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length,
    predefinedCommentsCount: ratings.reduce((acc, r) => {
      if (r.predefined_comments && Array.isArray(r.predefined_comments)) {
        r.predefined_comments.forEach((comment: string) => {
          acc[comment] = (acc[comment] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>),
  } : null;

  // Top comentários pré-fixados
  const topPredefinedComments = stats
    ? Object.entries(stats.predefinedCommentsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([comment, count]) => ({ comment, count }))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Avaliações</h1>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-destructive">
            <p className="font-semibold">Erro:</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {/* Card de Resumo */}
        {!loading && stats && stats.total > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Resumo das Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Estatísticas principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {stats.average.toFixed(1)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Média de avaliações</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'} recebidas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total de avaliações</p>
                  </div>
                </div>
              </div>

              {/* Comentários pré-fixados mais escolhidos */}
              {topPredefinedComments.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">
                    Características mais mencionadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topPredefinedComments.map(({ comment, count }) => (
                      <Badge
                        key={comment}
                        variant="secondary"
                        className="bg-background text-foreground border-border px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm"
                      >
                        <span className="font-medium">
                          {translatePredefinedComment(comment)}
                        </span>
                        <span className="ml-1 sm:ml-2 text-xs text-muted-foreground">
                          ({count}x)
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Carregando avaliações...</span>
          </div>
        ) : ratings.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-6 sm:p-12 text-center">
              <Star className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
                Nenhuma avaliação encontrada
              </p>
              <p className="text-xs text-muted-foreground">
                Você ainda não tem avaliações para exibir.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {ratings.map((rating) => (
              <Card key={rating.id} className="border-border bg-card">
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Estrelas */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                              star <= (rating.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      {rating.rating && (
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-foreground">
                          {rating.rating.toFixed(1)}/5.0
                        </span>
                      )}
                    </div>

                    {/* Comentários pré-fixados */}
                    {rating.predefined_comments && rating.predefined_comments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {rating.predefined_comments.map((comment: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-muted text-foreground border-border text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1"
                          >
                            {translatePredefinedComment(comment)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Comentário customizado */}
                    {rating.comment && (
                      <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">
                          {rating.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Avaliação (para reavaliar se necessário) */}
      {selectedRating && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          gigId={selectedRating.gigId}
          inviteId={selectedRating.inviteId}
          raterId={userId || ""}
          ratedUserId={selectedRating.ratedUserId}
          raterType={selectedRating.raterType}
          ratedType={selectedRating.ratedType}
          onSuccess={() => {
            setRatingDialogOpen(false);
            setSelectedRating(null);
            void loadRatings();
          }}
        />
      )}
    </DashboardLayout>
  );
}

