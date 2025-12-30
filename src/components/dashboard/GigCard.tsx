"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, DollarSign, Edit, Users, MessageSquare, X, Download, Image as ImageIcon, Eye, UserCheck } from "lucide-react";
import ShareGigButton from "./ShareGigButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ConfirmedMusician = {
  musician_id: string;
  musician_name: string | null;
  musician_photo_url: string | null;
  instrument: string;
};

type GigCardProps = {
  gig: {
    id: string;
    title: string | null;
    location_name: string | null;
    address_text: string | null;
    start_time: string | null; // ISO string
    status: string | null;
    flyer_url?: string | null;
    min_cache?: number | null;
    max_cache?: number | null;
    confirmed_musicians?: ConfirmedMusician[];
  };
  /** opcional: se quiser sobrescrever a navegação padrão */
  onOpen?: (gigId: string) => void;
  /** callback para quando a gig é cancelada */
  onCancel?: (gigId: string) => Promise<void>;
  /** callback para quando a gig é editada */
  onEdit?: (gigId: string) => void;
  /** indica se está processando cancelamento */
  isCancelling?: boolean;
};

function fmtDateBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtTimeBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status?: string | null) {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return { label: "Sem status", variant: "secondary" as const };

  if (["open", "published", "active"].includes(s))
    return { label: "Aberta", variant: "default" as const };

  if (["draft"].includes(s))
    return { label: "Rascunho", variant: "secondary" as const };

  if (["filled", "confirmed", "booked"].includes(s))
    return { label: "Confirmada", variant: "outline" as const };

  if (["canceled", "cancelled"].includes(s))
    return { label: "Cancelada", variant: "destructive" as const };

  // fallback: mostra o texto original
  return { label: status ?? "Status", variant: "secondary" as const };
}

export default function GigCard({ gig, onOpen, onCancel, onEdit, isCancelling = false }: GigCardProps) {
  const router = useRouter();
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const date = fmtDateBR(gig.start_time);
  const time = fmtTimeBR(gig.start_time);
  const place = gig.location_name || "Local a definir";
  const address = gig.address_text || "";
  const statusUI = normalizeStatus(gig.status);

  // Handlers corrigidos para typedRoutes
  const handleOpen = () => {
    if (onOpen) return onOpen(gig.id);
    router.push(`/dashboard/gigs/${gig.id}` as any);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(gig.id);
    } else {
      router.push(`/dashboard/gigs/${gig.id}/edit` as any);
    }
  };

  const handleCancelClick = () => {
    if (!onCancel) return;
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!onCancel) return;
    await onCancel(gig.id);
  };

  const handleDownloadFlyer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gig.flyer_url) return;
    
    // Cria um link temporário para download
    const link = document.createElement("a");
    link.href = gig.flyer_url;
    link.download = `${gig.title || "flyer"}-${gig.id}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirm={handleCancelConfirm}
        title="Cancelar Gig"
        description="Tem certeza que deseja cancelar esta gig? Esta ação não pode ser desfeita."
        confirmText="Sim, Cancelar"
        cancelText="Não"
        variant="destructive"
        loading={isCancelling}
      />
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        <CardContent className="p-0">
          {/* Flyer do evento ou logo padrão */}
          <div className="w-full h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative">
            {gig.flyer_url ? (
              <>
                <img
                  src={gig.flyer_url}
                  alt={gig.title || "Flyer do evento"}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={handleDownloadFlyer}
                  title="Clique para baixar o flyer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-full p-2.5 shadow-lg">
                    <Download className="h-5 w-5 text-card-foreground" />
                  </div>
                </div>
              </>
            ) : (
              <div className="relative w-32 h-32">
                <Image
                  src="/logo.png"
                  alt="Logo Chama o Músico"
                  fill
                  className="object-contain opacity-50"
                />
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Título */}
            <div>
              <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2">
                {gig.title || "Gig sem título"}
              </h3>
            </div>

            {/* Informações principais - Reorganizadas para escaneabilidade */}
            <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-border/50">
              {/* Região - Destacada */}
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">{place}</p>
                  {address && (
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{address}</p>
                  )}
                </div>
              </div>

              {/* Data e Hora - Em linha única para escaneabilidade */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{date || "Data a definir"}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{time || "Horário a definir"}</span>
                </div>
              </div>
            </div>

            {/* Badges de status */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant={statusUI.variant} className="text-xs font-medium">
                {statusUI.label === "Aberta" ? "Publicada" : statusUI.label}
              </Badge>
            </div>

            {/* Músicos Confirmados */}
            {gig.confirmed_musicians && gig.confirmed_musicians.length > 0 && (
              <div className="pt-3 border-t-2 border-border/30">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-foreground">Músicos Confirmados</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {gig.confirmed_musicians.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gig.confirmed_musicians.map((musician, idx) => (
                    <div
                      key={musician.musician_id || idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border-2 border-green-500/30 hover:bg-green-500/15 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={musician.musician_photo_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-bold shadow-sm">
                          {musician.musician_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {musician.musician_name || "Músico"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {musician.instrument}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex flex-col gap-2.5 pt-4 border-t-2 border-border/30">
              <Button
                variant="outline"
                className="w-full border-2 hover:bg-accent/50 font-medium"
                onClick={handleOpen}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  className="border-2 hover:bg-accent/50 font-medium"
                  onClick={() => router.push(`/dashboard/gigs/${gig.id}/matches` as any)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Ver Matches
                </Button>
                <Button
                  variant="outline"
                  className="border-2 hover:bg-accent/50 font-medium"
                  onClick={handleEdit}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <ShareGigButton
                  gigId={gig.id}
                  gigTitle={gig.title}
                  className="border-2"
                />
                <Button
                  variant="destructive"
                  className="border-2 font-medium"
                  onClick={handleCancelClick}
                  disabled={isCancelling || gig.status === "cancelled"}
                >
                  <X className="mr-2 h-4 w-4" />
                  {isCancelling ? "Cancelando..." : "Cancelar"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
