"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, DollarSign, Check, X, Eye, Download, User, AlertTriangle, MapPin, Loader2, Navigation } from "lucide-react";
import InviteDetailsDialog from "./InviteDetailsDialog";
import { haversineKm, estimateTravelMin, computeRegionLabel } from "@/lib/geo";

type PendingInviteRow = {
  invite_id: string;
  status: string | null;
  created_at: string | null;

  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  end_time: string | null;

  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  region_label: string | null;
  gig_latitude: number | null;
  gig_longitude: number | null;

  instrument: string | null;
  flyer_url: string | null;
  contractor_name: string | null;
  cache: number | null;

  // Campos calculados
  distance_km: number | null;
  estimated_travel_time_minutes: number | null;
};

function formatDateTimeBR(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso ?? "";
  }
}

function buildLocationText(r: PendingInviteRow) {
  const parts = [
    r.location_name,
    r.address_text,
    r.city,
    r.state ? `- ${r.state}` : null,
  ].filter(Boolean);
  return parts.join(" • ");
}

export default function PendingInvites({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<PendingInviteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCommitmentWarning, setShowCommitmentWarning] = useState(false);
  const [acceptedInviteTitle, setAcceptedInviteTitle] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [musicianLocation, setMusicianLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showDeclineReasonDialog, setShowDeclineReasonDialog] = useState(false);
  const [pendingDeclineInviteId, setPendingDeclineInviteId] = useState<string | null>(null);

  const count = useMemo(() => items.length, [items]);

  // Função para obter e salvar localização do músico
  const handleGetMyLocation = async () => {
    setGettingLocation(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg("Geolocalização não é suportada pelo seu navegador.");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Salvar localização no perfil do músico
          const { error: updateError } = await supabase
            .from("musician_profiles")
            .update({
              latitude: lat,
              longitude: lng,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error("Error saving location:", updateError);
            setErrorMsg("Erro ao salvar localização. Tente novamente.");
          } else {
            setMusicianLocation({ lat, lng });
            setShowLocationPrompt(false);
            // Forçar reload dos convites
            window.location.reload();
          }
        } catch (err: any) {
          console.error("Error saving location:", err);
          setErrorMsg("Erro ao salvar localização.");
        } finally {
          setGettingLocation(false);
        }
      },
      (err) => {
        console.error("Error getting location:", err);
        setErrorMsg("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    console.log("PendingInvites: fetchPending called with userId:", userId);

    try {
      // Buscar localização e raio de busca do músico
      const { data: musicianProfile, error: musicianError } = await supabase
        .from("musician_profiles")
        .select("latitude, longitude, max_radius_km, strengths_counts")
        .eq("user_id", userId)
        .single();

      const musicianLat = musicianProfile?.latitude as number | null | undefined;
      const musicianLng = musicianProfile?.longitude as number | null | undefined;
      
      // Buscar raio de busca (priorizar strengths_counts.searchRadius onde o slider salva)
      let radius: number | null = null;
      if (musicianProfile?.strengths_counts) {
        const metadata = musicianProfile.strengths_counts as any;
        if (metadata?.searchRadius != null) {
          radius = Number(metadata.searchRadius);
        }
      }
      // Fallback para max_radius_km se não encontrou em strengths_counts
      if (radius == null) {
        const maxRadius = musicianProfile?.max_radius_km as number | null | undefined;
        if (maxRadius != null) {
          radius = Number(maxRadius);
        }
      }
      // Default final se ainda não tem
      if (radius == null) radius = 50;
      
      console.log(`[PendingInvites] Raio de busca configurado: ${radius} km`, {
        fromStrengthsCounts: musicianProfile?.strengths_counts ? (musicianProfile.strengths_counts as any)?.searchRadius : null,
        fromMaxRadiusKm: musicianProfile?.max_radius_km,
        finalRadius: radius
      });
      
      setMaxRadiusKm(radius);
      
      // Se não tem localização, mostrar prompt
      if (!musicianLat || !musicianLng) {
        setShowLocationPrompt(true);
        setMusicianLocation(null);
      } else {
        setMusicianLocation({ lat: musicianLat, lng: musicianLng });
        setShowLocationPrompt(false);
      }

      // Busca direta da tabela invites com join em gigs (com novos campos)
      const { data: directData, error: directError } = await supabase
        .from("invites")
        .select(`
          id,
          status,
          created_at,
          gig_id,
          gig_role_id,
          gigs(
            id,
            title,
            start_time,
            end_time,
            location_name,
            address_text,
            city,
            state,
            region_label,
            latitude,
            longitude,
            flyer_url,
            contractor_id,
            profiles!gigs_contractor_id_fkey(
              display_name
            )
          ),
          gig_roles(
            instrument,
            cache
          )
        `)
        .eq("musician_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (directError) {
        console.error("Direct query error:", directError);
        setErrorMsg(
          `Erro ao carregar convites: ${directError.message}${directError.hint ? ` (${directError.hint})` : ""}. Verifique se as tabelas 'invites', 'gigs' e 'gig_roles' existem e têm as colunas corretas.`
        );
        setItems([]);
        setLoading(false);
        return;
      }

      // Transforma os dados para o formato esperado e calcula distância
      let transformed: PendingInviteRow[] = (directData ?? []).map((invite: any) => {
        const gig = Array.isArray(invite.gigs) ? invite.gigs[0] : invite.gigs;
        const role = Array.isArray(invite.gig_roles) ? invite.gig_roles[0] : invite.gig_roles;
        const contractorProfile = Array.isArray(gig?.profiles) ? gig?.profiles[0] : gig?.profiles;
        
        const gigLat = gig?.latitude as number | null | undefined;
        const gigLng = gig?.longitude as number | null | undefined;
        
        // Calcular distância se temos coordenadas de ambos
        let distanceKm: number | null = null;
        let estimatedTravelTimeMinutes: number | null = null;
        
        if (musicianLat != null && musicianLng != null && gigLat != null && gigLng != null) {
          distanceKm = haversineKm(musicianLat, musicianLng, gigLat, gigLng);
          estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
        }
        
        return {
          invite_id: invite.id,
          status: invite.status,
          created_at: invite.created_at,
          gig_id: invite.gig_id,
          gig_title: gig?.title ?? null,
          start_time: gig?.start_time ?? null,
          end_time: gig?.end_time ?? null,
          location_name: gig?.location_name ?? null,
          address_text: gig?.address_text ?? null,
          city: gig?.city ?? null,
          state: gig?.state ?? null,
          region_label: (() => {
            // Recalcular region_label se tivermos coordenadas, para garantir formato específico
            if (gigLat != null && gigLng != null) {
              const computed = computeRegionLabel(
                gig?.state ?? null,
                gig?.city ?? null,
                gigLat,
                gigLng
              );
              // Se o computed for mais específico (contém "Zona" ou cidade específica), usar ele
              // Caso contrário, usar o do banco se existir
              if (computed && (computed.includes("Zona") || computed.includes("—"))) {
                return computed;
              }
            }
            return gig?.region_label ?? null;
          })(),
          gig_latitude: gigLat ?? null,
          gig_longitude: gigLng ?? null,
          instrument: role?.instrument ?? null,
          flyer_url: gig?.flyer_url ?? null,
          contractor_name: contractorProfile?.display_name ?? null,
          cache: role?.cache ?? null,
          distance_km: distanceKm,
          estimated_travel_time_minutes: estimatedTravelTimeMinutes,
        };
      });

      // Filtrar por raio de busca se temos localização do músico e raio configurado
      if (musicianLat != null && musicianLng != null && radius != null) {
        const radiusValue = Number(radius); // Garantir que é número
        console.log(`[PendingInvites] Filtrando convites por raio: ${radiusValue} km (tipo: ${typeof radiusValue}). Total antes: ${transformed.length}`);
        const beforeFilter = transformed.length;
        transformed = transformed.filter((item) => {
          // Se não tem distância calculada, exclui (não podemos filtrar sem distância)
          if (item.distance_km == null) {
            console.log(`[PendingInvites] Excluindo convite ${item.invite_id} - sem distância calculada`);
            return false;
          }
          // Garantir que distance_km é número
          const distance = Number(item.distance_km);
          // Filtra pelo raio configurado - só inclui se estiver dentro do raio
          const isWithinRadius = distance <= radiusValue;
          if (!isWithinRadius) {
            console.log(`[PendingInvites] Excluindo convite ${item.invite_id} - distância ${distance.toFixed(1)} km > raio ${radiusValue} km`);
          } else {
            console.log(`[PendingInvites] Mantendo convite ${item.invite_id} - distância ${distance.toFixed(1)} km <= raio ${radiusValue} km`);
          }
          return isWithinRadius;
        });
        console.log(`[PendingInvites] Total após filtro: ${transformed.length} (removidos: ${beforeFilter - transformed.length})`);
      } else {
        console.log(`[PendingInvites] Não filtrando por raio - musicianLat: ${musicianLat}, musicianLng: ${musicianLng}, radius: ${radius} (tipo: ${typeof radius})`);
      }

      // Ordenar por distância (menor primeiro) e depois por data de criação (mais recente primeiro)
      transformed.sort((a, b) => {
        // Se ambos têm distância, ordena por distância
        if (a.distance_km != null && b.distance_km != null) {
          return a.distance_km - b.distance_km;
        }
        // Se só um tem distância, ele vem primeiro
        if (a.distance_km != null && b.distance_km == null) return -1;
        if (a.distance_km == null && b.distance_km != null) return 1;
        // Se nenhum tem distância, ordena por data (mais recente primeiro)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      console.log("PendingInvites loaded:", transformed.length, "invites");
      setItems(transformed);
      setLoading(false);
    } catch (e: any) {
      console.error("fetchPending exception:", e);
      setErrorMsg(e?.message ?? "Erro inesperado ao carregar convites.");
      setItems([]);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void fetchPending();
    } else {
      setErrorMsg("Usuário não identificado.");
      setLoading(false);
    }
  }, [userId, fetchPending]);

  // Contador de 5 segundos para o dialog de aviso
  useEffect(() => {
    if (showCommitmentWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showCommitmentWarning, countdown]);

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      setBusyId(inviteId);
      setErrorMsg(null);

      try {
        // Chama a RPC que retorna JSON
        const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_accept_invite", {
          p_invite_id: inviteId,
        });

        if (rpcError) {
          console.error("RPC acceptInvite error:", rpcError);
          setErrorMsg(`Erro ao aceitar convite: ${rpcError.message}`);
          setBusyId(null);
          return;
        }

        // A RPC retorna JSON com {ok: true/false, message: '...'}
        if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData) {
          if (!rpcData.ok) {
            const message = (rpcData as any)?.message || "Erro ao aceitar convite";
            console.error("RPC returned error:", message);
            setErrorMsg(message);
            setBusyId(null);
            return;
          }
          // ok === true, continua
        }

        // Sucesso
        console.log("Invite accepted successfully:", rpcData);
        
        // Buscar título da gig para mostrar no aviso
        const acceptedInvite = items.find((x) => x.invite_id === inviteId);
        if (acceptedInvite) {
          setAcceptedInviteTitle(acceptedInvite.gig_title || "esta gig");
        }
        
        // Mostrar aviso de compromisso e iniciar contador
        setCountdown(5);
        setShowCommitmentWarning(true);
        
        // remove da lista local
        setItems((prev) => prev.filter((x) => x.invite_id !== inviteId));
        setBusyId(null);
      } catch (err: any) {
        console.error("acceptInvite exception:", err);
        setErrorMsg(err?.message ?? "Erro inesperado ao aceitar convite.");
        setBusyId(null);
      }
    },
    [setItems]
  );

  const handleDeclineClick = useCallback((inviteId: string) => {
    setPendingDeclineInviteId(inviteId);
    setShowDeclineReasonDialog(true);
  }, []);

  const declineInvite = useCallback(async (inviteId: string, reason: DeclineReason) => {
    setBusyId(inviteId);
    setErrorMsg(null);

    try {
      // Chama a RPC com motivo de recusa
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_decline_invite", {
        p_invite_id: inviteId,
        p_decline_reason: reason,
      });

      if (rpcError) {
        console.error("RPC declineInvite error:", rpcError);
        setErrorMsg(`Erro ao recusar convite: ${rpcError.message}`);
        setBusyId(null);
        return;
      }

      // Se a RPC retornar JSON com {ok: false}, trata o erro
      if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData && !rpcData.ok) {
        const message = (rpcData as any)?.message || "Erro ao recusar convite";
        console.error("RPC returned error:", message);
        setErrorMsg(message);
        setBusyId(null);
        return;
      }

      // Sucesso
      console.log("Invite declined successfully:", rpcData);
      setItems((prev) => prev.filter((x) => x.invite_id !== inviteId));
      setBusyId(null);
      setShowDeclineReasonDialog(false);
      setPendingDeclineInviteId(null);
    } catch (err: any) {
      console.error("declineInvite exception:", err);
      setErrorMsg(err?.message ?? "Erro inesperado ao recusar convite.");
      setBusyId(null);
    }
  }, []);

  return (
    <section className="mt-4 md:mt-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">
          Convites Pendentes{" "}
          {count > 0 && (
            <Badge className="ml-2 text-xs md:text-sm">
              {count}
            </Badge>
          )}
        </h2>
      </div>

      {errorMsg ? (
        <div className="mb-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar convites:</p>
          <p className="mt-1">{errorMsg}</p>
          <p className="mt-2 text-xs opacity-75">
            Verifique o console do navegador (F12) para mais detalhes.
          </p>
        </div>
      ) : null}

      <Card>
        {loading ? (
          <CardContent className="text-center py-6 text-sm text-muted-foreground">
            Carregando convites...
          </CardContent>
        ) : items.length === 0 ? (
          <CardContent className="text-center py-6">
            <p className="text-sm font-medium text-foreground">Nenhum convite pendente</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você não tem convites aguardando resposta no momento.
            </p>
          </CardContent>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {items.slice(0, 3).map((r) => {
              const when = formatDateTimeBR(r.start_time);
              const location = buildLocationText(r);

              // Calcular horas restantes (exemplo: 48h)
              const hoursRemaining = r.start_time
                ? Math.ceil(
                    (new Date(r.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
                  )
                : null;

              const handleDownloadFlyer = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (r.flyer_url) {
                  const link = document.createElement("a");
                  link.href = r.flyer_url;
                  link.download = `${r.gig_title || "flyer"}.jpg`;
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              };

              const dateParts = when ? when.split(" ") : [];
              const dateStr = dateParts[0] || "";
              const timeStr = dateParts[1] || "";

              return (
                <Card 
                  key={r.invite_id}
                  className="border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-0">
                    {/* Flyer do evento ou logo padrão */}
                    <div className="w-full h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative">
                      {r.flyer_url ? (
                        <img
                          src={r.flyer_url}
                          alt={r.gig_title || "Flyer do evento"}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={handleDownloadFlyer}
                          title="Clique para baixar o flyer"
                        />
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
                      {/* Cachê em Destaque - Primeiro elemento visual */}
                      {r.cache && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white shadow-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium opacity-90 mb-1">Cachê</p>
                              <p className="text-2xl md:text-3xl font-bold">
                                R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.cache)}
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 opacity-80" />
                          </div>
                        </div>
                      )}

                      {/* Título */}
                      <div>
                        <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2">
                          {r.gig_title || "Gig sem título"}
                        </h3>

                        {/* Publicado por */}
                        {r.contractor_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span>
                              Publicado por <span className="font-medium text-foreground">{r.contractor_name}</span>
                            </span>
                          </div>
                        )}

                        {/* Instrumento */}
                        {r.instrument && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {r.instrument}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Informações principais - Reorganizadas para escaneabilidade */}
                      <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                        {/* Região - Destacada */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            {r.region_label ? (
                              <div>
                                <p className="font-semibold text-sm text-foreground">{r.region_label}</p>
                                {location && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{location}</p>
                                )}
                              </div>
                            ) : (
                              <p className="font-semibold text-sm text-foreground truncate">{location || "Local não informado"}</p>
                            )}
                          </div>
                        </div>

                        {/* Distância e Tempo de Viagem - DESTAQUE MUITO VISÍVEL */}
                        {(r.distance_km != null || r.estimated_travel_time_minutes != null) ? (
                          <div className="space-y-2">
                            {/* Card de Distância e Tempo - DESTAQUE */}
                            <div className={`rounded-xl border-2 p-4 shadow-md ${
                              r.distance_km != null
                                ? r.distance_km <= 7
                                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
                                  : r.distance_km <= 15
                                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
                                  : "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30"
                                : "border-primary/50 bg-gradient-to-br from-primary/10 to-purple-50 dark:from-primary/20 dark:to-purple-900/20"
                            }`}>
                              <div className="grid grid-cols-2 gap-4">
                                {/* Distância - Grande e Destacada */}
                                {r.distance_km != null && (
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      r.distance_km <= 7
                                        ? "bg-green-500/20"
                                        : r.distance_km <= 15
                                        ? "bg-blue-500/20"
                                        : "bg-orange-500/20"
                                    }`}>
                                      <Navigation className={`h-5 w-5 ${
                                        r.distance_km <= 7
                                          ? "text-green-600 dark:text-green-400"
                                          : r.distance_km <= 15
                                          ? "text-blue-600 dark:text-blue-400"
                                          : "text-orange-600 dark:text-orange-400"
                                      }`} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Distância</p>
                                      <p className={`text-2xl font-bold ${
                                        r.distance_km <= 7
                                          ? "text-green-700 dark:text-green-300"
                                          : r.distance_km <= 15
                                          ? "text-blue-700 dark:text-blue-300"
                                          : "text-orange-700 dark:text-orange-300"
                                      }`}>
                                        {r.distance_km.toFixed(1)} km
                                      </p>
                                      {/* Status Perto/Normal/Longe */}
                                      <Badge 
                                        className={`mt-1.5 text-xs font-semibold ${
                                          r.distance_km <= 7
                                            ? "bg-green-500 text-white"
                                            : r.distance_km <= 15
                                            ? "bg-blue-500 text-white"
                                            : "bg-orange-500 text-white"
                                        }`}
                                      >
                                        {r.distance_km <= 7 
                                          ? "✓ Próximo"
                                          : r.distance_km <= 15
                                          ? "• Normal"
                                          : "⚠ Longe"
                                        }
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Tempo de Viagem de Carro - Grande e Destacado */}
                                {r.estimated_travel_time_minutes != null && (
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Tempo de carro</p>
                                      <p className="text-2xl font-bold text-foreground">
                                        ~{r.estimated_travel_time_minutes} min
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">Tempo estimado</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Aviso se está fora do raio configurado */}
                            {maxRadiusKm != null && r.distance_km != null && r.distance_km > maxRadiusKm && (
                              <div className="rounded-lg border-2 border-orange-500/50 bg-orange-50 dark:bg-orange-900/20 p-3">
                                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                                  ⚠️ Este convite está fora do seu raio de busca configurado ({maxRadiusKm} km)
                                </p>
                              </div>
                            )}
                          </div>
                        ) : musicianLocation && (
                          <div className="rounded-lg border-2 border-border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">
                              Distância não disponível (gig sem coordenadas)
                            </p>
                          </div>
                        )}

                        {/* Data e Hora - Em linha única para escaneabilidade */}
                        <div className="flex items-center gap-4 text-sm">
                          {dateStr && (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{dateStr}</span>
                            </div>
                          )}
                          {timeStr && (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{timeStr}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges de status e compatibilidade */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="secondary" className="text-xs font-medium">
                          Convite Pendente
                        </Badge>
                        {hoursRemaining && hoursRemaining > 0 && hoursRemaining <= 48 && (
                          <Badge className="text-xs bg-orange-500 text-white border-0 font-medium">
                            {hoursRemaining}h restantes
                          </Badge>
                        )}
                        {/* Badges de distância */}
                        {r.distance_km != null && (
                          <>
                            {r.distance_km <= 7 && (
                              <Badge className="text-xs bg-green-500 text-white border-0 font-medium">
                                Próximo
                              </Badge>
                            )}
                            {r.distance_km > 7 && r.distance_km <= 15 && (
                              <Badge className="text-xs bg-blue-500 text-white border-0 font-medium">
                                Normal
                              </Badge>
                            )}
                            {r.distance_km > 15 && (
                              <Badge className="text-xs bg-orange-500 text-white border-0 font-medium">
                                Longe
                              </Badge>
                            )}
                          </>
                        )}
                        {/* Badge de fora do raio se configurado */}
                        {r.distance_km != null && maxRadiusKm != null && r.distance_km > maxRadiusKm && (
                          <Badge className="text-xs bg-red-500 text-white border-0 font-medium">
                            Fora do Raio
                          </Badge>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-col gap-2.5 pt-4 border-t-2 border-border/30">
                        {/* Botão Ver Detalhes - sempre visível */}
                        <Button
                          variant="outline"
                          className="w-full border-2 hover:bg-accent/50"
                          onClick={async () => {
                            try {
                              const { data: inviteData, error: inviteError } = await supabase
                                .from("invites")
                                .select("*")
                                .eq("id", r.invite_id)
                                .single();

                              if (inviteError) throw inviteError;
                              if (!inviteData) throw new Error("Convite não encontrado");

                              const { data: gigData, error: gigError } = await supabase
                                .from("gigs")
                                .select("*")
                                .eq("id", inviteData.gig_id)
                                .single();

                              if (gigError) throw new Error("Erro ao carregar dados da gig");

                              const { data: roleData, error: roleError } = await supabase
                                .from("gig_roles")
                                .select("*")
                                .eq("id", inviteData.gig_role_id)
                                .single();

                              if (roleError) throw new Error("Erro ao carregar dados da vaga");

                              // Incluir informações de distância calculadas
                              let distanceKm: number | null = null;
                              let estimatedTravelTimeMinutes: number | null = null;
                              
                              if (musicianLocation && gigData.latitude && gigData.longitude) {
                                distanceKm = haversineKm(
                                  musicianLocation.lat,
                                  musicianLocation.lng,
                                  gigData.latitude,
                                  gigData.longitude
                                );
                                estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
                              }

                              const formattedInvite = {
                                ...inviteData,
                                gig: gigData,
                                role: roleData,
                                distance_km: distanceKm,
                                estimated_travel_time_minutes: estimatedTravelTimeMinutes,
                                max_radius_km: maxRadiusKm,
                              };
                              
                              setSelectedInvite(formattedInvite);
                              setDialogOpen(true);
                            } catch (err: any) {
                              console.error("Error loading invite details:", err);
                              setErrorMsg(`Erro ao carregar detalhes do convite: ${err.message}`);
                            }
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>

                        {/* Botões Aceitar/Recusar */}
                        <div className="space-y-2.5">
                          <Button
                            variant="default"
                            className="w-full font-semibold text-base py-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all"
                            onClick={() => acceptInvite(r.invite_id)}
                            disabled={busyId === r.invite_id}
                          >
                            {busyId === r.invite_id ? (
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-5 w-5" />
                            )}
                            Aceitar Convite
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleDeclineClick(r.invite_id)}
                            disabled={busyId === r.invite_id}
                          >
                            {busyId === r.invite_id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <X className="mr-2 h-4 w-4" />
                            )}
                            Recusar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {items.length > 3 && (
              <CardContent className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/gigs")}
                >
                  Ver todas as {items.length} convites
                </Button>
              </CardContent>
            )}
          </div>
        )}
      </Card>

      <InviteDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invite={selectedInvite}
        onAccept={() => {
          if (selectedInvite?.id) {
            acceptInvite(selectedInvite.id);
            setDialogOpen(false);
          }
        }}
        onDecline={() => {
          if (selectedInvite?.id) {
            declineInvite(selectedInvite.id);
            setDialogOpen(false);
          }
        }}
      />

      {/* Dialog de Aviso de Compromisso */}
      <Dialog 
        open={showCommitmentWarning} 
        onOpenChange={(open) => {
          // Só permite fechar se o contador chegou a 0
          if (!open && countdown === 0) {
            setShowCommitmentWarning(false);
            setCountdown(5);
          } else if (!open) {
            // Se tentar fechar antes do contador, não fecha
            setShowCommitmentWarning(true);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>
                Compromisso Confirmado
              </DialogTitle>
            </div>
            <DialogDescription>
              Você aceitou o convite para <strong>{acceptedInviteTitle || "esta gig"}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Importante:</strong> Sabemos que imprevistos acontecem, 
                mas é fundamental que você honre este compromisso. A confiança entre músicos e contratantes 
                é essencial para o funcionamento da plataforma.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Cancelamentos Frequentes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A frequência de cancelamentos, mesmo com antecedência, pode levar ao bloqueio 
                    temporário na plataforma.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Cancelamento com Menos de 24h
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Cancelamentos com menos de 24 horas até o início do evento</strong> resultam 
                    em bloqueio de <strong>7 dias</strong> para receber convites de novas gigs.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Ao continuar, você confirma que entendeu e concorda com estas políticas.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-6">
            {countdown > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-8 w-8 rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="text-primary font-bold">{countdown}</span>
                </div>
                <span>Por favor, leia as informações acima antes de continuar</span>
              </div>
            )}
            <Button
              onClick={() => setShowCommitmentWarning(false)}
              disabled={countdown > 0}
              className="min-w-[200px]"
            >
              {countdown > 0 ? `Aguarde ${countdown}s` : "Entendi e Concordo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

