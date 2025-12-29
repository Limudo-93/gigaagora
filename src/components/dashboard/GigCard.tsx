"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, DollarSign, Edit, Users, MessageSquare, X, Download, Image as ImageIcon, Eye } from "lucide-react";
import ShareGigButton from "./ShareGigButton";

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

  const handleCancel = async () => {
    if (!onCancel) return;
    
    if (!confirm("Tem certeza que deseja cancelar esta gig? Esta ação não pode ser desfeita.")) {
      return;
    }

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
    <Card>
      {/* Miniatura do flyer ou logo padrão */}
      <div className="mb-3 relative group">
        <div 
          className={`relative w-full h-32 rounded-lg overflow-hidden border border-border ${gig.flyer_url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={gig.flyer_url ? handleDownloadFlyer : undefined}
          title={gig.flyer_url ? "Clique para baixar o flyer" : undefined}
        >
          {gig.flyer_url ? (
            <>
              <img
                src={gig.flyer_url}
                alt={gig.title || "Flyer do evento"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-full p-2">
                  <Download className="h-4 w-4 text-card-foreground" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <Image
                  src="/logo.png"
                  alt="Logo Chama o Músico"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags de gênero/tipo */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="secondary">Pagode</Badge>
        <Badge variant="secondary">Show</Badge>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Localização */}
          <div className="text-sm font-medium text-foreground mb-2">
            {place}
          </div>

          {/* Data, Hora e Valor */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{date || "Data a definir"}</span>
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{time || "Horário a definir"}</span>
            </div>

            {(gig.min_cache || gig.max_cache) && (
              <div className="inline-flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>
                  {gig.min_cache && gig.max_cache && gig.min_cache !== gig.max_cache
                    ? `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gig.min_cache)} - R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gig.max_cache)}`
                    : gig.min_cache
                    ? `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gig.min_cache)}`
                    : gig.max_cache
                    ? `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gig.max_cache)}`
                    : ""}
                </span>
              </div>
            )}
          </div>

          {/* Endereço */}
          {address && (
            <div className="text-xs text-muted-foreground mb-2">
              {address}
            </div>
          )}

          {/* Badge de status e tipo */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">Normal</Badge>
            <Badge variant={statusUI.variant}>
              {statusUI.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1"
          onClick={handleOpen}
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1"
          onClick={() => router.push(`/dashboard/gigs/${gig.id}/matches` as any)} // Corrigido para typedRoutes
        >
          <Users className="mr-2 h-4 w-4" />
          Ver Matches
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1"
          onClick={handleEdit}
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <ShareGigButton 
          gigId={gig.id} 
          gigTitle={gig.title}
          className="flex-1"
        />
        <Button 
          variant="destructive" 
          size="sm" 
          className="flex-1"
          onClick={handleCancel}
          disabled={isCancelling || gig.status === "cancelled"}
        >
          <X className="mr-2 h-4 w-4" />
          {isCancelling ? "Cancelando..." : "Cancelar"}
        </Button>
      </div>
    </Card>
  );
}
