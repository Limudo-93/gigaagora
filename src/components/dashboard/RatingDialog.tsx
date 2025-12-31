"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type RatingCommentType = 
  | 'canta_bem' | 'toca_bem' | 'pontual' | 'roupas_adequadas' | 'profissional' 
  | 'comunicativo' | 'flexivel' | 'criativo' | 'energico' | 'organizado'
  | 'atrasado' | 'desorganizado' | 'nao_comunicativo' | 'roupas_inadequadas' 
  | 'pouco_profissional' | 'inflexivel' | 'pouca_energia' | 'nao_pontual';

const POSITIVE_COMMENTS: { value: RatingCommentType; label: string }[] = [
  { value: 'canta_bem', label: 'Canta bem' },
  { value: 'toca_bem', label: 'Toca bem' },
  { value: 'pontual', label: 'Pontual' },
  { value: 'roupas_adequadas', label: 'Roupas adequadas' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'comunicativo', label: 'Comunicativo' },
  { value: 'flexivel', label: 'Flexível' },
  { value: 'criativo', label: 'Criativo' },
  { value: 'energico', label: 'Energético' },
  { value: 'organizado', label: 'Organizado' },
];

const NEGATIVE_COMMENTS: { value: RatingCommentType; label: string }[] = [
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'desorganizado', label: 'Desorganizado' },
  { value: 'nao_comunicativo', label: 'Não comunicativo' },
  { value: 'roupas_inadequadas', label: 'Roupas inadequadas' },
  { value: 'pouco_profissional', label: 'Pouco profissional' },
  { value: 'inflexivel', label: 'Inflexível' },
  { value: 'pouca_energia', label: 'Pouca energia' },
  { value: 'nao_pontual', label: 'Não pontual' },
];

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gigId: string;
  inviteId: string;
  raterId: string;
  ratedUserId: string;
  raterType: 'contractor' | 'musician';
  ratedType: 'contractor' | 'musician';
  onSuccess?: () => void;
}

export default function RatingDialog({
  open,
  onOpenChange,
  gigId,
  inviteId,
  raterId,
  ratedUserId,
  raterType,
  ratedType,
  onSuccess,
}: RatingDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedComments, setSelectedComments] = useState<RatingCommentType[]>([]);
  const [customComment, setCustomComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setRating(0);
      setHoveredRating(0);
      setSelectedComments([]);
      setCustomComment("");
      setError(null);
    }
  }, [open]);

  const toggleComment = (comment: RatingCommentType) => {
    setSelectedComments((prev) =>
      prev.includes(comment)
        ? prev.filter((c) => c !== comment)
        : [...prev, comment]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor, selecione uma nota de 1 a 5.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar o usuário autenticado atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const currentUserId = user.id;

      // Garantir que estamos usando o ID do usuário autenticado
      const actualRaterId = currentUserId;
      const actualRatedUserId = ratedUserId;

      // Verificar se já existe uma avaliação para este invite e tipo de avaliador
      let existingRating = null;
      if (raterType === 'musician') {
        const { data } = await supabase
          .from("ratings")
          .select("id")
          .eq("invite_id", inviteId)
          .eq("rater_type", raterType)
          .eq("musician_id", currentUserId)
          .maybeSingle();
        existingRating = data;
      } else {
        const { data } = await supabase
          .from("ratings")
          .select("id")
          .eq("invite_id", inviteId)
          .eq("rater_type", raterType)
          .eq("contractor_id", currentUserId)
          .maybeSingle();
        existingRating = data;
      }

      // Determinar corretamente quem é o avaliador e quem é o avaliado
      // Se o avaliador é um músico, então:
      //   - musician_id = avaliador (quem está avaliando)
      //   - contractor_id = avaliado (quem está sendo avaliado)
      // Se o avaliador é um contratante, então:
      //   - contractor_id = avaliador (quem está avaliando)
      //   - musician_id = avaliado (quem está sendo avaliado)
      
      const ratingData = {
        gig_id: gigId,
        invite_id: inviteId,
        contractor_id: raterType === 'contractor' ? actualRaterId : actualRatedUserId,
        musician_id: raterType === 'musician' ? actualRaterId : actualRatedUserId,
        rating: rating,
        rater_type: raterType,
        rated_type: ratedType,
        predefined_comments: selectedComments,
        custom_comment: customComment.trim() || null,
        is_public: true,
      };

      // Validação: garantir que não estamos avaliando a nós mesmos
      if (actualRaterId === actualRatedUserId) {
        throw new Error("Você não pode se avaliar. Por favor, verifique os dados.");
      }

      let error;
      if (existingRating) {
        // Se já existe, atualiza
        const { error: updateError } = await supabase
          .from("ratings")
          .update(ratingData)
          .eq("id", existingRating.id);
        error = updateError;
      } else {
        // Se não existe, insere
        const { error: insertError } = await supabase
          .from("ratings")
          .insert(ratingData);
        error = insertError;
      }

      if (error) throw error;

      // Atualiza estatísticas do perfil (isso pode ser feito via trigger no banco)
      // Por enquanto, apenas fecha o dialog
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      setError(err?.message ?? "Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Avaliar {ratedType === 'musician' ? 'Músico' : 'Contratante'}
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência para ajudar outros usuários da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Nota (1-5 estrelas)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={loading}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1 && "Péssimo"}
                  {rating === 2 && "Ruim"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bom"}
                  {rating === 5 && "Excelente"}
                </span>
              )}
            </div>
          </div>

          {/* Positive Comments */}
          {rating >= 3 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Pontos Positivos (selecione quantos quiser)
              </label>
              <div className="flex flex-wrap gap-2">
                {POSITIVE_COMMENTS.map((comment) => (
                  <button
                    key={comment.value}
                    type="button"
                    onClick={() => toggleComment(comment.value)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedComments.includes(comment.value)
                        ? "bg-green-100 text-green-800 border-2 border-green-500"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                    }`}
                  >
                    {comment.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Negative Comments */}
          {rating <= 2 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Pontos de Melhoria (selecione quantos quiser)
              </label>
              <div className="flex flex-wrap gap-2">
                {NEGATIVE_COMMENTS.map((comment) => (
                  <button
                    key={comment.value}
                    type="button"
                    onClick={() => toggleComment(comment.value)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedComments.includes(comment.value)
                        ? "bg-red-100 text-red-800 border-2 border-red-500"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                    }`}
                  >
                    {comment.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Comment */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Comentário Adicional (opcional)
            </label>
            <textarea
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              disabled={loading}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none resize-none"
              placeholder="Compartilhe mais detalhes sobre sua experiência..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] hover:from-[#ff6b4a] hover:to-[#2aa6a1] text-white"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Avaliação"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

