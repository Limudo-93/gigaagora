"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
  DollarSign,
  Navigation,
} from "lucide-react";

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
  // Suporta tanto o formato novo (gig/role) quanto o antigo (gigs/gig_roles)
  const gig =
    invite?.gig ||
    (Array.isArray(invite?.gigs) ? invite?.gigs[0] : invite?.gigs);
  const role =
    invite?.role ||
    (Array.isArray(invite?.gig_roles)
      ? invite?.gig_roles[0]
      : invite?.gig_roles);

  // Informações de distância e tempo de viagem
  const distanceKm = invite?.distance_km ?? null;
  const estimatedTravelTimeMinutes =
    invite?.estimated_travel_time_minutes ?? null;
  const maxRadiusKm = invite?.max_radius_km ?? null;

  const { date, time } = formatDateTime(gig?.start_time);
  const { time: endTime } = formatDateTime(gig?.end_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {gig?.title ?? "Detalhes do convite"}
          </DialogTitle>
        </DialogHeader>

        {!gig ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600">Nenhum detalhe disponível.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white border-0">
                Convite
              </Badge>

              {invite?.warned_short_gig && (
                <Badge className="bg-amber-500 text-white border-0">
                  Show curto ({invite.warned_short_gig_minutes ?? "?"} min)
                </Badge>
              )}

              {gig?.status && (
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-900 border border-gray-300"
                >
                  {gig.status}
                </Badge>
              )}
            </div>

            {/* Distância e Tempo de Viagem - Card Destacado */}
            {(distanceKm != null || estimatedTravelTimeMinutes != null) && (
              <div
                className={`rounded-2xl border-2 p-5 shadow-lg ${
                  distanceKm != null
                    ? distanceKm <= 7
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
                      : distanceKm <= 15
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
                        : "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30"
                    : "border-primary/50 bg-gradient-to-br from-primary/10 to-purple-50 dark:from-primary/20 dark:to-purple-900/20"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Distância */}
                  {distanceKm != null && (
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          distanceKm <= 7
                            ? "bg-green-500/20"
                            : distanceKm <= 15
                              ? "bg-blue-500/20"
                              : "bg-orange-500/20"
                        }`}
                      >
                        <Navigation
                          className={`h-6 w-6 ${
                            distanceKm <= 7
                              ? "text-green-600 dark:text-green-400"
                              : distanceKm <= 15
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-orange-600 dark:text-orange-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Distância
                        </p>
                        <p
                          className={`text-3xl font-bold mb-2 ${
                            distanceKm <= 7
                              ? "text-green-700 dark:text-green-300"
                              : distanceKm <= 15
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-orange-700 dark:text-orange-300"
                          }`}
                        >
                          {distanceKm.toFixed(1)} km
                        </p>
                        <Badge
                          className={`text-xs font-semibold ${
                            distanceKm <= 7
                              ? "bg-green-500 text-white"
                              : distanceKm <= 15
                                ? "bg-blue-500 text-white"
                                : "bg-orange-500 text-white"
                          }`}
                        >
                          {distanceKm <= 7
                            ? "✓ Próximo"
                            : distanceKm <= 15
                              ? "• Normal"
                              : "⚠ Longe"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Tempo de Viagem */}
                  {estimatedTravelTimeMinutes != null && (
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-500/20">
                        <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Tempo de carro
                        </p>
                        <p className="text-3xl font-bold text-foreground mb-2">
                          ~{estimatedTravelTimeMinutes} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tempo estimado
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aviso se está fora do raio */}
                {maxRadiusKm != null &&
                  distanceKm != null &&
                  distanceKm > maxRadiusKm && (
                    <div className="mt-4 rounded-lg border-2 border-orange-500/50 bg-orange-50 dark:bg-orange-900/20 p-3">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        ⚠️ Este convite está fora do seu raio de busca
                        configurado ({maxRadiusKm} km)
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Gig info - Card moderno */}
            <div className="rounded-2xl border border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 p-5 shadow-lg space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                    <MapPin size={18} className="text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Local</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {gig.location_name ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Data</p>
                    <p className="font-semibold text-gray-900">{date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <Clock size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Horário</p>
                    <p className="font-semibold text-gray-900">
                      {time}
                      {endTime && endTime !== "-" && ` - ${endTime}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <Clock size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Duração</p>
                    <p className="font-semibold text-gray-900">
                      {gig.show_minutes ? `${gig.show_minutes} min` : "-"}
                      {gig.break_minutes
                        ? ` (+ ${gig.break_minutes} min pausa)`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address/description - Card moderno */}
            {(gig.address_text || gig.description) && (
              <div className="rounded-2xl border border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 p-5 shadow-lg space-y-3">
                {gig.address_text && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-gray-600" />
                      Endereço
                    </p>
                    <p className="text-sm text-gray-700 pl-6">
                      {gig.address_text}
                    </p>
                  </div>
                )}

                {gig.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Descrição
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {gig.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Role (gig_roles) - Card moderno */}
            <div className="rounded-2xl border border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6b4a] to-[#2aa6a1] flex items-center justify-center">
                  <ClipboardList size={16} className="text-white" />
                </div>
                <p className="text-base font-semibold text-gray-900">
                  Vaga / Requisitos
                </p>
              </div>

              {role ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg bg-white/50 p-3 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Instrumento</p>
                    <p className="font-semibold text-gray-900">
                      {role.instrument ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white/50 p-3 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Quantidade</p>
                    <p className="font-semibold text-gray-900">
                      {role.quantity ?? "-"}
                    </p>
                  </div>

                  {role.cache && (
                    <div className="rounded-lg bg-white/50 p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <DollarSign size={14} />
                        Cachê
                      </p>
                      <p className="font-semibold text-gray-900">
                        R${" "}
                        {new Intl.NumberFormat("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(role.cache)}
                      </p>
                    </div>
                  )}

                  {role.desired_genres && (
                    <div className="sm:col-span-2 rounded-lg bg-white/50 p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 mb-2">
                        Gêneros desejados
                      </p>
                      {Array.isArray(role.desired_genres) &&
                      role.desired_genres.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {role.desired_genres.map(
                            (genre: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-gray-200 text-gray-900 border border-gray-300 text-xs"
                              >
                                {genre}
                              </Badge>
                            ),
                          )}
                        </div>
                      ) : typeof role.desired_genres === "string" &&
                        role.desired_genres.trim() ? (
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {role.desired_genres}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">—</p>
                      )}
                    </div>
                  )}

                  {role.desired_skills && (
                    <div className="sm:col-span-2 rounded-lg bg-white/50 p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 mb-2">
                        Skills desejadas
                      </p>
                      {Array.isArray(role.desired_skills) &&
                      role.desired_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {role.desired_skills.map(
                            (skill: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-gray-200 text-gray-900 border border-gray-300 text-xs"
                              >
                                {skill}
                              </Badge>
                            ),
                          )}
                        </div>
                      ) : typeof role.desired_skills === "string" &&
                        role.desired_skills.trim() ? (
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {role.desired_skills}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">—</p>
                      )}
                    </div>
                  )}

                  {role.desired_setup && (
                    <div className="sm:col-span-2 rounded-lg bg-white/50 p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 mb-2">
                        Setup desejado
                      </p>
                      {Array.isArray(role.desired_setup) &&
                      role.desired_setup.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {role.desired_setup.map(
                            (setup: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-gray-200 text-gray-900 border border-gray-300 text-xs"
                              >
                                {setup}
                              </Badge>
                            ),
                          )}
                        </div>
                      ) : typeof role.desired_setup === "string" &&
                        role.desired_setup.trim() ? (
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {role.desired_setup}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">—</p>
                      )}
                    </div>
                  )}

                  {role.notes && (
                    <div className="sm:col-span-2 rounded-lg bg-white/50 p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 mb-2">Observações</p>
                      <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
                        {role.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  Nenhum detalhe de vaga encontrado.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={onDecline}
                className="bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 font-medium"
              >
                Recusar
              </Button>
              <Button
                onClick={onAccept}
                className="bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] hover:from-[#ff6b4a] hover:to-[#2aa6a1] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                Aceitar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
