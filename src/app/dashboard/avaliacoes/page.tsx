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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Erro:</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Card de Resumo */}
        {!loading && stats && stats.total > 0 && (
          <Card className="border-gray-200 bg-gradient-to-br from-orange-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Resumo das Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estatísticas principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
                    <Star className="h-8 w-8 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.average.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Média de avaliações</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'} recebidas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total de avaliações</p>
                  </div>
                </div>
              </div>

              {/* Comentários pré-fixados mais escolhidos */}
              {topPredefinedComments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Características mais mencionadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topPredefinedComments.map(({ comment, count }) => (
                      <Badge
                        key={comment}
                        variant="secondary"
                        className="bg-white/80 text-gray-900 border border-gray-300 px-3 py-1.5"
                      >
                        <span className="font-medium">
                          {translatePredefinedComment(comment)}
                        </span>
                        <span className="ml-2 text-xs text-gray-600">
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
            <span className="ml-2 text-sm text-gray-700">Carregando avaliações...</span>
          </div>
        ) : ratings.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Nenhuma avaliação encontrada
              </p>
              <p className="text-xs text-gray-600">
                Você ainda não tem avaliações para exibir.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <Card key={rating.id} className="border-gray-200">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Estrelas */}
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (rating.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      {rating.rating && (
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {rating.rating.toFixed(1)}/5.0
                        </span>
                      )}
                    </div>

                    {/* Comentários pré-fixados */}
                    {rating.predefined_comments && rating.predefined_comments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rating.predefined_comments.map((comment: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-gray-100 text-gray-900 border border-gray-300"
                          >
                            {translatePredefinedComment(comment)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Comentário customizado */}
                    {rating.comment && (
                      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
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

