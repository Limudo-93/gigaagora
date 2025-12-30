"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Star, 
  MapPin, 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Loader2,
  Eye,
  Music,
  Phone,
  Mail,
  DollarSign,
  BookOpen,
  GraduationCap,
  ExternalLink,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Heart,
  HeartOff,
  Flag
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BadgeDisplay from "@/components/dashboard/BadgeDisplay";
import LocationInfo from "@/components/dashboard/LocationInfo";
import ReportDialog from "@/components/dashboard/ReportDialog";

type AcceptedMusician = {
  invite_id: string;
  musician_id: string;
  musician_name: string | null;
  musician_photo_url: string | null;
  instrument: string;
  gig_role_id: string;
  accepted_at: string;
  avg_rating: number | null;
  rating_count: number | null;
  city: string | null;
  state: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  instruments?: string[];
  genres?: string[];
  skills?: string[];
  setup?: string[];
  portfolio_links?: string[];
  attendance_rate?: number | null;
  response_time_seconds_avg?: number | null;
  is_trusted?: boolean;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
    spotify?: string;
    soundcloud?: string;
  };
  sheetMusicReading?: string | null;
  repertoire?: string | null;
  yearsExperience?: number | null;
  musicalEducation?: string | null;
  basePrice?: number | null;
};

// Função para obter iniciais (corrigido para TypeScript)
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDateBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GigMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const gigId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [musicians, setMusicians] = useState<AcceptedMusician[]>([]);
  const [confirmedMusicians, setConfirmedMusicians] = useState<AcceptedMusician[]>([]);
  const [gigTitle, setGigTitle] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedMusician, setSelectedMusician] = useState<AcceptedMusician | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<Record<string, any[]>>({});
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingUserId, setReportingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!gigId) {
      setError("ID da gig não fornecido.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Carregar favoritos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favs } = await supabase
          .from("favorites")
          .select("musician_id")
          .eq("contractor_id", user.id);
        
        if (favs) {
          setFavorites(new Set(favs.map((f: any) => f.musician_id)));
        }
      }
      setLoading(true);
      setError(null);

      try {
        // Busca título da gig
        const { data: gigData, error: gigError } = await supabase
          .from("gigs")
          .select("title")
          .eq("id", gigId)
          .single();

        if (gigError) throw gigError;
        if (gigData) setGigTitle(gigData.title);

        // Busca músicos que aceitaram (mas não confirmados) usando RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "rpc_list_accepted_musicians_for_gig",
          { p_gig_id: gigId }
        );

        console.log('RPC accepted result:', { rpcData, rpcError, gigId });

        // Busca músicos CONFIRMADOS usando nova RPC
        const { data: confirmedRpcData, error: confirmedRpcError } = await supabase.rpc(
          "rpc_list_confirmed_musicians_for_gig",
          { p_gig_id: gigId }
        );

        console.log('RPC confirmed result:', { confirmedRpcData, confirmedRpcError, gigId });

        // Processar músicos aceitos (não confirmados)
        if (rpcError) {
          console.error('RPC error details:', rpcError);
          // Fallback: busca direta
          const { data: directData, error: directError } = await supabase
            .from("invites")
            .select(`
              id,
              musician_id,
              gig_role_id,
              accepted_at,
              gig_roles!inner(
                instrument
              ),
              profiles!invites_musician_id_fkey(
                display_name,
                photo_url,
                city,
                state,
                phone_e164
              ),
              musician_profiles!invites_musician_id_fkey(
                avg_rating,
                rating_count,
                bio,
                instruments,
                genres,
                skills,
                setup,
                portfolio_links,
                attendance_rate,
                response_time_seconds_avg,
                is_trusted
              )
            `)
            .eq("gig_id", gigId)
            .eq("status", "accepted")
            .order("accepted_at", { ascending: false });

          if (directError) throw directError;

          // Filtrar apenas os que NÃO estão confirmados
          const { data: confirmedInvites } = await supabase
            .from("confirmations")
            .select("invite_id")
            .eq("confirmed", true);

          const confirmedInviteIds = new Set((confirmedInvites || []).map((c: any) => c.invite_id));

          const transformed = (directData || [])
            .filter((inv: any) => !confirmedInviteIds.has(inv.id))
            .map((inv: any) => ({
              invite_id: inv.id,
              musician_id: inv.musician_id,
              musician_name: inv.profiles?.display_name || null,
              musician_photo_url: inv.profiles?.photo_url || null,
              instrument: inv.gig_roles?.instrument || "",
              gig_role_id: inv.gig_role_id,
              accepted_at: inv.accepted_at,
              avg_rating: inv.musician_profiles?.avg_rating || null,
              rating_count: inv.musician_profiles?.rating_count || null,
              city: inv.profiles?.city || null,
              state: inv.profiles?.state || null,
              phone: inv.profiles?.phone_e164 || null,
              bio: inv.musician_profiles?.bio || null,
              instruments: inv.musician_profiles?.instruments || [],
              genres: inv.musician_profiles?.genres || [],
              skills: inv.musician_profiles?.skills || [],
              setup: inv.musician_profiles?.setup || [],
              portfolio_links: inv.musician_profiles?.portfolio_links || [],
              attendance_rate: inv.musician_profiles?.attendance_rate || null,
              response_time_seconds_avg: inv.musician_profiles?.response_time_seconds_avg || null,
              is_trusted: inv.musician_profiles?.is_trusted || false,
            }));

          setMusicians(transformed);
        } else {
          // Filtrar apenas os que NÃO estão confirmados
          const { data: confirmedInvites } = await supabase
            .from("confirmations")
            .select("invite_id")
            .eq("confirmed", true);

          const confirmedInviteIds = new Set((confirmedInvites || []).map((c: any) => c.invite_id));
          const acceptedNotConfirmed = (rpcData || []).filter((m: any) => !confirmedInviteIds.has(m.invite_id));
          setMusicians(acceptedNotConfirmed as AcceptedMusician[]);
        }

        // Processar músicos confirmados
        if (confirmedRpcError) {
          console.error('RPC confirmed error details:', confirmedRpcError);
          // Fallback: busca direta
          // Primeiro, buscar os invites da gig
          const { data: gigInvites } = await supabase
            .from("invites")
            .select("id")
            .eq("gig_id", gigId);

          const inviteIds = (gigInvites || []).map((inv: any) => inv.id);

          if (inviteIds.length > 0) {
            const { data: confirmationsData, error: confirmationsError } = await supabase
              .from("confirmations")
              .select(`
                invite_id,
                musician_id,
                confirmed_at,
                invites!inner(
                  id,
                  musician_id,
                  gig_role_id,
                  gig_roles!inner(
                    instrument
                  ),
                  profiles!invites_musician_id_fkey(
                    display_name,
                    photo_url,
                    city,
                    state,
                    phone_e164
                  ),
                  musician_profiles!invites_musician_id_fkey(
                    avg_rating,
                    rating_count,
                    bio,
                    instruments,
                    genres,
                    skills,
                    setup,
                    portfolio_links,
                    attendance_rate,
                    response_time_seconds_avg,
                    is_trusted
                  )
                )
              `)
              .eq("confirmed", true)
              .in("invite_id", inviteIds);

            if (confirmationsError) {
              console.error('Error loading confirmations:', confirmationsError);
              setConfirmedMusicians([]);
            } else {
              const transformed = (confirmationsData || []).map((c: any) => {
                const inv = Array.isArray(c.invites) ? c.invites[0] : c.invites;
                return {
                  invite_id: c.invite_id,
                  musician_id: c.musician_id,
                  musician_name: inv?.profiles?.display_name || null,
                  musician_photo_url: inv?.profiles?.photo_url || null,
                  instrument: inv?.gig_roles?.instrument || "",
                  gig_role_id: inv?.gig_role_id || "",
                  accepted_at: c.confirmed_at, // Usar confirmed_at como accepted_at para exibição
                  avg_rating: inv?.musician_profiles?.avg_rating || null,
                  rating_count: inv?.musician_profiles?.rating_count || null,
                  city: inv?.profiles?.city || null,
                  state: inv?.profiles?.state || null,
                  phone: inv?.profiles?.phone_e164 || null,
                  bio: inv?.musician_profiles?.bio || null,
                  instruments: inv?.musician_profiles?.instruments || [],
                  genres: inv?.musician_profiles?.genres || [],
                  skills: inv?.musician_profiles?.skills || [],
                  setup: inv?.musician_profiles?.setup || [],
                  portfolio_links: inv?.musician_profiles?.portfolio_links || [],
                  attendance_rate: inv?.musician_profiles?.attendance_rate || null,
                  response_time_seconds_avg: inv?.musician_profiles?.response_time_seconds_avg || null,
                  is_trusted: inv?.musician_profiles?.is_trusted || false,
                };
              });
              setConfirmedMusicians(transformed);
            }
          } else {
            setConfirmedMusicians([]);
          }
        } else {
          setConfirmedMusicians((confirmedRpcData || []) as AcceptedMusician[]);
        }

        // Carregar badges para todos os músicos (aceitos + confirmados)
        const allMusicianIds = [
          ...musicians.map((m: any) => m.musician_id),
          ...confirmedMusicians.map((m: any) => m.musician_id)
        ];
        if (allMusicianIds.length > 0) {
          const { data: badgesData } = await supabase
            .from("user_badges")
            .select("user_id, badge_type, earned_at, expires_at")
            .in("user_id", allMusicianIds)
            .or("expires_at.is.null,expires_at.gt.now()");
          
          if (badgesData) {
            const badgesMap: Record<string, any[]> = {};
            badgesData.forEach((badge: any) => {
              if (!badgesMap[badge.user_id]) {
                badgesMap[badge.user_id] = [];
              }
              badgesMap[badge.user_id].push(badge);
            });
            setBadges(badgesMap);
          }
        }
      } catch (e: any) {
        console.error("Error loading matches:", e);
        setError(e?.message ?? "Erro ao carregar músicos que aceitaram.");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Configurar subscription para atualizar em tempo real quando um invite for aceito
    const channel = supabase
      .channel(`gig-matches-${gigId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invites',
          filter: `gig_id=eq.${gigId}`,
        },
        (payload) => {
          // Se o status mudou para 'accepted', recarregar os dados
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;
          
          console.log('Subscription UPDATE recebida:', { 
            oldStatus, 
            newStatus, 
            inviteId: payload.new?.id,
            gigId: payload.new?.gig_id 
          });
          
          if (newStatus === 'accepted' && oldStatus !== 'accepted') {
            console.log('Invite aceito detectado, recarregando lista...', { oldStatus, newStatus });
            // Pequeno delay para garantir que o banco processou a mudança
            setTimeout(() => {
              loadData();
            }, 500);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invites',
          filter: `gig_id=eq.${gigId}`,
        },
        (payload) => {
          // Se um novo invite for criado como accepted, recarregar
          if (payload.new?.status === 'accepted') {
            console.log('Novo invite aceito criado, recarregando lista...');
            setTimeout(() => {
              loadData();
            }, 500);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscription ativa para gig-matches');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Erro na subscription');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gigId]);

  const handleConfirmMusician = async (inviteId: string, musicianId: string) => {
    if (!confirm(`Tem certeza que deseja confirmar este músico para a gig?`)) {
      return;
    }

    setConfirmingId(inviteId);
    setError(null);

    try {
      // Cria ou atualiza a confirmação (UPSERT)
      // Verifica se já existe uma confirmação para este invite
      const { data: existingConfirmation } = await supabase
        .from("confirmations")
        .select("id")
        .eq("invite_id", inviteId)
        .maybeSingle();

      if (existingConfirmation) {
        // Se já existe, atualiza
        const { error: updateConfirmationError } = await supabase
          .from("confirmations")
          .update({
            musician_id: musicianId,
            confirmed: true,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", existingConfirmation.id);

        if (updateConfirmationError) throw updateConfirmationError;
      } else {
        // Se não existe, cria nova
        const { error: confirmError } = await supabase
          .from("confirmations")
          .insert({
            invite_id: inviteId,
            musician_id: musicianId,
            confirmed: true,
            confirmed_at: new Date().toISOString(),
          });

        if (confirmError) throw confirmError;
      }

      // Atualiza o status do invite (tenta 'confirmed', se não existir mantém 'accepted')
      const { error: updateError } = await supabase
        .from("invites")
        .update({ status: "confirmed" })
        .eq("id", inviteId);

      // Se 'confirmed' não existir no enum, mantém como 'accepted'
      if (updateError && updateError.message.includes("invalid input value for enum")) {
        console.log("Status 'confirmed' não disponível no enum, mantendo como 'accepted'");
        // Não precisa fazer nada, a confirmação já foi criada
      } else if (updateError) {
        throw updateError;
      }

      // Cancela outros invites aceitos para a mesma role (se necessário)
      // Isso pode ser ajustado conforme a lógica de negócio
      const currentInvite = musicians.find((m) => m.invite_id === inviteId);
      if (currentInvite) {
        const { error: cancelError } = await supabase
          .from("invites")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("gig_role_id", currentInvite.gig_role_id)
          .eq("status", "accepted")
          .neq("id", inviteId);

        if (cancelError) {
          console.error("Error cancelling other invites:", cancelError);
          // Não falha a operação se isso der erro
        }
      }

      // Buscar dados da gig e do invite para enviar mensagem
      const { data: inviteData } = await supabase
        .from("invites")
        .select(`
          gig_id,
          gigs!inner(
            id,
            title,
            start_time,
            end_time,
            location_name,
            address_text,
            city,
            state
          )
        `)
        .eq("id", inviteId)
        .single();

      // Enviar mensagem automática de parabéns
      if (inviteData && inviteData.gigs) {
        const gig = Array.isArray(inviteData.gigs) ? inviteData.gigs[0] : inviteData.gigs;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Obter ou criar conversa
          const { data: conversationId } = await supabase.rpc("get_or_create_conversation", {
            p_user1_id: user.id,
            p_user2_id: musicianId,
            p_invite_id: inviteId,
            p_gig_id: gig.id,
          });

          if (conversationId) {
            // Formatar data e hora
            const startDate = gig.start_time ? new Date(gig.start_time).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) : "data a definir";
            const startTime = gig.start_time ? new Date(gig.start_time).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }) : "horário a definir";
            
            const location = gig.location_name || gig.address_text || "local a definir";
            const cityState = [gig.city, gig.state].filter(Boolean).join(", ") || "";

            // Criar mensagem de parabéns
            const messageContent = `🎉 Parabéns! Você foi confirmado para a gig "${gig.title || "Show"}"!

📅 Data: ${startDate}
🕐 Horário: ${startTime}
📍 Local: ${location}${cityState ? ` - ${cityState}` : ""}

Se tiver alguma dúvida, use o campo de mensagens para entrar em contato. Estamos à disposição!`;

            // Enviar mensagem
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              sender_id: user.id,
              receiver_id: musicianId,
              content: messageContent,
            });
          }
        }
      }

      // Recarrega os dados para atualizar as listas
      // O músico será movido da lista de aceitos para a lista de confirmados
      const loadData = async () => {
        // Recarregar músicos aceitos e confirmados
        const { data: rpcData } = await supabase.rpc(
          "rpc_list_accepted_musicians_for_gig",
          { p_gig_id: gigId }
        );
        
        const { data: confirmedRpcData } = await supabase.rpc(
          "rpc_list_confirmed_musicians_for_gig",
          { p_gig_id: gigId }
        );

        if (rpcData) {
          const { data: confirmedInvites } = await supabase
            .from("confirmations")
            .select("invite_id")
            .eq("confirmed", true);

          const confirmedInviteIds = new Set((confirmedInvites || []).map((c: any) => c.invite_id));
          const acceptedNotConfirmed = (rpcData || []).filter((m: any) => !confirmedInviteIds.has(m.invite_id));
          setMusicians(acceptedNotConfirmed as AcceptedMusician[]);
        }

        if (confirmedRpcData) {
          setConfirmedMusicians((confirmedRpcData || []) as AcceptedMusician[]);
        }
      };

      await loadData();

      // Mostra mensagem de sucesso
      alert("Músico confirmado com sucesso! Uma mensagem foi enviada automaticamente.");
    } catch (err: any) {
      console.error("Error confirming musician:", err);
      setError(`Erro ao confirmar músico: ${err.message}`);
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <span className="ml-2 text-gray-700">Carregando músicos...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Músicos que Aceitaram
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {gigTitle ? `Gig: ${gigTitle}` : "Selecione um músico para confirmar"}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Erro:</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Seção de Músicos Confirmados */}
        {confirmedMusicians.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Músicos Confirmados</h2>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {confirmedMusicians.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {confirmedMusicians.map((musician) => (
                <Card
                  key={musician.invite_id}
                  className="border-green-200 bg-green-50/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16 ring-2 ring-green-500 shadow-lg flex-shrink-0">
                        <AvatarImage src={musician.musician_photo_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-700 text-white font-semibold text-lg">
                          {getInitials(musician.musician_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {musician.musician_name || "Músico"}
                          </h3>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-900 border border-gray-300">
                            {musician.instrument}
                          </Badge>
                          {musician.avg_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium text-gray-700">
                                {Number(musician.avg_rating).toFixed(1)}
                              </span>
                              {musician.rating_count && musician.rating_count > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({musician.rating_count})
                                </span>
                              )}
                            </div>
                          )}
                          {badges[musician.musician_id] && badges[musician.musician_id].length > 0 && (
                            <BadgeDisplay badges={badges[musician.musician_id]} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4 flex-1">
                      <LocationInfo
                        city={musician.city}
                        state={musician.state}
                        neighborhood={null}
                        municipality={null}
                        showDistance={false}
                      />
                      <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                        <span>Confirmado em {formatDateBR(musician.accepted_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 font-medium"
                        onClick={async () => {
                          setLoadingProfile(true);
                          try {
                            const { data: profileData } = await supabase
                              .from("musician_profiles")
                              .select("*")
                              .eq("user_id", musician.musician_id)
                              .single();
                            
                            const { data: profileBasic } = await supabase
                              .from("profiles")
                              .select("*")
                              .eq("user_id", musician.musician_id)
                              .single();

                            const metadata = (profileData?.strengths_counts as any) || {};
                            
                            setSelectedMusician({
                              ...musician,
                              bio: profileData?.bio || musician.bio || null,
                              instruments: profileData?.instruments || musician.instruments || [],
                              genres: profileData?.genres || musician.genres || [],
                              skills: profileData?.skills || musician.skills || [],
                              setup: profileData?.setup || musician.setup || [],
                              portfolio_links: profileData?.portfolio_links || musician.portfolio_links || [],
                              attendance_rate: profileData?.attendance_rate || musician.attendance_rate || null,
                              response_time_seconds_avg: profileData?.response_time_seconds_avg || musician.response_time_seconds_avg || null,
                              is_trusted: profileData?.is_trusted || musician.is_trusted || false,
                              phone: profileBasic?.phone_e164 || musician.phone || null,
                              email: null,
                              socialMedia: metadata.socialMedia || {},
                              sheetMusicReading: metadata.sheetMusicReading || null,
                              repertoire: metadata.repertoire || null,
                              yearsExperience: metadata.yearsExperience || null,
                              musicalEducation: metadata.musicalEducation || null,
                              basePrice: metadata.basePrice || null,
                            });
                            
                            setProfileDialogOpen(true);
                          } catch (err) {
                            console.error("Error loading profile:", err);
                            setSelectedMusician(musician);
                            setProfileDialogOpen(true);
                          } finally {
                            setLoadingProfile(false);
                          }
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Músicos que Aceitaram (não confirmados) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Músicos que Aceitaram</h2>
            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
              {musicians.length}
            </Badge>
          </div>

        {musicians.length === 0 ? (
          <Card className="border-white/20 backdrop-blur-xl bg-white/80">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum músico aceitou ainda
              </p>
              <p className="text-sm text-gray-600">
                Os convites foram enviados automaticamente para músicos compatíveis.
                Quando alguém aceitar, aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {musicians.map((musician) => (
              <Card
                key={musician.invite_id}
                className="border-white/20 backdrop-blur-xl bg-white/80 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 ring-2 ring-white shadow-lg flex-shrink-0">
                      <AvatarImage src={musician.musician_photo_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white font-semibold text-lg">
                        {getInitials(musician.musician_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {musician.musician_name || "Músico"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-900 border border-gray-300">
                          {musician.instrument}
                        </Badge>
                        {musician.avg_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {Number(musician.avg_rating).toFixed(1)}
                            </span>
                            {musician.rating_count && musician.rating_count > 0 && (
                              <span className="text-xs text-gray-500">
                                ({musician.rating_count})
                              </span>
                            )}
                          </div>
                        )}
                        {badges[musician.musician_id] && badges[musician.musician_id].length > 0 && (
                          <BadgeDisplay badges={badges[musician.musician_id]} size="sm" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <LocationInfo
                      city={musician.city}
                      state={musician.state}
                      neighborhood={null}
                      municipality={null}
                      showDistance={false}
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>Aceitou em {formatDateBR(musician.accepted_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {/* Botão de Favoritar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={favorites.has(musician.musician_id) ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        if (favorites.has(musician.musician_id)) {
                          // Remover dos favoritos
                          await supabase
                            .from("favorites")
                            .delete()
                            .eq("contractor_id", user.id)
                            .eq("musician_id", musician.musician_id);
                          setFavorites((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(musician.musician_id);
                            return newSet;
                          });
                        } else {
                          // Adicionar aos favoritos
                          await supabase
                            .from("favorites")
                            .insert({
                              contractor_id: user.id,
                              musician_id: musician.musician_id,
                            });
                          setFavorites((prev) => new Set([...prev, musician.musician_id]));
                        }
                      }}
                      title={favorites.has(musician.musician_id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      {favorites.has(musician.musician_id) ? (
                        <Heart className="h-4 w-4 fill-current" />
                      ) : (
                        <HeartOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 font-medium"
                      onClick={async () => {
                        setLoadingProfile(true);
                        try {
                          // SEMPRE buscar perfil completo para garantir todas as informações
                          const { data: profileData } = await supabase
                            .from("musician_profiles")
                            .select("*")
                            .eq("user_id", musician.musician_id)
                            .single();
                          
                          const { data: profileBasic } = await supabase
                            .from("profiles")
                            .select("*")
                            .eq("user_id", musician.musician_id)
                            .single();

                          // Email não pode ser buscado diretamente do client, será omitido por segurança

                          // Extrair dados do JSONB strengths_counts
                          const metadata = (profileData?.strengths_counts as any) || {};
                          
                          setSelectedMusician({
                            ...musician,
                            bio: profileData?.bio || musician.bio || null,
                            instruments: profileData?.instruments || musician.instruments || [],
                            genres: profileData?.genres || musician.genres || [],
                            skills: profileData?.skills || musician.skills || [],
                            setup: profileData?.setup || musician.setup || [],
                            portfolio_links: profileData?.portfolio_links || musician.portfolio_links || [],
                            attendance_rate: profileData?.attendance_rate || musician.attendance_rate || null,
                            response_time_seconds_avg: profileData?.response_time_seconds_avg || musician.response_time_seconds_avg || null,
                            is_trusted: profileData?.is_trusted || musician.is_trusted || false,
                            phone: profileBasic?.phone_e164 || musician.phone || null,
                            email: null, // Email não disponível por segurança
                            socialMedia: metadata.socialMedia || {},
                            sheetMusicReading: metadata.sheetMusicReading || null,
                            repertoire: metadata.repertoire || null,
                            yearsExperience: metadata.yearsExperience || null,
                            musicalEducation: metadata.musicalEducation || null,
                            basePrice: metadata.basePrice || null,
                          });
                          
                          setProfileDialogOpen(true);
                        } catch (err) {
                          console.error("Error loading profile:", err);
                          setSelectedMusician(musician);
                          setProfileDialogOpen(true);
                        } finally {
                          setLoadingProfile(false);
                        }
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Perfil
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => handleConfirmMusician(musician.invite_id, musician.musician_id)}
                      disabled={confirmingId === musician.invite_id}
                    >
                      {confirmingId === musician.invite_id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Perfil Completo */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Perfil do Músico
              </DialogTitle>
            </DialogHeader>

            {loadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                <span className="ml-2 text-gray-700">Carregando perfil...</span>
              </div>
            ) : selectedMusician ? (
              <div className="space-y-6">
                {/* Header do Perfil */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                  <Avatar className="h-20 w-20 ring-2 ring-orange-500 shadow-lg">
                    <AvatarImage src={selectedMusician.musician_photo_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 text-white font-semibold text-xl">
                      {getInitials(selectedMusician.musician_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedMusician.musician_name || "Músico"}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="bg-gray-200 text-gray-900 border border-gray-300">
                        {selectedMusician.instrument}
                      </Badge>
                      {selectedMusician.avg_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {Number(selectedMusician.avg_rating).toFixed(1)}
                          </span>
                          {selectedMusician.rating_count && selectedMusician.rating_count > 0 && (
                            <span className="text-sm text-gray-500">
                              ({selectedMusician.rating_count} avaliações)
                            </span>
                          )}
                        </div>
                      )}
                      {selectedMusician.is_trusted && (
                        <Badge className="bg-green-500 text-white">✓ Confiável</Badge>
                      )}
                      {badges[selectedMusician.musician_id] && badges[selectedMusician.musician_id].length > 0 && (
                        <BadgeDisplay badges={badges[selectedMusician.musician_id]} size="md" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedMusician.city || selectedMusician.state) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>{[selectedMusician.city, selectedMusician.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {selectedMusician.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <a href={`tel:${selectedMusician.phone}`} className="hover:text-orange-600">
                        {selectedMusician.phone}
                      </a>
                    </div>
                  )}
                  {selectedMusician.attendance_rate && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Taxa de presença: {(Number(selectedMusician.attendance_rate) * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {selectedMusician.response_time_seconds_avg && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>Tempo médio de resposta: {Math.floor(Number(selectedMusician.response_time_seconds_avg) / 3600)}h</span>
                    </div>
                  )}
                  {selectedMusician.yearsExperience && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>{selectedMusician.yearsExperience} {selectedMusician.yearsExperience === 1 ? "ano" : "anos"} de experiência</span>
                    </div>
                  )}
                  {selectedMusician.basePrice && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>Preço base: R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(selectedMusician.basePrice)}</span>
                    </div>
                  )}
                </div>

                {/* Biografia */}
                {selectedMusician.bio && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Biografia</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMusician.bio}</p>
                  </div>
                )}

                {/* Instrumentos */}
                {selectedMusician.instruments && selectedMusician.instruments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Instrumentos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMusician.instruments.map((instrument, idx) => (
                        <Badge key={idx} variant="outline" className="border-gray-300 text-gray-900 bg-gray-50">
                          {instrument}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gêneros */}
                {selectedMusician.genres && selectedMusician.genres.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Gêneros Musicais</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMusician.genres.map((genre, idx) => (
                        <Badge key={idx} variant="outline" className="border-purple-300 text-purple-900 bg-purple-50">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedMusician.skills && selectedMusician.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Habilidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMusician.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="border-blue-300 text-blue-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Setup */}
                {selectedMusician.setup && selectedMusician.setup.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Setup</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMusician.setup.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="border-orange-300 text-orange-700">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leitura de Partitura */}
                {selectedMusician.sheetMusicReading && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Leitura de Partitura
                    </h4>
                    <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                      {selectedMusician.sheetMusicReading === "none" ? "Não leio" :
                       selectedMusician.sheetMusicReading === "basic" ? "Básico" :
                       selectedMusician.sheetMusicReading === "intermediate" ? "Intermediário" :
                       selectedMusician.sheetMusicReading === "advanced" ? "Avançado" :
                       selectedMusician.sheetMusicReading}
                    </Badge>
                  </div>
                )}

                {/* Repertório */}
                {selectedMusician.repertoire && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Repertório</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedMusician.repertoire}
                    </p>
                  </div>
                )}

                {/* Educação Musical */}
                {selectedMusician.musicalEducation && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educação Musical
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedMusician.musicalEducation}
                    </p>
                  </div>
                )}

                {/* Redes Sociais */}
                {selectedMusician.socialMedia && Object.values(selectedMusician.socialMedia).some(v => v) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Redes Sociais</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedMusician.socialMedia.instagram && (
                        <a
                          href={selectedMusician.socialMedia.instagram.startsWith("http") ? selectedMusician.socialMedia.instagram : `https://instagram.com/${selectedMusician.socialMedia.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-800"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.facebook && (
                        <a
                          href={selectedMusician.socialMedia.facebook.startsWith("http") ? selectedMusician.socialMedia.facebook : `https://facebook.com/${selectedMusician.socialMedia.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.youtube && (
                        <a
                          href={selectedMusician.socialMedia.youtube.startsWith("http") ? selectedMusician.socialMedia.youtube : `https://youtube.com/${selectedMusician.socialMedia.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
                        >
                          <Youtube className="h-4 w-4" />
                          YouTube
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.tiktok && (
                        <a
                          href={selectedMusician.socialMedia.tiktok.startsWith("http") ? selectedMusician.socialMedia.tiktok : `https://tiktok.com/@${selectedMusician.socialMedia.tiktok.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700"
                        >
                          <span className="text-xs font-bold">TikTok</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.twitter && (
                        <a
                          href={selectedMusician.socialMedia.twitter.startsWith("http") ? selectedMusician.socialMedia.twitter : `https://twitter.com/${selectedMusician.socialMedia.twitter.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-600"
                        >
                          <Twitter className="h-4 w-4" />
                          Twitter/X
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.linkedin && (
                        <a
                          href={selectedMusician.socialMedia.linkedin.startsWith("http") ? selectedMusician.socialMedia.linkedin : `https://linkedin.com/in/${selectedMusician.socialMedia.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.spotify && (
                        <a
                          href={selectedMusician.socialMedia.spotify.startsWith("http") ? selectedMusician.socialMedia.spotify : `https://open.spotify.com/artist/${selectedMusician.socialMedia.spotify}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800"
                        >
                          <span className="text-xs font-bold">Spotify</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {selectedMusician.socialMedia.soundcloud && (
                        <a
                          href={selectedMusician.socialMedia.soundcloud.startsWith("http") ? selectedMusician.socialMedia.soundcloud : `https://soundcloud.com/${selectedMusician.socialMedia.soundcloud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800"
                        >
                          <span className="text-xs font-bold">SoundCloud</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Portfolio Links */}
                {selectedMusician.portfolio_links && selectedMusician.portfolio_links.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Portfólio</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMusician.portfolio_links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          {link}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setProfileDialogOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      setReportingUserId(selectedMusician.musician_id);
                      setReportDialogOpen(true);
                    }}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Denunciar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                    onClick={() => {
                      setProfileDialogOpen(false);
                      handleConfirmMusician(selectedMusician.invite_id, selectedMusician.musician_id);
                    }}
                    disabled={confirmingId === selectedMusician.invite_id}
                  >
                    {confirmingId === selectedMusician.invite_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar Músico
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

