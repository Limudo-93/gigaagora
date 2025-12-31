"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Eye,
  Trash2,
  Check,
  X,
  User,
  Loader2,
  UserCheck,
  DollarSign,
  Navigation
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GigDetailsDialog from "@/components/dashboard/GigDetailsDialog";
import ShareGigButton from "@/components/dashboard/ShareGigButton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useNotification } from "@/components/ui/notification-provider";
import { haversineKm, estimateTravelMin, computeRegionLabel } from "@/lib/geo";
import DeclineReasonDialog, { DeclineReason } from "@/components/dashboard/DeclineReasonDialog";

type GigRow = {
  id: string;
  title: string | null;
  description: string | null;
  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  start_time: string | null;
  end_time: string | null;
  show_minutes: number | null;
  break_minutes: number | null;
  status: string | null;
  flyer_url: string | null;
  contractor_id: string;
  contractor_name: string | null;
  contractor_photo_url: string | null;
  invite_id: string | null;
  invite_status: string | null;
  compatible_instruments: string[];
  cache?: number | null;
  confirmed_musicians?: {
    musician_id: string;
    musician_name: string | null;
    musician_photo_url: string | null;
    instrument: string;
  }[];
  // Campos de localização
  latitude?: number | null;
  longitude?: number | null;
  region_label?: string | null;
  // Campos calculados
  distance_km?: number | null;
  estimated_travel_time_minutes?: number | null;
};

function formatDateBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GigsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<GigRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past">("all");
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"musician" | "contractor" | null>(null);
  const [deletingGigId, setDeletingGigId] = useState<string | null>(null);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [showDeclineReasonDialog, setShowDeclineReasonDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeclineInviteId, setPendingDeclineInviteId] = useState<string | null>(null);
  const [pendingDeclineGigId, setPendingDeclineGigId] = useState<string | null>(null);
  const [pendingDeleteGigId, setPendingDeleteGigId] = useState<string | null>(null);
  const notification = useNotification();
  const [musicianLocation, setMusicianLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | null>(null);

  // Busca o usuário atual e seu tipo
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", user.id)
          .single();
        
        setUserType((profile?.user_type as "musician" | "contractor") || null);
      }
    };
    getUser();
  }, []);

  // Carrega as gigs
  const loadGigs = useCallback(async () => {
    if (!userId || !userType) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar localização e raio de busca do músico (se for músico)
      let musicianLat: number | null = null;
      let musicianLng: number | null = null;
      let radius: number | null = null;

      if (userType === "musician") {
        // Busca os instrumentos, localização e raio do músico
        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("instruments, latitude, longitude, max_radius_km, strengths_counts")
          .eq("user_id", userId)
          .single();

        const instruments = (musicianProfile?.instruments as string[]) || [];
        
        musicianLat = (musicianProfile?.latitude as number | null | undefined) ?? null;
        musicianLng = (musicianProfile?.longitude as number | null | undefined) ?? null;
        
        // Buscar raio de busca (priorizar strengths_counts.searchRadius onde o slider salva)
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
        
        console.log(`[GigsPage] Raio de busca configurado: ${radius} km`, {
          fromStrengthsCounts: musicianProfile?.strengths_counts ? (musicianProfile.strengths_counts as any)?.searchRadius : null,
          fromMaxRadiusKm: musicianProfile?.max_radius_km,
          finalRadius: radius
        });
        
        setMaxRadiusKm(radius);
        
        if (musicianLat && musicianLng) {
          setMusicianLocation({ lat: musicianLat, lng: musicianLng });
        } else {
          setMusicianLocation(null);
        }
        
        if (instruments.length === 0) {
          setGigs([]);
          setFilteredGigs([]);
          setLoading(false);
          return;
        }

        // Busca gigs publicadas com roles compatíveis
        const { data: rolesData } = await supabase
          .from("gig_roles")
          .select("gig_id, instrument")
          .in("instrument", instruments);

        const compatibleGigIds = [...new Set((rolesData || []).map((r: any) => r.gig_id))];

        if (compatibleGigIds.length === 0) {
          setGigs([]);
          setFilteredGigs([]);
          setLoading(false);
          return;
        }

        // Busca as gigs (incluindo coordenadas e região)
        const { data: gigsData, error: gigsError } = await supabase
          .from("gigs")
          .select(`
            id,
            title,
            description,
            location_name,
            address_text,
            city,
            state,
            latitude,
            longitude,
            region_label,
            start_time,
            end_time,
            show_minutes,
            break_minutes,
            status,
            flyer_url,
            contractor_id,
            gig_roles(id, instrument, cache)
          `)
          .eq("status", "published")
          .neq("contractor_id", userId)
          .in("id", compatibleGigIds)
          .order("start_time", { ascending: true });

        if (gigsError) {
          console.error("Error loading gigs:", gigsError);
          setError(`Erro ao carregar gigs: ${gigsError.message}`);
          setGigs([]);
          setLoading(false);
          return;
        }

        // Busca todos os invites de uma vez (otimização)
        const gigIds = (gigsData || []).map((g: any) => g.id);
        const { data: allInvites } = await supabase
          .from("invites")
          .select("id, gig_id, status")
          .eq("musician_id", userId)
          .in("gig_id", gigIds);

        const invitesMap = new Map(
          (allInvites || []).map((inv: any) => [inv.gig_id, { id: inv.id, status: inv.status }])
        );

        // Busca informações dos contractors
        const contractorIds = [...new Set((gigsData || []).map((g: any) => g.contractor_id))];
        const { data: contractorsData } = await supabase
          .from("profiles")
          .select("user_id, display_name, photo_url")
          .in("user_id", contractorIds);

        const contractorsMap = new Map(
          (contractorsData || []).map((c: any) => [c.user_id, { name: c.display_name, photo: c.photo_url }])
        );

        // Processa os dados
        const processedGigs: GigRow[] = [];
        const uniqueGigIds = new Set<string>();

        for (const gig of gigsData || []) {
          if (uniqueGigIds.has(gig.id)) continue;
          uniqueGigIds.add(gig.id);

          const invite = invitesMap.get(gig.id);
          const compatibleInstruments = (gig.gig_roles || [])
            .map((gr: any) => gr.instrument)
            .filter((inst: string) => instruments.includes(inst));
          const compatibleRole = (gig.gig_roles || []).find((gr: any) => instruments.includes(gr.instrument));
          const contractorInfo = contractorsMap.get(gig.contractor_id);

          // Calcular distância e tempo de viagem se temos coordenadas
          let distanceKm: number | null = null;
          let estimatedTravelTimeMinutes: number | null = null;
          
          const gigLat = gig.latitude as number | null | undefined;
          const gigLng = gig.longitude as number | null | undefined;
          
          if (musicianLat != null && musicianLng != null && gigLat != null && gigLng != null) {
            distanceKm = haversineKm(musicianLat, musicianLng, gigLat, gigLng);
            estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
          }

          processedGigs.push({
            id: gig.id,
            title: gig.title,
            description: gig.description,
            location_name: gig.location_name,
            address_text: gig.address_text,
            city: gig.city,
            state: gig.state,
            start_time: gig.start_time,
            end_time: gig.end_time,
            show_minutes: gig.show_minutes,
            break_minutes: gig.break_minutes,
            status: gig.status,
            flyer_url: gig.flyer_url,
            contractor_id: gig.contractor_id,
            contractor_name: contractorInfo?.name || null,
            contractor_photo_url: contractorInfo?.photo || null,
            invite_id: invite?.id || null,
            invite_status: invite?.status || null,
            compatible_instruments: compatibleInstruments,
            cache: compatibleRole?.cache || null,
            latitude: gigLat ?? null,
            longitude: gigLng ?? null,
            region_label: (() => {
              // Recalcular region_label se tivermos coordenadas, para garantir formato específico
              if (gigLat != null && gigLng != null) {
                const computed = computeRegionLabel(
                  gig.state ?? null,
                  gig.city ?? null,
                  gigLat,
                  gigLng
                );
                // Se o computed for mais específico (contém "Zona" ou cidade específica), usar ele
                // Caso contrário, usar o do banco se existir
                if (computed && (computed.includes("Zona") || computed.includes("—"))) {
                  return computed;
                }
              }
              return gig.region_label ?? null;
            })(),
            distance_km: distanceKm,
            estimated_travel_time_minutes: estimatedTravelTimeMinutes,
          });
        }

        // Filtrar por raio de busca se temos localização do músico e raio configurado
        let finalGigs = processedGigs;
        if (musicianLat != null && musicianLng != null && radius != null) {
          const radiusValue = radius; // Garantir que radius não é null neste escopo
          console.log(`[GigsPage] Filtrando gigs por raio: ${radiusValue} km. Total antes: ${processedGigs.length}`);
          finalGigs = processedGigs.filter((gig) => {
            // Se não tem distância calculada, exclui (não podemos filtrar sem distância)
            if (gig.distance_km == null) {
              console.log(`[GigsPage] Excluindo gig ${gig.id} - sem distância calculada`);
              return false;
            }
            // Filtra pelo raio configurado - só inclui se estiver dentro do raio
            const isWithinRadius = gig.distance_km <= radiusValue;
            if (!isWithinRadius) {
              console.log(`[GigsPage] Excluindo gig ${gig.id} - distância ${gig.distance_km.toFixed(1)} km > raio ${radiusValue} km`);
            }
            return isWithinRadius;
          });
          
          console.log(`[GigsPage] Total após filtro: ${finalGigs.length}`);
          
          // Ordenar por distância (menor primeiro)
          finalGigs.sort((a, b) => {
            if (a.distance_km != null && b.distance_km != null) {
              return a.distance_km - b.distance_km;
            }
            if (a.distance_km != null && b.distance_km == null) return -1;
            if (a.distance_km == null && b.distance_km != null) return 1;
            return 0;
          });
        } else {
          console.log(`[GigsPage] Não filtrando por raio - musicianLat: ${musicianLat}, musicianLng: ${musicianLng}, radius: ${radius}`);
        }

        setGigs(finalGigs);
        setFilteredGigs(finalGigs);
      } else {
        // Para contractors: mostra TODAS as gigs (draft, published, cancelled)
        const { data, error: gigsError } = await supabase
          .from("gigs")
          .select(
            "id,title,description,location_name,address_text,city,state,latitude,longitude,region_label,start_time,end_time,show_minutes,break_minutes,status,flyer_url,contractor_id"
          )
          .eq("contractor_id", userId)
          .order("start_time", { ascending: true });

        if (gigsError) {
          console.error("Error loading gigs:", gigsError);
          setError(`Erro ao carregar gigs: ${gigsError.message}`);
          setGigs([]);
          setLoading(false);
          return;
        }

        // Busca músicos confirmados para todas as gigs de uma vez
        const gigIds = (data || []).map((g: any) => g.id);
        const confirmedMusiciansMap = new Map<string, any[]>();
        
        if (gigIds.length > 0) {
          // Buscar confirmados para todas as gigs
          for (const gigId of gigIds) {
            try {
              const { data: confirmedData } = await supabase.rpc(
                "rpc_list_confirmed_musicians_for_gig",
                { p_gig_id: gigId }
              );
              if (confirmedData && confirmedData.length > 0) {
                confirmedMusiciansMap.set(gigId, confirmedData.map((m: any) => ({
                  musician_id: m.musician_id,
                  musician_name: m.musician_name,
                  musician_photo_url: m.musician_photo_url,
                  instrument: m.instrument,
                })));
              }
            } catch (err) {
              console.error(`Error loading confirmed musicians for gig ${gigId}:`, err);
            }
          }
        }

        const processedGigs: GigRow[] = (data || []).map((gig: any) => ({
          ...gig,
          contractor_name: null,
          contractor_photo_url: null,
          invite_id: null,
          invite_status: null,
          compatible_instruments: [],
          confirmed_musicians: confirmedMusiciansMap.get(gig.id) || [],
        }));

        setGigs(processedGigs);
        setFilteredGigs(processedGigs);
      }
    } catch (e: any) {
      console.error("Exception loading gigs:", e);
      setError(e?.message ?? "Erro inesperado ao carregar gigs.");
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    if (userId && userType) {
      loadGigs();
    }
  }, [userId, userType, loadGigs]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId || !userType) return;

    const channel = supabase
      .channel(`gigs-page-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gigs',
          filter: userType === 'contractor' 
            ? `contractor_id=eq.${userId}`
            : undefined,
        },
        () => {
          console.log('Mudança detectada em gigs, recarregando...');
          loadGigs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invites',
          filter: userType === 'musician' 
            ? `musician_id=eq.${userId}`
            : undefined,
        },
        () => {
          console.log('Mudança detectada em invites, recarregando...');
          loadGigs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'musician_profiles',
          filter: userType === 'musician' 
            ? `user_id=eq.${userId}`
            : undefined,
        },
        (payload) => {
          // Recarregar se o raio de busca ou localização mudou
          const oldData = payload.old as any;
          const newData = payload.new as any;
          
          const oldRadius = oldData?.max_radius_km || (oldData?.strengths_counts as any)?.searchRadius;
          const newRadius = newData?.max_radius_km || (newData?.strengths_counts as any)?.searchRadius;
          
          const oldLat = oldData?.latitude;
          const newLat = newData?.latitude;
          const oldLng = oldData?.longitude;
          const newLng = newData?.longitude;
          
          if (oldRadius !== newRadius || oldLat !== newLat || oldLng !== newLng) {
            console.log('Mudança detectada em musician_profiles (raio ou localização), recarregando gigs...', {
              oldRadius,
              newRadius,
              oldLat,
              newLat,
              oldLng,
              newLng
            });
            loadGigs();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType, loadGigs]);

  // Filtra gigs baseado na busca e filtro de status
  useEffect(() => {
    let filtered = [...gigs];

    // Filtro por status
    const now = new Date();
    if (filterStatus === "upcoming") {
      filtered = filtered.filter((g) => {
        if (!g.start_time) return false;
        return new Date(g.start_time) >= now;
      });
    } else if (filterStatus === "past") {
      filtered = filtered.filter((g) => {
        if (!g.start_time) return false;
        return new Date(g.start_time) < now;
      });
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((g) => {
        const title = (g.title || "").toLowerCase();
        const location = (g.location_name || "").toLowerCase();
        const city = (g.city || "").toLowerCase();
        const state = (g.state || "").toLowerCase();
        const address = (g.address_text || "").toLowerCase();
        const description = (g.description || "").toLowerCase();

        return (
          title.includes(term) ||
          location.includes(term) ||
          city.includes(term) ||
          state.includes(term) ||
          address.includes(term) ||
          description.includes(term)
        );
      });
    }

    setFilteredGigs(filtered);
  }, [gigs, searchTerm, filterStatus]);

  const handleOpenGig = (gigId: string) => {
    setSelectedGigId(gigId);
    setDialogOpen(true);
  };

  const handleAcceptInvite = async (gigId: string, inviteId: string | null, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!inviteId) {
      setError("Convite não encontrado. Aguarde o sistema criar o convite automaticamente.");
      return;
    }

    const gig = gigs.find(g => g.id === gigId);
    if (gig && gig.invite_status && gig.invite_status !== 'pending') {
      setError(`Este convite já foi ${gig.invite_status === 'accepted' ? 'aceito' : 'recusado'}.`);
      return;
    }

    setProcessingInviteId(inviteId);
    setError(null);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_accept_invite", {
        p_invite_id: inviteId,
      });

      if (rpcError) {
        console.error("RPC acceptInvite error:", rpcError);
        setError(`Erro ao aceitar convite: ${rpcError.message}`);
        setProcessingInviteId(null);
        return;
      }

      if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData && !rpcData.ok) {
        const message = (rpcData as any)?.message || "Erro ao aceitar convite";
        setError(message);
        setProcessingInviteId(null);
        return;
      }

      // Atualiza o estado local
      setGigs((prev) =>
        prev.map((g) =>
          g.id === gigId ? { ...g, invite_status: "accepted", invite_id: inviteId } : g
        )
      );
      setFilteredGigs((prev) =>
        prev.map((g) =>
          g.id === gigId ? { ...g, invite_status: "accepted", invite_id: inviteId } : g
        )
      );
      setProcessingInviteId(null);
    } catch (err: any) {
      console.error("acceptInvite exception:", err);
      setError(err?.message ?? "Erro inesperado ao aceitar convite.");
      setProcessingInviteId(null);
    }
  };

  const handleDeclineInvite = async (gigId: string, inviteId: string | null, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!inviteId) {
      setError("Convite não encontrado.");
      return;
    }

    const gig = gigs.find(g => g.id === gigId);
    if (gig && gig.invite_status && gig.invite_status !== 'pending') {
      setError(`Este convite já foi ${gig.invite_status === 'accepted' ? 'aceito' : 'recusado'}.`);
      return;
    }

    setPendingDeclineInviteId(inviteId);
    setPendingDeclineGigId(gigId);
    setShowDeclineConfirm(true);
  };

  const handleDeclineConfirm = async () => {
    const inviteId = pendingDeclineInviteId;
    const gigId = pendingDeclineGigId;
    if (!inviteId || !gigId) return;

    setProcessingInviteId(inviteId);
    setError(null);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_decline_invite", {
        p_invite_id: inviteId,
      });

      if (rpcError) {
        console.error("RPC declineInvite error:", rpcError);
        setError(`Erro ao recusar convite: ${rpcError.message}`);
        setProcessingInviteId(null);
        return;
      }

      if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData && !rpcData.ok) {
        const message = (rpcData as any)?.message || "Erro ao recusar convite";
        setError(message);
        setProcessingInviteId(null);
        return;
      }

      setGigs((prev) =>
        prev.map((g) =>
          g.id === gigId ? { ...g, invite_status: "declined" } : g
        )
      );
      setFilteredGigs((prev) =>
        prev.map((g) =>
          g.id === gigId ? { ...g, invite_status: "declined" } : g
        )
      );
      setProcessingInviteId(null);
      setShowDeclineReasonDialog(false);
      setPendingDeclineInviteId(null);
      setPendingDeclineGigId(null);
      notification.showNotification({
        type: "success",
        title: "Convite recusado",
        message: "O convite foi recusado com sucesso.",
      });
    } catch (err: any) {
      console.error("declineInvite exception:", err);
      setError(err?.message ?? "Erro inesperado ao recusar convite.");
      setProcessingInviteId(null);
      setShowDeclineReasonDialog(false);
      setPendingDeclineInviteId(null);
      setPendingDeclineGigId(null);
    }
  };

  const handleDeleteGig = (gigId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteGigId(gigId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const gigId = pendingDeleteGigId;
    if (!gigId) return;

    if (!userId) {
      setError("Usuário não identificado.");
      setShowDeleteConfirm(false);
      setPendingDeleteGigId(null);
      return;
    }

    setDeletingGigId(gigId);
    setError(null);

    try {
      const { data: gigData, error: fetchError } = await supabase
        .from("gigs")
        .select("contractor_id")
        .eq("id", gigId)
        .single();

      if (fetchError || !gigData) {
        setError("Erro ao verificar permissões.");
        setDeletingGigId(null);
        return;
      }

      if (gigData.contractor_id !== userId) {
        setError("Você não tem permissão para apagar esta gig.");
        setDeletingGigId(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from("gigs")
        .delete()
        .eq("id", gigId)
        .eq("contractor_id", userId);

      if (deleteError) {
        console.error("Error deleting gig:", deleteError);
        setError(`Erro ao apagar gig: ${deleteError.message}`);
        setDeletingGigId(null);
        return;
      }

      setGigs((prev) => prev.filter((g) => g.id !== gigId));
      setFilteredGigs((prev) => prev.filter((g) => g.id !== gigId));
      setDeletingGigId(null);
    } catch (err: any) {
      console.error("deleteGig exception:", err);
      setError(err?.message ?? "Erro inesperado ao apagar gig.");
      setDeletingGigId(null);
      setShowDeleteConfirm(false);
      setPendingDeleteGigId(null);
      notification.showNotification({
        type: "success",
        title: "Gig excluída",
        message: "A gig foi excluída com sucesso.",
      });
    }
  };

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {userType === "contractor" ? "Minhas Gigs" : "Gigs Disponíveis"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 md:mt-2">
              {userType === "contractor" 
                ? "Gerencie suas gigs criadas" 
                : "Explore e encontre oportunidades de trabalho"}
            </p>
          </div>
          {userType === "contractor" && (
            <Button asChild>
              <Link href={"/dashboard/gigs/new" as any}>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Criar Nova Gig</span>
                <span className="sm:hidden">Nova</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Filtros e Busca */}
        <Card className="border-border/50 backdrop-blur-xl bg-card/80">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Barra de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por título, localização, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-3 rounded-md bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Filtros por status */}
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <TabsList className="w-full sm:w-auto bg-muted">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none">Todas</TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">Futuras</TabsTrigger>
                  <TabsTrigger value="past" className="flex-1 sm:flex-none">Passadas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens de erro */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold">Erro:</p>
                <p className="mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80 font-bold text-lg leading-none"
                aria-label="Fechar erro"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Lista de Gigs */}
        {loading ? (
          <Card>
            <CardContent className="px-4 py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Carregando gigs...</p>
            </CardContent>
          </Card>
        ) : filteredGigs.length === 0 ? (
          <Card>
            <CardContent className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                {searchTerm ? "Nenhuma gig encontrada" : "Nenhuma gig disponível"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os filtros de busca."
                  : userType === "contractor"
                  ? "Você ainda não criou nenhuma gig."
                  : "Não há gigs publicadas no momento."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGigs.map((gig) => {
              const date = formatDateBR(gig.start_time);
              const time = formatTimeBR(gig.start_time);
              const location = gig.location_name || "Local a definir";
              const cityState = [gig.city, gig.state].filter(Boolean).join(", ") || "";

              return (
                <Card
                  key={gig.id}
                  className={`border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    userType === "musician" && gig.invite_status === "declined" 
                      ? "opacity-75" 
                      : ""
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Flyer do evento ou logo padrão */}
                    <div className="w-full h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative">
                      {gig.flyer_url ? (
                        <img
                          src={gig.flyer_url}
                          alt={gig.title || "Flyer do evento"}
                          className="w-full h-full object-cover"
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
                      {userType === "musician" && gig.cache && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white shadow-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium opacity-90 mb-1">Cachê</p>
                              <p className="text-2xl md:text-3xl font-bold">
                                R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gig.cache)}
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 opacity-80" />
                          </div>
                        </div>
                      )}

                      {/* Título */}
                      <div>
                        <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2">
                          {gig.title || "Gig sem título"}
                        </h3>

                        {/* Publicado por */}
                        {userType === "musician" && gig.contractor_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span>
                              Publicado por <span className="font-medium text-foreground">{gig.contractor_name}</span>
                            </span>
                          </div>
                        )}

                        {/* Instrumentos compatíveis */}
                        {userType === "musician" && gig.compatible_instruments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {gig.compatible_instruments.map((instrument, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                                {instrument}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Informações principais - Reorganizadas para escaneabilidade */}
                      <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                        {/* Região - Destacada */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            {gig.region_label ? (
                              <div>
                                <p className="font-semibold text-sm text-foreground">{gig.region_label}</p>
                                {location && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{location}</p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-sm text-foreground truncate">{location}</p>
                                {cityState && (
                                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{cityState}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Distância e Tempo de Viagem - DESTAQUE MUITO VISÍVEL */}
                        {userType === "musician" && (gig.distance_km != null || gig.estimated_travel_time_minutes != null) ? (
                          <div className="space-y-2">
                            {/* Card de Distância e Tempo - DESTAQUE */}
                            <div className={`rounded-xl border-2 p-4 shadow-md ${
                              gig.distance_km != null
                                ? gig.distance_km <= 7
                                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
                                  : gig.distance_km <= 15
                                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
                                  : "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30"
                                : "border-primary/50 bg-gradient-to-br from-primary/10 to-purple-50 dark:from-primary/20 dark:to-purple-900/20"
                            }`}>
                              <div className="grid grid-cols-2 gap-4">
                                {/* Distância - Grande e Destacada */}
                                {gig.distance_km != null && (
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      gig.distance_km <= 7
                                        ? "bg-green-500/20"
                                        : gig.distance_km <= 15
                                        ? "bg-blue-500/20"
                                        : "bg-orange-500/20"
                                    }`}>
                                      <Navigation className={`h-5 w-5 ${
                                        gig.distance_km <= 7
                                          ? "text-green-600 dark:text-green-400"
                                          : gig.distance_km <= 15
                                          ? "text-blue-600 dark:text-blue-400"
                                          : "text-orange-600 dark:text-orange-400"
                                      }`} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Distância</p>
                                      <p className={`text-2xl font-bold ${
                                        gig.distance_km <= 7
                                          ? "text-green-700 dark:text-green-300"
                                          : gig.distance_km <= 15
                                          ? "text-blue-700 dark:text-blue-300"
                                          : "text-orange-700 dark:text-orange-300"
                                      }`}>
                                        {gig.distance_km.toFixed(1)} km
                                      </p>
                                      {/* Status Perto/Normal/Longe */}
                                      <Badge 
                                        className={`mt-1.5 text-xs font-semibold ${
                                          gig.distance_km <= 7
                                            ? "bg-green-500 text-white"
                                            : gig.distance_km <= 15
                                            ? "bg-blue-500 text-white"
                                            : "bg-orange-500 text-white"
                                        }`}
                                      >
                                        {gig.distance_km <= 7 
                                          ? "✓ Próximo"
                                          : gig.distance_km <= 15
                                          ? "• Normal"
                                          : "⚠ Longe"
                                        }
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Tempo de Viagem de Carro - Grande e Destacado */}
                                {gig.estimated_travel_time_minutes != null && (
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Tempo de carro</p>
                                      <p className="text-2xl font-bold text-foreground">
                                        ~{gig.estimated_travel_time_minutes} min
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">Tempo estimado</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Aviso se está fora do raio configurado */}
                            {maxRadiusKm != null && gig.distance_km != null && gig.distance_km > maxRadiusKm && (
                              <div className="rounded-lg border-2 border-orange-500/50 bg-orange-50 dark:bg-orange-900/20 p-3">
                                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                                  ⚠️ Este convite está fora do seu raio de busca configurado ({maxRadiusKm} km)
                                </p>
                              </div>
                            )}
                          </div>
                        ) : userType === "musician" && musicianLocation && (
                          <div className="rounded-lg border-2 border-border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">
                              Distância não disponível (gig sem coordenadas)
                            </p>
                          </div>
                        )}

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

                      {/* Descrição (preview) */}
                      {gig.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {gig.description}
                        </p>
                      )}

                      {/* Badges de status */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {gig.status === "draft" ? "Rascunho" : gig.status === "cancelled" ? "Cancelada" : "Publicada"}
                        </Badge>
                        {gig.show_minutes && (
                          <Badge variant="secondary" className="text-xs font-medium">
                            {Math.floor(gig.show_minutes / 60)}h
                          </Badge>
                        )}
                        {userType === "musician" && gig.invite_status === "accepted" && (
                          <Badge className="text-xs bg-green-500 text-white border-0 font-medium">
                            ✓ Aceito
                          </Badge>
                        )}
                        {userType === "musician" && gig.invite_status === "declined" && (
                          <Badge className="text-xs bg-red-500 text-white border-0 font-medium">
                            ✗ Recusado
                          </Badge>
                        )}
                        {/* Badges de distância */}
                        {userType === "musician" && gig.distance_km != null && (
                          <>
                            {gig.distance_km <= 7 && (
                              <Badge className="text-xs bg-green-500 text-white border-0 font-medium">
                                Próximo
                              </Badge>
                            )}
                            {gig.distance_km > 7 && gig.distance_km <= 15 && (
                              <Badge className="text-xs bg-blue-500 text-white border-0 font-medium">
                                Normal
                              </Badge>
                            )}
                            {gig.distance_km > 15 && (
                              <Badge className="text-xs bg-orange-500 text-white border-0 font-medium">
                                Longe
                              </Badge>
                            )}
                          </>
                        )}
                        {/* Badge de fora do raio se configurado */}
                        {userType === "musician" && gig.distance_km != null && maxRadiusKm != null && gig.distance_km > maxRadiusKm && (
                          <Badge className="text-xs bg-red-500 text-white border-0 font-medium">
                            Fora do Raio
                          </Badge>
                        )}
                      </div>

                      {/* Músicos Confirmados - apenas para contractors */}
                      {userType === "contractor" && gig.confirmed_musicians && gig.confirmed_musicians.length > 0 && (
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
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {musician.musician_name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2) || "?"}
                                </div>
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
                        {/* Botão Ver Detalhes - sempre visível */}
                        <Button
                          variant="outline"
                          className="w-full border-2 hover:bg-accent/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGig(gig.id);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                         
                        {/* Botões para músicos */}
                        {userType === "musician" && (
                          <>
                            {gig.invite_status === "accepted" && (
                              <div className="w-full px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                                  <Check className="h-5 w-5" />
                                  <span className="font-semibold text-sm">Convite Aceito</span>
                                </div>
                                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                                  Você confirmou sua participação neste trabalho
                                </p>
                              </div>
                            )}
                             
                            {gig.invite_status === "declined" && (
                              <div className="w-full px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                                  <X className="h-5 w-5" />
                                  <span className="font-semibold text-sm">Convite Recusado</span>
                                </div>
                                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                                  Você recusou este convite
                                </p>
                              </div>
                            )}
                             
                            {(!gig.invite_status || (gig.invite_status !== "accepted" && gig.invite_status !== "declined")) && (
                              <div className="space-y-2.5">
                                <Button
                                  variant="default"
                                  className="w-full font-semibold text-base py-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all"
                                  onClick={(e) => handleAcceptInvite(gig.id, gig.invite_id, e)}
                                  disabled={processingInviteId === gig.invite_id || !gig.invite_id}
                                >
                                  {processingInviteId === gig.invite_id ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  ) : (
                                    <Check className="mr-2 h-5 w-5" />
                                  )}
                                  Aceitar Convite
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="w-full text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                  onClick={(e) => handleDeclineInvite(gig.id, gig.invite_id, e)}
                                  disabled={processingInviteId === gig.invite_id || !gig.invite_id}
                                  title="Recusar remove este convite da sua lista"
                                >
                                  {processingInviteId === gig.invite_id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="mr-2 h-4 w-4" />
                                  )}
                                  Recusar
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                  Recusar remove este convite da sua lista
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Botões para contractors */}
                        {userType === "contractor" && userId && gig.contractor_id === userId && (
                          <div className="grid grid-cols-2 gap-2.5">
                            <ShareGigButton 
                              gigId={gig.id} 
                              gigTitle={gig.title}
                              variant="outline"
                              className="w-full border-2"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-full border-2 border-destructive text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteGig(gig.id, e)}
                              disabled={deletingGigId === gig.id}
                            >
                              {deletingGigId === gig.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de detalhes */}
        <GigDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          gigId={selectedGigId}
        />

        {/* Diálogos de confirmação */}
        <ConfirmDialog
          open={showDeclineConfirm}
          onOpenChange={setShowDeclineConfirm}
          onConfirm={handleDeclineConfirm}
          title="Recusar Convite"
          description="Tem certeza que deseja recusar este convite?"
          confirmText="Sim, Recusar"
          cancelText="Cancelar"
          variant="default"
          loading={processingInviteId !== null}
        />

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDeleteConfirm}
          title="Excluir Gig"
          description="Tem certeza que deseja apagar esta gig? Esta ação não pode ser desfeita."
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          variant="destructive"
          loading={deletingGigId !== null}
        />
      </div>
    </DashboardLayout>
  );
}
