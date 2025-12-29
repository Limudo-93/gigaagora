"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ClipboardList, Loader2, DollarSign, User, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type GigDetails = {
  id: string;
  title: string | null;
  description: string | null;
  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  timezone: string | null;
  start_time: string | null;
  end_time: string | null;
  show_minutes: number | null;
  break_minutes: number | null;
  status: string | null;
  contractor_id: string | null;
};

type ConfirmedMusician = {
  musician_id: string;
  musician_name: string | null;
  musician_photo_url: string | null;
  instrument: string;
  confirmed_at: string | null;
};

type ContractorInfo = {
  contractor_id: string;
  contractor_name: string | null;
  contractor_photo_url: string | null;
};

type GigRole = {
  id: string;
  instrument: string;
  quantity: number;
  cache: number | null;
  desired_genres: string[] | null;
  desired_skills: string[] | null;
  desired_setup: string[] | null;
  notes: string | null;
};

function formatDateTime(iso?: string | null) {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-BR"),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
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

  return { label: status ?? "Status", variant: "secondary" as const };
}

export default function GigDetailsDialog({
  open,
  onOpenChange,
  gigId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gigId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gig, setGig] = useState<GigDetails | null>(null);
  const [roles, setRoles] = useState<GigRole[]>([]);
  const [confirmedMusicians, setConfirmedMusicians] = useState<ConfirmedMusician[]>([]);
  const [contractorInfo, setContractorInfo] = useState<ContractorInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !gigId) {
      setGig(null);
      setRoles([]);
      setConfirmedMusicians([]);
      setContractorInfo(null);
      setError(null);
      return;
    }

    const loadGigDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Busca os detalhes da gig
        const { data: gigData, error: gigError } = await supabase
          .from("gigs")
          .select(
            "id,title,description,location_name,address_text,city,state,timezone,start_time,end_time,show_minutes,break_minutes,status,contractor_id"
          )
          .eq("id", gigId)
          .single();

        if (gigError) throw gigError;
        if (!gigData) throw new Error("Gig não encontrada");

        setGig(gigData as GigDetails);

        // Busca informações do publicador (contractor)
        if (gigData.contractor_id) {
          const { data: contractorData } = await supabase
            .from("profiles")
            .select("user_id, display_name, photo_url")
            .eq("user_id", gigData.contractor_id)
            .single();

          if (contractorData) {
            setContractorInfo({
              contractor_id: contractorData.user_id,
              contractor_name: contractorData.display_name,
              contractor_photo_url: contractorData.photo_url,
            });
          }
        }

        // Busca músicos confirmados usando RPC ou query direta
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            "rpc_list_accepted_musicians_for_gig",
            { p_gig_id: gigId }
          );

          if (!rpcError && rpcData) {
            // Buscar confirmações para verificar quais foram realmente confirmados
            const { data: confirmationsData } = await supabase
              .from("confirmations")
              .select("invite_id, musician_id")
              .eq("confirmed", true);

            if (confirmationsData) {
              const confirmedInviteIds = new Set(confirmationsData.map((c: any) => c.invite_id));
              const confirmed = (rpcData || []).filter((m: any) => confirmedInviteIds.has(m.invite_id));
              setConfirmedMusicians(confirmed);
            } else {
              // Se não houver confirmações, mostra os que aceitaram
              setConfirmedMusicians(rpcData || []);
            }
          } else {
            // Fallback: busca direta
            const { data: invitesData } = await supabase
              .from("invites")
              .select(`
                id,
                musician_id,
                gig_roles!inner(
                  instrument
                ),
                profiles!invites_musician_id_fkey(
                  display_name,
                  photo_url
                )
              `)
              .eq("gig_id", gigId)
              .in("status", ["accepted", "confirmed"]);

            if (invitesData) {
              // Verificar quais têm confirmação
              const inviteIds = invitesData.map((i: any) => i.id);
              const { data: confirmationsData } = await supabase
                .from("confirmations")
                .select("invite_id")
                .in("invite_id", inviteIds)
                .eq("confirmed", true);

              const confirmedInviteIds = new Set((confirmationsData || []).map((c: any) => c.invite_id));
              const confirmed = invitesData
                .filter((inv: any) => confirmedInviteIds.has(inv.id))
                .map((inv: any) => ({
                  musician_id: inv.musician_id,
                  musician_name: inv.profiles?.display_name || null,
                  musician_photo_url: inv.profiles?.photo_url || null,
                  instrument: inv.gig_roles?.instrument || "",
                  confirmed_at: null,
                }));
              setConfirmedMusicians(confirmed);
            }
          }
        } catch (confError) {
          console.error("Error loading confirmed musicians:", confError);
          // Não falha o carregamento se houver erro ao buscar confirmações
        }

        // Busca as roles (vagas) da gig
        const { data: rolesData, error: rolesError } = await supabase
          .from("gig_roles")
          .select("id,instrument,quantity,cache,desired_genres,desired_skills,desired_setup,notes")
          .eq("gig_id", gigId)
          .order("instrument", { ascending: true });

        if (rolesError) throw rolesError;
        setRoles((rolesData ?? []) as GigRole[]);
      } catch (e: any) {
        console.error("Error loading gig details:", e);
        setError(e?.message ?? "Erro ao carregar detalhes da gig.");
      } finally {
        setLoading(false);
      }
    };

    loadGigDetails();
  }, [open, gigId]);

  const { date, time } = formatDateTime(gig?.start_time);
  const { date: endDate, time: endTime } = formatDateTime(gig?.end_time);
  const statusUI = normalizeStatus(gig?.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {gig?.title ?? "Detalhes da Gig"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
            <span className="ml-2 text-sm text-gray-700">Carregando detalhes...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Erro ao carregar detalhes:</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : !gig ? (
          <p className="text-sm text-gray-700">Nenhum detalhe disponível.</p>
        ) : (
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={statusUI.variant === "secondary" ? "secondary" : statusUI.variant === "destructive" ? "destructive" : "default"}
                className={statusUI.variant === "secondary" ? "bg-gray-200 text-gray-900 border border-gray-300" : ""}
              >
                {statusUI.label}
              </Badge>
            </div>

            {/* Gig info - Card moderno */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center flex-shrink-0">
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
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Data</p>
                    <p className="font-semibold text-gray-900">{date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Horário início</p>
                    <p className="font-semibold text-gray-900">{time}</p>
                  </div>
                </div>

                {gig.end_time && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 mb-0.5">Horário fim</p>
                      <p className="font-semibold text-gray-900">{endTime}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-0.5">Duração</p>
                    <p className="font-semibold text-gray-900">
                      {gig.show_minutes ? `${gig.show_minutes} min` : "-"}
                      {gig.break_minutes ? ` (+ ${gig.break_minutes} min pausa)` : ""}
                    </p>
                  </div>
                </div>

                {(gig.city || gig.state) && (
                  <div className="flex items-center gap-3 text-sm sm:col-span-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 mb-0.5">Cidade/Estado</p>
                      <p className="font-semibold text-gray-900">
                        {[gig.city, gig.state].filter(Boolean).join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address/description - Card moderno */}
            {(gig.address_text || gig.description) && (
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm space-y-3">
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
                    <p className="text-sm font-semibold text-gray-900 mb-2">Descrição</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {gig.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Roles (gig_roles) - Card moderno */}
            {roles.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
                    <ClipboardList size={16} className="text-white" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">Vagas / Requisitos</p>
                </div>

                <div className="space-y-4">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-lg border border-gray-200 bg-white/80 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-base font-semibold text-gray-900">{role.instrument}</span>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-900 border border-gray-300">
                          Qtd: {role.quantity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                        {role.cache !== null && role.cache !== undefined && (
                          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                              <DollarSign size={14} />
                              Cachê
                            </p>
                            <p className="font-semibold text-gray-900">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(role.cache)}
                            </p>
                          </div>
                        )}
                        {role.desired_genres && role.desired_genres.length > 0 && (
                          <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-2">Gêneros desejados</p>
                            {Array.isArray(role.desired_genres) ? (
                              <div className="flex flex-wrap gap-2">
                                {role.desired_genres.map((genre: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="bg-gray-200 text-gray-900 border border-gray-300 text-xs">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-900 break-words">
                                {role.desired_genres}
                              </p>
                            )}
                          </div>
                        )}

                        {role.desired_skills && role.desired_skills.length > 0 && (
                          <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-2">Skills desejadas</p>
                            {Array.isArray(role.desired_skills) ? (
                              <div className="flex flex-wrap gap-2">
                                {role.desired_skills.map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="bg-gray-200 text-gray-900 border border-gray-300 text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-900 break-words">
                                {role.desired_skills}
                              </p>
                            )}
                          </div>
                        )}

                        {role.desired_setup && role.desired_setup.length > 0 && (
                          <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-2">Setup desejado</p>
                            {Array.isArray(role.desired_setup) ? (
                              <div className="flex flex-wrap gap-2">
                                {role.desired_setup.map((setup: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="bg-gray-200 text-gray-900 border border-gray-300 text-xs">
                                    {setup}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-900 break-words">
                                {role.desired_setup}
                              </p>
                            )}
                          </div>
                        )}

                        {role.notes && (
                          <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-2">Observações</p>
                            <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
                              {role.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Músicos Confirmados */}
            {confirmedMusicians.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">Músicos Confirmados</p>
                </div>

                <div className="space-y-3">
                  {confirmedMusicians.map((musician, idx) => {
                    const initials = musician.musician_name
                      ? musician.musician_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?";

                    return (
                      <div
                        key={musician.musician_id || idx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white/80"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={musician.musician_photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {musician.musician_name || "Músico"}
                          </p>
                          <p className="text-xs text-gray-600">{musician.instrument}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Informações do Publicador */}
            {contractorInfo && (
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">Publicado por</p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white/80">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contractorInfo.contractor_photo_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white text-sm">
                      {contractorInfo.contractor_name
                        ? contractorInfo.contractor_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {contractorInfo.contractor_name || "Contratante"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Ver Matches */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  if (gigId) {
                    router.push(`/dashboard/gigs/${gigId}/matches`);
                    onOpenChange(false);
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
              >
                <Users className="mr-2 h-4 w-4" />
                Ver Matches
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

