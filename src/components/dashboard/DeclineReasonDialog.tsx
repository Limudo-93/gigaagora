"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, DollarSign, MapPin, CalendarX, Clock, ThumbsDown, MessageSquare, Loader2 } from "lucide-react";

export type DeclineReason = 
  | "low_value" 
  | "distance" 
  | "unavailable" 
  | "schedule_conflict" 
  | "not_interested" 
  | "other";

interface DeclineReasonOption {
  value: DeclineReason;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const declineReasonOptions: DeclineReasonOption[] = [
  {
    value: "low_value",
    label: "Valor baixo",
    description: "O cachê está abaixo do esperado",
    icon: <DollarSign className="h-5 w-5" />,
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700",
  },
  {
    value: "distance",
    label: "Distância",
    description: "O local está muito longe",
    icon: <MapPin className="h-5 w-5" />,
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700",
  },
  {
    value: "unavailable",
    label: "Indisponibilidade",
    description: "Não estou disponível neste período",
    icon: <Clock className="h-5 w-5" />,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
  },
  {
    value: "schedule_conflict",
    label: "Conflito de agenda",
    description: "Já tenho outro compromisso marcado",
    icon: <CalendarX className="h-5 w-5" />,
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
  },
  {
    value: "not_interested",
    label: "Não tenho interesse",
    description: "Não combina com meu estilo ou preferências",
    icon: <ThumbsDown className="h-5 w-5" />,
    color: "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700",
  },
  {
    value: "other",
    label: "Outro motivo",
    description: "Tenho outro motivo para recusar",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700",
  },
];

interface DeclineReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: DeclineReason) => Promise<void>;
  gigTitle?: string | null;
  loading?: boolean;
}

export default function DeclineReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  gigTitle,
  loading = false,
}: DeclineReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<DeclineReason | null>(null);

  const handleConfirm = async () => {
    if (selectedReason) {
      await onConfirm(selectedReason);
      setSelectedReason(null); // Reset após confirmação
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Por que você está recusando este convite?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            {gigTitle ? (
              <>
                Seu feedback nos ajuda a melhorar os convites que você recebe.
                <span className="block mt-1 font-medium text-gray-900">
                  Gig: {gigTitle}
                </span>
              </>
            ) : (
              "Seu feedback nos ajuda a melhorar os convites que você recebe."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {declineReasonOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedReason(option.value)}
              disabled={loading}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedReason === option.value
                  ? `${option.color} border-current shadow-md scale-[1.02]`
                  : `${option.color} opacity-80 hover:opacity-100`
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${selectedReason === option.value ? "scale-110" : ""} transition-transform`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{option.label}</p>
                  <p className="text-xs mt-0.5 opacity-75">{option.description}</p>
                </div>
                {selectedReason === option.value && (
                  <div className="mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-current flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 border-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || loading}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recusando...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Confirmar Recusa
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

