"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ClipboardList } from "lucide-react";

function formatDateTime(iso?: string) {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-BR"),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function InviteDetailsDialog({
  open,
  onOpenChange,
  invite,
  onAccept,
  onDecline,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invite: any | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const gig = invite?.gig;
  const role = invite?.role;

  const { date, time } = formatDateTime(gig?.start_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {gig?.title ?? "Detalhes do convite"}
          </DialogTitle>
        </DialogHeader>

        {!gig ? (
          <p className="text-sm text-muted-foreground">Nenhum detalhe disponível.</p>
        ) : (
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Convite</Badge>

              {invite?.warned_short_gig && (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                  Show curto ({invite.warned_short_gig_minutes ?? "?"} min)
                </Badge>
              )}

              {gig?.status && <Badge variant="outline">{gig.status}</Badge>}
            </div>

            {/* Gig info */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Local</span>
                <span className="ml-auto font-medium text-foreground">
                  {gig.location_name ?? "-"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Data</span>
                <span className="ml-auto font-medium text-foreground">{date}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Horário</span>
                <span className="ml-auto font-medium text-foreground">{time}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Duração</span>
                <span className="ml-auto font-medium text-foreground">
                  {gig.show_minutes ? `${gig.show_minutes} min` : "-"}
                  {gig.break_minutes ? ` (+ ${gig.break_minutes} min pausa)` : ""}
                </span>
              </div>
            </div>

            {/* Address/description */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Endereço</p>
              <p className="text-sm text-muted-foreground">
                {gig.address_text ?? "—"}
              </p>

              {gig.description && (
                <>
                  <p className="text-sm font-medium pt-2">Descrição</p>
                  <p className="text-sm text-muted-foreground">{gig.description}</p>
                </>
              )}
            </div>

            {/* Role (gig_roles) */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-muted-foreground" />
                <p className="text-sm font-medium">Vaga / Requisitos</p>
              </div>

              {role ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Instrumento</span>
                    <span className="font-medium">{role.instrument ?? "-"}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Quantidade</span>
                    <span className="font-medium">{role.quantity ?? "-"}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Gêneros desejados</p>
                    <p className="font-medium break-words">{role.desired_genres ?? "—"}</p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Skills desejadas</p>
                    <p className="font-medium break-words">{role.desired_skills ?? "—"}</p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Setup desejado</p>
                    <p className="font-medium break-words">{role.desired_setup ?? "—"}</p>
                  </div>

                  {role.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">Observações</p>
                      <p className="font-medium break-words">{role.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum detalhe de vaga encontrado (gig_role_id vazio ou sem relação).
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onDecline}>
                Recusar
              </Button>
              <Button onClick={onAccept}>Aceitar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
