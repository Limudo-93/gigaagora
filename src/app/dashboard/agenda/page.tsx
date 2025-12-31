"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Filter,
  CalendarDays,
  List,
  Grid3x3,
  Eye,
  EyeOff,
  Check,
  X,
  Music,
  DollarSign,
  Navigation,
  User,
} from "lucide-react";
import { downloadICS, CalendarEvent } from "@/lib/ics-utils";
import { useRouter } from "next/navigation";
import { haversineKm, estimateTravelMin, computeRegionLabel } from "@/lib/geo";
import { Calendar as BigCalendar, View, CalendarProps, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

type ConfirmedGigRow = {
  confirmation_id: string;
  invite_id: string;
  created_at: string | null;
  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  instrument: string | null;
  cache?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  region_label?: string | null;
  distance_km?: number | null;
  estimated_travel_time_minutes?: number | null;
  contractor_name?: string | null;
  flyer_url?: string | null;
};

type PendingInviteRow = {
  invite_id: string;
  gig_id: string;
  gig_title: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name?: string | null;
  address_text?: string | null;
  city?: string | null;
  state?: string | null;
  instrument?: string | null;
  cache?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  region_label?: string | null;
  distance_km?: number | null;
  estimated_travel_time_minutes?: number | null;
  contractor_name?: string | null;
  flyer_url?: string | null;
};

type CalendarEventType = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "confirmed" | "pending";
    gig: ConfirmedGigRow | PendingInviteRow;
    location?: string;
    instrument?: string;
  };
};

// Localizer para react-big-calendar usando date-fns
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "pt-BR": ptBR },
});

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

function buildLocationText(r: ConfirmedGigRow | PendingInviteRow) {
  const parts = [
    r.location_name,
    r.address_text,
    r.city,
    r.state ? `- ${r.state}` : null,
  ].filter(Boolean);
  return parts.join(" • ");
}

export default function AgendaPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmedGigs, setConfirmedGigs] = useState<ConfirmedGigRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "confirmed" | "pending">("all");
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [musicianLocation, setMusicianLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Cores diferentes para cada card
  const cardColors = [
    { header: "from-amber-500 to-amber-600", badge: "bg-amber-700/50 border-amber-300/30" },
    { header: "from-blue-500 to-blue-600", badge: "bg-blue-700/50 border-blue-300/30" },
    { header: "from-purple-500 to-purple-600", badge: "bg-purple-700/50 border-purple-300/30" },
    { header: "from-pink-500 to-pink-600", badge: "bg-pink-700/50 border-pink-300/30" },
    { header: "from-indigo-500 to-indigo-600", badge: "bg-indigo-700/50 border-indigo-300/30" },
    { header: "from-teal-500 to-teal-600", badge: "bg-teal-700/50 border-teal-300/30" },
    { header: "from-rose-500 to-rose-600", badge: "bg-rose-700/50 border-rose-300/30" },
    { header: "from-cyan-500 to-cyan-600", badge: "bg-cyan-700/50 border-cyan-300/30" },
  ];

  // Busca o usuário atual
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    fetchUser();
  }, [router]);

  // Busca localização do músico
  useEffect(() => {
    if (!userId) return;

    const fetchMusicianLocation = async () => {
      try {
        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("latitude, longitude")
          .eq("user_id", userId)
          .single();

        if (musicianProfile?.latitude && musicianProfile?.longitude) {
          setMusicianLocation({
            lat: musicianProfile.latitude as number,
            lng: musicianProfile.longitude as number,
          });
        }
      } catch (e) {
        console.error("Error fetching musician location:", e);
      }
    };

    fetchMusicianLocation();
  }, [userId]);

  // Busca shows confirmados
  useEffect(() => {
    if (!userId) return;

    const fetchConfirmed = async () => {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_upcoming_confirmed_gigs");

        let transformed: ConfirmedGigRow[] = [];

        if (rpcError) {
          // Fallback: busca direta com mais informações
          const { data: directData, error: directError } = await supabase
            .from("confirmations")
            .select(`
              id,
              created_at,
              invite_id,
              invites!inner(
                id,
                gig_id,
                gig_role_id,
                gigs!inner(
                  id,
                  title,
                  start_time,
                  end_time,
                  location_name,
                  address_text,
                  city,
                  state,
                  latitude,
                  longitude,
                  region_label,
                  flyer_url,
                  contractor_id,
                  gig_roles!inner(
                    instrument,
                    cache
                  )
                )
              )
            `)
            .eq("invites.musician_id", userId)
            .gte("invites.gigs.start_time", new Date().toISOString())
            .order("invites.gigs.start_time", { ascending: true });

          if (directError) {
            console.error("Error fetching confirmed gigs:", directError);
            setErrorMsg("Erro ao carregar shows confirmados.");
            setLoading(false);
            return;
          }

          transformed = (directData ?? []).map((conf: any) => {
            const gig = conf.invites?.gigs;
            const role = gig?.gig_roles?.[0];
            const gigLat = gig?.latitude as number | null | undefined;
            const gigLng = gig?.longitude as number | null | undefined;
            
            let distanceKm: number | null = null;
            let estimatedTravelTimeMinutes: number | null = null;
            
            if (musicianLocation && gigLat != null && gigLng != null) {
              distanceKm = haversineKm(musicianLocation.lat, musicianLocation.lng, gigLat, gigLng);
              estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
            }

            return {
              confirmation_id: conf.id,
              invite_id: conf.invite_id,
              created_at: conf.created_at,
              gig_id: gig?.id ?? null,
              gig_title: gig?.title ?? null,
              start_time: gig?.start_time ?? null,
              end_time: gig?.end_time ?? null,
              location_name: gig?.location_name ?? null,
              address_text: gig?.address_text ?? null,
              city: gig?.city ?? null,
              state: gig?.state ?? null,
              instrument: role?.instrument ?? null,
              cache: role?.cache ?? null,
              latitude: gigLat ?? null,
              longitude: gigLng ?? null,
              region_label: gig?.region_label ?? null,
              flyer_url: gig?.flyer_url ?? null,
              distance_km: distanceKm,
              estimated_travel_time_minutes: estimatedTravelTimeMinutes,
            };
          });
        } else {
          // Buscar informações adicionais para os dados do RPC
          const enriched = await Promise.all(
            (rpcData ?? []).map(async (gig: any) => {
              // Buscar cache e coordenadas
              const { data: inviteData } = await supabase
                .from("invites")
                .select(`
                  gig_role_id,
                  gig_roles!inner(
                    cache
                  ),
                  gigs!inner(
                    latitude,
                    longitude,
                    region_label,
                    flyer_url,
                    contractor_id
                  )
                `)
                .eq("id", gig.invite_id)
                .single();

              const gigLat = inviteData?.gigs?.latitude as number | null | undefined;
              const gigLng = inviteData?.gigs?.longitude as number | null | undefined;
              
              let distanceKm: number | null = null;
              let estimatedTravelTimeMinutes: number | null = null;
              
              if (musicianLocation && gigLat != null && gigLng != null) {
                distanceKm = haversineKm(musicianLocation.lat, musicianLocation.lng, gigLat, gigLng);
                estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
              }

              // Buscar nome do contratante
              let contractorName: string | null = null;
              if (inviteData?.gigs?.contractor_id) {
                const { data: contractor } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("user_id", inviteData.gigs.contractor_id)
                  .single();
                contractorName = contractor?.display_name ?? null;
              }

              return {
                ...gig,
                cache: inviteData?.gig_roles?.cache ?? null,
                latitude: gigLat ?? null,
                longitude: gigLng ?? null,
                region_label: inviteData?.gigs?.region_label ?? null,
                flyer_url: inviteData?.gigs?.flyer_url ?? null,
                contractor_name: contractorName,
                distance_km: distanceKm,
                estimated_travel_time_minutes: estimatedTravelTimeMinutes,
              };
            })
          );

          transformed = enriched;
        }

        const sorted = transformed.sort((a: ConfirmedGigRow, b: ConfirmedGigRow) => {
          if (!a.start_time) return 1;
          if (!b.start_time) return -1;
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });

        setConfirmedGigs(sorted);
      } catch (e: any) {
        console.error("fetchConfirmed exception:", e);
        setErrorMsg(e?.message ?? "Erro inesperado ao carregar shows confirmados.");
      }
    };

    fetchConfirmed();
  }, [userId, musicianLocation]);

  // Busca convites pendentes
  useEffect(() => {
    if (!userId) return;

    const fetchPending = async () => {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_list_pending_invites");

        let transformed: PendingInviteRow[] = [];

        if (rpcError) {
          // Fallback: busca direta com mais informações
          const { data: directData, error: directError } = await supabase
            .from("invites")
            .select(`
              id,
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
                latitude,
                longitude,
                region_label,
                flyer_url,
                contractor_id,
                gig_roles!inner(
                  instrument,
                  cache
                )
              )
            `)
            .eq("musician_id", userId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (directError) {
            console.error("Error fetching pending invites:", directError);
            return;
          }

          transformed = (directData ?? []).map((invite: any) => {
            const gig = Array.isArray(invite.gigs) ? invite.gigs[0] : invite.gigs;
            const role = gig?.gig_roles?.[0];
            const gigLat = gig?.latitude as number | null | undefined;
            const gigLng = gig?.longitude as number | null | undefined;
            
            let distanceKm: number | null = null;
            let estimatedTravelTimeMinutes: number | null = null;
            
            if (musicianLocation && gigLat != null && gigLng != null) {
              distanceKm = haversineKm(musicianLocation.lat, musicianLocation.lng, gigLat, gigLng);
              estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
            }

            return {
              invite_id: invite.id,
              gig_id: invite.gig_id,
              gig_title: gig?.title ?? null,
              start_time: gig?.start_time ?? null,
              end_time: gig?.end_time ?? null,
              location_name: gig?.location_name ?? null,
              address_text: gig?.address_text ?? null,
              city: gig?.city ?? null,
              state: gig?.state ?? null,
              instrument: role?.instrument ?? null,
              cache: role?.cache ?? null,
              latitude: gigLat ?? null,
              longitude: gigLng ?? null,
              region_label: gig?.region_label ?? null,
              flyer_url: gig?.flyer_url ?? null,
              distance_km: distanceKm,
              estimated_travel_time_minutes: estimatedTravelTimeMinutes,
            };
          });
        } else {
          // Enriquecer dados do RPC com informações adicionais
          transformed = await Promise.all(
            (rpcData ?? []).map(async (invite: any) => {
              // Buscar coordenadas e outras informações
              const { data: gigData } = await supabase
                .from("gigs")
                .select(`
                  latitude,
                  longitude,
                  region_label,
                  flyer_url,
                  contractor_id
                `)
                .eq("id", invite.gig_id)
                .single();

              const gigLat = gigData?.latitude as number | null | undefined;
              const gigLng = gigData?.longitude as number | null | undefined;
              
              let distanceKm: number | null = null;
              let estimatedTravelTimeMinutes: number | null = null;
              
              if (musicianLocation && gigLat != null && gigLng != null) {
                distanceKm = haversineKm(musicianLocation.lat, musicianLocation.lng, gigLat, gigLng);
                estimatedTravelTimeMinutes = estimateTravelMin(distanceKm);
              }

              // Buscar nome do contratante
              let contractorName: string | null = null;
              if (gigData?.contractor_id) {
                const { data: contractor } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("user_id", gigData.contractor_id)
                  .single();
                contractorName = contractor?.display_name ?? null;
              }

              return {
                ...invite,
                latitude: gigLat ?? null,
                longitude: gigLng ?? null,
                region_label: gigData?.region_label ?? null,
                flyer_url: gigData?.flyer_url ?? null,
                contractor_name: contractorName,
                distance_km: distanceKm,
                estimated_travel_time_minutes: estimatedTravelTimeMinutes,
              };
            })
          );
        }

        setPendingInvites(transformed);
      } catch (e: any) {
        console.error("fetchPending exception:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [userId, musicianLocation]);

  // Converte gigs para eventos do calendário
  const calendarEvents = useMemo(() => {
    const events: CalendarEventType[] = [];

    if (showConfirmed) {
      confirmedGigs.forEach((gig) => {
        if (gig.start_time && gig.end_time) {
          const location = buildLocationText(gig);
          events.push({
            id: gig.confirmation_id,
            title: gig.gig_title || "Show confirmado",
            start: new Date(gig.start_time),
            end: new Date(gig.end_time),
            resource: {
              type: "confirmed",
              gig,
              location,
              instrument: gig.instrument || undefined,
            },
          });
        }
      });
    }

    if (showPending) {
      pendingInvites.forEach((invite) => {
        if (invite.start_time && invite.end_time) {
          events.push({
            id: invite.invite_id,
            title: invite.gig_title || "Convite pendente",
            start: new Date(invite.start_time),
            end: new Date(invite.end_time),
            resource: {
              type: "pending",
              gig: invite,
            },
          });
        }
      });
    }

    // Aplicar filtros
    let filtered = events;

    if (filterType !== "all") {
      filtered = filtered.filter((e) => e.resource.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          (e.resource.location && e.resource.location.toLowerCase().includes(term)) ||
          (e.resource.instrument && e.resource.instrument.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [confirmedGigs, pendingInvites, filterType, searchTerm, showConfirmed, showPending]);

  const handleDownloadICS = () => {
    const events: CalendarEvent[] = confirmedGigs
      .filter((gig) => gig.start_time && gig.end_time)
      .map((gig) => {
        const locationParts = [
          gig.location_name,
          gig.address_text,
          gig.city,
          gig.state,
        ].filter(Boolean);
        const location = locationParts.join(", ");

        return {
          title: gig.gig_title || "Show",
          startTime: gig.start_time!,
          endTime: gig.end_time!,
          location: location || undefined,
          description: `Show confirmado - ${gig.gig_title || "Show"}`,
        };
      });

    downloadICS(events, "agenda-chamaomusico.ics");
  };

  const handleSelectEvent = (event: CalendarEventType) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleAcceptInvite = async () => {
    if (!selectedEvent || selectedEvent.resource.type !== "pending") return;
    
    const inviteId = (selectedEvent.resource.gig as PendingInviteRow).invite_id;
    if (!inviteId) return;

    setProcessingInviteId(inviteId);
    setErrorMsg(null);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_accept_invite", {
        p_invite_id: inviteId,
      });

      if (rpcError) {
        console.error("RPC acceptInvite error:", rpcError);
        setErrorMsg(`Erro ao aceitar convite: ${rpcError.message}`);
        setProcessingInviteId(null);
        return;
      }

      if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData && !rpcData.ok) {
        const message = (rpcData as any)?.message || "Erro ao aceitar convite";
        setErrorMsg(message);
        setProcessingInviteId(null);
        return;
      }

      // Recarregar dados
      window.location.reload();
    } catch (err: any) {
      console.error("acceptInvite exception:", err);
      setErrorMsg(err?.message ?? "Erro inesperado ao aceitar convite.");
      setProcessingInviteId(null);
    }
  };

  const handleDeclineInvite = async () => {
    if (!selectedEvent || selectedEvent.resource.type !== "pending") return;
    
    const inviteId = (selectedEvent.resource.gig as PendingInviteRow).invite_id;
    if (!inviteId) return;

    if (!confirm("Tem certeza que deseja recusar este convite?")) {
      return;
    }

    setProcessingInviteId(inviteId);
    setErrorMsg(null);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_decline_invite", {
        p_invite_id: inviteId,
      });

      if (rpcError) {
        console.error("RPC declineInvite error:", rpcError);
        setErrorMsg(`Erro ao recusar convite: ${rpcError.message}`);
        setProcessingInviteId(null);
        return;
      }

      if (rpcData && typeof rpcData === 'object' && 'ok' in rpcData && !rpcData.ok) {
        const message = (rpcData as any)?.message || "Erro ao recusar convite";
        setErrorMsg(message);
        setProcessingInviteId(null);
        return;
      }

      // Recarregar dados
      window.location.reload();
    } catch (err: any) {
      console.error("declineInvite exception:", err);
      setErrorMsg(err?.message ?? "Erro inesperado ao recusar convite.");
      setProcessingInviteId(null);
    }
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const eventStyleGetter = (event: CalendarEventType) => {
    const isConfirmed = event.resource.type === "confirmed";
    return {
      className: isConfirmed
        ? "rbc-event-confirmed"
        : "rbc-event-pending",
      style: {
        backgroundColor: isConfirmed ? "#10b981" : "#f59e0b",
        borderColor: isConfirmed ? "#059669" : "#d97706",
        color: "white",
        borderRadius: "4px",
        padding: "2px 4px",
        fontSize: "0.875rem",
      },
    };
  };

  const nextConfirmedGig = confirmedGigs.find((gig) => gig.start_time);

  const stats = useMemo(() => {
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthConfirmed = confirmedGigs.filter((gig) => {
      if (!gig.start_time) return false;
      const gigDate = new Date(gig.start_time);
      return gigDate >= thisMonth && gigDate <= nextMonth;
    }).length;

    const monthPending = pendingInvites.filter((invite) => {
      if (!invite.start_time) return false;
      const inviteDate = new Date(invite.start_time);
      return inviteDate >= thisMonth && inviteDate <= nextMonth;
    }).length;

    return {
      confirmed: monthConfirmed,
      pending: monthPending,
      total: confirmedGigs.length + pendingInvites.length,
    };
  }, [currentDate, confirmedGigs, pendingInvites]);

  // Combina todos os eventos para exibir nos cards
  const allEventsForCards = useMemo(() => {
    const events: Array<{
      type: "confirmed" | "pending";
      gig: ConfirmedGigRow | PendingInviteRow;
      start_time: string | null;
      end_time: string | null;
      title: string | null;
      location?: string;
      instrument?: string;
    }> = [];

    confirmedGigs.forEach((gig) => {
      if (gig.start_time) {
        events.push({
          type: "confirmed",
          gig,
          start_time: gig.start_time,
          end_time: gig.end_time,
          title: gig.gig_title,
          location: buildLocationText(gig),
          instrument: gig.instrument || undefined,
        });
      }
    });

    pendingInvites.forEach((invite) => {
      if (invite.start_time) {
        events.push({
          type: "pending",
          gig: invite,
          start_time: invite.start_time,
          end_time: invite.end_time,
          title: invite.gig_title,
          location: buildLocationText(invite),
          instrument: invite.instrument || undefined,
        });
      }
    });

    return events
      .filter((e) => e.start_time)
      .sort((a, b) => {
        const timeA = new Date(a.start_time!).getTime();
        const timeB = new Date(b.start_time!).getTime();
        return timeA - timeB;
      });
  }, [confirmedGigs, pendingInvites]);

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-6 w-full">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Minha agenda de shows
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Visualize seus shows em diferentes formatos e gerencie sua agenda.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="border-white/70 bg-white/80">
              Hoje
            </Button>
            <Button onClick={handleDownloadICS} className="btn-gradient text-white">
              <Download className="mr-2 h-4 w-4" />
              Baixar .ics
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Erro:</p>
            <p className="mt-1">{errorMsg}</p>
          </div>
        )}

        {/* Cards de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-white/70 bg-white/80 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-wide text-foreground/60">
                Próximo show
              </p>
              {nextConfirmedGig ? (
                <>
                  <p className="text-lg font-semibold text-foreground line-clamp-1">
                    {nextConfirmedGig.gig_title || "Show confirmado"}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {formatDateTimeBR(nextConfirmedGig.start_time)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground/60">
                  Nenhum show confirmado
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-white/70 bg-white/80 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-wide text-foreground/60">
                Total de eventos
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {stats.total}
              </p>
              <p className="text-sm text-foreground/60">
                {stats.confirmed} confirmados, {stats.pending} pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/70 bg-white/80 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-wide text-foreground/60">
                Este mês
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {stats.confirmed + stats.pending}
              </p>
              <p className="text-sm text-foreground/60">
                Eventos agendados
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/70 bg-white/80 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-wide text-foreground/60">
                Convites pendentes
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {pendingInvites.length}
              </p>
              <p className="text-sm text-foreground/60">
                Aguardando resposta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Eventos - Cards Redesenhados */}
        {allEventsForCards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Próximos Eventos
              </h2>
              <Badge variant="secondary" className="text-xs">
                {allEventsForCards.length} {allEventsForCards.length === 1 ? "evento" : "eventos"}
              </Badge>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allEventsForCards.slice(0, 8).map((event, index) => {
                const eventDate = event.start_time ? new Date(event.start_time) : null;
                const isConfirmed = event.type === "confirmed";
                const day = eventDate ? format(eventDate, "dd", { locale: ptBR }) : "";
                const month = eventDate ? format(eventDate, "MMM", { locale: ptBR }).toUpperCase() : "";
                const time = eventDate ? format(eventDate, "HH:mm", { locale: ptBR }) : "";
                const weekday = eventDate ? format(eventDate, "EEEE", { locale: ptBR }) : "";
                
                // Seleciona cor baseada no índice, mas usa verde para confirmados
                const colorIndex = index % cardColors.length;
                const cardColor = isConfirmed 
                  ? { header: "from-emerald-500 to-emerald-600", badge: "bg-emerald-700/50 border-emerald-300/30" }
                  : cardColors[colorIndex];
                
                return (
                  <Card
                    key={event.type === "confirmed" ? (event.gig as ConfirmedGigRow).confirmation_id : (event.gig as PendingInviteRow).invite_id}
                    className="border border-white/70 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden group"
                    onClick={() => {
                      if (eventDate) {
                        const calendarEvent: CalendarEventType = {
                          id: event.type === "confirmed" ? (event.gig as ConfirmedGigRow).confirmation_id : (event.gig as PendingInviteRow).invite_id,
                          title: event.title || "Show",
                          start: eventDate,
                          end: event.end_time ? new Date(event.end_time) : eventDate,
                          resource: {
                            type: event.type,
                            gig: event.gig,
                            location: event.location,
                            instrument: event.instrument,
                          },
                        };
                        setSelectedEvent(calendarEvent);
                        setDialogOpen(true);
                      }
                    }}
                  >
                    <CardContent className="p-0">
                      {/* Header com data */}
                      <div
                        className={`relative p-4 text-white bg-gradient-to-br ${cardColor.header}`}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8" />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold">{day}</div>
                            <div className="text-xs font-medium opacity-90">{month}</div>
                          </div>
                          <Badge
                            className={`${cardColor.badge} text-white border`}
                          >
                            {isConfirmed ? "Confirmado" : "Pendente"}
                          </Badge>
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="p-5 space-y-3">
                        {/* Cachê em Destaque */}
                        {event.gig.cache && (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 text-white shadow-md">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium opacity-90 mb-0.5">Cachê</p>
                                <p className="text-xl font-bold">
                                  R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(event.gig.cache)}
                                </p>
                              </div>
                              <DollarSign className="h-6 w-6 opacity-80" />
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-[#ff6b4a] transition-colors">
                            {event.title || "Show"}
                          </h3>
                          <p className="text-xs text-foreground/60 mt-1 capitalize">{weekday}</p>
                        </div>

                        {/* Informações principais */}
                        <div className="space-y-2 bg-white/80 rounded-lg p-3 border border-white/60">
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Clock className="h-4 w-4 text-[#ff6b4a]" />
                            <span className="font-medium">{time}</span>
                          </div>

                          {event.location && (
                            <div className="flex items-start gap-2 text-sm text-foreground/70">
                              <MapPin className="h-4 w-4 text-[#2aa6a1] mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                {event.gig.region_label ? (
                                  <div>
                                    <p className="font-semibold text-foreground">{event.gig.region_label}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{event.location}</p>
                                  </div>
                                ) : (
                                  <span className="line-clamp-2">{event.location}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Distância e Tempo de Viagem */}
                          {(event.gig.distance_km != null || event.gig.estimated_travel_time_minutes != null) && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                              {event.gig.distance_km != null && (
                                <div className="flex items-center gap-2">
                                  <Navigation className={`h-4 w-4 ${
                                    event.gig.distance_km <= 7
                                      ? "text-green-600"
                                      : event.gig.distance_km <= 15
                                      ? "text-blue-600"
                                      : "text-orange-600"
                                  }`} />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Distância</p>
                                    <p className="text-sm font-bold text-foreground">
                                      {event.gig.distance_km.toFixed(1)} km
                                    </p>
                                  </div>
                                </div>
                              )}
                              {event.gig.estimated_travel_time_minutes != null && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Tempo</p>
                                    <p className="text-sm font-bold text-foreground">
                                      ~{event.gig.estimated_travel_time_minutes} min
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Contratante */}
                          {event.gig.contractor_name && (
                            <div className="flex items-center gap-2 text-xs text-foreground/60 pt-2 border-t border-border/30">
                              <User className="h-3 w-3" />
                              <span>Por {event.gig.contractor_name}</span>
                            </div>
                          )}

                          {event.instrument && (
                            <div className="pt-2">
                              <Badge variant="secondary" className="text-xs">
                                {event.instrument}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {!isConfirmed && (
                          <div className="pt-2 border-t border-amber-100">
                            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                              Aguardando sua resposta
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {allEventsForCards.length > 8 && (
              <div className="text-center pt-2">
                <p className="text-sm text-foreground/60">
                  E mais {allEventsForCards.length - 8} {allEventsForCards.length - 8 === 1 ? "evento" : "eventos"}...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filtros e controles */}
        <Card className="border border-white/70 bg-white/80">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  placeholder="Buscar por título, local ou instrumento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-white/70 bg-white/80"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por tipo */}
                <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                  <SelectTrigger className="w-[140px] border-white/70 bg-white/80">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>

                {/* Toggle visibilidade */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmed(!showConfirmed)}
                    className={`border-white/70 ${showConfirmed ? "bg-emerald-50" : "bg-white/80"}`}
                  >
                    {showConfirmed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Confirmados</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPending(!showPending)}
                    className={`border-white/70 ${showPending ? "bg-amber-50" : "bg-white/80"}`}
                  >
                    {showPending ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Pendentes</span>
                  </Button>
                </div>

                {/* Visualizações */}
                <div className="flex items-center gap-1 border border-white/70 rounded-lg p-1 bg-white/80">
                  <Button
                    variant={view === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("month")}
                    className="h-8"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("week")}
                    className="h-8"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === "day" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("day")}
                    className="h-8"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === "agenda" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("agenda")}
                    className="h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendário */}
        <Card className="border border-white/70 bg-white/80">
          <CardContent className="p-4">
            <div style={{ height: "700px" }}>
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={currentDate}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                messages={{
                  next: "Próximo",
                  previous: "Anterior",
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia",
                  agenda: "Agenda",
                  date: "Data",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "Nenhum evento neste período.",
                }}
                culture="pt-BR"
                className="rbc-calendar-custom"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dialog de detalhes do evento */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent?.title || "Detalhes do evento"}
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre o show
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      selectedEvent.resource.type === "confirmed"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                    }
                  >
                    {selectedEvent.resource.type === "confirmed" ? "Confirmado" : "Pendente"}
                  </Badge>
                  {selectedEvent.resource.instrument && (
                    <Badge variant="secondary">
                      {selectedEvent.resource.instrument}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(selectedEvent.start, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  {selectedEvent.resource.location && (
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedEvent.resource.location}</span>
                    </div>
                  )}

                  {selectedEvent.resource.type === "confirmed" && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-semibold text-foreground mb-2">Detalhes adicionais:</p>
                      <div className="space-y-1 text-sm text-foreground/70">
                        <p>
                          <span className="font-medium">Duração:</span>{" "}
                          {Math.round(
                            (selectedEvent.end.getTime() - selectedEvent.start.getTime()) / (1000 * 60)
                          )}{" "}
                          minutos
                        </p>
                        {selectedEvent.resource.instrument && (
                          <p>
                            <span className="font-medium">Instrumento:</span>{" "}
                            {selectedEvent.resource.instrument}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.resource.type === "pending" && (
                    <div className="pt-4 border-t space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          Convite Pendente
                        </p>
                        <p className="text-sm text-amber-700">
                          Este convite está aguardando sua resposta. Responda o mais rápido possível!
                        </p>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleAcceptInvite}
                          disabled={processingInviteId === (selectedEvent.resource.gig as PendingInviteRow).invite_id}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {processingInviteId === (selectedEvent.resource.gig as PendingInviteRow).invite_id
                            ? "Processando..."
                            : "Aceitar Convite"}
                        </Button>
                        <Button
                          onClick={handleDeclineInvite}
                          disabled={processingInviteId === (selectedEvent.resource.gig as PendingInviteRow).invite_id}
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="mr-2 h-4 w-4" />
                          {processingInviteId === (selectedEvent.resource.gig as PendingInviteRow).invite_id
                            ? "Processando..."
                            : "Recusar"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedEvent.resource.type === "confirmed" && (
                    <div className="pt-4 border-t">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-emerald-900 mb-1">
                          Show Confirmado
                        </p>
                        <p className="text-sm text-emerald-700">
                          Este show está confirmado. Prepare-se para o evento!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <style jsx global>{`
        .rbc-calendar-custom {
          font-family: inherit;
        }
        .rbc-header {
          padding: 10px 3px;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }
        .rbc-today {
          background-color: #fef3c7;
        }
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        .rbc-event-confirmed {
          background-color: #10b981 !important;
          border-color: #059669 !important;
        }
        .rbc-event-pending {
          background-color: #f59e0b !important;
          border-color: #d97706 !important;
        }
        .rbc-event {
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 4px;
        }
        .rbc-event:hover {
          opacity: 0.8;
        }
        .rbc-toolbar button {
          color: #374151;
          border: 1px solid #d1d5db;
          background: white;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
        }
        .rbc-toolbar button.rbc-active {
          background-color: #ff6b4a;
          color: white;
          border-color: #ff6b4a;
        }
      `}</style>
    </DashboardLayout>
  );
}
