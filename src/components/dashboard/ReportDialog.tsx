"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ReportCategory = 
  | 'inappropriate_behavior' | 'fake_profile' | 'spam' | 'harassment'
  | 'fraud' | 'no_show' | 'unprofessional' | 'other';

const REPORT_CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  { value: 'inappropriate_behavior', label: 'Comportamento Inadequado', description: 'Comportamento ofensivo ou inapropriado' },
  { value: 'fake_profile', label: 'Perfil Falso', description: 'Perfil suspeito ou falsificado' },
  { value: 'spam', label: 'Spam', description: 'Mensagens ou ações de spam' },
  { value: 'harassment', label: 'Assédio', description: 'Assédio ou intimidação' },
  { value: 'fraud', label: 'Fraude', description: 'Tentativa de fraude ou golpe' },
  { value: 'no_show', label: 'Não Compareceu', description: 'Não compareceu à gig sem avisar' },
  { value: 'unprofessional', label: 'Não Profissional', description: 'Comportamento não profissional' },
  { value: 'other', label: 'Outro', description: 'Outro motivo' },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  gigId?: string;
  inviteId?: string;
  onSuccess?: () => void;
}

export default function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  gigId,
  inviteId,
  onSuccess,
}: ReportDialogProps) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!category) {
      setError("Por favor, selecione uma categoria.");
      return;
    }

    if (!description.trim()) {
      setError("Por favor, descreva o problema.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error: insertError } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        gig_id: gigId || null,
        invite_id: inviteId || null,
        category: category,
        description: description.trim(),
        status: 'pending',
      });

      if (insertError) throw insertError;

      onSuccess?.();
      onOpenChange(false);
      setCategory(null);
      setDescription("");
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError(err?.message ?? "Erro ao enviar denúncia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Denunciar Usuário</DialogTitle>
          <DialogDescription>
            Ajude-nos a manter a plataforma segura reportando comportamentos inadequados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Categoria da Denúncia *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    category === cat.value
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{cat.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Descrição do Problema *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none resize-none"
              placeholder="Descreva detalhadamente o problema que você encontrou..."
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
              onClick={handleSubmit}
              disabled={loading || !category || !description.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Denúncia"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

