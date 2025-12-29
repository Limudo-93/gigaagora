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
  User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GigDetailsDialog from "@/components/dashboard/GigDetailsDialog";
import ShareGigButton from "@/components/dashboard/ShareGigButton";

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

  // Busca o usuário atual e seu tipo
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user?.id) {
        // Busca o tipo de usuário
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

  // Carrega as gigs compatíveis para músicos
  const loadGigs = useCallback(async () => {
    if (!userId || !userType) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); // Limpa erros anteriores ao recarregar

    try {
      if (userType === "musician") {
        // Busca os instrumentos do músico
        const { data: musicianProfile } = await supabase
          .from("musician_profiles")
          .select("instruments")
          .eq("user_id", userId)
          .single();

        const instruments = (musicianProfile?.instruments as string[]) || [];
        
        if (instruments.length === 0) {
          setGigs([]);
          setFilteredGigs([]);
          setLoading(false);
          return;
        }

        // Busca gigs publicadas que têm roles compatíveis com os instrumentos do músico
        // Primeiro, busca as roles compatíveis
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

        // Depois busca as gigs com informações do contractor
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
            start_time,
            end_time,
            show_minutes,
            break_minutes,
            status,
            flyer_url,
            contractor_id,
            gig_roles(id, instrument)
          `)
          .eq("status", "published")
          .neq("contractor_id", userId) // Não mostrar gigs próprias
          .in("id", compatibleGigIds)
          .order("start_time", { ascending: true });

        if (gigsError) {
          console.error("Error loading gigs:", gigsError);
          setError(`Erro ao carregar gigs: ${gigsError.message}`);
          setGigs([]);
          setLoading(false);
          return;
        }

        // Busca informações dos contractors separadamente
        const contractorIds = [...new Set((gigsData || []).map((g: any) => g.contractor_id))];
        const { data: contractorsData } = await supabase
          .from("profiles")
          .select("user_id, display_name, photo_url")
          .in("user_id", contractorIds);

        const contractorsMap = new Map(
          (contractorsData || []).map((c: any) => [c.user_id, { name: c.display_name, photo: c.photo_url }])
        );

        // Processa os dados e busca invites
        const processedGigs: GigRow[] = [];
        const uniqueGigIds = new Set<string>();

        for (const gig of gigsData || []) {
          if (uniqueGigIds.has(gig.id)) continue;
          uniqueGigIds.add(gig.id);

          // Busca invites para esta gig (busca todos os status, não apenas pending)
          const { data: invitesData, error: inviteError } = await supabase
            .from("invites")
            .select("id, status")
            .eq("gig_id", gig.id)
            .eq("musician_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (inviteError) {
            console.warn(`Error fetching invite for gig ${gig.id}:`, inviteError);
          }

          // Coleta os instrumentos compatíveis
          const compatibleInstruments = (gig.gig_roles || [])
            .map((gr: any) => gr.instrument)
            .filter((inst: string) => instruments.includes(inst));

          const contractorInfo = contractorsMap.get(gig.contractor_id);

          // Debug: verifica o status do invite
          const inviteStatus = invitesData?.status || null;
          if (invitesData) {
            console.log(`Gig ${gig.id}: invite status = ${inviteStatus}`, invitesData);
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
            invite_id: invitesData?.id || null,
            invite_status: inviteStatus,
            compatible_instruments: compatibleInstruments,
          });
        }

        setGigs(processedGigs);
        setFilteredGigs(processedGigs);
      } else {
        // Se for contractor, mostra apenas suas próprias gigs
        const { data, error: gigsError } = await supabase
          .from("gigs")
          .select(
            "id,title,description,location_name,address_text,city,state,start_time,end_time,show_minutes,break_minutes,status,flyer_url,contractor_id"
          )
          .eq("status", "published")
          .eq("contractor_id", userId)
          .order("start_time", { ascending: true });

        if (gigsError) {
          console.error("Error loading gigs:", gigsError);
          setError(`Erro ao carregar gigs: ${gigsError.message}`);
          setGigs([]);
          setLoading(false);
          return;
        }

        const processedGigs: GigRow[] = (data || []).map((gig: any) => ({
          ...gig,
          contractor_name: null,
          contractor_photo_url: null,
          invite_id: null,
          invite_status: null,
          compatible_instruments: [],
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

    // Verifica se o convite já foi respondido antes de tentar aceitar
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

    // Verifica se o convite já foi respondido antes de tentar recusar
    const gig = gigs.find(g => g.id === gigId);
    if (gig && gig.invite_status && gig.invite_status !== 'pending') {
      setError(`Este convite já foi ${gig.invite_status === 'accepted' ? 'aceito' : 'recusado'}.`);
      return;
    }

    if (!confirm("Tem certeza que deseja recusar este convite?")) {
      return;
    }

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

      // Atualiza o status do convite para "declined" em vez de remover
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
    } catch (err: any) {
      console.error("declineInvite exception:", err);
      setError(err?.message ?? "Erro inesperado ao recusar convite.");
      setProcessingInviteId(null);
    }
  };

  const handleDeleteGig = async (gigId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Tem certeza que deseja apagar esta gig? Esta ação não pode ser desfeita.")) {
      return;
    }

    if (!userId) {
      setError("Usuário não identificado.");
      return;
    }

    setDeletingGigId(gigId);
    setError(null);

    try {
      // Verifica se o usuário é o criador da gig antes de deletar
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

      // Deleta a gig
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

      // Remove da lista local
      setGigs((prev) => prev.filter((g) => g.id !== gigId));
      setFilteredGigs((prev) => prev.filter((g) => g.id !== gigId));
      setDeletingGigId(null);
    } catch (err: any) {
      console.error("deleteGig exception:", err);
      setError(err?.message ?? "Erro inesperado ao apagar gig.");
      setDeletingGigId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Gigs Disponíveis
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Explore e encontre oportunidades de trabalho
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/gigs/new" as any>
              <Plus className="mr-2 h-4 w-4" />
              Criar Nova Gig
            </Link>
          </Button>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-white/20 backdrop-blur-xl bg-white/80">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Barra de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, localização, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/30 bg-white/50 backdrop-blur-sm text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 transition-all duration-200"
                />
              </div>

              {/* Filtros por status */}
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Todas
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Futuras
                  </TabsTrigger>
                  <TabsTrigger value="past" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Passadas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens de erro */}
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold">Erro:</p>
                <p className="mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 font-bold text-lg leading-none"
                aria-label="Fechar erro"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Lista de Gigs */}
        {loading ? (
          <div className="rounded-lg border bg-white px-4 py-12 text-center border-gray-200">
            <p className="text-sm text-gray-600">Carregando gigs...</p>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="rounded-lg border bg-white px-4 py-12 text-center border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {searchTerm ? "Nenhuma gig encontrada" : "Nenhuma gig disponível"}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {searchTerm
                ? "Tente ajustar os filtros de busca."
                : "Não há gigs publicadas no momento."}
            </p>
          </div>
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
                  className={`border-white/20 backdrop-blur-xl bg-white/80 cursor-pointer group ${
                    userType === "musician" && gig.invite_status === "declined" 
                      ? "opacity-75" 
                      : ""
                  }`}
                  onClick={() => handleOpenGig(gig.id)}
                >
                  <CardContent className="p-0">
                    {/* Flyer do evento ou logo padrão */}
                    <div className="w-full h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 flex items-center justify-center">
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
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Título */}
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {gig.title || "Gig sem título"}
                      </h3>

                      {/* Publicado por */}
                      {userType === "musician" && gig.contractor_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4 shrink-0 text-gray-500" />
                          <span className="text-gray-700">
                            Publicado por <span className="font-medium">{gig.contractor_name}</span>
                          </span>
                        </div>
                      )}

                      {/* Instrumentos compatíveis */}
                      {userType === "musician" && gig.compatible_instruments.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gig.compatible_instruments.map((instrument, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-900 border border-blue-300">
                              {instrument}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Localização */}
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                        <div className="min-w-0">
                          <p className="font-medium truncate text-gray-700">{location}</p>
                          {cityState && (
                            <p className="text-xs text-gray-500">{cityState}</p>
                          )}
                        </div>
                      </div>

                      {/* Data e Hora */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{date || "Data a definir"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{time || "Horário a definir"}</span>
                        </div>
                      </div>

                      {/* Descrição (preview) */}
                      {gig.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {gig.description}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-900 border border-gray-300">
                          Publicada
                        </Badge>
                        {gig.show_minutes && (
                          <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-900 border border-gray-300">
                            {Math.floor(gig.show_minutes / 60)}h
                          </Badge>
                        )}
                        {userType === "musician" && gig.invite_status === "accepted" && (
                          <Badge variant="secondary" className="text-xs bg-green-500 text-white border border-green-600 font-semibold">
                            ✓ Aceito
                          </Badge>
                        )}
                        {userType === "musician" && gig.invite_status === "declined" && (
                          <Badge variant="secondary" className="text-xs bg-red-500 text-white border border-red-600 font-semibold">
                            ✗ Recusado
                          </Badge>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-col gap-2">
                         <Button
                           variant="outline"
                           className="w-full bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 hover:text-orange-600 hover:border-orange-300 transition-all duration-200"
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
                             {/* Status: Convite já aceito */}
                             {gig.invite_status === "accepted" && (
                               <div className="w-full px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-center">
                                 <div className="flex items-center justify-center gap-2 text-green-700">
                                   <Check className="h-5 w-5" />
                                   <span className="font-semibold text-sm">Convite Aceito</span>
                                 </div>
                                 <p className="text-xs text-green-600 mt-1">
                                   Você confirmou sua participação neste trabalho
                                 </p>
                               </div>
                             )}
                             
                             {/* Status: Convite já recusado */}
                             {gig.invite_status === "declined" && (
                               <div className="w-full px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-center">
                                 <div className="flex items-center justify-center gap-2 text-red-700">
                                   <X className="h-5 w-5" />
                                   <span className="font-semibold text-sm">Convite Recusado</span>
                                 </div>
                                 <p className="text-xs text-red-600 mt-1">
                                   Você recusou este convite
                                 </p>
                               </div>
                             )}
                             
                             {/* Botões de ação: apenas se o convite estiver pendente ou não existir */}
                             {(!gig.invite_status || (gig.invite_status !== "accepted" && gig.invite_status !== "declined")) && (
                               <div className="flex gap-2">
                                 <Button
                                   variant="default"
                                   className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                                   onClick={(e) => handleAcceptInvite(gig.id, gig.invite_id, e)}
                                   disabled={processingInviteId === gig.invite_id || !gig.invite_id}
                                 >
                                   <Check className="mr-2 h-4 w-4" />
                                   Aceitar
                                 </Button>
                                 <Button
                                   variant="outline"
                                   className="flex-1 bg-white/50 backdrop-blur-sm border-red-200/50 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                   onClick={(e) => handleDeclineInvite(gig.id, gig.invite_id, e)}
                                   disabled={processingInviteId === gig.invite_id || !gig.invite_id}
                                 >
                                   <X className="mr-2 h-4 w-4" />
                                   Recusar
                                 </Button>
                               </div>
                             )}
                           </>
                         )}

                         {/* Botões para contractors */}
                         {userType === "contractor" && userId && gig.contractor_id === userId && (
                           <div className="flex gap-2">
                             <ShareGigButton 
                               gigId={gig.id} 
                               gigTitle={gig.title}
                               variant="outline"
                               className="flex-1 bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 hover:text-orange-600 hover:border-orange-300"
                             />
                             <Button
                               variant="outline"
                               size="icon"
                               className="bg-white/50 backdrop-blur-sm border-red-200/50 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200 flex-shrink-0"
                               onClick={(e) => handleDeleteGig(gig.id, e)}
                               disabled={deletingGigId === gig.id}
                             >
                               <Trash2 className="h-4 w-4" />
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
      </div>
    </DashboardLayout>
  );
}

